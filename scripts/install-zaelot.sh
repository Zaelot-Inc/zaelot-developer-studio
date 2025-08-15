#!/bin/bash
# Zaelot Developer Studio Auto-Installer

set -e

echo "Zaelot Developer Studio Auto-Installer"
echo "======================================"

# Configuration
REPO_URL="https://github.com/Zaelot-Inc/zaelot-developer-studio.git"
INSTALL_DIR="$HOME/zaelot-developer-studio"

# Check Node.js
if ! command -v node &> /dev/null; then
	echo "Error: Node.js not found"
	echo "Please install Node.js 18+ from https://nodejs.org"
	exit 1
fi

echo "Node.js $(node -v) found"

# Check Git
if ! command -v git &> /dev/null; then
	echo "Error: Git not found"
	echo "Please install Git from https://git-scm.com"
	exit 1
fi

echo "Git found"

# Clone repository
echo "Cloning repository..."
if [ -d "$INSTALL_DIR" ]; then
	echo "Directory exists. Updating..."
	cd "$INSTALL_DIR"
	git pull origin main
else
	git clone "$REPO_URL" "$INSTALL_DIR"
	cd "$INSTALL_DIR"
fi

echo "Repository ready"

# Install dependencies
echo "Installing dependencies..."
npm install

echo "Dependencies installed"

# Build application
echo "Building application..."
npm run compile

echo "Application built"

# Create shell alias
SHELL_RC=""
if [ -f "$HOME/.zshrc" ]; then
	SHELL_RC="$HOME/.zshrc"
elif [ -f "$HOME/.bashrc" ]; then
	SHELL_RC="$HOME/.bashrc"
elif [ -f "$HOME/.bash_profile" ]; then
	SHELL_RC="$HOME/.bash_profile"
fi

if [ -n "$SHELL_RC" ]; then
	echo "" >> "$SHELL_RC"
	echo "# Zaelot Developer Studio" >> "$SHELL_RC"
	echo "alias zaelot='cd $INSTALL_DIR && ./scripts/code.sh'" >> "$SHELL_RC"
	echo "Shell alias 'zaelot' created"
fi

echo ""
echo "Installation completed successfully!"
echo ""
echo "How to start Zaelot Developer Studio:"
echo "  Command line: zaelot"
echo "  Direct:       cd $INSTALL_DIR && ./scripts/code.sh"
echo ""
echo "Remember to restart your terminal to use the 'zaelot' command"
echo ""
echo "Claude AI Setup:"
echo "1. Get your API key from: https://console.anthropic.com"
echo "2. Run Zaelot Developer Studio"
echo "3. Press Cmd/Ctrl + Shift + P"
echo "4. Search for: Configure Claude API Key"
echo "5. Paste your API key"
echo ""
echo "Enjoy coding with Claude AI!"
