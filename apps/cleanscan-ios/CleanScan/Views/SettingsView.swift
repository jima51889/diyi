import SwiftUI

struct SettingsView: View {
    @EnvironmentObject private var purchaseManager: PurchaseManager
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            List {
                Section {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("CleanScan Pro")
                            .font(.title2.bold())
                        Text("Unlock OCR, e-signatures, PDF compression, and unlimited scans when paid features are enabled.")
                            .foregroundStyle(.secondary)
                            .font(.subheadline)

                        if purchaseManager.hasProAccess {
                            Label("Pro active", systemImage: "checkmark.seal.fill")
                                .foregroundStyle(.green)
                                .font(.headline)
                        } else {
                            Text("Products are loaded from App Store Connect.")
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                        }
                    }
                    .padding(.vertical, 8)
                }

                if !purchaseManager.products.isEmpty {
                    Section("Upgrade") {
                        ForEach(purchaseManager.products) { product in
                            Button {
                                Task { await purchaseManager.purchase(product) }
                            } label: {
                                HStack {
                                    VStack(alignment: .leading) {
                                        Text(product.displayName)
                                        Text(product.description)
                                            .font(.caption)
                                            .foregroundStyle(.secondary)
                                    }
                                    Spacer()
                                    Text(product.displayPrice)
                                        .fontWeight(.semibold)
                                }
                            }
                        }
                    }
                }

                Section("Support") {
                    Button("Restore Purchases") {
                        Task { await purchaseManager.restorePurchases() }
                    }

                    Link("Privacy Policy", destination: AppConfiguration.privacyPolicyURL)
                    Link("Terms of Use", destination: AppConfiguration.termsOfUseURL)

                    Link(
                        "Contact Support",
                        destination: URL(string: "mailto:\(AppConfiguration.supportEmail)")!
                    )
                }

                Section {
                    HStack {
                        Text("Version")
                        Spacer()
                        Text(Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "0.1")
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .navigationTitle("Settings")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
            .task {
                await purchaseManager.loadProducts()
                await purchaseManager.refreshEntitlements()
            }
            .alert(
                "CleanScan",
                isPresented: Binding(
                    get: { purchaseManager.errorMessage != nil },
                    set: { if !$0 { purchaseManager.errorMessage = nil } }
                )
            ) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(purchaseManager.errorMessage ?? "")
            }
        }
    }
}
