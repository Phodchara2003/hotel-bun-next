// Room Status Management API
import { Elysia, t } from 'elysia';
import postgres from 'postgres';
import { authMiddleware } from '../middleware/auth.js';
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require'
});

// Room status constants
export const ROOM_STATUS = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied', 
  MAINTENANCE: 'maintenance',
  CLEANING: 'cleaning',
  BLOCKED: 'blocked',
  OUT_OF_ORDER: 'out_of_order'
};

export const roomStatusRoutes = new Elysia({ prefix: '/room-status' })
  // .use(authMiddleware) // ปิดการใช้ auth ชั่วคราว
  
  // Get all rooms with status information
  .get('/', async ({ query }) => {
    try {
      const { floor, building, status, available_only } = query;
      
      let whereConditions = [];
      let params = [];
      let paramIndex = 1;
      
      if (floor) {
        whereConditions.push(`r.floor = $${paramIndex}`);
        params.push(parseInt(floor));
        paramIndex++;
      }
      
      if (building) {
        whereConditions.push(`r.building = $${paramIndex}`);
        params.push(building);
        paramIndex++;
      }
      
      if (status) {
        whereConditions.push(`r.status = $${paramIndex}`);
        params.push(status);
        paramIndex++;
      }
      
      if (available_only === 'true') {
        whereConditions.push(`r.status = 'available'`);
      }
      
      const whereClause = whereConditions.length > 0 ? 
        `WHERE ${whereConditions.join(' AND ')}` : '';
      
      const queryStr = `
        SELECT 
          r.*,
          rt.name as room_type_name,
          rt.price_per_night,
          CASE 
            WHEN b.id IS NOT NULL AND b.status = 'confirmed' 
            THEN jsonb_build_object(
              'booking_id', b.id,
              'guest_name', b.guest_name,
              'check_in', b.check_in_date,
              'check_out', b.check_out_date,
              'email', b.guest_email
            )
            ELSE NULL
          END as current_booking
        FROM rooms r
        LEFT JOIN room_types rt ON r.room_type_id = rt.id
        LEFT JOIN bookings b ON r.room_type_id = b.room_type_id 
          AND b.status = 'confirmed' 
          AND b.check_in_date <= CURRENT_DATE 
          AND b.check_out_date > CURRENT_DATE
        ${whereClause}
        ORDER BY r.building, r.floor, r.room_number
      `;
      
      const rooms = await sql.unsafe(queryStr, params);
      
      return {
        success: true,
        data: rooms,
        total: rooms.length
      };
    } catch (error) {
      console.error('Error fetching rooms:', error);
      return {
        success: false,
        error: 'Failed to fetch rooms',
        details: error.message
      };
    }
  })
  
  // Update room status
  .patch('/:roomId/status', async ({ params, body }) => {
    try {
      const { roomId } = params;
      const { status, notes } = body;
      
      // Validate status
      if (!Object.values(ROOM_STATUS).includes(status)) {
        return {
          success: false,
          error: 'Invalid room status'
        };
      }
      
      // Get current room status
      const currentRoom = await sql`
        SELECT status FROM rooms WHERE id = ${roomId}
      `;
      
      if (!currentRoom.length) {
        return {
          success: false,
          error: 'Room not found'
        };
      }
      
      const oldStatus = currentRoom[0].status;
      
      // Update room status
      await sql`
        UPDATE rooms 
        SET status = ${status}, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ${roomId}
      `;
      
      // Log status change in history (without user id for now)
      await sql`
        INSERT INTO room_status_history 
        (room_id, old_status, new_status, notes)
        VALUES (${roomId}, ${oldStatus}, ${status}, ${notes || null})
      `;
      
      // Create housekeeping task if needed
      if (status === ROOM_STATUS.CLEANING) {
        await sql`
          INSERT INTO housekeeping_tasks 
          (room_id, task_type, description, priority)
          VALUES (${roomId}, 'cleaning', 'Room cleaning required', 'high')
        `;
      } else if (status === ROOM_STATUS.MAINTENANCE) {
        await sql`
          INSERT INTO housekeeping_tasks 
          (room_id, task_type, description, priority)
          VALUES (${roomId}, 'maintenance', 'Room maintenance required', 'urgent')
        `;
      }
      
      return {
        success: true,
        message: 'Room status updated successfully',
        data: {
          roomId,
          oldStatus,
          newStatus: status
        }
      };
    } catch (error) {
      console.error('Error updating room status:', error);
      return {
        success: false,
        error: 'Failed to update room status'
      };
    }
  }, {
    body: t.Object({
      status: t.String(),
      notes: t.Optional(t.String())
    })
  })
  
  // Bulk update room status
  .post('/bulk-update', async ({ body }) => {
    try {
      const { roomIds, status, notes } = body;
      
      if (!Array.isArray(roomIds) || roomIds.length === 0) {
        return {
          success: false,
          error: 'Room IDs array is required'
        };
      }
      
      if (!Object.values(ROOM_STATUS).includes(status)) {
        return {
          success: false,
          error: 'Invalid room status'
        };
      }
      
      const results = [];
      
      for (const roomId of roomIds) {
        try {
          // Get current status
          const currentRoom = await sql`
            SELECT status FROM rooms WHERE id = ${roomId}
          `;
          
          if (currentRoom.length > 0) {
            const oldStatus = currentRoom[0].status;
            
            // Update room
            await sql`
              UPDATE rooms 
              SET status = ${status}, updated_at = CURRENT_TIMESTAMP 
              WHERE id = ${roomId}
            `;
            
            // Log history
            await sql`
              INSERT INTO room_status_history 
              (room_id, old_status, new_status, notes)
              VALUES (${roomId}, ${oldStatus}, ${status}, ${notes || null})
            `;
            
            results.push({
              roomId,
              success: true,
              oldStatus,
              newStatus: status
            });
          }
        } catch (error) {
          console.error(`Error updating room ${roomId}:`, error);
          results.push({
            roomId,
            success: false,
            error: error.message
          });
        }
      }
      
      return {
        success: true,
        message: 'Bulk update completed',
        results
      };
    } catch (error) {
      console.error('Error in bulk update:', error);
      return {
        success: false,
        error: 'Failed to perform bulk update'
      };
    }
  }, {
    body: t.Object({
      roomIds: t.Array(t.Number()),
      status: t.String(),
      notes: t.Optional(t.String())
    })
  })
  
  // Quick check-in
  .post('/:roomId/quick-checkin', async ({ params, body }) => {
    try {
      const { roomId } = params;
      const { guestName, checkOut, notes } = body;
      
      // Check if room is available
      const room = await sql`
        SELECT * FROM rooms WHERE id = ${roomId} AND status = 'available'
      `;
      
      if (!room.length) {
        return {
          success: false,
          error: 'Room is not available for check-in'
        };
      }
      
      // Update room status to occupied
      await sql`
        UPDATE rooms 
        SET status = 'occupied', 
            current_guest_id = 1,
            updated_at = CURRENT_TIMESTAMP 
        WHERE id = ${roomId}
      `;
      
      // Log status change
      await sql`
        INSERT INTO room_status_history 
        (room_id, old_status, new_status, notes)
        VALUES (${roomId}, 'available', 'occupied', ${notes || 'Quick check-in'})
      `;
      
      return {
        success: true,
        message: 'Quick check-in completed successfully',
        data: {
          roomId,
          guestName,
          checkIn: new Date().toISOString(),
          checkOut
        }
      };
    } catch (error) {
      console.error('Error in quick check-in:', error);
      return {
        success: false,
        error: 'Failed to perform quick check-in'
      };
    }
  }, {
    body: t.Object({
      guestName: t.String(),
      checkOut: t.String(),
      notes: t.Optional(t.String())
    })
  })
  
  // Quick check-out
  .post('/:roomId/quick-checkout', async ({ params, body }) => {
    try {
      const { roomId } = params;
      const { notes } = body;
      
      // Check if room is occupied
      const room = await sql`
        SELECT * FROM rooms WHERE id = ${roomId} AND status = 'occupied'
      `;
      
      if (!room.length) {
        return {
          success: false,
          error: 'Room is not occupied'
        };
      }
      
      // Update room status to cleaning (requires cleaning after checkout)
      await sql`
        UPDATE rooms 
        SET status = 'cleaning',
            current_guest_id = NULL,
            last_checkout = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP 
        WHERE id = ${roomId}
      `;
      
      // Log status change
      await sql`
        INSERT INTO room_status_history 
        (room_id, old_status, new_status, notes)
        VALUES (${roomId}, 'occupied', 'cleaning', ${notes || 'Quick check-out'})
      `;
      
      // Create cleaning task
      await sql`
        INSERT INTO housekeeping_tasks 
        (room_id, task_type, description, priority)
        VALUES (${roomId}, 'cleaning', 'Room cleaning after checkout', 'high')
      `;
      
      return {
        success: true,
        message: 'Quick check-out completed successfully',
        data: {
          roomId,
          checkOut: new Date().toISOString(),
          nextStatus: 'cleaning'
        }
      };
    } catch (error) {
      console.error('Error in quick check-out:', error);
      return {
        success: false,
        error: 'Failed to perform quick check-out'
      };
    }
  }, {
    body: t.Object({
      notes: t.Optional(t.String())
    })
  })
  
  // Get room statistics
  .get('/statistics', async () => {
    try {
      const stats = await sql`
        SELECT 
          status,
          COUNT(*) as count
        FROM rooms 
        GROUP BY status
        ORDER BY status
      `;
      
      const floorStats = await sql`
        SELECT 
          floor,
          COUNT(*) as total_rooms,
          COUNT(CASE WHEN status = 'available' THEN 1 END) as available,
          COUNT(CASE WHEN status = 'occupied' THEN 1 END) as occupied,
          COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance,
          COUNT(CASE WHEN status = 'cleaning' THEN 1 END) as cleaning
        FROM rooms 
        GROUP BY floor
        ORDER BY floor
      `;
      
      const total = await sql`SELECT COUNT(*) as count FROM rooms`;
      
      return {
        success: true,
        data: {
          total: total[0].count,
          byStatus: stats.reduce((acc, item) => {
            acc[item.status] = parseInt(item.count);
            return acc;
          }, {}),
          byFloor: floorStats
        }
      };
    } catch (error) {
      console.error('Error fetching statistics:', error);
      return {
        success: false,
        error: 'Failed to fetch statistics'
      };
    }
  });
