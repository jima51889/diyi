import Foundation

struct ScannedDocument: Identifiable, Codable, Hashable {
    let id: UUID
    var title: String
    var createdAt: Date
    var updatedAt: Date
    var kind: DocumentKind
    var pageImagePaths: [String]
    var pdfPath: String?
    var receiptInfo: ReceiptInfo?

    enum CodingKeys: String, CodingKey {
        case id
        case title
        case createdAt
        case updatedAt
        case kind
        case pageImagePaths
        case pdfPath
        case receiptInfo
    }

    init(
        id: UUID = UUID(),
        title: String,
        createdAt: Date = Date(),
        updatedAt: Date = Date(),
        kind: DocumentKind = .document,
        pageImagePaths: [String],
        pdfPath: String? = nil,
        receiptInfo: ReceiptInfo? = nil
    ) {
        self.id = id
        self.title = title
        self.createdAt = createdAt
        self.updatedAt = updatedAt
        self.kind = kind
        self.pageImagePaths = pageImagePaths
        self.pdfPath = pdfPath
        self.receiptInfo = receiptInfo
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(UUID.self, forKey: .id)
        title = try container.decode(String.self, forKey: .title)
        createdAt = try container.decode(Date.self, forKey: .createdAt)
        updatedAt = try container.decode(Date.self, forKey: .updatedAt)
        kind = try container.decodeIfPresent(DocumentKind.self, forKey: .kind) ?? .document
        pageImagePaths = try container.decode([String].self, forKey: .pageImagePaths)
        pdfPath = try container.decodeIfPresent(String.self, forKey: .pdfPath)
        receiptInfo = try container.decodeIfPresent(ReceiptInfo.self, forKey: .receiptInfo)
    }
}

enum DocumentKind: String, Codable, CaseIterable, Hashable, Identifiable {
    case document
    case receipt

    var id: String { rawValue }

    var label: String {
        switch self {
        case .document:
            return "Document"
        case .receipt:
            return "Receipt"
        }
    }

    var systemImage: String {
        switch self {
        case .document:
            return "doc.text.viewfinder"
        case .receipt:
            return "receipt"
        }
    }
}

struct ReceiptInfo: Codable, Hashable {
    var merchant: String?
    var dateText: String?
    var totalText: String?
    var category: String
    var rawText: String
}
