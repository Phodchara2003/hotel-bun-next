// ตรวจสอบข้อมูลการจอง และห้องในฐานข้อมูล
import { sql } from './src/db/database.js';

async function checkBookingAndRoomData() {
  try {
    console.log('🔍 ตรวจสอบข้อมูลการจองและห้อง...');
    
    // ตรวจสอบการจอง HTL603323
    console.log('\n📋 ข้อมูลการจอง HTL603323:');
    const booking = await sql`
      SELECT b.*, rt.name as room_type_name, r.room_number, r.floor, r.bed_type
      FROM bookings b
      LEFT JOIN room_types rt ON b.room_type_id = rt.id  
      LEFT JOIN rooms r ON b.room_id = r.id
      WHERE b.booking_reference = 'HTL603323'
    `;
    
    if (booking.length > 0) {
      const bookingData = booking[0];
      console.log(`🆔 Booking ID: ${bookingData.id}`);
      console.log(`👤 User ID: ${bookingData.user_id}`);
      console.log(`🏨 Hotel ID: ${bookingData.hotel_id}`);
      console.log(`🏠 Room Type ID: ${bookingData.room_type_id}`);
      console.log(`🚪 Room ID: ${bookingData.room_id}`);
      console.log(`🔢 Room Number: ${bookingData.room_number}`);
      console.log(`🏢 Floor: ${bookingData.floor}`);
      console.log(`🛏️ Room Type Name: ${bookingData.room_type_name}`);
      console.log(`💤 Bed Type: ${bookingData.bed_type}`);
      console.log(`💰 Total Price: ${bookingData.total_price}`);
    } else {
      console.log('❌ ไม่พบการจอง HTL603323');
    }
    
    // ตรวจสอบห้อง 510
    console.log('\n🏠 ข้อมูลห้อง 510:');
    const room510 = await sql`
      SELECT r.*, rt.name as room_type_name
      FROM rooms r
      LEFT JOIN room_types rt ON r.room_type_id = rt.id
      WHERE r.room_number = '510'
    `;
    
    if (room510.length > 0) {
      const roomData = room510[0];
      console.log(`🆔 Room ID: ${roomData.id}`);
      console.log(`🔢 Room Number: ${roomData.room_number}`);
      console.log(`🏢 Floor: ${roomData.floor}`);
      console.log(`🏠 Room Type ID: ${roomData.room_type_id}`);
      console.log(`🛏️ Room Type Name: ${roomData.room_type_name}`);
      console.log(`💤 Bed Type: ${roomData.bed_type}`);
      console.log(`📊 Status: ${roomData.status}`);
    }
    
    // ตรวจสอบ room_types ทั้งหมด
    console.log('\n🏠 ประเภทห้องทั้งหมด:');
    const roomTypes = await sql`
      SELECT * FROM room_types ORDER BY id
    `;
    
    roomTypes.forEach(rt => {
      console.log(`🆔 ID: ${rt.id}, 📝 Name: ${rt.name}`);
    });
    
    // ตรวจสอบห้องเตียงคู่ที่ว่าง
    console.log('\n🛏️ ห้องเตียงคู่ที่ว่าง:');
    const doubleRooms = await sql`
      SELECT r.*, rt.name as room_type_name
      FROM rooms r
      JOIN room_types rt ON r.room_type_id = rt.id
      WHERE r.bed_type = 'double' AND r.status = 'available'
      ORDER BY r.room_number
    `;
    
    if (doubleRooms.length > 0) {
      console.log(`✅ พบห้องเตียงคู่ว่าง ${doubleRooms.length} ห้อง:`);
      doubleRooms.forEach(room => {
        console.log(`   🏠 ห้อง ${room.room_number} (ID: ${room.id}, Type ID: ${room.room_type_id})`);
      });
    } else {
      console.log('❌ ไม่พบห้องเตียงคู่ที่ว่าง');
    }
    
    console.log('\n🔍 สาเหตุที่เป็นไปได้:');
    console.log('1. Frontend ส่ง roomTypeId ผิด (ส่ง 8 แทน 10)');
    console.log('2. Backend เลือกห้องผิดประเภท'); 
    console.log('3. ข้อมูลห้อง 510 ผิดพลาด (ควรเป็นเตียงคู่)');
    console.log('4. Logic การมอบหมายห้องมีปัญหา');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

checkBookingAndRoomData();