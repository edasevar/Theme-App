const fs = require('fs');

try {
    // Read the file
    let content = fs.readFileSync('mytheme-updated.jsonc', 'utf8');
    console.log('File read successfully, length:', content.length);
    
    // Remove color-specific descriptions from comments
    const cleanupPatterns = [
        // Remove specific color mentions after dashes
        { from: / - neon [^\/\n]*/, to: '' },
        { from: / - bright [^\/\n]*/, to: '' },
        { from: / - light [^\/\n]*/, to: '' },
        { from: / - dark [^\/\n]*/, to: '' },
        { from: / - darker [^\/\n]*/, to: '' },
        { from: / - lighter [^\/\n]*/, to: '' },
        { from: / - subtle [^\/\n]*/, to: '' },
        { from: / - consistent [^\/\n]*/, to: '' },
        { from: / - for visibility[^\/\n]*/, to: '' },
        { from: / - for contrast[^\/\n]*/, to: '' },
        { from: / - [a-z]+ tint[^\/\n]*/, to: '' },
        { from: / - [a-z]+ for [^\/\n]*/, to: '' },
        { from: / - white for contrast/, to: '' },
        { from: / - black for contrast/, to: '' },
        { from: / - black/, to: '' },
        { from: / - white/, to: '' },
        { from: / - gray/, to: '' },
        { from: / - brighter [^\/\n]*/, to: '' },
        { from: / - more [^\/\n]*/, to: '' },
        { from: / - very [^\/\n]*/, to: '' },
        { from: / - deeper [^\/\n]*/, to: '' },
        { from: / - softer [^\/\n]*/, to: '' },
        { from: / - distinctive [^\/\n]*/, to: '' },
        { from: / - visible [^\/\n]*/, to: '' },
        { from: / - transparent/, to: '' },
        { from: / - transparency/, to: '' }
    ];
    
    // Apply all cleanup patterns
    cleanupPatterns.forEach(pattern => {
        const regex = new RegExp(pattern.from, 'g');
        content = content.replace(regex, pattern.to);
    });
    
    // Write the file back
    fs.writeFileSync('mytheme-updated.jsonc', content);
    console.log('All color-specific descriptions have been cleaned up');
    
} catch (error) {
    console.error('Error processing file:', error);
}
