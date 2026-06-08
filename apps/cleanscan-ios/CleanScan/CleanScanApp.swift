import SwiftUI

@main
struct CleanScanApp: App {
    @StateObject private var documentStore = DocumentStore()

    var body: some Scene {
        WindowGroup {
            HomeView()
                .environmentObject(documentStore)
                .task {
                    await documentStore.load()
                }
        }
    }
}
