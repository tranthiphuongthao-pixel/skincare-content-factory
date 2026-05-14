#!/bin/bash
set -e

REMOTE_URL="$1"
if [ -z "$REMOTE_URL" ]; then
  echo "Usage: ./setup-github.sh https://github.com/<user>/<repo>.git"
  exit 1
fi

echo "→ Initializing git..."
git init

echo "→ Staging files..."
git add .

echo "→ Committing..."
git commit -m "Initial commit"

echo "→ Adding remote: $REMOTE_URL"
git remote add origin "$REMOTE_URL"

echo "→ Pushing to main..."
git branch -M main
git push -u origin main

echo "✓ Done! Repo pushed to $REMOTE_URL"
