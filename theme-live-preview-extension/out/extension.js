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
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const themeExtractor_1 = require("./themeExtractor");
const previewPanel_1 = require("./previewPanel");
function activate(context) {
    console.log('Theme Live Preview extension is now active!');
    const themeExtractor = new themeExtractor_1.ThemeExtractor();
    let previewPanel;
    // Command to open the live preview panel
    const openPreviewCommand = vscode.commands.registerCommand('themeLivePreview.openPreview', () => {
        if (previewPanel) {
            previewPanel.reveal();
        }
        else {
            previewPanel = new previewPanel_1.PreviewPanel(context.extensionUri, themeExtractor);
            previewPanel.onDidDispose(() => {
                previewPanel = undefined;
            });
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
    context.subscriptions.push(openPreviewCommand, loadThemeCommand, exportCSSCommand, openColorPickerCommand, navigateToItemCommand);
}
exports.activate = activate;
function deactivate() {
    console.log('Theme Live Preview extension is now deactivated');
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map