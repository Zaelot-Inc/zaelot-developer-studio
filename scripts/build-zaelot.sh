#!/bin/bash
# Zaelot Developer Studio Build Script

set -e

echo "Building Zaelot Developer Studio..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
	echo "Error: package.json not found."
	exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
	echo "Error: Node.js is not installed."
	exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
	echo "Installing dependencies..."
	npm install
else
	echo "Dependencies already installed"
fi

# Clean previous build
echo "Cleaning previous build..."
npm run gulp -- clean-out

# Compile TypeScript and build extensions
echo "Compiling TypeScript..."
npm run compile

# Build for production (optional)
if [ "$1" = "--production" ] || [ "$1" = "-p" ]; then
	echo "Building production bundle..."
	npm run compile-build

	echo "Minifying..."
	npm run minify-vscode
fi

echo "Build completed successfully!"
echo "Zaelot Developer Studio is ready!"
echo ""
echo "To run the application:"
echo "  Development mode: ./scripts/code.sh"
echo "  Web mode:         ./scripts/code-web.sh"
echo ""
echo "Claude AI Integration Features:"
echo "  * Claude API client with Anthropic integration"
echo "  * Claude 3.5 Sonnet, Haiku, and Opus models"
echo "  * Chat interface with code editing capabilities"
echo "  * Configuration commands (F1 -> Configure Claude API Key)"
echo "  * Connection testing (F1 -> Test Claude Connection)"
echo ""
echo "Remember to configure your Claude API key before using!"
