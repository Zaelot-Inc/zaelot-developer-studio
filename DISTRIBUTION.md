# Zaelot Developer Studio - Distribution Guide

## Distribution Options

### Option 1: Simple Installation (Recommended)

**For team members who want a quick setup:**

```bash
curl -fsSL https://raw.githubusercontent.com/Zaelot-Inc/zaelot-developer-studio/main/scripts/install-zaelot.sh | bash
```

### Option 2: Manual Installation

**For developers who want control:**

```bash
git clone https://github.com/Zaelot-Inc/zaelot-developer-studio.git
cd zaelot-developer-studio
npm install
npm run compile
./scripts/code.sh
```

### Option 3: Pre-built Packages

**For IT deployment (when available):**

- **macOS**: `.dmg` installer
- **Windows**: `.exe` installer
- **Linux**: `.deb` package or AppImage

## Quick Start for Team Members

### 1-Command Install

```bash
# Install Zaelot Developer Studio
curl -fsSL https://raw.githubusercontent.com/Zaelot-Inc/zaelot-developer-studio/main/scripts/install-zaelot.sh | bash

# Start the application
zaelot
```

### After Installation

1. **Get Claude API Key**: Visit [console.anthropic.com](https://console.anthropic.com)
2. **Configure in Studio**: Press `Cmd/Ctrl + Shift + P` → "Configure Claude API Key"
3. **Start Coding**: Open any project and chat with Claude!

## Building Distribution Packages

### Prerequisites

- Node.js 18+
- Git
- Platform-specific tools (optional):
  - **macOS**: Xcode Command Line Tools, `create-dmg`
  - **Windows**: Visual Studio Build Tools
  - **Linux**: `appimagetool`, `fpm`

### Build Commands

```bash
# Build for current platform
./scripts/package-zaelot.sh

# Build for specific platform
./scripts/package-zaelot.sh darwin   # macOS
./scripts/package-zaelot.sh win32    # Windows
./scripts/package-zaelot.sh linux    # Linux

# Build for all platforms
./scripts/package-zaelot.sh all
```

## IT Department Deployment

### Mass Deployment Options

#### Option A: GitHub Releases

1. Create a new release on GitHub
2. Attach pre-built packages
3. Team downloads from releases page

#### Option B: Internal Server

1. Host the auto-installer script
2. Customize for internal network
3. Deploy via company tools

#### Option C: Package Managers

- **macOS**: Homebrew cask (custom tap)
- **Windows**: Chocolatey package
- **Linux**: Custom APT/RPM repository

### Example: Custom Internal Script

```bash
#!/bin/bash
# Custom installer for Zaelot internal network
INTERNAL_REPO="https://git.zaelot.com/zaelot-developer-studio.git"
curl -fsSL https://git.zaelot.com/install-zaelot.sh | bash
```

## Security Considerations

### For Distribution

- All packages signed with company certificates
- Checksums provided for verification
- No external dependencies on build
- Source code audit completed

### For Users

- API keys stored securely in system keychain
- No telemetry sent to external servers
- All Claude communication encrypted (HTTPS)
- Local-only operation (no data leaves device)

## Monitoring Usage

### Analytics (Optional)

Track internal usage without compromising privacy:

```javascript
// Optional analytics configuration
{
  "telemetry.telemetryLevel": "off",      // Disable MS telemetry
  "claude.analytics": "internal-only",    // Track only internal usage
  "claude.reportErrors": false            // No error reporting to Anthropic
}
```

## Updates & Maintenance

### Auto-Update System

```bash
# Check for updates
zaelot --check-updates

# Update to latest version
zaelot --update

# Or manual update
cd ~/zaelot-developer-studio
git pull origin main
npm install
npm run compile
```

### Release Schedule

- **Major Updates**: Quarterly (new Claude models, major features)
- **Minor Updates**: Monthly (bug fixes, improvements)
- **Security Updates**: As needed (immediate deployment)

## Troubleshooting Distribution

### Common Issues

#### "Command not found: zaelot"

```bash
# Restart terminal or run:
source ~/.zshrc  # or ~/.bashrc
```

#### "npm install fails"

```bash
# Clear cache and retry
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### "Claude not responding"

```bash
# Check API key configuration
zaelot --check-claude
# Or reconfigure
# Cmd/Ctrl + Shift + P → "Configure Claude API Key"
```

#### "Build fails on Mac"

```bash
# Install Xcode Command Line Tools
xcode-select --install
```

## Support

### Internal Support Channels

- **Slack**: #zaelot-dev-studio
- **Email**: dev-tools@zaelot.com
- **Issues**: [GitHub Issues](https://github.com/Zaelot-Inc/zaelot-developer-studio/issues)

### Escalation Process

1. **Level 1**: Team members help each other (#zaelot-dev-studio)
2. **Level 2**: Development team (dev-tools@zaelot.com)
3. **Level 3**: External consultant (critical issues only)

---

## Deployment Checklist

### Before Company-Wide Rollout

- [ ] Beta testing with development team (2 weeks)
- [ ] Security audit completed
- [ ] IT approval for network access
- [ ] Training materials prepared
- [ ] Support process established
- [ ] Rollback plan prepared

### During Rollout

- [ ] Monitor installation success rate
- [ ] Track Claude API usage
- [ ] Collect feedback from early adopters
- [ ] Adjust based on user feedback

### After Rollout

- [ ] Regular usage monitoring
- [ ] Quarterly satisfaction surveys
- [ ] Performance optimization
- [ ] Plan next features based on usage patterns

---

**Ready to transform your development workflow with AI? 🚀**
