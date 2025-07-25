# 🎨 Theme Live Preview Extension

[![VS Code](https://img.shields.io/badge/VS%20Code-1.102.0+-blue.svg)](https://code.visualstudio.com/)
[![Version](https://img.shields.io/badge/version-2.0.0-green.svg)](https://github.com/edasevar/Theme-App)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A powerful VS Code extension for **live previewing, editing,1 and exporting** custom themes. Transform any VS Code theme with real-time editing, advanced color tools, and comprehensive export options.

## ✨ Features

🎨 **Live Theme Preview** - See changes instantly as you edit  
✏️ **Advanced Value Editor** - Smart suggestions, color pickers, and validation  
🗂️ **Theme Database** - Browse 80+ theme elements with descriptions and examples  
🧭 **Element Navigation** - Jump to any property and see what it controls  
📤 **Multi-format Export** - Save as CSS, JSON, or VSIX packages  
🤖 **AI Theme Generation** - Create themes from descriptions  
🎲 **Random Theme Generator** - Generate beautiful color combinations  
🎯 **Startup Menu** - Choose your workflow with an intuitive interface  

## 🚀 Quick Start

1. **Install**: Package and install the extension
   ```bash
   vsce package
   code --install-extension theme-live-preview-2.0.0.vsix
   ```

2. **Activate**: Open Command Palette (`Ctrl+Shift+P`) and run:
   ```
   Theme Live Preview: Show Startup Menu
   ```

3. **Choose Workflow**:
   - 🆕 Create new theme from template
   - 🎯 Edit your current VS Code theme
   - 📂 Import existing theme files
   - 🤖 Generate with AI or randomization

4. **Edit & Preview**: Make changes and see updates instantly

5. **Export**: Save as CSS, JSON, or VSIX for distribution

## 📖 Usage Guide

### Startup Menu Options

When you activate the extension, choose from these workflows:

| Option | Description |
|--------|-------------|
| **🆕 Make New Theme** | Start with ELEMENTS.jsonc template (238+ properties) |
| **🎯 Use Current Theme** | Export and edit your active VS Code theme |
| **📋 Choose Theme** | Select from installed themes |
| **📄 Insert JSON/JSONC** | Load theme from .json/.jsonc files |
| **📦 Insert VSIX File** | Import from VS Code extension packages |
| **🎨 Insert CSS File** | Convert CSS to VS Code theme format |
| **🎲 Randomize Theme** | Generate random color combinations |
| **🤖 AI-Generated Theme** | Create from natural language descriptions |

### Advanced Editing Tools

#### Value Editor
- **Live Preview**: Changes apply in real-time
- **Color Picker**: Visual color selection with swatches
- **Smart Suggestions**: Context-aware color recommendations
- **Value Comparison**: Compare current vs original values
- **Reset Options**: Easily restore defaults

#### Theme Database
- **Search**: Find elements by keyword or category
- **Browse**: Explore 80+ elements across 15+ categories
- **Examples**: See exactly what each property controls
- **Navigation**: Jump directly to UI elements in VS Code

#### Export Options
- **CSS Export**: Clean, formatted CSS for web projects
- **JSON Export**: VS Code theme files with metadata
- **VSIX Export**: Complete extension packages ready for installation

## 🛠️ Commands

Access these commands through the Command Palette (`Ctrl+Shift+P`):

### Core Commands
- `Theme Live Preview: Show Startup Menu` - Main workflow interface
- `Theme Live Preview: Open Sidebar` - Theme editing sidebar
- `Theme Live Preview: Open Value Editor` - Advanced property editor

### Database Commands
- `Theme Database: Search Theme Database` - Find elements by keyword
- `Theme Database: Browse Elements by Category` - Explore by component
- `Theme Database: Show Random Element` - Discover for inspiration
- `Theme Database: Generate Sample Theme` - Create from base colors

### Import/Export Commands
- `Theme Live Preview: Load Theme` - Import JSON/VSIX files
- `Theme Live Preview: Export CSS` - Export as CSS
- `Theme Live Preview: Export JSON` - Export as JSON theme
- `Theme Live Preview: Create VSIX` - Package as extension

## 🏗️ Development

### Prerequisites

- VS Code 1.102.0 or higher
- Node.js 14.x or higher
- npm package manager

### Setup
```bash
# Clone the repository
git clone https://github.com/edasevar/Theme-App.git
cd theme-live-preview-extension

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch for changes during development
npm run watch

# Package the extension
npm run package

# Install locally for testing
npm run install-local
```

### Project Structure
```
theme-live-preview-extension/
├── src/
│   ├── extension.ts              # Main extension entry point
│   ├── previewPanel.ts           # Live preview panel
│   ├── sidebarProvider.ts        # Theme editing sidebar
│   ├── valueEditorProvider.ts    # Advanced value editor
│   ├── navigationProvider.ts     # Element navigation
│   ├── startupMenuProvider.ts    # Startup menu interface
│   ├── databaseUtils.ts          # Theme database utilities
│   └── themeExtractor.ts         # Theme extraction logic
├── themes/
│   ├── TEMPLATE.jsonc            # Complete theme template
│   └── rave1-dark-theme.json     # Example theme
├── out/                          # Compiled JavaScript output
├── package.json                  # Extension manifest
└── tsconfig.json                 # TypeScript configuration
```

### Available Scripts
```bash
npm run compile      # Compile TypeScript
npm run watch        # Watch mode for development
npm run lint         # Type checking without output
npm run package      # Create VSIX package
npm run install-local # Install locally for testing
```

## 🔧 Technical Details

### Supported File Formats
- **JSON**: Direct VS Code theme files
- **JSONC**: JSON with comments (VS Code format)
- **VSIX**: VS Code extension packages
- **CSS**: Web stylesheets (with conversion)

### Theme Database Coverage
- **80+ Elements** across all VS Code UI components
- **15+ Categories**: Editor, Activity Bar, Sidebar, Status Bar, etc.
- **Complete Documentation**: Each property includes description and examples
- **Visual Examples**: See exactly what each property affects

### Export Capabilities
- **CSS**: Clean, web-ready stylesheets
- **JSON**: Valid VS Code theme files with metadata
- **VSIX**: Complete extension packages with manifests

## 🐛 Troubleshooting

### Common Issues

**Extension not loading:**
- Ensure VS Code version is 1.60.0+
- Reload window: `Ctrl+Shift+P` → "Developer: Reload Window"
- Check extension is enabled in Extensions panel

**Theme not loading:**
- Verify file format (supported: .json, .jsonc, .vsix)
- Check file permissions and accessibility
- Try with a different theme file

**Export issues:**
- Ensure write permissions to target directory
- Check available disk space
- Try exporting to a different location

**Performance issues:**
- Close unused preview panels
- Restart VS Code if memory usage is high
- Clear extension cache by reloading window

### Getting Help
1. Check this README for solutions
2. Open an issue on [GitHub](https://github.com/edasevar/Theme-App/issues)
3. Include VS Code version, error messages, and steps to reproduce

## 📝 Changelog

### Version 1.0.0
- ✅ Complete theme loading and CSS conversion
- ✅ Live preview with syntax highlighting
- ✅ Advanced value editor with color picker
- ✅ Theme database with 80+ documented elements
- ✅ Multi-format export (CSS, JSON, VSIX)
- ✅ AI and random theme generation
- ✅ Comprehensive startup menu interface
- ✅ Element navigation and examples
- ✅ Error handling and user feedback

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

### How to Contribute
1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Submit a pull request with a clear description

### Development Guidelines
- Follow TypeScript best practices
- Add tests for new features
- Update documentation for API changes
- Ensure all existing tests pass

## 🌟 Support

If you find this extension helpful:
- ⭐ Star the repository on GitHub
- 🐛 Report bugs and issues
- 💡 Suggest new features
- 📢 Share with other developers
- 📝 Write a review in the VS Code Marketplace

## 🔗 Links

- [GitHub Repository](https://github.com/edasevar/Theme-App)
- [Issue Tracker](https://github.com/edasevar/Theme-App/issues)
- [VS Code API Documentation](https://code.visualstudio.com/api)
- [Theme Color Reference](https://code.visualstudio.com/api/references/theme-color)

---

Made with ❤️ for the VS Code community

**Enjoy creating beautiful themes with Theme Live Preview!**
