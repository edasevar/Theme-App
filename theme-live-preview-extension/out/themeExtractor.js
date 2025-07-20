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
exports.ThemeExtractor = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
const AdmZip = require("adm-zip");
class ThemeExtractor {
    constructor() {
        this.cssOutput = [];
        this.themeData = null;
        this.themeName = 'Custom Theme';
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
        this.themeData = theme;
        this.themeName = themeName;
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
    // Convert CSS back to VS Code theme format
    convertCSSToTheme(css, themeName = 'Custom Theme') {
        const theme = {
            name: themeName,
            type: 'dark',
            colors: {},
            tokenColors: []
        };
        // Extract CSS variables (colors)
        const cssVarRegex = /--vscode-([^:]+):\s*([^;]+);/g;
        let match;
        while ((match = cssVarRegex.exec(css)) !== null) {
            const vscodeProp = match[1].replace(/-/g, '.');
            const value = match[2].trim();
            theme.colors[vscodeProp] = value;
        }
        // Extract token colors from CSS classes
        const tokenRegex = /\.([^{]+)\s*{\s*([^}]+)\s*}/g;
        let tokenMatch;
        while ((tokenMatch = tokenRegex.exec(css)) !== null) {
            const scope = tokenMatch[1].trim();
            const styles = tokenMatch[2].trim();
            // Skip CSS variables and semantic tokens
            if (scope.startsWith('-') || scope.includes('semantic-token') || scope === 'root') {
                continue;
            }
            const tokenColor = {
                scope: scope.replace(/-/g, '.'),
                settings: {}
            };
            // Parse styles
            const styleRegex = /([^:]+):\s*([^;]+);?/g;
            let styleMatch;
            while ((styleMatch = styleRegex.exec(styles)) !== null) {
                const prop = styleMatch[1].trim();
                const value = styleMatch[2].trim();
                switch (prop) {
                    case 'color':
                        tokenColor.settings.foreground = value;
                        break;
                    case 'background-color':
                        tokenColor.settings.background = value;
                        break;
                    case 'font-weight':
                        if (value === 'bold') {
                            tokenColor.settings.fontStyle = tokenColor.settings.fontStyle ?
                                `${tokenColor.settings.fontStyle} bold` : 'bold';
                        }
                        break;
                    case 'font-style':
                        if (value === 'italic') {
                            tokenColor.settings.fontStyle = tokenColor.settings.fontStyle ?
                                `${tokenColor.settings.fontStyle} italic` : 'italic';
                        }
                        break;
                    case 'text-decoration':
                        if (value === 'underline') {
                            tokenColor.settings.fontStyle = tokenColor.settings.fontStyle ?
                                `${tokenColor.settings.fontStyle} underline` : 'underline';
                        }
                        break;
                }
            }
            if (Object.keys(tokenColor.settings).length > 0) {
                theme.tokenColors.push(tokenColor);
            }
        }
        return theme;
    }
    // Generate VS Code extension package.json for VSIX export
    generatePackageJson(themeName, displayName) {
        const sanitizedName = themeName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
        return {
            name: sanitizedName,
            displayName: displayName,
            description: `${displayName} - Generated by Theme Live Preview`,
            version: "1.0.0",
            publisher: "theme-live-preview",
            engines: {
                vscode: "^1.60.0"
            },
            categories: ["Themes"],
            contributes: {
                themes: [{
                    label: displayName,
                    uiTheme: "vs-dark",
                    path: "./themes/theme.json"
                }]
            },
            __metadata: {
                id: sanitizedName,
                publisherId: "theme-live-preview",
                publisherDisplayName: "Theme Live Preview"
            }
        };
    }
    // Export theme as JSON with enhanced semantic token support
    async exportAsJSON(css, themeName, savePath) {
        const theme = this.convertCSSToTheme(css, themeName);
        // Enhance with semantic token colors if not present
        if (!theme.semanticTokenColors) {
            theme.semanticTokenColors = {};
        }
        // Add common semantic token defaults based on syntax colors
        const semanticDefaults = {
            'variable.readonly': theme.colors?.['variable.readonly.foreground'] || '#9CDCFE',
            'parameter': theme.colors?.['parameter.foreground'] || '#9CDCFE',
            'property': theme.colors?.['property.foreground'] || '#9CDCFE',
            'function': theme.colors?.['entity.name.function.foreground'] || '#DCDCAA',
            'method': theme.colors?.['entity.name.function.foreground'] || '#DCDCAA',
            'class': theme.colors?.['entity.name.type.foreground'] || '#4EC9B0',
            'interface': theme.colors?.['entity.name.type.foreground'] || '#B8D7A3',
            'enum': theme.colors?.['entity.name.type.foreground'] || '#4EC9B0',
            'type': theme.colors?.['entity.name.type.foreground'] || '#4EC9B0',
            'namespace': '#4EC9B0'
        };
        // Only add defaults if no semantic tokens exist
        if (Object.keys(theme.semanticTokenColors).length === 0) {
            Object.assign(theme.semanticTokenColors, semanticDefaults);
        }
        const jsonContent = JSON.stringify(theme, null, 2);
        await vscode.workspace.fs.writeFile(vscode.Uri.file(savePath), Buffer.from(jsonContent, 'utf8'));
    }
    // Export theme as VSIX package
    async exportAsVSIX(css, themeName, savePath) {
        const theme = this.convertCSSToTheme(css, themeName);
        const packageJson = this.generatePackageJson(themeName, themeName);
        // Create a new ZIP file (VSIX is just a ZIP)
        const zip = new AdmZip();
        // Add package.json
        zip.addFile('extension/package.json', Buffer.from(JSON.stringify(packageJson, null, 2)));
        // Add theme file
        zip.addFile('extension/themes/theme.json', Buffer.from(JSON.stringify(theme, null, 2)));
        // Add basic extension manifest
        const manifest = {
            "files": [
                {
                    "path": "extension/package.json"
                },
                {
                    "path": "extension/themes/theme.json"
                }
            ],
            "assets": []
        };
        zip.addFile('[Content_Types].xml', Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="json" ContentType="application/json"/>
    <Default Extension="vsixmanifest" ContentType="text/xml"/>
</Types>`));
        const vsixManifest = `<?xml version="1.0" encoding="utf-8"?>
<PackageManifest Version="2.0.0" xmlns="http://schemas.microsoft.com/developer/vsx-schema/2011" xmlns:d="http://schemas.microsoft.com/developer/vsx-schema-design/2011">
    <Metadata>
        <Identity Language="en-US" Id="${packageJson.name}" Version="${packageJson.version}" Publisher="${packageJson.publisher}"/>
        <DisplayName>${packageJson.displayName}</DisplayName>
        <Description xml:space="preserve">${packageJson.description}</Description>
        <Categories>Themes</Categories>
    </Metadata>
    <Installation>
        <InstallationTarget Id="Microsoft.VisualStudio.Code" Version="[1.60.0,)"/>
    </Installation>
    <Dependencies/>
    <Assets/>
</PackageManifest>`;
        zip.addFile('extension.vsixmanifest', Buffer.from(vsixManifest));
        // Write the VSIX file
        zip.writeZip(savePath);
    }
    // Get current theme data for editing
    getCurrentThemeData() {
        return this.themeData;
    }
    // Get current theme name
    getCurrentThemeName() {
        return this.themeName;
    }
    // Convert theme object to CSS string with enhanced semantic and syntax support
    convertThemeToCSS(theme) {
        const cssRules = [];
        // Add header comment
        cssRules.push('/* VS Code Theme CSS Export */');
        cssRules.push('/* Generated by Theme Live Preview Extension */');
        cssRules.push('');
        // Process workbench colors
        const workbenchVars = [];
        const syntaxVars = [];
        const semanticVars = [];
        Object.keys(theme).forEach(key => {
            const value = theme[key];
            const cssVar = `--vscode-${key.replace(/\./g, '-')}`;
            // Categorize the properties
            if (this.isSyntaxColor(key)) {
                syntaxVars.push(`  ${cssVar}: ${value};`);
            }
            else if (this.isSemanticToken(key)) {
                semanticVars.push(`  ${cssVar}: ${value};`);
            }
            else {
                workbenchVars.push(`  ${cssVar}: ${value};`);
            }
        });
        // Add workbench colors
        if (workbenchVars.length > 0) {
            cssRules.push('/* Workbench Colors */');
            cssRules.push(':root {');
            cssRules.push(...workbenchVars);
            cssRules.push('}');
            cssRules.push('');
        }
        // Add syntax highlighting variables
        if (syntaxVars.length > 0) {
            cssRules.push('/* Syntax Highlighting */');
            cssRules.push(':root {');
            cssRules.push(...syntaxVars);
            cssRules.push('}');
            cssRules.push('');
        }
        // Add semantic token variables
        if (semanticVars.length > 0) {
            cssRules.push('/* Semantic Tokens */');
            cssRules.push(':root {');
            cssRules.push(...semanticVars);
            cssRules.push('}');
            cssRules.push('');
        }
        // Add basic body styling
        cssRules.push('/* Basic Body Styling */');
        cssRules.push('body {');
        if (theme['editor.background']) {
            cssRules.push(`  background-color: ${theme['editor.background']};`);
        }
        if (theme['editor.foreground']) {
            cssRules.push(`  color: ${theme['editor.foreground']};`);
        }
        cssRules.push('  font-family: \'Consolas\', \'Courier New\', monospace;');
        cssRules.push('}');
        cssRules.push('');
        // Add syntax highlighting CSS classes
        if (syntaxVars.length > 0) {
            cssRules.push('/* Syntax Highlighting Classes */');
            this.addSyntaxHighlightingClasses(cssRules, theme);
        }
        return cssRules.join('\n');
    }
    isSyntaxColor(key) {
        const syntaxPrefixes = [
            'variable.', 'keyword.', 'string.', 'comment.', 'constant.',
            'support.', 'storage.', 'entity.', 'punctuation.', 'markup.'
        ];
        return syntaxPrefixes.some(prefix => key.startsWith(prefix));
    }
    isSemanticToken(key) {
        const semanticTokens = [
            'variable.readonly', 'variable.declaration', 'variable.modification',
            'parameter.', 'property.', 'enumMember.', 'function.', 'method.',
            'class.', 'interface.', 'enum.', 'type.', 'namespace.', 'macro.', 'decorator.'
        ];
        return semanticTokens.some(token => key.startsWith(token));
    }
    addSyntaxHighlightingClasses(cssRules, theme) {
        const syntaxMappings = [
            { selector: '.token.keyword', property: 'keyword.foreground' },
            { selector: '.token.string', property: 'string.foreground' },
            { selector: '.token.comment', property: 'comment.foreground' },
            { selector: '.token.number', property: 'constant.numeric.foreground' },
            { selector: '.token.variable', property: 'variable.foreground' },
            { selector: '.token.function', property: 'entity.name.function.foreground' },
            { selector: '.token.class-name', property: 'entity.name.type.foreground' },
            { selector: '.token.operator', property: 'keyword.operator.foreground' },
            { selector: '.token.punctuation', property: 'punctuation.definition.comment.foreground' }
        ];
        syntaxMappings.forEach(mapping => {
            if (theme[mapping.property]) {
                cssRules.push(`${mapping.selector} {`);
                cssRules.push(`  color: ${theme[mapping.property]};`);
                cssRules.push('}');
                cssRules.push('');
            }
        });
    }
    // Export theme as CSS
    async exportAsCSS(theme, savePath) {
        const cssContent = this.convertThemeToCSS(theme);
        fs.writeFileSync(savePath, cssContent, 'utf8');
    }
}
exports.ThemeExtractor = ThemeExtractor;
//# sourceMappingURL=themeExtractor.js.map
