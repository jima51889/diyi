# CleanScan TestFlight Checklist

## Build Setup

- Open `apps/cleanscan-ios/CleanScan.xcodeproj` on macOS with Xcode.
- Set a real `PRODUCT_BUNDLE_IDENTIFIER`.
- Set your Apple Developer `DEVELOPMENT_TEAM`.
- Confirm signing succeeds for a physical iPhone.
- Create matching in-app purchase products in App Store Connect if paid features stay enabled.

## Compile Checks

- Build Debug for iPhone simulator.
- Build Debug for a physical iPhone.
- Archive Release.
- Validate archive in Xcode Organizer.

## Real Device Scanner Tests

Run each case at least twice:

- Single-page receipt scan
- Multi-page contract scan
- Handwritten note scan
- Low-light scan with flash
- Slightly angled paper
- White paper on white table
- Cancel scanner before saving
- Scan 20+ pages in one document

## Document Workflow Tests

- Save document and relaunch app.
- Confirm document remains in list.
- Open document detail.
- Preview generated PDF.
- Share PDF to Files.
- Share PDF to Mail.
- Rename document.
- Delete document.
- Confirm deleted files do not reappear after relaunch.

## Privacy Checks

- Confirm no network requests are made by the MVP scanner flow.
- Confirm scanned files remain in local app storage.
- Confirm App Store privacy answers match the app behavior.
- Confirm `PrivacyInfo.xcprivacy` matches included SDKs and accessed APIs.

## TestFlight

- Upload build to App Store Connect.
- Or export locally with `bash scripts/archive-release.sh` and upload with `bash scripts/upload-testflight.sh`.
- Or manually run the GitHub Actions workflow `CleanScan TestFlight` after configuring repository secrets.
- Add internal testers first.
- Test install, launch, scan, preview, share, delete.
- Add 10-25 external testers after internal pass.
- Collect feedback on scan quality, PDF size, and navigation clarity.

## Release Gate

Do not submit for App Review until:

- Real-device scanner is stable.
- At least one TestFlight round is complete.
- Privacy policy URL is live.
- Support URL is live.
- App icon and screenshots are final.
- StoreKit products are approved, if monetization is enabled.

## GitHub TestFlight Secrets

The manual TestFlight workflow expects these repository secrets:

- `CLEANSCAN_DEVELOPMENT_TEAM`
- `CLEANSCAN_BUNDLE_ID`
- `APP_STORE_CONNECT_API_KEY_ID`
- `APP_STORE_CONNECT_API_ISSUER_ID`
- `APP_STORE_CONNECT_API_PRIVATE_KEY`
