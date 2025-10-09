// ตรวจสอบการจอง HTL458167 และ API ที่ส่งประเภทเตียง
import { sql } from './src/db/database.js';

async function checkBooking107AndAPI() {
  try {
    console.log('🔍 ตรวจสอบการจอง HTL458167 (ID: 107)...');
    
    // ตรวจสอบการจองในฐานข้อมูล
    const booking = await sql`
      SELECT b.*, rt.name as room_type_name, r.room_number, r.floor, r.bed_type as room_bed_type
      FROM bookings b
      LEFT JOIN room_types rt ON b.room_type_id = rt.id  
      LEFT JOIN rooms r ON b.room_id = r.id
      WHERE b.id = 107
    `;
    
    if (booking.length > 0) {
      const bookingData = booking[0];
      console.log('\n📋 ข้อมูลการจองในฐานข้อมูล:');
      console.log(`🆔 Booking ID: ${bookingData.id}`);
      console.log(`📝 Booking Reference: ${bookingData.booking_reference}`);
      console.log(`👤 User ID: ${bookingData.user_id}`);
      console.log(`🏨 Hotel ID: ${bookingData.hotel_id}`);
      console.log(`🏠 Room Type ID: ${bookingData.room_type_id}`);
      console.log(`🚪 Room ID: ${bookingData.room_id}`);
      console.log(`🔢 Room Number: ${bookingData.room_number}`);
      console.log(`🏢 Floor: ${bookingData.floor}`);
      console.log(`🛏️ Room Type Name: ${bookingData.room_type_name}`);
      console.log(`💤 Room Bed Type: ${bookingData.room_bed_type}`);
      console.log(`💰 Total Price: ${bookingData.total_price}`);
      console.log(`📊 Status: ${bookingData.status}`);
    } else {
      console.log('❌ ไม่พบการจอง ID 107');
    }
    
    // ตรวจสอบห้อง 511
    console.log('\n🏠 ตรวจสอบห้อง 511:');
    const room511 = await sql`
      SELECT r.*, rt.name as room_type_name
      FROM rooms r
      LEFT JOIN room_types rt ON r.room_type_id = rt.id
      WHERE r.room_number = '511'
    `;
    
    if (room511.length > 0) {
      const roomData = room511[0];
      console.log(`🆔 Room ID: ${roomData.id}`);
      console.log(`🏠 Room Type ID: ${roomData.room_type_id}`);
      console.log(`🛏️ Room Type Name: ${roomData.room_type_name}`);
      console.log(`💤 Bed Type: ${roomData.bed_type}`);
      console.log(`📊 Status: ${roomData.status}`);
    }
    
    // ตรวจสอบห้องเตียงคู่ที่ว่าง
    console.log('\n🔍 ตรวจสอบห้องเตียงคู่ที่ว่าง:');
    const doubleRooms = await sql`
      SELECT r.room_number, r.id, r.bed_type, r.status, rt.name as room_type_name
      FROM rooms r
      JOIN room_types rt ON r.room_type_id = rt.id
      WHERE r.bed_type = 'double' AND r.status = 'available'
      ORDER BY r.room_number
      LIMIT 5
    `;
    
    if (doubleRooms.length > 0) {
      console.log(`✅ พบห้องเตียงคู่ว่าง ${doubleRooms.length} ห้อง:`);
      doubleRooms.forEach(room => {
        console.log(`   🏠 ห้อง ${room.room_number} (ID: ${room.id}) - ${room.room_type_name} - bed_type: ${room.bed_type}`);
      });
    } else {
      console.log('❌ ไม่พบห้องเตียงคู่ที่ว่าง');
    }
    
    // ตรวจสอบ Backend logic
    console.log('\n🔍 ตรวจสอบ Backend logic:');
    console.log('👤 User เลือก: roomTypeId = 10 (Double Room)');
    console.log('📤 Frontend ส่ง: bed_type = "double"');
    console.log('🏠 Backend ควรหา: room_type_id = 10 AND bed_type = "double"');
    console.log('🎯 ปัญหา: Backend เลือกห้อง 511 แทน');
    
    // ตรวจสอบ room_type_id 10
    console.log('\n🔍 ตรวจสอบห้อง roomTypeId = 10:');
    const type10Rooms = await sql`
      SELECT r.room_number, r.id, r.bed_type, r.status
      FROM rooms r
      WHERE r.room_type_id = 10 AND r.status = 'available'
      ORDER BY r.room_number
      LIMIT 5
    `;
    
    console.log(`📊 ห้อง room_type_id = 10 ที่ว่าง ${type10Rooms.length} ห้อง:`);
    type10Rooms.forEach(room => {
      console.log(`   🏠 ห้อง ${room.room_number} (ID: ${room.id}) - bed_type: ${room.bed_type} - status: ${room.status}`);
    });
    
    console.log('\n💡 สาเหตุที่เป็นไปได้:');
    console.log('1. Backend ใช้ logic ผิด (ไม่ใช้ roomTypeId)');
    console.log('2. Backend ค้นหาห้องผิดเงื่อนไข');
    console.log('3. มี race condition ในการเลือกห้อง');
    console.log('4. Logic การมอบหมายห้องมีปัญหา');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

checkBooking107AndAPI();