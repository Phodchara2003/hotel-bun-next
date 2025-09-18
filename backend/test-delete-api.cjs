const axios = require('axios');

async function testDeleteImage() {
  console.log('🗑️ ทดสอบการลบรูปภาพ...\n');
  
  try {
    const roomId = 1;
    const filename = 'room-1758216717680-44358556.jpg'; // ไฟล์ที่เพิ่งอัปโหลด
    
    const deleteUrl = `http://localhost:3001/api/admin/rooms/${roomId}/delete-image`;
    console.log(`🔗 API URL: ${deleteUrl}`);
    console.log(`📁 ไฟล์ที่จะลบ: ${filename}`);
    
    // ส่ง DELETE request
    console.log('🗑️ ส่งคำสั่งลบไปยัง API...');
    const response = await axios.delete(deleteUrl, {
      data: { filename },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📥 Response Status: ${response.status}`);
    console.log(`📋 Response Body: ${JSON.stringify(response.data, null, 2)}\n`);
    
    // ตรวจสอบข้อมูลหลังลบ
    console.log('🔍 ตรวจสอบข้อมูลหลังลบ...');
    const getRoomResponse = await axios.get('http://localhost:3001/api/admin/rooms');
    const room = getRoomResponse.data.data.find(r => r.id === roomId);
    
    if (room) {
      console.log(`🏨 ข้อมูลห้อง ${roomId} หลังลบ:`);
      console.log(`   ชื่อ: ${room.name}`);
      console.log(`   รูปภาพ: ${JSON.stringify(room.images, null, 2)}`);
    }
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
    if (error.response) {
      console.error('📥 Response Status:', error.response.status);
      console.error('📋 Response Body:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testDeleteImage();