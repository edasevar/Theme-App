# Rave1 Dark Theme & Theme Live Preview Extension

A complete VS Code theme package featuring the **Rave1 Dark Theme** with neon color enhancements, plus a powerful theme editor extension for creating, editing, and exporting VS Code themes.

## 🎨 What's Included

### 1. Rave1 Dark Theme
A professionally crafted dark theme featuring:
- **238 UI color properties** with distinct neon color palette
- **15+ color families** for maximum visual distinction
- **43 syntax highlighting rules** for code readability
- **24 semantic token scopes** for modern language features
- Optimized for reduced eye strain and enhanced productivity

### 2. Theme Live Preview Extension
A comprehensive VS Code extension for theme development:
- **Live theme preview** with real-time editing
- **Multi-format support** (JSON, JSONC, VSIX)
- **CSS export** for web projects
- **VSIX packaging** for theme distribution
- **Enhanced theme extractor** with full element support

## 🚀 Installation

### Install the Rave1 Dark Theme
```bash
code --install-extension output/rave1-dark-theme.vsix
```

### Install the Theme Editor Extension  
```bash
code --install-extension theme-live-preview-0.0.1.vsix
```

### Activate the Theme
1. Open Command Palette (`Ctrl+Shift+P`)
2. Search "Preferences: Color Theme"
3. Select "Rave1 Dark Theme"

## ✨ Features

### Rave1 Dark Theme Features
- 🌈 **Neon Color Palette**: Vibrant, eye-catching colors for better code distinction
- 🎯 **Semantic Highlighting**: Advanced token coloring for modern languages
- 📊 **Chart Colors**: Distinct colors for data visualization (orange, green, purple)
- 🔧 **UI Enhancement**: Optimized workbench colors for improved navigation
- 🎪 **Activity Bar**: Bright accent colors for easy sidebar identification

### Extension Features
- 🎨 **Live Theme Preview**: Real-time preview of theme changes
- 📝 **Theme Editor**: Edit themes with comprehensive UI controls
- 🔄 **Theme Loading**: Load themes from multiple file formats
- 📤 **Export Options**: CSS, VSIX, and JSON export capabilities
- 🛠️ **Enhanced Extractor**: Advanced theme processing and conversion

## 📁 File Structure

```
📦 Complete Package
├── 🎨 theme-live-preview-0.0.1.vsix     (121.6 KB) - Extension
├── 📱 output/rave1-dark-theme.vsix      (4.2 KB)   - Theme Package
├── 🎛️ output/rave1-dark-theme.css       (18.6 KB)  - CSS Export
├── 📄 output/rave1-dark-theme.json      (17.9 KB)  - Clean Theme
├── ⚙️ enhanced_theme_extractor.js       (13.4 KB)  - Extraction Tool
└── 🧹 mytheme-clean.json               (16.2 KB)  - Source Theme
```

## 🎯 Usage

### Using the Rave1 Dark Theme
1. Install the theme VSIX
2. Activate it through VS Code's theme selector
3. Enjoy the enhanced coding experience

### Using the Theme Editor Extension

#### Opening the Theme Editor
- **Command Palette**: `Ctrl+Shift+P` → "Open Theme Live Preview"
- **Sidebar**: Click the Theme Editor icon in the activity bar
- **Explorer**: Right-click theme files → "Load Theme File"

#### Editing Themes
1. Load an existing theme (JSON, JSONC, or VSIX)
2. Use the comprehensive sidebar editor with 15+ categories:
   - Editor Core, Syntax Highlighting, UI Colors
   - Activity Bar, Sidebar, Status Bar, Terminal
   - Lists, Inputs, Buttons, Charts, Extensions
3. See changes in real-time preview
4. Export in multiple formats

#### Creating Theme Packages
1. Edit your theme using the extension
2. Use "Create VSIX Package" to generate installable extension
3. Use "Export CSS" for web project integration
4. Use "Export Complete Theme" for multiple output formats

## 🛠️ Enhanced Theme Extractor

The included `enhanced_theme_extractor.js` tool provides:

### Command Line Usage
```bash
# Extract theme to CSS and VSIX
node enhanced_theme_extractor.js mytheme.json ./output

# Extract only CSS
node enhanced_theme_extractor.js mytheme.json ./output --css-only

# Extract only VSIX  
node enhanced_theme_extractor.js mytheme.json ./output --vsix-only
```

### Programmatic Usage
```javascript
const EnhancedVSCodeThemeExtractor = require('./enhanced_theme_extractor');

const extractor = new EnhancedVSCodeThemeExtractor();
const result = await extractor.extractTheme('theme.json', { 
    generateCSS: true, 
    generateVSIX: true 
});
```

### Supported Features
- ✅ JSON and JSONC theme files
- ✅ VSIX package extraction
- ✅ CSS custom properties generation
- ✅ Semantic token processing
- ✅ TextMate token rules
- ✅ VSIX package creation
- ✅ Complete element list support

## 🎨 Color Palette

The Rave1 Dark Theme features a carefully curated neon color palette:

### Primary Colors
- **Editor Background**: `#000000` (Pure black)
- **Text**: `#f6fcfc` (Cool white)
- **Accent**: `#f904cc` (Bright magenta)
- **Highlight**: `#e4f403` (Electric yellow)

### Syntax Colors
- **Keywords**: `#6644ff` (Purple)
- **Strings**: `#ff0080` (Hot pink)
- **Numbers**: `#80ff00` (Bright green)
- **Functions**: `#ffff00` (Yellow)
- **Comments**: `#6d6d6d` (Dark gray)

### UI Elements
- **Activity Bar**: Neon green highlights
- **Sidebar**: Magenta borders and cyan text
- **Status Bar**: Clean monochrome design
- **Terminal**: Full ANSI color support

## 🔧 Development

### Building the Extension
```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch for changes
npm run watch

# Package extension
npm run package
```

### Building Theme Packages
```bash
# Create complete package
node create_theme_package.js

# View package summary
node package_summary.js

# Clean JSONC files
node clean_jsonc.js
```

## 📋 Requirements

- **VS Code**: Version 1.60.0 or higher
- **Node.js**: For theme extraction and packaging
- **TypeScript**: For extension development

## 🎯 Commands

### Theme Editor Commands
- `themeLivePreview.openPreview` - Open theme editor
- `themeLivePreview.loadTheme` - Load theme file
- `themeLivePreview.exportCSS` - Export CSS
- `themeLivePreview.createVSIX` - Create VSIX package
- `themeLivePreview.exportTheme` - Export complete theme

### Quick Actions
- **Load Theme**: Right-click JSON/JSONC/VSIX files
- **Sidebar Access**: Activity bar icon for quick access
- **Command Palette**: All commands available via `Ctrl+Shift+P`

## 📊 Theme Statistics

- **UI Colors**: 238 workbench properties
- **Token Rules**: 43 syntax highlighting rules  
- **Semantic Tokens**: 24 modern language scopes
- **Color Families**: 15+ distinct color groups
- **Chart Colors**: 6 data visualization colors
- **Terminal Colors**: Full 16-color ANSI support

## 🌟 Highlights

### Visual Enhancements
- **Neon Accent Colors**: Eye-catching highlights for better navigation
- **Distinct Syntax Colors**: Each code element has a unique, memorable color
- **Reduced Eye Strain**: Carefully chosen contrast ratios
- **Professional Appearance**: Clean, modern aesthetic

### Developer Experience
- **Enhanced Readability**: Clear distinction between code elements
- **Improved Navigation**: Bright UI accents for quick orientation
- **Modern Language Support**: Semantic highlighting for TypeScript, React, etc.
- **Consistent Theming**: Unified color scheme across all VS Code panels

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with the theme editor extension
5. Submit a pull request

## 📄 License

This project is open source. Feel free to use, modify, and distribute.

## 🎉 Credits

Created with the Theme Live Preview Extension toolkit. Features comprehensive theme editing, multi-format export, and professional packaging capabilities.

---

**Enjoy coding with the Rave1 Dark Theme! 🌈✨**
