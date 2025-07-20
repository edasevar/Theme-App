"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SidebarProvider = void 0;
const vscode = __importStar(require("vscode"));
const themeExtractor_1 = require("./themeExtractor");
class SidebarProvider {
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
        this._currentTheme = {};
        this.themeExtractor = new themeExtractor_1.ThemeExtractor();
    }
    resolveWebviewView(webviewView, context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        webviewView.webview.onDidReceiveMessage(async (data) => {
            try {
                switch (data.type) {
                    case 'colorChange': {
                        if (data.property && typeof data.value === 'string') {
                            this._currentTheme[data.property] = data.value;
                            this._updatePreview();
                        }
                        break;
                    }
                    case 'loadTheme': {
                        await this._loadTheme();
                        break;
                    }
                    case 'exportCSS': {
                        await this._exportCSS();
                        break;
                    }
                    case 'exportJSON': {
                        await this._exportJSON();
                        break;
                    }
                    case 'exportVSIX': {
                        await this._exportVSIX();
                        break;
                    }
                    case 'createNew': {
                        this._createNewTheme();
                        break;
                    }
                    case 'resetProperty': {
                        if (data.property && this._currentTheme[data.property]) {
                            delete this._currentTheme[data.property];
                            this._updatePreview();
                            this._refreshSidebar();
                        }
                        break;
                    }
                    default:
                        console.warn('Unknown message type:', data.type);
                }
            }
            catch (error) {
                console.error('Error handling webview message:', error);
                vscode.window.showErrorMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
        // Load default theme elements
        this._loadDefaultTheme();
    }
    _loadDefaultTheme() {
        this._currentTheme = {
            // Editor basics
            'editor.background': '#1e1e1e',
            'editor.foreground': '#d4d4d4',
            'editor.selectionBackground': '#264f78',
            'editor.lineHighlightBackground': '#2a2d2e',
            // Activity Bar
            'activityBar.background': '#2d2d30',
            'activityBar.foreground': '#ffffff',
            'activityBarBadge.background': '#007acc',
            'activityBarBadge.foreground': '#ffffff',
            // Side Bar
            'sideBar.background': '#252526',
            'sideBar.foreground': '#cccccc',
            'sideBarTitle.foreground': '#bbbbbb',
            // Status Bar
            'statusBar.background': '#007acc',
            'statusBar.foreground': '#ffffff',
            // Title Bar
            'titleBar.activeBackground': '#3c3c3c',
            'titleBar.activeForeground': '#cccccc',
            // Buttons & Controls
            'button.background': '#0e639c',
            'button.foreground': '#ffffff',
            'input.background': '#3c3c3c',
            'input.foreground': '#cccccc',
            'dropdown.background': '#3c3c3c',
            'dropdown.foreground': '#cccccc',
            // Lists
            'list.activeSelectionBackground': '#094771',
            'list.activeSelectionForeground': '#ffffff',
            'list.hoverBackground': '#2a2d2e',
            // Tabs
            'tab.activeBackground': '#1e1e1e',
            'tab.activeForeground': '#ffffff',
            'tab.inactiveBackground': '#2d2d30',
            'tab.inactiveForeground': '#969696',
            // Terminal basic colors
            'terminal.background': '#1e1e1e',
            'terminal.foreground': '#d4d4d4',
            'terminal.ansiBlack': '#000000',
            'terminal.ansiRed': '#cd3131',
            'terminal.ansiGreen': '#0dbc79',
            'terminal.ansiYellow': '#e5e510',
            'terminal.ansiBlue': '#2472c8',
            'terminal.ansiMagenta': '#bc3fbc',
            'terminal.ansiCyan': '#11a8cd',
            'terminal.ansiWhite': '#e5e5e5'
        };
        this._refreshSidebar();
    }
    _refreshSidebar() {
        if (this._view) {
            this._view.webview.postMessage({
                type: 'updateTheme',
                theme: this._currentTheme
            });
        }
    }
    _updatePreview() {
        // Send updated theme to any open preview panels
        vscode.commands.executeCommand('themeLivePreview.updatePreview', this._currentTheme);
    }
    async _loadTheme() {
        try {
            const options = {
                canSelectFiles: true,
                canSelectFolders: false,
                canSelectMany: false,
                filters: {
                    'Theme Files': ['json', 'vsix']
                }
            };
            const fileUri = await vscode.window.showOpenDialog(options);
            if (fileUri && fileUri[0]) {
                const filePath = fileUri[0].fsPath;
                console.log('Loading theme from:', filePath);
                const theme = await this.themeExtractor.extractTheme(filePath);
                const themeData = this.themeExtractor.getCurrentThemeData() || {};
                // Validate theme data
                if (typeof themeData === 'object' && themeData !== null) {
                    this._currentTheme = { ...this._currentTheme, ...themeData };
                    this._refreshSidebar();
                    this._updatePreview();
                    vscode.window.showInformationMessage('Theme loaded successfully!');
                }
                else {
                    throw new Error('Invalid theme data format');
                }
            }
        }
        catch (error) {
            console.error('Failed to load theme:', error);
            vscode.window.showErrorMessage(`Failed to load theme: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async _exportCSS() {
        try {
            if (Object.keys(this._currentTheme).length === 0) {
                vscode.window.showWarningMessage('No theme properties to export. Please load or create a theme first.');
                return;
            }
            const saveUri = await vscode.window.showSaveDialog({
                filters: { 'CSS Files': ['css'] },
                defaultUri: vscode.Uri.file('theme.css')
            });
            if (saveUri) {
                await this.themeExtractor.exportAsCSS(this._currentTheme, saveUri.fsPath);
                vscode.window.showInformationMessage(`CSS exported successfully to ${saveUri.fsPath}!`);
            }
        }
        catch (error) {
            console.error('Failed to export CSS:', error);
            vscode.window.showErrorMessage(`Failed to export CSS: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async _exportJSON() {
        try {
            if (Object.keys(this._currentTheme).length === 0) {
                vscode.window.showWarningMessage('No theme properties to export. Please load or create a theme first.');
                return;
            }
            const themeName = await vscode.window.showInputBox({
                prompt: 'Enter theme name',
                placeHolder: 'My Custom Theme',
                validateInput: (value) => {
                    if (!value || value.trim().length === 0) {
                        return 'Theme name cannot be empty';
                    }
                    if (value.length > 50) {
                        return 'Theme name too long (max 50 characters)';
                    }
                    return null;
                }
            });
            if (themeName) {
                const sanitizedName = themeName.toLowerCase().replace(/[^a-z0-9-_\s]/g, '').replace(/\s+/g, '-');
                const saveUri = await vscode.window.showSaveDialog({
                    filters: { 'JSON Files': ['json'] },
                    defaultUri: vscode.Uri.file(`${sanitizedName}-theme.json`)
                });
                if (saveUri) {
                    await this.themeExtractor.exportAsJSON(this._currentTheme, themeName, saveUri.fsPath);
                    vscode.window.showInformationMessage(`JSON theme exported successfully to ${saveUri.fsPath}!`);
                }
            }
        }
        catch (error) {
            console.error('Failed to export JSON:', error);
            vscode.window.showErrorMessage(`Failed to export JSON: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async _exportVSIX() {
        try {
            if (Object.keys(this._currentTheme).length === 0) {
                vscode.window.showWarningMessage('No theme properties to export. Please load or create a theme first.');
                return;
            }
            const themeName = await vscode.window.showInputBox({
                prompt: 'Enter theme name for VSIX package',
                placeHolder: 'My Custom Theme',
                validateInput: (value) => {
                    if (!value || value.trim().length === 0) {
                        return 'Theme name cannot be empty';
                    }
                    if (value.length > 50) {
                        return 'Theme name too long (max 50 characters)';
                    }
                    return null;
                }
            });
            if (themeName) {
                const sanitizedName = themeName.toLowerCase().replace(/[^a-z0-9-_\s]/g, '').replace(/\s+/g, '-');
                const saveUri = await vscode.window.showSaveDialog({
                    filters: { 'VSIX Files': ['vsix'] },
                    defaultUri: vscode.Uri.file(`${sanitizedName}-theme.vsix`)
                });
                if (saveUri) {
                    await this.themeExtractor.exportAsVSIX(this._currentTheme, themeName, saveUri.fsPath);
                    vscode.window.showInformationMessage(`VSIX package exported successfully to ${saveUri.fsPath}!`);
                }
            }
        }
        catch (error) {
            console.error('Failed to export VSIX:', error);
            vscode.window.showErrorMessage(`Failed to export VSIX: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    _createNewTheme() {
        try {
            this._currentTheme = {};
            this._loadDefaultTheme();
            vscode.window.showInformationMessage('New theme created with default colors!');
        }
        catch (error) {
            console.error('Failed to create new theme:', error);
            vscode.window.showErrorMessage(`Failed to create new theme: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    _getHtmlForWebview(webview) {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Theme Editor</title>
            <style>
                body {
                    margin: 0;
                    padding: 10px;
                    background: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                }
                
                .header {
                    margin-bottom: 15px;
                    padding-bottom: 10px;
                    border-bottom: 1px solid var(--vscode-widget-border);
                }
                
                .title {
                    font-size: 16px;
                    font-weight: bold;
                    margin-bottom: 10px;
                }
                
                .actions {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 5px;
                    margin-bottom: 10px;
                }
                
                .btn {
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 6px 12px;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 12px;
                    transition: background-color 0.2s;
                }
                
                .btn:hover {
                    background: var(--vscode-button-hoverBackground);
                }
                
                .btn-secondary {
                    background: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                }
                
                .btn-secondary:hover {
                    background: var(--vscode-button-secondaryHoverBackground);
                }
                
                .theme-item {
                    margin-bottom: 6px;
                    padding: 6px;
                    background: var(--vscode-input-background);
                    border-radius: 3px;
                    border: 1px solid var(--vscode-widget-border);
                    transition: background-color 0.2s;
                }
                
                .theme-item:hover {
                    background: var(--vscode-list-hoverBackground);
                }
                
                .theme-item-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 5px;
                }
                
                .theme-item-label {
                    font-size: 11px;
                    color: var(--vscode-descriptionForeground);
                    margin-bottom: 2px;
                }
                
                .theme-item-name {
                    font-size: 12px;
                    font-weight: 500;
                    color: var(--vscode-editor-foreground);
                }
                
                .color-input-container {
                    display: flex;
                    gap: 5px;
                    align-items: center;
                }
                
                .color-input {
                    width: 30px;
                    height: 20px;
                    border: none;
                    border-radius: 3px;
                    cursor: pointer;
                }
                
                .color-text {
                    flex: 1;
                    background: transparent;
                    border: 1px solid var(--vscode-widget-border);
                    color: var(--vscode-input-foreground);
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-size: 11px;
                    font-family: monospace;
                }
                
                .reset-btn {
                    background: var(--vscode-errorForeground);
                    color: white;
                    border: none;
                    padding: 2px 6px;
                    border-radius: 2px;
                    cursor: pointer;
                    font-size: 10px;
                }
                
                .reset-btn:hover {
                    opacity: 0.8;
                }
                
                .section-title {
                    font-size: 13px;
                    font-weight: 600;
                    margin: 15px 0 8px 0;
                    padding-bottom: 3px;
                    border-bottom: 1px solid var(--vscode-widget-border);
                    color: var(--vscode-editor-foreground);
                }
                
                .search-box {
                    width: 100%;
                    padding: 6px;
                    margin-bottom: 10px;
                    background: var(--vscode-input-background);
                    border: 1px solid var(--vscode-widget-border);
                    color: var(--vscode-input-foreground);
                    border-radius: 3px;
                    font-size: 12px;
                }
                
                .theme-section {
                    margin-bottom: 5px;
                    border: 1px solid var(--vscode-widget-border);
                    border-radius: 4px;
                    overflow: hidden;
                }
                
                .section-header {
                    display: flex;
                    align-items: center;
                    padding: 8px 10px;
                    background: var(--vscode-sideBar-background);
                    cursor: pointer;
                    user-select: none;
                    transition: background-color 0.2s;
                }
                
                .section-header:hover {
                    background: var(--vscode-list-hoverBackground);
                }
                
                .section-toggle {
                    margin-right: 8px;
                    font-size: 10px;
                    transition: transform 0.2s;
                    color: var(--vscode-foreground);
                }
                
                .section-toggle.collapsed {
                    transform: rotate(-90deg);
                }
                
                .section-title {
                    flex: 1;
                    font-size: 13px;
                    font-weight: 600;
                    color: var(--vscode-editor-foreground);
                }
                
                .section-count {
                    font-size: 11px;
                    color: var(--vscode-descriptionForeground);
                    background: var(--vscode-badge-background);
                    color: var(--vscode-badge-foreground);
                    padding: 2px 6px;
                    border-radius: 10px;
                    font-weight: normal;
                }
                
                .section-content {
                    padding: 5px;
                    background: var(--vscode-editor-background);
                    max-height: 500px;
                    overflow-y: auto;
                    transition: max-height 0.3s ease-out;
                }
                
                .section-content.collapsed {
                    max-height: 0;
                    padding: 0 5px;
                    overflow: hidden;
                }
                
                .hidden {
                    display: none;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="title">🎨 Theme Editor</div>
                <div class="actions">
                    <button class="btn" onclick="loadTheme()">📁 Load</button>
                    <button class="btn" onclick="createNew()">✨ New</button>
                    <button class="btn btn-secondary" onclick="exportCSS()">💾 CSS</button>
                    <button class="btn btn-secondary" onclick="exportJSON()">📄 JSON</button>
                    <button class="btn btn-secondary" onclick="exportVSIX()">📦 VSIX</button>
                </div>
                <input type="text" class="search-box" placeholder="🔍 Search theme properties..." 
                       onkeyup="filterProperties(this.value)">
            </div>
            
            <div id="theme-properties"></div>
            
            <script>
                const vscode = acquireVsCodeApi();
                let currentTheme = {};
                
                const themeCategories = {
                    '🎨 Editor': ['editor.background', 'editor.foreground', 'editor.lineHighlightBackground', 'editor.selectionBackground', 'editor.inactiveSelectionBackground', 'editorCursor.foreground', 'editorLineNumber.foreground', 'editorLineNumber.activeForeground', 'editorIndentGuide.background', 'editorWhitespace.foreground'],
                    '📂 Activity Bar': ['activityBar.background', 'activityBar.foreground', 'activityBar.activeBorder', 'activityBar.inactiveForeground', 'activityBarBadge.background', 'activityBarBadge.foreground', 'activityBar.activeFocusBorder'],
                    '📋 Side Bar': ['sideBar.background', 'sideBar.foreground', 'sideBar.border', 'sideBarTitle.foreground', 'sideBarSectionHeader.background', 'sideBarSectionHeader.foreground', 'sideBarSectionHeader.border'],
                    '📊 Status Bar': ['statusBar.background', 'statusBar.foreground', 'statusBar.border', 'statusBarItem.hoverBackground', 'statusBarItem.activeBackground', 'statusBar.debuggingBackground', 'statusBar.noFolderBackground'],
                    '🏷️ Title Bar': ['titleBar.activeBackground', 'titleBar.activeForeground', 'titleBar.inactiveBackground', 'titleBar.inactiveForeground', 'titleBar.border'],
                    '📑 Tabs': ['tab.activeBackground', 'tab.activeForeground', 'tab.inactiveBackground', 'tab.inactiveForeground', 'tab.border', 'tab.activeBorder', 'editorGroupHeader.tabsBackground', 'tab.hoverBackground', 'tab.activeBorderTop'],
                    '📝 Lists & Trees': ['list.activeSelectionBackground', 'list.activeSelectionForeground', 'list.inactiveSelectionBackground', 'list.inactiveSelectionForeground', 'list.hoverBackground', 'list.hoverForeground', 'list.focusBackground', 'tree.indentGuidesStroke'],
                    '⌨️ Input Controls': ['input.background', 'input.foreground', 'input.border', 'input.placeholderForeground', 'inputOption.activeBackground', 'inputOption.activeForeground', 'inputValidation.errorBackground', 'inputValidation.errorBorder'],
                    '🔘 Buttons': ['button.background', 'button.foreground', 'button.hoverBackground', 'button.secondaryBackground', 'button.secondaryForeground', 'button.secondaryHoverBackground'],
                    '📋 Dropdowns': ['dropdown.background', 'dropdown.foreground', 'dropdown.border', 'dropdown.listBackground'],
                    '💻 Terminal': ['terminal.background', 'terminal.foreground', 'terminal.ansiBlack', 'terminal.ansiRed', 'terminal.ansiGreen', 'terminal.ansiYellow', 'terminal.ansiBlue', 'terminal.ansiMagenta', 'terminal.ansiCyan', 'terminal.ansiWhite', 'terminal.ansiBrightBlack', 'terminal.ansiBrightRed', 'terminal.ansiBrightGreen', 'terminal.ansiBrightYellow', 'terminal.ansiBrightBlue', 'terminal.ansiBrightMagenta', 'terminal.ansiBrightCyan', 'terminal.ansiBrightWhite'],
                    '🔍 Search & Find': ['searchEditor.findMatchBackground', 'searchEditor.findMatchBorder', 'search.findMatchBackground', 'search.findMatchHighlightBackground', 'searchEditor.textInputBorder'],
                    '⚠️ Errors & Warnings': ['errorForeground', 'warningForeground', 'infoForeground', 'notificationsErrorIcon.foreground', 'notificationsWarningIcon.foreground', 'notificationsInfoIcon.foreground'],
                    '🎯 Focus & Borders': ['focusBorder', 'foreground', 'widget.shadow', 'selection.background', 'descriptionForeground', 'errorForeground'],
                    '📋 Panels': ['panel.background', 'panel.border', 'panelTitle.activeBorder', 'panelTitle.activeForeground', 'panelTitle.inactiveForeground'],
                    '🧠 Semantic Tokens': ['editor.semanticTokenColorCustomizations.enabled', 'editor.semanticHighlighting.enabled', 'semanticTokenColors.namespace', 'semanticTokenColors.class', 'semanticTokenColors.enum', 'semanticTokenColors.interface', 'semanticTokenColors.struct', 'semanticTokenColors.typeParameter', 'semanticTokenColors.type', 'semanticTokenColors.parameter', 'semanticTokenColors.variable', 'semanticTokenColors.property', 'semanticTokenColors.enumMember', 'semanticTokenColors.event', 'semanticTokenColors.function', 'semanticTokenColors.method', 'semanticTokenColors.macro', 'semanticTokenColors.keyword', 'semanticTokenColors.modifier', 'semanticTokenColors.comment', 'semanticTokenColors.string', 'semanticTokenColors.number', 'semanticTokenColors.regexp', 'semanticTokenColors.operator'],
                    '🏷️ Token Colors': ['tokenColors.comments', 'tokenColors.strings', 'tokenColors.keywords', 'tokenColors.numbers', 'tokenColors.types', 'tokenColors.functions', 'tokenColors.variables', 'tokenColors.constants', 'tokenColors.operators', 'tokenColors.punctuation', 'tokenColors.storage', 'tokenColors.support', 'tokenColors.entity', 'tokenColors.invalid', 'tokenColors.meta', 'tokenColors.markup'],
                    '🎨 UI Colors': ['welcomePage.background', 'welcomePage.buttonBackground', 'welcomePage.buttonHoverBackground', 'walkThrough.embeddedEditorBackground', 'gitDecoration.addedResourceForeground', 'gitDecoration.modifiedResourceForeground', 'gitDecoration.deletedResourceForeground', 'gitDecoration.untrackedResourceForeground', 'gitDecoration.ignoredResourceForeground', 'gitDecoration.conflictingResourceForeground', 'gitDecoration.submoduleResourceForeground']
                };
                
                function updateTheme(theme) {
                    currentTheme = theme;
                    renderThemeProperties();
                }
                
                function renderThemeProperties() {
                    try {
                        const container = document.getElementById('theme-properties');
                        if (!container) {
                            console.error('Theme properties container not found');
                            return;
                        }
                        
                        container.innerHTML = '';
                        
                        Object.keys(themeCategories).forEach(category => {
                            try {
                                const section = document.createElement('div');
                                section.className = 'theme-section';
                                
                                const categoryProperties = themeCategories[category];
                                if (!Array.isArray(categoryProperties)) {
                                    console.warn('Invalid category properties for:', category);
                                    return;
                                }
                                
                                const hasProperties = categoryProperties.some(prop => currentTheme[prop]);
                                const isCollapsed = !hasProperties; // Expand sections with existing properties
                                
                                const categoryId = category.toLowerCase().replace(/[^a-z0-9-]/g, '-');
                                section.innerHTML = \`
                                    <div class="section-header" onclick="toggleSection('\${category}')">
                                        <span class="section-toggle \${isCollapsed ? 'collapsed' : ''}">▼</span>
                                        <span class="section-title">\${category}</span>
                                        <span class="section-count">(\${categoryProperties.filter(prop => currentTheme[prop]).length}/\${categoryProperties.length})</span>
                                    </div>
                                    <div class="section-content \${isCollapsed ? 'collapsed' : ''}" id="section-\${categoryId}">
                                    </div>
                                \`;
                                
                                const contentDiv = section.querySelector('.section-content');
                                if (contentDiv) {
                                    categoryProperties.forEach(property => {
                                        try {
                                            const value = currentTheme[property] || '';
                                            const item = createThemeItem(property, value, categoryId);
                                            if (item) {
                                                contentDiv.appendChild(item);
                                            }
                                        } catch (error) {
                                            console.error('Error creating theme item for property:', property, error);
                                        }
                                    });
                                }
                                
                                container.appendChild(section);
                            } catch (error) {
                                console.error('Error processing category:', category, error);
                            }
                        });
                        
                        // Add custom properties section if any exist
                        try {
                            const customProperties = Object.keys(currentTheme).filter(prop => 
                                !Object.values(themeCategories).flat().includes(prop)
                            );
                            
                            if (customProperties.length > 0) {
                                const section = document.createElement('div');
                                section.className = 'theme-section';
                                section.innerHTML = \`
                                    <div class="section-header" onclick="toggleSection('Custom')">
                                        <span class="section-toggle">▼</span>
                                        <span class="section-title">Custom Properties</span>
                                        <span class="section-count">(\${customProperties.length})</span>
                                    </div>
                                    <div class="section-content" id="section-custom">
                                    </div>
                                \`;
                                
                                const contentDiv = section.querySelector('.section-content');
                                if (contentDiv) {
                                    customProperties.forEach(property => {
                                        try {
                                            const value = currentTheme[property];
                                            const item = createThemeItem(property, value, 'custom');
                                            if (item) {
                                                contentDiv.appendChild(item);
                                            }
                                        } catch (error) {
                                            console.error('Error creating custom theme item:', property, error);
                                        }
                                    });
                                }
                                
                                container.appendChild(section);
                            }
                        } catch (error) {
                            console.error('Error processing custom properties:', error);
                        }
                    } catch (error) {
                        console.error('Error rendering theme properties:', error);
                    }
                }
                
                function createThemeItem(property, value, category) {
                    const item = document.createElement('div');
                    item.className = 'theme-item';
                    item.dataset.property = property.toLowerCase();
                    item.dataset.category = category;
                    
                    const displayName = property.split('.').map(part => 
                        part.charAt(0).toUpperCase() + part.slice(1)
                    ).join(' ');
                    
                    // Special handling for semantic tokens and token colors
                    const isSemanticOrToken = property.includes('semanticTokenColors') || property.includes('tokenColors');
                    const inputType = isSemanticOrToken ? 'text' : 'color';
                    const defaultValue = isSemanticOrToken ? '' : '#000000';
                    
                    item.innerHTML = \`
                        <div class="theme-item-header">
                            <div>
                                <div class="theme-item-label">\${property}</div>
                                <div class="theme-item-name">\${displayName}</div>
                            </div>
                            <button class="reset-btn" onclick="resetProperty('\${property}')" title="Reset to default">✕</button>
                        </div>
                        <div class="color-input-container">
                            \${inputType === 'color' ? 
                                \`<input type="color" class="color-input" value="\${value || defaultValue}" 
                                        onchange="updateColor('\${property}', this.value)">\` : 
                                ''}
                            <input type="text" class="color-text" value="\${value}" 
                                   onchange="updateColor('\${property}', this.value)"
                                   placeholder="\${isSemanticOrToken ? 'Enter token scope or color...' : 'Enter color value...'}">
                        </div>
                    \`;
                    
                    return item;
                }
                
                function updateColor(property, value) {
                    try {
                        if (!property || typeof property !== 'string') {
                            console.error('Invalid property:', property);
                            return;
                        }
                        
                        currentTheme[property] = value;
                        vscode.postMessage({
                            type: 'colorChange',
                            property: property,
                            value: value
                        });
                    } catch (error) {
                        console.error('Error updating color:', error);
                    }
                }
                
                function resetProperty(property) {
                    try {
                        if (!property || typeof property !== 'string') {
                            console.error('Invalid property:', property);
                            return;
                        }
                        
                        vscode.postMessage({
                            type: 'resetProperty',
                            property: property
                        });
                    } catch (error) {
                        console.error('Error resetting property:', error);
                    }
                }
                
                function loadTheme() {
                    try {
                        vscode.postMessage({ type: 'loadTheme' });
                    } catch (error) {
                        console.error('Error loading theme:', error);
                    }
                }
                
                function createNew() {
                    try {
                        vscode.postMessage({ type: 'createNew' });
                    } catch (error) {
                        console.error('Error creating new theme:', error);
                    }
                }
                
                function exportCSS() {
                    try {
                        vscode.postMessage({ type: 'exportCSS' });
                    } catch (error) {
                        console.error('Error exporting CSS:', error);
                    }
                }
                
                function exportJSON() {
                    try {
                        vscode.postMessage({ type: 'exportJSON' });
                    } catch (error) {
                        console.error('Error exporting JSON:', error);
                    }
                }
                
                function exportVSIX() {
                    try {
                        vscode.postMessage({ type: 'exportVSIX' });
                    } catch (error) {
                        console.error('Error exporting VSIX:', error);
                    }
                }
                
                function filterProperties(searchTerm) {
                    try {
                        const sections = document.querySelectorAll('.theme-section');
                        
                        sections.forEach(section => {
                            const items = section.querySelectorAll('.theme-item');
                            let visibleItems = 0;
                            
                            items.forEach(item => {
                                const property = item.dataset.property;
                                const category = item.dataset.category;
                                const isVisible = property && property.includes(searchTerm.toLowerCase()) || 
                                                 category && category.includes(searchTerm.toLowerCase());
                                item.classList.toggle('hidden', !isVisible);
                                if (isVisible) visibleItems++;
                            });
                            
                            // Show/hide entire section based on visible items
                            section.style.display = visibleItems > 0 ? 'block' : 'none';
                            
                            // Auto-expand sections with search results
                            if (searchTerm && visibleItems > 0) {
                                const content = section.querySelector('.section-content');
                                const toggle = section.querySelector('.section-toggle');
                                if (content && toggle) {
                                    content.classList.remove('collapsed');
                                    toggle.classList.remove('collapsed');
                                }
                            }
                        });
                    } catch (error) {
                        console.error('Error filtering properties:', error);
                    }
                }
                
                function toggleSection(category) {
                    try {
                        const sectionId = 'section-' + category.toLowerCase().replace(/[^a-z0-9-]/g, '-');
                        const content = document.getElementById(sectionId);
                        if (content) {
                            const toggle = content.parentElement.querySelector('.section-toggle');
                            if (toggle) {
                                content.classList.toggle('collapsed');
                                toggle.classList.toggle('collapsed');
                            }
                        }
                    } catch (error) {
                        console.error('Error toggling section:', error);
                    }
                }
                
                // Listen for messages from the extension
                window.addEventListener('message', event => {
                    const message = event.data;
                    switch (message.type) {
                        case 'updateTheme':
                            updateTheme(message.theme);
                            break;
                    }
                });
                
                // Initial render
                renderThemeProperties();
            </script>
        </body>
        </html>`;
    }
}
exports.SidebarProvider = SidebarProvider;
SidebarProvider.viewType = 'themeEditor';
//# sourceMappingURL=sidebarProvider.js.map