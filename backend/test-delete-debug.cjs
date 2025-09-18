const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testDeleteWithDebugging() {
  try {
    console.log('🗑️ ทดสอบการลบรูปภาพ (Debug Mode)...\n');

    // ก่อนอื่นดูข้อมูลห้องปัจจุบัน
    console.log('📋 ดึงข้อมูลห้อง 1 ก่อนลบ...');
    const roomsResponse = await fetch('http://localhost:3001/api/admin/rooms');
    const roomsData = await roomsResponse.json();
    
    const room1 = roomsData.data?.find(r => r.id === 1);
    if (room1) {
      console.log('🏨 ข้อมูลห้อง 1 ปัจจุบัน:');
      console.log('   ชื่อ:', room1.name);
      console.log('   รูปภาพ:', JSON.stringify(room1.images, null, 2));
      
      // หาไฟล์ที่จะลบ (ไฟล์ล่าสุดที่อัปโหลด)
      function findLatestUploadedFile(imagesData) {
        if (!imagesData) return null;
        
        function flattenImages(arr) {
          const result = [];
          function flatten(item) {
            if (Array.isArray(item)) {
              item.forEach(flatten);
            } else if (typeof item === 'string' && item.trim() !== '') {
              result.push(item);
            }
          }
          flatten(arr);
          return result;
        }
        
        const flattened = flattenImages(imagesData);
        // หาไฟล์ที่มี timestamp (room-xxxxxxxxx-xxxxxx.jpg)
        const uploadedFiles = flattened.filter(f => f.match(/^room-\d+-\d+\.(jpg|png|jpeg|webp)$/));
        return uploadedFiles[uploadedFiles.length - 1]; // ไฟล์ล่าสุด
      }
      
      const fileToDelete = findLatestUploadedFile(room1.images);
      
      if (!fileToDelete) {
        console.log('❌ ไม่พบไฟล์ที่อัปโหลดให้ลบ');
        return;
      }
      
      console.log('🎯 ไฟล์ที่จะลบ:', fileToDelete);
      
      // ทดสอบการลบ
      console.log('\n🗑️ ส่งคำสั่งลบไปยัง API...');
      const deleteUrl = `http://localhost:3001/api/admin/rooms/1/delete-image`;
      
      const deleteResponse = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ filename: fileToDelete })
      });
      
      console.log('📥 Response Status:', deleteResponse.status);
      console.log('📋 Response Headers:', Object.fromEntries(deleteResponse.headers));
      
      const deleteResult = await deleteResponse.text();
      console.log('📋 Response Body:', deleteResult);
      
      if (deleteResponse.ok) {
        console.log('\n✅ การลบสำเร็จ! ตรวจสอบข้อมูลอีกครั้ง...');
        
        // ตรวจสอบข้อมูลหลังลบ
        const updatedRoomsResponse = await fetch('http://localhost:3001/api/admin/rooms');
        const updatedRoomsData = await updatedRoomsResponse.json();
        const updatedRoom1 = updatedRoomsData.data?.find(r => r.id === 1);
        
        if (updatedRoom1) {
          console.log('🏨 ข้อมูลห้อง 1 หลังลบ:');
          console.log('   รูปภาพ:', JSON.stringify(updatedRoom1.images, null, 2));
        }
      } else {
        console.log('\n❌ การลบล้มเหลว');
      }
      
    } else {
      console.log('❌ ไม่พบข้อมูลห้อง 1');
    }
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testDeleteWithDebugging();