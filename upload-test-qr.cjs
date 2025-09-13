// Upload test QR code via API
const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');

const uploadTestQR = async () => {
  try {
    console.log('📤 Testing QR Code Upload...');
    
    // Check if there's an existing QR file to use
    const uploadsDir = './backend/uploads/qr-codes';
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      const qrFiles = files.filter(f => f.includes('qr'));
      console.log('📁 Existing QR files:', qrFiles);
    }
    
    // Create a simple base64 encoded 1x1 pixel PNG for testing
    const base64Pixel = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGA60e6kgAAAABJRU5ErkJggg==';
    const buffer = Buffer.from(base64Pixel, 'base64');
    
    // Create form data
    const form = new FormData();
    form.append('qrCode', buffer, {
      filename: 'test-qr-code.png',
      contentType: 'image/png'
    });
    
    console.log('📤 Uploading test QR code...');
    
    const response = await fetch('http://localhost:3003/api/simple-payment-settings/qr-upload', {
      method: 'POST',
      body: form
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Upload successful!');
      console.log('📝 Response:', result);
      
      // Now test the user API again
      console.log('\n🔍 Testing updated payment settings...');
      const userResponse = await fetch('http://localhost:3003/api/simple-payment-settings');
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        console.log('✅ Updated User Settings:');
        console.log('- QR Code URL:', userData.qrCodeUrl);
        
        if (userData.qrCodeUrl) {
          console.log('🎉 QR Code is now available at:', `http://localhost:3003${userData.qrCodeUrl}`);
          console.log('🌐 Customer can see QR code at: http://localhost:3000/booking');
        }
      }
    } else {
      const error = await response.text();
      console.log('❌ Upload failed:', error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

uploadTestQR();