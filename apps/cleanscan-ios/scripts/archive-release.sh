#!/usr/bin/env bash
set -euo pipefail

PROJECT="CleanScan.xcodeproj"
SCHEME="CleanScan"
CONFIGURATION="Release"
BUILD_DIR="build/release"
ARCHIVE_PATH="${BUILD_DIR}/CleanScan.xcarchive"
EXPORT_PATH="${BUILD_DIR}/export"
EXPORT_OPTIONS="ExportOptions/AppStoreExportOptions.plist"

if [[ -z "${DEVELOPMENT_TEAM:-}" ]]; then
  echo "Missing DEVELOPMENT_TEAM. Example: DEVELOPMENT_TEAM=ABCDE12345 bash scripts/archive-release.sh"
  exit 1
fi

if [[ -z "${PRODUCT_BUNDLE_IDENTIFIER:-}" ]]; then
  echo "Missing PRODUCT_BUNDLE_IDENTIFIER. Example: PRODUCT_BUNDLE_IDENTIFIER=com.yourcompany.cleanscan bash scripts/archive-release.sh"
  exit 1
fi

mkdir -p "${BUILD_DIR}" "${EXPORT_PATH}"

echo "== Archive CleanScan =="
xcodebuild \
  -project "${PROJECT}" \
  -scheme "${SCHEME}" \
  -configuration "${CONFIGURATION}" \
  -destination 'generic/platform=iOS' \
  -archivePath "${ARCHIVE_PATH}" \
  DEVELOPMENT_TEAM="${DEVELOPMENT_TEAM}" \
  PRODUCT_BUNDLE_IDENTIFIER="${PRODUCT_BUNDLE_IDENTIFIER}" \
  -allowProvisioningUpdates \
  clean archive

echo "== Export IPA =="
xcodebuild \
  -exportArchive \
  -archivePath "${ARCHIVE_PATH}" \
  -exportPath "${EXPORT_PATH}" \
  -exportOptionsPlist "${EXPORT_OPTIONS}" \
  -allowProvisioningUpdates

echo "Exported files:"
find "${EXPORT_PATH}" -maxdepth 1 -type f -print
