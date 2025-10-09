// ตรวจสอบข้อมูลห้องทั้งหมดและประเภทเตียง
import { sql } from './src/db/database.js';

async function checkAllRoomsAndBedTypes() {
  try {
    console.log('🔍 ตรวจสอบข้อมูลห้องทั้งหมด...');
    
    // ตรวจสอบห้องทั้งหมด
    console.log('\n📋 ห้องทั้งหมดในระบบ:');
    const rooms = await sql`
      SELECT r.*, rt.name as room_type_name
      FROM rooms r
      LEFT JOIN room_types rt ON r.room_type_id = rt.id
      ORDER BY r.room_number
    `;
    
    console.log(`✅ พบห้องทั้งหมด ${rooms.length} ห้อง:`);
    
    const bedTypeCounts = {};
    rooms.forEach(room => {
      console.log(`🏠 ห้อง ${room.room_number} - Type ID: ${room.room_type_id} (${room.room_type_name}) - Bed: ${room.bed_type} - Status: ${room.status}`);
      
      if (!bedTypeCounts[room.bed_type]) {
        bedTypeCounts[room.bed_type] = 0;
      }
      bedTypeCounts[room.bed_type]++;
    });
    
    console.log('\n📊 สรุปประเภทเตียง:');
    Object.entries(bedTypeCounts).forEach(([bedType, count]) => {
      console.log(`💤 ${bedType}: ${count} ห้อง`);
    });
    
    // ตรวจสอบว่าผู้ใช้เลือกอะไร
    console.log('\n🎯 การวิเคราะห์ปัญหา:');
    console.log('👤 ผู้ใช้เลือก: ห้องเตียงคู่ (Double Room)');
    console.log('🏠 ผู้ใช้ได้: ห้อง 510 - Single Room (bed_type: queen)');
    console.log('');
    
    console.log('🔍 สาเหตุที่เป็นไปได้:');
    console.log('1. ✅ ไม่มีห้องเตียงคู่ที่ว่าง (bed_type = "double")');
    console.log('2. ❓ Frontend ส่ง roomTypeId ผิด');
    console.log('3. ❓ Backend เลือกห้องผิดประเภท');
    console.log('4. ❓ ข้อมูลห้องในฐานข้อมูลไม่ถูกต้อง');
    
    // แนะนำการแก้ไข
    console.log('\n💡 วิธีแก้ไข:');
    console.log('1. 🔧 เพิ่มห้องเตียงคู่ในฐานข้อมูล');
    console.log('2. 🔄 แก้ไข bed_type ของห้องที่มีอยู่');
    console.log('3. 🚨 แสดงข้อความแจ้งเตือนเมื่อไม่มีห้องประเภทที่เลือก');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

checkAllRoomsAndBedTypes();