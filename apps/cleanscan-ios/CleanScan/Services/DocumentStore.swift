import Foundation
import UIKit

@MainActor
final class DocumentStore: ObservableObject {
    @Published private(set) var documents: [ScannedDocument] = []
    @Published var lastErrorMessage: String?

    private let fileManager: FileManager
    private let pdfExportService: PDFExportService
    private let ocrService: OCRService
    private let signatureService: SignatureService
    private let receiptParser: ReceiptParser
    private let receiptCSVExporter: ReceiptCSVExporter

    init(
        fileManager: FileManager = .default,
        pdfExportService: PDFExportService = PDFExportService(),
        ocrService: OCRService = OCRService(),
        signatureService: SignatureService = SignatureService(),
        receiptParser: ReceiptParser = ReceiptParser(),
        receiptCSVExporter: ReceiptCSVExporter = ReceiptCSVExporter()
    ) {
        self.fileManager = fileManager
        self.pdfExportService = pdfExportService
        self.ocrService = ocrService
        self.signatureService = signatureService
        self.receiptParser = receiptParser
        self.receiptCSVExporter = receiptCSVExporter
    }

    func load() async {
        do {
            try ensureStorageDirectories()
            let data = try Data(contentsOf: indexURL)
            documents = try JSONDecoder.cleanScan.decode([ScannedDocument].self, from: data)
                .sorted { $0.updatedAt > $1.updatedAt }
        } catch let error as CocoaError where error.code == .fileReadNoSuchFile {
            documents = []
        } catch {
            lastErrorMessage = error.localizedDescription
            documents = []
        }
    }

    func saveScannedDocument(images: [UIImage], kind: DocumentKind = .document, title: String? = nil) async -> ScannedDocument? {
        guard !images.isEmpty else { return nil }

        do {
            try ensureStorageDirectories()

            let now = Date()
            let id = UUID()
            let documentDirectory = documentsDirectory.appendingPathComponent(id.uuidString, isDirectory: true)
            try fileManager.createDirectory(at: documentDirectory, withIntermediateDirectories: true, attributes: nil)

            let imagePaths = try images.enumerated().map { index, image in
                let imageURL = documentDirectory.appendingPathComponent("page-\(index + 1).jpg")
                guard let data = image.jpegData(compressionQuality: 0.92) else {
                    throw DocumentStoreError.imageEncodingFailed
                }
                try data.write(to: imageURL, options: [.atomic])
                return imageURL.path
            }

            let pdfURL = documentDirectory.appendingPathComponent("document.pdf")
            try pdfExportService.exportPDF(
                from: imagePaths.map(URL.init(fileURLWithPath:)),
                to: pdfURL,
                options: .standard
            )

            let receiptInfo = try await receiptInfoIfNeeded(kind: kind, imagePaths: imagePaths)
            let documentTitle = normalizedTitle(title) ?? defaultTitle(kind: kind, date: now, receiptInfo: receiptInfo)

            let document = ScannedDocument(
                id: id,
                title: documentTitle,
                createdAt: now,
                updatedAt: now,
                kind: kind,
                pageImagePaths: imagePaths,
                pdfPath: pdfURL.path,
                receiptInfo: receiptInfo
            )

            documents.insert(document, at: 0)
            try persistIndex()
            return document
        } catch {
            lastErrorMessage = error.localizedDescription
            return nil
        }
    }

    func rename(_ document: ScannedDocument, to title: String) async {
        let trimmedTitle = title.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedTitle.isEmpty else { return }
        guard let index = documents.firstIndex(where: { $0.id == document.id }) else { return }

        documents[index].title = trimmedTitle
        documents[index].updatedAt = Date()
        documents.sort { $0.updatedAt > $1.updatedAt }

        do {
            try persistIndex()
        } catch {
            lastErrorMessage = error.localizedDescription
        }
    }

    func delete(_ document: ScannedDocument) async {
        documents.removeAll { $0.id == document.id }

        do {
            let documentDirectory = documentsDirectory.appendingPathComponent(document.id.uuidString, isDirectory: true)
            if fileManager.fileExists(atPath: documentDirectory.path) {
                try fileManager.removeItem(at: documentDirectory)
            }
            try persistIndex()
        } catch {
            lastErrorMessage = error.localizedDescription
        }
    }

    func pdfURL(for document: ScannedDocument) -> URL? {
        guard let pdfPath = document.pdfPath else { return nil }
        let url = URL(fileURLWithPath: pdfPath)
        return fileManager.fileExists(atPath: url.path) ? url : nil
    }

    func imageURLs(for document: ScannedDocument) -> [URL] {
        document.pageImagePaths
            .map(URL.init(fileURLWithPath:))
            .filter { fileManager.fileExists(atPath: $0.path) }
    }

    func createCompressedPDF(for document: ScannedDocument) async -> URL? {
        do {
            let imageURLs = imageURLs(for: document)
            guard !imageURLs.isEmpty else {
                throw PDFExportError.noImages
            }

            let documentDirectory = documentsDirectory.appendingPathComponent(document.id.uuidString, isDirectory: true)
            let compressedURL = documentDirectory.appendingPathComponent("document-compressed.pdf")

            try pdfExportService.exportPDF(
                from: imageURLs,
                to: compressedURL,
                options: .compressed
            )

            return compressedURL
        } catch {
            lastErrorMessage = error.localizedDescription
            return nil
        }
    }

    func recognizeText(for document: ScannedDocument) async -> String? {
        do {
            let imageURLs = imageURLs(for: document)
            guard !imageURLs.isEmpty else {
                throw PDFExportError.noImages
            }

            return try await ocrService.recognizeText(from: imageURLs)
        } catch {
            lastErrorMessage = error.localizedDescription
            return nil
        }
    }

    func createSignedPDF(for document: ScannedDocument, signature: UIImage) async -> URL? {
        do {
            let imageURLs = imageURLs(for: document)
            let documentDirectory = documentsDirectory.appendingPathComponent(document.id.uuidString, isDirectory: true)
            let signedURL = documentDirectory.appendingPathComponent("document-signed.pdf")

            try signatureService.exportSignedPDF(
                imageURLs: imageURLs,
                signature: signature,
                destinationURL: signedURL
            )

            return signedURL
        } catch {
            lastErrorMessage = error.localizedDescription
            return nil
        }
    }

    func exportReceiptsCSV() async -> URL? {
        do {
            let exportURL = appSupportDirectory.appendingPathComponent("receipts.csv")
            try receiptCSVExporter.export(documents: documents, to: exportURL)
            return exportURL
        } catch {
            lastErrorMessage = error.localizedDescription
            return nil
        }
    }

    private func receiptInfoIfNeeded(kind: DocumentKind, imagePaths: [String]) async throws -> ReceiptInfo? {
        guard kind == .receipt else { return nil }

        let text = try await ocrService.recognizeText(
            from: imagePaths.map(URL.init(fileURLWithPath:))
        )
        return receiptParser.parse(text: text)
    }

    private func defaultTitle(kind: DocumentKind, date: Date, receiptInfo: ReceiptInfo?) -> String {
        let dateText = Self.titleFormatter.string(from: date)

        switch kind {
        case .document:
            return "Scan \(dateText)"
        case .receipt:
            if let merchant = receiptInfo?.merchant, !merchant.isEmpty {
                return "\(merchant) Receipt"
            }
            return "Receipt \(dateText)"
        }
    }

    private func normalizedTitle(_ title: String?) -> String? {
        guard let title else { return nil }
        let trimmedTitle = title.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmedTitle.isEmpty ? nil : trimmedTitle
    }

    private func persistIndex() throws {
        try ensureStorageDirectories()
        let data = try JSONEncoder.cleanScan.encode(documents)
        try data.write(to: indexURL, options: [.atomic])
    }

    private func ensureStorageDirectories() throws {
        try fileManager.createDirectory(at: appSupportDirectory, withIntermediateDirectories: true, attributes: nil)
        try fileManager.createDirectory(at: documentsDirectory, withIntermediateDirectories: true, attributes: nil)
    }

    private var appSupportDirectory: URL {
        let baseURL = fileManager.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        return baseURL.appendingPathComponent("CleanScan", isDirectory: true)
    }

    private var documentsDirectory: URL {
        appSupportDirectory.appendingPathComponent("Documents", isDirectory: true)
    }

    private var indexURL: URL {
        appSupportDirectory.appendingPathComponent("documents.json")
    }

    private static let titleFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd HH.mm"
        return formatter
    }()
}

enum DocumentStoreError: LocalizedError {
    case imageEncodingFailed

    var errorDescription: String? {
        switch self {
        case .imageEncodingFailed:
            return "One of the scanned pages could not be saved."
        }
    }
}

private extension JSONEncoder {
    static var cleanScan: JSONEncoder {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        return encoder
    }
}

private extension JSONDecoder {
    static var cleanScan: JSONDecoder {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return decoder
    }
}
