// เพิ่ม API endpoints สำหรับจัดการห้องพักแต่ละห้อง
// เพิ่มใน mysql-server.cjs

// GET /api/admin/individual-rooms - ดูรายการห้องพักทั้งหมด
async function getIndividualRooms() {
  try {
    const [rooms] = await connection.execute(`
      SELECT 
        r.id,
        r.room_number,
        r.floor,
        r.bed_type,
        r.status,
        r.current_booking_id,
        rt.name as room_type_name,
        rt.price_per_night,
        rt.description as room_type_description,
        rt.amenities,
        b.guest_name,
        b.check_in_date,
        b.check_out_date,
        b.status as booking_status
      FROM rooms r
      LEFT JOIN room_types rt ON r.room_type_id = rt.id
      LEFT JOIN bookings b ON r.current_booking_id = b.id
      ORDER BY r.floor, r.room_number
    `);
    
    return rooms;
  } catch (error) {
    console.error('Error fetching individual rooms:', error.message);
    return [];
  }
}

// PUT /api/admin/individual-rooms/:id/status - อัปเดตสถานะห้อง
async function updateRoomStatus(roomId, status, adminNote = null) {
  try {
    console.log(`🔧 Updating room ${roomId} status to: ${status}`);
    
    const [result] = await connection.execute(`
      UPDATE rooms 
      SET status = ?, 
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [status, roomId]);
    
    if (result.affectedRows > 0) {
      // บันทึก log การเปลี่ยนแปลง
      await connection.execute(`
        INSERT INTO room_status_logs (room_id, old_status, new_status, admin_note, created_at)
        SELECT r.id, 'previous', ?, ?, NOW()
        FROM rooms r 
        WHERE r.id = ?
      `, [status, adminNote, roomId]);
      
      // ถ้าห้องถูกปิด (maintenance) และมีการจองอยู่ ให้แจ้งเตือน
      if (status === 'maintenance') {
        const [activeBookings] = await connection.execute(`
          SELECT b.id, b.guest_name, b.guest_phone, b.check_in_date, b.check_out_date
          FROM bookings b
          WHERE b.room_id = ? AND b.status IN ('confirmed', 'checked_in')
        `, [roomId]);
        
        if (activeBookings.length > 0) {
          console.log(`⚠️ Room ${roomId} has active bookings:`, activeBookings);
          return {
            success: true,
            message: 'อัปเดตสถานะห้องสำเร็จ แต่ห้องนี้มีการจองอยู่',
            activeBookings: activeBookings
          };
        }
      }
      
      return {
        success: true,
        message: 'อัปเดตสถานะห้องสำเร็จ'
      };
    } else {
      return {
        success: false,
        message: 'ไม่พบห้องที่ต้องการอัปเดต'
      };
    }
  } catch (error) {
    console.error('Error updating room status:', error.message);
    return {
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะห้อง'
    };
  }
}

// PUT /api/admin/individual-rooms/:id/maintenance - เปลี่ยนเป็นโหมดซ่อมบำรุง
async function setRoomMaintenance(roomId, maintenanceNote, estimatedDuration) {
  try {
    const result = await connection.execute(`
      UPDATE rooms 
      SET status = 'maintenance',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [roomId]);
    
    // บันทึกข้อมูลการซ่อมบำรุง
    await connection.execute(`
      INSERT INTO room_maintenance_logs (
        room_id, maintenance_note, estimated_duration, 
        started_at, created_at
      ) VALUES (?, ?, ?, NOW(), NOW())
    `, [roomId, maintenanceNote, estimatedDuration]);
    
    return {
      success: true,
      message: 'เปลี่ยนห้องเป็นโหมดซ่อมบำรุงสำเร็จ'
    };
  } catch (error) {
    console.error('Error setting room maintenance:', error.message);
    return {
      success: false,
      message: 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะห้อง'
    };
  }
}

// GET /api/admin/room-stats - สถิติห้องพัก
async function getRoomStats() {
  try {
    const [stats] = await connection.execute(`
      SELECT 
        COUNT(*) as total_rooms,
        COUNT(CASE WHEN status = 'available' THEN 1 END) as available_rooms,
        COUNT(CASE WHEN status = 'occupied' THEN 1 END) as occupied_rooms,
        COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance_rooms,
        COUNT(CASE WHEN status = 'reserved' THEN 1 END) as reserved_rooms,
        COUNT(CASE WHEN bed_type = 'single' THEN 1 END) as single_bed_rooms,
        COUNT(CASE WHEN bed_type = 'double' THEN 1 END) as double_bed_rooms
      FROM rooms
    `);
    
    const [floorStats] = await connection.execute(`
      SELECT 
        floor,
        COUNT(*) as total_rooms,
        COUNT(CASE WHEN status = 'available' THEN 1 END) as available_rooms,
        COUNT(CASE WHEN status = 'occupied' THEN 1 END) as occupied_rooms,
        COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance_rooms
      FROM rooms
      GROUP BY floor
      ORDER BY floor
    `);
    
    return {
      overview: stats[0],
      byFloor: floorStats
    };
  } catch (error) {
    console.error('Error fetching room stats:', error.message);
    return {
      overview: {},
      byFloor: []
    };
  }
}

/*
เพิ่ม API endpoints เหล่านี้ใน switch statement ของ server:

// GET /api/admin/individual-rooms
if (method === 'GET' && pathname === '/api/admin/individual-rooms') {
  console.log('📋 GET /api/admin/individual-rooms - Fetching individual rooms');
  
  try {
    const rooms = await getIndividualRooms();
    
    sendJSON(res, 200, {
      success: true,
      data: rooms,
      message: 'Individual rooms fetched successfully'
    });
  } catch (error) {
    console.error('Error in /api/admin/individual-rooms:', error);
    sendJSON(res, 500, {
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลห้องพัก',
      error: error.message
    });
  }
  return;
}

// PUT /api/admin/individual-rooms/:id/status
if (method === 'PUT' && pathname.match(/^\/api\/admin\/individual-rooms\/(\d+)\/status$/)) {
  const roomId = pathname.match(/^\/api\/admin\/individual-rooms\/(\d+)\/status$/)[1];
  console.log(`🔧 PUT /api/admin/individual-rooms/${roomId}/status - Updating room status`);
  
  try {
    const { status, adminNote } = await getRequestBody(req);
    
    if (!status) {
      sendJSON(res, 400, {
        success: false,
        message: 'กรุณาระบุสถานะห้อง',
        error: 'MISSING_STATUS'
      });
      return;
    }
    
    const validStatuses = ['available', 'occupied', 'maintenance', 'reserved'];
    if (!validStatuses.includes(status)) {
      sendJSON(res, 400, {
        success: false,
        message: 'สถานะห้องไม่ถูกต้อง',
        error: 'INVALID_STATUS'
      });
      return;
    }
    
    const result = await updateRoomStatus(roomId, status, adminNote);
    
    sendJSON(res, result.success ? 200 : 400, result);
  } catch (error) {
    console.error(`Error in /api/admin/individual-rooms/${roomId}/status:`, error);
    sendJSON(res, 500, {
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะห้อง',
      error: error.message
    });
  }
  return;
}

// GET /api/admin/room-stats
if (method === 'GET' && pathname === '/api/admin/room-stats') {
  console.log('📊 GET /api/admin/room-stats - Fetching room statistics');
  
  try {
    const stats = await getRoomStats();
    
    sendJSON(res, 200, {
      success: true,
      data: stats,
      message: 'Room statistics fetched successfully'
    });
  } catch (error) {
    console.error('Error in /api/admin/room-stats:', error);
    sendJSON(res, 500, {
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงสถิติห้องพัก',
      error: error.message
    });
  }
  return;
}
*/