import Foundation
import StoreKit

@MainActor
final class PurchaseManager: ObservableObject {
    @Published private(set) var products: [Product] = []
    @Published private(set) var purchasedProductIDs: Set<String> = []
    @Published var errorMessage: String?

    var hasProAccess: Bool {
        purchasedProductIDs.contains(AppConfiguration.ProductID.lifetimePro)
            || purchasedProductIDs.contains(AppConfiguration.ProductID.monthlyPro)
            || purchasedProductIDs.contains(AppConfiguration.ProductID.yearlyPro)
    }

    func loadProducts() async {
        do {
            products = try await Product.products(for: AppConfiguration.ProductID.all)
        } catch {
            errorMessage = "Could not load purchases. Please try again later."
        }
    }

    func purchase(_ product: Product) async {
        do {
            let result = try await product.purchase()

            switch result {
            case .success(let verification):
                let transaction = try checkVerified(verification)
                purchasedProductIDs.insert(transaction.productID)
                await transaction.finish()
            case .userCancelled, .pending:
                break
            @unknown default:
                break
            }
        } catch {
            errorMessage = "Purchase could not be completed."
        }
    }

    func refreshEntitlements() async {
        var productIDs: Set<String> = []

        for await result in Transaction.currentEntitlements {
            do {
                let transaction = try checkVerified(result)
                productIDs.insert(transaction.productID)
            } catch {
                continue
            }
        }

        purchasedProductIDs = productIDs
    }

    func restorePurchases() async {
        do {
            try await AppStore.sync()
            await refreshEntitlements()
        } catch {
            errorMessage = "Purchases could not be restored."
        }
    }

    private func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .verified(let safe):
            return safe
        case .unverified:
            throw PurchaseError.failedVerification
        }
    }
}

enum PurchaseError: Error {
    case failedVerification
}
