import SwiftUI
import UIKit

struct SignatureWorkflowView: View {
    @Environment(\.dismiss) private var dismiss

    let pageImage: UIImage
    let onComplete: (UIImage, SignaturePlacement) -> Void

    @State private var signature: UIImage?

    var body: some View {
        Group {
            if let signature {
                SignaturePlacementView(pageImage: pageImage, signature: signature) { placement in
                    onComplete(signature, placement)
                    dismiss()
                }
            } else {
                SignatureCaptureView { signature in
                    self.signature = signature
                }
            }
        }
    }
}
