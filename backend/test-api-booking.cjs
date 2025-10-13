/**
 * ทดสอบการจองผ่าน API จริงเพื่อตรวจสอบระบบแจ้งเตือนอีเมล
 */

const axios = require('axios');

async function testBookingAPI() {
  try {
    console.log('🧪 ทดสอบการจองผ่าน API จริง...');
    console.log('🌐 เซิร์ฟเวอร์: http://localhost:3001');
    
    // ข้อมูลการจองทดสอบ
    const bookingData = {
      user_id: 2,
      hotel_id: 2,
      bed_type: 'double',
      check_in_date: '2025-01-25',
      check_out_date: '2025-01-27',
      guests: 2,
      guest_name: 'นาย ทดสอบ API การจอง',
      guest_email: 'api.test@example.com',
      guest_phone: '081-999-8888',
      guest_national_id: '9876543210987',
      special_requests: 'ทดสอบระบบแจ้งเตือนอีเมลผ่าน API'
    };

    console.log('📝 ข้อมูลการจอง:', JSON.stringify(bookingData, null, 2));
    console.log('\n🔄 กำลังส่งคำขอ POST ไปที่ /api/bookings...');

    // ส่งคำขอไปยัง API
    const response = await axios.post('http://localhost:3001/api/bookings', bookingData, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000 // 10 seconds timeout
    });

    if (response.status === 200 || response.status === 201) {
      console.log('✅ การจองสำเร็จ!');
      console.log('📋 ข้อมูลการจองที่ได้:', JSON.stringify(response.data, null, 2));
      
      if (response.data.success && response.data.data) {
        console.log('\n🎉 การจองเสร็จสมบูรณ์!');
        console.log(`📧 รหัสการจอง: ${response.data.data.booking_reference}`);
        console.log(`🏨 ห้อง: ${response.data.data.room_number} (ชั้น ${response.data.data.floor})`);
        console.log(`💰 ราคารวม: ฿${parseFloat(response.data.data.total_price).toLocaleString()}`);
        console.log('\n📧 ระบบควรส่งอีเมลแจ้งเตือนไปยัง: hotelsystem.rmu.ac.th@gmail.com');
        console.log('📬 ตรวจสอบอีเมลเพื่อดูการแจ้งเตือน');
      }
    } else {
      console.log('❌ การจองไม่สำเร็จ:', response.status, response.statusText);
    }

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้!');
      console.log('💡 กรุณาเปิดเซิร์ฟเวอร์ด้วยคำสั่ง: node mysql-server.cjs');
      console.log('🌐 หรือตรวจสอบว่าเซิร์ฟเวอร์ทำงานอยู่ที่ port 3001');
    } else if (error.response) {
      console.error('❌ API Error:', error.response.status, error.response.statusText);
      console.error('📝 Response data:', error.response.data);
    } else {
      console.error('❌ เกิดข้อผิดพลาด:', error.message);
    }
  }
}

// ตรวจสอบว่าเซิร์ฟเวอร์ทำงานอยู่หรือไม่
async function checkServerStatus() {
  try {
    console.log('🔍 ตรวจสอบสถานะเซิร์ฟเวอร์...');
    const response = await axios.get('http://localhost:3001/api/hotels', {
      timeout: 3000
    });
    console.log('✅ เซิร์ฟเวอร์ทำงานปกติ');
    return true;
  } catch (error) {
    console.log('❌ เซิร์ฟเวอร์ไม่ทำงาน');
    return false;
  }
}

// เรียกใช้ฟังก์ชัน
async function main() {
  const serverRunning = await checkServerStatus();
  
  if (serverRunning) {
    await testBookingAPI();
  } else {
    console.log('\n💡 วิธีการทดสอบ:');
    console.log('1. เปิด terminal ใหม่');
    console.log('2. cd backend');
    console.log('3. node mysql-server.cjs');
    console.log('4. รอให้เซิร์ฟเวอร์ทำงาน');
    console.log('5. เรียกใช้ไฟล์นี้อีกครั้ง: node test-api-booking.cjs');
  }
}

main();