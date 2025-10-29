#!/usr/bin/env bash
set -e

echo "🧹 Cleaning previous builds..."
rm -rf dist/apps/docs-template

echo "🏗️  Building docs-template..."
npx nx run docs-template:build

echo "📦 Copying build from dist/apps/docs-template to docs/public..."
rm -rf docs/public
mkdir -p docs/public
cp -r dist/apps/docs-template/* docs/public/

echo "🚀 Building Starlight docs..."
cd docs
npm run build
cd -

echo "✅ Done!"
