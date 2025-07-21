const fs = require('fs');
const path = require('path');
const EnhancedVSCodeThemeExtractor = require('./enhanced_theme_extractor');

async function createThemePackage() {
	try {
		console.log('🚀 Creating Rave1 Dark Theme package...');

		const extractor = new EnhancedVSCodeThemeExtractor();
		const themeFile = './mytheme-clean.json';
		const outputDir = './output';

		// Ensure output directory exists
		if (!fs.existsSync(outputDir)) {
			fs.mkdirSync(outputDir, { recursive: true });
		}

		console.log('📄 Processing theme file:', themeFile);
		const result = await extractor.extractTheme(themeFile, { generateCSS: true, generateVSIX: true });

		if (!result) {
			console.error('❌ Failed to extract theme');
			return;
		}

		const baseName = 'rave1-dark-theme';

		// Write CSS file
		if (result.css) {
			const cssPath = path.join(outputDir, `${baseName}.css`);
			fs.writeFileSync(cssPath, result.css);
			console.log('✅ CSS exported to:', cssPath);
		}

		// Create VSIX file
		if (result.vsixData) {
			const vsixPath = path.join(outputDir, `${baseName}.vsix`);
			await extractor.createVSIX(vsixPath, result.vsixData);
			console.log('✅ VSIX created:', vsixPath);
		}

		// Also create a standalone theme.json for direct use
		const themeJsonPath = path.join(outputDir, `${baseName}.json`);
		fs.writeFileSync(themeJsonPath, JSON.stringify(extractor.themeData, null, 2));
		console.log('✅ Theme JSON exported to:', themeJsonPath);

		console.log('\\n🎉 Theme package creation completed successfully!');
		console.log('📁 Output files in:', path.resolve(outputDir));

	} catch (error) {
		console.error('❌ Error creating theme package:', error.message);
		console.error(error.stack);
	}
}

createThemePackage();
