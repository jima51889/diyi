import Foundation

struct ScannedDocument: Identifiable, Codable, Hashable {
    let id: UUID
    var title: String
    var createdAt: Date
    var updatedAt: Date
    var pageImagePaths: [String]
    var pdfPath: String?

    init(
        id: UUID = UUID(),
        title: String,
        createdAt: Date = Date(),
        updatedAt: Date = Date(),
        pageImagePaths: [String],
        pdfPath: String? = nil
    ) {
        self.id = id
        self.title = title
        self.createdAt = createdAt
        self.updatedAt = updatedAt
        self.pageImagePaths = pageImagePaths
        self.pdfPath = pdfPath
    }
}
