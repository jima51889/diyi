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
    @State private var signedPDFURL: URL?
    @State private var isCreatingSignedPDF = false

    var body: some View {
        List {
            if let pdfURL = documentStore.pdfURL(for: document) {
                Section {
                    NavigationLink {
                        PDFPreviewView(url: pdfURL)
                            .navigationTitle(document.title)
                            .navigationBarTitleDisplayMode(.inline)
                    } label: {
                        Label("Preview PDF", systemImage: "doc.richtext")
                    }

                    ShareLink(item: pdfURL) {
                        Label("Share PDF", systemImage: "square.and.arrow.up")
                    }
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

            Section("Optimize") {
                Button {
                    createCompressedPDF()
                } label: {
                    if isCompressing {
                        HStack {
                            ProgressView()
                            Text("Compressing PDF")
                        }
                    } else {
                        Label("Create Compressed PDF", systemImage: "arrow.down.doc")
                    }
                }
                .disabled(isCompressing)

                if let compressedPDFURL {
                    ShareLink(item: compressedPDFURL) {
                        Label("Share Compressed PDF", systemImage: "square.and.arrow.up")
                    }
                }
            }

            Section("Signature") {
                Button {
                    isSignatureCapturePresented = true
                } label: {
                    if isCreatingSignedPDF {
                        HStack {
                            ProgressView()
                            Text("Creating Signed PDF")
                        }
                    } else {
                        Label("Add Signature", systemImage: "signature")
                    }
                }
                .disabled(isCreatingSignedPDF)

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
                createSignedPDF(signature: signature)
            }
        }
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

    private func createSignedPDF(signature: UIImage) {
        isCreatingSignedPDF = true

        Task {
            signedPDFURL = await documentStore.createSignedPDF(for: document, signature: signature)
            isCreatingSignedPDF = false
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
