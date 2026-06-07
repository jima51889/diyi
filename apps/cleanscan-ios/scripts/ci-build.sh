#!/usr/bin/env bash
set -euo pipefail

PROJECT="CleanScan.xcodeproj"
SCHEME="CleanScan"
BUILD_DIR="build"
RESULT_DIR="${BUILD_DIR}/results"
ARCHIVE_PATH="${BUILD_DIR}/CleanScan.xcarchive"

mkdir -p "${RESULT_DIR}"

echo "== macOS =="
sw_vers

echo "== Xcode =="
xcodebuild -version
xcode-select -p

echo "== Schemes =="
xcodebuild -list -project "${PROJECT}"

echo "== Available simulators =="
xcrun simctl list devices available

echo "== Resolve package dependencies =="
xcodebuild \
  -project "${PROJECT}" \
  -scheme "${SCHEME}" \
  -resolvePackageDependencies

echo "== Debug build for iOS Simulator =="
xcodebuild \
  -project "${PROJECT}" \
  -scheme "${SCHEME}" \
  -configuration Debug \
  -destination 'generic/platform=iOS Simulator' \
  -resultBundlePath "${RESULT_DIR}/CleanScan-Debug.xcresult" \
  CODE_SIGNING_ALLOWED=NO \
  clean build

echo "== Release archive without signing =="
xcodebuild \
  -project "${PROJECT}" \
  -scheme "${SCHEME}" \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath "${ARCHIVE_PATH}" \
  -resultBundlePath "${RESULT_DIR}/CleanScan-Archive.xcresult" \
  CODE_SIGNING_ALLOWED=NO \
  archive
