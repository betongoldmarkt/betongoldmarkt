#!/bin/bash
# DIETRICH OS — Email Patch Deploy Script
# Applies R-001 + R-002 email replacements and pushes to main
# Run this from your LOCAL betongoldmarkt repository root.
# -----------------------------------------------------------
# Usage: bash apply_and_push.sh
# -----------------------------------------------------------

set -e

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
if [ -z "$REPO_ROOT" ]; then
  echo "❌ Not inside a git repository. Run this from the betongoldmarkt repo root."
  exit 1
fi

echo "=== DIETRICH OS — R-001 + R-002 Email Patch ==="
echo "Repo: $REPO_ROOT"
echo ""

# Safety: confirm we are in the right repo
REMOTE=$(git remote get-url origin 2>/dev/null)
if [[ "$REMOTE" != *"betongoldmarkt"* ]]; then
  echo "❌ Remote does not match betongoldmarkt: $REMOTE"
  echo "   Aborting — wrong repository."
  exit 1
fi

# Safety: working tree must be clean before we start
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "❌ Working tree is not clean. Commit or stash your changes first."
  git status --short
  exit 1
fi

echo "✅ Repo and working tree confirmed clean."
echo ""

# ── R-001: Replace Kapital email on Markt legal pages (2 files) ─────────────
echo "→ Applying R-001: info@betongoldkapital.de → invest@betongoldmarkt.de"
sed -i '' 's/info@betongoldkapital\.de/invest@betongoldmarkt.de/g' impressum/index.html 2>/dev/null \
  || sed -i 's/info@betongoldkapital\.de/invest@betongoldmarkt.de/g' impressum/index.html
sed -i '' 's/info@betongoldkapital\.de/invest@betongoldmarkt.de/g' datenschutz/index.html 2>/dev/null \
  || sed -i 's/info@betongoldkapital\.de/invest@betongoldmarkt.de/g' datenschutz/index.html

R001=$(grep -c "invest@betongoldmarkt\.de" impressum/index.html datenschutz/index.html | awk -F: '{sum+=$2} END{print sum}')
echo "   ✅ R-001 complete — $R001 occurrences confirmed in 2 files"

# ── R-002: Replace Proton.me email in JSON-LD schema (48 files) ─────────────
echo "→ Applying R-002: info.betongoldmarkt@proton.me → invest@betongoldmarkt.de"
find . -name "*.html" ! -path "./.git/*" -exec \
  sed -i '' 's/info\.betongoldmarkt@proton\.me/invest@betongoldmarkt.de/g' {} + 2>/dev/null \
  || find . -name "*.html" ! -path "./.git/*" -exec \
  sed -i 's/info\.betongoldmarkt@proton\.me/invest@betongoldmarkt.de/g' {} +

R002=$(grep -rl "invest@betongoldmarkt\.de" --include="*.html" . | wc -l | tr -d ' ')
echo "   ✅ R-002 complete — invest@betongoldmarkt.de present in $R002 files"

# ── Verification ─────────────────────────────────────────────────────────────
echo ""
echo "=== Post-patch verification ==="
OLD1=$(grep -r "info@betongoldkapital\.de" --include="*.html" . | wc -l | tr -d ' ')
OLD2=$(grep -r "info\.betongoldmarkt@proton\.me" --include="*.html" . | wc -l | tr -d ' ')
UNTOUCHED=$(grep -r "local@domain\.tld" --include="*.html" . | wc -l | tr -d ' ')

echo "   info@betongoldkapital.de remaining    : $OLD1  (must be 0)"
echo "   info.betongoldmarkt@proton.me remaining: $OLD2  (must be 0)"
echo "   invest@betongoldmarkt.de present       : $R002  (must be 50)"
echo "   local@domain.tld untouched             : $UNTOUCHED  (must be 1)"

if [ "$OLD1" != "0" ] || [ "$OLD2" != "0" ] || [ "$R002" != "50" ] || [ "$UNTOUCHED" != "1" ]; then
  echo ""
  echo "❌ Verification FAILED — not committing. Check counts above."
  exit 1
fi

echo "   ✅ All checks passed."

# ── Stage and commit ─────────────────────────────────────────────────────────
echo ""
echo "=== Staging and committing ==="
git add -A
CHANGED=$(git diff --cached --name-only | wc -l | tr -d ' ')
echo "   Files staged: $CHANGED"

git commit -m "fix(email): replace proton.me and kapital email with invest@betongoldmarkt.de across all pages"
echo "   ✅ Committed."

# ── Push ─────────────────────────────────────────────────────────────────────
echo ""
echo "=== Pushing to origin/main ==="
git push origin main
echo "   ✅ Pushed. Netlify deploy will trigger automatically."
echo ""
echo "=== DONE ==="
echo "Netlify site: https://betongoldmarkt.de"
echo "Monitor deploy: https://app.netlify.com/projects/starlit-tanuki-a7840c"
