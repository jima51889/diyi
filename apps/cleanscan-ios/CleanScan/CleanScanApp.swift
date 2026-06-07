import SwiftUI

@main
struct CleanScanApp: App {
    @StateObject private var documentStore = DocumentStore()
    @StateObject private var purchaseManager = PurchaseManager()

    var body: some Scene {
        WindowGroup {
            HomeView()
                .environmentObject(documentStore)
                .environmentObject(purchaseManager)
                .task {
                    await documentStore.load()
                }
        }
    }
}
