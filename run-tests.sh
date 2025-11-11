#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_DIR"

echo "Cleaning previous results…"
rm -rf allure-results allure-report test-results || true

if [ ! -d node_modules ]; then
  echo "Installing dependencies…"
  npm install
fi

echo "Running Playwright tests (all browsers & scenarios)…"
set +e
npm run test
TEST_EXIT=$?
set -e

echo "Generating & opening Allure report…"
npm run allure:open || true

exit $TEST_EXIT
