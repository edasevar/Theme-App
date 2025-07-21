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
exports.NavigationProvider = void 0;
const vscode = __importStar(require("vscode"));
class NavigationProvider {
    static async showElementExamples(context, property) {
        const elementInfo = this.getElementInfo(property);
        const panel = vscode.window.createWebviewPanel('themeElementExamples', `Theme Element: ${property}`, { viewColumn: vscode.ViewColumn.Beside, preserveFocus: false }, {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [context.extensionUri]
        });
        panel.webview.html = this.getExamplesHtml(elementInfo);
        panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'navigateToElement':
                    await this.navigateToElement(message.property);
                    break;
                case 'showInSettings':
                    await this.showInSettings(message.property);
                    break;
                case 'copyProperty':
                    await vscode.env.clipboard.writeText(message.property);
                    vscode.window.showInformationMessage(`Copied: ${message.property}`);
                    break;
                case 'openRelated':
                    await this.showElementExamples(context, message.relatedProperty);
                    break;
                case 'testColor':
                    await this.testColorOnElement(message.property, message.color);
                    break;
            }
        }, undefined, context.subscriptions);
    }
    static getElementInfo(property) {
        // Initialize database if not done
        if (this.elementDatabase.size === 0) {
            this.initializeElementDatabase();
        }
        return this.elementDatabase.get(property) || {
            property,
            description: `Theme property: ${property}`,
            example: 'No specific example available',
            location: 'Various locations in VS Code UI',
            relatedProperties: []
        };
    }
    static initializeElementDatabase() {
        const elements = [
            // Editor Elements
            {
                property: 'editor.background',
                description: 'The main background color of the editor where you write code',
                example: 'The large area behind your code text',
                location: 'Main editor window',
                relatedProperties: ['editor.foreground', 'editor.lineHighlightBackground'],
                vsCodeCommand: 'workbench.action.showCommands',
                demoCode: `function hello() {
    console.log("This background color affects this area");
    return "editor.background";
}`
            },
            {
                property: 'editor.foreground',
                description: 'The default text color in the editor',
                example: 'The color of regular code text (non-syntax highlighted)',
                location: 'Text in the main editor',
                relatedProperties: ['editor.background', 'editorCursor.foreground'],
                demoCode: `// This text color is controlled by editor.foreground
const message = "Default text color";`
            },
            {
                property: 'editor.lineHighlightBackground',
                description: 'Background color of the currently selected line',
                example: 'Subtle highlight behind the line where your cursor is',
                location: 'Current line in editor',
                relatedProperties: ['editor.background', 'editor.lineHighlightBorder']
            },
            {
                property: 'editor.selectionBackground',
                description: 'Background color of selected text',
                example: 'Highlight color when you select code with mouse or keyboard',
                location: 'Selected text in editor',
                relatedProperties: ['editor.selectionForeground', 'editor.inactiveSelectionBackground']
            },
            // Activity Bar Elements
            {
                property: 'activityBar.background',
                description: 'Background of the leftmost vertical bar with icons',
                example: 'The narrow bar with Explorer, Search, Git icons',
                location: 'Left side of VS Code window',
                relatedProperties: ['activityBar.foreground', 'activityBar.activeBorder'],
                vsCodeCommand: 'workbench.view.explorer'
            },
            {
                property: 'activityBar.foreground',
                description: 'Color of icons in the activity bar',
                example: 'Explorer 📁, Search 🔍, Git 🌿 icon colors',
                location: 'Activity bar icons',
                relatedProperties: ['activityBar.background', 'activityBar.inactiveForeground']
            },
            {
                property: 'activityBar.activeBorder',
                description: 'Border color for the currently active activity bar item',
                example: 'Highlight border around the active icon (Explorer, Git, etc.)',
                location: 'Active activity bar icon border',
                relatedProperties: ['activityBar.activeBackground', 'activityBar.foreground']
            },
            // Side Bar Elements
            {
                property: 'sideBar.background',
                description: 'Background of the sidebar (Explorer, Search panels)',
                example: 'The panel showing your file tree, search results',
                location: 'Left panel next to activity bar',
                relatedProperties: ['sideBar.foreground', 'sideBar.border'],
                vsCodeCommand: 'workbench.view.explorer'
            },
            {
                property: 'sideBar.foreground',
                description: 'Text color in the sidebar',
                example: 'File names, folder names, search results text',
                location: 'Text in sidebar panels',
                relatedProperties: ['sideBar.background', 'sideBarTitle.foreground']
            },
            {
                property: 'sideBarTitle.foreground',
                description: 'Color of sidebar section titles',
                example: '"EXPLORER", "OPEN EDITORS", "SEARCH" headers',
                location: 'Sidebar section headers',
                relatedProperties: ['sideBar.foreground', 'sideBarSectionHeader.background']
            },
            // Status Bar Elements
            {
                property: 'statusBar.background',
                description: 'Background of the bottom status bar',
                example: 'The bottom bar showing branch, line numbers, language',
                location: 'Bottom of VS Code window',
                relatedProperties: ['statusBar.foreground', 'statusBar.border'],
                vsCodeCommand: 'workbench.action.toggleStatusbarVisibility'
            },
            {
                property: 'statusBar.foreground',
                description: 'Text color in the status bar',
                example: 'Git branch name, line:column numbers, language mode',
                location: 'Status bar text',
                relatedProperties: ['statusBar.background', 'statusBarItem.hoverBackground']
            },
            // Title Bar Elements
            {
                property: 'titleBar.activeBackground',
                description: 'Background of the window title bar when focused',
                example: 'Top bar showing window title and controls',
                location: 'Top of VS Code window',
                relatedProperties: ['titleBar.activeForeground', 'titleBar.inactiveBackground']
            },
            {
                property: 'titleBar.activeForeground',
                description: 'Text color in the active title bar',
                example: 'Window title text and menu items',
                location: 'Title bar text',
                relatedProperties: ['titleBar.activeBackground', 'titleBar.inactiveForeground']
            },
            // Tab Elements
            {
                property: 'tab.activeBackground',
                description: 'Background of the currently active tab',
                example: 'The highlighted tab of the current open file',
                location: 'Active file tab',
                relatedProperties: ['tab.activeForeground', 'tab.inactiveBackground']
            },
            {
                property: 'tab.activeForeground',
                description: 'Text color of the active tab',
                example: 'Filename text in the active tab',
                location: 'Active tab text',
                relatedProperties: ['tab.activeBackground', 'tab.inactiveForeground']
            },
            {
                property: 'tab.inactiveBackground',
                description: 'Background of inactive tabs',
                example: 'Background of tabs for files that are open but not active',
                location: 'Inactive file tabs',
                relatedProperties: ['tab.inactiveForeground', 'tab.activeBackground']
            },
            // Input Elements
            {
                property: 'input.background',
                description: 'Background of input fields',
                example: 'Search boxes, command palette input, settings search',
                location: 'Input fields throughout VS Code',
                relatedProperties: ['input.foreground', 'input.border']
            },
            {
                property: 'input.foreground',
                description: 'Text color in input fields',
                example: 'Text you type in search boxes and inputs',
                location: 'Input field text',
                relatedProperties: ['input.background', 'input.placeholderForeground']
            },
            // Button Elements
            {
                property: 'button.background',
                description: 'Background color of primary buttons',
                example: 'Action buttons in dialogs and notifications',
                location: 'Primary buttons',
                relatedProperties: ['button.foreground', 'button.hoverBackground']
            },
            {
                property: 'button.foreground',
                description: 'Text color of primary buttons',
                example: 'Text on action buttons',
                location: 'Button text',
                relatedProperties: ['button.background', 'button.secondaryForeground']
            },
            // List Elements
            {
                property: 'list.activeSelectionBackground',
                description: 'Background of selected items in lists when focused',
                example: 'Highlighted file in Explorer, selected search result',
                location: 'Selected list items',
                relatedProperties: ['list.activeSelectionForeground', 'list.inactiveSelectionBackground']
            },
            {
                property: 'list.hoverBackground',
                description: 'Background when hovering over list items',
                example: 'Highlight when you hover over files in Explorer',
                location: 'Hovered list items',
                relatedProperties: ['list.hoverForeground', 'list.activeSelectionBackground']
            }
        ];
        elements.forEach(element => {
            this.elementDatabase.set(element.property, element);
        });
    }
    static async navigateToElement(property) {
        const elementInfo = this.getElementInfo(property);
        if (elementInfo.vsCodeCommand) {
            try {
                await vscode.commands.executeCommand(elementInfo.vsCodeCommand);
                vscode.window.showInformationMessage(`Navigated to show: ${property}. Look for the element described as "${elementInfo.example}"`);
            }
            catch (error) {
                vscode.window.showErrorMessage(`Could not navigate: ${error}`);
            }
        }
        else {
            // Show information about where to find the element
            const action = await vscode.window.showInformationMessage(`${property} is located: ${elementInfo.location}. ${elementInfo.example}`, 'Open Settings', 'Show Command Palette');
            if (action === 'Open Settings') {
                await vscode.commands.executeCommand('workbench.action.openSettings');
            }
            else if (action === 'Show Command Palette') {
                await vscode.commands.executeCommand('workbench.action.showCommands');
            }
        }
    }
    static async showInSettings(property) {
        try {
            await vscode.commands.executeCommand('workbench.action.openSettings', property);
        }
        catch (error) {
            await vscode.commands.executeCommand('workbench.action.openSettings');
            vscode.window.showInformationMessage(`Search for "${property}" in the settings`);
        }
    }
    static async testColorOnElement(property, color) {
        // Temporarily apply the color to test it
        const config = vscode.workspace.getConfiguration();
        const workbenchConfig = config.get('workbench.colorCustomizations') || {};
        // Store original value
        const originalValue = workbenchConfig[property];
        // Apply test color
        workbenchConfig[property] = color;
        await config.update('workbench.colorCustomizations', workbenchConfig, vscode.ConfigurationTarget.Global);
        const action = await vscode.window.showInformationMessage(`Testing ${property} with color ${color}. Do you want to keep this change?`, 'Keep', 'Revert');
        if (action === 'Revert') {
            // Restore original value
            if (originalValue) {
                workbenchConfig[property] = originalValue;
            }
            else {
                delete workbenchConfig[property];
            }
            await config.update('workbench.colorCustomizations', workbenchConfig, vscode.ConfigurationTarget.Global);
        }
    }
    static getExamplesHtml(elementInfo) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Theme Element: ${elementInfo.property}</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            margin: 0;
            line-height: 1.6;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        .header {
            border-bottom: 2px solid var(--vscode-textLink-foreground);
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        .property-name {
            font-size: 1.5em;
            font-weight: bold;
            color: var(--vscode-textLink-foreground);
            font-family: var(--vscode-editor-font-family);
        }
        .description {
            font-size: 1.1em;
            margin-top: 10px;
            opacity: 0.9;
        }
        .section {
            background-color: var(--vscode-textBlockQuote-background);
            border-left: 4px solid var(--vscode-textLink-foreground);
            padding: 15px;
            margin: 20px 0;
            border-radius: 0 5px 5px 0;
        }
        .section-title {
            font-weight: bold;
            color: var(--vscode-textLink-foreground);
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .example-text {
            font-style: italic;
            margin: 10px 0;
        }
        .location {
            background-color: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 0.9em;
            display: inline-block;
            margin: 5px 0;
        }
        .demo-code {
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-widget-border);
            border-radius: 3px;
            padding: 15px;
            font-family: var(--vscode-editor-font-family);
            font-size: 0.9em;
            margin: 10px 0;
            overflow-x: auto;
        }
        .related-properties {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin: 10px 0;
        }
        .related-prop {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 0.85em;
            cursor: pointer;
            border: none;
        }
        .related-prop:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }
        .actions {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin: 20px 0;
        }
        .btn {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: 1px solid var(--vscode-button-border);
            padding: 8px 16px;
            border-radius: 3px;
            cursor: pointer;
            font-family: var(--vscode-font-family);
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .btn:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        .btn-secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        .btn-secondary:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }
        .color-test {
            display: flex;
            align-items: center;
            gap: 10px;
            margin: 15px 0;
        }
        .color-input {
            width: 40px;
            height: 30px;
            border: 1px solid var(--vscode-widget-border);
            border-radius: 3px;
            cursor: pointer;
        }
        .visual-example {
            border: 2px solid var(--vscode-widget-border);
            border-radius: 5px;
            padding: 15px;
            margin: 15px 0;
            background-color: var(--vscode-input-background);
        }
        .highlight {
            background-color: var(--vscode-textLink-activeForeground);
            color: var(--vscode-textLink-background);
            padding: 2px 4px;
            border-radius: 2px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="property-name">${elementInfo.property}</div>
            <div class="description">${elementInfo.description}</div>
        </div>

        <div class="section">
            <div class="section-title">📍 Where to Find This Element</div>
            <div class="location">${elementInfo.location}</div>
            <div class="example-text">"${elementInfo.example}"</div>
        </div>

        ${elementInfo.demoCode ? `
        <div class="section">
            <div class="section-title">💻 Code Example</div>
            <div class="demo-code">${elementInfo.demoCode}</div>
            <p><em>The ${elementInfo.property} property affects the appearance of this code area.</em></p>
        </div>
        ` : ''}

        <div class="section">
            <div class="section-title">🎨 Test This Element</div>
            <div class="color-test">
                <input type="color" class="color-input" id="colorPicker" value="#007acc" />
                <button class="btn" onclick="testColor()">Test Color</button>
                <span>Try different colors to see how they affect this element</span>
            </div>
        </div>

        ${elementInfo.relatedProperties && elementInfo.relatedProperties.length > 0 ? `
        <div class="section">
            <div class="section-title">🔗 Related Properties</div>
            <p>These properties work together with <span class="highlight">${elementInfo.property}</span>:</p>
            <div class="related-properties">
                ${elementInfo.relatedProperties.map(prop => `<button class="related-prop" onclick="openRelated('${prop}')">${prop}</button>`).join('')}
            </div>
        </div>
        ` : ''}

        <div class="visual-example">
            <div class="section-title">🔍 Visual Guide</div>
            <p>This property controls: <strong>${elementInfo.example}</strong></p>
            <p>Location: <strong>${elementInfo.location}</strong></p>
            ${elementInfo.property.includes('background') ?
            '<p>💡 <strong>Tip:</strong> This is a background color property - it affects the area behind text or content.</p>' :
            elementInfo.property.includes('foreground') ?
                '<p>💡 <strong>Tip:</strong> This is a foreground color property - it affects text or icon colors.</p>' :
                '<p>💡 <strong>Tip:</strong> This property affects the visual appearance of UI elements.</p>'}
        </div>

        <div class="actions">
            <button class="btn" onclick="navigateToElement()">
                🧭 Show in VS Code
            </button>
            <button class="btn btn-secondary" onclick="showInSettings()">
                ⚙️ Open in Settings
            </button>
            <button class="btn btn-secondary" onclick="copyProperty()">
                📋 Copy Property Name
            </button>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const property = '${elementInfo.property}';

        function navigateToElement() {
            vscode.postMessage({ 
                command: 'navigateToElement', 
                property: property 
            });
        }

        function showInSettings() {
            vscode.postMessage({ 
                command: 'showInSettings', 
                property: property 
            });
        }

        function copyProperty() {
            vscode.postMessage({ 
                command: 'copyProperty', 
                property: property 
            });
        }

        function openRelated(relatedProperty) {
            vscode.postMessage({ 
                command: 'openRelated', 
                relatedProperty: relatedProperty 
            });
        }

        function testColor() {
            const colorPicker = document.getElementById('colorPicker');
            vscode.postMessage({ 
                command: 'testColor', 
                property: property,
                color: colorPicker.value
            });
        }
    </script>
</body>
</html>`;
    }
}
exports.NavigationProvider = NavigationProvider;
NavigationProvider.elementDatabase = new Map();
//# sourceMappingURL=navigationProvider.js.map