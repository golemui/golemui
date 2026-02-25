#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Navigate to the project root directory
# This ensures the script can be run from anywhere within the project
cd "$(dirname "$0")/.."

echo "Building CSS..."
npx npx sass libs/shared-vanilla/src/styles/index.scss dist/libs/shared-vanilla/lib/styles/index.css
npx npx sass libs/shared-vanilla/src/styles/themes/clay.scss dist/libs/shared-vanilla/lib/styles/themes/clay.css

echo "Build and copy completely successfully! 🎉"
