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
                }
            },
            null,
            this._disposables
        );
    }

    public reveal(): void {
        this._panel.reveal(vscode.ViewColumn.Beside);
    }

    public onDidDispose(callback: () => void): void {
        this._panel.onDidDispose(callback, null, this._disposables);
    }

    public updateTheme(cssData: string, themeName: string): void {
        this._currentCSS = cssData;
        this._currentThemeName = themeName;
        this._panel.webview.postMessage({
            command: 'updateTheme',
            css: cssData,
            themeName: themeName
        });
    }

    public getCurrentCSS(): string {
        return this._currentCSS;
    }

    private _getHtmlContent(): string {
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
            padding: 5px;
            background: var(--vscode-editor-lineHighlightBackground, #2a2a2a);
            border-radius: 3px;
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
            <button onclick="loadSampleTheme()">Load Sample Theme</button>
            <button onclick="resetToDefault()">Reset</button>
            <button onclick="exportCSS()">Export CSS</button>
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
                <div class="code-sample">
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

                <div id="colorPalette" style="margin-top: 20px;">
                    <h3>Color Palette</h3>
                    <div id="colorList">
                        <div class="color-info">
                            <span class="color-swatch" style="background: #1e1e1e;"></span>
                            <span>Background: #1e1e1e</span>
                        </div>
                        <div class="color-info">
                            <span class="color-swatch" style="background: #d4d4d4;"></span>
                            <span>Foreground: #d4d4d4</span>
                        </div>
                    </div>
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
            }
        });

        function updateThemeDisplay(css, themeName) {
            currentCSS = css;
            document.getElementById('themeName').textContent = themeName;
            document.getElementById('cssEditor').value = css;
            
            // Apply CSS to preview
            applyCSS(css);
            
            // Update color palette
            updateColorPalette(css);
            
            // Auto-save state
            vscode.setState({ css, themeName });
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
            colors.forEach(({ name, value }) => {
                const colorInfo = document.createElement('div');
                colorInfo.className = 'color-info';
                colorInfo.innerHTML = \`
                    <span class="color-swatch" style="background: \${value};"></span>
                    <span>\${name}: \${value}</span>
                \`;
                colorList.appendChild(colorInfo);
            });
        }

        function extractColors(css) {
            const colors = [];
            const lines = css.split('\\n');
            
            lines.forEach(line => {
                const match = line.match(/--vscode-([^:]+):\\s*([^;]+);/);
                if (match) {
                    const name = match[1].replace(/-/g, ' ');
                    const value = match[2].trim();
                    colors.push({ name, value });
                }
            });
            
            return colors.slice(0, 20); // Limit to first 20 colors
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
                command: 'alert',
                text: 'Use Command Palette: "Theme Preview: Export CSS" to save'
            });
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

    public dispose(): void {
        this._panel.dispose();
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
}
