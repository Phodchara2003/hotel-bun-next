const fs = require('fs');
const FormData = require('form-data');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testImageUpload() {
  try {
    console.log('🧪 ทดสอบการอัปโหลดรูปภาพ...\n');

    // ตรวจสอบไฟล์ที่มีอยู่
    const testImagePath = 'C:\\Users\\mmoor\\OneDrive\\Desktop\\hotel-bun-next\\frontend\\public\\images\\rooms\\room1.jpg';
    
    if (!fs.existsSync(testImagePath)) {
      console.log('❌ ไม่พบไฟล์ทดสอบ:', testImagePath);
      return;
    }

    console.log('✅ พบไฟล์ทดสอบ:', testImagePath);

    // ทดสอบ API endpoint
    const roomId = 1;
    const apiUrl = `http://localhost:3001/api/admin/rooms/${roomId}/upload-images`;
    
    console.log('🔗 API URL:', apiUrl);

    // สร้าง FormData
    const form = new FormData();
    form.append('roomImages', fs.createReadStream(testImagePath));

    console.log('📤 ส่งข้อมูลไปยัง API...');

    // ส่งคำขอ
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });

    const result = await response.text();
    console.log('📥 Response Status:', response.status);
    console.log('📋 Response Body:', result);

    // ทดสอบการดึงข้อมูลห้อง
    console.log('\n🔍 ทดสอบการดึงข้อมูลห้อง...');
    
    const roomsResponse = await fetch('http://localhost:3001/api/admin/rooms');
    const roomsData = await roomsResponse.json();
    
    if (roomsData.success && roomsData.data) {
      const room1 = roomsData.data.find(r => r.id === 1);
      if (room1) {
        console.log('🏨 ข้อมูลห้อง 1:');
        console.log('   ชื่อ:', room1.name);
        console.log('   รูปภาพ:', JSON.stringify(room1.images, null, 2));
      }
    }

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
  }
}

testImageUpload();