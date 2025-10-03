const mysql = require('mysql2/promise');

async function createAndPopulateRooms() {
  try {
    // Create connection
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '12345678',
      database: 'hotel_booking'
    });

    console.log('🏨 Creating rooms database and populating data...');

    // ตรวจสอบว่ามีข้อมูลในตาราง rooms แล้วหรือไม่
    const [existingRooms] = await connection.execute('SELECT COUNT(*) as count FROM rooms');
    
    if (existingRooms[0].count > 0) {
      console.log(`📊 Found ${existingRooms[0].count} existing rooms in database`);
      
      // ถามผู้ใช้ว่าต้องการลบข้อมูลเดิมหรือไม่
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise((resolve) => {
        rl.question('❓ Do you want to delete existing rooms and recreate them? (y/n): ', resolve);
      });
      
      rl.close();
      
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        console.log('🗑️ Deleting existing rooms...');
        await connection.execute('DELETE FROM rooms');
        console.log('✅ Existing rooms deleted');
      } else {
        console.log('❌ Operation cancelled');
        await connection.end();
        return;
      }
    }

    // ดึง hotel_id ที่มีอยู่
    const [hotels] = await connection.execute(`SELECT id FROM hotels LIMIT 1`);
    const hotelId = hotels[0]?.id || 2;
    console.log(`🏨 Using hotel ID: ${hotelId}`);

    // ดึงข้อมูล room_types ที่มีอยู่
    const [roomTypes] = await connection.execute(`
      SELECT id, name, bed_type, price_per_night 
      FROM room_types 
      WHERE bed_type IN ('single', 'double') AND hotel_id = ?
      ORDER BY bed_type
    `, [hotelId]);

    if (roomTypes.length === 0) {
      console.log('❌ No room types found. Creating default room types...');
      
      // ดึง hotel_id ที่มีอยู่
      const [hotels] = await connection.execute(`SELECT id FROM hotels LIMIT 1`);
      const hotelId = hotels[0]?.id || 2;
      
      // สร้าง room types เริ่มต้น
      await connection.execute(`
        INSERT INTO room_types (hotel_id, name, description, price_per_night, max_guests, bed_type, type, created_at, updated_at)
        VALUES 
        (?, 'ห้องเตียงเดี่ยว', 'ห้องพักเตียงเดี่ยว สำหรับ 1 ท่าน', 800.00, 1, 'single', 'standard', NOW(), NOW()),
        (?, 'ห้องเตียงคู่', 'ห้องพักเตียงคู่ สำหรับ 2 ท่าน', 1200.00, 2, 'double', 'standard', NOW(), NOW())
      `, [hotelId, hotelId]);
      
      // ดึงข้อมูล room types ที่เพิ่งสร้าง
      const [newRoomTypes] = await connection.execute(`
        SELECT id, name, bed_type, price_per_night 
        FROM room_types 
        WHERE bed_type IN ('single', 'double') AND hotel_id = ?
        ORDER BY bed_type
      `, [hotelId]);
      roomTypes.push(...newRoomTypes);
    }

    const singleRoomType = roomTypes.find(rt => rt.bed_type === 'single');
    const doubleRoomType = roomTypes.find(rt => rt.bed_type === 'double');

    if (!singleRoomType || !doubleRoomType) {
      throw new Error('❌ Could not find both single and double room types');
    }

    console.log('📋 Room Types:');
    console.log(`   Single: ID ${singleRoomType.id} - ${singleRoomType.name} (฿${singleRoomType.price_per_night})`);
    console.log(`   Double: ID ${doubleRoomType.id} - ${doubleRoomType.name} (฿${doubleRoomType.price_per_night})`);

    // สร้างข้อมูลห้องพัก
    const rooms = [];

    // ชั้น 5: ห้อง 501-517 (17 ห้อง)
    // 501-506: เตียงเดี่ยว (6 ห้อง)
    // 507-517: เตียงคู่ (11 ห้อง)
    for (let i = 501; i <= 517; i++) {
      const issingletRoom = i <= 506;
      rooms.push({
        room_number: i.toString(),
        floor: 5,
        room_type_id: issingletRoom ? singleRoomType.id : doubleRoomType.id,
        bed_type: issingletRoom ? 'single' : 'double',
        status: 'available'
      });
    }

    // ชั้น 6: ห้อง 601-617 (17 ห้อง)
    // ทั้งหมดเป็นเตียงคู่
    for (let i = 601; i <= 617; i++) {
      rooms.push({
        room_number: i.toString(),
        floor: 6,
        room_type_id: doubleRoomType.id,
        bed_type: 'double',
        status: 'available'
      });
    }

    console.log(`🏗️ Creating ${rooms.length} rooms...`);

    // เพิ่มข้อมูลห้องพักทั้งหมด
    for (const room of rooms) {
      await connection.execute(`
        INSERT INTO rooms (hotel_id, room_number, floor, room_type_id, bed_type, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [hotelId, room.room_number, room.floor, room.room_type_id, room.bed_type, room.status]);
    }

    console.log('✅ All rooms created successfully!');

    // แสดงสรุปข้อมูล
    const [summary] = await connection.execute(`
      SELECT 
        r.floor,
        rt.bed_type,
        COUNT(*) as room_count,
        MIN(r.room_number) as first_room,
        MAX(r.room_number) as last_room
      FROM rooms r
      JOIN room_types rt ON r.room_type_id = rt.id
      GROUP BY r.floor, rt.bed_type
      ORDER BY r.floor, rt.bed_type
    `);

    console.log('\n📊 Room Summary:');
    console.table(summary.map(row => ({
      'ชั้น': row.floor,
      'ประเภทเตียง': row.bed_type === 'single' ? 'เตียงเดี่ยว' : 'เตียงคู่',
      'จำนวนห้อง': row.room_count,
      'ห้องแรก': row.first_room,
      'ห้องสุดท้าย': row.last_room
    })));

    // แสดงสถิติรวม
    const [totalStats] = await connection.execute(`
      SELECT 
        COUNT(*) as total_rooms,
        SUM(CASE WHEN rt.bed_type = 'single' THEN 1 ELSE 0 END) as single_rooms,
        SUM(CASE WHEN rt.bed_type = 'double' THEN 1 ELSE 0 END) as double_rooms
      FROM rooms r
      JOIN room_types rt ON r.room_type_id = rt.id
    `);

    console.log('\n🎯 Total Statistics:');
    console.log(`   Total Rooms: ${totalStats[0].total_rooms}`);
    console.log(`   Single Bed Rooms: ${totalStats[0].single_rooms}`);
    console.log(`   Double Bed Rooms: ${totalStats[0].double_rooms}`);

    // ตรวจสอบข้อมูลตัวอย่าง
    const [sampleRooms] = await connection.execute(`
      SELECT 
        r.id,
        r.room_number,
        r.floor,
        r.status,
        rt.name as room_type_name,
        rt.bed_type,
        rt.price_per_night
      FROM rooms r
      JOIN room_types rt ON r.room_type_id = rt.id
      ORDER BY r.room_number
      LIMIT 10
    `);

    console.log('\n🔍 Sample Rooms (First 10):');
    console.table(sampleRooms.map(room => ({
      'ID': room.id,
      'ห้อง': room.room_number,
      'ชั้น': room.floor,
      'สถานะ': room.status,
      'ประเภท': room.bed_type === 'single' ? 'เตียงเดี่ยว' : 'เตียงคู่',
      'ราคา/คืน': `฿${room.price_per_night}`
    })));

    // Close connection
    await connection.end();
    console.log('\n✅ Database setup completed successfully!');
    console.log('🚀 You can now use the room management system at http://localhost:3002/admin/rooms');

  } catch (error) {
    console.error('❌ Error creating rooms:', error);
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
const forceCreate = args.includes('--force') || args.includes('-f');

if (forceCreate) {
  console.log('🔄 Force mode enabled - will recreate rooms without asking');
}

// Run the script
createAndPopulateRooms().catch(console.error);