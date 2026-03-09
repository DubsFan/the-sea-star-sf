#!/usr/bin/env bash
set -euo pipefail

echo "=== Test Gate ==="
echo ""

# Check Docker
if ! docker info &>/dev/null; then
  echo "ERROR: Docker is not running. Start Docker Desktop first."
  exit 1
fi

# Check Supabase
if ! supabase status &>/dev/null; then
  echo "Starting local Supabase..."
  supabase start
fi

echo "1/4  Resetting database..."
npm run test:reset

echo "2/4  Running Vitest with coverage..."
npx vitest run --coverage

echo "3/4  Resetting database for E2E..."
npm run test:reset

echo "4/4  Running Playwright E2E tests..."
npx playwright test

echo ""
echo "=== All gates passed ==="
