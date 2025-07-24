// Room Status Management API
// File: room-status.js

import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, and, sql } from 'drizzle-orm';
import postgres from 'postgres';

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client);

// Room status constants
export const ROOM_STATUS = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied', 
  MAINTENANCE: 'maintenance',
  CLEANING: 'cleaning',
  BLOCKED: 'blocked',
  OUT_OF_ORDER: 'out_of_order'
};

// Room status API handlers
export const roomStatusHandlers = {
  
  // Get all rooms with status
  getAllRoomsWithStatus: async (req, res) => {
    try {
      const result = await client`
        SELECT 
          r.*,
          u.first_name as guest_first_name,
          u.last_name as guest_last_name,
          u.email as guest_email,
          b.id as booking_id,
          b.check_in_date,
          b.check_out_date,
          b.status as booking_status
        FROM rooms r
        LEFT JOIN users u ON r.current_guest_id = u.id
        LEFT JOIN bookings b ON r.current_guest_id = b.user_id 
          AND b.room_id = r.id 
          AND b.status = 'confirmed'
          AND b.check_in_date <= CURRENT_DATE 
          AND b.check_out_date > CURRENT_DATE
        ORDER BY r.floor, r.room_number
      `;

      res.json({
        success: true,
        rooms: result
      });
    } catch (error) {
      console.error('Error fetching rooms with status:', error);
      res.status(500).json({
        success: false,
        message: 'ไม่สามารถดึงข้อมูลห้องได้'
      });
    }
  },

  // Update room status
  updateRoomStatus: async (req, res) => {
    try {
      const { roomId } = req.params;
      const { status, reason, notes } = req.body;
      const userId = req.user.id;

      // Validate status
      if (!Object.values(ROOM_STATUS).includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'สถานะห้องไม่ถูกต้อง'
        });
      }

      // Get current room status
      const currentRoom = await client`
        SELECT status FROM rooms WHERE id = ${roomId}
      `;

      if (currentRoom.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบห้องดังกล่าว'
        });
      }

      const oldStatus = currentRoom[0].status;

      // Update room status
      await client`
        UPDATE rooms 
        SET 
          status = ${status},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${roomId}
      `;

      // Log status change
      await client`
        INSERT INTO room_status_history 
        (room_id, old_status, new_status, changed_by, reason, notes)
        VALUES (${roomId}, ${oldStatus}, ${status}, ${userId}, ${reason}, ${notes})
      `;

      // If setting to cleaning, create housekeeping task
      if (status === ROOM_STATUS.CLEANING) {
        await client`
          INSERT INTO housekeeping_tasks 
          (room_id, task_type, description, priority)
          VALUES (${roomId}, 'cleaning', 'ทำความสะอาดห้องหลังแขกเช็คเอาท์', 'normal')
        `;
      }

      // If setting to maintenance, create maintenance task
      if (status === ROOM_STATUS.MAINTENANCE) {
        await client`
          INSERT INTO housekeeping_tasks 
          (room_id, task_type, description, priority, notes)
          VALUES (${roomId}, 'maintenance', 'งานบำรุงรักษาห้องพัก', 'high', ${notes})
        `;
      }

      res.json({
        success: true,
        message: 'อัปเดตสถานะห้องสำเร็จ',
        oldStatus,
        newStatus: status
      });

    } catch (error) {
      console.error('Error updating room status:', error);
      res.status(500).json({
        success: false,
        message: 'ไม่สามารถอัปเดตสถานะห้องได้'
      });
    }
  },

  // Quick status change for multiple rooms
  bulkUpdateStatus: async (req, res) => {
    try {
      const { roomIds, status, reason } = req.body;
      const userId = req.user.id;

      if (!Array.isArray(roomIds) || roomIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'กรุณาเลือกห้องที่ต้องการอัปเดต'
        });
      }

      // Validate status
      if (!Object.values(ROOM_STATUS).includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'สถานะห้องไม่ถูกต้อง'
        });
      }

      // Get current statuses
      const currentRooms = await client`
        SELECT id, status FROM rooms WHERE id = ANY(${roomIds})
      `;

      // Update all rooms
      await client`
        UPDATE rooms 
        SET 
          status = ${status},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ANY(${roomIds})
      `;

      // Log status changes
      for (const room of currentRooms) {
        await client`
          INSERT INTO room_status_history 
          (room_id, old_status, new_status, changed_by, reason)
          VALUES (${room.id}, ${room.status}, ${status}, ${userId}, ${reason})
        `;
      }

      res.json({
        success: true,
        message: `อัปเดตสถานะห้อง ${roomIds.length} ห้องสำเร็จ`,
        updatedCount: roomIds.length
      });

    } catch (error) {
      console.error('Error bulk updating room status:', error);
      res.status(500).json({
        success: false,
        message: 'ไม่สามารถอัปเดตสถานะห้องได้'
      });
    }
  },

  // Get room status history
  getRoomStatusHistory: async (req, res) => {
    try {
      const { roomId } = req.params;
      const { limit = 20 } = req.query;

      const history = await client`
        SELECT 
          rsh.*,
          u.first_name,
          u.last_name,
          r.room_number
        FROM room_status_history rsh
        JOIN users u ON rsh.changed_by = u.id
        JOIN rooms r ON rsh.room_id = r.id
        WHERE rsh.room_id = ${roomId}
        ORDER BY rsh.created_at DESC
        LIMIT ${limit}
      `;

      res.json({
        success: true,
        history
      });

    } catch (error) {
      console.error('Error fetching room status history:', error);
      res.status(500).json({
        success: false,
        message: 'ไม่สามารถดึงประวัติสถานะห้องได้'
      });
    }
  },

  // Get room statistics
  getRoomStatistics: async (req, res) => {
    try {
      const stats = await client`
        SELECT 
          COUNT(*) as total_rooms,
          COUNT(CASE WHEN status = 'available' THEN 1 END) as available_rooms,
          COUNT(CASE WHEN status = 'occupied' THEN 1 END) as occupied_rooms,
          COUNT(CASE WHEN status = 'cleaning' THEN 1 END) as cleaning_rooms,
          COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance_rooms,
          COUNT(CASE WHEN status = 'blocked' THEN 1 END) as blocked_rooms,
          COUNT(CASE WHEN status = 'out_of_order' THEN 1 END) as out_of_order_rooms,
          ROUND(
            (COUNT(CASE WHEN status = 'occupied' THEN 1 END)::decimal / 
             COUNT(CASE WHEN status IN ('available', 'occupied') THEN 1 END)) * 100, 2
          ) as occupancy_rate
        FROM rooms
      `;

      // Get housekeeping tasks pending
      const housekeeping = await client`
        SELECT 
          COUNT(*) as pending_tasks,
          COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent_tasks
        FROM housekeeping_tasks 
        WHERE status = 'pending'
      `;

      res.json({
        success: true,
        statistics: {
          ...stats[0],
          housekeeping: housekeeping[0]
        }
      });

    } catch (error) {
      console.error('Error fetching room statistics:', error);
      res.status(500).json({
        success: false,
        message: 'ไม่สามารถดึงสถิติห้องได้'
      });
    }
  },

  // Quick check-in
  quickCheckIn: async (req, res) => {
    try {
      const { roomId, guestId, bookingId } = req.body;

      // Update room status to occupied
      await client`
        UPDATE rooms 
        SET 
          status = 'occupied',
          current_guest_id = ${guestId},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${roomId}
      `;

      // Update booking status if provided
      if (bookingId) {
        await client`
          UPDATE bookings 
          SET 
            status = 'checked_in',
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${bookingId}
        `;
      }

      // Log status change
      await client`
        INSERT INTO room_status_history 
        (room_id, old_status, new_status, changed_by, reason)
        VALUES (${roomId}, 'available', 'occupied', ${req.user.id}, 'Check-in')
      `;

      res.json({
        success: true,
        message: 'เช็คอินสำเร็จ'
      });

    } catch (error) {
      console.error('Error during quick check-in:', error);
      res.status(500).json({
        success: false,
        message: 'ไม่สามารถเช็คอินได้'
      });
    }
  },

  // Quick check-out
  quickCheckOut: async (req, res) => {
    try {
      const { roomId, bookingId } = req.body;

      // Update room status to cleaning
      await client`
        UPDATE rooms 
        SET 
          status = 'cleaning',
          current_guest_id = NULL,
          last_checkout = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${roomId}
      `;

      // Update booking status if provided
      if (bookingId) {
        await client`
          UPDATE bookings 
          SET 
            status = 'checked_out',
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${bookingId}
        `;
      }

      // Create cleaning task
      await client`
        INSERT INTO housekeeping_tasks 
        (room_id, task_type, description, priority)
        VALUES (${roomId}, 'cleaning', 'ทำความสะอาดห้องหลังแขกเช็คเอาท์', 'normal')
      `;

      // Log status change
      await client`
        INSERT INTO room_status_history 
        (room_id, old_status, new_status, changed_by, reason)
        VALUES (${roomId}, 'occupied', 'cleaning', ${req.user.id}, 'Check-out')
      `;

      res.json({
        success: true,
        message: 'เช็คเอาท์สำเร็จ'
      });

    } catch (error) {
      console.error('Error during quick check-out:', error);
      res.status(500).json({
        success: false,
        message: 'ไม่สามารถเช็คเอาท์ได้'
      });
    }
  }
};
