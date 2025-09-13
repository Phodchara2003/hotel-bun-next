// ทดสอบ Hotels API กับฐานข้อมูลใหม่
const BASE_URL = 'http://localhost:3003';

console.log('🏨 ทดสอบ Hotels API กับฐานข้อมูลใหม่...');

async function testHotelsAPI() {
  try {
    console.log('1. ทดสอบ GET /api/hotels - ดึงข้อมูลโรงแรม');
    
    const hotelsResponse = await fetch(`${BASE_URL}/api/hotels`);
    const hotelsData = await hotelsResponse.json();
    
    console.log('   📊 Status:', hotelsResponse.status);
    console.log('   📋 Response:', JSON.stringify(hotelsData, null, 2));
    
    if (hotelsResponse.ok) {
      console.log('   ✅ Hotels API ทำงานได้ปกติ');
      
      if (hotelsData.hotels && hotelsData.hotels.length > 0) {
        console.log(`   🏨 พบโรงแรม: ${hotelsData.hotels.length} แห่ง`);
        
        const hotel = hotelsData.hotels[0];
        console.log(`   📍 โรงแรมแรก: ${hotel.name} (ID: ${hotel.id})`);
        
        if (hotel.room_types && hotel.room_types.length > 0) {
          console.log(`   🛏️ ประเภทห้องพัก: ${hotel.room_types.length} ประเภท`);
          hotel.room_types.forEach((roomType, index) => {
            console.log(`      ${index + 1}. ${roomType.name} - ฿${roomType.price_per_night}/คืน`);
          });
        }
        
        return { success: true, hotel: hotel };
      } else {
        console.log('   ⚠️ ไม่พบข้อมูลโรงแรม');
        return { success: false, error: 'No hotels found' };
      }
    } else {
      console.log('   ❌ Hotels API error:', hotelsData);
      return { success: false, error: hotelsData };
    }
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการทดสอบ Hotels API:', error.message);
    return { success: false, error: error.message };
  }
}

async function testSpecificHotelAPI(hotelId) {
  try {
    console.log(`\n2. ทดสอบ GET /api/hotels/${hotelId} - ดึงข้อมูลโรงแรมเฉพาะ`);
    
    const response = await fetch(`${BASE_URL}/api/hotels/${hotelId}`);
    const data = await response.json();
    
    console.log('   📊 Status:', response.status);
    
    if (response.ok) {
      console.log('   ✅ Single Hotel API ทำงานได้ปกติ');
      console.log(`   🏨 ชื่อโรงแรม: ${data.name}`);
      console.log(`   📍 ที่อยู่: ${data.address}, ${data.city}`);
      console.log(`   ⭐ คะแนน: ${data.rating}/5`);
      
      if (data.amenities) {
        console.log(`   🎯 สิ่งอำนวยความสะดวก: ${data.amenities.join(', ')}`);
      }
      
      return { success: true, hotel: data };
    } else {
      console.log('   ❌ Single Hotel API error:', data);
      return { success: false, error: data };
    }
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการทดสอบ Single Hotel API:', error.message);
    return { success: false, error: error.message };
  }
}

async function testRoomTypesAPI() {
  try {
    console.log('\n3. ทดสอบ GET /api/room-types - ดึงข้อมูลประเภทห้องพัก');
    
    const response = await fetch(`${BASE_URL}/api/room-types`);
    const data = await response.json();
    
    console.log('   📊 Status:', response.status);
    
    if (response.ok) {
      console.log('   ✅ Room Types API ทำงานได้ปกติ');
      
      if (data.length > 0) {
        console.log(`   🛏️ พบประเภทห้องพัก: ${data.length} ประเภท`);
        
        data.forEach((roomType, index) => {
          console.log(`   ${index + 1}. ${roomType.name}`);
          console.log(`      💰 ราคา: ฿${roomType.price_per_night}/คืน`);
          console.log(`      👥 จำนวนผู้เข้าพัก: ${roomType.max_guests} คน`);
          console.log(`      📐 ขนาด: ${roomType.size_sqm} ตรม.`);
        });
        
        return { success: true, roomTypes: data };
      } else {
        console.log('   ⚠️ ไม่พบข้อมูลประเภทห้องพัก');
        return { success: false, error: 'No room types found' };
      }
    } else {
      console.log('   ❌ Room Types API error:', data);
      return { success: false, error: data };
    }
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการทดสอบ Room Types API:', error.message);
    return { success: false, error: error.message };
  }
}

// รันการทดสอบ
async function runAllTests() {
  console.log('='.repeat(60));
  console.log('🚀 เริ่มทดสอบ Hotels API กับฐานข้อมูลใหม่');
  console.log('='.repeat(60));
  
  // ทดสอบ Hotels API
  const hotelsResult = await testHotelsAPI();
  
  // ทดสอบ Single Hotel API (ถ้า Hotels API ทำงาน)
  if (hotelsResult.success && hotelsResult.hotel) {
    await testSpecificHotelAPI(hotelsResult.hotel.id);
  }
  
  // ทดสอบ Room Types API
  await testRoomTypesAPI();
  
  console.log('\n='.repeat(60));
  console.log('✅ การทดสอบ Hotels API เสร็จสิ้น');
  console.log('='.repeat(60));
}

runAllTests();