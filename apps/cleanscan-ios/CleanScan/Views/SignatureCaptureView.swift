import PencilKit
import SwiftUI
import UIKit

struct SignatureCaptureView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var canvasView = PKCanvasView()
    @State private var isEmptySignatureAlertPresented = false

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
            .alert("Add a signature first", isPresented: $isEmptySignatureAlertPresented) {
                Button("OK", role: .cancel) {}
            } message: {
                Text("Write your signature in the box before saving.")
            }
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
        let drawingBounds = canvasView.drawing.bounds
        guard !drawingBounds.isEmpty, !drawingBounds.isNull else {
            isEmptySignatureAlertPresented = true
            return
        }

        let bounds = drawingBounds.insetBy(dx: -24, dy: -24)
        let image = canvasView.drawing.image(from: bounds, scale: UIScreen.main.scale)
        onSave(image)
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
