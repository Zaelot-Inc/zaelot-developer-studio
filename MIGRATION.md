# Migration Guide: From VS Code/Cursor to Zaelot Developer Studio

Welcome to Zaelot Developer Studio! This guide will help you migrate your settings, extensions, and configurations from Visual Studio Code or Cursor.

## Quick Start

The easiest way to get started is to use our built-in migration command:

1. **Open Command Palette**: `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (macOS)
2. **Search for**: "Import from VS Code / Cursor"
3. **Select the command** and follow the guided prompts

## Manual Migration

If you prefer to migrate manually, here are the locations of your existing settings:

### VS Code Locations

**macOS:**

```
~/Library/Application Support/Code/
├── User/
│   ├── settings.json          # User settings
│   ├── keybindings.json       # Keyboard shortcuts
│   └── snippets/              # Code snippets
└── extensions/                # Installed extensions
```

**Windows:**

```
%APPDATA%\Code\
├── User\
│   ├── settings.json          # User settings
│   ├── keybindings.json       # Keyboard shortcuts
│   └── snippets\              # Code snippets
└── extensions\                # Installed extensions
```

**Linux:**

```
~/.config/Code/
├── User/
│   ├── settings.json          # User settings
│   ├── keybindings.json       # Keyboard shortcuts
│   └── snippets/              # Code snippets
└── extensions/                # Installed extensions
```

### Cursor Locations

**macOS:**

```
~/Library/Application Support/Cursor/
├── User/
│   ├── settings.json          # User settings
│   ├── keybindings.json       # Keyboard shortcuts
│   └── snippets/              # Code snippets
└── extensions/                # Installed extensions
```

**Windows:**

```
%APPDATA%\Cursor\
├── User\
│   ├── settings.json          # User settings
│   ├── keybindings.json       # Keyboard shortcuts
│   └── snippets\              # Code snippets
└── extensions\                # Installed extensions
```

**Linux:**

```
~/.config/Cursor/
├── User/
│   ├── settings.json          # User settings
│   ├── keybindings.json       # Keyboard shortcuts
│   └── snippets/              # Code snippets
└── extensions/                # Installed extensions
```

### Zaelot Developer Studio Locations

Your new Zaelot Developer Studio files will be stored in:

**macOS:**

```
~/Library/Application Support/.zaelot-dev-studio/
├── User/
│   ├── settings.json          # User settings
│   ├── keybindings.json       # Keyboard shortcuts
│   └── snippets/              # Code snippets
└── extensions/                # Installed extensions
```

**Windows:**

```
%APPDATA%\.zaelot-dev-studio\
├── User\
│   ├── settings.json          # User settings
│   ├── keybindings.json       # Keyboard shortcuts
│   └── snippets\              # Code snippets
└── extensions\                # Installed extensions
```

**Linux:**

```
~/.config/.zaelot-dev-studio/
├── User/
│   ├── settings.json          # User settings
│   ├── keybindings.json       # Keyboard shortcuts
│   └── snippets/              # Code snippets
└── extensions/                # Installed extensions
```

## Step-by-Step Manual Migration

### 1. Copy Settings

1. **Locate your source settings file** (see locations above)
2. **Copy the contents** of `settings.json`
3. **Open Zaelot Developer Studio**
4. **Go to**: File → Preferences → Settings (or `Ctrl+,`)
5. **Click the "Open Settings (JSON)" icon** in the top right
6. **Paste your settings** into the Zaelot settings file

### 2. Copy Keyboard Shortcuts

1. **Copy your `keybindings.json`** from the source location
2. **In Zaelot Developer Studio**: File → Preferences → Keyboard Shortcuts
3. **Click the "Open Keyboard Shortcuts (JSON)" icon**
4. **Paste your keybindings**

### 3. Copy Code Snippets

1. **Copy all files** from your source `snippets/` folder
2. **Navigate to** Zaelot's `snippets/` folder (see locations above)
3. **Paste all snippet files**

### 4. Reinstall Extensions

Unfortunately, extensions need to be reinstalled in Zaelot Developer Studio:

1. **Get your extension list** from VS Code/Cursor:

   ```bash
   # For VS Code
   code --list-extensions > my-extensions.txt

   # For Cursor (if available)
   cursor --list-extensions > my-extensions.txt
   ```

2. **Install extensions in Zaelot Developer Studio**:
   - Open Extensions view (`Ctrl+Shift+X`)
   - Search for each extension by name
   - Install them manually

## Key Differences

### New Features in Zaelot Developer Studio

- **Native Claude AI Integration**: Built-in AI assistance powered by Claude
- **Enhanced Chat Interface**: Dedicated AI chat panel for code discussions
- **Zaelot Branding**: Custom theme and visual elements

### Settings to Update

After migration, you may want to configure:

1. **Claude AI API Key**:

   - Command Palette → "Configure Claude API Key"
   - Add your Anthropic API key

2. **Zaelot-specific Settings**:
   ```json
   {
   	"claude.apiKey": "your-api-key-here",
   	"claude.model": "claude-3-sonnet-20240229",
   	"claude.maxTokens": 4096
   }
   ```

## Troubleshooting

### Common Issues

1. **Extensions not working**: Some extensions may need to be updated or replaced
2. **Theme differences**: Zaelot includes custom Zaelot branding themes
3. **Settings conflicts**: Some VS Code-specific settings may not apply

### Getting Help

- **Command Palette**: `Ctrl+Shift+P` → "Import from VS Code / Cursor"
- **Documentation**: Check the built-in Help → Getting Started
- **Support**: Contact your Zaelot team administrator

## Tips for a Smooth Transition

1. **Start with a backup**: Always backup your original settings before migrating
2. **Migrate gradually**: Start with settings, then extensions, then customizations
3. **Test thoroughly**: Verify that your most-used features work as expected
4. **Explore new features**: Take advantage of Claude AI integration and other Zaelot features

---

**Welcome to Zaelot Developer Studio!** 🚀

Your AI-powered development environment is ready to enhance your coding experience with Claude AI integration.
