# 🎨 Theme Live Preview Extension

A powerful VS Code extension that provides **live preview** and **real-time editing** of VS Code themes with advanced CSS conversion capabilities. Transform any VS Code theme into customizable CSS for web projects or theme development.

[![VS Code](https://img.shields.io/badge/VS%20Code-1.60.0+-blue)](https://code.visualstudio.com/)
[![Version](https://img.shields.io/badge/version-0.0.1-orange)](package.json)

## ✨ Features

- 🎨 **Live Theme Preview**: Real-time preview of VS Code themes with instant feedback
- 📝 **CSS Editor**: Edit theme CSS with live updates and syntax highlighting
- 🔄 **Smart Theme Loading**: Load themes from `.json` and `.vsix` files seamlessly
- 🎯 **Color Palette Extraction**: Visual color palette with hex codes and swatches
- 📤 **CSS Export**: Export customized themes as clean, formatted CSS files
- 🔧 **Advanced CSS Tools**: Format, minify, and optimize CSS output
- ⚡ **Performance Optimized**: Fast loading and responsive UI
- 🌈 **Multi-format Support**: Works with JSON themes and VSIX packages

## 🚀 Quick Start

### Installation

**Option 1: From VSIX Package (Recommended)**
```bash
# Package the extension
vsce package

# Install the generated VSIX file
code --install-extension theme-live-preview-0.0.1.vsix
```

**Option 2: Development Installation**
```bash
# Clone and install dependencies
npm install

# Compile TypeScript
npm run compile

# Package and install
vsce package
code --install-extension theme-live-preview-0.0.1.vsix
```

**Option 3: Development Mode**
1. Open the extension folder in VS Code
2. Press `F5` to launch Extension Development Host
3. Test the extension in the new window

## 📖 Usage Guide

### Opening the Live Preview

1. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Search and run **"Open Theme Live Preview"**
3. A side panel will open with the live preview interface

### Loading a Theme

#### Method 1: Command Palette

1. Run **"Load Theme File"** from Command Palette
2. Select a `.json` or `.vsix` theme file from the file picker

#### Method 2: Context Menu

1. Right-click on a `.json` or `.vsix` file in Explorer
2. Select **"Load Theme File"** from the context menu

#### Method 3: From Preview Panel

1. Click **"Load Sample Theme"** for a quick demo
2. Or use the theme loading commands from the panel

### 🎛️ Live Editing & Customization

- **Real-time CSS Editor**: The left panel shows extracted theme CSS
- **Instant Preview**: Edit CSS and see changes immediately in the preview
- **Syntax Highlighting**: Full VS Code syntax highlighting in preview
- **Color Swatches**: Visual representation of all theme colors
- **CSS Tools**: Use Format/Minify buttons to clean up your CSS
- **Undo/Redo**: Full editing history with keyboard shortcuts

### 📤 Exporting Your Work

1. Load and customize a theme to your liking
2. Run **"Export CSS"** from Command Palette
3. Choose the destination folder
4. Get a clean, formatted CSS file ready for web use

## 🎯 Supported File Formats

| Format | Description | Use Case |
|--------|-------------|----------|
| **`.json`** | Direct VS Code theme files | Custom themes, downloaded themes |
| **`.vsix`** | VS Code extension packages | Marketplace themes, bundled themes |

## 💡 Example Workflow

```mermaid
graph TD
    A[Download Theme from Marketplace] --> B[Open Theme Live Preview]
    B --> C[Load .vsix/.json File]
    C --> D[Preview Theme in Real-time]
    D --> E[Edit CSS Colors & Styles]
    E --> F[Export Customized CSS]
    F --> G[Use in Web Projects]
```

### Step-by-step Example

1. **Download** a theme from VS Code Marketplace (`.vsix` file)
2. **Open** the Theme Live Preview panel (`Ctrl+Shift+P` → "Open Theme Live Preview")
3. **Load** the `.vsix` file using the context menu or command
4. **See** the theme instantly converted to CSS with live preview
5. **Edit** colors, fonts, and styles in real-time
6. **Export** the customized CSS for your web projects

## ⚙️ Available Commands

| Command | ID | Description |
|---------|----|-----------  |
| **Open Theme Live Preview** | `themeLivePreview.openPreview` | Opens the main preview panel |
| **Load Theme File** | `themeLivePreview.loadTheme` | Load a theme from `.json` or `.vsix` file |
| **Export CSS** | `themeLivePreview.exportCSS` | Export current theme as CSS file |

### Keyboard Shortcuts

- `Ctrl+Shift+P` → Type "Theme Live Preview" for quick access
- `F1` → Alternative to open Command Palette
- Standard VS Code shortcuts work in the CSS editor

## 🛠️ Development & Contributing

### Prerequisites

- **VS Code** version 1.60.0 or higher
- **Node.js** 14.x or higher
- **npm** or **yarn** package manager

### Development Setup

```bash
# Clone the repository
git clone <repository-url>
cd theme-live-preview-extension

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch for changes during development
npm run watch

# Package the extension
vsce package
```

### Project Structure

```
theme-live-preview-extension/
├── src/
│   ├── extension.ts          # Main extension entry point
│   ├── previewPanel.ts       # Preview panel logic
│   └── themeExtractor.ts     # Theme extraction utilities
├── package.json              # Extension manifest
├── tsconfig.json            # TypeScript configuration
└── README.md               # This file
```

### Building and Testing

```bash
# Compile TypeScript
npm run compile

# Run tests (if available)
npm test

# Package for distribution
vsce package

# Install locally for testing
code --install-extension theme-live-preview-0.0.1.vsix
```

## 📋 System Requirements

- **VS Code**: 1.60.0 or higher
- **Node.js**: Required for extension development
- **Operating System**: Windows, macOS, or Linux
- **Memory**: Minimum 4GB RAM recommended
- **Storage**: ~50KB for extension files

## 🔧 Troubleshooting

### Common Issues

**Extension not loading:**
- Ensure VS Code version is 1.60.0+
- Reload VS Code window (`Ctrl+Shift+P` → "Reload Window")
- Check if extension is enabled in Extensions panel

**Theme not loading:**
- Verify file format (`.json` or `.vsix`)
- Check file permissions
- Try loading a different theme file

**CSS export issues:**
- Ensure you have write permissions to target folder
- Check available disk space
- Try exporting to a different location

### Getting Help

1. Check this README for common solutions
2. Open an issue on the GitHub repository
3. Include VS Code version and error messages

## 📝 Release Notes

### Version 0.0.1 (Current)

**🎉 Initial Release Features:**
- ✅ Basic theme loading and CSS conversion
- ✅ Live preview with syntax highlighting  
- ✅ CSS export functionality
- ✅ Support for JSON and VSIX theme files
- ✅ Real-time CSS editing capabilities
- ✅ Color palette extraction
- ✅ CSS formatting and minification tools

**🔮 Planned Features:**
- Theme comparison mode
- Custom color picker integration
- Batch theme processing
- Advanced CSS optimization
- Theme marketplace integration

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 🌟 Support

If you find this extension helpful, please consider:

- ⭐ Starring the repository
- 🐛 Reporting bugs and issues
- 💡 Suggesting new features
- 📢 Sharing with other developers

---

Made with ❤️ for the VS Code community
