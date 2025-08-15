#!/bin/bash
# Zaelot Developer Studio Packaging Script
# Creates distribution packages for macOS, Windows, and Linux

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📦 Zaelot Developer Studio - Packaging Script${NC}"
echo -e "${BLUE}===============================================${NC}"

# Configuration
PRODUCT_NAME="Zaelot Developer Studio"
VERSION=$(node -e "console.log(require('./package.json').version)")
BUILD_DIR="./dist"
PLATFORMS=("darwin" "win32" "linux")

# Command line arguments
PLATFORM="$1"
if [ -z "$PLATFORM" ]; then
    echo -e "${YELLOW}Usage: $0 [platform]${NC}"
    echo -e "${YELLOW}Platforms: darwin, win32, linux, all${NC}"
    echo -e "${YELLOW}Example: $0 darwin${NC}"
    echo ""
    echo -e "${BLUE}Building for all platforms...${NC}"
    PLATFORM="all"
fi

# Functions
build_platform() {
    local platform=$1
    echo -e "${YELLOW}🔨 Building for ${platform}...${NC}"
    
    case $platform in
        "darwin")
            build_macos
            ;;
        "win32")
            build_windows
            ;;
        "linux")
            build_linux
            ;;
        *)
            echo -e "${RED}Unknown platform: $platform${NC}"
            exit 1
            ;;
    esac
}

build_macos() {
    echo -e "${YELLOW}🍎 Building macOS package...${NC}"
    
    # Clean and prepare
    npm run gulp -- vscode-darwin-x64-prepare
    
    # Build application
    npm run gulp -- vscode-darwin-x64
    
    # Create DMG (if available)
    if command -v create-dmg &> /dev/null; then
        echo -e "${YELLOW}📦 Creating DMG installer...${NC}"
        mkdir -p "$BUILD_DIR/macos"
        
        create-dmg \
            --volname "$PRODUCT_NAME" \
            --background "build/darwin/dmg-background.png" \
            --window-pos 200 120 \
            --window-size 800 600 \
            --icon-size 100 \
            --icon "Zaelot Developer Studio.app" 200 190 \
            --hide-extension "Zaelot Developer Studio.app" \
            --app-drop-link 600 185 \
            "$BUILD_DIR/macos/ZaelotDeveloperStudio-$VERSION.dmg" \
            ".build/darwin/Zaelot Developer Studio.app" || echo "DMG creation failed, continuing..."
    fi
    
    echo -e "${GREEN}✅ macOS build completed${NC}"
}

build_windows() {
    echo -e "${YELLOW}🪟 Building Windows package...${NC}"
    
    # Build for both architectures
    npm run gulp -- vscode-win32-x64-prepare
    npm run gulp -- vscode-win32-x64
    
    echo -e "${GREEN}✅ Windows build completed${NC}"
}

build_linux() {
    echo -e "${YELLOW}🐧 Building Linux package...${NC}"
    
    # Build for x64
    npm run gulp -- vscode-linux-x64-prepare
    npm run gulp -- vscode-linux-x64
    
    # Create AppImage if available
    if command -v appimagetool &> /dev/null; then
        echo -e "${YELLOW}📦 Creating AppImage...${NC}"
        mkdir -p "$BUILD_DIR/linux"
        # Note: This would need proper AppImage setup
        echo -e "${YELLOW}AppImage creation requires additional setup${NC}"
    fi
    
    echo -e "${GREEN}✅ Linux build completed${NC}"
}

# Pre-build checks
echo -e "${YELLOW}🔍 Pre-build checks...${NC}"

if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found${NC}"
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo -e "${RED}❌ Error: node_modules not found. Run 'npm install' first${NC}"
    exit 1
fi

# Ensure build is up to date
echo -e "${YELLOW}🔨 Building production version...${NC}"
npm run compile-build

# Create dist directory
mkdir -p "$BUILD_DIR"

# Build for requested platform(s)
if [ "$PLATFORM" = "all" ]; then
    for platform in "${PLATFORMS[@]}"; do
        build_platform "$platform"
    done
else
    build_platform "$PLATFORM"
fi

echo ""
echo -e "${GREEN}🎉 Packaging completed successfully!${NC}"
echo -e "${BLUE}📁 Packages available in: $BUILD_DIR${NC}"
echo ""
echo -e "${BLUE}Distribution packages for $PRODUCT_NAME v$VERSION${NC}"
echo -e "${YELLOW}Remember to test on target platforms before distribution!${NC}"
