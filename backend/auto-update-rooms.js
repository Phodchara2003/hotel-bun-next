import { Elysia } from 'elysia'
import mysql from 'mysql2/promise'
import { cors } from '@elysiajs/cors'

// Database connection
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hotel_booking'
}

const app = new Elysia()
  .use(cors({
    origin: ['http://localhost:3680'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }))
  .post('/api/bookings/auto-update-expired', async ({ body }) => {
    let connection;
    try {
      connection = await mysql.createConnection(dbConfig);
      console.log('🔄 Starting auto-update of expired bookings...');
      
      const today = new Date().toISOString().split('T')[0];
      console.log('📅 Today:', today);
      
      // Find bookings that are past check-out date and should be marked as completed
      const [expiredBookings] = await connection.execute(`
        SELECT b.id, b.room_id, b.check_out_date, b.status, r.room_number, r.status as room_status
        FROM bookings b
        LEFT JOIN rooms r ON b.room_id = r.id
        WHERE b.check_out_date < ? 
        AND b.status IN ('confirmed', 'checkedin')
        AND r.status != 'available'
      `, [today]);
      
      console.log('🔍 Found expired bookings:', expiredBookings.length);
      
      if (expiredBookings.length === 0) {
        return {
          success: true,
          message: 'No expired bookings found',
          updatedCount: 0
        };
      }
      
      let updatedCount = 0;
      
      // Update each expired booking and its room status
      for (const booking of expiredBookings) {
        console.log(`🏠 Processing booking ${booking.id} - Room ${booking.room_number}`);
        
        // Update booking status to completed
        await connection.execute(`
          UPDATE bookings 
          SET status = 'completed', updated_at = NOW()
          WHERE id = ?
        `, [booking.id]);
        
        // Update room status to available
        await connection.execute(`
          UPDATE rooms 
          SET status = 'available', updated_at = NOW()
          WHERE id = ?
        `, [booking.room_id]);
        
        updatedCount++;
        console.log(`✅ Updated booking ${booking.id} and room ${booking.room_number} to available`);
      }
      
      await connection.commit();
      
      return {
        success: true,
        message: `Successfully updated ${updatedCount} expired bookings and their room status`,
        updatedCount,
        processedBookings: expiredBookings.map(b => ({
          bookingId: b.id,
          roomNumber: b.room_number,
          checkOutDate: b.check_out_date
        }))
      };
      
    } catch (error) {
      if (connection) {
        await connection.rollback();
      }
      console.error('❌ Error in auto-update:', error);
      return {
        success: false,
        message: 'Error updating expired bookings',
        error: error.message
      };
    } finally {
      if (connection) {
        await connection.end();
      }
    }
  })
  .listen(5680);

console.log('🚀 Auto-update API server running on port 5680');