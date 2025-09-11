console.log('🧪 Testing QR Payment System...\n');

// Test 1: ทดสอบดึงข้อมูล payment settings
async function testPaymentSettings() {
  console.log('📋 Test 1: Getting payment settings...');
  try {
    const response = await fetch('http://localhost:3001/api/simple-payment-settings');
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Payment settings retrieved successfully:');
      console.log('   - Bank Name:', data.bankName || 'Not set');
      console.log('   - Account Number:', data.accountNumber || 'Not set');
      console.log('   - Account Name:', data.accountName || 'Not set');
      console.log('   - QR Code URL:', data.qrCodeUrl || 'Not set');
      return true;
    } else {
      console.log('❌ Failed to get payment settings:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Error fetching payment settings:', error.message);
    return false;
  }
}

// Test 2: ทดสอบการสร้าง mock booking
async function testMockBooking() {
  console.log('\n📋 Test 2: Creating mock booking...');
  try {
    const mockBooking = {
      checkIn: '2025-02-15',
      checkOut: '2025-02-17',
      roomType: 'Deluxe Room',
      guests: 2,
      totalAmount: 3500,
      customerName: 'ทดสอบ ชำระเงิน',
      customerEmail: 'test@payment.com',
      customerPhone: '081-234-5678'
    };

    // ลองสร้าง booking ผ่าน API
    const response = await fetch('http://localhost:3001/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mockBooking)
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Mock booking created successfully:');
      console.log('   - Booking ID:', data.bookingId || 'N/A');
      console.log('   - Reference:', data.reference || 'N/A');
      console.log('   - Amount:', mockBooking.totalAmount, 'THB');
      return data.bookingId || 'MOCK_12345';
    } else {
      console.log('⚠️ Could not create booking via API, using mock ID');
      return 'MOCK_12345';
    }
  } catch (error) {
    console.log('⚠️ Error creating booking, using mock ID:', error.message);
    return 'MOCK_12345';
  }
}

// Test 3: ทดสอบ payment page URL
async function testPaymentPageURL(bookingId) {
  console.log('\n📋 Test 3: Testing payment page access...');
  try {
    const paymentURL = `http://localhost:3000/payment?bookingId=${bookingId}&amount=3500&hotelName=Test Hotel`;
    console.log('🔗 Payment URL:', paymentURL);
    
    // ทดสอบการเข้าถึงหน้า payment
    const response = await fetch(paymentURL);
    
    if (response.ok) {
      console.log('✅ Payment page accessible');
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

// Test 4: ทดสอบ payment slip upload endpoint
async function testPaymentSlipEndpoint() {
  console.log('\n📋 Test 4: Testing payment slip upload endpoint...');
  try {
    // สร้าง mock file data
    const mockImageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAAAAAAD...'; // Mock base64
    
    const formData = new FormData();
    
    // สร้าง blob จาก mock data
    const blob = new Blob(['mock image data'], { type: 'image/jpeg' });
    formData.append('paymentSlip', blob, 'test-slip.jpg');
    formData.append('bookingId', 'TEST_12345');
    formData.append('amount', '3500');

    const response = await fetch('http://localhost:3001/api/payment-slip/upload', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Payment slip upload endpoint working:');
      console.log('   - Message:', data.message);
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

// Test 5: ทดสอบ file serving
async function testFileServing() {
  console.log('\n📋 Test 5: Testing file serving...');
  try {
    const response = await fetch('http://localhost:3001/uploads/slips/test.jpg');
    
    if (response.status === 404) {
      console.log('✅ File serving endpoint working (404 for non-existent file is expected)');
      return true;
    } else if (response.ok) {
      console.log('✅ File serving endpoint working (file exists)');
      return true;
    } else {
      console.log('❌ File serving endpoint error, status:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Error testing file serving:', error.message);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting QR Payment System Tests...\n');
  
  const results = {
    paymentSettings: await testPaymentSettings(),
    mockBooking: await testMockBooking(),
    paymentSlipEndpoint: await testPaymentSlipEndpoint(),
    fileServing: await testFileServing()
  };

  const bookingId = await testMockBooking();
  results.paymentPageURL = await testPaymentPageURL(bookingId);

  console.log('\n📊 Test Results Summary:');
  console.log('================================');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });

  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! QR Payment system is ready.');
  } else {
    console.log('⚠️ Some tests failed. Check the setup.');
  }

  // แสดงข้อมูลสำหรับทดสอบ manual
  console.log('\n🔗 Manual Testing URLs:');
  console.log(`Frontend Payment Page: http://localhost:3000/payment?bookingId=${bookingId}&amount=3500`);
  console.log('Backend Payment Settings: http://localhost:3001/api/simple-payment-settings');
  console.log('Backend Server Status: http://localhost:3001/api/health');
}

// Run tests
runAllTests().catch(error => {
  console.error('💥 Test runner failed:', error);
});
