const fs = require('fs');
const path = require('path');

console.log('🎉 RAVE1 DARK THEME - COMPLETE PACKAGE SUMMARY');
console.log('='.repeat(60));

// Check all the files we've created
const files = [
	{ name: 'Extension VSIX', path: './theme-live-preview-0.0.1.vsix', desc: 'The complete VS Code extension for theme editing' },
	{ name: 'Theme VSIX', path: './output/rave1-dark-theme.vsix', desc: 'Your Rave1 Dark Theme as installable VSIX' },
	{ name: 'Theme CSS', path: './output/rave1-dark-theme.css', desc: 'CSS export with all theme colors and properties' },
	{ name: 'Theme JSON', path: './output/rave1-dark-theme.json', desc: 'Clean JSON theme file for direct use' },
	{ name: 'Enhanced Extractor', path: './enhanced_theme_extractor.js', desc: 'Node.js tool for theme extraction and conversion' },
	{ name: 'Clean Theme Source', path: './mytheme-clean.json', desc: 'Your source theme with clean JSON format' }
];

console.log('\n📦 Created Files:');
files.forEach(file => {
	if (fs.existsSync(file.path)) {
		const stats = fs.statSync(file.path);
		const sizeKB = (stats.size / 1024).toFixed(1);
		console.log(`✅ ${file.name.padEnd(20)} | ${sizeKB.padStart(8)} KB | ${file.desc}`);
	} else {
		console.log(`❌ ${file.name.padEnd(20)} | Missing | ${file.desc}`);
	}
});

// Theme stats
if (fs.existsSync('./mytheme-clean.json')) {
	const theme = JSON.parse(fs.readFileSync('./mytheme-clean.json', 'utf8'));
	console.log('\n🎨 Theme Details:');
	console.log(`   Name: ${theme.name}`);
	console.log(`   Type: ${theme.type}`);
	console.log(`   Colors: ${Object.keys(theme.colors || {}).length} properties`);
	console.log(`   Token Rules: ${(theme.tokenColors || []).length} rules`);
	console.log(`   Semantic Tokens: ${Object.keys(theme.semanticTokenColors || {}).length} scopes`);
}

console.log('\n🚀 Installation Instructions:');
console.log('   Extension: code --install-extension theme-live-preview-0.0.1.vsix');
console.log('   Theme: code --install-extension output/rave1-dark-theme.vsix');

console.log('\n💡 Usage:');
console.log('   1. Install the extension VSIX to get the theme editor');
console.log('   2. Install the theme VSIX to use your theme directly');
console.log('   3. Use the CSS file for web projects or external tools');
console.log('   4. Use enhanced_theme_extractor.js for future theme processing');

console.log('\n📁 All files are ready in:', path.resolve('.'));
console.log('='.repeat(60));
