#!/bin/bash
# Zaelot Developer Studio Packaging Script

set -e

echo "Zaelot Developer Studio - Packaging Script"
echo "=========================================="

PRODUCT_NAME="Zaelot Developer Studio"
VERSION=$(node -e "console.log(require('./package.json').version)")
BUILD_DIR="./dist"
PLATFORM="$1"

if [ -z "$PLATFORM" ]; then
	echo "Usage: $0 [platform]"
	echo "Platforms: darwin, win32, linux, all"
	echo "Example: $0 darwin"
	echo ""
	echo "Building for all platforms..."
	PLATFORM="all"
fi

build_macos() {
	echo "Building macOS package..."
	npm run gulp -- vscode-darwin-x64-prepare
	npm run gulp -- vscode-darwin-x64
	echo "macOS build completed"
}

build_windows() {
	echo "Building Windows package..."
	npm run gulp -- vscode-win32-x64-prepare
	npm run gulp -- vscode-win32-x64
	echo "Windows build completed"
}

build_linux() {
	echo "Building Linux package..."
	npm run gulp -- vscode-linux-x64-prepare
	npm run gulp -- vscode-linux-x64
	echo "Linux build completed"
}

# Pre-build checks
echo "Pre-build checks..."

if [ ! -f "package.json" ]; then
	echo "Error: package.json not found"
	exit 1
fi

if [ ! -d "node_modules" ]; then
	echo "Error: node_modules not found. Run 'npm install' first"
	exit 1
fi

# Build production version
echo "Building production version..."
npm run compile-build

# Create dist directory
mkdir -p "$BUILD_DIR"

# Build for requested platform(s)
if [ "$PLATFORM" = "all" ]; then
	build_macos
	build_windows
	build_linux
elif [ "$PLATFORM" = "darwin" ]; then
	build_macos
elif [ "$PLATFORM" = "win32" ]; then
	build_windows
elif [ "$PLATFORM" = "linux" ]; then
	build_linux
else
	echo "Unknown platform: $PLATFORM"
	exit 1
fi

echo ""
echo "Packaging completed successfully!"
echo "Packages available in: $BUILD_DIR"
echo ""
echo "Distribution packages for $PRODUCT_NAME v$VERSION"
echo "Remember to test on target platforms before distribution!"
