// เพิ่ม API endpoints สำหรับระบบห้องพักใหม่
// เพิ่มในไฟล์ mysql-server.cjs

// เพิ่มฟังก์ชันใหม่หลังจาก createBooking function

// API: GET /api/room-types - ดูประเภทห้องพักที่มี
async function getRoomTypesForBooking() {
  try {
    const [roomTypes] = await connection.execute(`
      SELECT 
        rt.id,
        rt.name,
        rt.description,
        rt.price_per_night,
        rt.max_guests,
        rt.bed_type,
        rt.amenities,
        rt.images,
        COUNT(r.id) as total_rooms,
        COUNT(CASE WHEN r.status = 'available' THEN 1 END) as available_rooms
      FROM room_types rt
      LEFT JOIN rooms r ON rt.id = r.room_type_id
      WHERE rt.bed_type IN ('single', 'double')
      GROUP BY rt.id
      ORDER BY rt.bed_type, rt.price_per_night
    `);
    
    return roomTypes;
  } catch (error) {
    console.error('Error fetching room types for booking:', error.message);
    return [];
  }
}

// API: POST /api/rooms/check-availability - ตรวจสอบห้องว่าง
async function checkRoomAvailabilityByBedType(bedType, checkInDate, checkOutDate) {
  try {
    console.log(`🔍 Checking ${bedType} bed room availability from ${checkInDate} to ${checkOutDate}`);
    
    const [availableRooms] = await connection.execute(`
      SELECT 
        r.id, 
        r.room_number, 
        r.floor, 
        r.bed_type, 
        rt.name as room_type_name, 
        rt.price_per_night,
        rt.description,
        rt.amenities
      FROM rooms r 
      JOIN room_types rt ON r.room_type_id = rt.id
      WHERE r.bed_type = ? 
      AND r.status = 'available'
      AND r.id NOT IN (
        SELECT DISTINCT COALESCE(b.room_id, 0)
        FROM bookings b 
        WHERE b.room_id IS NOT NULL
        AND b.status IN ('confirmed', 'checked_in')
        AND (
          (? >= b.check_in_date AND ? < b.check_out_date) OR
          (? > b.check_in_date AND ? <= b.check_out_date) OR
          (? <= b.check_in_date AND ? >= b.check_out_date)
        )
      )
      ORDER BY r.floor, r.room_number
    `, [bedType, checkInDate, checkInDate, checkOutDate, checkOutDate, checkInDate, checkOutDate]);

    const [totalRooms] = await connection.execute(`
      SELECT COUNT(*) as total
      FROM rooms r
      WHERE r.bed_type = ? AND r.status = 'available'
    `, [bedType]);

    return {
      bedType,
      checkInDate,
      checkOutDate,
      availableRooms: availableRooms,
      totalAvailable: availableRooms.length,
      totalRooms: totalRooms[0].total,
      pricePerNight: availableRooms.length > 0 ? availableRooms[0].price_per_night : 0
    };
  } catch (error) {
    console.error('Error checking room availability:', error.message);
    return {
      bedType,
      checkInDate,
      checkOutDate,
      availableRooms: [],
      totalAvailable: 0,
      totalRooms: 0,
      pricePerNight: 0
    };
  }
}

// เพิ่มใน switch statement ของ server handler:

/*
// GET /api/room-types - ดูประเภทห้องพักที่มี
if (method === 'GET' && pathname === '/api/room-types') {
  console.log('📋 GET /api/room-types - Fetching available room types');
  
  try {
    const roomTypes = await getRoomTypesForBooking();
    
    sendJSON(res, 200, {
      success: true,
      data: roomTypes,
      message: 'Room types fetched successfully'
    });
  } catch (error) {
    console.error('Error in /api/room-types:', error);
    sendJSON(res, 500, {
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลประเภทห้องพัก',
      error: error.message
    });
  }
  return;
}

// POST /api/rooms/check-availability - ตรวจสอบห้องว่าง
if (method === 'POST' && pathname === '/api/rooms/check-availability') {
  console.log('🔍 POST /api/rooms/check-availability - Checking room availability');
  
  try {
    const { bed_type, check_in_date, check_out_date } = await getRequestBody(req);
    
    if (!bed_type || !check_in_date || !check_out_date) {
      sendJSON(res, 400, {
        success: false,
        message: 'กรุณาระบุประเภทเตียง วันเช็คอิน และวันเช็คเอาต์',
        error: 'MISSING_REQUIRED_FIELDS'
      });
      return;
    }
    
    const availability = await checkRoomAvailabilityByBedType(bed_type, check_in_date, check_out_date);
    
    sendJSON(res, 200, {
      success: true,
      data: availability,
      message: availability.totalAvailable > 0 ? 
        `มีห้อง${bed_type === 'single' ? 'เตียงเดี่ยว' : 'เตียงคู่'}ว่าง ${availability.totalAvailable} ห้อง` : 
        `ไม่มีห้อง${bed_type === 'single' ? 'เตียงเดี่ยว' : 'เตียงคู่'}ว่างในช่วงเวลาดังกล่าว`
    });
  } catch (error) {
    console.error('Error in /api/rooms/check-availability:', error);
    sendJSON(res, 500, {
      success: false,
      message: 'เกิดข้อผิดพลาดในการตรวจสอบห้องว่าง',
      error: error.message
    });
  }
  return;
}
*/