import Foundation

enum AppConfiguration {
    static let appName = "CleanScan"
    static let bundleIdentifier = "com.cleanscan.app"
    static let supportEmail = "support@cleanscan.app"

    static let privacyPolicyURL = URL(string: "https://cleanscan.app/privacy")!
    static let termsOfUseURL = URL(string: "https://cleanscan.app/terms")!

    enum ProductID {
        static let lifetimePro = "cleanscan.pro.lifetime"
        static let monthlyPro = "cleanscan.pro.monthly"
        static let yearlyPro = "cleanscan.pro.yearly"

        static let all = [
            lifetimePro,
            monthlyPro,
            yearlyPro
        ]
    }
}
