// ทดสอบ API โดยตรงเพื่อดูว่าการแก้ไขมีผลหรือไม่
const http = require('http');

async function testBookingsAPI() {
  console.log('🧪 ทดสอบ API /bookings โดยตรง');
  console.log('===============================');

  try {
    // ทดสอบเรียก API โดยตรง
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/bookings',
      method: 'GET',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',  // ใส่ token จริง
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      console.log(`📡 Status Code: ${res.statusCode}`);
      console.log(`📋 Headers:`, res.headers);

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          console.log('📊 Response JSON:');
          console.log(JSON.stringify(jsonData, null, 2));
          
          if (jsonData.success && jsonData.data && jsonData.data.length > 0) {
            const booking = jsonData.data[0];
            console.log('');
            console.log('🔍 วิเคราะห์ข้อมูลการจอง:');
            console.log(`  - check_in_date: ${booking.check_in_date}`);
            console.log(`  - check_in_date type: ${typeof booking.check_in_date}`);
            console.log(`  - check_out_date: ${booking.check_out_date}`);
            console.log(`  - check_out_date type: ${typeof booking.check_out_date}`);
            
            if (typeof booking.check_in_date === 'string') {
              console.log('✅ Backend ส่งข้อมูลเป็น string แล้ว - การแก้ไขมีผล!');
              
              // ทดสอบการ format
              const { formatDateThai } = require('./frontend/lib/dateUtils.js');
              try {
                const formatted = formatDateThai(booking.check_in_date);
                console.log(`✅ Formatted result: ${formatted}`);
              } catch (error) {
                console.log(`❌ Error formatting: ${error.message}`);
              }
            } else {
              console.log('❌ Backend ยังส่งข้อมูลเป็น Date object - การแก้ไขยังไม่มีผล');
            }
          }
        } catch (error) {
          console.error('❌ Error parsing JSON:', error.message);
          console.log('Raw data:', data);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error.message);
    });

    req.end();

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// ทดสอบง่ายๆ ด้วย curl command
console.log('💡 วิธีทดสอบง่ายๆ:');
console.log('1. เปิด Command Prompt');
console.log('2. รันคำสั่ง: curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/bookings');
console.log('3. ดูว่าข้อมูล check_in_date เป็น string หรือ Date object');
console.log('');

console.log('🔄 หากยังเป็น Date object ให้:');
console.log('1. หยุดเซิร์ฟเวอร์ (Ctrl+C)');
console.log('2. รันใหม่: node backend/mysql-server.cjs');
console.log('3. ทดสอบอีกครั้ง');
console.log('');

testBookingsAPI();