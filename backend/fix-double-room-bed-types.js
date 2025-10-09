// แก้ไข bed_type ของห้อง Double Room
import { sql } from './src/db/database.js';

async function fixDoubleRoomBedTypes() {
  try {
    console.log('🔧 แก้ไข bed_type ของห้อง Double Room...');
    
    // แก้ไข bed_type ของห้อง Double Room (Type ID: 10) เป็น "double"
    const result = await sql`
      UPDATE rooms 
      SET bed_type = 'double' 
      WHERE room_type_id = 10
    `;
    
    console.log(`✅ แก้ไข bed_type เสร็จสิ้น: ${result.count} ห้อง`);
    
    // ตรวจสอบผลลัพธ์
    console.log('\n🔍 ตรวจสอบหลังแก้ไข:');
    
    const doubleRooms = await sql`
      SELECT r.room_number, r.room_type_id, r.bed_type, rt.name as room_type_name
      FROM rooms r
      JOIN room_types rt ON r.room_type_id = rt.id
      WHERE r.room_type_id = 10
      ORDER BY r.room_number
      LIMIT 10
    `;
    
    console.log('🏠 ห้อง Double Room หลังแก้ไข:');
    doubleRooms.forEach(room => {
      console.log(`   ห้อง ${room.room_number} - ${room.room_type_name} - bed_type: ${room.bed_type}`);
    });
    
    const singleRooms = await sql`
      SELECT r.room_number, r.room_type_id, r.bed_type, rt.name as room_type_name
      FROM rooms r
      JOIN room_types rt ON r.room_type_id = rt.id
      WHERE r.room_type_id = 8
      ORDER BY r.room_number
      LIMIT 5
    `;
    
    console.log('\n🏠 ห้อง Single Room (ควรยังเป็น queen):');
    singleRooms.forEach(room => {
      console.log(`   ห้อง ${room.room_number} - ${room.room_type_name} - bed_type: ${room.bed_type}`);
    });
    
    console.log('\n✅ ตอนนี้:');
    console.log('🔸 ห้อง Single Room (Type ID: 8) มี bed_type = "queen"');
    console.log('🔸 ห้อง Double Room (Type ID: 10) มี bed_type = "double"');
    console.log('');
    console.log('🎯 Backend จะสามารถหาห้องเตียงคู่ได้แล้ว!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

fixDoubleRoomBedTypes();