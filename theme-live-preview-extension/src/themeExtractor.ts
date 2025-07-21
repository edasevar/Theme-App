import * as fs from 'fs';
import * as path from 'path';
import AdmZip = require('adm-zip');

export class ThemeExtractor {
    private cssOutput: string[] = [];

    async extractTheme (filePath: string): Promise<string> {
        this.cssOutput = [];

        try {
            const ext = path.extname(filePath).toLowerCase();

            if (ext === '.json') {
                await this.extractFromJSON(filePath);
            } else if (ext === '.vsix') {
                await this.extractFromVSIX(filePath);
            } else {
                throw new Error('Unsupported file format. Please provide .json or .vsix files.');
            }

            return this.generateCSS();
        } catch (error) {
            throw new Error(`Failed to extract theme: ${error}`);
        }
    }

    private async extractFromJSON (filePath: string): Promise<void> {
        const content = fs.readFileSync(filePath, 'utf8');
        const theme = JSON.parse(content);
        this.processThemeData(theme);
    }

    private async extractFromVSIX (filePath: string): Promise<void> {
        const zip = new AdmZip(filePath);

        // Find package.json to locate theme files
        const packageJson = zip.readAsText('extension/package.json');
        const packageData = JSON.parse(packageJson);

        if (packageData.contributes && packageData.contributes.themes) {
            for (const themeContrib of packageData.contributes.themes) {
                const themePath = `extension/${themeContrib.path}`;
                const themeContent = zip.readAsText(themePath);
                const theme = JSON.parse(themeContent);

                this.processThemeData(theme, themeContrib.label);
            }
        }
    }

    private processThemeData (theme: any, themeName: string = 'VS Code Theme'): void {
        this.cssOutput.push(`/* ${themeName} */`);
        this.cssOutput.push(`/* Type: ${theme.type || 'unknown'} */`);
        this.cssOutput.push('');

        // Process colors
        if (theme.colors) {
            this.cssOutput.push('/* EDITOR COLORS */');
            this.cssOutput.push(':root {');

            for (const [key, value] of Object.entries(theme.colors)) {
                const cssVar = this.convertToCSSVariable(key);
                this.cssOutput.push(`  ${cssVar}: ${value};`);
            }

            this.cssOutput.push('}');
            this.cssOutput.push('');
        }

        // Process token colors
        if (theme.tokenColors) {
            this.cssOutput.push('/* SYNTAX HIGHLIGHTING */');

            theme.tokenColors.forEach((token: any, index: number) => {
                const selector = this.generateTokenSelector(token, index);
                const styles = this.generateTokenStyles(token);

                if (styles) {
                    this.cssOutput.push(`${selector} {`);
                    this.cssOutput.push(styles);
                    this.cssOutput.push('}');
                    this.cssOutput.push('');
                }
            });
        }

        // Process semantic highlighting
        if (theme.semanticTokenColors) {
            this.cssOutput.push('/* SEMANTIC TOKENS */');

            for (const [key, value] of Object.entries(theme.semanticTokenColors)) {
                const selector = `.semantic-token-${key.replace(/[^a-zA-Z0-9]/g, '-')}`;
                this.cssOutput.push(`${selector} {`);

                if (typeof value === 'string') {
                    this.cssOutput.push(`  color: ${value};`);
                } else if (typeof value === 'object' && value !== null) {
                    const objValue = value as any;
                    if (objValue.foreground) this.cssOutput.push(`  color: ${objValue.foreground};`);
                    if (objValue.background) this.cssOutput.push(`  background-color: ${objValue.background};`);
                    if (objValue.fontStyle) this.cssOutput.push(`  font-style: ${objValue.fontStyle};`);
                }

                this.cssOutput.push('}');
                this.cssOutput.push('');
            }
        }
    }

    private convertToCSSVariable (key: string): string {
        return `--vscode-${key.replace(/\./g, '-')}`;
    }

    private generateTokenSelector (token: any, index: number): string {
        if (token.scope) {
            if (Array.isArray(token.scope)) {
                return token.scope.map((scope: string) => `.${scope.replace(/[^a-zA-Z0-9]/g, '-')}`).join(', ');
            } else {
                return `.${token.scope.replace(/[^a-zA-Z0-9]/g, '-')}`;
            }
        }
        return `.token-${index}`;
    }

    private generateTokenStyles (token: any): string | null {
        if (!token.settings) return null;

        const styles: string[] = [];
        const settings = token.settings;

        if (settings.foreground) {
            styles.push(`  color: ${settings.foreground};`);
        }

        if (settings.background) {
            styles.push(`  background-color: ${settings.background};`);
        }

        if (settings.fontStyle) {
            const fontStyles = settings.fontStyle.split(' ');
            fontStyles.forEach((style: string) => {
                switch (style.trim()) {
                    case 'italic':
                        styles.push(`  font-style: italic;`);
                        break;
                    case 'bold':
                        styles.push(`  font-weight: bold;`);
                        break;
                    case 'underline':
                        styles.push(`  text-decoration: underline;`);
                        break;
                    case 'strikethrough':
                        styles.push(`  text-decoration: line-through;`);
                        break;
                }
            });
        }

        return styles.length > 0 ? styles.join('\n') : null;
    }

    private generateCSS (): string {
        return this.cssOutput.join('\n');
    }
}
