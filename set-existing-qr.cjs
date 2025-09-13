// Set existing QR code in database
const BASE_URL = 'http://localhost:3003';

const setExistingQR = async () => {
  try {
    console.log('🔧 Setting existing QR code...');
    
    // Use one of the existing QR files
    const existingQRPath = '/uploads/qr-codes/qr_code_1757665703988.jpg';
    
    console.log('📝 Updating payment settings with existing QR...');
    
    const response = await fetch(`${BASE_URL}/api/admin/payment-settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        settings: {
          bankInfo: {
            bankName: 'ธนาคารกสิกรไทย',
            accountNumber: '0631351646',
            accountName: 'โรงแรมรอยัลการ์เดน มหาวิทยาลัยราชภัฏสวนดุสิต',
            branchName: 'สาขาสยามพารากอน'
          },
          promptPayInfo: {
            phoneNumber: '0610931494',
            qrCodeUrl: existingQRPath
          },
          instructions: 'กรุณาโอนเงินตามจำนวนที่ระบุ และส่งสลิปการโอนเงินเพื่อยืนยันการชำระเงิน',
          qrCodeUrl: existingQRPath,
          isEnabled: true
        }
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Settings updated successfully!');
      
      // Test user API
      console.log('\n🔍 Testing user payment settings...');
      const userResponse = await fetch(`${BASE_URL}/api/simple-payment-settings`);
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        console.log('✅ User Payment Settings:');
        console.log('- Bank Name:', userData.bankName);
        console.log('- Account Number:', userData.accountNumber);
        console.log('- QR Code URL:', userData.qrCodeUrl);
        
        if (userData.qrCodeUrl) {
          console.log('🎉 QR Code is now available!');
          console.log('🌐 Full URL:', `${BASE_URL}${userData.qrCodeUrl}`);
          console.log('📱 Customers can now see QR code at: http://localhost:3000/booking');
        }
      }
    } else {
      const error = await response.text();
      console.log('❌ Failed to update settings:', error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

setExistingQR();