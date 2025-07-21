import * as vscode from 'vscode';

export interface ValueEditOptions {
    property: string;
    currentValue: string;
    originalValue?: string;
    description?: string;
    suggestions?: string[];
    onValueChange?: (value: string) => void;
    onApply?: (value: string) => void;
    onCancel?: () => void;
}

export class ValueEditorProvider {
    private static activeEditors: Map<string, vscode.WebviewPanel> = new Map();

    public static async showValueEditor(
        context: vscode.ExtensionContext,
        options: ValueEditOptions
    ): Promise<string | undefined> {
        return new Promise((resolve) => {
            // Close existing editor for this property if any
            if (this.activeEditors.has(options.property)) {
                this.activeEditors.get(options.property)?.dispose();
            }

            const panel = vscode.window.createWebviewPanel(
                'valueEditor',
                `Edit: ${options.property}`,
                { viewColumn: vscode.ViewColumn.Beside, preserveFocus: false },
                {
                    enableScripts: true,
                    retainContextWhenHidden: true,
                    localResourceRoots: [context.extensionUri]
                }
            );

            // Store the editor
            this.activeEditors.set(options.property, panel);

            // Set up the HTML
            panel.webview.html = this.getValueEditorHtml(options);

            // Handle messages from webview
            panel.webview.onDidReceiveMessage(
                async (message) => {
                    switch (message.command) {
                        case 'valueChange':
                            if (options.onValueChange) {
                                options.onValueChange(message.value);
                            }
                            break;
                        case 'apply':
                            if (options.onApply) {
                                options.onApply(message.value);
                            }
                            resolve(message.value);
                            panel.dispose();
                            break;
                        case 'cancel':
                            if (options.onCancel) {
                                options.onCancel();
                            }
                            resolve(undefined);
                            panel.dispose();
                            break;
                        case 'reset':
                            // Reset to original value
                            panel.webview.postMessage({
                                command: 'setValue',
                                value: options.originalValue || ''
                            });
                            if (options.onValueChange) {
                                options.onValueChange(options.originalValue || '');
                            }
                            break;
                        case 'requestSuggestions':
                            // Send color suggestions based on property type
                            const suggestions = this.generateSuggestions(options.property, message.value);
                            panel.webview.postMessage({
                                command: 'updateSuggestions',
                                suggestions: suggestions
                            });
                            break;
                        case 'showExamples':
                            // Import and show navigation examples
                            const { NavigationProvider } = await import('./navigationProvider');
                            await NavigationProvider.showElementExamples(context, options.property);
                            break;
                    }
                },
                undefined,
                context.subscriptions
            );

            // Handle panel disposal
            panel.onDidDispose(() => {
                this.activeEditors.delete(options.property);
                if (options.onCancel) {
                    options.onCancel();
                }
                resolve(undefined);
            });
        });
    }

    private static generateSuggestions(property: string, currentValue: string): string[] {
        const suggestions: string[] = [];

        // Color suggestions based on property type
        if (property.includes('background')) {
            suggestions.push(
                '#1e1e1e', '#2d2d30', '#252526', '#3c3c3c', '#464647',
                '#ffffff', '#f3f3f3', '#eeeeee', '#e5e5e5'
            );
        } else if (property.includes('foreground')) {
            suggestions.push(
                '#d4d4d4', '#cccccc', '#ffffff', '#969696', '#858585',
                '#333333', '#2d2d30', '#1e1e1e', '#000000'
            );
        } else if (property.includes('accent') || property.includes('highlight')) {
            suggestions.push(
                '#007acc', '#0e639c', '#1177bb', '#569cd6', '#4fc1ff',
                '#f44747', '#ff6b6b', '#4ec9b0', '#c586c0', '#d7ba7d'
            );
        } else {
            // General color suggestions
            suggestions.push(
                '#1e1e1e', '#2d2d30', '#252526', '#3c3c3c', '#007acc',
                '#d4d4d4', '#cccccc', '#ffffff', '#f44747', '#4ec9b0'
            );
        }

        // Filter out current value if it exists
        return suggestions.filter(s => s !== currentValue);
    }

    private static getValueEditorHtml(options: ValueEditOptions): string {
        const isColorProperty = options.property.toLowerCase().includes('color') || 
                               options.property.toLowerCase().includes('background') || 
                               options.property.toLowerCase().includes('foreground') ||
                               options.currentValue.startsWith('#');

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Edit ${options.property}</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            margin: 0;
            min-height: 100vh;
            box-sizing: border-box;
        }
        .container {
            max-width: 500px;
            margin: 0 auto;
        }
        .header {
            margin-bottom: 20px;
            border-bottom: 1px solid var(--vscode-widget-border);
            padding-bottom: 15px;
        }
        .property-name {
            font-size: 1.2em;
            font-weight: bold;
            color: var(--vscode-textLink-foreground);
            margin-bottom: 5px;
        }
        .description {
            font-size: 0.9em;
            opacity: 0.8;
            margin-bottom: 10px;
        }
        .value-section {
            margin-bottom: 20px;
        }
        .value-label {
            display: block;
            margin-bottom: 8px;
            font-weight: bold;
        }
        .value-input-container {
            position: relative;
            display: flex;
            gap: 10px;
            align-items: center;
            margin-bottom: 15px;
        }
        .value-input {
            flex: 1;
            padding: 8px 12px;
            border: 1px solid var(--vscode-input-border);
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 3px;
            font-family: var(--vscode-editor-font-family);
            font-size: 14px;
        }
        .color-preview {
            width: 30px;
            height: 30px;
            border: 1px solid var(--vscode-widget-border);
            border-radius: 3px;
            cursor: pointer;
            flex-shrink: 0;
        }
        .color-picker {
            border: none;
            width: 30px;
            height: 30px;
            border-radius: 3px;
            cursor: pointer;
            opacity: 0;
            position: absolute;
            top: 0;
            right: 0;
        }
        .comparison-section {
            background-color: var(--vscode-textBlockQuote-background);
            border-left: 4px solid var(--vscode-textLink-foreground);
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 0 3px 3px 0;
        }
        .comparison-title {
            font-weight: bold;
            margin-bottom: 10px;
            color: var(--vscode-textLink-foreground);
        }
        .value-comparison {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
        }
        .value-item {
            flex: 1;
            min-width: 200px;
        }
        .value-item-label {
            font-size: 0.85em;
            opacity: 0.7;
            margin-bottom: 5px;
        }
        .value-item-value {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 6px 8px;
            background-color: var(--vscode-editor-background);
            border-radius: 3px;
            border: 1px solid var(--vscode-widget-border);
            font-family: var(--vscode-editor-font-family);
        }
        .value-item-color {
            width: 20px;
            height: 20px;
            border: 1px solid var(--vscode-widget-border);
            border-radius: 2px;
            flex-shrink: 0;
        }
        .suggestions-section {
            margin-bottom: 20px;
        }
        .suggestions-title {
            font-weight: bold;
            margin-bottom: 10px;
        }
        .suggestions-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
            gap: 8px;
        }
        .suggestion-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 8px;
            background-color: var(--vscode-button-background);
            border: 1px solid var(--vscode-button-border);
            border-radius: 3px;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        .suggestion-item:hover {
            background-color: var(--vscode-button-hoverBackground);
            transform: translateY(-1px);
        }
        .suggestion-color {
            width: 24px;
            height: 24px;
            border: 1px solid var(--vscode-widget-border);
            border-radius: 2px;
            margin-bottom: 4px;
        }
        .suggestion-text {
            font-size: 0.75em;
            font-family: var(--vscode-editor-font-family);
        }
        .button-group {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
            margin-top: 20px;
        }
        .btn {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: 1px solid var(--vscode-button-border);
            padding: 8px 16px;
            border-radius: 3px;
            cursor: pointer;
            font-family: var(--vscode-font-family);
            font-size: 13px;
        }
        .btn:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        .btn-primary {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        .btn-secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        .btn-secondary:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }
        .live-preview {
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-widget-border);
            border-radius: 3px;
            padding: 15px;
            margin-bottom: 20px;
        }
        .preview-title {
            font-weight: bold;
            margin-bottom: 10px;
            color: var(--vscode-textLink-foreground);
        }
        .preview-demo {
            padding: 10px;
            border-radius: 3px;
            border: 1px solid var(--vscode-widget-border);
            background-color: var(--vscode-textBlockQuote-background);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="property-name">${options.property}</div>
            ${options.description ? `<div class="description">${options.description}</div>` : ''}
        </div>

        <div class="value-section">
            <label class="value-label">Value:</label>
            <div class="value-input-container">
                <input type="text" class="value-input" id="valueInput" value="${options.currentValue}" />
                ${isColorProperty ? `
                    <div class="color-preview" id="colorPreview" style="background-color: ${options.currentValue}"></div>
                    <input type="color" class="color-picker" id="colorPicker" value="${options.currentValue}" />
                ` : ''}
            </div>
        </div>

        <div class="comparison-section">
            <div class="comparison-title">🔍 Value Comparison</div>
            <div class="value-comparison">
                <div class="value-item">
                    <div class="value-item-label">Current Value</div>
                    <div class="value-item-value">
                        ${isColorProperty ? `<div class="value-item-color" id="currentColor" style="background-color: ${options.currentValue}"></div>` : ''}
                        <span id="currentValue">${options.currentValue}</span>
                    </div>
                </div>
                ${options.originalValue ? `
                <div class="value-item">
                    <div class="value-item-label">Original Value</div>
                    <div class="value-item-value">
                        ${isColorProperty ? `<div class="value-item-color" style="background-color: ${options.originalValue}"></div>` : ''}
                        <span>${options.originalValue}</span>
                    </div>
                </div>
                ` : ''}
            </div>
        </div>

        ${isColorProperty ? `
        <div class="live-preview">
            <div class="preview-title">🎨 Live Preview</div>
            <div class="preview-demo" id="previewDemo">
                Sample text with the selected color
            </div>
        </div>
        ` : ''}

        <div class="suggestions-section">
            <div class="suggestions-title">💡 Suggestions</div>
            <div class="suggestions-grid" id="suggestionsGrid">
                <!-- Suggestions will be populated here -->
            </div>
        </div>

        <div class="button-group">
            <button class="btn btn-secondary" onclick="showExamples()">🧭 Show Examples</button>
            ${options.originalValue ? '<button class="btn btn-secondary" onclick="resetToOriginal()">Reset to Original</button>' : ''}
            <button class="btn btn-secondary" onclick="cancel()">Cancel</button>
            <button class="btn btn-primary" onclick="apply()">Apply</button>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const valueInput = document.getElementById('valueInput');
        const colorPreview = document.getElementById('colorPreview');
        const colorPicker = document.getElementById('colorPicker');
        const currentValue = document.getElementById('currentValue');
        const currentColor = document.getElementById('currentColor');
        const previewDemo = document.getElementById('previewDemo');
        const suggestionsGrid = document.getElementById('suggestionsGrid');

        let isColorProperty = ${isColorProperty};

        // Set up event listeners
        valueInput.addEventListener('input', function() {
            const value = this.value;
            updateValue(value);
            vscode.postMessage({ command: 'valueChange', value: value });
        });

        if (colorPicker) {
            colorPicker.addEventListener('input', function() {
                const value = this.value;
                valueInput.value = value;
                updateValue(value);
                vscode.postMessage({ command: 'valueChange', value: value });
            });

            colorPreview.addEventListener('click', function() {
                colorPicker.click();
            });
        }

        function updateValue(value) {
            if (currentValue) currentValue.textContent = value;
            
            if (isColorProperty) {
                if (colorPreview) colorPreview.style.backgroundColor = value;
                if (currentColor) currentColor.style.backgroundColor = value;
                if (previewDemo) {
                    if ('${options.property}'.includes('background')) {
                        previewDemo.style.backgroundColor = value;
                    } else if ('${options.property}'.includes('foreground')) {
                        previewDemo.style.color = value;
                    } else {
                        previewDemo.style.borderColor = value;
                    }
                }
            }
        }

        function apply() {
            vscode.postMessage({ command: 'apply', value: valueInput.value });
        }

        function cancel() {
            vscode.postMessage({ command: 'cancel' });
        }

        function resetToOriginal() {
            vscode.postMessage({ command: 'reset' });
        }

        function showExamples() {
            vscode.postMessage({ command: 'showExamples' });
        }

        function selectSuggestion(value) {
            valueInput.value = value;
            updateValue(value);
            vscode.postMessage({ command: 'valueChange', value: value });
        }

        function updateSuggestions(suggestions) {
            suggestionsGrid.innerHTML = '';
            suggestions.forEach(suggestion => {
                const item = document.createElement('div');
                item.className = 'suggestion-item';
                item.onclick = () => selectSuggestion(suggestion);
                
                if (isColorProperty) {
                    item.innerHTML = \`
                        <div class="suggestion-color" style="background-color: \${suggestion}"></div>
                        <div class="suggestion-text">\${suggestion}</div>
                    \`;
                } else {
                    item.innerHTML = \`<div class="suggestion-text">\${suggestion}</div>\`;
                }
                
                suggestionsGrid.appendChild(item);
            });
        }

        // Listen for messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'setValue':
                    valueInput.value = message.value;
                    updateValue(message.value);
                    break;
                case 'updateSuggestions':
                    updateSuggestions(message.suggestions);
                    break;
            }
        });

        // Initialize
        vscode.postMessage({ command: 'requestSuggestions', value: valueInput.value });
    </script>
</body>
</html>`;
    }
}
