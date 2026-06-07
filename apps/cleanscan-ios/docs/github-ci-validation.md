# GitHub CI Validation Guide

This project includes two GitHub Actions workflows:

- `.github/workflows/cleanscan-ios.yml`
- `.github/workflows/cleanscan-ios-testflight.yml`

Use `cleanscan-ios.yml` first. It checks whether CleanScan compiles on a GitHub-hosted macOS runner.

## 1. Initialize Git

From the repository root:

```sh
git init
git add .
git commit -m "Add CleanScan iOS MVP"
```

## 2. Create a GitHub Repository

Create an empty GitHub repository, then connect it:

```sh
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## 3. Watch CI

Open the GitHub repository:

```text
Actions -> CleanScan iOS
```

The workflow should run automatically after push.

## 4. What the CI Checks

The CI runs on `macos-15` and executes:

```sh
bash apps/cleanscan-ios/scripts/ci-build.sh
```

It checks:

- Xcode is available
- CleanScan scheme is visible
- Swift/Xcode project dependencies resolve
- Debug build works for iOS Simulator
- Release archive works without signing

## 5. If CI Fails

Download the uploaded artifact:

```text
cleanscan-xcresults
```

Open the `.xcresult` bundle in Xcode on a Mac for detailed compiler errors.

Also check the Actions log for:

- Missing scheme
- Invalid project file
- Swift compiler errors
- Unavailable iOS API
- Asset catalog errors
- Privacy manifest errors

## 6. TestFlight Workflow

Do not run `CleanScan TestFlight` until the compile workflow passes.

Before running TestFlight upload, configure these GitHub repository secrets:

- `CLEANSCAN_DEVELOPMENT_TEAM`
- `CLEANSCAN_BUNDLE_ID`
- `APP_STORE_CONNECT_API_KEY_ID`
- `APP_STORE_CONNECT_API_ISSUER_ID`
- `APP_STORE_CONNECT_API_PRIVATE_KEY`

Then manually run:

```text
Actions -> CleanScan TestFlight -> Run workflow
```

## Current Local Limitation

This Windows workspace cannot run Xcode or iOS Simulator locally. CI validation begins after the project is pushed to GitHub.
