const fs = require('fs');
const path = require('path');

const uploadsPath = path.join(__dirname, 'uploads', 'room-images');

// Files that should exist based on database
const requiredFiles = [
  'room-1758481305262-898982757.png',
  'room-1758741750097-346562065.png', 
  'room-1758741750115-420147849.jpg',
  'room-1758481318122-925646652.png',
  'room-1758741769735-231313828.jpg',
  'room-1758741769742-452782886.jpg',
  'room-1758876857912-63539188.png'
];

// Files that exist in directory
const existingFiles = [
  'room-1758275954942-81117622.png',
  'room-1758283949829-274513890.png',
  'room-1758283949849-871061205.png',
  'room-1758283949883-536470183.jpg',
  'villa1.jpg'
];

console.log('🔧 Creating missing room images...');

// Create missing files by copying existing ones
requiredFiles.forEach((requiredFile, index) => {
  const requiredFilePath = path.join(uploadsPath, requiredFile);
  
  if (!fs.existsSync(requiredFilePath)) {
    // Use existing file as source (cycling through available files)
    const sourceFile = existingFiles[index % existingFiles.length];
    const sourcePath = path.join(uploadsPath, sourceFile);
    
    if (fs.existsSync(sourcePath)) {
      try {
        fs.copyFileSync(sourcePath, requiredFilePath);
        console.log(`✅ Created: ${requiredFile} (copied from ${sourceFile})`);
      } catch (error) {
        console.error(`❌ Failed to create ${requiredFile}:`, error.message);
      }
    }
  } else {
    console.log(`✓ Already exists: ${requiredFile}`);
  }
});

console.log('🎉 Room image creation complete!');

// List all files in directory
console.log('\n📁 Current files in room-images directory:');
const allFiles = fs.readdirSync(uploadsPath);
allFiles.forEach(file => {
  const filePath = path.join(uploadsPath, file);
  const stats = fs.statSync(filePath);
  console.log(`  ${file} (${stats.size} bytes)`);
});