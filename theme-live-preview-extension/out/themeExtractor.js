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
exports.ThemeExtractor = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const AdmZip = require("adm-zip");
class ThemeExtractor {
    constructor() {
        this.cssOutput = [];
    }
    async extractTheme(filePath) {
        this.cssOutput = [];
        try {
            const ext = path.extname(filePath).toLowerCase();
            if (ext === '.json') {
                await this.extractFromJSON(filePath);
            }
            else if (ext === '.vsix') {
                await this.extractFromVSIX(filePath);
            }
            else {
                throw new Error('Unsupported file format. Please provide .json or .vsix files.');
            }
            return this.generateCSS();
        }
        catch (error) {
            throw new Error(`Failed to extract theme: ${error}`);
        }
    }
    async extractFromJSON(filePath) {
        const content = fs.readFileSync(filePath, 'utf8');
        const theme = JSON.parse(content);
        this.processThemeData(theme);
    }
    async extractFromVSIX(filePath) {
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
    processThemeData(theme, themeName = 'VS Code Theme') {
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
        if (theme.semanticTokenColors) {
            this.cssOutput.push('/* SEMANTIC TOKENS */');
            for (const [key, value] of Object.entries(theme.semanticTokenColors)) {
                const selector = `.semantic-token-${key.replace(/[^a-zA-Z0-9]/g, '-')}`;
                this.cssOutput.push(`${selector} {`);
                if (typeof value === 'string') {
                    this.cssOutput.push(`  color: ${value};`);
                }
                else if (typeof value === 'object' && value !== null) {
                    const objValue = value;
                    if (objValue.foreground)
                        this.cssOutput.push(`  color: ${objValue.foreground};`);
                    if (objValue.background)
                        this.cssOutput.push(`  background-color: ${objValue.background};`);
                    if (objValue.fontStyle)
                        this.cssOutput.push(`  font-style: ${objValue.fontStyle};`);
                }
                this.cssOutput.push('}');
                this.cssOutput.push('');
            }
        }
    }
    convertToCSSVariable(key) {
        return `--vscode-${key.replace(/\./g, '-')}`;
    }
    generateTokenSelector(token, index) {
        if (token.scope) {
            if (Array.isArray(token.scope)) {
                return token.scope.map((scope) => `.${scope.replace(/[^a-zA-Z0-9]/g, '-')}`).join(', ');
            }
            else {
                return `.${token.scope.replace(/[^a-zA-Z0-9]/g, '-')}`;
            }
        }
        return `.token-${index}`;
    }
    generateTokenStyles(token) {
        if (!token.settings)
            return null;
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
            fontStyles.forEach((style) => {
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
    generateCSS() {
        return this.cssOutput.join('\n');
    }
}
exports.ThemeExtractor = ThemeExtractor;
//# sourceMappingURL=themeExtractor.js.map