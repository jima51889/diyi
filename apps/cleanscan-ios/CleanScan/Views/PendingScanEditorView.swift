import SwiftUI
import UIKit

struct PendingScanEditorView: View {
    @Environment(\.dismiss) private var dismiss

    @State private var pages: [ScanPageDraft]
    @State private var isSaving = false

    let kind: DocumentKind
    let onSave: ([UIImage]) async -> Void

    init(images: [UIImage], kind: DocumentKind, onSave: @escaping ([UIImage]) async -> Void) {
        _pages = State(initialValue: images.map { ScanPageDraft(image: $0) })
        self.kind = kind
        self.onSave = onSave
    }

    var body: some View {
        NavigationStack {
            Group {
                if pages.isEmpty {
                    ContentUnavailableView(
                        "No pages",
                        systemImage: "doc.badge.minus",
                        description: Text("Add another scan or cancel this document.")
                    )
                } else {
                    List {
                        ForEach(Array(pages.enumerated()), id: \.element.id) { index, page in
                            HStack(spacing: 14) {
                                Image(uiImage: page.image)
                                    .resizable()
                                    .scaledToFill()
                                    .frame(width: 58, height: 78)
                                    .clipShape(RoundedRectangle(cornerRadius: 7))
                                    .overlay {
                                        RoundedRectangle(cornerRadius: 7)
                                            .stroke(.quaternary)
                                    }

                                VStack(alignment: .leading, spacing: 4) {
                                    Text("Page \(index + 1)")
                                        .font(.headline)
                                    Text("Drag to reorder")
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }

                                Spacer()
                            }
                            .frame(minHeight: 84)
                        }
                        .onDelete { offsets in
                            pages.remove(atOffsets: offsets)
                        }
                        .onMove { source, destination in
                            pages.move(fromOffsets: source, toOffset: destination)
                        }
                    }
                }
            }
            .navigationTitle(kind == .receipt ? "Review Receipt" : "Review Scan")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel", role: .cancel) {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .topBarTrailing) {
                    EditButton()
                }

                ToolbarItem(placement: .bottomBar) {
                    Button {
                        save()
                    } label: {
                        if isSaving {
                            ProgressView()
                                .frame(maxWidth: .infinity)
                        } else {
                            Label("Save PDF", systemImage: "checkmark.circle.fill")
                                .frame(maxWidth: .infinity)
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.large)
                    .disabled(pages.isEmpty || isSaving)
                }
            }
        }
    }

    private func save() {
        isSaving = true
        let images = pages.map(\.image)

        Task {
            await onSave(images)
            isSaving = false
            dismiss()
        }
    }
}

private struct ScanPageDraft: Identifiable {
    let id = UUID()
    let image: UIImage
}
