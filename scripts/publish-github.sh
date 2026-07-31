#!/usr/bin/env bash
set -euo pipefail

REPOSITORY="${1:-yizhe21803/nebula-capsules}"
VISIBILITY="${2:-public}"

if [[ "$VISIBILITY" != "public" && "$VISIBILITY" != "private" ]]; then
  echo "Usage: ./scripts/publish-github.sh [owner/repo] [public|private]" >&2
  exit 2
fi

command -v git >/dev/null 2>&1 || { echo "git is required" >&2; exit 1; }
command -v gh >/dev/null 2>&1 || { echo "GitHub CLI (gh) is required" >&2; exit 1; }
gh auth status >/dev/null

if [[ ! -d .git ]]; then
  git init -b main
fi

git add .
if ! git diff --cached --quiet; then
  git commit -m "feat: initial open-source release"
fi

if gh repo view "$REPOSITORY" >/dev/null 2>&1; then
  echo "Repository already exists: $REPOSITORY"
  if ! git remote get-url origin >/dev/null 2>&1; then
    git remote add origin "https://github.com/${REPOSITORY}.git"
  fi
  git push -u origin main
else
  gh repo create "$REPOSITORY" "--${VISIBILITY}" --source=. --remote=origin --push \
    --description "Interactive WebGL cosmic fluid materials inside fixed capsule cards."
fi

echo "Published: https://github.com/${REPOSITORY}"
