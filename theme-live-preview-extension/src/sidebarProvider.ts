import * as vscode from 'vscode';
import { ThemeExtractor } from './themeExtractor';
import { ValueEditorProvider } from './valueEditorProvider';
import { NavigationProvider } from './navigationProvider';

export class SidebarProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'themeEditor';
    private _view?: vscode.WebviewView;
    private _currentTheme: any = {};
    private themeExtractor: ThemeExtractor;
    private _context: vscode.ExtensionContext;

    constructor(private readonly _extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
        this.themeExtractor = new ThemeExtractor();
        this._context = context;
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'colorChange': {
                    this._currentTheme[data.property] = data.value;
                    this._updatePreview();
                    break;
                }
                case 'editValue': {
                    await this._openValueEditor(data.property, data.currentValue);
                    break;
                }
                case 'showExamples': {
                    await NavigationProvider.showElementExamples(this._context, data.property);
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
                    delete this._currentTheme[data.property];
                    this._updatePreview();
                    this._refreshSidebar();
                    break;
                }
            }
        });

        // Load default theme elements
        this._loadDefaultTheme();
    }

    private _loadDefaultTheme() {
        this._currentTheme = {
            'editor.background': '#1e1e1e',
            'editor.foreground': '#d4d4d4',
            'activityBar.background': '#2d2d30',
            'activityBar.foreground': '#ffffff',
            'sideBar.background': '#252526',
            'sideBar.foreground': '#cccccc',
            'statusBar.background': '#007acc',
            'statusBar.foreground': '#ffffff',
            'titleBar.activeBackground': '#3c3c3c',
            'titleBar.activeForeground': '#cccccc',
            'button.background': '#0e639c',
            'button.foreground': '#ffffff',
            'input.background': '#3c3c3c',
            'input.foreground': '#cccccc',
            'dropdown.background': '#3c3c3c',
            'dropdown.foreground': '#cccccc',
            'list.activeSelectionBackground': '#094771',
            'list.activeSelectionForeground': '#ffffff',
            'list.hoverBackground': '#2a2d2e',
            'tab.activeBackground': '#1e1e1e',
            'tab.activeForeground': '#ffffff',
            'tab.inactiveBackground': '#2d2d30',
            'tab.inactiveForeground': '#969696'
        };
        this._refreshSidebar();
    }

    private _refreshSidebar() {
        if (this._view) {
            this._view.webview.postMessage({
                type: 'updateTheme',
                theme: this._currentTheme
            });
        }
    }

    private _updatePreview() {
        // Send updated theme to any open preview panels
        vscode.commands.executeCommand('themeLivePreview.updatePreview', this._currentTheme);
    }

    private async _loadTheme() {
        const options: vscode.OpenDialogOptions = {
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            filters: {
                'Theme Files': ['json', 'vsix']
            }
        };

        const fileUri = await vscode.window.showOpenDialog(options);
        if (fileUri && fileUri[0]) {
            try {
                const theme = await this.themeExtractor.extractTheme(fileUri[0].fsPath);
                const themeData = this.themeExtractor.getCurrentThemeData() || {};
                this._currentTheme = { ...this._currentTheme, ...themeData };
                this._refreshSidebar();
                this._updatePreview();
                vscode.window.showInformationMessage('Theme loaded successfully!');
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to load theme: ${error}`);
            }
        }
    }

    private async _exportCSS() {
        const saveUri = await vscode.window.showSaveDialog({
            filters: { 'CSS Files': ['css'] },
            defaultUri: vscode.Uri.file('theme.css')
        });

        if (saveUri) {
            try {
                await this.themeExtractor.exportAsCSS(this._currentTheme, saveUri.fsPath);
                vscode.window.showInformationMessage('CSS exported successfully!');
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to export CSS: ${error}`);
            }
        }
    }

    private async _exportJSON() {
        const themeName = await vscode.window.showInputBox({
            prompt: 'Enter theme name',
            placeHolder: 'My Custom Theme'
        });

        if (themeName) {
            const saveUri = await vscode.window.showSaveDialog({
                filters: { 'JSON Files': ['json'] },
                defaultUri: vscode.Uri.file(`${themeName.toLowerCase().replace(/\s+/g, '-')}-theme.json`)
            });

            if (saveUri) {
                try {
                    await this.themeExtractor.exportAsJSON(this._currentTheme, themeName, saveUri.fsPath);
                    vscode.window.showInformationMessage('JSON theme exported successfully!');
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to export JSON: ${error}`);
                }
            }
        }
    }

    private async _exportVSIX() {
        const themeName = await vscode.window.showInputBox({
            prompt: 'Enter theme name for VSIX package',
            placeHolder: 'My Custom Theme'
        });

        if (themeName) {
            const saveUri = await vscode.window.showSaveDialog({
                filters: { 'VSIX Files': ['vsix'] },
                defaultUri: vscode.Uri.file(`${themeName.toLowerCase().replace(/\s+/g, '-')}-theme.vsix`)
            });

            if (saveUri) {
                try {
                    await this.themeExtractor.exportAsVSIX(this._currentTheme, themeName, saveUri.fsPath);
                    vscode.window.showInformationMessage('VSIX package exported successfully!');
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to export VSIX: ${error}`);
                }
            }
        }
    }

    private _createNewTheme() {
        this._currentTheme = {};
        this._loadDefaultTheme();
        vscode.window.showInformationMessage('New theme created!');
    }

    private async _openValueEditor(property: string, currentValue: string) {
        const originalValue = this._getOriginalValue(property);
        const description = this._getPropertyDescription(property);

        const result = await ValueEditorProvider.showValueEditor(this._context, {
            property,
            currentValue,
            originalValue,
            description,
            onValueChange: (value: string) => {
                // Live preview - update the theme immediately
                this._currentTheme[property] = value;
                this._updatePreview();
            },
            onApply: (value: string) => {
                // Apply the final value
                this._currentTheme[property] = value;
                this._updatePreview();
                this._refreshSidebar();
                vscode.window.showInformationMessage(`Updated ${property} to ${value}`);
            },
            onCancel: () => {
                // Restore original value if user cancels
                if (originalValue !== undefined) {
                    this._currentTheme[property] = originalValue;
                    this._updatePreview();
                }
            }
        });
    }

    private _getOriginalValue(property: string): string | undefined {
        // You can store original values when theme is first loaded
        // For now, return the current default value
        const defaults: { [key: string]: string } = {
            'editor.background': '#1e1e1e',
            'editor.foreground': '#d4d4d4',
            'activityBar.background': '#2d2d30',
            'activityBar.foreground': '#ffffff',
            'sideBar.background': '#252526',
            'sideBar.foreground': '#cccccc',
            'statusBar.background': '#007acc',
            'statusBar.foreground': '#ffffff'
        };
        return defaults[property];
    }

    private _getPropertyDescription(property: string): string {
        const descriptions: { [key: string]: string } = {
            'editor.background': 'Background color of the editor',
            'editor.foreground': 'Default foreground color for text in the editor',
            'activityBar.background': 'Background color of the activity bar',
            'activityBar.foreground': 'Foreground color of the activity bar icons',
            'sideBar.background': 'Background color of the sidebar',
            'sideBar.foreground': 'Foreground color of the sidebar text',
            'statusBar.background': 'Background color of the status bar',
            'statusBar.foreground': 'Foreground color of the status bar text'
        };
        return descriptions[property] || `Theme property: ${property}`;
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
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
                    margin-bottom: 8px;
                    padding: 8px;
                    background: var(--vscode-input-background);
                    border-radius: 4px;
                    border: 1px solid var(--vscode-widget-border);
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

                .edit-btn {
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 2px 6px;
                    border-radius: 2px;
                    cursor: pointer;
                    font-size: 10px;
                }
                
                .edit-btn:hover {
                    background: var(--vscode-button-hoverBackground);
                }

                .nav-btn {
                    background: var(--vscode-textLink-foreground);
                    color: var(--vscode-editor-background);
                    border: none;
                    padding: 2px 6px;
                    border-radius: 2px;
                    cursor: pointer;
                    font-size: 10px;
                }
                
                .nav-btn:hover {
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
                    'Editor': ['editor.background', 'editor.foreground', 'editor.lineHighlightBackground', 'editor.selectionBackground', 'editor.inactiveSelectionBackground', 'editorCursor.foreground', 'editorLineNumber.foreground', 'editorLineNumber.activeForeground'],
                    'Activity Bar': ['activityBar.background', 'activityBar.foreground', 'activityBar.activeBorder', 'activityBar.inactiveForeground', 'activityBarBadge.background', 'activityBarBadge.foreground'],
                    'Side Bar': ['sideBar.background', 'sideBar.foreground', 'sideBar.border', 'sideBarTitle.foreground', 'sideBarSectionHeader.background', 'sideBarSectionHeader.foreground'],
                    'Status Bar': ['statusBar.background', 'statusBar.foreground', 'statusBar.border', 'statusBarItem.hoverBackground', 'statusBarItem.activeBackground'],
                    'Title Bar': ['titleBar.activeBackground', 'titleBar.activeForeground', 'titleBar.inactiveBackground', 'titleBar.inactiveForeground', 'titleBar.border'],
                    'Tabs': ['tab.activeBackground', 'tab.activeForeground', 'tab.inactiveBackground', 'tab.inactiveForeground', 'tab.border', 'tab.activeBorder', 'editorGroupHeader.tabsBackground'],
                    'Lists': ['list.activeSelectionBackground', 'list.activeSelectionForeground', 'list.inactiveSelectionBackground', 'list.inactiveSelectionForeground', 'list.hoverBackground', 'list.hoverForeground'],
                    'Inputs': ['input.background', 'input.foreground', 'input.border', 'input.placeholderForeground', 'inputOption.activeBackground', 'inputOption.activeForeground'],
                    'Buttons': ['button.background', 'button.foreground', 'button.hoverBackground', 'button.secondaryBackground', 'button.secondaryForeground', 'button.secondaryHoverBackground'],
                    'Dropdowns': ['dropdown.background', 'dropdown.foreground', 'dropdown.border', 'dropdown.listBackground'],
                    'Terminal': ['terminal.background', 'terminal.foreground', 'terminal.ansiBlack', 'terminal.ansiRed', 'terminal.ansiGreen', 'terminal.ansiYellow', 'terminal.ansiBlue', 'terminal.ansiMagenta', 'terminal.ansiCyan', 'terminal.ansiWhite']
                };
                
                function updateTheme(theme) {
                    currentTheme = theme;
                    renderThemeProperties();
                }
                
                function renderThemeProperties() {
                    const container = document.getElementById('theme-properties');
                    container.innerHTML = '';
                    
                    Object.keys(themeCategories).forEach(category => {
                        const section = document.createElement('div');
                        section.innerHTML = \`<div class="section-title">\${category}</div>\`;
                        
                        themeCategories[category].forEach(property => {
                            const value = currentTheme[property] || '';
                            const item = createThemeItem(property, value, category.toLowerCase().replace(' ', '-'));
                            section.appendChild(item);
                        });
                        
                        container.appendChild(section);
                    });
                    
                    // Add custom properties
                    const customProperties = Object.keys(currentTheme).filter(prop => 
                        !Object.values(themeCategories).flat().includes(prop)
                    );
                    
                    if (customProperties.length > 0) {
                        const section = document.createElement('div');
                        section.innerHTML = '<div class="section-title">Custom Properties</div>';
                        
                        customProperties.forEach(property => {
                            const value = currentTheme[property];
                            const item = createThemeItem(property, value, 'custom');
                            section.appendChild(item);
                        });
                        
                        container.appendChild(section);
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
                    
                    item.innerHTML = \`
                        <div class="theme-item-header">
                            <div>
                                <div class="theme-item-label">\${property}</div>
                                <div class="theme-item-name">\${displayName}</div>
                            </div>
                            <div style="display: flex; gap: 4px;">
                                <button class="nav-btn" onclick="showExamples('\${property}')" title="Show examples and navigate">🧭</button>
                                <button class="edit-btn" onclick="editValue('\${property}', '\${value}')" title="Edit in popup">✏️</button>
                                <button class="reset-btn" onclick="resetProperty('\${property}')" title="Reset to default">✕</button>
                            </div>
                        </div>
                        <div class="color-input-container">
                            <input type="color" class="color-input" value="\${value || '#000000'}" 
                                   onchange="updateColor('\${property}', this.value)">
                            <input type="text" class="color-text" value="\${value}" 
                                   onchange="updateColor('\${property}', this.value)"
                                   placeholder="Enter color value...">
                        </div>
                    \`;
                    
                    return item;
                }
                
                function updateColor(property, value) {
                    currentTheme[property] = value;
                    vscode.postMessage({
                        type: 'colorChange',
                        property: property,
                        value: value
                    });
                }

                function editValue(property, currentValue) {
                    vscode.postMessage({
                        type: 'editValue',
                        property: property,
                        currentValue: currentValue
                    });
                }

                function showExamples(property) {
                    vscode.postMessage({
                        type: 'showExamples',
                        property: property
                    });
                }
                
                function resetProperty(property) {
                    vscode.postMessage({
                        type: 'resetProperty',
                        property: property
                    });
                }
                
                function loadTheme() {
                    vscode.postMessage({ type: 'loadTheme' });
                }
                
                function createNew() {
                    vscode.postMessage({ type: 'createNew' });
                }
                
                function exportCSS() {
                    vscode.postMessage({ type: 'exportCSS' });
                }
                
                function exportJSON() {
                    vscode.postMessage({ type: 'exportJSON' });
                }
                
                function exportVSIX() {
                    vscode.postMessage({ type: 'exportVSIX' });
                }
                
                function filterProperties(searchTerm) {
                    const items = document.querySelectorAll('.theme-item');
                    const sections = document.querySelectorAll('.section-title');
                    
                    items.forEach(item => {
                        const property = item.dataset.property;
                        const category = item.dataset.category;
                        const isVisible = property.includes(searchTerm.toLowerCase()) || 
                                         category.includes(searchTerm.toLowerCase());
                        item.classList.toggle('hidden', !isVisible);
                    });
                    
                    // Hide empty sections
                    sections.forEach(section => {
                        const sectionDiv = section.parentElement;
                        const visibleItems = sectionDiv.querySelectorAll('.theme-item:not(.hidden)');
                        sectionDiv.style.display = visibleItems.length > 0 ? 'block' : 'none';
                    });
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
