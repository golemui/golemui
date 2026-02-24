#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Navigate to the project root directory
# This ensures the script can be run from anywhere within the project
cd "$(dirname "$0")/.."

echo "Building applications..."
npx nx run appetizer:build --base=appetizer
npx nx run material:build --base=material
npx nx run theming:build --base=theming
npx nx run tiny:build --base=tiny

echo "Ensuring the docs/public directory exists..."
mkdir -p docs/public/

echo "Copying previously built applications to docs/public..."
cp -R dist/apps/appetizer docs/public/
cp -R dist/apps/material docs/public/
cp -R dist/apps/theming docs/public/
cp -R dist/apps/tiny docs/public/

echo "Build and copy completely successfully! 🎉"
