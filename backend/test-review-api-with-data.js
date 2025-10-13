// Test Review API with correct data
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

async function testReviewAPIwithData() {
  console.log('🧪 Testing Review API with real data...\n');

  try {
    // Test 1: ทดสอบดึงรีวิวของโรงแรม ID 2 (มีข้อมูลจริง)
    console.log('1️⃣ Testing get hotel reviews for hotel ID 2...');
    
    const hotelReviewsResponse = await axios.get(`${API_BASE_URL}/reviews/hotel/2`);
    console.log('✅ Hotel reviews response status:', hotelReviewsResponse.status);
    console.log('✅ Hotel reviews data:', JSON.stringify(hotelReviewsResponse.data, null, 2));

  } catch (error) {
    console.error('❌ Get hotel reviews error:', error.response?.data || error.message);
  }

  try {
    // Test 2: ทดสอบดึงรีวิวของผู้ใช้ ID 1 (มีข้อมูลจริง)
    console.log('\n2️⃣ Testing get user reviews for user ID 1...');
    
    const userReviewsResponse = await axios.get(`${API_BASE_URL}/reviews/user/1`);
    console.log('✅ User reviews response status:', userReviewsResponse.status);
    console.log('✅ User reviews data:', JSON.stringify(userReviewsResponse.data, null, 2));

  } catch (error) {
    console.error('❌ Get user reviews error:', error.response?.data || error.message);
  }

  try {
    // Test 3: ทดสอบดูการตอบสนองของ endpoint ทั่วไป
    console.log('\n3️⃣ Testing available endpoints...');
    
    // ทดสอบ health check
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Health check:', healthResponse.status, healthResponse.data);

    // ทดสอบ hotels endpoint
    const hotelsResponse = await axios.get(`${API_BASE_URL}/hotels`);
    console.log('✅ Hotels endpoint status:', hotelsResponse.status);
    console.log('✅ Hotels count:', hotelsResponse.data?.data?.length || 'N/A');

  } catch (error) {
    console.error('❌ Endpoints test error:', error.response?.data || error.message);
  }

  console.log('\n🎉 Review API data test completed!');
}

testReviewAPIwithData().catch(console.error);