# CleanScan

CleanScan is a simple iOS document scanner for saving paper documents and receipts as PDFs.

The first public version focuses on a small, free, privacy-friendly workflow:

- Scan documents with the iPhone camera
- Review scanned pages before saving
- Delete and reorder pages
- Export clean PDF files
- Compress PDF output
- Add a simple signature
- Use Receipt Mode for basic receipt notes and CSV export

## Project

- `apps/cleanscan-ios`: SwiftUI iOS app
- `docs/cleanscan`: privacy policy, support page, and terms page
- `.github/workflows`: macOS `xcodebuild` CI and optional TestFlight workflow

## Local Testing

Open the Xcode project:

```bash
open apps/cleanscan-ios/CleanScan.xcodeproj
```

Then select the `CleanScan` scheme, choose a real iPhone, and run the app.

VisionKit document scanning requires a real iPhone. The simulator can compile and open the app, but it cannot fully verify camera scanning.

## App Store Preparation

Store listing materials are in:

```text
apps/cleanscan-ios/store-assets/us
```

Before submission, confirm:

- Real-device scanning works
- Privacy policy URL is live
- App Store screenshots are captured from the actual app
- Review notes match the current feature set
- The app remains free and usable without account creation
