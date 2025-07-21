import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class StartupMenuProvider {
    public static async showStartupMenu(context: vscode.ExtensionContext) {
        const panel = vscode.window.createWebviewPanel(
            'startupMenu',
            'Theme Editor - Start New Project',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [context.extensionUri]
            }
        );

        panel.webview.html = this.getStartupMenuHtml();

        panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'makeNewTheme':
                        await this.makeNewTheme(context);
                        panel.dispose();
                        break;
                    case 'useCurrentTheme':
                        await this.useCurrentTheme(context);
                        panel.dispose();
                        break;
                    case 'chooseTheme':
                        await this.chooseTheme(context);
                        panel.dispose();
                        break;
                    case 'insertJson':
                        await this.insertJsonData(context);
                        panel.dispose();
                        break;
                    case 'insertVsix':
                        await this.insertVsixFile(context);
                        panel.dispose();
                        break;
                    case 'insertCss':
                        await this.insertCssFile(context);
                        panel.dispose();
                        break;
                    case 'randomizeTheme':
                        await this.randomizeTheme(context);
                        panel.dispose();
                        break;
                    case 'generateTheme':
                        await this.generateTheme(context, message.description);
                        panel.dispose();
                        break;
                    case 'cancel':
                        panel.dispose();
                        break;
                }
            },
            undefined,
            context.subscriptions
        );
    }

    private static async makeNewTheme(context: vscode.ExtensionContext) {
        try {
            // Load the ELEMENTS.jsonc file as the default template
            const elementsPath = path.join(context.extensionPath, 'ELEMENTS.jsonc');
            
            if (!fs.existsSync(elementsPath)) {
                vscode.window.showErrorMessage('ELEMENTS.jsonc template file not found.');
                return;
            }

            const elementsContent = fs.readFileSync(elementsPath, 'utf8');
            
            // Create a new untitled document with the template content
            const doc = await vscode.workspace.openTextDocument({
                content: elementsContent,
                language: 'jsonc'
            });
            
            await vscode.window.showTextDocument(doc);
            
            // Open the theme editor
            vscode.commands.executeCommand('themeLivePreview.openPreview');
            
            vscode.window.showInformationMessage('New theme template loaded! Start editing your theme.');
            
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to create new theme: ${error}`);
        }
    }

    private static async useCurrentTheme(context: vscode.ExtensionContext) {
        try {
            // Get the current active theme
            const currentTheme = vscode.workspace.getConfiguration('workbench').get('colorTheme');
            
            if (!currentTheme) {
                vscode.window.showErrorMessage('No active theme found.');
                return;
            }

            // Try to find the theme file
            const extensions = vscode.extensions.all;
            let themeData = null;

            for (const extension of extensions) {
                if (extension.packageJSON.contributes?.themes) {
                    const themes = extension.packageJSON.contributes.themes;
                    const matchingTheme = themes.find((theme: any) => 
                        theme.label === currentTheme || theme.id === currentTheme
                    );
                    
                    if (matchingTheme) {
                        const themePath = path.join(extension.extensionPath, matchingTheme.path);
                        if (fs.existsSync(themePath)) {
                            themeData = fs.readFileSync(themePath, 'utf8');
                            break;
                        }
                    }
                }
            }

            if (!themeData) {
                vscode.window.showErrorMessage('Could not find theme file for current theme.');
                return;
            }

            // Create a new document with the current theme data
            const doc = await vscode.workspace.openTextDocument({
                content: themeData,
                language: 'jsonc'
            });
            
            await vscode.window.showTextDocument(doc);
            vscode.commands.executeCommand('themeLivePreview.openPreview');
            
            vscode.window.showInformationMessage(`Current theme "${currentTheme}" loaded for editing!`);
            
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to load current theme: ${error}`);
        }
    }

    private static async chooseTheme(context: vscode.ExtensionContext) {
        try {
            // Get all available themes
            const extensions = vscode.extensions.all;
            const themes: { label: string, extension: string, path: string }[] = [];

            for (const extension of extensions) {
                if (extension.packageJSON.contributes?.themes) {
                    const extensionThemes = extension.packageJSON.contributes.themes;
                    extensionThemes.forEach((theme: any) => {
                        themes.push({
                            label: `${theme.label || theme.id} (${extension.packageJSON.displayName || extension.packageJSON.name})`,
                            extension: extension.extensionPath,
                            path: theme.path
                        });
                    });
                }
            }

            if (themes.length === 0) {
                vscode.window.showErrorMessage('No themes found in installed extensions.');
                return;
            }

            // Show theme picker
            const selectedTheme = await vscode.window.showQuickPick(
                themes.map(theme => theme.label),
                {
                    placeHolder: 'Select a theme to edit',
                    canPickMany: false
                }
            );

            if (!selectedTheme) {
                return;
            }

            const themeInfo = themes.find(t => t.label === selectedTheme);
            if (!themeInfo) {
                return;
            }

            const themePath = path.join(themeInfo.extension, themeInfo.path);
            
            if (!fs.existsSync(themePath)) {
                vscode.window.showErrorMessage('Theme file not found.');
                return;
            }

            const themeContent = fs.readFileSync(themePath, 'utf8');
            
            const doc = await vscode.workspace.openTextDocument({
                content: themeContent,
                language: 'jsonc'
            });
            
            await vscode.window.showTextDocument(doc);
            vscode.commands.executeCommand('themeLivePreview.openPreview');
            
            vscode.window.showInformationMessage(`Theme "${selectedTheme}" loaded for editing!`);
            
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to choose theme: ${error}`);
        }
    }

    private static async insertJsonData(context: vscode.ExtensionContext) {
        try {
            const fileUri = await vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false,
                canSelectMany: false,
                filters: {
                    'JSON Files': ['json', 'jsonc']
                },
                title: 'Select JSON/JSONC Theme File'
            });

            if (!fileUri || fileUri.length === 0) {
                return;
            }

            const filePath = fileUri[0].fsPath;
            const content = fs.readFileSync(filePath, 'utf8');
            
            const doc = await vscode.workspace.openTextDocument({
                content: content,
                language: 'jsonc'
            });
            
            await vscode.window.showTextDocument(doc);
            vscode.commands.executeCommand('themeLivePreview.openPreview');
            
            vscode.window.showInformationMessage('JSON theme file loaded for editing!');
            
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to load JSON file: ${error}`);
        }
    }

    private static async insertVsixFile(context: vscode.ExtensionContext) {
        try {
            const fileUri = await vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false,
                canSelectMany: false,
                filters: {
                    'VSIX Files': ['vsix']
                },
                title: 'Select VSIX Theme File'
            });

            if (!fileUri || fileUri.length === 0) {
                return;
            }

            // For VSIX files, we need to extract the theme
            vscode.window.showInformationMessage('VSIX file selected. Please extract the theme manually or use the theme chooser option for installed themes.');
            
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to load VSIX file: ${error}`);
        }
    }

    private static async insertCssFile(context: vscode.ExtensionContext) {
        try {
            const fileUri = await vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false,
                canSelectMany: false,
                filters: {
                    'CSS Files': ['css']
                },
                title: 'Select CSS Theme File'
            });

            if (!fileUri || fileUri.length === 0) {
                return;
            }

            const filePath = fileUri[0].fsPath;
            const cssContent = fs.readFileSync(filePath, 'utf8');
            
            // Convert CSS to theme JSON (basic implementation)
            const themeData = await this.convertCSSToTheme(cssContent);
            const themeJson = JSON.stringify(themeData, null, 2);
            
            const doc = await vscode.workspace.openTextDocument({
                content: themeJson,
                language: 'jsonc'
            });
            
            await vscode.window.showTextDocument(doc);
            vscode.commands.executeCommand('themeLivePreview.openPreview');
            
            vscode.window.showInformationMessage('CSS file converted to theme format and loaded for editing!');
            
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to load CSS file: ${error}`);
        }
    }

    private static async randomizeTheme(context: vscode.ExtensionContext) {
        try {
            // Generate a random theme with good color combinations
            const randomTheme = this.generateRandomTheme();
            const themeJson = JSON.stringify(randomTheme, null, 2);
            
            const doc = await vscode.workspace.openTextDocument({
                content: themeJson,
                language: 'jsonc'
            });
            
            await vscode.window.showTextDocument(doc);
            vscode.commands.executeCommand('themeLivePreview.openPreview');
            
            vscode.window.showInformationMessage('Random theme generated! Customize it as needed.');
            
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to generate random theme: ${error}`);
        }
    }

    private static async generateTheme(context: vscode.ExtensionContext, description?: string) {
        try {
            let themeDescription = description;
            
            if (!themeDescription) {
                themeDescription = await vscode.window.showInputBox({
                    prompt: 'Describe the theme you want to generate',
                    placeHolder: 'E.g., Dark theme with blue accents and high contrast'
                });
            }

            if (!themeDescription) {
                return;
            }

            // Generate AI-guided theme based on description
            const aiTheme = this.generateAIGuidedTheme(themeDescription);
            const themeJson = JSON.stringify(aiTheme, null, 2);
            
            const doc = await vscode.workspace.openTextDocument({
                content: themeJson,
                language: 'jsonc'
            });
            
            await vscode.window.showTextDocument(doc);
            vscode.commands.executeCommand('themeLivePreview.openPreview');
            
            vscode.window.showInformationMessage(`AI-generated theme based on "${themeDescription}" is ready for editing!`);
            
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to generate AI theme: ${error}`);
        }
    }

    private static async convertCSSToTheme(cssContent: string): Promise<any> {
        const themeData: any = {
            name: "Converted from CSS",
            type: "dark",
            colors: {},
            tokenColors: []
        };

        // Basic CSS custom property parsing
        const cssVarRegex = /--([^:]+):\s*([^;]+);/g;
        let match;

        while ((match = cssVarRegex.exec(cssContent)) !== null) {
            const [, property, value] = match;
            const cleanProperty = property.trim();
            const cleanValue = value.trim();

            // Map common CSS variables to VS Code theme properties
            if (cleanProperty.includes('editor-background')) {
                themeData.colors['editor.background'] = cleanValue;
            } else if (cleanProperty.includes('editor-foreground')) {
                themeData.colors['editor.foreground'] = cleanValue;
            } else if (cleanProperty.includes('sidebar-background')) {
                themeData.colors['sideBar.background'] = cleanValue;
            } else if (cleanProperty.includes('activity-bar-background')) {
                themeData.colors['activityBar.background'] = cleanValue;
            }
        }

        return themeData;
    }

    private static generateRandomTheme(): any {
        const colors = [
            '#1a1a1a', '#2d2d30', '#3c3c3c', '#007acc', '#0e639c', '#1177bb',
            '#f1f1f1', '#cccccc', '#d4d4d4', '#569cd6', '#4fc1ff', '#9cdcfe',
            '#ce9178', '#d7ba7d', '#c586c0', '#4ec9b0', '#b5cea8', '#6a9955'
        ];

        const randomColor = () => colors[Math.floor(Math.random() * colors.length)];

        return {
            name: "Random Generated Theme",
            type: "dark",
            colors: {
                "editor.background": randomColor(),
                "editor.foreground": randomColor(),
                "sideBar.background": randomColor(),
                "activityBar.background": randomColor(),
                "statusBar.background": randomColor(),
                "titleBar.activeBackground": randomColor()
            },
            tokenColors: [
                {
                    scope: ["comment"],
                    settings: { foreground: randomColor(), fontStyle: "italic" }
                },
                {
                    scope: ["keyword"],
                    settings: { foreground: randomColor(), fontStyle: "bold" }
                },
                {
                    scope: ["string"],
                    settings: { foreground: randomColor() }
                }
            ]
        };
    }

    private static generateAIGuidedTheme(description: string): any {
        // AI-guided theme generation based on description keywords
        const isDark = description.toLowerCase().includes('dark');
        const isLight = description.toLowerCase().includes('light');
        const hasBlue = description.toLowerCase().includes('blue');
        const hasGreen = description.toLowerCase().includes('green');
        const hasRed = description.toLowerCase().includes('red');
        const hasPurple = description.toLowerCase().includes('purple');
        const isHighContrast = description.toLowerCase().includes('high contrast');

        let baseColors = {
            background: isDark ? '#1e1e1e' : '#ffffff',
            foreground: isDark ? '#d4d4d4' : '#333333',
            accent: '#007acc'
        };

        if (hasBlue) baseColors.accent = '#007acc';
        else if (hasGreen) baseColors.accent = '#4ec9b0';
        else if (hasRed) baseColors.accent = '#f44747';
        else if (hasPurple) baseColors.accent = '#c586c0';

        if (isHighContrast) {
            baseColors.background = isDark ? '#000000' : '#ffffff';
            baseColors.foreground = isDark ? '#ffffff' : '#000000';
        }

        return {
            name: `AI Generated: ${description}`,
            type: isDark ? "dark" : "light",
            colors: {
                "editor.background": baseColors.background,
                "editor.foreground": baseColors.foreground,
                "sideBar.background": isDark ? '#252526' : '#f3f3f3',
                "activityBar.background": isDark ? '#2d2d30' : '#eeeeee',
                "statusBar.background": baseColors.accent,
                "titleBar.activeBackground": isDark ? '#3c3c3c' : '#dddddd'
            },
            tokenColors: [
                {
                    scope: ["comment"],
                    settings: { 
                        foreground: isDark ? '#6a9955' : '#008000',
                        fontStyle: "italic"
                    }
                },
                {
                    scope: ["keyword"],
                    settings: { 
                        foreground: baseColors.accent,
                        fontStyle: "bold"
                    }
                },
                {
                    scope: ["string"],
                    settings: { 
                        foreground: isDark ? '#ce9178' : '#a31515'
                    }
                }
            ]
        };
    }

    private static getStartupMenuHtml(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Theme Editor - Start New Project</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            margin: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
        }
        h1 {
            text-align: center;
            color: var(--vscode-textLink-foreground);
            margin-bottom: 30px;
        }
        .menu-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        .menu-item {
            background-color: var(--vscode-button-background);
            border: 1px solid var(--vscode-button-border);
            color: var(--vscode-button-foreground);
            padding: 15px;
            border-radius: 5px;
            cursor: pointer;
            transition: all 0.2s ease;
            text-align: left;
        }
        .menu-item:hover {
            background-color: var(--vscode-button-hoverBackground);
            transform: translateY(-2px);
        }
        .menu-item h3 {
            margin: 0 0 8px 0;
            color: var(--vscode-textLink-foreground);
        }
        .menu-item p {
            margin: 0;
            font-size: 0.9em;
            opacity: 0.8;
        }
        .generate-section {
            background-color: var(--vscode-editor-background);
            border: 2px solid var(--vscode-textLink-foreground);
            border-radius: 8px;
            padding: 20px;
            margin-top: 20px;
        }
        .generate-section h3 {
            color: var(--vscode-textLink-foreground);
            margin-top: 0;
        }
        .input-group {
            margin-bottom: 15px;
        }
        .input-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        .input-group textarea {
            width: 100%;
            padding: 8px;
            border: 1px solid var(--vscode-input-border);
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 3px;
            resize: vertical;
            min-height: 80px;
            font-family: var(--vscode-font-family);
        }
        .button-group {
            display: flex;
            gap: 10px;
            justify-content: center;
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
    </style>
</head>
<body>
    <div class="container">
        <h1>🎨 Theme Editor - Start New Project</h1>
        
        <div class="menu-grid">
            <div class="menu-item" onclick="executeCommand('makeNewTheme')">
                <h3>🆕 Make New Theme</h3>
                <p>Start with a blank template (ELEMENTS.jsonc) for creating a brand new theme</p>
            </div>
            
            <div class="menu-item" onclick="executeCommand('useCurrentTheme')">
                <h3>🎯 Use Current Theme</h3>
                <p>Export and edit the currently active VS Code theme</p>
            </div>
            
            <div class="menu-item" onclick="executeCommand('chooseTheme')">
                <h3>📋 Choose Theme</h3>
                <p>Select from any installed VS Code theme to edit</p>
            </div>
            
            <div class="menu-item" onclick="executeCommand('insertJson')">
                <h3>📄 Insert JSON/JSONC</h3>
                <p>Load a theme file (.json or .jsonc) for editing</p>
            </div>
            
            <div class="menu-item" onclick="executeCommand('insertVsix')">
                <h3>📦 Insert VSIX File</h3>
                <p>Load a theme from a VSIX extension package</p>
            </div>
            
            <div class="menu-item" onclick="executeCommand('insertCss')">
                <h3>🎨 Insert CSS File</h3>
                <p>Convert a CSS file to VS Code theme format</p>
            </div>
            
            <div class="menu-item" onclick="executeCommand('randomizeTheme')">
                <h3>🎲 Randomize Theme</h3>
                <p>Generate a random theme with good color combinations</p>
            </div>
        </div>
        
        <div class="generate-section">
            <h3>🤖 AI-Generated Theme</h3>
            <div class="input-group">
                <label for="themeDescription">Describe your ideal theme:</label>
                <textarea 
                    id="themeDescription" 
                    placeholder="E.g., Dark theme with blue accents and high contrast, suitable for long coding sessions..."
                ></textarea>
            </div>
            <button class="btn" onclick="generateTheme()">Generate Theme</button>
        </div>
        
        <div class="button-group">
            <button class="btn btn-secondary" onclick="executeCommand('cancel')">Cancel</button>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        function executeCommand(command) {
            vscode.postMessage({ command: command });
        }
        
        function generateTheme() {
            const description = document.getElementById('themeDescription').value;
            vscode.postMessage({ 
                command: 'generateTheme', 
                description: description 
            });
        }
    </script>
</body>
</html>`;
    }
}
