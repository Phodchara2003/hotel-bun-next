// ทดสอบการลบรูปภาพด้วย console.log เพิ่มเติม

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testDeleteDetailed() {
  try {
    console.log('🔍 ทดสอบการลบรูปภาพ - รายละเอียดทุกขั้นตอน\n');

    // 1. ดูข้อมูลห้อง
    const roomsResponse = await fetch('http://localhost:3001/api/admin/rooms');
    const roomsData = await roomsResponse.json();
    const room1 = roomsData.data?.find(r => r.id === 1);
    
    if (!room1) {
      console.log('❌ ไม่พบห้อง 1');
      return;
    }

    console.log('📋 ข้อมูลห้อง 1:');
    console.log('   Images type:', typeof room1.images);
    console.log('   Images value:', JSON.stringify(room1.images, null, 2));

    // 2. หาไฟล์ที่จะลบ
    const fileToDelete = 'room-1758216717680-44358556.jpg'; // ไฟล์ที่เราอัปโหลดไป
    console.log('🎯 ไฟล์เป้าหมาย:', fileToDelete);

    // 3. ทดสอบ function removeFromNestedArray เฉพาะ
    function removeFromNestedArray(arr, targetFilename) {
      console.log('   ▶️ Input array:', JSON.stringify(arr, null, 4));
      console.log('   ▶️ Target filename:', targetFilename);
      
      const result = [];
      
      for (let i = 0; i < arr.length; i++) {
        const item = arr[i];
        console.log(`   ▶️ Processing item ${i}:`, typeof item, JSON.stringify(item));
        
        if (Array.isArray(item)) {
          console.log(`   ▶️ Item ${i} is array, recursing...`);
          const filtered = removeFromNestedArray(item, targetFilename);
          console.log(`   ▶️ Recursion result:`, JSON.stringify(filtered));
          if (filtered.length > 0) {
            result.push(filtered);
          }
        } else if (typeof item === 'string' && item !== targetFilename) {
          console.log(`   ▶️ Item ${i} is string and not target, keeping:`, item);
          result.push(item);
        } else if (typeof item === 'string' && item === targetFilename) {
          console.log(`   ▶️ Item ${i} is target string, REMOVING:`, item);
        } else {
          console.log(`   ▶️ Item ${i} is other type, skipping:`, typeof item, item);
        }
      }
      
      console.log('   ▶️ Final result:', JSON.stringify(result, null, 4));
      return result;
    }

    console.log('\n🧪 ทดสอบ removeFromNestedArray function:');
    const testResult = removeFromNestedArray(room1.images, fileToDelete);
    console.log('🧪 ผลลัพธ์การทดสอบ:', JSON.stringify(testResult, null, 2));

    // 4. ส่งคำสั่งลบ
    console.log('\n🗑️ ส่งคำสั่งลบจริง...');
    const deleteResponse = await fetch(`http://localhost:3001/api/admin/rooms/1/delete-image`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ filename: fileToDelete })
    });

    console.log('📥 Response Status:', deleteResponse.status);
    const deleteResult = await deleteResponse.text();
    console.log('📋 Response Body:', deleteResult);

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
    console.error('Stack:', error.stack);
  }
}

testDeleteDetailed();