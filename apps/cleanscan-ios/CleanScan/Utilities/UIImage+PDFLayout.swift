import UIKit

extension UIImage {
    func aspectFitRect(in bounds: CGRect) -> CGRect {
        let imageRatio = size.width / size.height
        let boundsRatio = bounds.width / bounds.height

        if imageRatio > boundsRatio {
            let width = bounds.width
            let height = width / imageRatio
            return CGRect(
                x: bounds.midX - width / 2,
                y: bounds.midY - height / 2,
                width: width,
                height: height
            )
        }

        let height = bounds.height
        let width = height * imageRatio
        return CGRect(
            x: bounds.midX - width / 2,
            y: bounds.midY - height / 2,
            width: width,
            height: height
        )
    }
}
