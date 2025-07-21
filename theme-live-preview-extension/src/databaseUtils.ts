import * as vscode from 'vscode';
import { NavigationProvider } from './navigationProvider';

/**
 * Database utilities for the VS Code theme navigation system
 * Provides command-line style access to the theme element database
 */
export class DatabaseUtils {
    private static context: vscode.ExtensionContext;
    
    public static setContext(ctx: vscode.ExtensionContext): void {
        this.context = ctx;
    }
    
    /**
     * Shows database statistics
     */
    public static showDatabaseStats(): void {
        const elementCount = NavigationProvider.getElementCount();
        const categories = NavigationProvider.getAllCategories();
        
        vscode.window.showInformationMessage(
            `Theme Database: ${elementCount} elements across ${categories.length} categories\n` +
            `Categories: ${categories.join(', ')}`
        );
    }

    /**
     * Search for elements by query and show results
     */
    public static async searchDatabase(): Promise<void> {
        const query = await vscode.window.showInputBox({
            prompt: 'Enter search term (property, description, location)',
            placeHolder: 'e.g., editor, activity, button, terminal'
        });

        if (!query) {
            return;
        }

        const results = NavigationProvider.searchElements(query);
        
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
            await NavigationProvider.showElementExamples(this.context, selected.element.property);
        }
    }

    /**
     * Browse elements by category
     */
    public static async browseByCategory(): Promise<void> {
        const categories = NavigationProvider.getAllCategories();
        
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

        const elements = NavigationProvider.getElementsByCategory(selected.label);
        
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
            await NavigationProvider.showElementExamples(this.context, selectedElement.element.property);
        }
    }

    /**
     * Export database to JSON file
     */
    public static async exportDatabase(): Promise<void> {
        const elements = NavigationProvider.getAllElements();
        const exportData = {
            metadata: {
                exportDate: new Date().toISOString(),
                elementCount: elements.length,
                categories: NavigationProvider.getAllCategories()
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
    public static async generateSampleTheme(): Promise<void> {
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

        const demoTheme = NavigationProvider.generateDemoTheme(baseColor);
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
            const openFile = await vscode.window.showInformationMessage(
                'Theme generated successfully!', 
                'Open File', 
                'Dismiss'
            );
            
            if (openFile === 'Open File') {
                const document = await vscode.workspace.openTextDocument(uri);
                await vscode.window.showTextDocument(document);
            }
        }
    }

    /**
     * Show random theme element for exploration
     */
    public static async showRandomElement(): Promise<void> {
        const elements = NavigationProvider.getAllElements();
        const randomIndex = Math.floor(Math.random() * elements.length);
        const randomElement = elements[randomIndex];
        
        await NavigationProvider.showElementExamples(this.context, randomElement.property);
    }

    /**
     * Validate theme JSON file
     */
    public static async validateThemeFile(): Promise<void> {
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
            const issues: string[] = [];
            
            if (!themeData.colors) {
                issues.push('Missing "colors" property');
            } else {
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
            } else {
                vscode.window.showWarningMessage(`⚠️ Validation issues:\n${issues.join('\n')}`);
            }
            
        } catch (error) {
            vscode.window.showErrorMessage(`❌ Invalid JSON file: ${error}`);
        }
    }

    /**
     * Show help for database commands
     */
    public static showHelp(): void {
        const helpMessage = `
🗃️ Theme Database Commands:

• Database Stats - View element count and categories
• Search Database - Find elements by keyword
• Browse by Category - Explore elements by type
• Export Database - Save element data to JSON
• Generate Sample Theme - Create theme from base color  
• Random Element - Discover a random theme element
• Validate Theme - Check theme file structure

📚 Database contains ${NavigationProvider.getElementCount()} VS Code theme elements
across ${NavigationProvider.getAllCategories().length} categories.
        `.trim();

        vscode.window.showInformationMessage(helpMessage, { modal: true });
    }
}
