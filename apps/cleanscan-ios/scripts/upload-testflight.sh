#!/usr/bin/env bash
set -euo pipefail

IPA_PATH="${1:-build/release/export/CleanScan.ipa}"

if [[ ! -f "${IPA_PATH}" ]]; then
  echo "IPA not found: ${IPA_PATH}"
  exit 1
fi

if [[ -z "${APP_STORE_CONNECT_API_KEY_ID:-}" ]]; then
  echo "Missing APP_STORE_CONNECT_API_KEY_ID."
  exit 1
fi

if [[ -z "${APP_STORE_CONNECT_API_ISSUER_ID:-}" ]]; then
  echo "Missing APP_STORE_CONNECT_API_ISSUER_ID."
  exit 1
fi

if [[ -z "${APP_STORE_CONNECT_API_PRIVATE_KEY_PATH:-}" ]]; then
  echo "Missing APP_STORE_CONNECT_API_PRIVATE_KEY_PATH."
  exit 1
fi

if [[ ! -f "${APP_STORE_CONNECT_API_PRIVATE_KEY_PATH}" ]]; then
  echo "API private key not found: ${APP_STORE_CONNECT_API_PRIVATE_KEY_PATH}"
  exit 1
fi

API_KEYS_DIR="${HOME}/private_keys"
mkdir -p "${API_KEYS_DIR}"
cp "${APP_STORE_CONNECT_API_PRIVATE_KEY_PATH}" "${API_KEYS_DIR}/AuthKey_${APP_STORE_CONNECT_API_KEY_ID}.p8"
chmod 600 "${API_KEYS_DIR}/AuthKey_${APP_STORE_CONNECT_API_KEY_ID}.p8"

echo "== Upload IPA to App Store Connect =="
xcrun altool \
  --upload-app \
  --type ios \
  --file "${IPA_PATH}" \
  --apiKey "${APP_STORE_CONNECT_API_KEY_ID}" \
  --apiIssuer "${APP_STORE_CONNECT_API_ISSUER_ID}"
