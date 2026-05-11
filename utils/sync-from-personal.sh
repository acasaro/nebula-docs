#!/usr/bin/env bash
# sync-from-personal.sh
#
# Sync the public personal repo (acasaro/nebula-docs) into the enterprise
# repo as a single commit authored by the local git user. Run from the
# work machine, inside the enterprise repo clone, on main.
#
# Usage:  ./utils/sync-from-personal.sh "commit message"
#
# Full runbook + fallback (diff/apply path):  .claude/sync-from-personal.md

set -euo pipefail

PERSONAL_URL="https://github.com/acasaro/nebula-docs.git"

if [ $# -lt 1 ] || [ -z "$1" ]; then
  echo "Usage: $0 \"commit message\"" >&2
  exit 1
fi

COMMIT_MSG="$1"

# Must be inside a git repo
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo "Error: not inside a git repository" >&2
  exit 1
fi

# Working tree must be clean — read-tree --reset -u would clobber edits silently
if [ -n "$(git status --porcelain)" ]; then
  echo "Error: working tree has uncommitted changes. Commit or stash them first." >&2
  git status --short >&2
  exit 1
fi

# Land on a clean main
git checkout main
git pull origin main

# Idempotent remote setup
if git remote get-url personal > /dev/null 2>&1; then
  git remote set-url personal "$PERSONAL_URL"
else
  git remote add personal "$PERSONAL_URL"
fi
git fetch personal main

# Swap working tree + index to exactly match personal/main.
# HEAD stays on enterprise main, so the next commit lands there.
git read-tree --reset -u personal/main

echo
echo "=== Changes staged from personal/main ==="
git status --short
echo
echo "Commit message: $COMMIT_MSG"
echo

read -r -p "Proceed with commit + push to origin main? [y/N] " ans
if [[ "$ans" != "y" && "$ans" != "Y" ]]; then
  echo "Aborted. To revert: git read-tree --reset -u HEAD" >&2
  git remote remove personal
  exit 1
fi

git commit -m "$COMMIT_MSG"
git push origin main
git remote remove personal

echo
echo "Done. Synced enterprise main from $PERSONAL_URL"
