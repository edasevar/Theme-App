const fs = require('fs');

try {
    // Read the file
    let content = fs.readFileSync('mytheme-updated.jsonc', 'utf8');
    console.log('File read successfully, length:', content.length);
    
    // Fix remaining Neon references
    const neonReplacements = [
        { from: /\/\/ Neon purple for built-in types/g, to: '// Color for built-in types' },
        { from: /\/\/ Neon orange for methods/g, to: '// Color for methods' },
        { from: /\/\/ Neon yellow for functions/g, to: '// Color for functions' },
        { from: /\/\/ Neon orange-yellow for function variables/g, to: '// Color for function variables' },
        { from: /\/\/ Neon hot pink for strings/g, to: '// Color for strings' },
        { from: /\/\/ Neon teal for escape sequences/g, to: '// Color for escape sequences' },
        { from: /\/\/ Neon lime green for numbers/g, to: '// Color for numbers' },
        { from: /\/\/ Neon cyan for booleans/g, to: '// Color for booleans' },
        // General fallback for any remaining "Neon [color]" patterns
        { from: /\/\/ Neon [a-zA-Z\-\s]+ for /g, to: '// Color for ' }
    ];
    
    // Apply all replacements
    neonReplacements.forEach(replacement => {
        content = content.replace(replacement.from, replacement.to);
    });
    
    // Write the file back
    fs.writeFileSync('mytheme-updated.jsonc', content);
    console.log('All remaining Neon references have been fixed');
    
} catch (error) {
    console.error('Error processing file:', error);
}
