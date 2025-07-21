import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ThemeExtractor } from './themeExtractor';
import { PreviewPanel } from './previewPanel';

const EnhancedVSCodeThemeExtractor = require('../enhanced_theme_extractor');

export function activate (context: vscode.ExtensionContext) {
    console.log('Theme Live Preview extension is now active!');

    const themeExtractor = new ThemeExtractor();
    let previewPanel: PreviewPanel | undefined;

    // Command to open the live preview panel
    const openPreviewCommand = vscode.commands.registerCommand('themeLivePreview.openPreview', () => {
        if (previewPanel) {
            previewPanel.reveal();
        } else {
            previewPanel = new PreviewPanel(context.extensionUri, themeExtractor);
            previewPanel.onDidDispose(() => {
                previewPanel = undefined;
            });
        }
    });

    // Command to load a theme file
    const loadThemeCommand = vscode.commands.registerCommand('themeLivePreview.loadTheme', async (uri?: vscode.Uri) => {
        let filePath: string;

        if (uri) {
            filePath = uri.fsPath;
        } else {
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
                    previewPanel = new PreviewPanel(context.extensionUri, themeExtractor);
                    previewPanel.onDidDispose(() => {
                        previewPanel = undefined;
                    });
                }
                previewPanel.updateTheme(cssData, path.basename(filePath));
                vscode.window.showInformationMessage(`Theme loaded: ${path.basename(filePath)}`);
            }
        } catch (error) {
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
            } catch (error) {
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

        let selectedTheme: string;

        if (themeFiles.length === 1) {
            selectedTheme = themeFiles[0].fsPath;
        } else {
            const themeItems = themeFiles.map(file => ({
                label: path.basename(file.fsPath),
                description: path.dirname(file.fsPath),
                uri: file
            }));

            const selected = await vscode.window.showQuickPick(themeItems, {
                placeHolder: 'Select theme file to package'
            });

            if (!selected) return;
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
        } catch (error) {
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

        let selectedTheme: string;

        if (themeFiles.length === 1) {
            selectedTheme = themeFiles[0].fsPath;
        } else {
            const themeItems = themeFiles.map(file => ({
                label: path.basename(file.fsPath),
                description: path.dirname(file.fsPath),
                uri: file
            }));

            const selected = await vscode.window.showQuickPick(themeItems, {
                placeHolder: 'Select theme file to export'
            });

            if (!selected) return;
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

            if (!options) return;

            const folderUri = await vscode.window.showOpenDialog({
                canSelectFiles: false,
                canSelectFolders: true,
                canSelectMany: false,
                openLabel: 'Select Export Folder'
            });

            if (!folderUri || folderUri.length === 0) return;

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

        } catch (error) {
            vscode.window.showErrorMessage(`Error exporting theme: ${error}`);
        }
    });

    // Add all commands to subscriptions
    context.subscriptions.push(
        openPreviewCommand,
        loadThemeCommand,
        exportCSSCommand,
        createVSIXCommand,
        exportThemeCommand
    );

    // Create TreeView for the sidebar
    const provider = new ThemeTreeDataProvider(context);
    vscode.window.createTreeView('themeLivePreview', { treeDataProvider: provider });
}

class ThemeTreeDataProvider implements vscode.TreeDataProvider<ThemeTreeItem> {
    constructor(private context: vscode.ExtensionContext) {}

    getTreeItem (element: ThemeTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren (element?: ThemeTreeItem): Thenable<ThemeTreeItem[]> {
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
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly commandId?: string
    ) {
        super(label, collapsibleState);
        if (commandId) {
            this.command = {
                command: commandId,
                title: label
            };
        }
    }
}

export function deactivate () {
    console.log('Theme Live Preview extension is now deactivated');
}
