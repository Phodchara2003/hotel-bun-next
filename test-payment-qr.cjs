// Test script to check payment settings and QR code URL
const BASE_URL = 'http://localhost:3003';

const testPaymentSettings = async () => {
  try {
    console.log('🔍 Testing Payment Settings and QR Code...');
    console.log('==============================================');
    
    // Step 1: Check user payment settings API
    console.log('\n📱 Step 1: Checking User Payment Settings...');
    const userResponse = await fetch(`${BASE_URL}/api/simple-payment-settings`);
    
    if (userResponse.ok) {
      const userData = await userResponse.json();
      console.log('✅ User Payment Settings:');
      console.log('- Bank Name:', userData.bankName);
      console.log('- Account Number:', userData.accountNumber);
      console.log('- Account Name:', userData.accountName);
      console.log('- QR Code URL:', userData.qrCodeUrl || '(ว่าง)');
      console.log('- Bank Image URL:', userData.bankImageUrl || '(ว่าง)');
      
      if (userData.qrCodeUrl) {
        console.log('✅ QR Code URL found!');
        console.log('🌐 Full URL:', `${BASE_URL}${userData.qrCodeUrl}`);
      } else {
        console.log('⚠️  No QR Code URL - Admin needs to upload QR code');
      }
    } else {
      console.log('❌ Failed to fetch user settings');
    }
    
    // Step 2: Check admin payment settings API
    console.log('\n🔧 Step 2: Checking Admin Payment Settings...');
    const adminResponse = await fetch(`${BASE_URL}/api/admin/payment-settings`);
    
    if (adminResponse.ok) {
      const adminData = await adminResponse.json();
      console.log('✅ Admin Payment Settings:');
      console.log('- Response type:', typeof adminData);
      console.log('- Has settings:', !!adminData.settings);
      
      if (adminData.settings) {
        const settings = typeof adminData.settings === 'string' 
          ? JSON.parse(adminData.settings) 
          : adminData.settings;
        console.log('- QR Code URL in settings:', settings.qrCodeUrl || '(ว่าง)');
      }
    } else {
      console.log('❌ Failed to fetch admin settings');
    }
    
    console.log('\n🎯 Recommendations:');
    console.log('1. Admin should upload QR code via: http://localhost:3000/admin/payment-settings');
    console.log('2. Then check booking page: http://localhost:3000/booking');
    console.log('3. QR code should appear in payment section');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

testPaymentSettings();