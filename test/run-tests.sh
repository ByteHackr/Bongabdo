#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Running tests with gjs..."
echo "Repo: $ROOT_DIR"
echo

fail=0

run_one() {
  local file="$1"
  echo "==> $file"
  if gjs -m "$file"; then
    echo "PASS: $file"
  else
    echo "FAIL: $file"
    fail=1
  fi
  echo
}

while IFS= read -r -d '' f; do
  run_one "$f"
done < <(find "$ROOT_DIR/test" -type f -name "*_test.js" -print0 | sort -z)

if [[ "$fail" -ne 0 ]]; then
  echo "Some tests failed."
  exit 1
fi

echo "All tests passed."


