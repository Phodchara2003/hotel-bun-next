// แก้ไข bed_type ของห้อง Single Room
import { sql } from './src/db/database.js';

async function fixSingleRoomBedTypes() {
  try {
    console.log('🔧 แก้ไข bed_type ของห้อง Single Room...');
    
    // แก้ไข bed_type ของห้อง Single Room (Type ID: 8) เป็น "single"
    const result = await sql`
      UPDATE rooms 
      SET bed_type = 'single' 
      WHERE room_type_id = 8
    `;
    
    console.log(`✅ แก้ไข bed_type เสร็จสิ้น: ${result.count} ห้อง`);
    
    // ตรวจสอบผลลัพธ์สุดท้าย
    console.log('\n🔍 สรุปห้องทั้งหมดหลังแก้ไข:');
    
    const allRoomsFixed = await sql`
      SELECT 
        r.room_type_id,
        rt.name as room_type_name,
        r.bed_type,
        COUNT(*) as count
      FROM rooms r
      JOIN room_types rt ON r.room_type_id = rt.id
      GROUP BY r.room_type_id, rt.name, r.bed_type
      ORDER BY r.room_type_id
    `;
    
    allRoomsFixed.forEach(group => {
      console.log(`🏠 ${group.room_type_name} (Type ID: ${group.room_type_id})`);
      console.log(`   💤 bed_type: ${group.bed_type}`);
      console.log(`   📊 จำนวน: ${group.count} ห้อง`);
      console.log('');
    });
    
    console.log('✅ ภารกิจเสร็จสมบูรณ์!');
    console.log('🎯 ตอนนี้เมื่อผู้ใช้เลือก:');
    console.log('   - เตียงเดี่ยว → จะได้ห้อง bed_type = "single"');
    console.log('   - เตียงคู่ → จะได้ห้อง bed_type = "double"');
    console.log('');
    console.log('🚀 ลองทดสอบการจองใหม่ได้เลย!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

fixSingleRoomBedTypes();