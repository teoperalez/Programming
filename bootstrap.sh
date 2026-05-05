#!/usr/bin/env bash
# Clone every project listed in repos.json into the current directory.
# Idempotent: existing clones are fetched + checked out to the target branch.
#
# Usage:
#   ./bootstrap.sh                   # clone into the script's directory
#   ROOT=~/Programming ./bootstrap.sh
#   USE_SSH=1 ./bootstrap.sh         # rewrite https remotes to git@github.com
#   SKIP_EXISTING=1 ./bootstrap.sh   # skip folders that already exist
#
# Requires: git, jq

set -euo pipefail

# Avoid the GITHUB_TOKEN issue documented in GTPUSH.md.
unset GITHUB_TOKEN || true

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
MANIFEST="$SCRIPT_DIR/repos.json"
ROOT="${ROOT:-$SCRIPT_DIR}"
USE_SSH="${USE_SSH:-0}"
SKIP_EXISTING="${SKIP_EXISTING:-0}"

if [[ ! -f "$MANIFEST" ]]; then
  echo "repos.json not found next to bootstrap.sh (looked in $SCRIPT_DIR)" >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required (install via 'brew install jq' or 'apt install jq')" >&2
  exit 1
fi

mkdir -p "$ROOT"
ROOT="$(cd "$ROOT" && pwd)"
echo "Bootstrapping into: $ROOT"

ok=0
skipped=0
failed=()

# Read repos as TSV: folder<TAB>remote<TAB>branch
while IFS=$'\t' read -r folder remote branch; do
  if [[ "$USE_SSH" == "1" ]]; then
    remote="${remote/https:\/\/github.com\//git@github.com:}"
  fi

  echo ""
  echo "=== $folder [$branch] ==="

  dest="$ROOT/$folder"

  if [[ -d "$dest/.git" ]]; then
    if [[ "$SKIP_EXISTING" == "1" ]]; then
      echo "  exists, skipping"
      skipped=$((skipped+1))
      continue
    fi
    echo "  exists, fetching + checking out $branch"
    if (cd "$dest" && git fetch --all --prune && git checkout "$branch" && git pull --ff-only); then
      ok=$((ok+1))
    else
      echo "  FAILED" >&2
      failed+=("$folder")
    fi
    continue
  fi

  mkdir -p "$(dirname "$dest")"
  if git clone --branch "$branch" "$remote" "$dest"; then
    ok=$((ok+1))
  else
    echo "  FAILED" >&2
    failed+=("$folder")
  fi
done < <(jq -r '.repos[] | [.folder, .remote, .branch] | @tsv' "$MANIFEST")

echo ""
echo "===== Summary ====="
echo "  OK:      $ok"
echo "  Skipped: $skipped"
echo "  Failed:  ${#failed[@]}"
if [[ ${#failed[@]} -gt 0 ]]; then
  printf '    - %s\n' "${failed[@]}" >&2
  exit 1
fi

skip_count=$(jq '.skipped | length' "$MANIFEST")
if [[ "$skip_count" -gt 0 ]]; then
  echo ""
  echo "Manifest also lists these intentionally-skipped folders (NOT cloned):"
  jq -r '.skipped[] | "  - \(.folder)  (\(.reason))"' "$MANIFEST"
fi
