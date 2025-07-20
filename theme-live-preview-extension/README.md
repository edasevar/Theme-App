# Theme Live Preview Extension

A VS Code extension that provides live preview and editing of VS Code themes with CSS conversion capabilities.

## Features

- 🎨 **Live Theme Preview**: Real-time preview of VS Code themes
- 📝 **CSS Editor**: Edit theme CSS with live updates
- 🔄 **Theme Loading**: Load themes from `.json` and `.vsix` files
- 🎯 **Color Palette**: Visual color palette extraction
- 📤 **CSS Export**: Export themes as CSS files
- 🔧 **CSS Tools**: Format and minify CSS

## Usage

### Opening the Live Preview

1. Open Command Palette (`Ctrl+Shift+P`)
2. Run "Open Theme Live Preview"
3. A side panel will open with the live preview interface

### Loading a Theme

**Method 1: Command Palette**
1. Run "Load Theme File" 
2. Select a `.json` or `.vsix` theme file

**Method 2: Context Menu**
1. Right-click on a `.json` or `.vsix` file in Explorer
2. Select "Load Theme File"

**Method 3: From Preview Panel**
1. Click "Load Sample Theme" for a quick demo
2. Or use the theme loading commands

### Live Editing

- The CSS editor on the left shows the extracted theme CSS
- Edit the CSS in real-time and see changes instantly
- The preview panel shows syntax highlighting and color swatches
- Use Format/Minify buttons to clean up CSS

### Exporting

1. Load a theme first
2. Make any desired edits
3. Run "Export CSS" from Command Palette
4. Choose location to save the CSS file

## Supported File Formats

- **JSON Theme Files**: Direct VS Code theme files
- **VSIX Packages**: VS Code extension packages containing themes

## Example Workflow

1. Download a theme from VS Code Marketplace (`.vsix` file)
2. Open the Theme Live Preview panel
3. Load the `.vsix` file
4. See the theme converted to CSS instantly
5. Edit colors and styles in real-time
6. Export the customized CSS for use in web projects

## Commands

- `themeLivePreview.openPreview` - Open Theme Live Preview
- `themeLivePreview.loadTheme` - Load Theme File  
- `themeLivePreview.exportCSS` - Export CSS

## Installation

1. Copy this extension folder to your VS Code extensions directory
2. Reload VS Code
3. The extension will be active and ready to use

## Development

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch for changes
npm run watch
```

## Requirements

- VS Code version 1.60.0 or higher
- Node.js for running the extension

## Release Notes

### 0.0.1

- Initial release
- Basic theme loading and CSS conversion
- Live preview with syntax highlighting
- CSS export functionality
- Support for JSON and VSIX theme files
