const fs = require('fs');
const path = require('path');

const testQRUpload = async () => {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJhZG1pbkByb3lhbGdhcmRlbi5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTc2NjU2ODksImV4cCI6MTc1ODI3MDQ4OX0.o-lr8bQT-_tZSYhCEqx_78B3MOhSXyTJ9AKE_JnpZ8c';
  
  console.log('Testing QR Upload functionality...');
  
  // Check if uploads directory exists
  const uploadsDir = path.join(process.cwd(), 'backend', 'uploads');
  const qrDir = path.join(uploadsDir, 'qr-codes');
  
  console.log('\n📁 Checking directories:');
  console.log('Uploads dir exists:', fs.existsSync(uploadsDir));
  console.log('QR dir exists:', fs.existsSync(qrDir));
  
  if (fs.existsSync(uploadsDir)) {
    console.log('Uploads directory contents:', fs.readdirSync(uploadsDir));
  }
  
  if (fs.existsSync(qrDir)) {
    console.log('QR directory contents:', fs.readdirSync(qrDir));
  }
  
  // Check backend uploads directory structure
  console.log('\n📂 Backend upload structure check:');
  const backendDir = path.join(process.cwd(), 'backend');
  if (fs.existsSync(backendDir)) {
    console.log('Backend directory exists');
    const backendUploads = path.join(backendDir, 'uploads');
    console.log('Backend uploads exists:', fs.existsSync(backendUploads));
    
    if (fs.existsSync(backendUploads)) {
      console.log('Backend uploads contents:', fs.readdirSync(backendUploads));
      
      const backendQR = path.join(backendUploads, 'qr');
      if (fs.existsSync(backendQR)) {
        console.log('Backend QR directory contents:', fs.readdirSync(backendQR));
      }
    }
  }
  
  console.log('\n🌐 Testing static file serving...');
  
  try {
    // Test accessing specific QR files that exist
    const existingFiles = [
      'qr_code_1757665703988.jpg', // from qr-codes directory
      'qr-code-1754384605477.png', // from qr directory
    ];
    
    const staticTestUrls = [
      'http://localhost:3003/uploads/qr-codes/qr_code_1757665703988.jpg',
      'http://localhost:3003/uploads/qr/qr-code-1754384605477.png',
      'http://localhost:3003/uploads/qr-codes/',
      'http://localhost:3003/uploads/',
    ];
    
    for (const url of staticTestUrls) {
      try {
        const response = await fetch(url);
        console.log(`${url} - Status: ${response.status}`);
        if (response.status === 200) {
          const contentType = response.headers.get('content-type');
          console.log(`  Content-Type: ${contentType}`);
        }
      } catch (error) {
        console.log(`${url} - Error: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('Error testing static files:', error.message);
  }
};

testQRUpload();