import SwiftUI

struct SettingsView: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            List {
                Section {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("CleanScan")
                            .font(.title2.bold())
                        Text("A simple scanner for documents and receipts. No ads, no watermark, and no account required.")
                            .foregroundStyle(.secondary)
                            .font(.subheadline)
                    }
                    .padding(.vertical, 8)
                }

                Section("Support") {
                    Link("Privacy Policy", destination: AppConfiguration.privacyPolicyURL)
                    Link("Terms of Use", destination: AppConfiguration.termsOfUseURL)
                    Link("Support Page", destination: AppConfiguration.supportURL)

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
        }
    }
}
