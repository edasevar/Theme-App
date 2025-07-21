const fs = require('fs');

// Read the JSONC file
let content = fs.readFileSync('./mytheme-updated.jsonc', 'utf8');

// More comprehensive comment removal
console.log('Cleaning JSONC...');

// Remove single-line comments (but preserve strings)
content = content.replace(/(?:^|[^"\\])\/\/.*$/gm, '');

// Remove multi-line comments
content = content.replace(/\/\*[\s\S]*?\*\//g, '');

// Remove trailing commas before closing braces/brackets
content = content.replace(/,(\s*[}\]])/g, '$1');

// Remove the $schema line which may have special characters
content = content.replace(/"\$schema":[^,\n]+(,?)/g, '');

// Clean up extra whitespace
content = content.replace(/^\s*\n/gm, '');

// Write clean JSON
fs.writeFileSync('./mytheme-clean.json', content);
console.log('Clean JSON created: mytheme-clean.json');

// Test parse
try {
    const parsed = JSON.parse(content);
    console.log('✅ JSON is valid! Theme name:', parsed.name);
    console.log('✅ Theme type:', parsed.type);
    console.log('✅ Color count:', Object.keys(parsed.colors || {}).length);
} catch (error) {
    console.error('❌ JSON parse error:', error.message);
}
