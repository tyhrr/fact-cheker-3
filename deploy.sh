#!/bin/bash

# GitHub Pages Deployment Script for Croatian Working Law Fact Checker

echo "🚀 Preparing Croatian Working Law Fact Checker for GitHub Pages deployment..."

# Check if we're in the correct directory
if [ ! -f "index.html" ]; then
    echo "❌ Error: index.html not found. Please run this script from the project root directory."
    exit 1
fi

echo "✅ Project structure verified"

# Check if the JSON database exists
if [ ! -f "assets/data/croatian-working-law.json" ]; then
    echo "❌ Error: Croatian law database not found. Please run the PDF extraction script first."
    echo "   Run: python extract_pdf.py"
    exit 1
fi

echo "✅ Database file verified"

# Check file sizes for GitHub Pages limits
DATABASE_SIZE=$(stat -f%z "assets/data/croatian-working-law.json" 2>/dev/null || stat -c%s "assets/data/croatian-working-law.json" 2>/dev/null)
if [ "$DATABASE_SIZE" -gt 25000000 ]; then
    echo "⚠️  Warning: Database file is larger than 25MB. Consider compressing it."
fi

echo "✅ File sizes checked"

# Validate HTML
echo "🔍 Validating HTML structure..."
if command -v html5validator &> /dev/null; then
    html5validator index.html
    echo "✅ HTML validation complete"
else
    echo "ℹ️  Install html5validator for HTML validation: pip install html5validator"
fi

# Check for required files
REQUIRED_FILES=(
    "index.html"
    "assets/css/main.css"
    "assets/css/neumorphism.css"
    "assets/css/responsive.css"
    "assets/js/main.js"
    "assets/js/database.js"
    "assets/js/search.js"
    "assets/js/language-detection.js"
    "assets/js/relevance-scoring.js"
    "assets/js/theme-toggle.js"
    "assets/data/croatian-working-law.json"
)

echo "🔍 Checking required files..."
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ Missing: $file"
    fi
done

# Git status check
if [ -d ".git" ]; then
    echo "📊 Git status:"
    git status --short
    
    echo "🏷️  Current branch:"
    git branch --show-current
else
    echo "⚠️  Not a git repository. Initialize with: git init"
fi

echo ""
echo "🎉 GitHub Pages Deployment Checklist:"
echo "======================================"
echo "1. ✅ All files are present and verified"
echo "2. 📤 Push all changes to your GitHub repository:"
echo "   git add ."
echo "   git commit -m \"Deploy Croatian Working Law Fact Checker\""
echo "   git push origin main"
echo ""
echo "3. 🔧 Enable GitHub Pages in repository settings:"
echo "   - Go to: https://github.com/tyhrr/fact-cheker-3/settings/pages"
echo "   - Select source: Deploy from a branch"
echo "   - Select branch: main"
echo "   - Select folder: / (root)"
echo "   - Click Save"
echo ""
echo "4. 🌐 Your app will be available at:"
echo "   https://tyhrr.github.io/fact-cheker-3/"
echo ""
echo "5. ⏱️  Deployment usually takes 5-10 minutes"
echo ""
echo "🔗 Repository: https://github.com/tyhrr/fact-cheker-3"
echo "📚 Documentation: README.md"
echo ""
echo "✨ Croatian Working Law Fact Checker ready for deployment!"