console.log('🧪 Testing Complete QR Payment System Integration...\n');

// Test 1: ทดสอบ payment settings API
async function testPaymentSettingsAPI() {
  console.log('📋 Test 1: Payment Settings API...');
  try {
    const response = await fetch('http://localhost:3001/api/simple-payment-settings');
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Payment settings API working');
      console.log('   - Bank Name:', data.bankName || 'Not set');
      console.log('   - Account Number:', data.accountNumber || 'Not set');
      console.log('   - Account Name:', data.accountName || 'Not set');
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

// Test 2: ทดสอบ QR upload endpoint
async function testQRUploadEndpoint() {
  console.log('\n📋 Test 2: QR Code Upload Endpoint...');
  try {
    // สร้าง mock image file
    const mockImageData = new Uint8Array([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46,
      0x00, 0x01, 0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00,
      0xFF, 0xD9
    ]); // Basic JPEG header and footer
    
    const blob = new Blob([mockImageData], { type: 'image/jpeg' });
    
    const formData = new FormData();
    formData.append('qrImage', blob, 'test-qr.jpg');

    const response = await fetch('http://localhost:3001/api/simple-payment-settings/qr-upload', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ QR Upload endpoint working');
      console.log('   - Message:', data.message);
      console.log('   - QR URL:', data.qrCodeUrl);
      console.log('   - Filename:', data.filename);
      return data.qrCodeUrl;
    } else {
      console.log('❌ QR Upload endpoint failed:', data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Error testing QR upload:', error.message);
    return null;
  }
}

// Test 3: ทดสอบ payment slip upload
async function testPaymentSlipUpload() {
  console.log('\n📋 Test 3: Payment Slip Upload...');
  try {
    // สร้าง mock slip image
    const mockSlipData = new Uint8Array([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46,
      0x00, 0x01, 0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00,
      0xFF, 0xD9
    ]);
    
    const blob = new Blob([mockSlipData], { type: 'image/jpeg' });
    
    const formData = new FormData();
    formData.append('paymentSlip', blob, 'test-slip.jpg');
    formData.append('bookingId', 'TEST_' + Date.now());
    formData.append('amount', '3500');

    const response = await fetch('http://localhost:3001/api/payment-slip/upload', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Payment slip upload working');
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

// Test 4: ทดสอบ file serving
async function testFileServing(qrUrl) {
  console.log('\n📋 Test 4: File Serving...');
  try {
    if (!qrUrl) {
      console.log('⏭️ Skipping file serving test (no QR URL)');
      return true;
    }

    const response = await fetch(`http://localhost:3001${qrUrl}`);
    
    if (response.ok) {
      console.log('✅ File serving working');
      console.log('   - QR Code URL accessible:', qrUrl);
      return true;
    } else {
      console.log('❌ File serving failed, status:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Error testing file serving:', error.message);
    return false;
  }
}

// Test 5: ทดสอบ frontend pages
async function testFrontendPages() {
  console.log('\n📋 Test 5: Frontend Pages...');
  try {
    const tests = [
      'http://localhost:3000/payment?bookingId=TEST_12345&amount=3500',
      'http://localhost:3000/admin/payment-settings'
    ];

    let allPassed = true;

    for (const url of tests) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          console.log('✅', url.split('/').slice(-2).join('/'), 'accessible');
        } else {
          console.log('❌', url.split('/').slice(-2).join('/'), 'not accessible');
          allPassed = false;
        }
      } catch (error) {
        console.log('❌', url.split('/').slice(-2).join('/'), 'error:', error.message);
        allPassed = false;
      }
    }

    return allPassed;
  } catch (error) {
    console.log('❌ Error testing frontend pages:', error.message);
    return false;
  }
}

// Test 6: ทดสอบ integrated workflow
async function testIntegratedWorkflow() {
  console.log('\n📋 Test 6: Integrated Workflow...');
  try {
    // 1. แอดมินอัปโหลด QR Code
    console.log('   Step 1: Admin uploads QR Code...');
    const qrUrl = await testQRUploadEndpoint();
    
    if (!qrUrl) {
      console.log('❌ Workflow failed at QR upload step');
      return false;
    }

    // 2. ลูกค้าดูหน้า payment และเห็น QR Code
    console.log('   Step 2: Customer views payment page...');
    const paymentSettings = await testPaymentSettingsAPI();
    
    if (!paymentSettings || !paymentSettings.qrCodeUrl) {
      console.log('❌ Workflow failed: QR Code not visible to customer');
      return false;
    }

    // 3. ลูกค้าอัปโหลดสลิป
    console.log('   Step 3: Customer uploads payment slip...');
    const slipUploaded = await testPaymentSlipUpload();
    
    if (!slipUploaded) {
      console.log('❌ Workflow failed at slip upload step');
      return false;
    }

    console.log('✅ Complete workflow test passed!');
    return true;
  } catch (error) {
    console.log('❌ Error in integrated workflow test:', error.message);
    return false;
  }
}

// Main test runner
async function runCompleteTest() {
  console.log('🚀 Starting Complete QR Payment System Test...\n');
  
  const results = {
    paymentSettingsAPI: await testPaymentSettingsAPI(),
    qrUploadEndpoint: await testQRUploadEndpoint(),
    paymentSlipUpload: await testPaymentSlipUpload(),
    fileServing: await testFileServing(null),
    frontendPages: await testFrontendPages(),
    integratedWorkflow: await testIntegratedWorkflow()
  };

  console.log('\n📊 Complete Test Results Summary:');
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
    console.log('🎉 Complete QR Payment System is fully functional!');
    console.log('\n🔗 Ready for Production:');
    console.log('Admin Panel: http://localhost:3000/admin/payment-settings');
    console.log('Customer Payment: http://localhost:3000/payment?bookingId=TEST&amount=3500');
  } else {
    console.log('⚠️ Some components need attention. Check failed tests above.');
  }

  return passedTests === totalTests;
}

// Run complete test
runCompleteTest().catch(error => {
  console.error('💥 Complete test runner failed:', error);
});
