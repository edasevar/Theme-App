// @ts-nocheck
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
var __importStar = (this && this.__importStar) || function(mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const themeExtractor_1 = require("./themeExtractor");
const previewPanel_1 = require("./previewPanel");
const sidebarProvider_1 = require("./sidebarProvider");
function activate(context) {
    console.log('Theme Live Preview extension is now active!');
    const themeExtractor = new themeExtractor_1.ThemeExtractor();
    let previewPanel;
    // Register the sidebar provider
    const sidebarProvider = new sidebarProvider_1.SidebarProvider(context.extensionUri);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(sidebarProvider_1.SidebarProvider.viewType, sidebarProvider));
    // Command to update preview from sidebar
    const updatePreviewCommand = vscode.commands.registerCommand('themeLivePreview.updatePreview', (theme) => {
        if (previewPanel) {
            // Convert theme object to CSS string
            const cssString = themeExtractor.convertThemeToCSS(theme);
            previewPanel.updateTheme(cssString, 'Sidebar Theme');
        }
    });
    // Command to open the live preview panel
    const openPreviewCommand = vscode.commands.registerCommand('themeLivePreview.openPreview', async () => {
        if (previewPanel) {
            previewPanel.reveal();
        }
        else {
            // Show startup options when opening for the first time
            const shouldShowOptions = await showStartupOptions();
            if (!shouldShowOptions) {
                previewPanel = new previewPanel_1.PreviewPanel(context.extensionUri, themeExtractor);
                previewPanel.onDidDispose(() => {
                    previewPanel = undefined;
                });
            }
        }
    });
    // Command to load a theme file
    const loadThemeCommand = vscode.commands.registerCommand('themeLivePreview.loadTheme', async (uri) => {
        let filePath;
        if (uri) {
            filePath = uri.fsPath;
        }
        else {
            const fileUri = await vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false,
                canSelectMany: false,
                filters: {
                    'Theme Files': ['json', 'vsix']
                },
                title: 'Select Theme File'
            });
            if (!fileUri || fileUri.length === 0) {
                return;
            }
            filePath = fileUri[0].fsPath;
        }
        try {
            const cssData = await themeExtractor.extractTheme(filePath);
            if (cssData) {
                if (!previewPanel) {
                    previewPanel = new previewPanel_1.PreviewPanel(context.extensionUri, themeExtractor);
                    previewPanel.onDidDispose(() => {
                        previewPanel = undefined;
                    });
                }
                previewPanel.updateTheme(cssData, path.basename(filePath));
                vscode.window.showInformationMessage(`Theme loaded: ${path.basename(filePath)}`);
            }
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to load theme: ${error}`);
        }
    });
    // Command to export CSS
    const exportCSSCommand = vscode.commands.registerCommand('themeLivePreview.exportCSS', async () => {
        if (!previewPanel || !previewPanel.getCurrentCSS()) {
            vscode.window.showWarningMessage('No theme loaded to export');
            return;
        }
        const saveUri = await vscode.window.showSaveDialog({
            filters: {
                'CSS Files': ['css']
            },
            defaultUri: vscode.Uri.file('theme-export.css')
        });
        if (saveUri) {
            try {
                await vscode.workspace.fs.writeFile(saveUri, Buffer.from(previewPanel.getCurrentCSS()));
                vscode.window.showInformationMessage(`CSS exported to: ${saveUri.fsPath}`);
            }
            catch (error) {
                vscode.window.showErrorMessage(`Failed to export CSS: ${error}`);
            }
        }
    });
    // Command to open color picker
    const openColorPickerCommand = vscode.commands.registerCommand('themeLivePreview.openColorPicker', async () => {
        if (!previewPanel) {
            vscode.window.showWarningMessage('Please open Theme Live Preview first');
            return;
        }
        const currentColor = await vscode.window.showInputBox({
            prompt: 'Enter current color value (hex, rgb, etc.)',
            placeHolder: '#1e1e1e',
            value: '#1e1e1e'
        });
        if (currentColor) {
            previewPanel.openColorPicker(currentColor);
        }
    });
    // Command to navigate to theme item in VS Code
    const navigateToItemCommand = vscode.commands.registerCommand('themeLivePreview.navigateToItem', async (themeItem) => {
        let selectedItem = themeItem;
        if (!selectedItem) {
            const themeItems = [
                'editor.background',
                'editor.foreground',
                'activityBar.background',
                'activityBar.foreground',
                'sideBar.background',
                'sideBar.foreground',
                'statusBar.background',
                'statusBar.foreground',
                'panel.background',
                'panel.foreground',
                'terminal.background',
                'terminal.foreground',
                'button.background',
                'button.foreground',
                'input.background',
                'input.foreground',
                'list.activeSelectionBackground',
                'list.activeSelectionForeground',
                'editorLineNumber.foreground',
                'editorCursor.foreground'
            ];
            selectedItem = await vscode.window.showQuickPick(themeItems, {
                placeHolder: 'Select a theme item to navigate to in VS Code'
            });
        }
        if (selectedItem && previewPanel) {
            previewPanel.navigateToThemeItem(selectedItem);
            // Also show in VS Code settings if possible
            await showThemeItemInSettings(selectedItem);
        }
    });
    async function showThemeItemInSettings(themeItem) {
        try {
            // Open workbench.colorCustomizations in settings
            await vscode.commands.executeCommand('workbench.action.openSettings', 'workbench.colorCustomizations');
            // Show information about the theme item
            vscode.window.showInformationMessage(`Theme item: ${themeItem}. You can customize this in "workbench.colorCustomizations" in settings.`, 'Open Settings JSON').then(selection => {
                if (selection === 'Open Settings JSON') {
                    vscode.commands.executeCommand('workbench.action.openSettingsJson');
                }
            });
        }
        catch (error) {
            console.error('Error showing theme item in settings:', error);
        }
    }
    async function showStartupOptions() {
        const option = await vscode.window.showQuickPick([
            {
                label: '📦 Load .vsix Theme File',
                description: 'Load an existing theme from a .vsix package',
                detail: 'Browse and load themes from VS Code marketplace downloads',
                action: 'loadVsix'
            },
            {
                label: '📝 Enter CSS Directly',
                description: 'Paste or type CSS directly into the editor',
                detail: 'Start with existing CSS code or write from scratch',
                action: 'enterCSS'
            },
            {
                label: '🎨 Create New Theme',
                description: 'Start with a template and customize',
                detail: 'Begin with a base theme template and make modifications',
                action: 'createNew'
            },
            {
                label: '🔧 Open Empty Preview',
                description: 'Open the preview panel without any theme',
                detail: 'Start with an empty workspace',
                action: 'empty'
            }
        ], {
            placeHolder: 'How would you like to start with Theme Live Preview?',
            title: 'Theme Live Preview - Getting Started'
        });
        if (!option) {
            return false; // User cancelled
        }
        // Create the preview panel first
        if (!previewPanel) {
            previewPanel = new previewPanel_1.PreviewPanel(context.extensionUri, themeExtractor);
            previewPanel.onDidDispose(() => {
                previewPanel = undefined;
            });
        }
        // Handle the selected option
        switch (option.action) {
            case 'loadVsix':
                await vscode.commands.executeCommand('themeLivePreview.loadTheme');
                break;
            case 'enterCSS':
                await vscode.commands.executeCommand('themeLivePreview.enterCSS');
                break;
            case 'createNew':
                await vscode.commands.executeCommand('themeLivePreview.createNewTheme');
                break;
            case 'empty':
                // Just show the empty panel
                break;
        }
        return true;
    }
    // Command to show startup options
    const showStartupOptionsCommand = vscode.commands.registerCommand('themeLivePreview.showStartupOptions', async () => {
        await showStartupOptions();
    });
    // Command to enter CSS directly
    const enterCSSCommand = vscode.commands.registerCommand('themeLivePreview.enterCSS', async () => {
        const cssInput = await vscode.window.showInputBox({
            prompt: 'Enter your CSS code',
            placeHolder: 'Paste or type CSS here...',
            value: `/* Custom Theme CSS */\n:root {\n  --vscode-editor-background: #1e1e1e;\n  --vscode-editor-foreground: #d4d4d4;\n}\n\n.keyword { color: #569cd6; }\n.string { color: #ce9178; }\n.comment { color: #6a9955; }`,
            validateInput: (value) => {
                if (!value.trim()) {
                    return 'Please enter some CSS code';
                }
                return null;
            }
        });
        if (cssInput) {
            if (!previewPanel) {
                previewPanel = new previewPanel_1.PreviewPanel(context.extensionUri, themeExtractor);
                previewPanel.onDidDispose(() => {
                    previewPanel = undefined;
                });
            }
            previewPanel.updateTheme(cssInput, 'Custom CSS Theme');
            vscode.window.showInformationMessage('Custom CSS loaded successfully!');
        }
    });
    // Command to create a new theme
    const createNewThemeCommand = vscode.commands.registerCommand('themeLivePreview.createNewTheme', async () => {
        const templates = [
            {
                label: '🌙 Dark Theme Template',
                description: 'Start with a dark theme base',
                css: `/* Dark Theme Template */
:root {
  --vscode-editor-background: #0d1117;
  --vscode-editor-foreground: #c9d1d9;
  --vscode-editorLineNumber-foreground: #484f58;
  --vscode-editor-selectionBackground: #264f78;
  --vscode-activityBar-background: #21262d;
  --vscode-activityBar-foreground: #f0f6fc;
  --vscode-sideBar-background: #161b22;
  --vscode-sideBar-foreground: #c9d1d9;
  --vscode-statusBar-background: #21262d;
  --vscode-statusBar-foreground: #f0f6fc;
}

.keyword { color: #ff7b72; font-weight: bold; }
.string { color: #a5d6ff; }
.comment { color: #8b949e; font-style: italic; }
.function { color: #d2a8ff; }
.variable { color: #ffa657; }
.number { color: #79c0ff; }`
            },
            {
                label: '☀️ Light Theme Template',
                description: 'Start with a light theme base',
                css: `/* Light Theme Template */
:root {
  --vscode-editor-background: #ffffff;
  --vscode-editor-foreground: #24292f;
  --vscode-editorLineNumber-foreground: #656d76;
  --vscode-editor-selectionBackground: #0969da20;
  --vscode-activityBar-background: #f6f8fa;
  --vscode-activityBar-foreground: #24292f;
  --vscode-sideBar-background: #f6f8fa;
  --vscode-sideBar-foreground: #24292f;
  --vscode-statusBar-background: #f6f8fa;
  --vscode-statusBar-foreground: #24292f;
}

.keyword { color: #cf222e; font-weight: bold; }
.string { color: #0a3069; }
.comment { color: #6e7781; font-style: italic; }
.function { color: #8250df; }
.variable { color: #953800; }
.number { color: #0969da; }`
            },
            {
                label: '🎨 High Contrast Template',
                description: 'Start with a high contrast theme base',
                css: `/* High Contrast Theme Template */
:root {
  --vscode-editor-background: #000000;
  --vscode-editor-foreground: #ffffff;
  --vscode-editorLineNumber-foreground: #858585;
  --vscode-editor-selectionBackground: #ffffff40;
  --vscode-activityBar-background: #000000;
  --vscode-activityBar-foreground: #ffffff;
  --vscode-sideBar-background: #000000;
  --vscode-sideBar-foreground: #ffffff;
  --vscode-statusBar-background: #000000;
  --vscode-statusBar-foreground: #ffffff;
}

.keyword { color: #00ffff; font-weight: bold; }
.string { color: #00ff00; }
.comment { color: #7ca668; font-style: italic; }
.function { color: #ffff00; }
.variable { color: #ff8c00; }
.number { color: #ff69b4; }`
            },
            {
                label: '🌈 Custom Blank Template',
                description: 'Start with minimal CSS structure',
                css: `/* Custom Theme - Start Here */
:root {
  /* Editor Colors */
  --vscode-editor-background: #1e1e1e;
  --vscode-editor-foreground: #d4d4d4;
  
  /* Add your custom colors here */
}

/* Syntax Highlighting */
.keyword { color: #569cd6; }
.string { color: #ce9178; }
.comment { color: #6a9955; }
.function { color: #dcdcaa; }
.variable { color: #9cdcfe; }
.number { color: #b5cea8; }

/* Add your custom styles here */`
            }
        ];
        const selectedTemplate = await vscode.window.showQuickPick(templates, {
            placeHolder: 'Choose a theme template to start with',
            title: 'Create New Theme - Select Template'
        });
        if (selectedTemplate) {
            if (!previewPanel) {
                previewPanel = new previewPanel_1.PreviewPanel(context.extensionUri, themeExtractor);
                previewPanel.onDidDispose(() => {
                    previewPanel = undefined;
                });
            }
            previewPanel.updateTheme(selectedTemplate.css, selectedTemplate.label.replace(/[🌙☀️🎨🌈]/g, '').trim());
            vscode.window.showInformationMessage(`${selectedTemplate.label} loaded! Start customizing your theme.`);
        }
    });
    // Command to export as JSON
    const exportJSONCommand = vscode.commands.registerCommand('themeLivePreview.exportJSON', async () => {
        if (!previewPanel || !previewPanel.getCurrentCSS()) {
            vscode.window.showWarningMessage('No theme loaded to export');
            return;
        }
        const themeName = await vscode.window.showInputBox({
            prompt: 'Enter theme name',
            value: previewPanel.getCurrentThemeName(),
            validateInput: (value) => {
                if (!value.trim()) {
                    return 'Theme name cannot be empty';
                }
                return null;
            }
        });
        if (!themeName)
            return;
        const saveUri = await vscode.window.showSaveDialog({
            filters: {
                'JSON Theme Files': ['json']
            },
            defaultUri: vscode.Uri.file(`${themeName.replace(/[^a-z0-9]/gi, '-')}-theme.json`)
        });
        if (saveUri) {
            try {
                await previewPanel.exportAsJSON(previewPanel.getCurrentCSS(), themeName, saveUri.fsPath);
                vscode.window.showInformationMessage(`JSON theme exported to: ${saveUri.fsPath}`);
            }
            catch (error) {
                vscode.window.showErrorMessage(`Failed to export JSON: ${error}`);
            }
        }
    });
    // Command to export as VSIX
    const exportVSIXCommand = vscode.commands.registerCommand('themeLivePreview.exportVSIX', async () => {
        if (!previewPanel || !previewPanel.getCurrentCSS()) {
            vscode.window.showWarningMessage('No theme loaded to export');
            return;
        }
        const themeName = await vscode.window.showInputBox({
            prompt: 'Enter theme name for VSIX package',
            value: previewPanel.getCurrentThemeName(),
            validateInput: (value) => {
                if (!value.trim()) {
                    return 'Theme name cannot be empty';
                }
                return null;
            }
        });
        if (!themeName)
            return;
        const saveUri = await vscode.window.showSaveDialog({
            filters: {
                'VSIX Extension Files': ['vsix']
            },
            defaultUri: vscode.Uri.file(`${themeName.replace(/[^a-z0-9]/gi, '-')}-theme.vsix`)
        });
        if (saveUri) {
            try {
                await previewPanel.exportAsVSIX(previewPanel.getCurrentCSS(), themeName, saveUri.fsPath);
                vscode.window.showInformationMessage(`VSIX package exported to: ${saveUri.fsPath}`, 'Install Theme').then(selection => {
                    if (selection === 'Install Theme') {
                        vscode.commands.executeCommand('workbench.extensions.installExtension', saveUri);
                    }
                });
            }
            catch (error) {
                vscode.window.showErrorMessage(`Failed to export VSIX: ${error}`);
            }
        }
    });
    context.subscriptions.push(openPreviewCommand, loadThemeCommand, exportCSSCommand, openColorPickerCommand, navigateToItemCommand, showStartupOptionsCommand, enterCSSCommand, createNewThemeCommand, exportJSONCommand, exportVSIXCommand, updatePreviewCommand);
}
exports.activate = activate;
function deactivate() {
    console.log('Theme Live Preview extension is now deactivated');
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map
