import Foundation

struct ReceiptParser {
    func parse(text: String) -> ReceiptInfo {
        let lines = text
            .components(separatedBy: .newlines)
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }

        return ReceiptInfo(
            merchant: merchant(from: lines),
            dateText: dateText(from: lines),
            totalText: totalText(from: lines),
            category: "Uncategorized",
            rawText: text
        )
    }

    private func merchant(from lines: [String]) -> String? {
        lines.first { line in
            line.rangeOfCharacter(from: .letters) != nil
        }
    }

    private func dateText(from lines: [String]) -> String? {
        let patterns = [
            #"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b"#,
            #"\b\d{4}[/-]\d{1,2}[/-]\d{1,2}\b"#,
            #"\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{2,4}\b"#
        ]

        for line in lines {
            for pattern in patterns {
                if let match = line.firstMatch(pattern: pattern) {
                    return match
                }
            }
        }

        return nil
    }

    private func totalText(from lines: [String]) -> String? {
        let totalKeywords = ["total", "amount", "balance", "paid", "subtotal"]
        let amountPattern = #"[$€£]?\s?\d{1,5}(?:[,.]\d{2})"#

        for line in lines.reversed() {
            let lowercased = line.lowercased()
            if totalKeywords.contains(where: { lowercased.contains($0) }),
               let amount = line.firstMatch(pattern: amountPattern) {
                return amount
            }
        }

        for line in lines.reversed() {
            if let amount = line.firstMatch(pattern: amountPattern) {
                return amount
            }
        }

        return nil
    }
}

private extension String {
    func firstMatch(pattern: String) -> String? {
        guard let regex = try? NSRegularExpression(pattern: pattern, options: [.caseInsensitive]) else {
            return nil
        }

        let range = NSRange(startIndex..<endIndex, in: self)
        guard let match = regex.firstMatch(in: self, range: range),
              let matchRange = Range(match.range, in: self) else {
            return nil
        }

        return String(self[matchRange])
            .trimmingCharacters(in: .whitespacesAndNewlines)
    }
}
