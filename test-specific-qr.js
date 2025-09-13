const testSpecificQR = async () => {
  console.log('🧪 Testing specific QR Code URL from payment settings...');
  
  try {
    const qrUrl = 'http://localhost:3003/uploads/qr-codes/qr_code_1757665703988.jpg';
    const response = await fetch(qrUrl);
    
    console.log('QR URL:', qrUrl);
    console.log('Status:', response.status);
    console.log('Content-Type:', response.headers.get('content-type'));
    console.log('Content-Length:', response.headers.get('content-length'));
    
    if (response.status === 200) {
      console.log('✅ QR Code is accessible!');
    } else {
      console.log('❌ QR Code not accessible');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
};

testSpecificQR();