#!/bin/bash
set -e

echo "=== GitHub Upload Script for Skincare Content Factory ==="
echo ""

# Check if git is available and working
if command -v git >/dev/null 2>&1 && git --version >/dev/null 2>&1; then
    echo "✅ Git is available. Using git commands..."
    git init
    git config user.name "tuoiunnie"
    git config user.email "tuoiunnie@example.com"
    git add .
    git commit -m "Initial commit - Skincare Content Factory"
    echo "Enter your GitHub repository URL (e.g., https://github.com/username/repo-name.git):"
    read repo_url
    git remote add origin "$repo_url"
    git push -u origin main
else
    echo "❌ Git not available. Using manual method..."
    echo ""
    echo "=== MANUAL GITHUB UPLOAD STEPS ==="
    echo ""
    echo "1. Go to https://github.com/new"
    echo "2. Create a new repository (public)"
    echo "3. Name it: skincare-content-factory"
    echo "4. DON'T initialize with README, .gitignore, or license"
    echo "5. Click 'Create repository'"
    echo ""
    echo "6. Upload the ZIP file:"
    echo "   - Drag and drop 'skincare-content-factory.zip' to GitHub"
    echo "   - Or click 'uploading an existing file' and select the ZIP"
    echo ""
    echo "7. After upload completes, click 'Commit changes'"
    echo ""
    echo "8. Your code is now on GitHub!"
    echo ""
    echo "=== NEXT: Deploy to Railway ==="
    echo "Run: ./deploy-railway.sh"
    echo ""
    echo "Or follow DEPLOY.md for manual steps"
fi

echo ""
echo "🎉 Setup complete! Your app will be live soon."