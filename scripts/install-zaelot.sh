#!/bin/bash
# Zaelot Developer Studio Auto-Installer
# One-command installation for the team

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Zaelot Developer Studio Auto-Installer${NC}"
echo -e "${BLUE}===========================================${NC}"
echo ""

# Configuration
REPO_URL="https://github.com/Zaelot-Inc/zaelot-developer-studio.git"
INSTALL_DIR="$HOME/zaelot-developer-studio"
DESKTOP_FILE="$HOME/Desktop/Zaelot Developer Studio.desktop"

# Functions
check_requirements() {
    echo -e "${YELLOW}🔍 Checking requirements...${NC}"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js not found${NC}"
        echo -e "${YELLOW}Please install Node.js 18+ from https://nodejs.org${NC}"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    echo -e "${GREEN}✅ Node.js $NODE_VERSION found${NC}"
    
    # Check Git
    if ! command -v git &> /dev/null; then
        echo -e "${RED}❌ Git not found${NC}"
        echo -e "${YELLOW}Please install Git from https://git-scm.com${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Git found${NC}"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm not found${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ npm found${NC}"
}

clone_repository() {
    echo -e "${YELLOW}📥 Cloning repository...${NC}"
    
    if [ -d "$INSTALL_DIR" ]; then
        echo -e "${YELLOW}⚠️  Directory exists. Updating...${NC}"
        cd "$INSTALL_DIR"
        git pull origin main
    else
        git clone "$REPO_URL" "$INSTALL_DIR"
        cd "$INSTALL_DIR"
    fi
    
    echo -e "${GREEN}✅ Repository ready${NC}"
}

install_dependencies() {
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    echo -e "${YELLOW}This may take several minutes...${NC}"
    
    npm install
    
    echo -e "${GREEN}✅ Dependencies installed${NC}"
}

build_application() {
    echo -e "${YELLOW}🔨 Building application...${NC}"
    echo -e "${YELLOW}This may take several minutes...${NC}"
    
    npm run compile
    
    echo -e "${GREEN}✅ Application built${NC}"
}

create_shortcuts() {
    echo -e "${YELLOW}🔗 Creating shortcuts...${NC}"
    
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
        echo -e "${GREEN}✅ Shell alias 'zaelot' created${NC}"
    fi
    
    # Create desktop launcher (Linux)
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        cat > "$DESKTOP_FILE" << EOF
[Desktop Entry]
Name=Zaelot Developer Studio
Comment=AI-powered development environment with Claude integration
Exec=$INSTALL_DIR/scripts/code.sh
Icon=$INSTALL_DIR/resources/linux/code.png
Terminal=false
Type=Application
Categories=Development;IDE;
EOF
        chmod +x "$DESKTOP_FILE"
        echo -e "${GREEN}✅ Desktop launcher created${NC}"
    fi
    
    # Create dock entry (macOS)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo -e "${YELLOW}📌 To add to dock: Drag the app from Applications to Dock${NC}"
    fi
}

setup_claude() {
    echo -e "${YELLOW}🤖 Claude AI Setup${NC}"
    echo ""
    echo -e "${BLUE}To complete setup:${NC}"
    echo -e "1. Get your Claude API key from: ${YELLOW}https://console.anthropic.com${NC}"
    echo -e "2. Run Zaelot Developer Studio"
    echo -e "3. Press ${YELLOW}Cmd/Ctrl + Shift + P${NC}"
    echo -e "4. Search for: ${YELLOW}Configure Claude API Key${NC}"
    echo -e "5. Paste your API key"
    echo ""
}

# Main installation process
main() {
    check_requirements
    clone_repository
    install_dependencies
    build_application
    create_shortcuts
    setup_claude
    
    echo ""
    echo -e "${GREEN}🎉 Installation completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}How to start Zaelot Developer Studio:${NC}"
    echo -e "  ${YELLOW}Command line:${NC} zaelot"
    echo -e "  ${YELLOW}Direct:${NC}       cd $INSTALL_DIR && ./scripts/code.sh"
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo -e "  ${YELLOW}Desktop:${NC}      Click the desktop icon"
    fi
    
    echo ""
    echo -e "${YELLOW}⚠️  Remember to restart your terminal to use the 'zaelot' command${NC}"
    echo ""
    echo -e "${BLUE}Enjoy coding with Claude AI! 🚀${NC}"
}

# Run installation
main
