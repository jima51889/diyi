import SwiftUI
import UIKit
import VisionKit

struct HomeView: View {
    @EnvironmentObject private var documentStore: DocumentStore
    @State private var navigationPath: [ScannedDocument] = []
    @State private var isScannerPresented = false
    @State private var isPhotoCapturePresented = false
    @State private var isSettingsPresented = false
    @State private var isScanEditorPresented = false
    @State private var pendingScanImages: [UIImage] = []
    @State private var selectedKind: DocumentKind = .document
    @State private var receiptsCSVURL: URL?
    @State private var isReceiptsCSVPresented = false

    var body: some View {
        NavigationStack(path: $navigationPath) {
            Group {
                if documentStore.documents.isEmpty {
                    VStack(spacing: 18) {
                        modePicker
                        ContentUnavailableView(
                            "Scan your first document",
                            systemImage: "doc.viewfinder",
                            description: Text("Create clean PDFs from paper documents, notes, receipts, and IDs.")
                        )
                    }
                    .padding(.horizontal)
                } else {
                    List {
                        Section {
                            modePicker
                                .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                        }

                        ForEach(documentStore.documents) { document in
                            NavigationLink(value: document) {
                                DocumentRow(document: document)
                            }
                        }
                        .onDelete { offsets in
                            for index in offsets {
                                let document = documentStore.documents[index]
                                Task { await documentStore.delete(document) }
                            }
                        }
                    }
                    .listStyle(.plain)
                }
            }
            .navigationTitle("CleanScan")
            .navigationDestination(for: ScannedDocument.self) { document in
                DocumentDetailView(document: document)
            }
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Menu {
                        Button {
                            isSettingsPresented = true
                        } label: {
                            Label("Settings", systemImage: "gearshape")
                        }

                        Button {
                            Task {
                                receiptsCSVURL = await documentStore.exportReceiptsCSV()
                                isReceiptsCSVPresented = receiptsCSVURL != nil
                            }
                        } label: {
                            Label("Export Receipts CSV", systemImage: "tablecells")
                        }
                        .disabled(!documentStore.documents.contains { $0.kind == .receipt })
                    } label: {
                        Label("More", systemImage: "ellipsis.circle")
                    }
                }

                ToolbarItem(placement: .topBarTrailing) {
                    Menu {
                        Button {
                            startScanning()
                        } label: {
                            Label("Scan Document", systemImage: "doc.viewfinder")
                        }

                        Button {
                            startPhotoCapture()
                        } label: {
                            Label("Take Photo", systemImage: "camera")
                        }
                    } label: {
                        Label("Add", systemImage: "plus.circle")
                    }
                }
            }
            .safeAreaInset(edge: .bottom) {
                Menu {
                    Button {
                        startScanning()
                    } label: {
                        Label("Scan Document", systemImage: "doc.viewfinder")
                    }

                    Button {
                        startPhotoCapture()
                    } label: {
                        Label("Take Photo", systemImage: "camera")
                    }
                } label: {
                    Label("Add Document", systemImage: "plus.viewfinder")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
                .padding()
                .background(.ultraThinMaterial)
            }
            .sheet(isPresented: $isScannerPresented) {
                ScannerView(
                    onScanComplete: { images in
                        isScannerPresented = false

                        guard !images.isEmpty else {
                            documentStore.lastErrorMessage = "No pages were captured. Please scan again and confirm at least one page before saving."
                            return
                        }

                        pendingScanImages = images
                        isScanEditorPresented = true
                    },
                    onCancel: {
                        isScannerPresented = false
                    },
                    onError: { error in
                        isScannerPresented = false
                        documentStore.lastErrorMessage = error.localizedDescription
                    }
                )
                .ignoresSafeArea()
            }
            .sheet(isPresented: $isPhotoCapturePresented) {
                PhotoCaptureView(
                    onPhotoCaptured: { image in
                        isPhotoCapturePresented = false
                        pendingScanImages = [image]
                        isScanEditorPresented = true
                    },
                    onCancel: {
                        isPhotoCapturePresented = false
                    }
                )
                .ignoresSafeArea()
            }
            .sheet(isPresented: $isSettingsPresented) {
                SettingsView()
            }
            .fullScreenCover(isPresented: $isScanEditorPresented) {
                PendingScanEditorView(images: pendingScanImages, kind: selectedKind) { images, title in
                    let document = await documentStore.saveScannedDocument(images: images, kind: selectedKind, title: title)
                    pendingScanImages = []

                    if let document {
                        navigationPath = [document]
                    }
                }
            }
            .sheet(isPresented: $isReceiptsCSVPresented) {
                if let receiptsCSVURL {
                    ShareSheetURLView(url: receiptsCSVURL)
                }
            }
            .alert(
                "CleanScan",
                isPresented: Binding(
                    get: { documentStore.lastErrorMessage != nil },
                    set: { if !$0 { documentStore.lastErrorMessage = nil } }
                )
            ) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(documentStore.lastErrorMessage ?? "")
            }
        }
    }

    private func startScanning() {
        if VNDocumentCameraViewController.isSupported {
            isScannerPresented = true
        } else {
            documentStore.lastErrorMessage = "Document scanning is not available on this device."
        }
    }

    private func startPhotoCapture() {
        isPhotoCapturePresented = true
    }

    private var modePicker: some View {
        Picker("Scan Mode", selection: $selectedKind) {
            ForEach(DocumentKind.allCases) { kind in
                Label(kind.label, systemImage: kind.systemImage)
                    .tag(kind)
            }
        }
        .pickerStyle(.segmented)
    }
}

private struct DocumentRow: View {
    let document: ScannedDocument

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: document.kind.systemImage)
                .foregroundStyle(document.kind == .receipt ? .green : .blue)
                .frame(width: 28)

            VStack(alignment: .leading, spacing: 4) {
                Text(document.title)
                    .font(.headline)
                Text(metadata)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 6)
    }

    private var metadata: String {
        if document.kind == .receipt {
            let total = document.receiptInfo?.totalText ?? "No total"
            let date = document.receiptInfo?.dateText ?? "No date"
            return "\(total) · \(date)"
        }

        return "\(document.pageImagePaths.count) pages"
    }
}

private struct ShareSheetURLView: View {
    let url: URL

    var body: some View {
        NavigationStack {
            List {
                Section {
                    ShareLink(item: url) {
                        Label("Share Receipts CSV", systemImage: "square.and.arrow.up")
                    }
                }
            }
            .navigationTitle("Receipts Export")
        }
    }
}
