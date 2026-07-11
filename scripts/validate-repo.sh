#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

node scripts/check-inline-scripts.mjs
node -e 'JSON.parse(require("node:fs").readFileSync("vercel.json", "utf8"))'
test -f surfing/index.html
test -f surfing/surf.html

echo "Validation complete"
