# CleanScan iOS

CleanScan is a SwiftUI MVP for a privacy-first PDF scanner app.

## Current MVP

- SwiftUI app shell
- VisionKit document scanner wrapper
- Local document index stored as JSON
- Scanned page image storage
- Multi-page PDF export
- PDF preview with PDFKit
- System PDF sharing
- Rename and delete document actions
- Scan review before saving
- Delete and reorder scanned pages before PDF export
- Create and share compressed PDF copies
- On-device OCR text recognition with copy/share support
- Capture a handwritten signature and export a signed PDF

## Open in Xcode

Open:

```text
apps/cleanscan-ios/CleanScan.xcodeproj
```

The scanner uses `VNDocumentCameraViewController`, so test on a real iPhone. The iOS simulator may report that document scanning is unavailable.

## GitHub Actions Build

The repository includes a macOS CI workflow at:

```text
.github/workflows/cleanscan-ios.yml
```

It runs `xcodebuild` against `CleanScan.xcodeproj` on a GitHub-hosted macOS runner and builds for the iOS Simulator with code signing disabled. This checks whether the project compiles, but it does not upload to TestFlight or validate real-device VisionKit scanning.

The workflow delegates the build to:

```text
apps/cleanscan-ios/scripts/ci-build.sh
```

The script creates Xcode result bundles under `apps/cleanscan-ios/build/results`, which GitHub Actions uploads as artifacts even when the build fails.

For push and validation steps, see:

```text
apps/cleanscan-ios/docs/github-ci-validation.md
```

## Release Archive on Mac

After setting a real Apple Developer Team and Bundle ID, create a signed archive and export an IPA on macOS:

```sh
DEVELOPMENT_TEAM=ABCDE12345 \
PRODUCT_BUNDLE_IDENTIFIER=com.yourcompany.cleanscan \
bash scripts/archive-release.sh
```

Upload the exported IPA to App Store Connect with an App Store Connect API key:

```sh
APP_STORE_CONNECT_API_KEY_ID=KEY1234567 \
APP_STORE_CONNECT_API_ISSUER_ID=00000000-0000-0000-0000-000000000000 \
APP_STORE_CONNECT_API_PRIVATE_KEY_PATH=/path/to/AuthKey_KEY1234567.p8 \
bash scripts/upload-testflight.sh build/release/export/CleanScan.ipa
```

These scripts are intended for macOS with Xcode installed. Keep API keys out of git.
