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
exports.DatabaseUtils = void 0;
const vscode = __importStar(require("vscode"));
const navigationProvider_1 = require("./navigationProvider");
/**
 * Database utilities for the VS Code theme navigation system
 * Provides command-line style access to the theme element database
 */
class DatabaseUtils {
    static setContext(ctx) {
        this.context = ctx;
    }
    /**
     * Shows database statistics
     */
    static showDatabaseStats() {
        const elementCount = navigationProvider_1.NavigationProvider.getElementCount();
        const categories = navigationProvider_1.NavigationProvider.getAllCategories();
        vscode.window.showInformationMessage(`Theme Database: ${elementCount} elements across ${categories.length} categories\n` +
            `Categories: ${categories.join(', ')}`);
    }
    /**
     * Search for elements by query and show results
     */
    static async searchDatabase() {
        const query = await vscode.window.showInputBox({
            prompt: 'Enter search term (property, description, location)',
            placeHolder: 'e.g., editor, activity, button, terminal'
        });
        if (!query) {
            return;
        }
        const results = navigationProvider_1.NavigationProvider.searchElements(query);
        if (results.length === 0) {
            vscode.window.showWarningMessage(`No elements found matching "${query}"`);
            return;
        }
        // Show quick pick with results
        const items = results.map(element => ({
            label: element.property,
            description: element.description,
            detail: element.location,
            element: element
        }));
        const selected = await vscode.window.showQuickPick(items, {
            title: `Search Results for "${query}" (${results.length} found)`,
            matchOnDescription: true,
            matchOnDetail: true
        });
        if (selected) {
            await navigationProvider_1.NavigationProvider.showElementExamples(this.context, selected.element.property);
        }
    }
    /**
     * Browse elements by category
     */
    static async browseByCategory() {
        const categories = navigationProvider_1.NavigationProvider.getAllCategories();
        const categoryItems = categories.map(cat => ({
            label: cat,
            description: `Browse ${cat} theme elements`
        }));
        const selected = await vscode.window.showQuickPick(categoryItems, {
            title: 'Browse Elements by Category',
            placeHolder: 'Select a category to explore'
        });
        if (!selected) {
            return;
        }
        const elements = navigationProvider_1.NavigationProvider.getElementsByCategory(selected.label);
        const items = elements.map(element => ({
            label: element.property,
            description: element.description,
            detail: element.location,
            element: element
        }));
        const selectedElement = await vscode.window.showQuickPick(items, {
            title: `${selected.label.charAt(0).toUpperCase() + selected.label.slice(1)} Elements (${elements.length} found)`,
            matchOnDescription: true,
            matchOnDetail: true
        });
        if (selectedElement) {
            await navigationProvider_1.NavigationProvider.showElementExamples(this.context, selectedElement.element.property);
        }
    }
    /**
     * Export database to JSON file
     */
    static async exportDatabase() {
        const elements = navigationProvider_1.NavigationProvider.getAllElements();
        const exportData = {
            metadata: {
                exportDate: new Date().toISOString(),
                elementCount: elements.length,
                categories: navigationProvider_1.NavigationProvider.getAllCategories()
            },
            elements: elements
        };
        const jsonContent = JSON.stringify(exportData, null, 2);
        const uri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file('theme-database-export.json'),
            filters: {
                'JSON Files': ['json']
            }
        });
        if (uri) {
            await vscode.workspace.fs.writeFile(uri, Buffer.from(jsonContent, 'utf8'));
            vscode.window.showInformationMessage(`Database exported to ${uri.fsPath}`);
        }
    }
    /**
     * Generate a sample theme based on a base color
     */
    static async generateSampleTheme() {
        const baseColor = await vscode.window.showInputBox({
            prompt: 'Enter a base color for the theme',
            placeHolder: '#1e1e1e',
            validateInput: (value) => {
                if (!value.match(/^#[0-9a-fA-F]{6}$/)) {
                    return 'Please enter a valid hex color (e.g., #1e1e1e)';
                }
                return null;
            }
        });
        if (!baseColor) {
            return;
        }
        const themeName = await vscode.window.showInputBox({
            prompt: 'Enter a name for the generated theme',
            placeHolder: 'My Custom Theme'
        });
        if (!themeName) {
            return;
        }
        const demoTheme = navigationProvider_1.NavigationProvider.generateDemoTheme(baseColor);
        demoTheme.name = themeName;
        demoTheme.type = 'dark'; // Default to dark theme
        const jsonContent = JSON.stringify(demoTheme, null, 2);
        const uri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file(`${themeName.toLowerCase().replace(/\s+/g, '-')}-theme.json`),
            filters: {
                'JSON Files': ['json']
            }
        });
        if (uri) {
            await vscode.workspace.fs.writeFile(uri, Buffer.from(jsonContent, 'utf8'));
            vscode.window.showInformationMessage(`Sample theme generated: ${uri.fsPath}`);
            // Optionally open the file
            const openFile = await vscode.window.showInformationMessage('Theme generated successfully!', 'Open File', 'Dismiss');
            if (openFile === 'Open File') {
                const document = await vscode.workspace.openTextDocument(uri);
                await vscode.window.showTextDocument(document);
            }
        }
    }
    /**
     * Show random theme element for exploration
     */
    static async showRandomElement() {
        const elements = navigationProvider_1.NavigationProvider.getAllElements();
        const randomIndex = Math.floor(Math.random() * elements.length);
        const randomElement = elements[randomIndex];
        await navigationProvider_1.NavigationProvider.showElementExamples(this.context, randomElement.property);
    }
    /**
     * Validate theme JSON file
     */
    static async validateThemeFile() {
        const uris = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            filters: {
                'JSON Files': ['json']
            },
            title: 'Select theme file to validate'
        });
        if (!uris || uris.length === 0) {
            return;
        }
        try {
            const content = await vscode.workspace.fs.readFile(uris[0]);
            const themeData = JSON.parse(content.toString());
            // Basic validation
            const issues = [];
            if (!themeData.colors) {
                issues.push('Missing "colors" property');
            }
            else {
                const colorCount = Object.keys(themeData.colors).length;
                vscode.window.showInformationMessage(`Theme contains ${colorCount} color definitions`);
                // Check for common properties
                const commonProps = [
                    'editor.background',
                    'editor.foreground',
                    'activityBar.background',
                    'sideBar.background',
                    'statusBar.background'
                ];
                const missing = commonProps.filter(prop => !themeData.colors[prop]);
                if (missing.length > 0) {
                    issues.push(`Missing common properties: ${missing.join(', ')}`);
                }
            }
            if (issues.length === 0) {
                vscode.window.showInformationMessage('✅ Theme file appears to be valid!');
            }
            else {
                vscode.window.showWarningMessage(`⚠️ Validation issues:\n${issues.join('\n')}`);
            }
        }
        catch (error) {
            vscode.window.showErrorMessage(`❌ Invalid JSON file: ${error}`);
        }
    }
    /**
     * Show help for database commands
     */
    static showHelp() {
        const helpMessage = `
🗃️ Theme Database Commands:

• Database Stats - View element count and categories
• Search Database - Find elements by keyword
• Browse by Category - Explore elements by type
• Export Database - Save element data to JSON
• Generate Sample Theme - Create theme from base color  
• Random Element - Discover a random theme element
• Validate Theme - Check theme file structure

📚 Database contains ${navigationProvider_1.NavigationProvider.getElementCount()} VS Code theme elements
across ${navigationProvider_1.NavigationProvider.getAllCategories().length} categories.
        `.trim();
        vscode.window.showInformationMessage(helpMessage, { modal: true });
    }
}
exports.DatabaseUtils = DatabaseUtils;
//# sourceMappingURL=databaseUtils.js.map