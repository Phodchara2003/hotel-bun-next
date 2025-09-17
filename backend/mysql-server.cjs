const { createServer } = require('http');
const { parse } = require('url');
require('dotenv').config();
const mysql = require('mysql2/promise');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const PORT = process.env.PORT || 3001;

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, 'uploads', 'payment-slips');
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'slip-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Multer configuration for room images
const roomImageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '..', 'frontend', 'public', 'images', 'rooms');
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'room-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (jpeg, jpg, png) and PDF files are allowed!'));
    }
  }
});

const uploadRoomImage = multer({ 
  storage: roomImageStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for room images
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (jpeg, jpg, png, webp) are allowed for room images!'));
    }
  }
});

// MySQL Connection Configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '12345678',
  database: 'hotel_booking',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let connection = null;

// Initialize MySQL connection
async function connectToDatabase() {
  try {
    console.log('🔄 Connecting to MySQL database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to MySQL database successfully!');
    
    // Test connection
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('🔍 Database test query successful');
    
    return true;
  } catch (error) {
    console.error('❌ MySQL connection failed:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', error);
    
    // Don't exit, continue with fallback data
    console.log('⚠️  Continuing without database connection...');
    return false;
  }
}

// CORS headers
const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

// Send JSON response
const sendJSON = (res, statusCode, data) => {
  setCorsHeaders(res);
  res.setHeader('Content-Type', 'application/json');
  res.writeHead(statusCode);
  res.end(JSON.stringify(data, null, 2));
};

// Database query functions
async function getHotels() {
  try {
    const [rows] = await connection.execute(`
      SELECT 
        id, 
        name, 
        description, 
        address, 
        city, 
        country, 
        rating, 
        images, 
        amenities,
        created_at,
        updated_at
      FROM hotels 
      ORDER BY rating DESC
    `);
    return rows;
  } catch (error) {
    console.error('Error fetching hotels:', error.message);
    // Return fallback data if database fails
    return [
      {
        id: 1,
        name: 'Grand Hotel Bangkok',
        description: 'Luxury hotel in the heart of Bangkok',
        address: '123 Sukhumvit Road, Bangkok',
        city: 'Bangkok',
        country: 'Thailand',
        rating: 4.8,
        images: ['/images/hotel1.jpg'],
        amenities: ['WiFi', 'Pool', 'Restaurant', 'Spa', 'Gym']
      },
      {
        id: 2,
        name: 'Riverside Resort',
        description: 'Beautiful riverside resort with mountain views',
        address: '456 River Valley, Chiang Mai',
        city: 'Chiang Mai',
        country: 'Thailand',
        rating: 4.6,
        images: ['/images/hotel2.jpg'],
        amenities: ['WiFi', 'Pool', 'Restaurant', 'Kayaking']
      }
    ];
  }
}

async function getRoomTypes(hotel_id = null) {
  try {
    let query = `
      SELECT 
        rt.id,
        rt.hotel_id,
        rt.name,
        rt.description,
        rt.price_per_night,
        rt.max_guests,
        rt.size_sqm,
        rt.amenities,
        rt.images,
        rt.type,
        h.name as hotel_name
      FROM room_types rt
      LEFT JOIN hotels h ON rt.hotel_id = h.id
    `;
    
    let params = [];
    if (hotel_id) {
      query += ' WHERE rt.hotel_id = ?';
      params = [hotel_id];
    }
    
    query += ' ORDER BY rt.price_per_night ASC';
    
    const [rows] = await connection.execute(query, params);
    return rows;
  } catch (error) {
    console.error('Error fetching room types:', error.message);
    // Return fallback data if database fails
    return [
      {
        id: 1,
        hotel_id: 1,
        name: 'Deluxe Room',
        description: 'Spacious deluxe room with city view',
        price_per_night: 2500,
        max_guests: 2,
        size_sqm: 35,
        amenities: ['WiFi', 'AC', 'TV', 'Minibar', 'Safe'],
        images: ['/images/room1.jpg'],
        type: 'deluxe',
        hotel_name: 'Grand Hotel Bangkok'
      },
      {
        id: 2,
        hotel_id: 1,
        name: 'Superior Room',
        description: 'Comfortable superior room with modern amenities',
        price_per_night: 1800,
        max_guests: 2,
        size_sqm: 28,
        amenities: ['WiFi', 'AC', 'TV', 'Minibar'],
        images: ['/images/room2.jpg'],
        type: 'superior',
        hotel_name: 'Grand Hotel Bangkok'
      }
    ];
  }
}

async function getRooms(hotel_id = null) {
  try {
    let query = `
      SELECT 
        r.id,
        r.hotel_id,
        r.room_type_id,
        r.room_number,
        r.floor,
        r.status,
        rt.name as room_type_name,
        rt.price_per_night,
        rt.max_guests,
        h.name as hotel_name
      FROM rooms r
      LEFT JOIN room_types rt ON r.room_type_id = rt.id
      LEFT JOIN hotels h ON r.hotel_id = h.id
    `;
    
    let params = [];
    if (hotel_id) {
      query += ' WHERE r.hotel_id = ?';
      params = [hotel_id];
    }
    
    query += ' ORDER BY r.room_number ASC';
    
    const [rows] = await connection.execute(query, params);
    return rows;
  } catch (error) {
    console.error('Error fetching rooms:', error.message);
    // Return fallback data if database fails
    return [
      {
        id: 1,
        hotel_id: 1,
        room_type_id: 1,
        room_number: '101',
        floor: 1,
        status: 'available',
        room_type_name: 'Deluxe Room',
        price_per_night: 2500,
        max_guests: 2,
        hotel_name: 'Grand Hotel Bangkok'
      },
      {
        id: 2,
        hotel_id: 1,
        room_type_id: 2,
        room_number: '102',
        floor: 1,
        status: 'available',
        room_type_name: 'Superior Room',
        price_per_night: 1800,
        max_guests: 2,
        hotel_name: 'Grand Hotel Bangkok'
      },
      {
        id: 3,
        hotel_id: 1,
        room_type_id: 1,
        room_number: '201',
        floor: 2,
        status: 'occupied',
        room_type_name: 'Deluxe Room',
        price_per_night: 2500,
        max_guests: 2,
        hotel_name: 'Grand Hotel Bangkok'
      }
    ];
  }
}

async function getBookings(userId = null) {
  try {
    console.log(`🔍 Fetching bookings for user: ${userId || 'all users'}`);
    
    let query = `
      SELECT 
        b.id,
        b.user_id,
        b.hotel_id,
        b.room_type_id,
        b.check_in_date,
        b.check_out_date,
        b.guests,
        b.total_price,
        b.status,
        b.booking_reference,
        b.guest_name,
        b.guest_phone,
        b.guest_email,
        b.special_requests,
        b.created_at,
        h.name as hotel_name,
        h.address as hotel_address,
        rt.name as room_type_name,
        rt.price_per_night as room_price
      FROM bookings b
      LEFT JOIN hotels h ON b.hotel_id = h.id
      LEFT JOIN room_types rt ON b.room_type_id = rt.id
    `;
    
    const params = [];
    if (userId) {
      query += ' WHERE b.user_id = ?';
      params.push(userId);
    }
    
    query += ' ORDER BY b.created_at DESC LIMIT 50';
    
    console.log(`📝 Executing query: ${query}`);
    console.log(`📝 With params: ${JSON.stringify(params)}`);
    
    const [rows] = await connection.execute(query, params);
    console.log(`✅ Found ${rows.length} bookings from database`);
    return rows;
  } catch (error) {
    console.error('❌ Error fetching bookings:', error.message);
    console.error('❌ Full error:', error);
    console.error('❌ Stack trace:', error.stack);
    // Return empty array instead of crashing
    return [];
  }
}

async function getDetailedBookingsForAdmin(userId = null) {
  try {
    console.log(`🔍 Fetching detailed bookings for admin, user: ${userId || 'all users'}`);
    
    let query = `
      SELECT 
        b.id,
        b.user_id,
        b.hotel_id,
        b.room_type_id,
        b.check_in_date,
        b.check_out_date,
        b.guests,
        b.total_price,
        b.status,
        b.booking_reference,
        b.guest_name,
        b.guest_phone,
        b.guest_email,
        b.special_requests,
        b.created_at,
        b.updated_at,
        h.name as hotel_name,
        h.address as hotel_address,
        h.description as hotel_description,
        h.amenities as hotel_amenities,
        rt.name as room_type_name,
        rt.description as room_description,
        rt.price_per_night as room_price,
        rt.max_guests as room_max_guests,
        rt.size_sqm as room_size,
        rt.amenities as room_amenities,
        rt.images as room_images,
        ps.id as payment_slip_id,
        ps.file_name as payment_file_name,
        ps.file_path as payment_file_path,
        ps.amount as payment_amount,
        ps.payment_date,
        ps.status as payment_status,
        u.first_name as user_first_name,
        u.last_name as user_last_name,
        u.email as user_email,
        u.phone as user_phone
      FROM bookings b
      LEFT JOIN hotels h ON b.hotel_id = h.id
      LEFT JOIN room_types rt ON b.room_type_id = rt.id
      LEFT JOIN payment_slips ps ON b.id = ps.booking_id
      LEFT JOIN users u ON b.user_id = u.id
    `;
    
    const params = [];
    if (userId) {
      query += ' WHERE b.user_id = ?';
      params.push(userId);
    }
    
    query += ' ORDER BY b.created_at DESC LIMIT 50';
    
    console.log(`📝 Executing detailed query: ${query}`);
    console.log(`📝 With params: ${JSON.stringify(params)}`);
    
    const [rows] = await connection.execute(query, params);
    console.log(`✅ Found ${rows.length} detailed bookings from database`);
    
    // Process the results to group payment slips by booking
    const bookingsMap = new Map();
    
    rows.forEach(row => {
      const bookingId = row.id;
      
      if (!bookingsMap.has(bookingId)) {
        bookingsMap.set(bookingId, {
          id: row.id,
          user_id: row.user_id,
          hotel_id: row.hotel_id,
          room_type_id: row.room_type_id,
          check_in_date: row.check_in_date,
          check_out_date: row.check_out_date,
          guests: row.guests,
          total_price: row.total_price,
          status: row.status,
          booking_reference: row.booking_reference,
          guest_name: row.guest_name,
          guest_phone: row.guest_phone,
          guest_email: row.guest_email,
          special_requests: row.special_requests,
          created_at: row.created_at,
          updated_at: row.updated_at,
          hotel: {
            name: row.hotel_name,
            address: row.hotel_address,
            description: row.hotel_description,
            amenities: row.hotel_amenities
          },
          room_type: {
            name: row.room_type_name,
            description: row.room_description,
            price_per_night: row.room_price,
            max_guests: row.room_max_guests,
            size_sqm: row.room_size,
            amenities: row.room_amenities,
            images: row.room_images
          },
          user: {
            first_name: row.user_first_name,
            last_name: row.user_last_name,
            email: row.user_email,
            phone: row.user_phone
          },
          payment_slips: []
        });
      }
      
      // Add payment slip if exists
      if (row.payment_slip_id) {
        const booking = bookingsMap.get(bookingId);
        booking.payment_slips.push({
          id: row.payment_slip_id,
          file_name: row.payment_file_name,
          file_path: row.payment_file_path,
          amount: row.payment_amount,
          payment_date: row.payment_date,
          status: row.payment_status
        });
      }
    });
    
    return Array.from(bookingsMap.values());
  } catch (error) {
    console.error('❌ Error fetching detailed bookings:', error.message);
    console.error('❌ Full error:', error);
    console.error('❌ Stack trace:', error.stack);
    // Return empty array instead of crashing
    return [];
  }
}

async function createBooking(bookingData) {
  try {
    console.log('🏨 Creating new booking:', bookingData);
    
    const {
      user_id,
      hotel_id,
      room_type_id,
      check_in_date,
      check_out_date,
      guests,
      guest_name,
      guest_email,
      guest_phone,
      total_price,
      special_requests = null
    } = bookingData;

    // Generate booking reference
    const bookingReference = `HTL${Date.now().toString().slice(-6)}`;
    console.log('📋 Generated booking reference:', bookingReference);

    const [result] = await connection.execute(`
      INSERT INTO bookings (
        user_id,
        hotel_id,
        room_type_id,
        check_in_date,
        check_out_date,
        guests,
        total_price,
        status,
        booking_reference,
        guest_name,
        guest_phone,
        guest_email,
        special_requests,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      user_id,
      hotel_id,
      room_type_id,
      check_in_date,
      check_out_date,
      guests,
      total_price,
      'pending', // status
      bookingReference,
      guest_name,
      guest_phone,
      guest_email,
      special_requests
    ]);

    const bookingId = result.insertId;
    console.log(`✅ Booking created with ID: ${bookingId}`);
    console.log('📊 Insert result:', result);

    // Fetch the created booking with joined data
    const [bookingRows] = await connection.execute(`
      SELECT 
        b.*,
        h.name as hotel_name,
        rt.name as room_type_name,
        rt.price_per_night as room_price
      FROM bookings b
      LEFT JOIN hotels h ON b.hotel_id = h.id
      LEFT JOIN room_types rt ON b.room_type_id = rt.id
      WHERE b.id = ?
    `, [bookingId]);

    console.log('📋 Fetched booking rows:', bookingRows);
    console.log('📋 First booking row:', bookingRows[0]);

    if (bookingRows.length > 0) {
      console.log('✅ Returning booking data:', bookingRows[0]);
      return bookingRows[0];
    } else {
      console.error('❌ No booking found after creation');
      return null;
    }
  } catch (error) {
    console.error('❌ Error creating booking:', error);
    console.error('❌ Stack trace:', error.stack);
    return null;
  }
}

async function getBookingById(bookingId) {
  try {
    const [rows] = await connection.execute(`
      SELECT 
        b.id,
        b.user_id,
        b.hotel_id,
        b.room_type_id,
        b.check_in_date,
        b.check_out_date,
        b.guests,
        b.total_price,
        b.status,
        b.booking_reference,
        b.guest_name,
        b.guest_phone,
        b.guest_email,
        b.special_requests,
        b.created_at,
        h.name as hotel_name,
        h.address as hotel_address,
        rt.name as room_type_name,
        rt.price_per_night as room_price
      FROM bookings b
      LEFT JOIN hotels h ON b.hotel_id = h.id
      LEFT JOIN room_types rt ON b.room_type_id = rt.id
      WHERE b.id = ?
    `, [bookingId]);
    
    return rows[0] || null;
  } catch (error) {
    console.error('Error fetching booking by ID:', error.message);
    return null;
  }
}

async function cancelBooking(bookingId, userId) {
  try {
    console.log(`🚫 Cancelling booking ${bookingId} for user ${userId}`);
    
    // First, check if booking exists and belongs to user
    const booking = await getBookingById(bookingId);
    if (!booking) {
      return { success: false, message: 'ไม่พบการจองที่ระบุ' };
    }
    
    if (booking.user_id !== userId) {
      return { success: false, message: 'คุณไม่มีสิทธิ์ยกเลิกการจองนี้' };
    }
    
    // Check if booking can be cancelled (not already cancelled or completed)
    if (booking.status === 'cancelled') {
      return { success: false, message: 'การจองนี้ถูกยกเลิกแล้ว' };
    }
    
    if (booking.status === 'completed') {
      return { success: false, message: 'ไม่สามารถยกเลิกการจองที่เสร็จสิ้นแล้ว' };
    }
    
    // Check cancellation policy (24 hours before check-in)
    const checkInDate = new Date(booking.check_in_date);
    const now = new Date();
    const timeDiff = checkInDate - now;
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    if (hoursDiff < 24) {
      return { 
        success: false, 
        message: 'ไม่สามารถยกเลิกการจองได้ เนื่องจากเหลือเวลาน้อยกว่า 24 ชั่วโมงก่อนเช็คอิน' 
      };
    }
    
    // Update booking status to cancelled
    await connection.execute(`
      UPDATE bookings 
      SET status = 'cancelled', updated_at = NOW() 
      WHERE id = ? AND user_id = ?
    `, [bookingId, userId]);
    
    console.log(`✅ Booking ${bookingId} cancelled successfully`);
    
    // Return updated booking data
    const updatedBooking = await getBookingById(bookingId);
    return { 
      success: true, 
      message: 'ยกเลิกการจองเรียบร้อยแล้ว',
      data: updatedBooking 
    };
    
  } catch (error) {
    console.error('❌ Error cancelling booking:', error);
    return { success: false, message: 'เกิดข้อผิดพลาดในการยกเลิกการจอง' };
  }
}

async function createCancellationRequest(bookingId, userId, reason) {
  try {
    console.log(`📝 Creating cancellation request for booking ${bookingId} by user ${userId}`);
    
    // First, check if booking exists and belongs to user
    const booking = await getBookingById(bookingId);
    if (!booking) {
      return { success: false, message: 'ไม่พบการจองที่ระบุ' };
    }
    
    if (booking.user_id !== userId) {
      return { success: false, message: 'คุณไม่มีสิทธิ์ขอยกเลิกการจองนี้' };
    }
    
    // Check if booking can be cancelled (not already cancelled or completed)
    if (booking.status === 'cancelled') {
      return { success: false, message: 'การจองนี้ถูกยกเลิกแล้ว' };
    }
    
    if (booking.status === 'completed') {
      return { success: false, message: 'ไม่สามารถขอยกเลิกการจองที่เสร็จสิ้นแล้ว' };
    }
    
    // Check if there's already a pending cancellation request
    const [existingRequests] = await connection.execute(`
      SELECT id, status FROM cancellation_requests 
      WHERE booking_id = ? AND status = 'pending'
    `, [bookingId]);
    
    if (existingRequests.length > 0) {
      return { 
        success: false, 
        message: 'มีคำขอยกเลิกการจองที่รอการพิจารณาอยู่แล้ว' 
      };
    }
    
    // Create cancellation request
    const [result] = await connection.execute(`
      INSERT INTO cancellation_requests (booking_id, user_id, reason, status, requested_at)
      VALUES (?, ?, ?, 'pending', NOW())
    `, [bookingId, userId, reason || 'ไม่ระบุเหตุผล']);
    
    console.log(`✅ Cancellation request ${result.insertId} created successfully`);
    
    return { 
      success: true, 
      message: 'ส่งคำขอยกเลิกการจองเรียบร้อยแล้ว รอการพิจารณาจากเจ้าหน้าที่',
      data: { 
        request_id: result.insertId,
        booking_id: bookingId,
        status: 'pending' 
      }
    };
    
  } catch (error) {
    console.error('❌ Error creating cancellation request:', error);
    return { success: false, message: 'เกิดข้อผิดพลาดในการส่งคำขอยกเลิกการจอง' };
  }
}

async function getCancellationRequests(userId = null) {
  try {
    let query = `
      SELECT 
        cr.id,
        cr.booking_id,
        cr.user_id,
        cr.reason,
        cr.status,
        cr.admin_notes,
        cr.requested_at,
        cr.processed_at,
        b.hotel_name,
        b.room_type_name,
        b.check_in_date,
        b.check_out_date,
        b.total_price,
        b.guest_name
      FROM cancellation_requests cr
      LEFT JOIN bookings b ON cr.booking_id = b.id
    `;
    
    const params = [];
    if (userId) {
      query += ' WHERE cr.user_id = ?';
      params.push(userId);
    }
    
    query += ' ORDER BY cr.requested_at DESC';
    
    const [rows] = await connection.execute(query, params);
    return rows;
  } catch (error) {
    console.error('❌ Error fetching cancellation requests:', error);
    return [];
  }
}

async function getDashboardStats(startDate, endDate) {
  try {
    console.log('📊 Calculating dashboard statistics...');
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Get total bookings
    const [totalBookingsResult] = await connection.execute(
      'SELECT COUNT(*) as count FROM bookings WHERE created_at >= ? AND created_at <= ?',
      [startDateStr, endDateStr]
    );
    const totalBookings = totalBookingsResult[0]?.count || 0;
    
    // Get pending cancellation requests
    const [pendingCancellationsResult] = await connection.execute(
      'SELECT COUNT(*) as count FROM cancellation_requests WHERE status = "pending"'
    );
    const pendingCancellations = pendingCancellationsResult[0]?.count || 0;
    
    // Get total revenue (assuming you have a revenue/price field)
    const [revenueResult] = await connection.execute(
      'SELECT SUM(total_price) as revenue FROM bookings WHERE created_at >= ? AND created_at <= ? AND status != "cancelled"',
      [startDateStr, endDateStr]
    );
    const totalRevenue = revenueResult[0]?.revenue || 0;
    
    // Get total users
    const [usersResult] = await connection.execute(
      'SELECT COUNT(*) as count FROM users WHERE created_at >= ? AND created_at <= ?',
      [startDateStr, endDateStr]
    );
    const newUsers = usersResult[0]?.count || 0;
    
    // Get booking status breakdown
    const [statusBreakdown] = await connection.execute(
      'SELECT status, COUNT(*) as count FROM bookings WHERE created_at >= ? AND created_at <= ? GROUP BY status',
      [startDateStr, endDateStr]
    );
    
    // Get recent bookings
    const [recentBookings] = await connection.execute(`
      SELECT 
        b.id,
        b.booking_reference,
        b.guest_name,
        b.guest_email,
        b.status,
        b.total_price,
        b.created_at,
        h.name as hotel_name
      FROM bookings b
      LEFT JOIN hotels h ON b.hotel_id = h.id
      WHERE b.created_at >= ? AND b.created_at <= ?
      ORDER BY b.created_at DESC
      LIMIT 10
    `, [startDateStr, endDateStr]);
    
    // Get recent cancellation requests
    const [recentCancellations] = await connection.execute(`
      SELECT 
        cr.id,
        cr.booking_id,
        cr.reason,
        cr.status,
        cr.requested_at,
        b.booking_reference,
        b.guest_name
      FROM cancellation_requests cr
      LEFT JOIN bookings b ON cr.booking_id = b.id
      ORDER BY cr.requested_at DESC
      LIMIT 5
    `);
    
    // Calculate percentage changes (simplified - comparing with previous period)
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const [previousBookingsResult] = await connection.execute(
      'SELECT COUNT(*) as count FROM bookings WHERE created_at >= ? AND created_at < ?',
      [previousStartDate.toISOString().split('T')[0], startDateStr]
    );
    const previousBookings = previousBookingsResult[0]?.count || 1;
    
    const bookingsChange = previousBookings > 0 ? ((totalBookings - previousBookings) / previousBookings * 100) : 0;
    
    return {
      overview: {
        totalBookings,
        pendingCancellations,
        totalRevenue,
        newUsers,
        bookingsChange: Math.round(bookingsChange * 100) / 100
      },
      statusBreakdown: statusBreakdown.reduce((acc, curr) => {
        acc[curr.status] = curr.count;
        return acc;
      }, {}),
      recentBookings,
      recentCancellations,
      dateRange: {
        startDate: startDateStr,
        endDate: endDateStr,
        days: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
      }
    };
  } catch (error) {
    console.error('❌ Error calculating dashboard stats:', error);
    // Return fallback data
    return {
      overview: {
        totalBookings: 0,
        pendingCancellations: 0,
        totalRevenue: 0,
        newUsers: 0,
        bookingsChange: 0
      },
      statusBreakdown: {},
      recentBookings: [],
      recentCancellations: [],
      dateRange: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        days: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
      }
    };
  }
}

async function processCancellationRequest(requestId, adminId, action, adminNotes = null) {
  try {
    console.log(`⚖️ Processing cancellation request ${requestId} - Action: ${action}`);
    
    // Get the cancellation request
    const [requests] = await connection.execute(`
      SELECT cr.*, b.status as booking_status 
      FROM cancellation_requests cr
      LEFT JOIN bookings b ON cr.booking_id = b.id
      WHERE cr.id = ? AND cr.status = 'pending'
    `, [requestId]);
    
    if (requests.length === 0) {
      return { success: false, message: 'ไม่พบคำขอยกเลิกการจองหรือคำขอนี้ถูกประมวลผลแล้ว' };
    }
    
    const request = requests[0];
    
    if (action === 'approved') {
      // Approve cancellation - update booking status to cancelled
      await connection.execute(`
        UPDATE bookings 
        SET status = 'cancelled', updated_at = NOW() 
        WHERE id = ?
      `, [request.booking_id]);
      
      console.log(`✅ Booking ${request.booking_id} cancelled by admin approval`);
    }
    
    // Update cancellation request status
    await connection.execute(`
      UPDATE cancellation_requests 
      SET status = ?, admin_id = ?, admin_notes = ?, processed_at = NOW(), updated_at = NOW()
      WHERE id = ?
    `, [action, adminId, adminNotes, requestId]);
    
    const statusText = action === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ';
    console.log(`✅ Cancellation request ${requestId} ${statusText} successfully`);
    
    return { 
      success: true, 
      message: `${statusText}คำขอยกเลิกการจองเรียบร้อยแล้ว`
    };
    
  } catch (error) {
    console.error('❌ Error processing cancellation request:', error);
    return { success: false, message: 'เกิดข้อผิดพลาดในการประมวลผลคำขอ' };
  }
}

// Authentication functions
async function loginUser(email, password) {
  try {
    console.log(`🔐 Login attempt for email: ${email}`);
    
    // Get user from database
    const [users] = await connection.execute(
      'SELECT id, email, password, first_name, last_name, role, phone FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      return { success: false, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' };
    }
    
    const user = users[0];
    
    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return { success: false, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' };
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'hotel-booking-secret',
      { expiresIn: '24h' }
    );
    
    // Remove password from user object
    delete user.password;
    
    console.log(`✅ Login successful for user: ${user.email} (${user.role})`);
    
    return {
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: `${user.first_name} ${user.last_name}`,
          role: user.role,
          phone: user.phone
        },
        token: token
      }
    };
    
  } catch (error) {
    console.error('❌ Login error:', error);
    return { success: false, message: 'เกิดข้อผิดพลาดในระบบ' };
  }
}

async function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hotel-booking-secret');
    
    // Get fresh user data
    const [users] = await connection.execute(
      'SELECT id, email, first_name, last_name, role, phone FROM users WHERE id = ?',
      [decoded.id]
    );
    
    if (users.length === 0) {
      return { success: false, message: 'ไม่พบผู้ใช้' };
    }
    
    const user = users[0];
    
    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        role: user.role,
        phone: user.phone
      }
    };
    
  } catch (error) {
    console.error('❌ Token verification error:', error);
    return { success: false, message: 'Token ไม่ถูกต้อง' };
  }
}

// Payment-related functions
async function getPaymentSettings() {
  try {
    const [rows] = await connection.execute(`
      SELECT setting_key, setting_value 
      FROM payment_settings
    `);
    
    const settings = {};
    rows.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });
    
    return settings;
  } catch (error) {
    console.error('Error fetching payment settings:', error.message);
    // Return fallback data
    return {
      qr_code_url: '/uploads/qr-code.jpg',
      bank_name: 'ธนาคารกสิกรไทย',
      bank_account: '123-456-7890',
      account_name: 'Hotel Booking System'
    };
  }
}

async function getPaymentSlips(user_id = null) {
  try {
    let query = `
      SELECT 
        ps.id,
        ps.booking_id,
        ps.user_id,
        ps.file_name,
        ps.original_name,
        ps.file_path,
        ps.file_size,
        ps.amount,
        ps.payment_date,
        ps.status,
        ps.admin_notes,
        ps.created_at,
        b.booking_reference,
        b.guest_name,
        h.name as hotel_name
      FROM payment_slips ps
      LEFT JOIN bookings b ON ps.booking_id = b.id
      LEFT JOIN hotels h ON b.hotel_id = h.id
    `;
    
    let params = [];
    if (user_id) {
      query += ' WHERE ps.user_id = ?';
      params = [user_id];
    }
    
    query += ' ORDER BY ps.created_at DESC';
    
    const [rows] = await connection.execute(query, params);
    return rows;
  } catch (error) {
    console.error('Error fetching payment slips:', error.message);
    // Return fallback data
    return [
      {
        id: 1,
        booking_id: 1,
        user_id: 4,
        file_name: 'slip_001.jpg',
        original_name: 'payment_receipt.jpg',
        file_path: '/uploads/payment-slips/slip_001.jpg',
        file_size: 245760,
        amount: 5000.00,
        payment_date: '2024-12-20',
        status: 'approved',
        booking_reference: 'HTL001',
        guest_name: 'สมชาย ใจดี',
        hotel_name: 'Grand Hotel Bangkok'
      }
    ];
  }
}

async function savePaymentSlip(data) {
  try {
    const [result] = await connection.execute(`
      INSERT INTO payment_slips 
      (booking_id, user_id, file_name, original_name, file_path, file_size, amount, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `, [
      data.booking_id,
      data.user_id,
      data.file_name,
      data.original_name,
      data.file_path,
      data.file_size,
      data.amount
    ]);
    
    return {
      id: result.insertId,
      success: true
    };
  } catch (error) {
    console.error('Error saving payment slip:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Room Management Functions
async function getAllRoomsForAdmin() {
  try {
    console.log('🏠 Fetching all rooms for admin...');
    
    const [rows] = await connection.execute(`
      SELECT 
        rt.id,
        rt.hotel_id,
        rt.name,
        rt.description,
        rt.price_per_night,
        rt.max_guests,
        rt.size_sqm,
        rt.amenities,
        rt.images,
        rt.type,
        rt.created_at,
        rt.updated_at,
        h.name as hotel_name,
        h.address as hotel_address,
        (SELECT COUNT(*) FROM bookings b WHERE b.room_type_id = rt.id AND b.status = 'confirmed') as active_bookings
      FROM room_types rt
      LEFT JOIN hotels h ON rt.hotel_id = h.id
      ORDER BY h.name, rt.name
    `);
    
    console.log(`✅ Found ${rows.length} rooms`);
    return rows;
  } catch (error) {
    console.error('❌ Error fetching rooms for admin:', error);
    return [];
  }
}

async function getRoomById(roomId) {
  try {
    console.log(`🏠 Fetching room by ID: ${roomId}`);
    
    const [rows] = await connection.execute(`
      SELECT 
        rt.*,
        h.name as hotel_name,
        h.address as hotel_address,
        (SELECT COUNT(*) FROM bookings b WHERE b.room_type_id = rt.id AND b.status = 'confirmed') as active_bookings
      FROM room_types rt
      LEFT JOIN hotels h ON rt.hotel_id = h.id
      WHERE rt.id = ?
    `, [roomId]);
    
    if (rows.length > 0) {
      console.log(`✅ Found room: ${rows[0].name}`);
      return rows[0];
    } else {
      console.log(`❌ Room not found: ${roomId}`);
      return null;
    }
  } catch (error) {
    console.error('❌ Error fetching room by ID:', error);
    return null;
  }
}

async function createRoom(roomData) {
  try {
    console.log('🏠 Creating new room:', roomData);
    
    const {
      hotel_id,
      name,
      description,
      price_per_night,
      max_guests,
      size_sqm,
      bed_type,
      amenities,
      images
    } = roomData;
    
    // Validate required fields
    if (!hotel_id || !name || !price_per_night || !max_guests) {
      return {
        success: false,
        message: 'ข้อมูลที่จำเป็นไม่ครบถ้วน (hotel_id, name, price_per_night, max_guests)'
      };
    }
    
    // Check if hotel exists
    const [hotelCheck] = await connection.execute(
      'SELECT id FROM hotels WHERE id = ?',
      [hotel_id]
    );
    
    if (hotelCheck.length === 0) {
      return {
        success: false,
        message: 'ไม่พบโรงแรมที่ระบุ'
      };
    }
    
    const [result] = await connection.execute(`
      INSERT INTO room_types (
        hotel_id,
        name,
        description,
        price_per_night,
        max_guests,
        size_sqm,
        amenities,
        images,
        type,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      hotel_id,
      name,
      description || null,
      price_per_night,
      max_guests,
      size_sqm || null,
      amenities || null,
      images || null,
      'standard' // default type
    ]);
    
    const roomId = result.insertId;
    console.log(`✅ Room created with ID: ${roomId}`);
    
    // Fetch the created room
    const newRoom = await getRoomById(roomId);
    
    return {
      success: true,
      message: 'สร้างห้องพักเรียบร้อยแล้ว',
      data: newRoom
    };
  } catch (error) {
    console.error('❌ Error creating room:', error);
    return {
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้างห้องพัก'
    };
  }
}

async function updateRoom(roomId, roomData) {
  try {
    console.log(`🏠 Updating room ${roomId}:`, roomData);
    
    // Check if room exists
    const existingRoom = await getRoomById(roomId);
    if (!existingRoom) {
      return {
        success: false,
        message: 'ไม่พบห้องพักที่ระบุ'
      };
    }
    
    // Map frontend fields to database fields
    const mappedData = {
      hotel_id: roomData.hotel_id,
      name: roomData.name,
      description: roomData.description,
      price_per_night: roomData.price_per_night || roomData.price, // Support both formats
      max_guests: roomData.max_guests || roomData.capacity, // Support both formats
      size_sqm: roomData.size_sqm || roomData.size, // Support both formats
      amenities: roomData.amenities,
      images: roomData.images,
      type: roomData.type
    };
    
    const {
      hotel_id,
      name,
      description,
      price_per_night,
      max_guests,
      size_sqm,
      amenities,
      images,
      type
    } = mappedData;
    
    // Convert undefined values to null for MySQL compatibility and parse numbers
    const safeHotelId = hotel_id !== undefined ? hotel_id : null;
    const safeName = name !== undefined ? name : null;
    const safeDescription = description !== undefined ? description : null;
    const safePricePerNight = price_per_night !== undefined ? parseFloat(price_per_night) || null : null;
    const safeMaxGuests = max_guests !== undefined ? parseInt(max_guests) || null : null;
    const safeSizeSquareMeters = size_sqm !== undefined ? parseFloat(size_sqm) || null : null;
    const safeAmenities = amenities !== undefined ? (Array.isArray(amenities) ? JSON.stringify(amenities) : amenities) : null;
    const safeImages = images !== undefined ? images : null;
    const safeType = type !== undefined ? type : null;
    
    // If hotel_id is being changed, validate it exists
    if (safeHotelId && safeHotelId !== existingRoom.hotel_id) {
      const [hotelCheck] = await connection.execute(
        'SELECT id FROM hotels WHERE id = ?',
        [safeHotelId]
      );
      
      if (hotelCheck.length === 0) {
        return {
          success: false,
          message: 'ไม่พบโรงแรมที่ระบุ'
        };
      }
    }
    
    await connection.execute(`
      UPDATE room_types SET
        hotel_id = COALESCE(?, hotel_id),
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        price_per_night = COALESCE(?, price_per_night),
        max_guests = COALESCE(?, max_guests),
        size_sqm = COALESCE(?, size_sqm),
        amenities = COALESCE(?, amenities),
        images = COALESCE(?, images),
        type = COALESCE(?, type),
        updated_at = NOW()
      WHERE id = ?
    `, [
      safeHotelId,
      safeName,
      safeDescription,
      safePricePerNight,
      safeMaxGuests,
      safeSizeSquareMeters,
      safeAmenities,
      safeImages,
      safeType,
      roomId
    ]);
    
    console.log(`✅ Room ${roomId} updated successfully`);
    
    // Fetch the updated room
    const updatedRoom = await getRoomById(roomId);
    
    return {
      success: true,
      message: 'อัพเดทข้อมูลห้องพักเรียบร้อยแล้ว',
      data: updatedRoom
    };
  } catch (error) {
    console.error('❌ Error updating room:', error);
    return {
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัพเดทห้องพัก'
    };
  }
}

async function updateRoomImages(roomId, images) {
  try {
    console.log(`🖼️ Updating images for room ${roomId}:`, images);
    
    // Check if room exists
    const existingRoom = await getRoomById(roomId);
    if (!existingRoom) {
      return {
        success: false,
        message: 'ไม่พบห้องพักที่ระบุ'
      };
    }
    
    // Update only the images field
    const imagesJson = JSON.stringify(images);
    await connection.execute(`
      UPDATE room_types SET
        images = ?,
        updated_at = NOW()
      WHERE id = ?
    `, [imagesJson, roomId]);
    
    console.log(`✅ Successfully updated images for room ${roomId}`);
    
    return {
      success: true,
      message: 'อัปเดตรูปภาพสำเร็จ',
      data: { images }
    };
  } catch (error) {
    console.error('❌ Error updating room images:', error);
    return {
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปเดตรูปภาพ'
    };
  }
}

async function deleteRoom(roomId) {
  try {
    console.log(`🏠 Deleting room ${roomId}`);
    
    // Check if room exists
    const existingRoom = await getRoomById(roomId);
    if (!existingRoom) {
      return {
        success: false,
        message: 'ไม่พบห้องพักที่ระบุ'
      };
    }
    
    // Check if room has active bookings
    const [bookingCheck] = await connection.execute(
      'SELECT COUNT(*) as count FROM bookings WHERE room_type_id = ? AND status IN ("confirmed", "pending")',
      [roomId]
    );
    
    if (bookingCheck[0].count > 0) {
      return {
        success: false,
        message: 'ไม่สามารถลบห้องพักที่มีการจองที่ยังไม่เสร็จสิ้นได้'
      };
    }
    
    await connection.execute('DELETE FROM room_types WHERE id = ?', [roomId]);
    
    console.log(`✅ Room ${roomId} deleted successfully`);
    
    return {
      success: true,
      message: 'ลบห้องพักเรียบร้อยแล้ว'
    };
  } catch (error) {
    console.error('❌ Error deleting room:', error);
    return {
      success: false,
      message: 'เกิดข้อผิดพลาดในการลบห้องพัก'
    };
  }
}

async function toggleRoomAvailability(roomId) {
  try {
    console.log(`🏠 Toggling availability for room ${roomId}`);
    
    // Check if room exists and get current type
    const existingRoom = await getRoomById(roomId);
    if (!existingRoom) {
      return {
        success: false,
        message: 'ไม่พบห้องพักที่ระบุ'
      };
    }
    
    // Toggle between 'available' and 'unavailable' using the type field
    const currentType = existingRoom.type || 'standard';
    const newType = currentType === 'unavailable' ? 'standard' : 'unavailable';
    
    await connection.execute(
      'UPDATE room_types SET type = ?, updated_at = NOW() WHERE id = ?',
      [newType, roomId]
    );
    
    console.log(`✅ Room ${roomId} type changed to: ${newType}`);
    
    // Fetch the updated room
    const updatedRoom = await getRoomById(roomId);
    
    return {
      success: true,
      message: `เปลี่ยนสถานะห้องพักเป็น ${newType === 'unavailable' ? 'ไม่พร้อมใช้งาน' : 'พร้อมใช้งาน'} เรียบร้อยแล้ว`,
      data: updatedRoom
    };
  } catch (error) {
    console.error('❌ Error toggling room availability:', error);
    return {
      success: false,
      message: 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะห้องพัก'
    };
  }
}

// HTTP Server
const server = createServer(async (req, res) => {
  const { pathname, query } = parse(req.url, true);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    res.writeHead(200);
    res.end();
    return;
  }

  // Normalize pathname by removing trailing slash (except for root)
  const normalizedPathname = pathname.length > 1 && pathname.endsWith('/') 
    ? pathname.slice(0, -1) 
    : pathname;

  console.log(`${req.method} ${normalizedPathname}`);

  try {
    // Routes
    switch (normalizedPathname) {
      case '/':
        sendJSON(res, 200, {
          message: 'Hotel Booking Backend API with MySQL',
          status: 'running',
          timestamp: new Date().toISOString(),
          port: PORT,
          database: connection ? 'connected' : 'fallback'
        });
        break;

      case '/health':
        // Test database connection
        let dbStatus = 'connected';
        try {
          if (connection) {
            await connection.execute('SELECT 1');
          } else {
            dbStatus = 'disconnected';
          }
        } catch (error) {
          dbStatus = 'disconnected';
        }
        
        sendJSON(res, 200, {
          status: 'healthy',
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          timestamp: new Date().toISOString(),
          database: dbStatus
        });
        break;

      case '/api/auth/login':
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          
          req.on('end', async () => {
            try {
              const { email, password } = JSON.parse(body);
              
              if (!email || !password) {
                sendJSON(res, 400, {
                  success: false,
                  message: 'กรุณากรอกอีเมลและรหัสผ่าน'
                });
                return;
              }
              
              const result = await loginUser(email, password);
              sendJSON(res, result.success ? 200 : 401, result);
              
            } catch (error) {
              console.error('❌ Login endpoint error:', error);
              sendJSON(res, 500, {
                success: false,
                message: 'เกิดข้อผิดพลาดในระบบ'
              });
            }
          });
        } else {
          sendJSON(res, 405, { success: false, message: 'Method not allowed' });
        }
        break;

      case '/api/auth/verify':
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          
          req.on('end', async () => {
            try {
              const { token } = JSON.parse(body);
              
              if (!token) {
                sendJSON(res, 400, {
                  success: false,
                  message: 'Token is required'
                });
                return;
              }
              
              const result = await verifyToken(token);
              sendJSON(res, result.success ? 200 : 401, result);
              
            } catch (error) {
              console.error('❌ Token verification error:', error);
              sendJSON(res, 500, {
                success: false,
                message: 'เกิดข้อผิดพลาดในระบบ'
              });
            }
          });
        } else {
          sendJSON(res, 405, { success: false, message: 'Method not allowed' });
        }
        break;

      case '/api/test':
        sendJSON(res, 200, {
          message: 'API endpoint working with MySQL',
          data: {
            server: 'Node.js HTTP Server',
            database: 'MySQL (AppServ)',
            version: '1.0.0',
            environment: process.env.NODE_ENV || 'development'
          }
        });
        break;

      case '/api/hotels':
        const hotels = await getHotels();
        sendJSON(res, 200, {
          success: true,
          count: hotels.length,
          data: hotels
        });
        break;

      case '/api/room-types':
        const hotel_id = query.hotel_id ? parseInt(query.hotel_id) : null;
        const roomTypes = await getRoomTypes(hotel_id);
        sendJSON(res, 200, {
          success: true,
          count: roomTypes.length,
          data: roomTypes,
          filter: hotel_id ? { hotel_id } : null
        });
        break;

      case '/api/rooms':
        const hotelId = query.hotel_id ? parseInt(query.hotel_id) : null;
        const rooms = await getRooms(hotelId);
        sendJSON(res, 200, {
          success: true,
          count: rooms.length,
          data: rooms,
          filter: hotelId ? { hotel_id: hotelId } : null
        });
        break;

      case '/api/notifications':
        // Return empty notifications for now
        sendJSON(res, 200, {
          success: true,
          count: 0,
          data: []
        });
        break;

      case '/api/notifications/unread-count':
        // Return unread notifications count
        sendJSON(res, 200, {
          success: true,
          count: 0
        });
        break;

      case '/api/global-settings':
        // Return global settings
        sendJSON(res, 200, {
          success: true,
          data: {
            room_price_per_night: 2000,
            currency: 'THB',
            check_in_time: '14:00',
            check_out_time: '12:00',
            max_occupancy: 4
          }
        });
        break;

      case '/api/database/status':
        let stats = { tables: 0, connections: 'unknown' };
        try {
          if (connection) {
            const [tables] = await connection.execute(`
              SELECT COUNT(*) as table_count 
              FROM information_schema.tables 
              WHERE table_schema = 'hotel_booking'
            `);
            stats.tables = tables[0].table_count;
            stats.connections = 'active';
          }
        } catch (error) {
          console.error('Error getting database stats:', error);
        }
        
        sendJSON(res, 200, {
          success: true,
          database: 'MySQL',
          host: 'localhost',
          status: connection ? 'connected' : 'disconnected',
          stats
        });
        break;

      case '/api/simple-payment-settings':
        const paymentSettings = await getPaymentSettings();
        sendJSON(res, 200, {
          success: true,
          data: {
            qrCodeUrl: paymentSettings.qr_code_url,
            bankName: paymentSettings.bank_name,
            bankAccount: paymentSettings.bank_account,
            accountName: paymentSettings.account_name
          }
        });
        break;

      case '/api/payment-slips':
        const user_id = query.user_id ? parseInt(query.user_id) : null;
        const paymentSlips = await getPaymentSlips(user_id);
        sendJSON(res, 200, {
          success: true,
          count: paymentSlips.length,
          data: paymentSlips
        });
        break;

      case '/api/bookings':
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          
          req.on('end', async () => {
            try {
              const bookingData = JSON.parse(body);
              const booking = await createBooking(bookingData);
              
              if (booking) {
                sendJSON(res, 201, {
                  success: true,
                  message: 'สร้างการจองสำเร็จ',
                  data: booking
                });
              } else {
                sendJSON(res, 400, {
                  success: false,
                  message: 'ไม่สามารถสร้างการจองได้'
                });
              }
            } catch (error) {
              console.error('Error creating booking:', error);
              sendJSON(res, 500, {
                success: false,
                message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์'
              });
            }
          });
          
          return; // Important: return here to prevent fall-through
        } else {
          // Handle GET request (existing code)
          const userId = query.user_id;
          const bookings = await getBookings(userId ? parseInt(userId) : null);
          sendJSON(res, 200, {
            success: true,
            count: bookings.length,
            data: bookings
          });
        }
        break;

      case '/api/admin/bookings/detailed':
        if (req.method === 'GET') {
          try {
            setCorsHeaders(res);
            const userId = query.user_id;
            console.log('🔍 Admin requesting detailed bookings for user:', userId || 'all users');
            
            const detailedBookings = await getDetailedBookingsForAdmin(userId ? parseInt(userId) : null);
            
            sendJSON(res, 200, {
              success: true,
              count: detailedBookings.length,
              data: detailedBookings
            });
          } catch (error) {
            console.error('❌ Error in /api/admin/bookings/detailed:', error);
            setCorsHeaders(res);
            sendJSON(res, 500, {
              success: false,
              message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการจองแบบละเอียด'
            });
          }
        } else {
          setCorsHeaders(res);
          sendJSON(res, 405, {
            success: false,
            message: 'Method not allowed'
          });
        }
        break;

      case '/api/cancellation-requests':
        if (req.method === 'GET') {
          const userId = query.user_id;
          const cancellationRequests = await getCancellationRequests(userId ? parseInt(userId) : null);
          sendJSON(res, 200, {
            success: true,
            count: cancellationRequests.length,
            data: cancellationRequests
          });
        } else if (req.method === 'PUT') {
          // Handle processing cancellation request (approve/reject)
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          
          req.on('end', async () => {
            try {
              const { request_id, action, admin_id, admin_notes } = JSON.parse(body);
              
              setCorsHeaders(res);
              
              if (!request_id || !action || !admin_id) {
                sendJSON(res, 400, { 
                  success: false, 
                  message: 'ข้อมูลไม่ครบถ้วน' 
                });
                return;
              }
              
              if (!['approved', 'rejected'].includes(action)) {
                sendJSON(res, 400, { 
                  success: false, 
                  message: 'การดำเนินการไม่ถูกต้อง' 
                });
                return;
              }
              
              console.log(`⚖️ Admin ${admin_id} processing request ${request_id}: ${action}`);
              const result = await processCancellationRequest(parseInt(request_id), admin_id, action, admin_notes);
              
              sendJSON(res, result.success ? 200 : 400, result);
            } catch (error) {
              console.error('❌ Error processing cancellation request:', error);
              setCorsHeaders(res);
              sendJSON(res, 500, { 
                success: false, 
                message: 'เกิดข้อผิดพลาดในระบบ' 
              });
            }
          });
        } else {
          setCorsHeaders(res);
          sendJSON(res, 405, {
            success: false,
            message: 'Method not allowed'
          });
        }
        break;

      case '/api/admin/dashboard/stats':
        if (req.method === 'GET') {
          try {
            setCorsHeaders(res);
            
            // Get query parameters
            const days = parseInt(query.days) || 30;
            
            // Calculate date range
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            
            console.log(`📊 Fetching dashboard stats for last ${days} days`);
            
            // Get various statistics
            const stats = await getDashboardStats(startDate, endDate);
            
            sendJSON(res, 200, {
              success: true,
              data: stats
            });
          } catch (error) {
            console.error('❌ Error fetching dashboard stats:', error);
            setCorsHeaders(res);
            sendJSON(res, 500, { 
              success: false, 
              message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสถิติ' 
            });
          }
        } else {
          setCorsHeaders(res);
          sendJSON(res, 405, {
            success: false,
            message: 'Method not allowed'
          });
        }
        break;

      case '/api/admin/rooms':
        setCorsHeaders(res);
        if (req.method === 'GET') {
          try {
            console.log('🏠 Admin requesting all rooms');
            const rooms = await getAllRoomsForAdmin();
            
            sendJSON(res, 200, {
              success: true,
              count: rooms.length,
              data: rooms
            });
          } catch (error) {
            console.error('❌ Error fetching admin rooms:', error);
            sendJSON(res, 500, {
              success: false,
              message: 'เกิดข้อผิดพลาดในการดึงข้อมูลห้องพัก'
            });
          }
        } else if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          
          req.on('end', async () => {
            try {
              const roomData = JSON.parse(body);
              console.log('🏠 Creating new room:', roomData);
              
              const result = await createRoom(roomData);
              sendJSON(res, result.success ? 201 : 400, result);
            } catch (error) {
              console.error('❌ Error creating room:', error);
              sendJSON(res, 500, {
                success: false,
                message: 'เกิดข้อผิดพลาดในการสร้างห้องพัก'
              });
            }
          });
        } else {
          sendJSON(res, 405, {
            success: false,
            message: 'Method not allowed'
          });
        }
        break;

      case '/api/payment-slip/upload':
        if (req.method === 'POST') {
          // Simple mock upload endpoint for testing
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          
          req.on('end', async () => {
            try {
              // For now, just return success
              sendJSON(res, 200, {
                success: true,
                message: 'Payment slip uploaded successfully (mock)',
                data: { 
                  id: Math.floor(Math.random() * 1000),
                  file_path: '/uploads/payment-slips/mock-file.jpg',
                  file_name: 'mock-file.jpg'
                }
              });
            } catch (error) {
              console.error('Upload error:', error);
              sendJSON(res, 500, {
                success: false,
                error: 'Failed to process upload'
              });
            }
          });
        } else {
          sendJSON(res, 405, {
            success: false,
            error: 'Method not allowed'
          });
        }
        break;

      case '/uploads/qr-code.svg':
        // Serve QR code file
        if (req.method === 'GET') {
          const filePath = path.join(__dirname, 'uploads', 'qr-code.svg');
          
          if (fs.existsSync(filePath)) {
            res.writeHead(200, { 
              'Content-Type': 'image/svg+xml',
              'Cache-Control': 'public, max-age=86400' // Cache for 1 day
            });
            
            const fileStream = fs.createReadStream(filePath);
            fileStream.pipe(res);
          } else {
            sendJSON(res, 404, {
              success: false,
              error: 'QR code file not found'
            });
          }
        } else {
          sendJSON(res, 405, {
            success: false,
            error: 'Method not allowed'
          });
        }
        break;

      default:
        // Handle dynamic routes
        if (normalizedPathname.startsWith('/api/admin/rooms/')) {
          const pathParts = normalizedPathname.split('/');
          const roomId = pathParts[4]; // /api/admin/rooms/{id}
          const action = pathParts[5]; // /api/admin/rooms/{id}/{action}
          
          setCorsHeaders(res);
          
          if (req.method === 'GET' && roomId && !action) {
            // GET /api/admin/rooms/{id}
            try {
              const room = await getRoomById(parseInt(roomId));
              if (room) {
                sendJSON(res, 200, {
                  success: true,
                  data: room
                });
              } else {
                sendJSON(res, 404, {
                  success: false,
                  message: 'ไม่พบห้องพักที่ระบุ'
                });
              }
            } catch (error) {
              console.error('❌ Error fetching room:', error);
              sendJSON(res, 500, {
                success: false,
                message: 'เกิดข้อผิดพลาดในการดึงข้อมูลห้องพัก'
              });
            }
          } else if (req.method === 'PUT' && roomId && !action) {
            // PUT /api/admin/rooms/{id}
            let body = '';
            req.on('data', chunk => {
              body += chunk.toString();
            });
            
            req.on('end', async () => {
              try {
                const roomData = JSON.parse(body);
                console.log(`🏠 Updating room ${roomId}:`, roomData);
                
                const result = await updateRoom(parseInt(roomId), roomData);
                sendJSON(res, result.success ? 200 : 400, result);
              } catch (error) {
                console.error('❌ Error updating room:', error);
                sendJSON(res, 500, {
                  success: false,
                  message: 'เกิดข้อผิดพลาดในการอัพเดทห้องพัก'
                });
              }
            });
          } else if (req.method === 'POST' && pathname.includes('/upload-images')) {
            // POST /api/admin/rooms/{id}/upload-images
            try {
              console.log(`🖼️ Uploading images for room ${roomId}`);
              
              uploadRoomImage.array('roomImages', 10)(req, res, async (err) => {
                if (err) {
                  console.error('❌ Upload error:', err);
                  sendJSON(res, 400, {
                    success: false,
                    message: err.message
                  });
                  return;
                }
                
                if (!req.files || req.files.length === 0) {
                  sendJSON(res, 400, {
                    success: false,
                    message: 'ไม่พบไฟล์รูปภาพ'
                  });
                  return;
                }
                
                // Get existing room images
                const existingRoom = await getRoomById(parseInt(roomId));
                const existingImages = existingRoom?.images ? JSON.parse(existingRoom.images) : [];
                
                // Add new image filenames
                const newImages = req.files.map(file => file.filename);
                const allImages = [...existingImages, ...newImages];
                
                // Update room with new images
                const updateResult = await updateRoomImages(parseInt(roomId), allImages);
                
                if (updateResult.success) {
                  sendJSON(res, 200, {
                    success: true,
                    message: `อัปโหลดรูปภาพสำเร็จ ${newImages.length} รูป`,
                    data: {
                      uploadedFiles: newImages,
                      allImages: allImages
                    }
                  });
                } else {
                  sendJSON(res, 500, {
                    success: false,
                    message: 'อัปโหลดไฟล์สำเร็จ แต่ไม่สามารถอัปเดตฐานข้อมูลได้'
                  });
                }
              });
            } catch (error) {
              console.error('❌ Error uploading room images:', error);
              sendJSON(res, 500, {
                success: false,
                message: 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ'
              });
            }
          } else if (req.method === 'DELETE' && pathname.includes('/delete-image')) {
            // DELETE /api/admin/rooms/{id}/delete-image
            let body = '';
            req.on('data', chunk => {
              body += chunk.toString();
            });
            
            req.on('end', async () => {
              try {
                const { filename } = JSON.parse(body);
                console.log(`🗑️ Deleting image ${filename} from room ${roomId}`);
                
                // Get existing room images
                const existingRoom = await getRoomById(parseInt(roomId));
                const existingImages = existingRoom?.images ? JSON.parse(existingRoom.images) : [];
                
                // Remove the image from array
                const updatedImages = existingImages.filter(img => img !== filename);
                
                // Delete physical file
                const imagePath = path.join(__dirname, '..', 'frontend', 'public', 'images', 'rooms', filename);
                if (fs.existsSync(imagePath)) {
                  fs.unlinkSync(imagePath);
                }
                
                // Update room with remaining images
                const updateResult = await updateRoomImages(parseInt(roomId), updatedImages);
                
                if (updateResult.success) {
                  sendJSON(res, 200, {
                    success: true,
                    message: 'ลบรูปภาพสำเร็จ',
                    data: {
                      deletedFile: filename,
                      remainingImages: updatedImages
                    }
                  });
                } else {
                  sendJSON(res, 500, {
                    success: false,
                    message: 'ลบไฟล์สำเร็จ แต่ไม่สามารถอัปเดตฐานข้อมูลได้'
                  });
                }
              } catch (error) {
                console.error('❌ Error deleting room image:', error);
                sendJSON(res, 500, {
                  success: false,
                  message: 'เกิดข้อผิดพลาดในการลบรูปภาพ'
                });
              }
            });
          } else if (req.method === 'DELETE' && roomId && !action) {
            // DELETE /api/admin/rooms/{id}
            try {
              console.log(`🏠 Deleting room ${roomId}`);
              const result = await deleteRoom(parseInt(roomId));
              sendJSON(res, result.success ? 200 : 400, result);
            } catch (error) {
              console.error('❌ Error deleting room:', error);
              sendJSON(res, 500, {
                success: false,
                message: 'เกิดข้อผิดพลาดในการลบห้องพัก'
              });
            }
          } else if (req.method === 'PATCH' && roomId && action === 'toggle-availability') {
            // PATCH /api/admin/rooms/{id}/toggle-availability
            try {
              console.log(`🏠 Toggling availability for room ${roomId}`);
              const result = await toggleRoomAvailability(parseInt(roomId));
              sendJSON(res, result.success ? 200 : 400, result);
            } catch (error) {
              console.error('❌ Error toggling room availability:', error);
              sendJSON(res, 500, {
                success: false,
                message: 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะห้องพัก'
              });
            }
          } else {
            sendJSON(res, 405, {
              success: false,
              message: 'Method not allowed'
            });
          }
          break;
        }
        
        if (normalizedPathname.startsWith('/api/bookings/')) {
          const bookingId = normalizedPathname.split('/').pop();
          
          if (req.method === 'GET') {
            const booking = await getBookingById(parseInt(bookingId));
            
            setCorsHeaders(res);
            if (booking) {
              sendJSON(res, 200, {
                success: true,
                data: booking
              });
            } else {
              sendJSON(res, 404, {
                success: false,
                message: 'ไม่พบการจองที่ระบุ'
              });
            }
          } else if (req.method === 'PUT') {
            // Handle booking cancellation
            let body = '';
            req.on('data', chunk => {
              body += chunk.toString();
            });
            
            req.on('end', async () => {
              try {
                const { action, user_id, reason } = JSON.parse(body);
                
                setCorsHeaders(res);
                
                if (action === 'cancel') {
                  console.log(`� Cancellation request for booking ID: ${bookingId}, User: ${user_id}`);
                  const result = await createCancellationRequest(parseInt(bookingId), user_id, reason);
                  
                  sendJSON(res, result.success ? 200 : 400, result);
                } else {
                  sendJSON(res, 400, { 
                    success: false, 
                    message: 'การดำเนินการไม่ถูกต้อง' 
                  });
                }
              } catch (error) {
                console.error('❌ Error processing cancellation request:', error);
                setCorsHeaders(res);
                sendJSON(res, 500, { 
                  success: false, 
                  message: 'เกิดข้อผิดพลาดในระบบ' 
                });
              }
            });
          } else {
            setCorsHeaders(res);
            sendJSON(res, 405, {
              success: false,
              message: 'Method not allowed'
            });
          }
          break;
        }
        
        // Handle uploaded files serving
        if (normalizedPathname.startsWith('/uploads/payment-slips/') && req.method === 'GET') {
          const fileName = normalizedPathname.split('/').pop();
          const filePath = path.join(__dirname, 'uploads', 'payment-slips', fileName);
          
          if (fs.existsSync(filePath)) {
            const ext = path.extname(filePath).toLowerCase();
            let contentType = 'application/octet-stream';
            
            switch (ext) {
              case '.jpg':
              case '.jpeg':
                contentType = 'image/jpeg';
                break;
              case '.png':
                contentType = 'image/png';
                break;
              case '.pdf':
                contentType = 'application/pdf';
                break;
            }
            
            res.writeHead(200, { 
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=86400'
            });
            
            const fileStream = fs.createReadStream(filePath);
            fileStream.pipe(res);
          } else {
            sendJSON(res, 404, {
              success: false,
              error: 'File not found'
            });
          }
          break;
        }
        
        // Default 404 response
        sendJSON(res, 404, {
          success: false,
          error: 'Endpoint not found',
          available_endpoints: [
            'GET /',
            'GET /health',
            'POST /api/auth/login',
            'POST /api/auth/verify',
            'GET /api/test',
            'GET /api/hotels',
            'GET /api/room-types',
            'GET /api/rooms',
            'GET /api/bookings',
            'GET /api/admin/bookings/detailed',
            'GET /api/cancellation-requests',
            'PUT /api/cancellation-requests',
            'GET /api/admin/dashboard/stats',
            'GET /api/notifications',
            'GET /api/global-settings',
            'GET /api/database/status',
            'GET /api/simple-payment-settings',
            'GET /api/payment-slips',
            'POST /api/payment-slip/upload',
            'GET /uploads/qr-code.svg',
            'GET /uploads/payment-slips/{filename}'
          ]
        });
        break;
    }
  } catch (error) {
    console.error('Server error:', error);
    sendJSON(res, 500, {
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Start server
async function startServer() {
  // Try to connect to database first
  await connectToDatabase();
  
  server.listen(PORT, () => {
    console.log(`🚀 Hotel Backend Server with MySQL is running at http://localhost:${PORT}`);
    console.log(`📋 Available endpoints:`);
    console.log(`   GET /                        - Server info`);
    console.log(`   GET /health                  - Health check`);
    console.log(`   POST /api/auth/login         - User login`);
    console.log(`   POST /api/auth/verify        - Verify token`);
    console.log(`   GET /api/test                - API test`);
    console.log(`   GET /api/hotels              - Hotels from database`);
    console.log(`   GET /api/room-types          - Room types from database`);
    console.log(`   GET /api/rooms               - Rooms from database`);
    console.log(`   GET /api/bookings            - Bookings from database`);
    console.log(`   GET /api/admin/bookings/detailed - Detailed bookings for admin`);
    console.log(`   GET /api/admin/rooms         - All rooms for admin management`);
    console.log(`   POST /api/admin/rooms        - Create new room`);
    console.log(`   GET /api/admin/rooms/{id}    - Get room by ID`);
    console.log(`   PUT /api/admin/rooms/{id}    - Update room`);
    console.log(`   POST /api/admin/rooms/{id}/upload-images - Upload room images`);
    console.log(`   DELETE /api/admin/rooms/{id}/delete-image - Delete room image`);
    console.log(`   DELETE /api/admin/rooms/{id} - Delete room`);
    console.log(`   PATCH /api/admin/rooms/{id}/toggle-availability - Toggle room availability`);
    console.log(`   GET /api/cancellation-requests - Cancellation requests`);
    console.log(`   PUT /api/cancellation-requests - Process cancellation requests`);
    console.log(`   GET /api/admin/dashboard/stats - Admin dashboard statistics`);
    console.log(`   GET /api/notifications       - Notifications (empty)`);
    console.log(`   GET /api/global-settings     - Global settings`);
    console.log(`   GET /api/database/status     - Database statistics`);
    console.log(``);
    console.log(`💾 Database: MySQL (AppServ)`);
    console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3002'}`);
  });
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏹️  Shutting down server...');
  if (connection) {
    await connection.end();
    console.log('📤 Database connection closed');
  }
  server.close(() => {
    console.log('✅ Server stopped successfully');
    process.exit(0);
  });
});

// Start the server
startServer().catch(console.error);