# Zaelot Developer Studio - Scripts

## Available Scripts

### install-zaelot.sh
Auto-installer script for team members. Clones the repository, installs dependencies, builds the application, and creates shortcuts.

**Usage:**
```bash
curl -fsSL https://raw.githubusercontent.com/Zaelot-Inc/zaelot-developer-studio/main/scripts/install-zaelot.sh | bash
```

### package-zaelot.sh
Packaging script for creating distribution packages for different platforms.

**Usage:**
```bash
./scripts/package-zaelot.sh [platform]
# Platforms: darwin, win32, linux, all
```

### build-zaelot.sh
Build script for development and production builds.

**Usage:**
```bash
./scripts/build-zaelot.sh
./scripts/build-zaelot.sh --production
```

## Installation Steps

1. Clone repository
2. Install dependencies: `npm install`
3. Build application: `npm run compile`
4. Run application: `./scripts/code.sh`

## Claude Setup

1. Get API key from https://console.anthropic.com
2. Open Command Palette (Cmd/Ctrl + Shift + P)
3. Search: "Configure Claude API Key"
4. Paste API key

## Support

- Internal Slack: #zaelot-dev-studio
- Email: dev-tools@zaelot.com
