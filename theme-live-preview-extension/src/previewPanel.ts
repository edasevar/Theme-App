import * as vscode from 'vscode';
import { ThemeExtractor } from './themeExtractor';

export class PreviewPanel {
    public static readonly viewType = 'themeLivePreview';
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private _currentCSS: string = '';
    private _currentThemeName: string = 'No Theme Loaded';

    constructor(extensionUri: vscode.Uri, private themeExtractor: ThemeExtractor) {
        this._extensionUri = extensionUri;

        this._panel = vscode.window.createWebviewPanel(
            PreviewPanel.viewType,
            'Theme Live Preview',
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [this._extensionUri]
            }
        );

        this._panel.webview.html = this._getHtmlContent();

        // Handle messages from webview
        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'updateCSS':
                        this._currentCSS = message.css;
                        break;
                    case 'alert':
                        vscode.window.showInformationMessage(message.text);
                        break;
                    case 'openColorPicker':
                        this.handleColorPicker(message.currentColor, message.property);
                        break;
                    case 'navigateToItem':
                        vscode.commands.executeCommand('themeLivePreview.navigateToItem', message.themeItem);
                        break;
                    case 'applyColorToVSCode':
                        this.applyColorToVSCode(message.property, message.color);
                        break;
                    case 'loadTheme':
                        vscode.commands.executeCommand('themeLivePreview.loadTheme');
                        break;
                    case 'enterCSS':
                        vscode.commands.executeCommand('themeLivePreview.enterCSS');
                        break;
                    case 'createNewTheme':
                        vscode.commands.executeCommand('themeLivePreview.createNewTheme');
                        break;
                    case 'showStartupOptions':
                        vscode.commands.executeCommand('themeLivePreview.showStartupOptions');
                        break;
                    case 'exportCSS':
                        vscode.commands.executeCommand('themeLivePreview.exportCSS');
                        break;
                    case 'exportJSON':
                        vscode.commands.executeCommand('themeLivePreview.exportJSON');
                        break;
                    case 'exportVSIX':
                        vscode.commands.executeCommand('themeLivePreview.exportVSIX');
                        break;
                }
            },
            null,
            this._disposables
        );
    }

    public reveal (): void {
        this._panel.reveal(vscode.ViewColumn.Beside);
    }

    public onDidDispose (callback: () => void): void {
        this._panel.onDidDispose(callback, null, this._disposables);
    }

    public updateTheme (cssData: string, themeName: string): void {
        this._currentCSS = cssData;
        this._currentThemeName = themeName;
        this._panel.webview.postMessage({
            command: 'updateTheme',
            css: cssData,
            themeName: themeName
        });
    }

    public getCurrentCSS (): string {
        return this._currentCSS;
    }

    public getCurrentThemeName (): string {
        return this._currentThemeName;
    }

    public async exportAsJSON (css: string, themeName: string, savePath: string): Promise<void> {
        await this.themeExtractor.exportAsJSON(css, themeName, savePath);
    }

    public async exportAsVSIX (css: string, themeName: string, savePath: string): Promise<void> {
        await this.themeExtractor.exportAsVSIX(css, themeName, savePath);
    }

    public openColorPicker (currentColor: string): void {
        this._panel.webview.postMessage({
            command: 'openColorPicker',
            currentColor: currentColor
        });
    }

    public navigateToThemeItem (themeItem: string): void {
        this._panel.webview.postMessage({
            command: 'highlightThemeItem',
            themeItem: themeItem
        });
    }

    private async handleColorPicker (currentColor: string, property: string): Promise<void> {
        // Use VS Code's built-in color picker via input box with validation
        const newColor = await vscode.window.showInputBox({
            prompt: `Choose new color for ${property}`,
            value: currentColor,
            validateInput: (value) => {
                // Basic color validation
                const colorRegex = /^#([A-Fa-f0-9]{3}){1,2}$|^rgb\(|^rgba\(|^hsl\(|^hsla\(/;
                return colorRegex.test(value) ? null : 'Please enter a valid color (hex, rgb, rgba, hsl, hsla)';
            }
        });

        if (newColor) {
            this._panel.webview.postMessage({
                command: 'updateColor',
                property: property,
                color: newColor
            });
        }
    }

    private async applyColorToVSCode (property: string, color: string): Promise<void> {
        try {
            const config = vscode.workspace.getConfiguration();
            const colorCustomizations = config.get('workbench.colorCustomizations') as any || {};

            colorCustomizations[property] = color;

            await config.update('workbench.colorCustomizations', colorCustomizations, vscode.ConfigurationTarget.Global);

            vscode.window.showInformationMessage(
                `Applied ${property}: ${color} to VS Code theme`,
                'Open Settings'
            ).then(selection => {
                if (selection === 'Open Settings') {
                    vscode.commands.executeCommand('workbench.action.openSettings', 'workbench.colorCustomizations');
                }
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to apply color to VS Code: ${error}`);
        }
    }

    private _getHtmlContent (): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Theme Live Preview</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: var(--vscode-editor-background, #1e1e1e);
            color: var(--vscode-editor-foreground, #d4d4d4);
            height: 100vh;
            display: flex;
            flex-direction: column;
        }

        .header {
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--vscode-panel-border, #3e3e3e);
        }

        .theme-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
        }

        .controls {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        }

        button {
            background: var(--vscode-button-background, #0e639c);
            color: var(--vscode-button-foreground, #ffffff);
            border: none;
            padding: 8px 16px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 13px;
        }

        button:hover {
            background: var(--vscode-button-hoverBackground, #1177bb);
        }

        .content {
            display: flex;
            flex: 1;
            gap: 20px;
            overflow: hidden;
        }

        .editor-panel {
            flex: 1;
            display: flex;
            flex-direction: column;
        }

        .preview-panel {
            flex: 1;
            display: flex;
            flex-direction: column;
        }

        .panel-title {
            font-weight: bold;
            margin-bottom: 10px;
            padding: 5px 0;
            border-bottom: 1px solid var(--vscode-panel-border, #3e3e3e);
        }

        #cssEditor {
            flex: 1;
            background: var(--vscode-input-background, #3c3c3c);
            color: var(--vscode-input-foreground, #cccccc);
            border: 1px solid var(--vscode-input-border, #3e3e3e);
            padding: 10px;
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            font-size: 13px;
            resize: none;
            outline: none;
        }

        .preview-area {
            flex: 1;
            background: var(--vscode-editor-background, #1e1e1e);
            border: 1px solid var(--vscode-panel-border, #3e3e3e);
            padding: 20px;
            overflow-y: auto;
        }

        .code-sample {
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            font-size: 14px;
            line-height: 1.5;
            white-space: pre-wrap;
        }

        .keyword { color: #569cd6; font-weight: bold; }
        .string { color: #ce9178; }
        .comment { color: #6a9955; font-style: italic; }
        .function { color: #dcdcaa; }
        .variable { color: #9cdcfe; }
        .number { color: #b5cea8; }
        .operator { color: #d4d4d4; }

        .color-swatch {
            display: inline-block;
            width: 20px;
            height: 20px;
            margin-right: 8px;
            border: 1px solid #666;
            border-radius: 3px;
            vertical-align: middle;
        }

        .color-info {
            display: flex;
            align-items: center;
            margin: 5px 0;
            padding: 8px;
            background: var(--vscode-editor-lineHighlightBackground, #2a2a2a);
            border-radius: 3px;
            cursor: pointer;
            transition: background 0.2s;
        }

        .color-info:hover {
            background: var(--vscode-list-hoverBackground, #2a2d2e);
        }

        .color-info.highlighted {
            background: var(--vscode-editor-selectionBackground, #264f78);
            border: 1px solid var(--vscode-focusBorder, #007acc);
        }

        .color-actions {
            margin-left: auto;
            display: flex;
            gap: 5px;
        }

        .color-btn {
            padding: 2px 6px;
            font-size: 11px;
            background: var(--vscode-button-secondaryBackground, #5a5d5e);
            color: var(--vscode-button-secondaryForeground, #ffffff);
            border: none;
            border-radius: 2px;
            cursor: pointer;
        }

        .color-btn:hover {
            background: var(--vscode-button-secondaryHoverBackground, #656565);
        }

        .navigation-panel {
            margin-top: 20px;
            padding: 15px;
            background: var(--vscode-editor-lineHighlightBackground, #2a2a2a);
            border-radius: 5px;
        }

        .nav-title {
            font-weight: bold;
            margin-bottom: 10px;
            color: var(--vscode-editor-foreground, #d4d4d4);
        }

        .theme-item {
            padding: 5px 10px;
            margin: 2px 0;
            background: var(--vscode-input-background, #3c3c3c);
            border: 1px solid var(--vscode-input-border, #3e3e3e);
            border-radius: 3px;
            cursor: pointer;
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            font-size: 12px;
            transition: all 0.2s;
        }

        .theme-item:hover {
            background: var(--vscode-list-hoverBackground, #2a2d2e);
            border-color: var(--vscode-focusBorder, #007acc);
        }

        .startup-panel {
            padding: 40px 20px;
            text-align: center;
            background: var(--vscode-editor-background, #1e1e1e);
            border-radius: 8px;
            margin: 20px;
        }

        .startup-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 15px;
            color: var(--vscode-editor-foreground, #d4d4d4);
        }

        .startup-subtitle {
            font-size: 16px;
            margin-bottom: 30px;
            color: var(--vscode-descriptionForeground, #cccccc);
            opacity: 0.8;
        }

        .startup-options {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }

        .startup-option {
            padding: 20px;
            background: var(--vscode-editor-lineHighlightBackground, #2a2a2a);
            border: 2px solid var(--vscode-input-border, #3e3e3e);
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
            text-align: left;
        }

        .startup-option:hover {
            border-color: var(--vscode-focusBorder, #007acc);
            background: var(--vscode-list-hoverBackground, #2a2d2e);
            transform: translateY(-2px);
        }

        .startup-option-icon {
            font-size: 32px;
            margin-bottom: 10px;
            display: block;
        }

        .startup-option-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 8px;
            color: var(--vscode-editor-foreground, #d4d4d4);
        }

        .startup-option-desc {
            font-size: 13px;
            color: var(--vscode-descriptionForeground, #cccccc);
            opacity: 0.8;
            line-height: 1.4;
        }

        .quick-actions {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid var(--vscode-panel-border, #3e3e3e);
        }

        .quick-actions h4 {
            margin-bottom: 15px;
            color: var(--vscode-editor-foreground, #d4d4d4);
        }

        .export-dropdown {
            position: relative;
            display: inline-block;
        }

        .export-menu {
            display: none;
            position: absolute;
            top: 100%;
            left: 0;
            background: var(--vscode-dropdown-background, #3c3c3c);
            border: 1px solid var(--vscode-dropdown-border, #454545);
            border-radius: 3px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            z-index: 1000;
            min-width: 180px;
        }

        .export-menu.show {
            display: block;
        }

        .export-menu button {
            display: block;
            width: 100%;
            text-align: left;
            padding: 8px 12px;
            background: transparent;
            border: none;
            color: var(--vscode-dropdown-foreground, #cccccc);
            cursor: pointer;
            font-size: 13px;
        }

        .export-menu button:hover {
            background: var(--vscode-list-hoverBackground, #2a2d2e);
        }

        .export-menu button:first-child {
            border-radius: 3px 3px 0 0;
        }

        .export-menu button:last-child {
            border-radius: 0 0 3px 3px;
        }

        .toolbar {
            display: flex;
            gap: 10px;
            margin-bottom: 10px;
            align-items: center;
        }

        .live-indicator {
            background: #4caf50;
            color: white;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 11px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="theme-name" id="themeName">Theme Live Preview</div>
        <div class="controls">
            <button onclick="showStartupOptions()">🚀 Getting Started</button>
            <button onclick="loadSampleTheme()">Load Sample Theme</button>
            <button onclick="resetToDefault()">Reset</button>
            <div class="export-dropdown">
                <button onclick="toggleExportMenu()" id="exportBtn">📤 Export ▼</button>
                <div class="export-menu" id="exportMenu">
                    <button onclick="exportCSS()">💾 Export CSS</button>
                    <button onclick="exportJSON()">📄 Export JSON Theme</button>
                    <button onclick="exportVSIX()">📦 Export VSIX Package</button>
                </div>
            </div>
            <button onclick="openAdvancedColorPicker()">🎨 Color Picker</button>
            <span class="live-indicator">LIVE</span>
        </div>
    </div>

    <div class="content">
        <div class="editor-panel">
            <div class="toolbar">
                <div class="panel-title">CSS Editor</div>
                <button onclick="formatCSS()">Format</button>
                <button onclick="minifyCSS()">Minify</button>
            </div>
            <textarea id="cssEditor" placeholder="CSS will appear here when you load a theme...">/* Load a theme to see CSS here */</textarea>
        </div>

        <div class="preview-panel">
            <div class="panel-title">Live Preview</div>
            <div class="preview-area" id="previewArea">
                <div class="startup-panel" id="startupPanel">
                    <div class="startup-title">🎨 Welcome to Theme Live Preview</div>
                    <div class="startup-subtitle">Choose how you'd like to get started with theme editing</div>
                    
                    <div class="startup-options">
                        <div class="startup-option" onclick="startupAction('loadVsix')">
                            <span class="startup-option-icon">📦</span>
                            <div class="startup-option-title">Load .vsix Theme File</div>
                            <div class="startup-option-desc">Load an existing theme from a .vsix package or JSON file</div>
                        </div>
                        
                        <div class="startup-option" onclick="startupAction('enterCSS')">
                            <span class="startup-option-icon">📝</span>
                            <div class="startup-option-title">Enter CSS Directly</div>
                            <div class="startup-option-desc">Paste or type CSS directly into the editor</div>
                        </div>
                        
                        <div class="startup-option" onclick="startupAction('createNew')">
                            <span class="startup-option-icon">🎨</span>
                            <div class="startup-option-title">Create New Theme</div>
                            <div class="startup-option-desc">Start with a template and customize colors</div>
                        </div>
                    </div>
                    
                    <div class="quick-actions">
                        <h4>Quick Actions</h4>
                        <button onclick="loadSampleTheme()" style="margin-right: 10px;">🔥 Load Sample Theme</button>
                        <button onclick="startupAction('enterCSS')">✏️ Enter CSS</button>
                    </div>
                </div>

                <div class="code-sample" id="codePreview" style="display: none;">
<span class="comment">// Sample code with syntax highlighting</span>
<span class="keyword">function</span> <span class="function">calculateTotal</span>(<span class="variable">items</span>) {
    <span class="keyword">let</span> <span class="variable">total</span> = <span class="number">0</span>;
    
    <span class="keyword">for</span> (<span class="keyword">const</span> <span class="variable">item</span> <span class="keyword">of</span> <span class="variable">items</span>) {
        <span class="variable">total</span> <span class="operator">+=</span> <span class="variable">item</span>.<span class="variable">price</span> <span class="operator">*</span> <span class="variable">item</span>.<span class="variable">quantity</span>;
    }
    
    <span class="keyword">return</span> <span class="variable">total</span>;
}

<span class="comment">/* Multi-line comment
   showing different styles */</span>
<span class="keyword">const</span> <span class="variable">result</span> = <span class="function">calculateTotal</span>([
    { <span class="variable">price</span>: <span class="number">10.99</span>, <span class="variable">quantity</span>: <span class="number">2</span> },
    { <span class="variable">price</span>: <span class="number">5.49</span>, <span class="variable">quantity</span>: <span class="number">1</span> }
]);

<span class="keyword">console</span>.<span class="function">log</span>(<span class="string">"Total: $"</span> + <span class="variable">result</span>);
                </div>

                <div id="colorPalette" style="margin-top: 20px; display: none;">
                    <h3>Color Palette</h3>
                    <div id="colorList">
                        <div class="color-info">
                            <span class="color-swatch" style="background: #1e1e1e;"></span>
                            <span>Background: #1e1e1e</span>
                            <div class="color-actions">
                                <button class="color-btn" onclick="pickColor('editor.background', '#1e1e1e')">🎨</button>
                                <button class="color-btn" onclick="applyToVSCode('editor.background', '#1e1e1e')">Apply</button>
                            </div>
                        </div>
                        <div class="color-info">
                            <span class="color-swatch" style="background: #d4d4d4;"></span>
                            <span>Foreground: #d4d4d4</span>
                            <div class="color-actions">
                                <button class="color-btn" onclick="pickColor('editor.foreground', '#d4d4d4')">🎨</button>
                                <button class="color-btn" onclick="applyToVSCode('editor.foreground', '#d4d4d4')">Apply</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="navigation-panel">
                    <div class="nav-title">🎯 Navigate to Theme Items</div>
                    <div class="theme-item" onclick="navigateToThemeItem('editor.background')">editor.background</div>
                    <div class="theme-item" onclick="navigateToThemeItem('editor.foreground')">editor.foreground</div>
                    <div class="theme-item" onclick="navigateToThemeItem('activityBar.background')">activityBar.background</div>
                    <div class="theme-item" onclick="navigateToThemeItem('sideBar.background')">sideBar.background</div>
                    <div class="theme-item" onclick="navigateToThemeItem('statusBar.background')">statusBar.background</div>
                    <div class="theme-item" onclick="navigateToThemeItem('panel.background')">panel.background</div>
                    <button onclick="showAllThemeItems()" style="margin-top: 10px; width: 100%;">Show All Theme Items</button>
                </div>
            </div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let currentCSS = '';

        // Handle messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'updateTheme':
                    updateThemeDisplay(message.css, message.themeName);
                    break;
                case 'openColorPicker':
                    openAdvancedColorPicker(message.currentColor);
                    break;
                case 'highlightThemeItem':
                    highlightThemeItem(message.themeItem);
                    break;
                case 'updateColor':
                    updateColorInCSS(message.property, message.color);
                    break;
            }
        });

        function updateThemeDisplay(css, themeName) {
            currentCSS = css;
            document.getElementById('themeName').textContent = themeName;
            document.getElementById('cssEditor').value = css;
            
            // Hide startup panel and show code preview
            document.getElementById('startupPanel').style.display = 'none';
            document.getElementById('codePreview').style.display = 'block';
            document.getElementById('colorPalette').style.display = 'block';
            
            // Apply CSS to preview
            applyCSS(css);
            
            // Update color palette
            updateColorPalette(css);
            
            // Auto-save state
            vscode.setState({ css, themeName });
        }

        function showStartupPanel() {
            document.getElementById('startupPanel').style.display = 'block';
            document.getElementById('codePreview').style.display = 'none';
            document.getElementById('colorPalette').style.display = 'none';
        }

        function startupAction(action) {
            switch (action) {
                case 'loadVsix':
                    vscode.postMessage({
                        command: 'loadTheme'
                    });
                    break;
                case 'enterCSS':
                    vscode.postMessage({
                        command: 'enterCSS'
                    });
                    break;
                case 'createNew':
                    vscode.postMessage({
                        command: 'createNewTheme'
                    });
                    break;
            }
        }

        function showStartupOptions() {
            vscode.postMessage({
                command: 'showStartupOptions'
            });
        }

        function toggleExportMenu() {
            const menu = document.getElementById('exportMenu');
            menu.classList.toggle('show');
        }

        // Close export menu when clicking outside
        document.addEventListener('click', function(event) {
            const exportDropdown = event.target.closest('.export-dropdown');
            if (!exportDropdown) {
                document.getElementById('exportMenu').classList.remove('show');
            }
        });

        function exportJSON() {
            vscode.postMessage({
                command: 'exportJSON'
            });
            document.getElementById('exportMenu').classList.remove('show');
        }

        function exportVSIX() {
            vscode.postMessage({
                command: 'exportVSIX'
            });
            document.getElementById('exportMenu').classList.remove('show');
        }

        function applyCSS(css) {
            // Remove existing theme styles
            const existingStyle = document.getElementById('themeStyles');
            if (existingStyle) {
                existingStyle.remove();
            }
            
            // Add new styles
            const style = document.createElement('style');
            style.id = 'themeStyles';
            style.textContent = css;
            document.head.appendChild(style);
        }

        function updateColorPalette(css) {
            const colorList = document.getElementById('colorList');
            const colors = extractColors(css);
            
            colorList.innerHTML = '';
            colors.forEach(({ name, value, property }) => {
                const colorInfo = document.createElement('div');
                colorInfo.className = 'color-info';
                colorInfo.innerHTML = \`
                    <span class="color-swatch" style="background: \${value};"></span>
                    <span>\${name}: \${value}</span>
                    <div class="color-actions">
                        <button class="color-btn" onclick="pickColor('\${property}', '\${value}')">🎨</button>
                        <button class="color-btn" onclick="applyToVSCode('\${property}', '\${value}')">Apply</button>
                    </div>
                \`;
                colorInfo.addEventListener('click', () => {
                    highlightThemeItem(property);
                });
                colorList.appendChild(colorInfo);
            });
        }

        function extractColors(css) {
            const colors = [];
            const lines = css.split('\\n');
            
            lines.forEach(line => {
                const match = line.match(/--vscode-([^:]+):\\s*([^;]+);/);
                if (match) {
                    const property = match[1];
                    const name = property.replace(/-/g, ' ');
                    const value = match[2].trim();
                    colors.push({ name, value, property: property });
                }
            });
            
            return colors.slice(0, 20); // Limit to first 20 colors
        }

        function pickColor(property, currentColor) {
            vscode.postMessage({
                command: 'openColorPicker',
                currentColor: currentColor,
                property: property
            });
        }

        function applyToVSCode(property, color) {
            vscode.postMessage({
                command: 'applyColorToVSCode',
                property: property,
                color: color
            });
        }

        function navigateToThemeItem(themeItem) {
            // Highlight in the current panel
            highlightThemeItem(themeItem);
            
            // Send message to extension
            vscode.postMessage({
                command: 'navigateToItem',
                themeItem: themeItem
            });
        }

        function highlightThemeItem(themeItem) {
            // Remove existing highlights
            document.querySelectorAll('.color-info.highlighted, .theme-item.active').forEach(el => {
                el.classList.remove('highlighted', 'active');
            });
            
            // Highlight the matching color info
            document.querySelectorAll('.color-info').forEach(colorInfo => {
                const spanText = colorInfo.querySelector('span:nth-child(2)').textContent;
                if (spanText.includes(themeItem)) {
                    colorInfo.classList.add('highlighted');
                    colorInfo.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            });
            
            // Highlight the matching theme item
            document.querySelectorAll('.theme-item').forEach(item => {
                if (item.textContent.trim() === themeItem) {
                    item.classList.add('active');
                    item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            });
        }

        function updateColorInCSS(property, newColor) {
            const cssEditor = document.getElementById('cssEditor');
            let css = cssEditor.value;
            
            // Update the CSS with the new color
            const regex = new RegExp(\`(--vscode-\${property}:\\s*)([^;]+)(;)\`, 'g');
            css = css.replace(regex, \`$1\${newColor}$3\`);
            
            cssEditor.value = css;
            applyCSS(css);
            updateColorPalette(css);
            
            vscode.postMessage({
                command: 'updateCSS',
                css: css
            });
        }

        function openAdvancedColorPicker() {
            vscode.postMessage({
                command: 'openColorPicker',
                currentColor: '#1e1e1e',
                property: 'editor.background'
            });
        }

        function showAllThemeItems() {
            vscode.postMessage({
                command: 'navigateToItem'
            });
        }

        // CSS Editor live update
        document.getElementById('cssEditor').addEventListener('input', function(e) {
            const css = e.target.value;
            applyCSS(css);
            updateColorPalette(css);
            
            vscode.postMessage({
                command: 'updateCSS',
                css: css
            });
        });

        function loadSampleTheme() {
            const sampleCSS = \`/* Sample Dark Theme */
:root {
  --vscode-editor-background: #0d1117;
  --vscode-editor-foreground: #c9d1d9;
  --vscode-editorLineNumber-foreground: #484f58;
  --vscode-editor-selectionBackground: #264f78;
}

.keyword { color: #ff7b72; font-weight: bold; }
.string { color: #a5d6ff; }
.comment { color: #8b949e; font-style: italic; }
.function { color: #d2a8ff; }
.variable { color: #ffa657; }
.number { color: #79c0ff; }
\`;
            
            updateThemeDisplay(sampleCSS, 'Sample Dark Theme');
        }

        function resetToDefault() {
            updateThemeDisplay('/* Load a theme to see CSS here */', 'No Theme Loaded');
        }

        function exportCSS() {
            vscode.postMessage({
                command: 'exportCSS'
            });
            document.getElementById('exportMenu').classList.remove('show');
        }

        function formatCSS() {
            const css = document.getElementById('cssEditor').value;
            // Simple CSS formatting
            const formatted = css
                .replace(/\\{/g, ' {\\n  ')
                .replace(/;/g, ';\\n  ')
                .replace(/\\}/g, '\\n}\\n')
                .replace(/\\n\\s*\\n/g, '\\n\\n');
            
            document.getElementById('cssEditor').value = formatted;
            applyCSS(formatted);
        }

        function minifyCSS() {
            const css = document.getElementById('cssEditor').value;
            const minified = css
                .replace(/\\s+/g, ' ')
                .replace(/\\s*\\{\\s*/g, '{')
                .replace(/;\\s*/g, ';')
                .replace(/\\s*\\}\\s*/g, '}')
                .trim();
            
            document.getElementById('cssEditor').value = minified;
            applyCSS(minified);
        }

        // Restore state if available
        const state = vscode.getState();
        if (state && state.css) {
            updateThemeDisplay(state.css, state.themeName || 'Restored Theme');
        }
    </script>
</body>
</html>`;
    }

    public dispose (): void {
        this._panel.dispose();
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
}
