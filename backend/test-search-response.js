// Test search API response structure
import fetch from 'node-fetch';

(async () => {
  try {
    console.log('🔍 Testing search API...');
    const response = await fetch('http://localhost:3001/api/rooms/search?checkin=2025-10-10&checkout=2025-10-12&guests=2');
    const data = await response.json();
    
    console.log('📊 Response Status:', response.status);
    console.log('📋 Response Structure:');
    console.log(JSON.stringify(data, null, 2));
    
    // Check specific data structure
    console.log('\n🔍 Analysis:');
    console.log('- success:', data.success);
    console.log('- count:', data.count);
    console.log('- data array length:', data.data?.length);
    
    if (data.data && data.data.length > 0) {
      console.log('- first item keys:', Object.keys(data.data[0]));
      console.log('- first item room_type_id:', data.data[0].room_type_id);
      console.log('- first item room_type_name:', data.data[0].room_type_name);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
})();