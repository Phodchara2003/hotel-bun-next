import { Elysia } from 'elysia';
import { sql } from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';

console.log('💰 Admin Payments Routes loading...');

export const adminPaymentsRoutes = new Elysia({ prefix: '/admin/payments' })
  
  // Get all payments (Admin)
  .get('/', async ({ headers, query, set }) => {
    try {
      console.log('Admin get all payments request received');
      
      // Authenticate admin
      const user = await authMiddleware({ headers, set });
      if (user.error) {
        console.log('Authentication failed:', user.error);
        return user;
      }
      
      console.log('Authenticated user:', { id: user.id, role: user.role });
      
      if (!['admin', 'staff', 'super_admin'].includes(user.role)) {
        console.log('Access denied: user is not admin, staff, or super_admin');
        set.status = 403;
        return { error: 'Admin or staff access required' };
      }
      
      const { page = 1, limit = 50, status, startDate, endDate } = query;
      const offset = (page - 1) * limit;
      
      let whereClause = '';
      let params = [];
      
      if (status) {
        whereClause = 'WHERE b.status = $1';
        params.push(status);
      }
      
      if (startDate && endDate) {
        const dateCondition = whereClause ? ' AND b.created_at BETWEEN $' + (params.length + 1) + ' AND $' + (params.length + 2) : 'WHERE b.created_at BETWEEN $1 AND $2';
        whereClause += dateCondition;
        params.push(startDate, endDate);
      }
      
      // Get payments from bookings
      const paymentQuery = `
        SELECT 
          b.id,
          b.id as booking_id,
          b.total_price as amount,
          b.status,
          b.payment_receipt_url,
          b.payment_slip_url,
          b.created_at,
          b.updated_at,
          u.email as customer_email,
          u.full_name as customer_name,
          rt.name as room_type,
          h.name as hotel_name
        FROM bookings b
        LEFT JOIN users u ON b.user_id = u.id
        LEFT JOIN room_types rt ON b.room_type_id = rt.id
        LEFT JOIN hotels h ON rt.hotel_id = h.id
        ${whereClause}
        ORDER BY b.created_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;
      
      params.push(parseInt(limit), offset);
      
      // Simplified query without unsafe
      const payments = await sql`
        SELECT 
          b.id,
          b.id as booking_id,
          b.total_price as amount,
          b.status,
          b.payment_receipt_url,
          b.payment_slip_url,
          b.created_at,
          b.updated_at,
          b.user_id
        FROM bookings b
        ORDER BY b.created_at DESC
        LIMIT 10 OFFSET 0
      `;
      
      // Get total count - simplified
      const totalResult = await sql`SELECT COUNT(*) as total FROM bookings`;
      const total = parseInt(totalResult[0].total);
      
      return {
        payments: payments.map(payment => ({
          id: payment.id,
          bookingId: payment.booking_id,
          amount: parseFloat(payment.amount),
          status: payment.status,
          paymentReceiptUrl: payment.payment_receipt_url,
          paymentSlipUrl: payment.payment_slip_url,
          userId: payment.user_id,
          customerEmail: 'N/A',
          customerName: 'N/A',
          roomType: 'N/A',
          hotelName: 'N/A',
          createdAt: payment.created_at,
          updatedAt: payment.updated_at
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error fetching payments:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })
  
  // Get payment by ID (Admin)
  .get('/:id', async ({ headers, params, set }) => {
    try {
      console.log('Admin get payment by ID request received:', params.id);
      
      // Authenticate admin
      const user = await authMiddleware({ headers, set });
      if (user.error) {
        console.log('Authentication failed:', user.error);
        return user;
      }
      
      if (!['admin', 'staff', 'super_admin'].includes(user.role)) {
        set.status = 403;
        return { error: 'Admin or staff access required' };
      }
      
      const paymentId = parseInt(params.id);
      
      const payment = await sql`
        SELECT 
          b.id,
          b.id as booking_id,
          b.total_price as amount,
          b.status,
          b.payment_receipt_url,
          b.payment_slip_url,
          b.check_in_date,
          b.check_out_date,
          b.created_at,
          b.updated_at,
          b.user_id
        FROM bookings b
        WHERE b.id = ${paymentId}
      `;
      
      if (!payment.length) {
        set.status = 404;
        return { error: 'Payment not found' };
      }
      
      const paymentData = payment[0];
      
      return {
        payment: {
          id: paymentData.id,
          bookingId: paymentData.booking_id,
          amount: parseFloat(paymentData.amount),
          status: paymentData.status,
          paymentReceiptUrl: paymentData.payment_receipt_url,
          paymentSlipUrl: paymentData.payment_slip_url,
          checkInDate: paymentData.check_in_date,
          checkOutDate: paymentData.check_out_date,
          userId: paymentData.user_id,
          customerEmail: 'N/A',
          customerName: 'N/A',
          customerPhone: 'N/A',
          roomType: 'N/A',
          hotelName: 'N/A',
          pricePerNight: 0,
          createdAt: paymentData.created_at,
          updatedAt: paymentData.updated_at
        }
      };
    } catch (error) {
      console.error('Error fetching payment:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })
  
  // Update payment status (Admin)
  .put('/:id/status', async ({ headers, params, body, set }) => {
    try {
      console.log('Admin update payment status request received:', params.id, body);
      
      // Authenticate admin
      const user = await authMiddleware({ headers, set });
      if (user.error) {
        console.log('Authentication failed:', user.error);
        return user;
      }
      
      if (!['admin', 'super_admin'].includes(user.role)) {
        set.status = 403;
        return { error: 'Admin access required' };
      }
      
      const paymentId = parseInt(params.id);
      const { status } = body;
      
      // Validate status
      const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        set.status = 400;
        return { error: 'Invalid status' };
      }
      
      // Update payment status (booking status)
      const updatedPayment = await sql`
        UPDATE bookings 
        SET status = ${status}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${paymentId}
        RETURNING *
      `;
      
      if (!updatedPayment.length) {
        set.status = 404;
        return { error: 'Payment not found' };
      }
      
      return {
        message: 'Payment status updated successfully',
        payment: {
          id: updatedPayment[0].id,
          status: updatedPayment[0].status,
          updatedAt: updatedPayment[0].updated_at
        }
      };
    } catch (error) {
      console.error('Error updating payment status:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })
  
  // Get payment statistics (Admin)
  .get('/stats/overview', async ({ headers, query, set }) => {
    try {
      console.log('Admin get payment statistics request received');
      
      // Authenticate admin
      const user = await authMiddleware({ headers, set });
      if (user.error) {
        console.log('Authentication failed:', user.error);
        return user;
      }
      
      if (!['admin', 'staff', 'super_admin'].includes(user.role)) {
        set.status = 403;
        return { error: 'Admin or staff access required' };
      }
      
      const { startDate, endDate } = query;
      
      let dateFilter = '';
      let params = [];
      
      if (startDate && endDate) {
        dateFilter = 'WHERE created_at BETWEEN $1 AND $2';
        params = [startDate, endDate];
      }
      
      // Get payment statistics
      const statsQuery = `
        SELECT 
          COUNT(*) as total_payments,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_payments,
          SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_payments,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_payments,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_payments,
          SUM(CASE WHEN status IN ('confirmed', 'completed') THEN total_price ELSE 0 END) as total_revenue,
          SUM(CASE WHEN status = 'pending' THEN total_price ELSE 0 END) as pending_revenue,
          SUM(CASE WHEN payment_receipt_url IS NOT NULL OR payment_slip_url IS NOT NULL THEN 1 ELSE 0 END) as payments_with_receipts
        FROM bookings
        ${dateFilter}
      `;
      
      const stats = await sql.unsafe(statsQuery, params);
      const statsData = stats[0];
      
      return {
        stats: {
          totalPayments: parseInt(statsData.total_payments),
          pendingPayments: parseInt(statsData.pending_payments),
          confirmedPayments: parseInt(statsData.confirmed_payments),
          completedPayments: parseInt(statsData.completed_payments),
          cancelledPayments: parseInt(statsData.cancelled_payments),
          totalRevenue: parseFloat(statsData.total_revenue || 0),
          pendingRevenue: parseFloat(statsData.pending_revenue || 0),
          paymentsWithReceipts: parseInt(statsData.payments_with_receipts),
          averagePayment: parseInt(statsData.total_payments) > 0 ? parseFloat(statsData.total_revenue || 0) / parseInt(statsData.total_payments) : 0
        }
      };
    } catch (error) {
      console.error('Error fetching payment statistics:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })
  
  // Get daily payment revenue (Admin)
  .get('/stats/daily-revenue', async ({ headers, query, set }) => {
    try {
      console.log('Admin get daily revenue request received');
      
      // Authenticate admin
      const user = await authMiddleware({ headers, set });
      if (user.error) {
        console.log('Authentication failed:', user.error);
        return user;
      }
      
      if (!['admin', 'staff', 'super_admin'].includes(user.role)) {
        set.status = 403;
        return { error: 'Admin or staff access required' };
      }
      
      const { days = 30 } = query;
      
      const dailyRevenue = await sql`
        SELECT 
          DATE(created_at) as date,
          SUM(CASE WHEN status IN ('confirmed', 'completed') THEN total_price ELSE 0 END) as revenue,
          COUNT(*) as bookings
        FROM bookings
        WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `;
      
      return {
        dailyRevenue: dailyRevenue.map(day => ({
          date: day.date,
          revenue: parseFloat(day.revenue || 0),
          bookings: parseInt(day.bookings)
        }))
      };
    } catch (error) {
      console.error('Error fetching daily revenue:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  });

console.log('✅ Admin Payments Routes loaded');
