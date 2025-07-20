const fs = require('fs');
const path = require('path');

/**
 * Extract CSS-like data from VS Code theme files
 * Supports both .json theme files and .vsix extension packages
 */
class VSCodeThemeExtractor {
    constructor() {
        this.cssOutput = [];
    }

    /**
     * Main method to extract theme data
     * @param {string} filePath - Path to theme file (.json or .vsix)
     */
    async extractTheme(filePath) {
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
            console.error('Error extracting theme:', error.message);
            return null;
        }
    }

    /**
     * Extract theme data from JSON file
     * @param {string} filePath - Path to JSON theme file
     */
    async extractFromJSON(filePath) {
        const content = fs.readFileSync(filePath, 'utf8');
        const theme = JSON.parse(content);

        this.processThemeData(theme);
    }

    /**
     * Extract theme data from VSIX package
     * @param {string} filePath - Path to VSIX file
     */
    async extractFromVSIX(filePath) {
        const AdmZip = require('adm-zip');
        const zip = new AdmZip(filePath);

        // Find package.json to locate theme files
        const packageJson = zip.readAsText('extension/package.json');
        const packageData = JSON.parse(packageJson);

        if (packageData.contributes && packageData.contributes.themes) {
            for (const themeContrib of packageData.contributes.themes) {
                const themePath = `extension/${themeContrib.path}`;
                const themeContent = zip.readAsText(themePath);
                const theme = JSON.parse(themeContent);

                console.log(`Processing theme: ${themeContrib.label || 'Unnamed'}`);
                this.processThemeData(theme, themeContrib.label);
            }
        }
    }

    /**
     * Process theme JSON data and convert to CSS-like format
     * @param {Object} theme - Theme JSON object
     * @param {string} themeName - Optional theme name
     */
    processThemeData(theme, themeName = 'VSCode Theme') {
        this.cssOutput.push(`/* ${themeName} */`);
        this.cssOutput.push(`/* Type: ${theme.type || 'unknown'} */`);
        this.cssOutput.push('');

        // Process colors
        if (theme.colors) {
            this.cssOutput.push('/* COLORS */');
            this.cssOutput.push(':root {');

            for (const [key, value] of Object.entries(theme.colors)) {
                const cssVar = this.convertToCSSVariable(key);
                this.cssOutput.push(`  ${cssVar}: ${value};`);
            }

            this.cssOutput.push('}');
            this.cssOutput.push('');
        }

        // Process token colors (syntax highlighting)
        if (theme.tokenColors) {
            this.cssOutput.push('/* TOKEN COLORS (Syntax Highlighting) */');

            theme.tokenColors.forEach((token, index) => {
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
        if (theme.semanticHighlighting) {
            this.cssOutput.push('/* SEMANTIC HIGHLIGHTING */');
            this.cssOutput.push(`/* Enabled: ${theme.semanticHighlighting} */`);
            this.cssOutput.push('');
        }

        if (theme.semanticTokenColors) {
            this.cssOutput.push('/* SEMANTIC TOKEN COLORS */');

            for (const [key, value] of Object.entries(theme.semanticTokenColors)) {
                const selector = `.semantic-token-${key.replace(/[^a-zA-Z0-9]/g, '-')}`;
                this.cssOutput.push(`${selector} {`);

                if (typeof value === 'string') {
                    this.cssOutput.push(`  color: ${value};`);
                } else if (typeof value === 'object') {
                    if (value.foreground) this.cssOutput.push(`  color: ${value.foreground};`);
                    if (value.background) this.cssOutput.push(`  background-color: ${value.background};`);
                    if (value.fontStyle) this.cssOutput.push(`  font-style: ${value.fontStyle};`);
                }

                this.cssOutput.push('}');
                this.cssOutput.push('');
            }
        }
    }

    /**
     * Convert VS Code color key to CSS variable name
     * @param {string} key - VS Code color key
     * @returns {string} CSS variable name
     */
    convertToCSSVariable(key) {
        return `--vscode-${key.replace(/\./g, '-')}`;
    }

    /**
     * Generate CSS selector for token
     * @param {Object} token - Token object
     * @param {number} index - Token index
     * @returns {string} CSS selector
     */
    generateTokenSelector(token, index) {
        if (token.scope) {
            if (Array.isArray(token.scope)) {
                return token.scope.map(scope => `.${scope.replace(/[^a-zA-Z0-9]/g, '-')}`).join(', ');
            } else {
                return `.${token.scope.replace(/[^a-zA-Z0-9]/g, '-')}`;
            }
        }
        return `.token-${index}`;
    }

    /**
     * Generate CSS styles for token
     * @param {Object} token - Token object
     * @returns {string} CSS styles
     */
    generateTokenStyles(token) {
        if (!token.settings) return null;

        const styles = [];
        const settings = token.settings;

        if (settings.foreground) {
            styles.push(`  color: ${settings.foreground};`);
        }

        if (settings.background) {
            styles.push(`  background-color: ${settings.background};`);
        }

        if (settings.fontStyle) {
            const fontStyles = settings.fontStyle.split(' ');
            fontStyles.forEach(style => {
                switch (style) {
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

    /**
     * Generate final CSS output
     * @returns {string} Complete CSS string
     */
    generateCSS() {
        return this.cssOutput.join('\n');
    }

    /**
     * Save CSS to file
     * @param {string} outputPath - Path to save CSS file
     */
    saveCSS(outputPath) {
        const css = this.generateCSS();
        fs.writeFileSync(outputPath, css, 'utf8');
        console.log(`CSS saved to: ${outputPath}`);
    }
}

// CLI usage
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log('Usage: node extract_vscode_theme.js <theme-file> [output-file]');
        console.log('');
        console.log('Examples:');
        console.log('  node extract_vscode_theme.js theme.json');
        console.log('  node extract_vscode_theme.js theme.vsix output.css');
        console.log('  node extract_vscode_theme.js "Dark+ (default dark).json" dark-theme.css');
        process.exit(1);
    }

    const inputFile = args[0];
    const outputFile = args[1] || `${path.basename(inputFile, path.extname(inputFile))}.css`;

    const extractor = new VSCodeThemeExtractor();

    extractor.extractTheme(inputFile)
        .then(css => {
            if (css) {
                extractor.saveCSS(outputFile);
                console.log('Theme extraction completed successfully!');
            }
        })
        .catch(error => {
            console.error('Failed to extract theme:', error.message);
            process.exit(1);
        });
}

module.exports = VSCodeThemeExtractor;

npm install
