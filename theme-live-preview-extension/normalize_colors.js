const fs = require('fs');

try {
    // Read the file
    const content = fs.readFileSync('ELEMENTS.jsonc', 'utf8');
    console.log('File read successfully, length:', content.length);
    
    // Replace all 6-digit hex colors with #ffffff
    let updatedContent = content.replace(/#[0-9a-fA-F]{6}(?![0-9a-fA-F])/g, '#ffffff');
    
    // Replace all 8-digit hex colors with #ffffff00
    updatedContent = updatedContent.replace(/#[0-9a-fA-F]{8}/g, '#ffffff00');
    
    // Write the file back
    fs.writeFileSync('ELEMENTS.jsonc', updatedContent);
    console.log('All color values have been normalized to #ffffff or #ffffff00');
    
} catch (error) {
    console.error('Error processing file:', error);
}
