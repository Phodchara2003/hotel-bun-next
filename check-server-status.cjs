// ตรวจสอบว่าเซิร์ฟเวอร์รีสตาร์ทแล้วหรือไม่ และ debug logs ทำงานหรือไม่
const http = require('http');

async function checkServerStatus() {
  console.log('🔍 ตรวจสอบสถานะเซิร์ฟเวอร์และการแก้ไข');
  console.log('==========================================');

  try {
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: '/api/bookings',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }, (res) => {
      console.log(`📡 Server Response: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('📊 API Response Sample:');
          
          if (response.success && response.data && response.data.length > 0) {
            const booking = response.data[0];
            console.log({
              check_in_date: booking.check_in_date,
              check_in_type: typeof booking.check_in_date,
              check_out_date: booking.check_out_date,
              check_out_type: typeof booking.check_out_date
            });

            if (typeof booking.check_in_date === 'string') {
              console.log('✅ เซิร์ฟเวอร์ส่งข้อมูลเป็น string แล้ว - การแก้ไขสำเร็จ!');
            } else {
              console.log('❌ เซิร์ฟเวอร์ยังส่งข้อมูลเป็น Date object - ต้องรีสตาร์ท');
            }
          } else {
            console.log('ไม่พบข้อมูลการจอง หรือ response format ผิด');
          }
        } catch (error) {
          console.log('Error parsing response:', error.message);
          console.log('Raw response:', data);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้:', error.message);
      console.log('กรุณาตรวจสอบว่าเซิร์ฟเวอร์รันอยู่หรือไม่');
    });

    req.end();

  } catch (error) {
    console.error('Error:', error.message);
  }
}

console.log('💡 วิธีรีสตาร์ทเซิร์ฟเวอร์:');
console.log('1. กด Ctrl+C ใน terminal ที่รัน mysql-server.cjs');
console.log('2. รันใหม่: node backend/mysql-server.cjs');
console.log('3. รอจนเห็น "📧 Email notification system initialized successfully"');
console.log('4. ทดสอบใหม่');
console.log('');

checkServerStatus();