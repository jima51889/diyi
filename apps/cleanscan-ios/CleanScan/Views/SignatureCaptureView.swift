import PencilKit
import SwiftUI
import UIKit

struct SignatureCaptureView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var canvasView = PKCanvasView()

    let onSave: (UIImage) -> Void

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                Text("Sign inside the box")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .padding(.vertical, 12)

                SignatureCanvasView(canvasView: $canvasView)
                    .background(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: 14))
                    .overlay {
                        RoundedRectangle(cornerRadius: 14)
                            .stroke(.quaternary)
                    }
                    .padding()

                Text("Your signature stays on this device.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .padding(.bottom, 12)
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Add Signature")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel", role: .cancel) {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .topBarTrailing) {
                    Button("Save") {
                        saveSignature()
                    }
                }

                ToolbarItem(placement: .bottomBar) {
                    Button(role: .destructive) {
                        canvasView.drawing = PKDrawing()
                    } label: {
                        Label("Clear", systemImage: "trash")
                    }
                }
            }
        }
    }

    private func saveSignature() {
        let bounds = canvasView.bounds
        let image = canvasView.drawing.image(from: bounds, scale: UIScreen.main.scale)
        onSave(image)
        dismiss()
    }
}

private struct SignatureCanvasView: UIViewRepresentable {
    @Binding var canvasView: PKCanvasView

    func makeUIView(context: Context) -> PKCanvasView {
        canvasView.drawingPolicy = .anyInput
        canvasView.backgroundColor = .white
        canvasView.tool = PKInkingTool(.pen, color: .black, width: 3)
        return canvasView
    }

    func updateUIView(_ uiView: PKCanvasView, context: Context) {}
}
