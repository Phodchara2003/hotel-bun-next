const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testImageUpload() {
  try {
    console.log('📸 Testing image upload for room 4...');
    
    // Create a simple test image file (1x1 pixel PNG)
    const testImagePath = path.join(__dirname, 'test-image.png');
    const pngHeader = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
      0x49, 0x48, 0x44, 0x52, // IHDR
      0x00, 0x00, 0x00, 0x01, // width = 1
      0x00, 0x00, 0x00, 0x01, // height = 1
      0x08, 0x06, // bit depth = 8, color type = 6 (RGBA)
      0x00, 0x00, 0x00, // compression, filter, interlace
      0x1F, 0x15, 0xC4, 0x89, // CRC
      0x00, 0x00, 0x00, 0x0A, // IDAT chunk length
      0x49, 0x44, 0x41, 0x54, // IDAT
      0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, // compressed data
      0x0D, 0x0A, 0x2D, 0xB4, // CRC
      0x00, 0x00, 0x00, 0x00, // IEND chunk length
      0x49, 0x45, 0x4E, 0x44, // IEND
      0xAE, 0x42, 0x60, 0x82  // CRC
    ]);
    
    fs.writeFileSync(testImagePath, pngHeader);
    console.log('📁 Created test image:', testImagePath);
    
    // Create FormData
    const formData = new FormData();
    formData.append('roomImages', fs.createReadStream(testImagePath));
    
    console.log('📤 Uploading image...');
    const response = await axios.post(
      'http://localhost:3001/api/admin/rooms/4/upload-images',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
      }
    );
    
    console.log('✅ Upload response:', response.data);
    
    // Clean up test file
    fs.unlinkSync(testImagePath);
    console.log('🗑️ Cleaned up test image');
    
  } catch (error) {
    console.error('❌ Upload Error:', error.response?.data || error.message);
    console.error('❌ Status:', error.response?.status);
  }
}

testImageUpload();