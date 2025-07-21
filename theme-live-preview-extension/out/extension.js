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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const themeExtractor_1 = require("./themeExtractor");
const previewPanel_1 = require("./previewPanel");
const EnhancedVSCodeThemeExtractor = require('../enhanced_theme_extractor');
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
                    'Theme Files': ['json', 'jsonc', 'vsix']
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
    // Command to create VSIX package
    const createVSIXCommand = vscode.commands.registerCommand('themeLivePreview.createVSIX', async () => {
        // Get current theme from workspace or prompt user to select
        const themeFiles = await vscode.workspace.findFiles('**/*.{json,jsonc}', '**/node_modules/**');
        if (themeFiles.length === 0) {
            vscode.window.showWarningMessage('No theme files found in workspace');
            return;
        }
        let selectedTheme;
        if (themeFiles.length === 1) {
            selectedTheme = themeFiles[0].fsPath;
        }
        else {
            const themeItems = themeFiles.map(file => ({
                label: path.basename(file.fsPath),
                description: path.dirname(file.fsPath),
                uri: file
            }));
            const selected = await vscode.window.showQuickPick(themeItems, {
                placeHolder: 'Select theme file to package'
            });
            if (!selected)
                return;
            selectedTheme = selected.uri.fsPath;
        }
        try {
            const extractor = new EnhancedVSCodeThemeExtractor();
            const result = await extractor.extractTheme(selectedTheme, { generateCSS: false, generateVSIX: true });
            if (result && result.vsixData) {
                const saveLocation = await vscode.window.showSaveDialog({
                    defaultUri: vscode.Uri.file(`${result.vsixData.packageJson.name}.vsix`),
                    filters: {
                        'VSIX Files': ['vsix']
                    }
                });
                if (saveLocation) {
                    await extractor.createVSIX(saveLocation.fsPath, result.vsixData);
                    vscode.window.showInformationMessage(`VSIX created: ${saveLocation.fsPath}`);
                }
            }
        }
        catch (error) {
            vscode.window.showErrorMessage(`Error creating VSIX: ${error}`);
        }
    });
    // Command to export complete theme (CSS + VSIX)
    const exportThemeCommand = vscode.commands.registerCommand('themeLivePreview.exportTheme', async () => {
        // Get current theme from workspace or prompt user to select
        const themeFiles = await vscode.workspace.findFiles('**/*.{json,jsonc}', '**/node_modules/**');
        if (themeFiles.length === 0) {
            vscode.window.showWarningMessage('No theme files found in workspace');
            return;
        }
        let selectedTheme;
        if (themeFiles.length === 1) {
            selectedTheme = themeFiles[0].fsPath;
        }
        else {
            const themeItems = themeFiles.map(file => ({
                label: path.basename(file.fsPath),
                description: path.dirname(file.fsPath),
                uri: file
            }));
            const selected = await vscode.window.showQuickPick(themeItems, {
                placeHolder: 'Select theme file to export'
            });
            if (!selected)
                return;
            selectedTheme = selected.uri.fsPath;
        }
        try {
            const extractor = new EnhancedVSCodeThemeExtractor();
            const result = await extractor.extractTheme(selectedTheme, { generateCSS: true, generateVSIX: true });
            if (!result) {
                vscode.window.showErrorMessage('Failed to extract theme data');
                return;
            }
            const options = await vscode.window.showQuickPick([
                { label: 'Export Both (.css + .vsix)', value: 'both' },
                { label: 'Export CSS Only', value: 'css' },
                { label: 'Export VSIX Only', value: 'vsix' }
            ], { placeHolder: 'Choose export format' });
            if (!options)
                return;
            const folderUri = await vscode.window.showOpenDialog({
                canSelectFiles: false,
                canSelectFolders: true,
                canSelectMany: false,
                openLabel: 'Select Export Folder'
            });
            if (!folderUri || folderUri.length === 0)
                return;
            const exportFolder = folderUri[0].fsPath;
            const themeName = result.vsixData?.packageJson.name || 'theme';
            if (options.value === 'css' || options.value === 'both') {
                const cssPath = path.join(exportFolder, `${themeName}.css`);
                fs.writeFileSync(cssPath, result.css);
                vscode.window.showInformationMessage(`CSS exported to: ${cssPath}`);
            }
            if (options.value === 'vsix' || options.value === 'both') {
                const vsixPath = path.join(exportFolder, `${themeName}.vsix`);
                await extractor.createVSIX(vsixPath, result.vsixData);
                vscode.window.showInformationMessage(`VSIX created: ${vsixPath}`);
            }
        }
        catch (error) {
            vscode.window.showErrorMessage(`Error exporting theme: ${error}`);
        }
    });
    // Add all commands to subscriptions
    context.subscriptions.push(openPreviewCommand, loadThemeCommand, exportCSSCommand, createVSIXCommand, exportThemeCommand);
    // Create TreeView for the sidebar
    const provider = new ThemeTreeDataProvider(context);
    vscode.window.createTreeView('themeLivePreview', { treeDataProvider: provider });
}
exports.activate = activate;
class ThemeTreeDataProvider {
    constructor(context) {
        this.context = context;
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!element) {
            return Promise.resolve([
                new ThemeTreeItem('🎨 Open Theme Editor', vscode.TreeItemCollapsibleState.None, 'themeLivePreview.openPreview'),
                new ThemeTreeItem('📂 Load Theme File', vscode.TreeItemCollapsibleState.None, 'themeLivePreview.loadTheme'),
                new ThemeTreeItem('💾 Export CSS', vscode.TreeItemCollapsibleState.None, 'themeLivePreview.exportCSS'),
                new ThemeTreeItem('📦 Create VSIX', vscode.TreeItemCollapsibleState.None, 'themeLivePreview.createVSIX'),
                new ThemeTreeItem('🚀 Export Complete Theme', vscode.TreeItemCollapsibleState.None, 'themeLivePreview.exportTheme')
            ]);
        }
        return Promise.resolve([]);
    }
}
class ThemeTreeItem extends vscode.TreeItem {
    constructor(label, collapsibleState, commandId) {
        super(label, collapsibleState);
        this.label = label;
        this.collapsibleState = collapsibleState;
        this.commandId = commandId;
        if (commandId) {
            this.command = {
                command: commandId,
                title: label
            };
        }
    }
}
function deactivate() {
    console.log('Theme Live Preview extension is now deactivated');
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map