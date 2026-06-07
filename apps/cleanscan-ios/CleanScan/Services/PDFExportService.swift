import Foundation
import UIKit

enum PDFExportError: LocalizedError {
    case noImages
    case imageLoadFailed(URL)
    case renderFailed

    var errorDescription: String? {
        switch self {
        case .noImages:
            return "No pages were available to export."
        case .imageLoadFailed(let url):
            return "Could not load image at \(url.lastPathComponent)."
        case .renderFailed:
            return "The PDF could not be created."
        }
    }
}

struct PDFExportService {
    func exportPDF(
        from imageURLs: [URL],
        to destinationURL: URL,
        options: PDFExportOptions = .standard
    ) throws {
        guard !imageURLs.isEmpty else {
            throw PDFExportError.noImages
        }

        let images = try imageURLs.map { url in
            guard let image = UIImage(contentsOfFile: url.path) else {
                throw PDFExportError.imageLoadFailed(url)
            }
            return image
        }

        let pageRect = CGRect(x: 0, y: 0, width: 612, height: 792)
        let renderer = UIGraphicsPDFRenderer(bounds: pageRect)

        do {
            try renderer.writePDF(to: destinationURL) { context in
                for image in images {
                    context.beginPage()
                    let exportImage = image.preparingForPDFExport(options: options)
                    let drawRect = exportImage.aspectFitRect(in: pageRect.insetBy(dx: 24, dy: 24))
                    exportImage.draw(in: drawRect)
                }
            }
        } catch {
            throw PDFExportError.renderFailed
        }
    }
}

struct PDFExportOptions {
    let maxPixelDimension: CGFloat
    let jpegCompressionQuality: CGFloat

    static let standard = PDFExportOptions(
        maxPixelDimension: 1800,
        jpegCompressionQuality: 0.88
    )

    static let compressed = PDFExportOptions(
        maxPixelDimension: 1200,
        jpegCompressionQuality: 0.58
    )
}

private extension UIImage {
    func preparingForPDFExport(options: PDFExportOptions) -> UIImage {
        let resized = resized(maxPixelDimension: options.maxPixelDimension)

        guard let data = resized.jpegData(compressionQuality: options.jpegCompressionQuality),
              let compressed = UIImage(data: data) else {
            return resized
        }

        return compressed
    }

    func resized(maxPixelDimension: CGFloat) -> UIImage {
        let largestDimension = max(size.width, size.height)
        guard largestDimension > maxPixelDimension else {
            return self
        }

        let scale = maxPixelDimension / largestDimension
        let targetSize = CGSize(width: size.width * scale, height: size.height * scale)
        let renderer = UIGraphicsImageRenderer(size: targetSize)

        return renderer.image { _ in
            draw(in: CGRect(origin: .zero, size: targetSize))
        }
    }
}
