#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# P0 PUBLIC BOUNDARY BUILD  (DUAL-BRAND-P0-PRODUCTION-STABILIZATION-002)
#
# Produces a clean deployment directory (_public) from an EXPLICIT ALLOWLIST.
# The source repository is never modified. Nothing is deleted from source.
#
# A file is copied into _public only if BOTH hold:
#   (1) it matches an ALLOW rule  (extension allowlist, or exact filename), AND
#   (2) it does NOT match a DENY_PATH rule (explicit, enumerated).
#
# Everything not on the allowlist is excluded BY CONSTRUCTION, not by blacklist.
# DENY_PATH exists only for paths whose extension is allowed but which are
# internal (e.g. admin/config surfaces, duplicated subtrees, function source).
#
# Netlify:
#   publish   = "_public"            <- only this directory is served
#   functions = "netlify/functions"  <- resolved from the repo root, OUTSIDE _public
# ---------------------------------------------------------------------------
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/_public"
CONF="$ROOT/tools/public-allowlist.conf"

[ -f "$CONF" ] || { echo "FATAL: missing $CONF"; exit 1; }

# shellcheck disable=SC1090
. "$CONF"

rm -rf "$OUT"
mkdir -p "$OUT"

copied=0
skipped=0

is_denied() {
  local p="$1" d
  for d in "${DENY_PATH[@]}"; do
    case "$p" in
      "$d"|"$d"/*) return 0 ;;
    esac
  done
  return 1
}

is_allowed() {
  local p="$1" base ext a
  base="${p##*/}"
  for a in "${ALLOW_FILENAME[@]}"; do
    [ "$base" = "$a" ] && return 0
  done
  case "$base" in
    *.*) ext="$(printf '%s' "${base##*.}" | tr '[:upper:]' '[:lower:]')" ;;
    *)   return 1 ;;
  esac
  for a in "${ALLOW_EXT[@]}"; do
    [ "$ext" = "$a" ] && return 0
  done
  return 1
}

while IFS= read -r -d '' abs; do
  rel="${abs#"$ROOT"/}"
  case "$rel" in _public/*) continue ;; esac
  if is_denied "$rel" || ! is_allowed "$rel"; then
    skipped=$((skipped+1)); continue
  fi
  mkdir -p "$OUT/$(dirname "$rel")"
  cp -p "$abs" "$OUT/$rel"
  copied=$((copied+1))
done < <(find "$ROOT" -type f -print0)

echo "P0 public build complete: $copied copied, $skipped excluded -> $OUT"
