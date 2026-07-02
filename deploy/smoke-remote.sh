#!/usr/bin/env bash
# Post-deploy smoke for autotests.ai (strict TLS — no curl -k).
set -euo pipefail

BASE_URL="${1:-https://autotests.ai}"
BASE_URL="${BASE_URL%/}"

echo "=== TLS + GET ${BASE_URL}/ ==="
code="$(curl -s -o /dev/null -w '%{http_code}' "${BASE_URL}/")"
echo "HTTP ${code}"
[[ "$code" == "200" ]] || { echo "FAIL: expected 200" >&2; exit 1; }

echo "=== GET ${BASE_URL}/api/terminal ==="
body="$(curl -fsSL "${BASE_URL}/api/terminal")"
echo "$body" | grep -q postgresql || { echo "FAIL: missing postgresql in response" >&2; exit 1; }

echo "Smoke OK: ${BASE_URL}"
