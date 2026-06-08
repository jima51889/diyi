import Foundation

struct ReceiptCSVExporter {
    func export(documents: [ScannedDocument], to destinationURL: URL) throws {
        let receiptDocuments = documents.filter { $0.kind == .receipt }
        var rows = ["Title,Merchant,Date,Total,Category,Created At"]

        for document in receiptDocuments {
            let info = document.receiptInfo
            let values = [
                document.title,
                info?.merchant ?? "",
                info?.dateText ?? "",
                info?.totalText ?? "",
                info?.category ?? "Uncategorized",
                Self.dateFormatter.string(from: document.createdAt)
            ]
            rows.append(values.map(Self.escape).joined(separator: ","))
        }

        try rows.joined(separator: "\n").write(to: destinationURL, atomically: true, encoding: .utf8)
    }

    private static func escape(_ value: String) -> String {
        let escaped = value.replacingOccurrences(of: "\"", with: "\"\"")
        return "\"\(escaped)\""
    }

    private static let dateFormatter: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        return formatter
    }()
}
