// ทดสอบระบบจัดการรูปภาพห้องแบบครบวงจร
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fs = require('fs');
const FormData = require('form-data');

async function testCompleteImageWorkflow() {
  try {
    console.log('🏨 ทดสอบระบบจัดการรูปภาพห้องแบบครบวงจร\n');

    // === STEP 1: ดูข้อมูลห้องเริ่มต้น ===
    console.log('📋 STEP 1: ดึงข้อมูลห้องเริ่มต้น');
    const initialResponse = await fetch('http://localhost:3001/api/admin/rooms');
    const initialData = await initialResponse.json();
    const room1 = initialData.data?.find(r => r.id === 1);
    
    if (!room1) {
      console.log('❌ ไม่พบห้อง 1');
      return;
    }

    console.log('🏨 ห้อง 1 - ข้อมูลเริ่มต้น:');
    console.log('   ชื่อ:', room1.name);
    console.log('   รูปภาพ:', JSON.stringify(room1.images, null, 2));

    // Function to parse room images
    function parseRoomImages(imagesData) {
      if (!imagesData) return [];
      
      function deepFlatten(arr) {
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
      
      return deepFlatten(imagesData);
    }

    const initialImagesList = parseRoomImages(room1.images);
    console.log('📸 รูปภาพที่แยกออกมา:', initialImagesList);
    console.log('📊 จำนวนรูปภาพเริ่มต้น:', initialImagesList.length);

    // === STEP 2: อัปโหลดรูปภาพใหม่ ===
    console.log('\n📤 STEP 2: ทดสอบการอัปโหลดรูปภาพใหม่');
    
    const testImagePath = 'C:\\Users\\mmoor\\OneDrive\\Desktop\\hotel-bun-next\\frontend\\public\\images\\rooms\\room1.jpg';
    
    if (!fs.existsSync(testImagePath)) {
      console.log('❌ ไม่พบไฟล์ทดสอบ:', testImagePath);
      return;
    }

    const form = new FormData();
    form.append('roomImages', fs.createReadStream(testImagePath));

    const uploadResponse = await fetch(`http://localhost:3001/api/admin/rooms/1/upload-images`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });

    const uploadResult = await uploadResponse.json();
    console.log('📤 ผลการอัปโหลด:', uploadResult.success ? '✅ สำเร็จ' : '❌ ล้มเหลว');
    console.log('📁 ไฟล์ที่อัปโหลด:', uploadResult.data?.uploadedFiles);

    if (!uploadResult.success) {
      console.log('❌ การอัปโหลดล้มเหลว:', uploadResult.message);
      return;
    }

    const uploadedFileName = uploadResult.data?.uploadedFiles[0];

    // === STEP 3: ตรวจสอบข้อมูลหลังอัปโหลด ===
    console.log('\n🔍 STEP 3: ตรวจสอบข้อมูลหลังอัปโหลด');
    const afterUploadResponse = await fetch('http://localhost:3001/api/admin/rooms');
    const afterUploadData = await afterUploadResponse.json();
    const room1AfterUpload = afterUploadData.data?.find(r => r.id === 1);

    console.log('🏨 ห้อง 1 - หลังอัปโหลด:');
    console.log('   รูปภาพ:', JSON.stringify(room1AfterUpload.images, null, 2));

    const afterUploadImagesList = parseRoomImages(room1AfterUpload.images);
    console.log('📸 รูปภาพที่แยกออกมา:', afterUploadImagesList);
    console.log('📊 จำนวนรูปภาพหลังอัปโหลด:', afterUploadImagesList.length);

    // === STEP 4: ลบรูปภาพที่อัปโหลด ===
    console.log('\n🗑️ STEP 4: ทดสอบการลบรูปภาพ');
    console.log('🎯 ไฟล์ที่จะลบ:', uploadedFileName);

    const deleteResponse = await fetch(`http://localhost:3001/api/admin/rooms/1/delete-image`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ filename: uploadedFileName })
    });

    const deleteResult = await deleteResponse.json();
    console.log('🗑️ ผลการลบ:', deleteResult.success ? '✅ สำเร็จ' : '❌ ล้มเหลว');
    console.log('📁 ไฟล์ที่ลบ:', deleteResult.data?.deletedFile);

    if (!deleteResult.success) {
      console.log('❌ การลบล้มเหลว:', deleteResult.message);
      return;
    }

    // === STEP 5: ตรวจสอบข้อมูลสุดท้าย ===
    console.log('\n✅ STEP 5: ตรวจสอบข้อมูลสุดท้าย');
    const finalResponse = await fetch('http://localhost:3001/api/admin/rooms');
    const finalData = await finalResponse.json();
    const room1Final = finalData.data?.find(r => r.id === 1);

    console.log('🏨 ห้อง 1 - ข้อมูลสุดท้าย:');
    console.log('   รูปภาพ:', JSON.stringify(room1Final.images, null, 2));

    const finalImagesList = parseRoomImages(room1Final.images);
    console.log('📸 รูปภาพที่แยกออกมา:', finalImagesList);
    console.log('📊 จำนวนรูปภาพสุดท้าย:', finalImagesList.length);

    // === สรุปผลการทดสอบ ===
    console.log('\n🎯 สรุปผลการทดสอบ:');
    console.log('  ├─ 📊 จำนวนรูปเริ่มต้น:', initialImagesList.length);
    console.log('  ├─ 📊 จำนวนรูปหลังอัปโหลด:', afterUploadImagesList.length);
    console.log('  ├─ 📊 จำนวนรูปสุดท้าย:', finalImagesList.length);
    console.log('  ├─ 📤 การอัปโหลด:', uploadResult.success ? '✅ สำเร็จ' : '❌ ล้มเหลว');
    console.log('  ├─ 🗑️ การลบ:', deleteResult.success ? '✅ สำเร็จ' : '❌ ล้มเหลว');
    
    const isWorkflowComplete = (
      uploadResult.success && 
      deleteResult.success && 
      finalImagesList.length === initialImagesList.length
    );
    
    console.log('  └─ 🏆 ระบบทำงานครบวงจร:', isWorkflowComplete ? '✅ สมบูรณ์' : '❌ มีปัญหา');

    if (isWorkflowComplete) {
      console.log('\n🎉 ระบบจัดการรูปภาพห้องทำงานสมบูรณ์แบบ!');
      console.log('✅ parseRoomImages function จัดการ nested arrays ได้ถูกต้อง');
      console.log('✅ API อัปโหลดรูปภาพทำงานปกติ');
      console.log('✅ API ลบรูปภาพทำงานปกติ');
      console.log('✅ ข้อมูลฐานข้อมูลอัปเดตถูกต้อง');
    } else {
      console.log('\n⚠️ พบปัญหาในระบบ กรุณาตรวจสอบอีกครั้ง');
    }

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการทดสอบ:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testCompleteImageWorkflow();