const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

/**
 * Enhanced VS Code Theme Extractor
 * Extracts comprehensive CSS data from VS Code theme files
 * Supports .json theme files and .vsix extension packages
 */
class EnhancedVSCodeThemeExtractor {
    constructor() {
        this.cssOutput = [];
        this.themeData = null;
        this.elementsTemplate = null;
    }

    /**
     * Load elements template for complete theme support
     * @param {string} elementsPath - Path to ELEMENTS.jsonc file
     */
    async loadElements(elementsPath) {
        try {
            if (fs.existsSync(elementsPath)) {
                let content = fs.readFileSync(elementsPath, 'utf8');
                
                // Remove JSONC comments more thoroughly
                content = content.replace(/\/\/.*$/gm, '');
                content = content.replace(/\/\*[\s\S]*?\*\//g, '');
                content = content.replace(/,(\s*[}\]])/g, '$1');
                content = content.replace(/"\$schema":[^,\n]+(,?)/g, '');
                
                this.elementsTemplate = JSON.parse(content);
                console.log('✅ Elements template loaded successfully');
                return this.elementsTemplate;
            }
        } catch (error) {
            console.warn('⚠️ Could not load elements template:', error.message);
        }
        return null;
    }

    /**
     * Merge theme with elements template for comprehensive coverage
     * @param {object} theme - Theme data to merge
     */
    mergeWithElements(theme) {
        if (!this.elementsTemplate) {
            return theme;
        }

        const merged = { ...this.elementsTemplate, ...theme };
        
        // Merge colors while preserving existing theme colors
        if (this.elementsTemplate.colors && theme.colors) {
            merged.colors = { ...this.elementsTemplate.colors, ...theme.colors };
        }

        // Merge semantic tokens
        if (this.elementsTemplate.semanticTokenColors && theme.semanticTokenColors) {
            merged.semanticTokenColors = { ...this.elementsTemplate.semanticTokenColors, ...theme.semanticTokenColors };
        }

        // Merge token colors arrays
        if (this.elementsTemplate.tokenColors && theme.tokenColors) {
            merged.tokenColors = [...(this.elementsTemplate.tokenColors || []), ...(theme.tokenColors || [])];
        }

        return merged;
    }

    /**
     * Main method to extract theme data and generate outputs
     * @param {string} filePath - Path to theme file (.json or .vsix)
     * @param {object} options - Options for output generation
     */
    async extractTheme(filePath, options = {}) {
        try {
            // Auto-load elements template if available
            const elementsPath = path.join(__dirname, 'ELEMENTS.jsonc');
            await this.loadElements(elementsPath);

            const ext = path.extname(filePath).toLowerCase();

            if (ext === '.json' || ext === '.jsonc') {
                await this.extractFromJSON(filePath);
            } else if (ext === '.vsix') {
                await this.extractFromVSIX(filePath);
            } else {
                throw new Error('Unsupported file format. Please provide .json, .jsonc, or .vsix files.');
            }

            // Merge with elements template for comprehensive coverage
            if (this.elementsTemplate && this.themeData) {
                this.themeData = this.mergeWithElements(this.themeData);
            }

            const outputs = {};

            if (options.generateCSS !== false) {
                outputs.css = this.generateCSS();
            }

            if (options.generateVSIX !== false) {
                outputs.vsixData = this.generateVSIXData();
            }

            return outputs;
        } catch (error) {
            console.error('Error extracting theme:', error.message);
            return null;
        }
    }

	/**
	 * Extract theme data from JSON/JSONC file
	 * @param {string} filePath - Path to JSON theme file
	 */
	async extractFromJSON(filePath) {
		let content = fs.readFileSync(filePath, 'utf8');

		// Remove JSONC comments more thoroughly
		// Remove single-line comments
		content = content.replace(/\/\/.*$/gm, '');
		// Remove multi-line comments
		content = content.replace(/\/\*[\s\S]*?\*\//g, '');
		// Remove trailing commas
		content = content.replace(/,(\s*[}\]])/g, '$1');

		this.themeData = JSON.parse(content);
		this.processThemeData(this.themeData);
	}

	/**
	 * Extract theme data from VSIX package
	 * @param {string} filePath - Path to VSIX file
	 */
	async extractFromVSIX(filePath) {
		const zip = new AdmZip(filePath);
		const entries = zip.getEntries();

		// Find package.json to locate theme files
		const packageEntry = entries.find(entry => entry.entryName === 'extension/package.json');
		if (!packageEntry) {
			throw new Error('Invalid VSIX: package.json not found');
		}

		const packageData = JSON.parse(packageEntry.getData().toString());
		const themes = packageData.contributes?.themes || [];

		if (themes.length === 0) {
			throw new Error('No themes found in VSIX package');
		}

		// Extract first theme (or could be enhanced to extract all)
		const themeFile = themes[0];
		const themeEntry = entries.find(entry =>
			entry.entryName === `extension/${themeFile.path}` ||
			entry.entryName === themeFile.path
		);

		if (!themeEntry) {
			throw new Error(`Theme file ${themeFile.path} not found in VSIX`);
		}

		const themeContent = themeEntry.getData().toString();
		this.themeData = JSON.parse(themeContent);
		this.processThemeData(this.themeData);
	}

	/**
	 * Process theme data and convert to CSS-compatible format
	 * @param {object} theme - Theme data object
	 */
	processThemeData(theme) {
		this.cssOutput = [];

		// Add theme metadata
		this.addComment(`Theme: ${theme.name || 'Unknown'}`);
		this.addComment(`Type: ${theme.type || 'dark'}`);
		this.addComment(`Generated: ${new Date().toISOString()}`);
		this.addBlankLine();

		// Process workbench colors
		if (theme.colors) {
			this.addComment('WORKBENCH UI COLORS');
			this.addRule(':root', this.convertColorsToCSS(theme.colors));
			this.addBlankLine();
		}

		// Process semantic token colors
		if (theme.semanticTokenColors) {
			this.addComment('SEMANTIC TOKEN COLORS');
			this.processSemanticTokens(theme.semanticTokenColors);
			this.addBlankLine();
		}

		// Process TextMate token colors
		if (theme.tokenColors && Array.isArray(theme.tokenColors)) {
			this.addComment('TEXTMATE TOKEN COLORS');
			this.processTokenColors(theme.tokenColors);
		}
	}

	/**
	 * Convert workbench colors to CSS custom properties
	 * @param {object} colors - Colors object from theme
	 */
	convertColorsToCSS(colors) {
		const cssProperties = {};

		Object.entries(colors).forEach(([key, value]) => {
			// Convert VS Code color keys to CSS custom properties
			const cssKey = `--vscode-${key.replace(/\./g, '-')}`;
			cssProperties[cssKey] = value;
		});

		return cssProperties;
	}

	/**
	 * Process semantic token colors
	 * @param {object} semanticTokens - Semantic token colors
	 */
	processSemanticTokens(semanticTokens) {
		Object.entries(semanticTokens).forEach(([scope, config]) => {
			if (typeof config === 'string') {
				// Simple color assignment
				this.addRule(`.vscode-semantic-${scope}`, {
					color: config
				});
			} else if (typeof config === 'object') {
				// Complex configuration with font styles
				const styles = {};
				if (config.foreground) styles.color = config.foreground;
				if (config.fontStyle) {
					if (config.fontStyle.includes('bold')) styles.fontWeight = 'bold';
					if (config.fontStyle.includes('italic')) styles.fontStyle = 'italic';
					if (config.fontStyle.includes('underline')) styles.textDecoration = 'underline';
				}

				this.addRule(`.vscode-semantic-${scope.replace(/[*.]/g, '-')}`, styles);
			}
		});
	}

	/**
	 * Process TextMate token colors
	 * @param {array} tokenColors - Array of token color rules
	 */
	processTokenColors(tokenColors) {
		tokenColors.forEach((rule, index) => {
			if (!rule.scope) return;

			const scopes = Array.isArray(rule.scope) ? rule.scope : [rule.scope];
			const settings = rule.settings || {};

			scopes.forEach(scope => {
				const className = `.vscode-token-${scope.replace(/[^a-zA-Z0-9]/g, '-')}`;
				const styles = {};

				if (settings.foreground) styles.color = settings.foreground;
				if (settings.background) styles.backgroundColor = settings.background;
				if (settings.fontStyle) {
					if (settings.fontStyle.includes('bold')) styles.fontWeight = 'bold';
					if (settings.fontStyle.includes('italic')) styles.fontStyle = 'italic';
					if (settings.fontStyle.includes('underline')) styles.textDecoration = 'underline';
				}

				if (Object.keys(styles).length > 0) {
					this.addRule(className, styles);
				}
			});
		});
	}

	/**
	 * Generate complete CSS output
	 */
	generateCSS() {
		return this.cssOutput.join('\\n');
	}

	/**
	 * Generate VSIX package data structure
	 */
	generateVSIXData() {
		if (!this.themeData) return null;

		return {
			packageJson: {
				name: this.sanitizeName(this.themeData.name || 'custom-theme'),
				displayName: this.themeData.name || 'Custom Theme',
				description: `Custom VS Code theme: ${this.themeData.name || 'Unnamed'}`,
				version: '1.0.0',
				engines: {
					vscode: '^1.60.0'
				},
				categories: ['Themes'],
				contributes: {
					themes: [{
						label: this.themeData.name || 'Custom Theme',
						uiTheme: this.themeData.type === 'light' ? 'vs' : 'vs-dark',
						path: './themes/theme.json'
					}]
				}
			},
			themeFile: this.themeData
		};
	}

	/**
	 * Create VSIX file
	 * @param {string} outputPath - Path where to save the VSIX file
	 * @param {object} vsixData - VSIX data structure
	 */
	async createVSIX(outputPath, vsixData) {
		const zip = new AdmZip();

		// Add package.json
		zip.addFile('extension/package.json', Buffer.from(JSON.stringify(vsixData.packageJson, null, 2)));

		// Add theme file
		zip.addFile('extension/themes/theme.json', Buffer.from(JSON.stringify(vsixData.themeFile, null, 2)));

		// Add manifest (required for VSIX)
		const manifest = this.generateManifest(vsixData.packageJson);
		zip.addFile('[Content_Types].xml', Buffer.from(manifest.contentTypes));
		zip.addFile('extension.vsixmanifest', Buffer.from(manifest.vsixManifest));

		// Write VSIX file
		zip.writeZip(outputPath);
		return outputPath;
	}

	/**
	 * Generate VSIX manifest files
	 * @param {object} packageJson - Package.json data
	 */
	generateManifest(packageJson) {
		const contentTypes = `<?xml version="1.0" encoding="utf-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="json" ContentType="application/json" />
    <Default Extension="vsixmanifest" ContentType="text/xml" />
</Types>`;

		const vsixManifest = `<?xml version="1.0" encoding="utf-8"?>
<PackageManifest Version="2.0.0" xmlns="http://schemas.microsoft.com/developer/vsx-schema/2011">
    <Metadata>
        <Identity Id="${packageJson.name}" Version="${packageJson.version}" Language="en-US" Publisher="custom" />
        <DisplayName>${packageJson.displayName}</DisplayName>
        <Description>${packageJson.description}</Description>
        <Categories>Themes</Categories>
    </Metadata>
    <Installation>
        <InstallationTarget Id="Microsoft.VisualStudio.Code" Version="${packageJson.engines.vscode}" />
    </Installation>
    <Dependencies />
    <Assets>
        <Asset Type="Microsoft.VisualStudio.Code.Manifest" Path="extension/package.json" Addressable="true" />
    </Assets>
</PackageManifest>`;

		return { contentTypes, vsixManifest };
	}

	/**
	 * Utility methods
	 */
	addRule(selector, properties) {
		if (Object.keys(properties).length === 0) return;

		this.cssOutput.push(`${selector} {`);
		Object.entries(properties).forEach(([prop, value]) => {
			this.cssOutput.push(`    ${this.camelToKebab(prop)}: ${value};`);
		});
		this.cssOutput.push('}');
	}

	addComment(text) {
		this.cssOutput.push(`/* ${text} */`);
	}

	addBlankLine() {
		this.cssOutput.push('');
	}

	camelToKebab(str) {
		return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
	}

	sanitizeName(name) {
		return name.toLowerCase()
			.replace(/[^a-z0-9]/g, '-')
			.replace(/-+/g, '-')
			.replace(/^-|-$/g, '');
	}
}

module.exports = EnhancedVSCodeThemeExtractor;

// CLI usage
if (require.main === module) {
    const extractor = new EnhancedVSCodeThemeExtractor();
    const inputFile = process.argv[2];
    const outputDir = process.argv[3] || './output';

    if (!inputFile) {
        console.log('Enhanced VS Code Theme Extractor with Complete Element Support');
        console.log('Usage: node enhanced_theme_extractor.js <theme-file> [output-dir]');
        console.log('Supported formats: .json, .jsonc, .vsix');
        console.log('');
        console.log('Features:');
        console.log('  ✅ Complete element coverage from ELEMENTS.jsonc');
        console.log('  ✅ CSS custom properties generation');
        console.log('  ✅ VSIX package creation');
        console.log('  ✅ Semantic token processing');
        console.log('  ✅ TextMate token rules');
        process.exit(1);
    }

    if (!fs.existsSync(inputFile)) {
        console.error('❌ Error: Input file does not exist');
        process.exit(1);
    }

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log('🎨 Enhanced VS Code Theme Extractor');
    console.log('=====================================');

    extractor.extractTheme(inputFile, { generateCSS: true, generateVSIX: true })
        .then(async (result) => {
            if (!result) {
                console.error('❌ Failed to extract theme');
                process.exit(1);
            }

            const baseName = path.basename(inputFile, path.extname(inputFile));

            // Write CSS file
            if (result.css) {
                const cssPath = path.join(outputDir, `${baseName}.css`);
                fs.writeFileSync(cssPath, result.css);
                console.log(`✅ CSS exported to: ${cssPath}`);
            }

            // Create VSIX file
            if (result.vsixData) {
                const vsixPath = path.join(outputDir, `${baseName}.vsix`);
                await extractor.createVSIX(vsixPath, result.vsixData);
                console.log(`✅ VSIX created: ${vsixPath}`);
            }

            // Show theme statistics
            if (extractor.themeData) {
                console.log('\n📊 Theme Statistics:');
                console.log(`   Theme Name: ${extractor.themeData.name || 'Unknown'}`);
                console.log(`   Theme Type: ${extractor.themeData.type || 'Unknown'}`);
                console.log(`   Colors: ${Object.keys(extractor.themeData.colors || {}).length} properties`);
                console.log(`   Token Rules: ${(extractor.themeData.tokenColors || []).length} rules`);
                console.log(`   Semantic Tokens: ${Object.keys(extractor.themeData.semanticTokenColors || {}).length} scopes`);
                
                if (extractor.elementsTemplate) {
                    console.log('   🎯 Enhanced with complete element coverage');
                }
            }

            console.log('\n🎉 Theme extraction completed successfully!');
        })
        .catch(error => {
            console.error('❌ Error:', error.message);
            process.exit(1);
        });
}
