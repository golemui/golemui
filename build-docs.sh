#!/usr/bin/env bash
set -e

# --- Parse arguments ---
SKIP_INSTALL=false

for arg in "$@"; do
  case $arg in
    --skip-install)
      SKIP_INSTALL=true
      shift
      ;;
    *)
      shift
      ;;
  esac
done

echo "Cleaning previous builds..."
rm -rf dist
rm -rf docs/public

echo "Building docs-template (Nx)..."
npx nx run docs-template:build

echo "Copying build from dist/apps/docs-template to docs/public..."
mkdir -p docs/public
cp -r dist/apps/docs-template/* docs/public/

cd docs

if [ "$SKIP_INSTALL" = true ]; then
  echo "Skipping dependency installation (--skip-install)"
else
  echo "Installing Starlight dependencies..."
  npm ci
fi

echo "🚀 Building Starlight docs..."
npm run build

cd -

echo "✅ Docs build complete!"
