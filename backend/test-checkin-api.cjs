const mysql = require('mysql2/promise');

async function testCheckInAPI() {
  try {
    console.log('🔧 Testing Check-in API...');
    
    // Test the check-in API
    const response = await fetch('http://localhost:3001/api/bookings/check-in', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        booking_id: 41, // The booking we just created
        staff_id: 20,   // Manager user ID
        notes: 'การทดสอบระบบเช็คอินอัตโนมัติ - ได้รับกุญแจห้องและอธิบายกฎระเบียบแล้ว'
      })
    });
    
    const result = await response.json();
    
    console.log('📊 API Response:');
    console.log('Status:', response.status);
    console.log('Result:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ Check-in successful!');
      console.log('🎯 Now you can test check-out with the same booking');
      
      // Test check-in history API
      console.log('\n🔧 Testing Check-in History API...');
      const historyResponse = await fetch('http://localhost:3001/api/bookings/checkin-history');
      const historyResult = await historyResponse.json();
      
      console.log('📋 History API Response:');
      console.log('Status:', historyResponse.status);
      console.log('Data Count:', historyResult.data?.length || 0);
      
      if (historyResult.success && historyResult.data.length > 0) {
        console.log('📝 Latest check-in record:');
        const latest = historyResult.data[0];
        console.log(`  - Guest: ${latest.guest_name}`);
        console.log(`  - Reference: ${latest.booking_reference}`);
        console.log(`  - Check-in Time: ${latest.actual_check_in_time}`);
        console.log(`  - Status: ${latest.status}`);
        console.log(`  - Staff: ${latest.check_in_staff_name || 'N/A'}`);
      }
      
    } else {
      console.log('❌ Check-in failed:', result.message);
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

testCheckInAPI();