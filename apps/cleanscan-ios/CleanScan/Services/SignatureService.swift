import Foundation
import UIKit

enum SignatureServiceError: LocalizedError {
    case documentHasNoPages
    case imageLoadFailed(URL)

    var errorDescription: String? {
        switch self {
        case .documentHasNoPages:
            return "The document has no pages to sign."
        case .imageLoadFailed(let url):
            return "Could not load image at \(url.lastPathComponent)."
        }
    }
}

struct SignaturePlacement {
    let centerX: CGFloat
    let centerY: CGFloat
    let widthRatio: CGFloat
    let rotationDegrees: CGFloat
}

struct SignatureService {
    func exportSignedPDF(
        imageURLs: [URL],
        signature: UIImage,
        placement: SignaturePlacement,
        destinationURL: URL
    ) throws {
        guard !imageURLs.isEmpty else {
            throw SignatureServiceError.documentHasNoPages
        }

        let pageImages = try imageURLs.map { imageURL in
            guard let pageImage = UIImage(contentsOfFile: imageURL.path) else {
                throw SignatureServiceError.imageLoadFailed(imageURL)
            }
            return pageImage
        }

        let pageRect = CGRect(x: 0, y: 0, width: 612, height: 792)
        let renderer = UIGraphicsPDFRenderer(bounds: pageRect)

        let renderActions: (UIGraphicsPDFRendererContext) -> Void = { context in
            for (index, pageImage) in pageImages.enumerated() {
                context.beginPage()
                UIColor.white.setFill()
                context.cgContext.fill(pageRect)

                let contentRect = pageRect.insetBy(dx: 24, dy: 24)
                let pageDrawRect = pageImage.aspectFitRect(in: contentRect)
                pageImage.draw(in: pageDrawRect)

                if index == imageURLs.count - 1 {
                    drawSignature(
                        signature,
                        placement: placement,
                        in: pageDrawRect,
                        context: context.cgContext
                    )
                }
            }
        }

        try renderer.writePDF(to: destinationURL, withActions: renderActions)
    }

    private func drawSignature(
        _ signature: UIImage,
        placement: SignaturePlacement,
        in pageDrawRect: CGRect,
        context: CGContext
    ) {
        let signatureWidth = pageDrawRect.width * min(max(placement.widthRatio, 0.08), 0.9)
        let aspectRatio = max(signature.size.width, 1) / max(signature.size.height, 1)
        let signatureHeight = signatureWidth / aspectRatio
        let center = CGPoint(
            x: pageDrawRect.minX + pageDrawRect.width * min(max(placement.centerX, 0), 1),
            y: pageDrawRect.minY + pageDrawRect.height * min(max(placement.centerY, 0), 1)
        )

        context.saveGState()
        context.translateBy(x: center.x, y: center.y)
        context.rotate(by: placement.rotationDegrees * .pi / 180)

        signature.draw(
            in: CGRect(
                x: -signatureWidth / 2,
                y: -signatureHeight / 2,
                width: signatureWidth,
                height: signatureHeight
            )
        )

        context.restoreGState()
    }
}
