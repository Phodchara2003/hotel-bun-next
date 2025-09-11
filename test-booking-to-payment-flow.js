console.log('🧪 Testing Complete Booking to Payment Flow...\n');

// Test 1: ทดสอบหน้า booking
async function testBookingPage() {
  console.log('📋 Test 1: Testing booking page...');
  try {
    const response = await fetch('http://localhost:3000/booking');
    
    if (response.ok) {
      console.log('✅ Booking page accessible');
      return true;
    } else {
      console.log('❌ Booking page not accessible, status:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Error accessing booking page:', error.message);
    return false;
  }
}

// Test 2: ทดสอบ payment settings API
async function testPaymentSettings() {
  console.log('\n📋 Test 2: Testing payment settings API...');
  try {
    const response = await fetch('http://localhost:3001/api/simple-payment-settings');
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Payment settings API working');
      console.log('   - Bank Name:', data.bankName || 'Not set');
      console.log('   - Account Number:', data.accountNumber || 'Not set');
      console.log('   - QR Code URL:', data.qrCodeUrl || 'Not set');
      return data;
    } else {
      console.log('❌ Payment settings API failed');
      return null;
    }
  } catch (error) {
    console.log('❌ Error testing payment settings API:', error.message);
    return null;
  }
}

// Test 3: ทดสอบการอัปโหลด QR Code
async function testQRUpload() {
  console.log('\n📋 Test 3: Testing QR Code upload...');
  try {
    // สร้าง mock QR image
    const mockQRData = new Uint8Array([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46,
      0x00, 0x01, 0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00,
      0xFF, 0xD9
    ]);
    
    const blob = new Blob([mockQRData], { type: 'image/jpeg' });
    
    const formData = new FormData();
    formData.append('qrImage', blob, 'hotel-qr.jpg');

    const response = await fetch('http://localhost:3001/api/simple-payment-settings/qr-upload', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ QR Code upload successful');
      console.log('   - QR URL:', data.qrCodeUrl);
      return data.qrCodeUrl;
    } else {
      console.log('❌ QR Code upload failed:', data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Error uploading QR Code:', error.message);
    return null;
  }
}

// Test 4: ทดสอบหน้า payment
async function testPaymentPage() {
  console.log('\n📋 Test 4: Testing payment page...');
  try {
    const testBookingId = 'HTL' + Date.now();
    const testAmount = 3500;
    const paymentURL = `http://localhost:3000/payment?bookingId=${testBookingId}&amount=${testAmount}&hotelName=Test Hotel`;
    
    console.log('🔗 Testing URL:', paymentURL);
    
    const response = await fetch(paymentURL);
    
    if (response.ok) {
      console.log('✅ Payment page accessible');
      console.log('   - Booking ID:', testBookingId);
      console.log('   - Amount:', testAmount);
      return true;
    } else {
      console.log('❌ Payment page not accessible, status:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Error accessing payment page:', error.message);
    return false;
  }
}

// Test 5: ทดสอบ payment slip upload
async function testPaymentSlipUpload() {
  console.log('\n📋 Test 5: Testing payment slip upload...');
  try {
    // สร้าง mock slip image
    const mockSlipData = new Uint8Array([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46,
      0x00, 0x01, 0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00,
      0xFF, 0xD9
    ]);
    
    const blob = new Blob([mockSlipData], { type: 'image/jpeg' });
    
    const formData = new FormData();
    formData.append('paymentSlip', blob, 'payment-slip.jpg');
    formData.append('bookingId', 'TEST_' + Date.now());
    formData.append('amount', '3500');

    const response = await fetch('http://localhost:3001/api/payment-slip/upload', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Payment slip upload working');
      console.log('   - Booking ID:', data.data?.bookingId);
      console.log('   - Amount:', data.data?.amount);
      return true;
    } else {
      console.log('❌ Payment slip upload failed:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Error testing payment slip upload:', error.message);
    return false;
  }
}

// Test 6: ทดสอบ admin panel
async function testAdminPanel() {
  console.log('\n📋 Test 6: Testing admin panel...');
  try {
    const response = await fetch('http://localhost:3000/admin/payment-settings');
    
    if (response.ok) {
      console.log('✅ Admin payment settings page accessible');
      return true;
    } else {
      console.log('❌ Admin panel not accessible, status:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Error accessing admin panel:', error.message);
    return false;
  }
}

// Test 7: ทดสอบ booking confirmation
async function testBookingConfirmation() {
  console.log('\n📋 Test 7: Testing booking confirmation...');
  try {
    const testBookingId = 'HTL12345';
    const confirmationURL = `http://localhost:3000/booking-confirmation/${testBookingId}`;
    
    const response = await fetch(confirmationURL);
    
    if (response.ok) {
      console.log('✅ Booking confirmation page accessible');
      console.log('   - Confirmation URL:', confirmationURL);
      return true;
    } else {
      console.log('❌ Booking confirmation not accessible, status:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Error accessing booking confirmation:', error.message);
    return false;
  }
}

// Test 8: ทดสอบ complete user flow
async function testCompleteUserFlow() {
  console.log('\n📋 Test 8: Testing complete user flow...');
  try {
    console.log('   Step 1: User visits booking page...');
    const bookingPageWorking = await testBookingPage();
    if (!bookingPageWorking) {
      console.log('❌ Flow failed at booking page');
      return false;
    }

    console.log('   Step 2: Admin uploads QR Code...');
    const qrUrl = await testQRUpload();
    if (!qrUrl) {
      console.log('❌ Flow failed at QR upload');
      return false;
    }

    console.log('   Step 3: User completes booking and goes to payment...');
    const paymentPageWorking = await testPaymentPage();
    if (!paymentPageWorking) {
      console.log('❌ Flow failed at payment page');
      return false;
    }

    console.log('   Step 4: User uploads payment slip...');
    const slipUploadWorking = await testPaymentSlipUpload();
    if (!slipUploadWorking) {
      console.log('❌ Flow failed at slip upload');
      return false;
    }

    console.log('   Step 5: User sees booking confirmation...');
    const confirmationWorking = await testBookingConfirmation();
    if (!confirmationWorking) {
      console.log('❌ Flow failed at confirmation');
      return false;
    }

    console.log('✅ Complete user flow test passed!');
    return true;
  } catch (error) {
    console.log('❌ Error in complete user flow test:', error.message);
    return false;
  }
}

// Main test runner
async function runCompleteFlowTest() {
  console.log('🚀 Starting Complete Booking to Payment Flow Test...\n');
  
  const results = {
    bookingPage: await testBookingPage(),
    paymentSettings: await testPaymentSettings(),
    qrUpload: await testQRUpload(),
    paymentPage: await testPaymentPage(),
    paymentSlipUpload: await testPaymentSlipUpload(),
    adminPanel: await testAdminPanel(),
    bookingConfirmation: await testBookingConfirmation(),
    completeUserFlow: await testCompleteUserFlow()
  };

  console.log('\n📊 Complete Flow Test Results:');
  console.log('=====================================');
  
  let passedTests = 0;
  const totalTests = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = typeof passed === 'object' ? (passed !== null ? true : false) : passed;
    console.log(`${status ? '✅' : '❌'} ${test}: ${status ? 'PASSED' : 'FAILED'}`);
    if (status) passedTests++;
  });

  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 Complete Booking to Payment Flow is fully functional!');
    console.log('\n🔗 User Journey:');
    console.log('1. Booking: http://localhost:3000/booking');
    console.log('2. Confirmation: http://localhost:3000/booking-confirmation/HTL12345');
    console.log('3. Payment: http://localhost:3000/payment?bookingId=TEST&amount=3500');
    console.log('4. Admin: http://localhost:3000/admin/payment-settings');
  } else {
    console.log('⚠️ Some components need attention. Check failed tests above.');
  }

  // แสดงคำแนะนำการใช้งาน
  console.log('\n📋 How to Test Manually:');
  console.log('1. เปิด http://localhost:3000/booking');
  console.log('2. เลือกวันที่เข้าพัก, จำนวนผู้เข้าพัก, และประเภทห้อง');
  console.log('3. ในขั้นตอนชำระเงิน จะเห็น QR Code ที่แอดมินอัปโหลด');
  console.log('4. กดยืนยันการจองแล้วไปยังหน้า confirmation');
  console.log('5. กดไปชำระเงินและอัปโหลดสลิป');
  console.log('6. แอดมินสามารถจัดการ QR Code ที่ http://localhost:3000/admin/payment-settings');

  return passedTests === totalTests;
}

// Run complete test
runCompleteFlowTest().catch(error => {
  console.error('💥 Complete flow test runner failed:', error);
});
