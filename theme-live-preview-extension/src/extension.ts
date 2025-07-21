import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ThemeExtractor } from './themeExtractor';
import { PreviewPanel } from './previewPanel';
import { SidebarProvider } from './sidebarProvider';
import { StartupMenuProvider } from './startupMenuProvider';

const EnhancedVSCodeThemeExtractor = require('../enhanced_theme_extractor');

// Helper function to convert CSS to theme JSON
async function convertCSSToTheme(cssContent: string): Promise<any> {
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
        } else if (cleanProperty.includes('status-bar-background')) {
            themeData.colors['statusBar.background'] = cleanValue;
        }
        // Add more mappings as needed
    }

    return themeData;
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Theme Live Preview extension is now active!');

    const themeExtractor = new ThemeExtractor();
    let previewPanel: PreviewPanel | undefined;

    // Show startup menu on activation if enabled
    const showStartupOnActivation = vscode.workspace.getConfiguration('themeLivePreview').get('showStartupMenuOnActivation', true);
    if (showStartupOnActivation) {
        setTimeout(() => {
            StartupMenuProvider.showStartupMenu(context);
        }, 1500);
    }

    // Register the sidebar provider
    const sidebarProvider = new SidebarProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(SidebarProvider.viewType, sidebarProvider)
    );

    // Command to open sidebar
    const openSidebarCommand = vscode.commands.registerCommand('themeLivePreview.openSidebar', () => {
        vscode.commands.executeCommand('workbench.view.explorer');
        vscode.commands.executeCommand('themeLivePreview.focus');
    });

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

    // Command to show startup menu
    const showStartupMenuCommand = vscode.commands.registerCommand('themeLivePreview.showStartupMenu', () => {
        StartupMenuProvider.showStartupMenu(context);
    });

    // Command to edit current theme
    const editCurrentThemeCommand = vscode.commands.registerCommand('themeLivePreview.editCurrentTheme', async () => {
        try {
            // Get current theme configuration
            const config = vscode.workspace.getConfiguration('workbench');
            const currentTheme = config.get('colorTheme') as string;
            
            if (!currentTheme) {
                vscode.window.showWarningMessage('No theme is currently active');
                return;
            }

            vscode.window.showInformationMessage(`Extracting current theme: ${currentTheme}`);
            
            // Open sidebar with current theme
            await vscode.commands.executeCommand('themeLivePreview.openSidebar');
            
            // Theme loading is now handled by StartupMenuProvider
            vscode.window.showInformationMessage('Current theme editing functionality is available through the Startup Menu.');
            
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to extract current theme: ${error}`);
        }
    });

    // Command to import VSIX and edit
    const importVSIXCommand = vscode.commands.registerCommand('themeLivePreview.importVSIX', async () => {
        const fileUri = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            filters: {
                'VSIX Files': ['vsix']
            },
            title: 'Select VSIX File to Import'
        });

        if (!fileUri || fileUri.length === 0) {
            return;
        }

        try {
            const filePath = fileUri[0].fsPath;
            vscode.window.showInformationMessage(`Loading VSIX: ${path.basename(filePath)}`);
            
            // Open sidebar - theme loading handled by StartupMenuProvider
            await vscode.commands.executeCommand('themeLivePreview.openSidebar');
            vscode.window.showInformationMessage('VSIX import functionality is available through the Startup Menu.');
            
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to import VSIX: ${error}`);
        }
    });

    // Command to import JSON/JSONC and edit
    const importJSONCommand = vscode.commands.registerCommand('themeLivePreview.importJSON', async () => {
        const fileUri = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            filters: {
                'Theme Files': ['json', 'jsonc']
            },
            title: 'Select JSON/JSONC Theme File'
        });

        if (!fileUri || fileUri.length === 0) {
            return;
        }

        try {
            const filePath = fileUri[0].fsPath;
            vscode.window.showInformationMessage(`Loading theme: ${path.basename(filePath)}`);
            
            // Open sidebar and load the theme
            await vscode.commands.executeCommand('themeLivePreview.openSidebar');
            vscode.window.showInformationMessage('JSON import functionality is available through the Startup Menu.');
            
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to import theme: ${error}`);
        }
    });

    // Command to import CSS and edit
    const importCSSCommand = vscode.commands.registerCommand('themeLivePreview.importCSS', async () => {
        const fileUri = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            filters: {
                'CSS Files': ['css']
            },
            title: 'Select CSS File to Convert'
        });

        if (!fileUri || fileUri.length === 0) {
            return;
        }

        try {
            const filePath = fileUri[0].fsPath;
            const cssContent = fs.readFileSync(filePath, 'utf-8');
            
            vscode.window.showInformationMessage(`Converting CSS: ${path.basename(filePath)}`);
            
            // Convert CSS to theme JSON (basic conversion)
            const themeData = await convertCSSToTheme(cssContent);
            
            // Open sidebar and load the converted theme
            await vscode.commands.executeCommand('themeLivePreview.openSidebar');
            vscode.window.showInformationMessage('CSS import functionality is available through the Startup Menu.');
            
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to import CSS: ${error}`);
        }
    });

    // Command to create new theme
    const createNewThemeCommand = vscode.commands.registerCommand('themeLivePreview.createNewTheme', async () => {
        try {
            vscode.window.showInformationMessage('Creating new theme from ELEMENTS.jsonc template...');
            
            // Load ELEMENTS.jsonc as the starting template
            const elementsPath = path.join(context.extensionPath, 'ELEMENTS.jsonc');
            
            // Open sidebar - theme creation handled by StartupMenuProvider
            await vscode.commands.executeCommand('themeLivePreview.openSidebar');
            vscode.window.showInformationMessage('New theme creation functionality is available through the Startup Menu.');
            
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to create new theme: ${error}`);
        }
    });

    // Command to select installed theme and edit
    const selectInstalledThemeCommand = vscode.commands.registerCommand('themeLivePreview.selectInstalledTheme', async () => {
        try {
            // Get list of available themes from VS Code
            const allExtensions = vscode.extensions.all;
            const themeExtensions = allExtensions.filter(ext => 
                ext.packageJSON.contributes && ext.packageJSON.contributes.themes
            );

            if (themeExtensions.length === 0) {
                vscode.window.showWarningMessage('No theme extensions found');
                return;
            }

            // Create list of themes
            const themeItems: { label: string; description: string; extensionPath: string; themePath: string }[] = [];
            
            themeExtensions.forEach(ext => {
                if (ext.packageJSON.contributes.themes) {
                    ext.packageJSON.contributes.themes.forEach((theme: any) => {
                        themeItems.push({
                            label: theme.label || theme.id || 'Unnamed Theme',
                            description: `${ext.packageJSON.displayName || ext.packageJSON.name} - ${theme.uiTheme || 'unknown'}`,
                            extensionPath: ext.extensionPath,
                            themePath: path.join(ext.extensionPath, theme.path)
                        });
                    });
                }
            });

            if (themeItems.length === 0) {
                vscode.window.showWarningMessage('No themes found in installed extensions');
                return;
            }

            // Show theme picker
            const selectedTheme = await vscode.window.showQuickPick(themeItems, {
                placeHolder: 'Select an installed theme to edit',
                matchOnDescription: true
            });

            if (!selectedTheme) {
                return;
            }

            vscode.window.showInformationMessage(`Loading theme: ${selectedTheme.label}`);
            
            // Open sidebar - theme selection handled by StartupMenuProvider
            await vscode.commands.executeCommand('themeLivePreview.openSidebar');
            vscode.window.showInformationMessage('Theme selection functionality is available through the Startup Menu.');
            
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to load installed theme: ${error}`);
        }
    });

    // Add all commands to subscriptions
    context.subscriptions.push(
        showStartupMenuCommand,
        editCurrentThemeCommand,
        importVSIXCommand,
        importJSONCommand,
        importCSSCommand,
        createNewThemeCommand,
        selectInstalledThemeCommand,
        openSidebarCommand,
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

    getChildren(element?: ThemeTreeItem): Thenable<ThemeTreeItem[]> {
        if (!element) {
            return Promise.resolve([
                new ThemeTreeItem('🚀 Startup Menu', vscode.TreeItemCollapsibleState.None, 'themeLivePreview.showStartupMenu'),
                new ThemeTreeItem('🎯 Edit Current Theme', vscode.TreeItemCollapsibleState.None, 'themeLivePreview.editCurrentTheme'),
                new ThemeTreeItem('🎨 Open Theme Editor Sidebar', vscode.TreeItemCollapsibleState.None, 'themeLivePreview.openSidebar'),
                new ThemeTreeItem('🖥️ Open Theme Preview Panel', vscode.TreeItemCollapsibleState.None, 'themeLivePreview.openPreview'),
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
