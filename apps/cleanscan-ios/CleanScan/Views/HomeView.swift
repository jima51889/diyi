import SwiftUI
import UIKit
import VisionKit

struct HomeView: View {
    @EnvironmentObject private var documentStore: DocumentStore
    @State private var isScannerPresented = false
    @State private var isSettingsPresented = false
    @State private var isScanEditorPresented = false
    @State private var pendingScanImages: [UIImage] = []

    var body: some View {
        NavigationStack {
            Group {
                if documentStore.documents.isEmpty {
                    ContentUnavailableView(
                        "Scan your first document",
                        systemImage: "doc.viewfinder",
                        description: Text("Create clean PDFs from paper documents, notes, receipts, and IDs.")
                    )
                } else {
                    List {
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
                    Button {
                        isSettingsPresented = true
                    } label: {
                        Label("Settings", systemImage: "gearshape")
                    }
                }

                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        startScanning()
                    } label: {
                        Label("Scan", systemImage: "plus.viewfinder")
                    }
                }
            }
            .safeAreaInset(edge: .bottom) {
                Button {
                    startScanning()
                } label: {
                    Label("Scan Document", systemImage: "doc.viewfinder")
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
                        pendingScanImages = images
                        isScannerPresented = false
                        isScanEditorPresented = true
                    },
                    onCancel: {},
                    onError: { error in
                        documentStore.lastErrorMessage = error.localizedDescription
                    }
                )
                .ignoresSafeArea()
            }
            .sheet(isPresented: $isSettingsPresented) {
                SettingsView()
            }
            .fullScreenCover(isPresented: $isScanEditorPresented) {
                PendingScanEditorView(images: pendingScanImages) { images in
                    await documentStore.saveScannedDocument(images: images)
                    pendingScanImages = []
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
}

private struct DocumentRow: View {
    let document: ScannedDocument

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(document.title)
                .font(.headline)
            Text("\(document.pageImagePaths.count) pages")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .padding(.vertical, 6)
    }
}
