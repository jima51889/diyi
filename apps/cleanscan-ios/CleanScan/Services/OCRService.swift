import Foundation
import ImageIO
import UIKit
import Vision

enum OCRServiceError: LocalizedError {
    case imageLoadFailed(URL)
    case cgImageUnavailable(URL)

    var errorDescription: String? {
        switch self {
        case .imageLoadFailed(let url):
            return "Could not load image at \(url.lastPathComponent)."
        case .cgImageUnavailable(let url):
            return "Could not prepare image at \(url.lastPathComponent) for text recognition."
        }
    }
}

struct OCRService {
    func recognizeText(from imageURLs: [URL]) async throws -> String {
        var pageTexts: [String] = []

        for (index, imageURL) in imageURLs.enumerated() {
            let text = try await recognizeText(from: imageURL)
            let trimmedText = text.trimmingCharacters(in: .whitespacesAndNewlines)

            if !trimmedText.isEmpty {
                pageTexts.append("Page \(index + 1)\n\(trimmedText)")
            }
        }

        return pageTexts.joined(separator: "\n\n")
    }

    private func recognizeText(from imageURL: URL) async throws -> String {
        guard let image = UIImage(contentsOfFile: imageURL.path) else {
            throw OCRServiceError.imageLoadFailed(imageURL)
        }

        guard let cgImage = image.cgImage else {
            throw OCRServiceError.cgImageUnavailable(imageURL)
        }

        return try await Task.detached(priority: .userInitiated) {
            try await withCheckedThrowingContinuation { continuation in
                let request = VNRecognizeTextRequest { request, error in
                    if let error {
                        continuation.resume(throwing: error)
                        return
                    }

                    let observations = request.results as? [VNRecognizedTextObservation] ?? []
                    let text = observations
                        .compactMap { $0.topCandidates(1).first?.string }
                        .joined(separator: "\n")

                    continuation.resume(returning: text)
                }

                request.recognitionLevel = .accurate
                request.usesLanguageCorrection = true

                let handler = VNImageRequestHandler(cgImage: cgImage, orientation: image.cgImagePropertyOrientation)

                do {
                    try handler.perform([request])
                } catch {
                    continuation.resume(throwing: error)
                }
            }
        }.value
    }
}

private extension UIImage {
    var cgImagePropertyOrientation: CGImagePropertyOrientation {
        switch imageOrientation {
        case .up:
            return .up
        case .upMirrored:
            return .upMirrored
        case .down:
            return .down
        case .downMirrored:
            return .downMirrored
        case .left:
            return .left
        case .leftMirrored:
            return .leftMirrored
        case .right:
            return .right
        case .rightMirrored:
            return .rightMirrored
        @unknown default:
            return .up
        }
    }
}
