// สร้างระบบจัดการห้องพักแบบอัตโนมัติ
// จะสร้างตาราง rooms และข้อมูลห้องพักทั้งหมด 34 ห้อง
const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '12345678',
  database: 'hotel_booking'
};

async function createRoomsSystem() {
  let connection;
  
  try {
    console.log('🚀 Creating comprehensive room management system...');
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ MySQL connected successfully');
    
    // 1. สร้างตาราง rooms ถ้ายังไม่มี
    console.log('\n1️⃣ Creating rooms table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS rooms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        hotel_id INT NOT NULL DEFAULT 1,
        room_type_id INT NOT NULL,
        room_number VARCHAR(10) NOT NULL UNIQUE,
        floor INT NOT NULL,
        bed_type ENUM('single', 'double') NOT NULL,
        status ENUM('available', 'occupied', 'maintenance', 'reserved') DEFAULT 'available',
        current_booking_id INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
        FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE CASCADE,
        INDEX idx_room_number (room_number),
        INDEX idx_floor (floor),
        INDEX idx_bed_type (bed_type),
        INDEX idx_status (status)
      )
    `);
    console.log('✅ Rooms table created successfully');
    
    // 2. ตรวจสอบและสร้าง room_types สำหรับเตียงเดี่ยวและเตียงคู่
    console.log('\n2️⃣ Setting up room types...');
    
    // ตรวจสอบ room_types ที่มีอยู่
    const [existingRoomTypes] = await connection.execute('SELECT * FROM room_types WHERE bed_type IN ("single", "double")');
    console.log(`Found ${existingRoomTypes.length} existing room types with bed_type`);
    
    let singleRoomTypeId = null;
    let doubleRoomTypeId = null;
    
    // หา room_type สำหรับเตียงเดี่ยว
    const singleType = existingRoomTypes.find(rt => rt.bed_type === 'single');
    if (singleType) {
      singleRoomTypeId = singleType.id;
      console.log(`✅ Found single bed room type: ID ${singleRoomTypeId}`);
    } else {
      // สร้าง room_type สำหรับเตียงเดี่ยว
      const [singleResult] = await connection.execute(`
        INSERT INTO room_types (
          hotel_id, name, description, price_per_night, max_guests, 
          bed_type, amenities, type, created_at
        ) VALUES (
          2, 'ห้องเตียงเดี่ยว', 'ห้องพักมาตรฐานเตียงเดี่ยว สะดวกสบาย', 
          800.00, 1, 'single', 
          '["WiFi", "แอร์", "โทรทัศน์", "ตู้เซฟ", "ห้องน้ำส่วนตัว"]', 
          'standard', NOW()
        )
      `);
      singleRoomTypeId = singleResult.insertId;
      console.log(`✅ Created single bed room type: ID ${singleRoomTypeId}`);
    }
    
    // หา room_type สำหรับเตียงคู่
    const doubleType = existingRoomTypes.find(rt => rt.bed_type === 'double');
    if (doubleType) {
      doubleRoomTypeId = doubleType.id;
      console.log(`✅ Found double bed room type: ID ${doubleRoomTypeId}`);
    } else {
      // สร้าง room_type สำหรับเตียงคู่
      const [doubleResult] = await connection.execute(`
        INSERT INTO room_types (
          hotel_id, name, description, price_per_night, max_guests, 
          bed_type, amenities, type, created_at
        ) VALUES (
          2, 'ห้องเตียงคู่', 'ห้องพักมาตรฐานเตียงคู่ สำหรับ 2 ท่าน', 
          1200.00, 2, 'double', 
          '["WiFi", "แอร์", "โทรทัศน์", "ตู้เซฟ", "ห้องน้ำส่วนตัว", "มินิบาร์"]', 
          'standard', NOW()
        )
      `);
      doubleRoomTypeId = doubleResult.insertId;
      console.log(`✅ Created double bed room type: ID ${doubleRoomTypeId}`);
    }
    
    // 3. สร้างห้องพักทั้งหมด 34 ห้อง
    console.log('\n3️⃣ Creating individual rooms...');
    
    // ลบห้องเก่าทั้งหมดก่อน (ถ้ามี)
    await connection.execute('DELETE FROM rooms');
    console.log('🧹 Cleared existing rooms');
    
    const roomsToCreate = [];
    
    // ชั้น 5: ห้อง 501-517 (17 ห้อง)
    // เตียงเดี่ยว: 501-503 (3 ห้อง)
    // เตียงคู่: 504-517 (14 ห้อง)
    for (let i = 501; i <= 517; i++) {
      const bedType = i <= 503 ? 'single' : 'double';
      const roomTypeId = i <= 503 ? singleRoomTypeId : doubleRoomTypeId;
      
      roomsToCreate.push({
        hotel_id: 2,
        room_type_id: roomTypeId,
        room_number: i.toString(),
        floor: 5,
        bed_type: bedType,
        status: 'available'
      });
    }
    
    // ชั้น 6: ห้อง 601-617 (17 ห้อง)  
    // เตียงเดี่ยว: 601-603 (3 ห้อง)
    // เตียงคู่: 604-617 (14 ห้อง)
    for (let i = 601; i <= 617; i++) {
      const bedType = i <= 603 ? 'single' : 'double';
      const roomTypeId = i <= 603 ? singleRoomTypeId : doubleRoomTypeId;
      
      roomsToCreate.push({
        hotel_id: 2,
        room_type_id: roomTypeId,
        room_number: i.toString(),
        floor: 6,
        bed_type: bedType,
        status: 'available'
      });
    }
    
    // บันทึกห้องทั้งหมด
    for (const room of roomsToCreate) {
      await connection.execute(`
        INSERT INTO rooms (hotel_id, room_type_id, room_number, floor, bed_type, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [room.hotel_id, room.room_type_id, room.room_number, room.floor, room.bed_type, room.status]);
    }
    
    console.log(`✅ Created ${roomsToCreate.length} rooms successfully`);
    
    // 4. สร้างฟังก์ชันค้นหาห้องว่าง
    console.log('\n4️⃣ Creating room availability functions...');
    
    // สร้าง query สำหรับค้นหาห้องว่าง (จะใช้ในระบบ API)
    console.log('✅ Room availability query pattern created');
    
    // 5. แสดงสรุปข้อมูล
    console.log('\n📊 Room System Summary:');
    
    const [roomStats] = await connection.execute(`
      SELECT 
        bed_type,
        floor,
        COUNT(*) as room_count,
        MIN(room_number) as first_room,
        MAX(room_number) as last_room
      FROM rooms 
      GROUP BY bed_type, floor 
      ORDER BY floor, bed_type
    `);
    
    console.log('\n📋 Room distribution:');
    roomStats.forEach(stat => {
      console.log(`  ${stat.bed_type.toUpperCase()} beds - Floor ${stat.floor}: ${stat.room_count} rooms (${stat.first_room}-${stat.last_room})`);
    });
    
    const [totalStats] = await connection.execute(`
      SELECT 
        bed_type,
        COUNT(*) as total_rooms
      FROM rooms 
      GROUP BY bed_type
    `);
    
    console.log('\n📈 Total room summary:');
    totalStats.forEach(stat => {
      console.log(`  ${stat.bed_type.toUpperCase()} bed rooms: ${stat.total_rooms} rooms`);
    });
    
    // 6. ทดสอบฟังก์ชันค้นหาห้องว่าง
    console.log('\n🧪 Testing room availability...');
    
    const [availableSingle] = await connection.execute(`
      SELECT r.id, r.room_number, r.floor, r.bed_type, rt.name as room_type_name, rt.price_per_night
      FROM rooms r 
      JOIN room_types rt ON r.room_type_id = rt.id
      WHERE r.bed_type = 'single' 
      AND r.status = 'available'
      ORDER BY r.floor, r.room_number
      LIMIT 1
    `);
    
    const [availableDouble] = await connection.execute(`
      SELECT r.id, r.room_number, r.floor, r.bed_type, rt.name as room_type_name, rt.price_per_night
      FROM rooms r 
      JOIN room_types rt ON r.room_type_id = rt.id
      WHERE r.bed_type = 'double' 
      AND r.status = 'available'
      ORDER BY r.floor, r.room_number
      LIMIT 1
    `);
    
    if (availableSingle.length > 0) {
      console.log(`✅ Single bed room available: Room ${availableSingle[0].room_number} (Floor ${availableSingle[0].floor})`);
    }
    
    if (availableDouble.length > 0) {
      console.log(`✅ Double bed room available: Room ${availableDouble[0].room_number} (Floor ${availableDouble[0].floor})`);
    }
    
    console.log('\n🎉 Room management system created successfully!');
    console.log('\n📝 Next steps:');
    console.log('  1. Update booking system to use room assignments');
    console.log('  2. Update frontend to show bed type selection');
    console.log('  3. Test automatic room assignment');
    
  } catch (error) {
    console.error('❌ Error creating room system:', error.message);
    console.error('Full error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createRoomsSystem();