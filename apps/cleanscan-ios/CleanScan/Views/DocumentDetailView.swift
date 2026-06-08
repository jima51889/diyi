import SwiftUI
import UIKit

struct DocumentDetailView: View {
    @EnvironmentObject private var documentStore: DocumentStore
    @Environment(\.dismiss) private var dismiss

    let document: ScannedDocument

    @State private var title: String = ""
    @State private var isRenaming = false
    @State private var compressedPDFURL: URL?
    @State private var isCompressing = false
    @State private var recognizedText: String?
    @State private var isRecognizingText = false
    @State private var isSignatureCapturePresented = false
    @State private var isSignaturePlacementPresented = false
    @State private var pendingSignature: UIImage?
    @State private var signedPDFURL: URL?
    @State private var isSignedPDFPreviewPresented = false
    @State private var isCreatingSignedPDF = false

    var body: some View {
        List {
            if let pdfURL = documentStore.pdfURL(for: document) {
                Section("Next Step") {
                    LazyVGrid(columns: actionColumns, spacing: 12) {
                        NavigationLink {
                            PDFPreviewView(url: pdfURL)
                                .navigationTitle(document.title)
                                .navigationBarTitleDisplayMode(.inline)
                        } label: {
                            ActionTile(title: "Preview", systemImage: "doc.richtext", color: .blue)
                        }
                        .buttonStyle(.plain)

                        ShareLink(item: pdfURL) {
                            ActionTile(title: "Share", systemImage: "square.and.arrow.up", color: .green)
                        }
                        .buttonStyle(.plain)

                        Button {
                            isSignatureCapturePresented = true
                        } label: {
                            ActionTile(title: "Sign", systemImage: "signature", color: .purple)
                        }
                        .buttonStyle(.plain)
                        .disabled(isCreatingSignedPDF)

                        Button {
                            createCompressedPDF()
                        } label: {
                            ActionTile(title: "Compress", systemImage: "arrow.down.doc", color: .orange)
                        }
                        .buttonStyle(.plain)
                        .disabled(isCompressing)
                    }
                    .padding(.vertical, 4)
                }
            }

            if document.kind == .receipt {
                Section("Receipt") {
                    ReceiptField(label: "Merchant", value: document.receiptInfo?.merchant ?? "Not detected")
                    ReceiptField(label: "Date", value: document.receiptInfo?.dateText ?? "Not detected")
                    ReceiptField(label: "Total", value: document.receiptInfo?.totalText ?? "Not detected")
                    ReceiptField(label: "Category", value: document.receiptInfo?.category ?? "Uncategorized")

                    if let rawText = document.receiptInfo?.rawText, !rawText.isEmpty {
                        NavigationLink {
                            RecognizedTextView(text: rawText, title: document.title)
                        } label: {
                            Label("View Receipt OCR Text", systemImage: "doc.text.magnifyingglass")
                        }
                    }
                }
            }

            Section("Output") {
                if isCompressing {
                    HStack {
                        ProgressView()
                        Text("Compressing PDF")
                    }
                }

                if let compressedPDFURL {
                    ShareLink(item: compressedPDFURL) {
                        Label("Share Compressed PDF", systemImage: "square.and.arrow.up")
                    }
                }

                if isCreatingSignedPDF {
                    HStack {
                        ProgressView()
                        Text("Creating Signed PDF")
                    }
                }

                if let signedPDFURL {
                    ShareLink(item: signedPDFURL) {
                        Label("Share Signed PDF", systemImage: "square.and.arrow.up")
                    }
                }
            }

            Section("Text Recognition") {
                Button {
                    recognizeText()
                } label: {
                    if isRecognizingText {
                        HStack {
                            ProgressView()
                            Text("Recognizing Text")
                        }
                    } else {
                        Label("Recognize Text", systemImage: "text.viewfinder")
                    }
                }
                .disabled(isRecognizingText)

                if let recognizedText, !recognizedText.isEmpty {
                    NavigationLink {
                        RecognizedTextView(text: recognizedText, title: document.title)
                    } label: {
                        Label("View Recognized Text", systemImage: "doc.text.magnifyingglass")
                    }
                }
            }

            Section("Pages") {
                let imageURLs = documentStore.imageURLs(for: document)
                ForEach(Array(imageURLs.enumerated()), id: \.offset) { index, url in
                    HStack(spacing: 12) {
                        PageThumbnail(url: url)
                        Text("Page \(index + 1)")
                        Spacer()
                    }
                    .frame(minHeight: 72)
                }
            }

            Section {
                Button(role: .destructive) {
                    Task {
                        await documentStore.delete(document)
                        dismiss()
                    }
                } label: {
                    Label("Delete Document", systemImage: "trash")
                }
            }
        }
        .navigationTitle(document.title)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button("Rename") {
                    title = document.title
                    isRenaming = true
                }
            }
        }
        .alert("Rename Document", isPresented: $isRenaming) {
            TextField("Document name", text: $title)
            Button("Cancel", role: .cancel) {}
            Button("Save") {
                Task { await documentStore.rename(document, to: title) }
            }
        }
        .sheet(isPresented: $isSignatureCapturePresented) {
            SignatureCaptureView { signature in
                pendingSignature = signature

                DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) {
                    isSignaturePlacementPresented = true
                }
            }
        }
        .fullScreenCover(isPresented: $isSignaturePlacementPresented) {
            if let pendingSignature, let lastPageURL = documentStore.imageURLs(for: document).last,
               let pageImage = UIImage(contentsOfFile: lastPageURL.path) {
                SignaturePlacementView(pageImage: pageImage, signature: pendingSignature) { placement in
                    createSignedPDF(signature: pendingSignature, placement: placement)
                }
            } else {
                NavigationStack {
                    ContentUnavailableView(
                        "Page unavailable",
                        systemImage: "doc.badge.exclamationmark",
                        description: Text("The page image could not be loaded for signing.")
                    )
                    .toolbar {
                        ToolbarItem(placement: .topBarLeading) {
                            Button("Done") {
                                isSignaturePlacementPresented = false
                            }
                        }
                    }
                }
            }
        }
        .sheet(isPresented: $isSignedPDFPreviewPresented) {
            if let signedPDFURL {
                NavigationStack {
                    PDFPreviewView(url: signedPDFURL)
                        .navigationTitle("Signed PDF")
                        .navigationBarTitleDisplayMode(.inline)
                        .toolbar {
                            ToolbarItem(placement: .topBarLeading) {
                                Button("Done") {
                                    isSignedPDFPreviewPresented = false
                                }
                            }

                            ToolbarItem(placement: .topBarTrailing) {
                                ShareLink(item: signedPDFURL) {
                                    Label("Share", systemImage: "square.and.arrow.up")
                                }
                            }
                        }
                }
            }
        }
    }

    private var actionColumns: [GridItem] {
        [
            GridItem(.flexible(), spacing: 12),
            GridItem(.flexible(), spacing: 12)
        ]
    }

    private func createCompressedPDF() {
        isCompressing = true

        Task {
            compressedPDFURL = await documentStore.createCompressedPDF(for: document)
            isCompressing = false
        }
    }

    private func recognizeText() {
        isRecognizingText = true

        Task {
            recognizedText = await documentStore.recognizeText(for: document)
            isRecognizingText = false
        }
    }

    private func createSignedPDF(signature: UIImage, placement: SignaturePlacement) {
        isCreatingSignedPDF = true

        Task {
            let url = await documentStore.createSignedPDF(for: document, signature: signature, placement: placement)
            signedPDFURL = url
            pendingSignature = nil
            isCreatingSignedPDF = false

            if url != nil {
                isSignedPDFPreviewPresented = true
            }
        }
    }
}

private struct ActionTile: View {
    let title: String
    let systemImage: String
    let color: Color

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: systemImage)
                .font(.title2.weight(.semibold))
                .foregroundStyle(color)
            Text(title)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.primary)
        }
        .frame(maxWidth: .infinity, minHeight: 84)
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .overlay {
            RoundedRectangle(cornerRadius: 8)
                .stroke(.quaternary)
        }
    }
}

private struct PageThumbnail: View {
    let url: URL

    var body: some View {
        if let image = UIImage(contentsOfFile: url.path) {
            Image(uiImage: image)
                .resizable()
                .scaledToFill()
                .frame(width: 54, height: 72)
                .clipShape(RoundedRectangle(cornerRadius: 6))
                .overlay {
                    RoundedRectangle(cornerRadius: 6)
                        .stroke(.quaternary)
                }
        } else {
            RoundedRectangle(cornerRadius: 6)
                .fill(.quaternary)
                .frame(width: 54, height: 72)
        }
    }
}

private struct ReceiptField: View {
    let label: String
    let value: String

    var body: some View {
        HStack {
            Text(label)
            Spacer()
            Text(value)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.trailing)
        }
    }
}

private struct RecognizedTextView: View {
    let text: String
    let title: String

    var body: some View {
        ScrollView {
            Text(text)
                .font(.body.monospaced())
                .textSelection(.enabled)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding()
        }
        .navigationTitle("Recognized Text")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ShareLink(item: text) {
                Label("Share Text", systemImage: "square.and.arrow.up")
            }
        }
    }
}
