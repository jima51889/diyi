import SwiftUI
import UIKit

struct SignaturePlacementView: View {
    @Environment(\.dismiss) private var dismiss

    let pageImage: UIImage
    let signature: UIImage
    let onSave: (SignaturePlacement) -> Void

    @State private var centerX: CGFloat = 0.64
    @State private var centerY: CGFloat = 0.76
    @State private var widthRatio: CGFloat = 0.34
    @State private var rotationDegrees: CGFloat = 0
    @State private var dragStart: CGPoint?
    @State private var widthStart: CGFloat = 0.34
    @State private var rotationStart: CGFloat = 0

    var body: some View {
        NavigationStack {
            GeometryReader { geometry in
                let imageRect = aspectFitRect(
                    imageSize: pageImage.size,
                    in: geometry.frame(in: .local).insetBy(dx: 16, dy: 16)
                )
                let signatureSize = signatureDisplaySize(in: imageRect)

                ZStack(alignment: .topLeading) {
                    Color(.systemGroupedBackground)
                        .ignoresSafeArea()

                    Image(uiImage: pageImage)
                        .resizable()
                        .scaledToFit()
                        .frame(width: imageRect.width, height: imageRect.height)
                        .position(x: imageRect.midX, y: imageRect.midY)
                        .shadow(radius: 8, y: 3)

                    Image(uiImage: signature)
                        .resizable()
                        .scaledToFit()
                        .frame(width: signatureSize.width, height: signatureSize.height)
                        .padding(8)
                        .background(.white.opacity(0.001))
                        .overlay {
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(.blue, style: StrokeStyle(lineWidth: 2, dash: [6, 4]))
                        }
                        .rotationEffect(.degrees(rotationDegrees))
                        .position(
                            x: imageRect.minX + centerX * imageRect.width,
                            y: imageRect.minY + centerY * imageRect.height
                        )
                        .gesture(dragGesture(in: imageRect))
                        .simultaneousGesture(scaleGesture)
                        .simultaneousGesture(rotationGesture)

                    VStack(spacing: 10) {
                        Spacer()
                        Text("Drag to move. Pinch to resize. Rotate with two fingers.")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 10)
                            .background(.thinMaterial)
                            .clipShape(Capsule())

                        VStack(spacing: 12) {
                            HStack {
                                Text("Size")
                                    .font(.footnote.weight(.semibold))
                                Slider(value: $widthRatio, in: 0.12...0.82)
                            }

                            HStack {
                                Text("Rotate")
                                    .font(.footnote.weight(.semibold))
                                Slider(value: $rotationDegrees, in: -45...45)
                                Button("Reset") {
                                    rotationDegrees = 0
                                    rotationStart = 0
                                }
                                .font(.footnote.weight(.semibold))
                            }
                        }
                        .padding(14)
                        .background(.thinMaterial)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .padding(.horizontal, 16)
                        .padding(.bottom, 14)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
            .navigationTitle("Place Signature")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel", role: .cancel) {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .topBarTrailing) {
                    Button("Save PDF") {
                        onSave(
                            SignaturePlacement(
                                centerX: centerX,
                                centerY: centerY,
                                widthRatio: widthRatio,
                                rotationDegrees: rotationDegrees
                            )
                        )
                        dismiss()
                    }
                    .fontWeight(.semibold)
                }
            }
        }
    }

    private func signatureDisplaySize(in imageRect: CGRect) -> CGSize {
        let width = imageRect.width * widthRatio
        let aspectRatio = max(signature.size.width, 1) / max(signature.size.height, 1)
        return CGSize(width: width, height: width / aspectRatio)
    }

    private func dragGesture(in imageRect: CGRect) -> some Gesture {
        DragGesture()
            .onChanged { value in
                if dragStart == nil {
                    dragStart = CGPoint(x: centerX, y: centerY)
                }

                guard let dragStart, imageRect.width > 0, imageRect.height > 0 else { return }

                centerX = clamp(dragStart.x + value.translation.width / imageRect.width, min: 0.04, max: 0.96)
                centerY = clamp(dragStart.y + value.translation.height / imageRect.height, min: 0.04, max: 0.96)
            }
            .onEnded { _ in
                dragStart = nil
            }
    }

    private var scaleGesture: some Gesture {
        MagnificationGesture()
            .onChanged { value in
                widthRatio = clamp(widthStart * value, min: 0.12, max: 0.82)
            }
            .onEnded { _ in
                widthStart = widthRatio
            }
    }

    private var rotationGesture: some Gesture {
        RotationGesture()
            .onChanged { value in
                rotationDegrees = rotationStart + value.degrees
            }
            .onEnded { _ in
                rotationStart = rotationDegrees
            }
    }

    private func aspectFitRect(imageSize: CGSize, in rect: CGRect) -> CGRect {
        guard imageSize.width > 0, imageSize.height > 0, rect.width > 0, rect.height > 0 else {
            return rect
        }

        let scale = min(rect.width / imageSize.width, rect.height / imageSize.height)
        let width = imageSize.width * scale
        let height = imageSize.height * scale

        return CGRect(
            x: rect.midX - width / 2,
            y: rect.midY - height / 2,
            width: width,
            height: height
        )
    }

    private func clamp(_ value: CGFloat, min minimum: CGFloat, max maximum: CGFloat) -> CGFloat {
        Swift.min(Swift.max(value, minimum), maximum)
    }
}
