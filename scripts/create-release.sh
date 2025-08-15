#!/bin/bash
# Zaelot Developer Studio Release Creator
# Creates a new release with all distribution files

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🏷️  Zaelot Developer Studio Release Creator${NC}"
echo -e "${BLUE}============================================${NC}"

# Configuration
VERSION_TYPE="$1"
CURRENT_VERSION=$(node -e "console.log(require('./package.json').version)")
RELEASE_NOTES_FILE="RELEASE_NOTES.md"

if [ -z "$VERSION_TYPE" ]; then
    echo -e "${YELLOW}Usage: $0 [patch|minor|major]${NC}"
    echo -e "${YELLOW}Current version: $CURRENT_VERSION${NC}"
    exit 1
fi

# Functions
bump_version() {
    echo -e "${YELLOW}📈 Bumping version ($VERSION_TYPE)...${NC}"
    
    npm version "$VERSION_TYPE" --no-git-tag-version
    NEW_VERSION=$(node -e "console.log(require('./package.json').version)")
    
    echo -e "${GREEN}✅ Version bumped: $CURRENT_VERSION → $NEW_VERSION${NC}"
}

update_changelog() {
    echo -e "${YELLOW}📝 Updating changelog...${NC}"
    
    if [ ! -f "CHANGELOG.md" ]; then
        cat > CHANGELOG.md << EOF
# Changelog

All notable changes to Zaelot Developer Studio will be documented in this file.

## [Unreleased]

## [$NEW_VERSION] - $(date +%Y-%m-%d)

### Added
- New release $NEW_VERSION

### Changed
- Updated dependencies

### Fixed
- Bug fixes and improvements

EOF
    else
        # Add new version to existing changelog
        sed -i.bak "s/## \[Unreleased\]/## [Unreleased]\n\n## [$NEW_VERSION] - $(date +%Y-%m-%d)\n\n### Added\n- New release $NEW_VERSION\n\n### Changed\n- Updated dependencies\n\n### Fixed\n- Bug fixes and improvements/" CHANGELOG.md
        rm CHANGELOG.md.bak
    fi
    
    echo -e "${GREEN}✅ Changelog updated${NC}"
}

create_release_notes() {
    echo -e "${YELLOW}📋 Creating release notes...${NC}"
    
    cat > "$RELEASE_NOTES_FILE" << EOF
# Zaelot Developer Studio v$NEW_VERSION

## 🚀 What's New

### ✨ Features
- Enhanced Claude AI integration
- Improved performance and stability
- Better error handling and user experience

### 🐛 Bug Fixes
- Fixed various UI issues
- Improved Claude API connection reliability
- Enhanced code completion accuracy

### 🔧 Technical Improvements
- Updated dependencies to latest versions
- Optimized build process
- Enhanced security measures

## 📦 Installation

### Quick Install (Recommended)
\`\`\`bash
curl -fsSL https://raw.githubusercontent.com/Zaelot-Inc/zaelot-developer-studio/main/scripts/install-zaelot.sh | bash
\`\`\`

### Manual Install
\`\`\`bash
git clone https://github.com/Zaelot-Inc/zaelot-developer-studio.git
cd zaelot-developer-studio
npm install
npm run compile
./scripts/code.sh
\`\`\`

## 🤖 Claude AI Setup

1. Get your API key from [console.anthropic.com](https://console.anthropic.com)
2. Open Zaelot Developer Studio
3. Press \`Cmd/Ctrl + Shift + P\`
4. Search: "Configure Claude API Key"
5. Paste your API key and start coding!

## 📋 System Requirements

- **Node.js**: 18.x or higher
- **OS**: macOS 10.15+, Windows 10+, Ubuntu 18.04+
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 2GB free space

## 🔗 Links

- [Setup Guide](https://github.com/Zaelot-Inc/zaelot-developer-studio/blob/main/SETUP.md)
- [Distribution Guide](https://github.com/Zaelot-Inc/zaelot-developer-studio/blob/main/DISTRIBUTION.md)
- [Issue Tracker](https://github.com/Zaelot-Inc/zaelot-developer-studio/issues)

## 💬 Support

- **Slack**: #zaelot-dev-studio
- **Email**: dev-tools@zaelot.com

---

**Full Changelog**: [v$CURRENT_VERSION...v$NEW_VERSION](https://github.com/Zaelot-Inc/zaelot-developer-studio/compare/v$CURRENT_VERSION...v$NEW_VERSION)
EOF

    echo -e "${GREEN}✅ Release notes created${NC}"
}

build_packages() {
    echo -e "${YELLOW}🔨 Building release packages...${NC}"
    
    # Clean previous builds
    rm -rf dist/
    
    # Build production version
    npm run compile-build
    
    # Create simple release package
    mkdir -p dist/release
    
    # Create source package
    echo -e "${YELLOW}📦 Creating source package...${NC}"
    git archive --format=tar.gz --prefix="zaelot-developer-studio-$NEW_VERSION/" HEAD > "dist/release/zaelot-developer-studio-$NEW_VERSION-source.tar.gz"
    
    # Create checksums
    cd dist/release
    sha256sum * > checksums.txt
    cd ../..
    
    echo -e "${GREEN}✅ Packages built${NC}"
}

commit_and_tag() {
    echo -e "${YELLOW}🏷️  Creating git tag...${NC}"
    
    # Commit version bump and changelog
    git add package.json CHANGELOG.md "$RELEASE_NOTES_FILE"
    git commit -m "chore: release v$NEW_VERSION

- Bump version to $NEW_VERSION
- Update changelog
- Add release notes"
    
    # Create annotated tag
    git tag -a "v$NEW_VERSION" -m "Zaelot Developer Studio v$NEW_VERSION

$(cat $RELEASE_NOTES_FILE)"
    
    echo -e "${GREEN}✅ Git tag created: v$NEW_VERSION${NC}"
}

push_release() {
    echo -e "${YELLOW}🚀 Pushing release...${NC}"
    
    # Push commits and tags
    git push origin "$(git branch --show-current)"
    git push origin "v$NEW_VERSION"
    
    echo -e "${GREEN}✅ Release pushed to GitHub${NC}"
}

create_github_release() {
    echo -e "${YELLOW}📊 Creating GitHub release...${NC}"
    
    if command -v gh &> /dev/null; then
        # Create release using GitHub CLI
        gh release create "v$NEW_VERSION" \
            --title "Zaelot Developer Studio v$NEW_VERSION" \
            --notes-file "$RELEASE_NOTES_FILE" \
            --draft \
            dist/release/*
        
        echo -e "${GREEN}✅ GitHub release created (draft)${NC}"
        echo -e "${YELLOW}💡 Review and publish the release on GitHub${NC}"
    else
        echo -e "${YELLOW}⚠️  GitHub CLI not found. Create release manually:${NC}"
        echo -e "1. Go to: https://github.com/Zaelot-Inc/zaelot-developer-studio/releases/new"
        echo -e "2. Tag: v$NEW_VERSION"
        echo -e "3. Title: Zaelot Developer Studio v$NEW_VERSION"
        echo -e "4. Upload files from: dist/release/"
        echo -e "5. Copy notes from: $RELEASE_NOTES_FILE"
    fi
}

# Main release process
main() {
    echo -e "${BLUE}Creating release v$NEW_VERSION...${NC}"
    echo ""
    
    bump_version
    update_changelog
    create_release_notes
    build_packages
    commit_and_tag
    push_release
    create_github_release
    
    echo ""
    echo -e "${GREEN}🎉 Release v$NEW_VERSION created successfully!${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo -e "1. Review the draft release on GitHub"
    echo -e "2. Test the installation process"
    echo -e "3. Publish the release when ready"
    echo -e "4. Announce to the team"
    echo ""
    echo -e "${BLUE}Installation command for team:${NC}"
    echo -e "${YELLOW}curl -fsSL https://raw.githubusercontent.com/Zaelot-Inc/zaelot-developer-studio/main/scripts/install-zaelot.sh | bash${NC}"
}

# Run release creation
bump_version
main
