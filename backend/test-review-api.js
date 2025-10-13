// Test script for review API
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

async function testReviewAPI() {
  console.log('🧪 Testing Review API...\n');

  try {
    // Test 1: ทดสอบสร้างรีวิวใหม่
    console.log('1️⃣ Testing create review...');
    
    const reviewData = {
      hotelId: 2, // ใช้ hotel ID ที่มีอยู่จริงใน database
      bookingId: null, // ไม่ต้องมี booking ID ก็ได้
      rating: 5,
      comment: 'โรงแรมสุดยอดมาก! บริการดีเยี่ยม ห้องพักสะอาด วิวสวย แนะนำเลยครับ 🏨✨',
      photos: []
    };

    // ใช้ token ตัวอย่าง (ในการใช้งานจริงต้องได้มาจากการ login)
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token' // ต้องใช้ token จริงในการใช้งานจริง
    };

    const createResponse = await axios.post(`${API_BASE_URL}/reviews`, reviewData, { headers });
    console.log('✅ Create review response:', createResponse.data);

  } catch (error) {
    console.error('❌ Create review error:', error.response?.data || error.message);
  }

  try {
    // Test 2: ทดสอบดึงรีวิวของโรงแรม
    console.log('\n2️⃣ Testing get hotel reviews...');
    
    const hotelReviewsResponse = await axios.get(`${API_BASE_URL}/reviews/hotel/1`);
    console.log('✅ Hotel reviews response:', JSON.stringify(hotelReviewsResponse.data, null, 2));

  } catch (error) {
    console.error('❌ Get hotel reviews error:', error.response?.data || error.message);
  }

  try {
    // Test 3: ทดสอบดึงรีวิวของผู้ใช้
    console.log('\n3️⃣ Testing get user reviews...');
    
    const userReviewsResponse = await axios.get(`${API_BASE_URL}/reviews/user/1`);
    console.log('✅ User reviews response:', JSON.stringify(userReviewsResponse.data, null, 2));

  } catch (error) {
    console.error('❌ Get user reviews error:', error.response?.data || error.message);
  }

  console.log('\n🎉 Review API test completed!');
}

testReviewAPI().catch(console.error);