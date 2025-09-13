// ทดสอบ Bookings API กับฐานข้อมูลใหม่
const BASE_URL = 'http://localhost:3003';

console.log('📅 ทดสอบ Bookings API กับฐานข้อมูลใหม่...');

// ล็อกอินเพื่อรับ token ก่อน
async function getAuthToken() {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'demo@example.com',
        password: 'password'
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return { success: true, token: data.token, user: data.user };
    } else {
      return { success: false, error: data };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function testGetBookings(token) {
  try {
    console.log('1. ทดสอบ GET /api/bookings - ดึงข้อมูลการจองทั้งหมด');
    
    const response = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    
    console.log('   📊 Status:', response.status);
    
    if (response.ok) {
      console.log('   ✅ ดึงข้อมูลการจองสำเร็จ');
      
      if (data.bookings && data.bookings.length > 0) {
        console.log(`   📋 พบการจอง: ${data.bookings.length} รายการ`);
        
        data.bookings.forEach((booking, index) => {
          console.log(`   ${index + 1}. การจอง ID: ${booking.id}`);
          console.log(`      📅 วันที่เข้าพัก: ${booking.check_in_date} - ${booking.check_out_date}`);
          console.log(`      💰 ราคารวม: ฿${booking.total_price}`);
          console.log(`      📍 สถานะ: ${booking.status}`);
        });
      } else {
        console.log('   📋 ไม่พบการจอง (ฐานข้อมูลใหม่ยังว่างเปล่า)');
      }
      
      return { success: true, bookings: data.bookings || [] };
    } else {
      console.log('   ❌ ดึงข้อมูลการจองไม่สำเร็จ:', data);
      return { success: false, error: data };
    }
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการทดสอบ Get Bookings:', error.message);
    return { success: false, error: error.message };
  }
}

async function testCreateBooking(token) {
  try {
    console.log('\n2. ทดสอบ POST /api/bookings - สร้างการจองใหม่');
    
    // ข้อมูลการจองทดสอบ
    const bookingData = {
      hotelId: 1,
      roomTypeId: 1, // Standard Room
      checkInDate: '2025-09-20',
      checkOutDate: '2025-09-22',
      guests: 2,
      specialRequests: 'ต้องการห้องวิวสวน และเตียงเสริม'
    };
    
    const response = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData)
    });
    
    const data = await response.json();
    
    console.log('   📊 Status:', response.status);
    
    if (response.ok) {
      console.log('   ✅ สร้างการจองสำเร็จ');
      console.log(`   🎫 รหัสการจอง: ${data.booking_reference || data.bookingReference}`);
      console.log(`   🏨 โรงแรม: ${data.hotel_name || data.hotelName}`);
      console.log(`   🛏️ ประเภทห้อง: ${data.room_type_name || data.roomTypeName}`);
      console.log(`   📅 วันที่เข้าพัก: ${data.check_in_date || data.checkInDate}`);
      console.log(`   📅 วันที่ออก: ${data.check_out_date || data.checkOutDate}`);
      console.log(`   💰 ราคารวม: ฿${data.total_price || data.totalPrice}`);
      
      return { success: true, booking: data };
    } else {
      console.log('   ❌ สร้างการจองไม่สำเร็จ:', data.error || data.message);
      return { success: false, error: data };
    }
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการทดสอบ Create Booking:', error.message);
    return { success: false, error: error.message };
  }
}

async function testGetBookingById(token, bookingId) {
  try {
    console.log(`\n3. ทดสอบ GET /api/bookings/${bookingId} - ดึงข้อมูลการจองเฉพาะ`);
    
    const response = await fetch(`${BASE_URL}/api/bookings/${bookingId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    
    console.log('   📊 Status:', response.status);
    
    if (response.ok) {
      console.log('   ✅ ดึงข้อมูลการจองเฉพาะสำเร็จ');
      console.log(`   🎫 รหัสการจอง: ${data.booking_reference}`);
      console.log(`   📍 สถานะ: ${data.status}`);
      console.log(`   👥 จำนวนผู้เข้าพัก: ${data.guests}`);
      
      if (data.special_requests) {
        console.log(`   📝 คำขอพิเศษ: ${data.special_requests}`);
      }
      
      return { success: true, booking: data };
    } else {
      console.log('   ❌ ดึงข้อมูลการจองเฉพาะไม่สำเร็จ:', data);
      return { success: false, error: data };
    }
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการทดสอบ Get Booking By ID:', error.message);
    return { success: false, error: error.message };
  }
}

async function testAvailabilityCheck(token) {
  try {
    console.log('\n4. ทดสอบ GET /api/bookings/availability - ตรวจสอบความว่างของห้อง');
    
    const checkInDate = '2025-09-25';
    const checkOutDate = '2025-09-27';
    const hotelId = 1;
    
    const response = await fetch(`${BASE_URL}/api/bookings/availability?checkIn=${checkInDate}&checkOut=${checkOutDate}&hotelId=${hotelId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    
    console.log('   📊 Status:', response.status);
    
    if (response.ok) {
      console.log('   ✅ ตรวจสอบความว่างสำเร็จ');
      console.log(`   📅 วันที่ตรวจสอบ: ${checkInDate} - ${checkOutDate}`);
      
      if (data.availableRooms && data.availableRooms.length > 0) {
        console.log(`   🛏️ ห้องที่ว่าง: ${data.availableRooms.length} ประเภท`);
        
        data.availableRooms.forEach((room, index) => {
          console.log(`   ${index + 1}. ${room.name} - ฿${room.price_per_night}/คืน (ว่าง: ${room.available_count} ห้อง)`);
        });
      } else {
        console.log('   🚫 ไม่มีห้องว่างในช่วงวันที่ที่เลือก');
      }
      
      return { success: true, availability: data };
    } else {
      console.log('   ❌ ตรวจสอบความว่างไม่สำเร็จ:', data);
      return { success: false, error: data };
    }
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการทดสอบ Availability Check:', error.message);
    return { success: false, error: error.message };
  }
}

// รันการทดสอบ
async function runAllBookingTests() {
  console.log('='.repeat(60));
  console.log('🚀 เริ่มทดสอบ Bookings API กับฐานข้อมูลใหม่');
  console.log('='.repeat(60));
  
  // ล็อกอินเพื่อรับ token
  console.log('🔐 ล็อกอินเพื่อรับ authentication token...');
  const authResult = await getAuthToken();
  
  if (!authResult.success) {
    console.error('❌ ไม่สามารถล็อกอินได้:', authResult.error);
    return;
  }
  
  console.log('✅ ล็อกอินสำเร็จ');
  const token = authResult.token;
  
  // ทดสอบดึงข้อมูลการจอง
  const getBookingsResult = await testGetBookings(token);
  
  // ทดสอบสร้างการจองใหม่
  const createBookingResult = await testCreateBooking(token);
  
  // ทดสอบดึงข้อมูลการจองเฉพาะ (ถ้าสร้างสำเร็จ)
  if (createBookingResult.success && createBookingResult.booking.id) {
    await testGetBookingById(token, createBookingResult.booking.id);
  }
  
  // ทดสอบตรวจสอบความว่าง
  await testAvailabilityCheck(token);
  
  console.log('\n='.repeat(60));
  console.log('✅ การทดสอบ Bookings API เสร็จสิ้น');
  console.log('='.repeat(60));
}

runAllBookingTests();