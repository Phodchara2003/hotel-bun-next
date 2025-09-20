const axios = require('axios');

async function testProblematicData() {
  try {
    console.log('🚨 Testing with potentially problematic data...');
    
    // Test different problematic scenarios
    const testCases = [
      {
        name: 'Empty string fields',
        data: {
          name: 'Test Room',
          type: 'standard',
          number: 'R9',
          floor: '', // empty string
          capacity: '', // empty string
          price: '', // empty string 
          description: '',
          amenities: [],
          status: 'available',
          size: '', // empty string
          bed_type: '',
          view_type: ''
        }
      },
      {
        name: 'Null values',
        data: {
          name: 'Test Room',
          type: 'standard', 
          number: 'R9',
          floor: null,
          capacity: null,
          price: null,
          description: null,
          amenities: null,
          status: 'available',
          size: null,
          bed_type: null,
          view_type: null
        }
      },
      {
        name: 'Undefined values',
        data: {
          name: 'Test Room',
          type: 'standard',
          number: 'R9',
          // missing fields (undefined)
        }
      }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n🧪 Testing: ${testCase.name}`);
      console.log('Data:', JSON.stringify(testCase.data, null, 2));
      
      try {
        const response = await axios.put('http://localhost:3001/api/admin/rooms/9', testCase.data);
        console.log('✅ Success:', response.data.message);
      } catch (error) {
        console.log('❌ Failed:', error.response?.data?.message || error.message);
        console.log('Status:', error.response?.status);
      }
    }
    
  } catch (error) {
    console.error('Test setup error:', error.message);
  }
}

testProblematicData();