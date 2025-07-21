import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class ThemeSidebarProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'themeLivePreview';
    private _view?: vscode.WebviewView;
    private _currentTheme: any = null;
    private readonly _extensionUri: vscode.Uri;

    constructor(private readonly _context: vscode.ExtensionContext) {
        this._extensionUri = _context.extensionUri;
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

        // Load default theme elements
        this._loadDefaultTheme();

        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'updateColor':
                    this._updateThemeColor(data.property, data.value);
                    break;
                case 'loadTheme':
                    await this._loadThemeFile();
                    break;
                case 'exportTheme':
                    await this._exportTheme(data.format);
                    break;
                case 'resetTheme':
                    this._loadDefaultTheme();
                    break;
                case 'previewTheme':
                    this._previewCurrentTheme();
                    break;
            }
        });
    }

    private _loadDefaultTheme() {
        try {
            const elementsPath = path.join(this._extensionUri.fsPath, 'ELEMENTS.jsonc');
            if (fs.existsSync(elementsPath)) {
                let content = fs.readFileSync(elementsPath, 'utf8');
                // Clean JSONC comments
                content = content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/,(\s*[}\]])/g, '$1');
                content = content.replace(/"\$schema":[^,\n]+(,?)/g, '');
                this._currentTheme = JSON.parse(content);
                this._updateWebview();
            }
        } catch (error) {
            console.error('Error loading default theme:', error);
            this._currentTheme = this._getBasicTheme();
            this._updateWebview();
        }
    }

    private _getBasicTheme() {
        return {
            name: "New Theme",
            type: "dark",
            colors: {
                "editor.background": "#1e1e1e",
                "editor.foreground": "#d4d4d4",
                "activityBar.background": "#333333",
                "sideBar.background": "#252526"
            },
            tokenColors: [],
            semanticTokenColors: {}
        };
    }

    private _updateThemeColor(property: string, value: string) {
        if (!this._currentTheme) {
            this._currentTheme = this._getBasicTheme();
        }

        if (!this._currentTheme.colors) {
            this._currentTheme.colors = {};
        }

        this._currentTheme.colors[property] = value;
        this._updateWebview();
    }

    private async _loadThemeFile() {
        const result = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            filters: {
                'Theme Files': ['json', 'jsonc']
            }
        });

        if (result && result.length > 0) {
            try {
                let content = fs.readFileSync(result[0].fsPath, 'utf8');
                // Clean JSONC if needed
                if (result[0].fsPath.endsWith('.jsonc')) {
                    content = content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/,(\s*[}\]])/g, '$1');
                }
                this._currentTheme = JSON.parse(content);
                this._updateWebview();
                vscode.window.showInformationMessage(`Theme loaded: ${this._currentTheme.name || 'Unknown'}`);
            } catch (error) {
                vscode.window.showErrorMessage(`Error loading theme: ${error}`);
            }
        }
    }

    private async _exportTheme(format: string) {
        if (!this._currentTheme) {
            vscode.window.showWarningMessage('No theme to export');
            return;
        }

        const defaultName = this._currentTheme.name || 'theme';
        let fileExtension = 'json';
        let filters: any = { 'JSON Files': ['json'] };

        if (format === 'css') {
            fileExtension = 'css';
            filters = { 'CSS Files': ['css'] };
        } else if (format === 'vsix') {
            fileExtension = 'vsix';
            filters = { 'VSIX Files': ['vsix'] };
        }

        const saveUri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file(`${defaultName}.${fileExtension}`),
            filters: filters
        });

        if (saveUri) {
            try {
                let content: string;
                
                if (format === 'css') {
                    content = this._convertThemeToCSS();
                } else if (format === 'vsix') {
                    // Use enhanced extractor for VSIX creation
                    const EnhancedVSCodeThemeExtractor = require('../enhanced_theme_extractor');
                    const extractor = new EnhancedVSCodeThemeExtractor();
                    extractor.themeData = this._currentTheme;
                    const vsixData = extractor.generateVSIXData();
                    await extractor.createVSIX(saveUri.fsPath, vsixData);
                    vscode.window.showInformationMessage(`VSIX exported to: ${saveUri.fsPath}`);
                    return;
                } else {
                    content = JSON.stringify(this._currentTheme, null, 2);
                }

                await vscode.workspace.fs.writeFile(saveUri, Buffer.from(content));
                vscode.window.showInformationMessage(`Theme exported to: ${saveUri.fsPath}`);
            } catch (error) {
                vscode.window.showErrorMessage(`Error exporting theme: ${error}`);
            }
        }
    }

    private _convertThemeToCSS(): string {
        const css: string[] = [];
        
        css.push(`/* Theme: ${this._currentTheme.name || 'Unknown'} */`);
        css.push(`/* Type: ${this._currentTheme.type || 'dark'} */`);
        css.push(`/* Generated: ${new Date().toISOString()} */`);
        css.push('');
        css.push(':root {');

        if (this._currentTheme.colors) {
            Object.entries(this._currentTheme.colors).forEach(([key, value]) => {
                const cssKey = `--vscode-${key.replace(/\./g, '-')}`;
                css.push(`    ${cssKey}: ${value};`);
            });
        }

        css.push('}');
        return css.join('\n');
    }

    private _previewCurrentTheme() {
        if (this._currentTheme) {
            // Apply theme temporarily for preview
            vscode.commands.executeCommand('workbench.action.generateColorTheme', this._currentTheme);
        }
    }

    private _updateWebview() {
        if (this._view) {
            this._view.webview.postMessage({
                type: 'themeUpdate',
                theme: this._currentTheme
            });
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Theme Editor</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-sidebar-background);
            padding: 10px;
            margin: 0;
        }
        
        .theme-section {
            margin-bottom: 20px;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 10px;
        }
        
        .section-header {
            font-weight: bold;
            margin-bottom: 10px;
            color: var(--vscode-textLink-foreground);
            cursor: pointer;
            padding: 5px 0;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        
        .section-content {
            margin-top: 10px;
        }
        
        .collapsed .section-content {
            display: none;
        }
        
        .color-input-group {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
            gap: 8px;
        }
        
        .color-input-group label {
            flex: 1;
            font-size: 11px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .color-input {
            width: 40px;
            height: 25px;
            border: none;
            border-radius: 3px;
            cursor: pointer;
        }
        
        .color-text-input {
            width: 80px;
            padding: 2px 4px;
            border: 1px solid var(--vscode-input-border);
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 2px;
            font-size: 11px;
        }
        
        .button {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 6px 12px;
            border-radius: 2px;
            cursor: pointer;
            font-size: 11px;
            margin: 2px;
        }
        
        .button:hover {
            background: var(--vscode-button-hoverBackground);
        }
        
        .button-row {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
            margin: 10px 0;
        }
        
        .theme-info {
            background: var(--vscode-editor-background);
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 15px;
            border: 1px solid var(--vscode-panel-border);
        }
        
        .theme-name {
            font-weight: bold;
            color: var(--vscode-textLink-foreground);
            margin-bottom: 5px;
        }
        
        .search-box {
            width: 100%;
            padding: 5px;
            margin-bottom: 10px;
            border: 1px solid var(--vscode-input-border);
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 2px;
        }
    </style>
</head>
<body>
    <div class="theme-info">
        <div class="theme-name" id="themeName">Theme Editor</div>
        <div>Live theme editing with all VS Code elements</div>
    </div>
    
    <div class="button-row">
        <button class="button" onclick="loadTheme()">📂 Load Theme</button>
        <button class="button" onclick="exportTheme('json')">💾 Export JSON</button>
        <button class="button" onclick="exportTheme('css')">🎨 Export CSS</button>
        <button class="button" onclick="exportTheme('vsix')">📦 Export VSIX</button>
    </div>
    
    <input type="text" class="search-box" id="searchBox" placeholder="Search theme properties..." onkeyup="filterProperties()">
    
    <div id="themeEditor">
        <!-- Theme sections will be populated by JavaScript -->
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let currentTheme = null;
        
        // Theme property categories with comprehensive element list
        const themeCategories = {
            "Editor Core": [
                "editor.background", "editor.foreground", "editor.lineHighlightBackground", 
                "editor.lineHighlightBorder", "editor.selectionBackground", "editor.selectionHighlightBackground",
                "editor.inactiveSelectionBackground", "editor.wordHighlightBackground", "editor.wordHighlightStrongBackground",
                "editor.wordHighlightTextBackground", "editor.rangeHighlightBackground", "editor.hoverHighlightBackground",
                "editor.findMatchBackground", "editor.findMatchHighlightBackground", "editor.findRangeHighlightBackground",
                "editor.foldBackground", "editorCursor.foreground", "editorLink.activeForeground",
                "editorWhitespace.foreground", "editorIndentGuide.background1", "editorIndentGuide.activeBackground1",
                "editorRuler.foreground", "editorBracketMatch.background", "editorBracketMatch.border",
                "editorBracketHighlight.foreground1", "editorBracketHighlight.foreground2", "editorBracketHighlight.foreground3",
                "editorOverviewRuler.border"
            ],
            "Editor Widgets": [
                "editorWidget.background", "editorWidget.border", "editorSuggestWidget.background",
                "editorSuggestWidget.border", "editorSuggestWidget.foreground", "editorSuggestWidget.highlightForeground",
                "editorSuggestWidget.selectedBackground", "editorHoverWidget.background", "editorHoverWidget.border",
                "editorGhostText.foreground", "editorHint.foreground", "editorInfo.foreground",
                "editorWarning.foreground", "editorError.foreground"
            ],
            "Editor Gutter": [
                "editorGutter.background", "editorGutter.addedBackground", "editorGutter.modifiedBackground",
                "editorGutter.deletedBackground", "editorGutter.foldingControlForeground", "editorLineNumber.foreground",
                "editorLineNumber.activeForeground", "editorInlayHint.background", "editorInlayHint.foreground",
                "editorInlayHint.typeBackground", "editorInlayHint.typeForeground", "editorInlayHint.parameterBackground",
                "editorInlayHint.parameterForeground"
            ],
            "Editor Groups & Tabs": [
                "editorGroup.border", "editorGroup.dropBackground", "editorGroupHeader.tabsBackground",
                "editorGroupHeader.noTabsBackground", "tab.activeBackground", "tab.activeForeground",
                "tab.activeModifiedBorder", "tab.inactiveBackground", "tab.inactiveForeground",
                "tab.inactiveModifiedBorder", "tab.border", "tab.hoverBackground",
                "tab.unfocusedActiveModifiedBorder", "tab.unfocusedHoverBackground", "tab.unfocusedInactiveModifiedBorder",
                "tab.lastPinnedBorder"
            ],
            "Activity Bar": [
                "activityBar.background", "activityBar.foreground", "activityBar.inactiveForeground",
                "activityBar.activeBorder", "activityBar.border", "activityBarBadge.background",
                "activityBarBadge.foreground", "activityBar.dropBorder", "activityErrorBadge.background",
                "activityErrorBadge.foreground", "activityWarningBadge.background", "activityWarningBadge.foreground"
            ],
            "Sidebar": [
                "sideBar.background", "sideBar.foreground", "sideBar.border", "sideBarTitle.foreground",
                "sideBarSectionHeader.background", "sideBarSectionHeader.foreground", "sideBarSectionHeader.border",
                "sideBar.dropBackground"
            ],
            "Status Bar": [
                "statusBar.background", "statusBar.foreground", "statusBar.border",
                "statusBar.debuggingBackground", "statusBar.debuggingForeground", "statusBar.noFolderBackground",
                "statusBar.noFolderForeground", "statusBarItem.activeBackground", "statusBarItem.hoverBackground",
                "statusBarItem.remoteBackground", "statusBarItem.remoteForeground", "statusBarItem.errorBackground",
                "statusBarItem.errorForeground"
            ],
            "Title Bar": [
                "titleBar.activeBackground", "titleBar.activeForeground", "titleBar.inactiveBackground",
                "titleBar.inactiveForeground", "titleBar.border"
            ],
            "Panel": [
                "panel.background", "panel.border", "panel.dropBorder", "panelTitle.activeBorder",
                "panelTitle.activeForeground", "panelTitle.inactiveForeground", "panelInput.border"
            ],
            "Terminal": [
                "terminal.background", "terminal.foreground", "terminal.border", "terminal.cursorBackground",
                "terminal.cursorForeground", "terminal.ansiBlack", "terminal.ansiBlue", "terminal.ansiCyan",
                "terminal.ansiGreen", "terminal.ansiMagenta", "terminal.ansiRed", "terminal.ansiWhite",
                "terminal.ansiYellow", "terminal.ansiBrightBlack", "terminal.ansiBrightBlue", "terminal.ansiBrightCyan",
                "terminal.ansiBrightGreen", "terminal.ansiBrightMagenta", "terminal.ansiBrightRed", "terminal.ansiBrightWhite",
                "terminal.ansiBrightYellow", "terminal.selectionBackground"
            ],
            "Lists": [
                "list.activeSelectionBackground", "list.activeSelectionForeground", "list.inactiveSelectionBackground",
                "list.inactiveSelectionForeground", "list.hoverBackground", "list.hoverForeground",
                "list.focusOutline", "list.inactiveFocusOutline", "list.errorForeground", "list.warningForeground",
                "list.filterMatchBackground", "list.highlightForeground"
            ],
            "Inputs & Buttons": [
                "input.background", "input.foreground", "input.border", "input.placeholderForeground",
                "inputOption.activeBackground", "inputOption.activeBorder", "inputOption.activeForeground",
                "inputOption.hoverBackground", "button.background", "button.foreground", "button.hoverBackground",
                "button.secondaryBackground", "button.secondaryForeground", "button.secondaryHoverBackground",
                "badge.background", "badge.foreground", "dropdown.background", "dropdown.foreground",
                "dropdown.border", "dropdown.listBackground"
            ],
            "Peek View": [
                "peekView.border", "peekViewEditor.background", "peekViewEditor.matchHighlightBackground",
                "peekViewResult.background", "peekViewResult.fileForeground", "peekViewResult.lineForeground",
                "peekViewResult.matchHighlightBackground", "peekViewResult.selectionBackground",
                "peekViewResult.selectionForeground", "peekViewTitle.background", "peekViewTitleDescription.foreground",
                "peekViewTitleLabel.foreground"
            ],
            "Merge Conflicts": [
                "merge.border", "merge.commonContentBackground", "merge.commonHeaderBackground",
                "merge.currentContentBackground", "merge.currentHeaderBackground", "merge.incomingContentBackground",
                "merge.incomingHeaderBackground"
            ],
            "Notifications": [
                "notifications.background", "notifications.border", "notifications.foreground",
                "notificationLink.foreground", "notificationsErrorIcon.foreground", "notificationsInfoIcon.foreground",
                "notificationsWarningIcon.foreground"
            ],
            "Settings": [
                "settings.headerForeground", "settings.textInputForeground", "settings.modifiedItemIndicator"
            ],
            "Git Decorations": [
                "gitDecoration.addedResourceForeground", "gitDecoration.modifiedResourceForeground",
                "gitDecoration.deletedResourceForeground", "gitDecoration.untrackedResourceForeground",
                "gitDecoration.ignoredResourceForeground", "gitDecoration.conflictingResourceForeground",
                "gitDecoration.submoduleResourceForeground"
            ],
            "Text & Links": [
                "textLink.foreground", "textLink.activeForeground", "descriptionForeground"
            ],
            "Debug": [
                "debugToolBar.background", "debugIcon.breakpointForeground", "debugIcon.startForeground",
                "debugIcon.pauseForeground", "debugIcon.stopForeground", "debugIcon.disconnectForeground",
                "debugIcon.restartForeground", "debugIcon.stepOverForeground", "debugIcon.stepIntoForeground",
                "debugIcon.stepOutForeground", "debugIcon.continueForeground"
            ],
            "Charts": [
                "charts.foreground", "charts.lines", "charts.red", "charts.blue", "charts.yellow",
                "charts.orange", "charts.green", "charts.purple"
            ],
            "Extensions": [
                "extensionButton.prominentBackground", "extensionButton.prominentForeground",
                "extensionButton.prominentHoverBackground", "extensionBadge.remoteBackground",
                "extensionBadge.remoteForeground"
            ],
            "Welcome Page": [
                "welcomePage.progress.background", "welcomePage.progress.foreground", "welcomePage.tileBackground",
                "welcomePage.tileBorder", "welcomePage.tileHoverBackground"
            ]
        };
        
        function createThemeEditor() {
            const container = document.getElementById('themeEditor');
            container.innerHTML = '';
            
            Object.entries(themeCategories).forEach(([category, properties]) => {
                const section = document.createElement('div');
                section.className = 'theme-section';
                section.innerHTML = \`
                    <div class="section-header" onclick="toggleSection(this)">
                        ▼ \${category} (\${properties.length} properties)
                    </div>
                    <div class="section-content">
                        \${properties.map(prop => createColorInput(prop)).join('')}
                    </div>
                \`;
                container.appendChild(section);
            });
        }
        
        function createColorInput(property) {
            const value = currentTheme?.colors?.[property] || '#ffffff';
            return \`
                <div class="color-input-group" data-property="\${property}">
                    <label title="\${property}">\${property.split('.').pop()}</label>
                    <input type="color" class="color-input" value="\${value}" 
                           onchange="updateColor('\${property}', this.value)">
                    <input type="text" class="color-text-input" value="\${value}" 
                           onchange="updateColor('\${property}', this.value)"
                           placeholder="#ffffff">
                </div>
            \`;
        }
        
        function toggleSection(header) {
            const section = header.parentElement;
            section.classList.toggle('collapsed');
            header.innerHTML = section.classList.contains('collapsed') 
                ? header.innerHTML.replace('▼', '▶')
                : header.innerHTML.replace('▶', '▼');
        }
        
        function updateColor(property, value) {
            if (!currentTheme) {
                currentTheme = { name: 'New Theme', type: 'dark', colors: {} };
            }
            if (!currentTheme.colors) {
                currentTheme.colors = {};
            }
            
            currentTheme.colors[property] = value;
            
            // Update both inputs for this property
            const group = document.querySelector(\`[data-property="\${property}"]\`);
            if (group) {
                const colorInput = group.querySelector('.color-input');
                const textInput = group.querySelector('.color-text-input');
                if (colorInput) colorInput.value = value;
                if (textInput) textInput.value = value;
            }
            
            vscode.postMessage({
                type: 'updateColor',
                property: property,
                value: value
            });
        }
        
        function loadTheme() {
            vscode.postMessage({ type: 'loadTheme' });
        }
        
        function exportTheme(format) {
            vscode.postMessage({ type: 'exportTheme', format: format });
        }
        
        function filterProperties() {
            const searchTerm = document.getElementById('searchBox').value.toLowerCase();
            const groups = document.querySelectorAll('.color-input-group');
            
            groups.forEach(group => {
                const property = group.dataset.property.toLowerCase();
                if (property.includes(searchTerm)) {
                    group.style.display = 'flex';
                } else {
                    group.style.display = 'none';
                }
            });
        }
        
        // Listen for messages from the extension
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.type) {
                case 'themeUpdate':
                    currentTheme = message.theme;
                    document.getElementById('themeName').textContent = 
                        currentTheme?.name || 'Theme Editor';
                    createThemeEditor();
                    break;
            }
        });
        
        // Initialize
        createThemeEditor();
    </script>
</body>
</html>`;
    }
}
