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

struct SignatureService {
    func exportSignedPDF(
        imageURLs: [URL],
        signature: UIImage,
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

        try renderer.writePDF(to: destinationURL) { context in
            for (index, pageImage) in pageImages.enumerated() {
                context.beginPage()

                let contentRect = pageRect.insetBy(dx: 24, dy: 24)
                let pageDrawRect = pageImage.aspectFitRect(in: contentRect)
                pageImage.draw(in: pageDrawRect)

                if index == imageURLs.count - 1 {
                    let signatureRect = CGRect(
                        x: pageRect.maxX - 250,
                        y: pageRect.maxY - 130,
                        width: 190,
                        height: 58
                    )
                    signature.draw(in: signature.aspectFitRect(in: signatureRect))

                    let lineRect = CGRect(
                        x: signatureRect.minX,
                        y: signatureRect.maxY + 8,
                        width: signatureRect.width,
                        height: 1
                    )
                    UIColor.black.withAlphaComponent(0.55).setFill()
                    context.cgContext.fill(lineRect)
                }
            }
        }
    }
}
