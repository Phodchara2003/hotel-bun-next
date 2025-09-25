const { createServer } = require('http');
const { parse } = require('url');
const { WebSocketServer } = require('ws');
require('dotenv').config();
const mysql = require('mysql2/promise');
const multer = require('multer');
const busboy = require('busboy');
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

// QR Code storage configuration
const qrStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, 'uploads', 'qr-codes');
    
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const fileExtension = path.extname(file.originalname);
    cb(null, 'qr-code' + fileExtension);
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

const uploadQRCode = multer({ 
  storage: qrStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (jpeg, jpg, png) are allowed for QR codes!'));
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
  queueLimit: 0,
  charset: 'utf8mb4',
  // เพิ่ม configuration สำหรับ JSON parsing
  typeCast: function (field, next) {
    if (field.type === 'JSON') {
      return JSON.parse(field.string('utf8'));
    }
    return next();
  }
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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cache-Control, Pragma, Expires');
};

// Send JSON response
const sendJSON = (res, statusCode, data) => {
  if (res.headersSent) {
    console.log('⚠️ Headers already sent, cannot send response');
    return;
  }
  
  try {
    console.log(`📤 Sending JSON response: ${statusCode}`);
    setCorsHeaders(res);
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(statusCode);
    res.end(JSON.stringify(data, null, 2));
    console.log('✅ Response sent successfully');
  } catch (error) {
    console.error('❌ Error in sendJSON:', error.message);
    if (error.code === 'ERR_HTTP_HEADERS_SENT') {
      console.log('⚠️ Headers were already sent when trying to send response');
    }
  }
};

// Get request body as JSON
const getRequestBody = (req) => {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = body ? JSON.parse(body) : {};
        resolve(data);
      } catch (error) {
        reject(new Error('Invalid JSON in request body'));
      }
    });
    req.on('error', (error) => {
      reject(error);
    });
  });
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
        rt.bed_type,
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
    console.error('❌ Error in getRoomTypes function:', error.message);
    console.error('❌ Full error:', error);
    console.error('❌ Query parameters:', params);
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
        rt.description,
        rt.price_per_night,
        rt.max_guests,
        rt.size_sqm,
        rt.amenities,
        rt.images,
        rt.type,
        h.name as hotel_name,
        h.address as hotel_address
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

async function getDetailedBookingsForAdmin(userId = null, date = null) {
  try {
    console.log(`🔍 Fetching detailed bookings for admin, user: ${userId || 'all users'}, date: ${date || 'all dates'}`);
    
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
    const whereConditions = [];
    
    if (userId) {
      whereConditions.push('b.user_id = ?');
      params.push(userId);
    }
    
    if (date) {
      whereConditions.push('DATE(?) BETWEEN DATE(b.check_in_date) AND DATE(b.check_out_date)');
      params.push(date);
    }
    
    if (whereConditions.length > 0) {
      query += ' WHERE ' + whereConditions.join(' AND ');
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
      guest_national_id,
      total_price,
      special_requests = null
    } = bookingData;

    // ตรวจสอบห้องว่างก่อนสร้างการจอง
    console.log('🔍 Checking room availability before booking...');
    const availability = await checkRoomAvailability(room_type_id, check_in_date, check_out_date);
    
    if (!availability.isAvailable) {
      console.log('❌ Room not available for the selected dates');
      throw new Error('ห้องไม่ว่างในช่วงเวลาที่เลือก กรุณาเลือกวันที่อื่น');
    }
    
    console.log('✅ Room is available, proceeding with booking');

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
        guest_id_number,
        special_requests,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
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
      guest_national_id,
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

async function deleteBooking(bookingId) {
  try {
    console.log(`🗑️ Attempting to delete booking ID: ${bookingId}`);
    
    // ตรวจสอบว่า booking มีอยู่จริงหรือไม่
    const booking = await getBookingById(bookingId);
    if (!booking) {
      console.log(`❌ Booking ID ${bookingId} not found`);
      return {
        success: false,
        message: 'ไม่พบการจองที่ระบุ'
      };
    }
    
    console.log(`📋 Found booking: ${booking.booking_reference} (${booking.status})`);
    
    // ลบ booking จากฐานข้อมูล
    const [result] = await connection.execute(
      'DELETE FROM bookings WHERE id = ?',
      [bookingId]
    );
    
    if (result.affectedRows > 0) {
      console.log(`✅ Successfully deleted booking ID: ${bookingId}`);
      return {
        success: true,
        message: 'ลบการจองสำเร็จ',
        data: {
          id: bookingId,
          booking_reference: booking.booking_reference
        }
      };
    } else {
      console.log(`❌ Failed to delete booking ID: ${bookingId}`);
      return {
        success: false,
        message: 'ไม่สามารถลบการจองได้'
      };
    }
  } catch (error) {
    console.error('❌ Error deleting booking:', error.message);
    return {
      success: false,
      message: 'เกิดข้อผิดพลาดในการลบการจอง: ' + error.message
    };
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

async function registerUser(userData) {
  try {
    const { email, password, firstName, lastName, phone } = userData;
    
    console.log(`📝 Registration attempt for email: ${email}`);
    
    // Check if user already exists
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    
    if (existingUsers.length > 0) {
      return { success: false, message: 'อีเมลนี้ถูกใช้งานแล้ว' };
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert new user
    const [result] = await connection.execute(`
      INSERT INTO users (email, password, first_name, last_name, phone, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [email, hashedPassword, firstName, lastName, phone, 'guest']);
    
    const userId = result.insertId;
    
    // Generate JWT token for auto-login
    const token = jwt.sign(
      { 
        id: userId, 
        email: email, 
        role: 'guest' 
      },
      process.env.JWT_SECRET || 'hotel-booking-secret',
      { expiresIn: '24h' }
    );
    
    console.log(`✅ Registration successful for user: ${email}`);
    
    return {
      success: true,
      message: 'สมัครสมาชิกสำเร็จ',
      data: {
        user: {
          id: userId,
          email: email,
          name: `${firstName} ${lastName}`,
          role: 'guest',
          phone: phone
        },
        token: token
      }
    };
    
  } catch (error) {
    console.error('❌ Registration error:', error);
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

async function updatePaymentSettings(updates) {
  try {
    for (const [key, value] of Object.entries(updates)) {
      await connection.execute(`
        INSERT INTO payment_settings (setting_key, setting_value) 
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
      `, [key, value]);
    }
    console.log('✅ Payment settings updated:', updates);
    return true;
  } catch (error) {
    console.error('Error updating payment settings:', error.message);
    throw error;
  }
}

// Change log functions
async function logPaymentSettingsChange(adminUserId, adminEmail, adminName, changeType, fieldChanged, oldValue, newValue, description, ipAddress = null, userAgent = null) {
  try {
    await connection.execute(`
      INSERT INTO payment_settings_change_log 
      (admin_user_id, admin_email, admin_name, change_type, field_changed, old_value, new_value, change_description, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [adminUserId, adminEmail, adminName, changeType, fieldChanged, oldValue, newValue, description, ipAddress, userAgent]);
    
    console.log('✅ Payment settings change logged:', {
      changeType,
      fieldChanged,
      oldValue: oldValue?.substring(0, 50),
      newValue: newValue?.substring(0, 50)
    });
    return true;
  } catch (error) {
    console.error('Error logging payment settings change:', error.message);
    // Don't throw error - logging failure shouldn't break the main operation
    return false;
  }
}

async function getPaymentSettingsChangeLogs(limit = 10, offset = 0) {
  try {
    const [rows] = await connection.execute(`
      SELECT 
        id,
        admin_user_id,
        admin_email,
        admin_name,
        change_type,
        field_changed,
        old_value,
        new_value,
        change_description,
        created_at,
        ip_address
      FROM payment_settings_change_log 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `, [limit, offset]);
    
    return rows;
  } catch (error) {
    console.error('Error fetching payment settings change logs:', error.message);
    return [];
  }
}

async function getLatestPaymentSettingsChanges(sinceDate = null) {
  try {
    let query = `
      SELECT 
        id,
        admin_email,
        admin_name,
        change_type,
        field_changed,
        new_value,
        change_description,
        created_at
      FROM payment_settings_change_log 
    `;
    
    let params = [];
    if (sinceDate) {
      query += ' WHERE created_at > ?';
      params.push(sinceDate);
    }
    
    query += ' ORDER BY created_at DESC LIMIT 5';
    
    const [rows] = await connection.execute(query, params);
    return rows;
  } catch (error) {
    console.error('Error fetching latest payment settings changes:', error.message);
    return [];
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
        rt.bed_type,
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
    
    // Check if any hotel exists, if not use the first available hotel_id
    let finalHotelId = hotel_id;
    const [hotelCheck] = await connection.execute(
      'SELECT id FROM hotels WHERE id = ?',
      [hotel_id]
    );
    
    if (hotelCheck.length === 0) {
      // Try to find any existing hotel
      const [existingHotels] = await connection.execute('SELECT id FROM hotels LIMIT 1');
      
      if (existingHotels.length > 0) {
        finalHotelId = existingHotels[0].id;
        console.log(`Using existing hotel ID: ${finalHotelId} instead of ${hotel_id}`);
      } else {
        // Create a simple default hotel
        try {
          await connection.execute(`
            INSERT INTO hotels (id, name) VALUES (?, ?)
          `, [hotel_id, 'Grand Hotel']);
          console.log(`✅ Created default hotel with ID: ${hotel_id}`);
          finalHotelId = hotel_id;
        } catch (insertError) {
          console.error('❌ Error creating default hotel:', insertError);
          return {
            success: false,
            message: 'ไม่สามารถสร้างโรงแรมเริ่มต้นได้'
          };
        }
      }
    }
    
    // Properly handle JSON fields
    const safeAmenities = amenities ? (Array.isArray(amenities) ? JSON.stringify(amenities) : amenities) : '[]';
    const safeImages = images ? (Array.isArray(images) ? JSON.stringify(images) : images) : '[]';

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
      finalHotelId,
      name,
      description || null,
      price_per_night,
      max_guests,
      size_sqm || null,
      safeAmenities,
      safeImages,
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
    console.log(`🏠 Updating room ${roomId}:`, JSON.stringify(roomData, null, 2));
    console.log(`🔍 Room data types:`, Object.keys(roomData).map(key => `${key}: ${typeof roomData[key]}`));
    
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
    const safeImages = images !== undefined ? (Array.isArray(images) ? JSON.stringify(images) : images) : null;
    const safeType = type !== undefined ? type : null;
    
    // For updates, preserve existing hotel_id if not provided
    let finalHotelId = safeHotelId;
    if (!finalHotelId) {
      finalHotelId = existingRoom.hotel_id; // Keep existing hotel_id
    } else if (finalHotelId !== existingRoom.hotel_id) {
      // Only validate if hotel_id is actually being changed
      const [hotelCheck] = await connection.execute(
        'SELECT id FROM hotels WHERE id = ?',
        [finalHotelId]
      );
      
      if (hotelCheck.length === 0) {
        console.log(`❌ Hotel ID ${finalHotelId} not found, keeping existing: ${existingRoom.hotel_id}`);
        finalHotelId = existingRoom.hotel_id; // Keep existing hotel_id if new one doesn't exist
      }
    }
    
    // Now use the dynamic SQL approach

    // Build dynamic SQL query to avoid null parameter issues
    const updateFields = [];
    const queryParams = [];
    
    if (finalHotelId !== null) {
      updateFields.push('hotel_id = ?');
      queryParams.push(finalHotelId);
    }
    if (safeName !== null) {
      updateFields.push('name = ?');
      queryParams.push(safeName);
    }
    if (safeDescription !== null) {
      updateFields.push('description = ?');
      queryParams.push(safeDescription);
    }
    if (safePricePerNight !== null) {
      updateFields.push('price_per_night = ?');
      queryParams.push(safePricePerNight);
    }
    if (safeMaxGuests !== null) {
      updateFields.push('max_guests = ?');
      queryParams.push(safeMaxGuests);
    }
    if (safeSizeSquareMeters !== null) {
      updateFields.push('size_sqm = ?');
      queryParams.push(safeSizeSquareMeters);
    }
    if (safeAmenities !== null) {
      updateFields.push('amenities = ?');
      queryParams.push(safeAmenities);
    }
    // Only update images if explicitly provided (not undefined)
    if (images !== undefined && safeImages !== null) {
      updateFields.push('images = ?');
      queryParams.push(safeImages);
      console.log('📸 Images field will be updated:', safeImages);
    } else {
      console.log('📸 Images field will be preserved (not provided in update)');
    }
    if (safeType !== null) {
      updateFields.push('type = ?');
      queryParams.push(safeType);
    }
    
    // Always add updated_at and room ID
    updateFields.push('updated_at = NOW()');
    queryParams.push(roomId);
    
    if (updateFields.length === 1) { // Only updated_at field
      console.log('⚠️ No fields to update');
      return {
        success: false,
        message: 'ไม่มีข้อมูลที่ต้องอัปเดต'
      };
    }
    
    const sql = `UPDATE room_types SET ${updateFields.join(', ')} WHERE id = ?`;
    console.log('🔧 Dynamic SQL:', sql);
    console.log('🔧 Query parameters:', queryParams);
    
    await connection.execute(sql, queryParams);
    
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
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    return {
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัพเดทห้องพัก',
      error: error.message // Include error details in response
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
    console.log(`🔍 Checking active bookings for room ${roomId}...`);
    const [bookingCheck] = await connection.execute(
      'SELECT COUNT(*) as count FROM bookings WHERE room_type_id = ? AND status IN ("confirmed", "pending")',
      [roomId]
    );
    
    console.log(`📊 Active bookings count: ${bookingCheck[0].count}`);
    
    if (bookingCheck[0].count > 0) {
      console.log(`❌ Cannot delete room ${roomId}: has ${bookingCheck[0].count} active bookings`);
      
      // Get details of active bookings for better error message
      const [activeBookings] = await connection.execute(
        'SELECT id, check_in_date, check_out_date, status FROM bookings WHERE room_type_id = ? AND status IN ("confirmed", "pending") ORDER BY check_in_date',
        [roomId]
      );
      
      const bookingDetails = activeBookings.map(booking => {
        const checkIn = new Date(booking.check_in_date).toLocaleDateString('th-TH');
        const checkOut = new Date(booking.check_out_date).toLocaleDateString('th-TH');
        return `จอง #${booking.id} (${checkIn} - ${checkOut}) สถานะ: ${booking.status}`;
      }).join(', ');
      
      return {
        success: false,
        message: `ไม่สามารถลบห้องพักได้ เนื่องจากมีการจอง ${bookingCheck[0].count} รายการที่ยังไม่เสร็จสิ้น: ${bookingDetails}`
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

      case '/api/auth/register':
        setCorsHeaders(res);
        
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          
          req.on('end', async () => {
            try {
              const { email, password, firstName, lastName, phone } = JSON.parse(body);
              
              if (!email || !password || !firstName || !lastName) {
                sendJSON(res, 400, {
                  success: false,
                  message: 'กรุณากรอกข้อมูลให้ครบถ้วน'
                });
                return;
              }
              
              const result = await registerUser({
                email,
                password,
                firstName,
                lastName,
                phone: phone || null
              });
              
              sendJSON(res, result.success ? 201 : 400, result);
              
            } catch (error) {
              console.error('❌ Register endpoint error:', error);
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

      case '/api/rooms/availability':
        setCorsHeaders(res);
        
        if (req.method === 'GET') {
          try {
            const { room_type_id, check_in, check_out } = query;
            
            if (!room_type_id || !check_in || !check_out) {
              sendJSON(res, 400, {
                success: false,
                message: 'กรุณาระบุ room_type_id, check_in และ check_out'
              });
              return;
            }

            const availability = await checkRoomAvailability(
              parseInt(room_type_id),
              check_in,
              check_out
            );
            
            sendJSON(res, 200, {
              success: true,
              data: availability
            });
          } catch (error) {
            console.error('Error checking room availability:', error);
            sendJSON(res, 500, {
              success: false,
              message: 'เกิดข้อผิดพลาดในการตรวจสอบห้องว่าง'
            });
          }
        } else {
          sendJSON(res, 405, {
            success: false,
            message: 'Method not allowed'
          });
        }
        break;

      case '/api/room-types-with-images':
        console.log('📸 Fetching room types with images...');
        // Copy ทั้งหมดจาก /api/room-types แล้วเพิ่มข้อมูล hotel details
        const hotel_id_img = query.hotel_id ? parseInt(query.hotel_id) : null;
        const bed_type_filter = query.bed_type || null;
        
        // ใช้ raw SQL query เหมือน /api/room-types ที่ทำงานได้
        try {
          let roomQuery = `
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
              rt.bed_type,
              h.name as hotel_name
            FROM room_types rt
            LEFT JOIN hotels h ON rt.hotel_id = h.id
          `;
          
          let params = [];
          let whereConditions = [];
          
          if (hotel_id_img) {
            whereConditions.push('rt.hotel_id = ?');
            params.push(hotel_id_img);
          }
          
          if (bed_type_filter) {
            whereConditions.push('rt.bed_type = ?');
            params.push(bed_type_filter);
          }
          
          if (whereConditions.length > 0) {
            roomQuery += ' WHERE ' + whereConditions.join(' AND ');
          }
          
          roomQuery += ' ORDER BY rt.price_per_night ASC';
          
          const [rawRows] = await connection.execute(roomQuery, params);
          
          // เพิ่มข้อมูล hotel address และ description + process images
          const roomTypesWithDetails = await Promise.all(rawRows.map(async (room) => {
            try {
              // ดึงข้อมูล hotel เพิ่มเติม
              const [hotelRows] = await connection.execute(
                'SELECT address, description FROM hotels WHERE id = ?', 
                [room.hotel_id]
              );
              
              // Process images to flatten nested arrays and parse JSON strings
              let images = room.images || [];
              
              // Parse JSON string if it's a string
              if (typeof images === 'string' && images.trim()) {
                try {
                  images = JSON.parse(images);
                } catch (e) {
                  console.log('Failed to parse images JSON:', images);
                  // If it's a space-separated string, split it
                  images = images.split(' ').filter(img => img.trim());
                }
              }
              
              if (Array.isArray(images) && images.length > 0) {
                images = images.flat(3); // Flatten up to 3 levels deep
                images = images.filter(img => img && typeof img === 'string'); // Remove nulls and non-strings
              }
              
              return {
                ...room,
                images,
                hotel_address: hotelRows[0]?.address || '',
                hotel_description: hotelRows[0]?.description || ''
              };
            } catch (err) {
              console.error('Error fetching hotel details for room:', room.id, err);
              return {
                ...room,
                hotel_address: '',
                hotel_description: ''
              };
            }
          }));
          
          console.log(`🖼️ Raw room images sample:`, rawRows[0]?.images);
          console.log(`🖼️ Processed room images sample:`, roomTypesWithDetails[0]?.images);
          console.log(`🛏️ Applied filters:`, { hotel_id: hotel_id_img, bed_type: bed_type_filter });
          
          sendJSON(res, 200, {
            success: true,
            count: roomTypesWithDetails.length,
            data: roomTypesWithDetails,
            filter: { 
              hotel_id: hotel_id_img, 
              bed_type: bed_type_filter 
            }
          });
        } catch (error) {
          console.error('❌ Error fetching room types with images:', error);
          sendJSON(res, 500, {
            success: false,
            message: 'เกิดข้อผิดพลาดในการดึงข้อมูลห้องพัก'
          });
        }
        break;

      case '/api/check-room-availability':
        console.log('🔍 Checking room availability...');
        const check_in_date = query.check_in_date;
        const check_out_date = query.check_out_date;
        const bed_type_avail = query.bed_type || null;
        
        if (!check_in_date || !check_out_date) {
          sendJSON(res, 400, {
            success: false,
            message: 'กรุณาระบุวันที่เช็คอินและเช็คเอาท์'
          });
          break;
        }
        
        try {
          // ตรวจสอบการจองที่ซ้อนทับกับวันที่ที่ต้องการ
          let availabilityQuery = `
            SELECT DISTINCT rt.id, rt.hotel_id, rt.name, rt.description, rt.bed_type, rt.price_per_night, rt.max_guests, rt.size_sqm, rt.amenities, rt.images, rt.type
            FROM room_types rt
            WHERE rt.id NOT IN (
              SELECT DISTINCT COALESCE(b.room_type_id, 0)
              FROM bookings b 
              WHERE b.status != 'cancelled' 
              AND b.room_type_id IS NOT NULL
              AND (
                (b.check_in_date <= ? AND b.check_out_date > ?) OR
                (b.check_in_date < ? AND b.check_out_date >= ?) OR
                (b.check_in_date >= ? AND b.check_out_date <= ?)
              )
            )
          `;
          
          let availParams = [
            check_out_date, check_in_date,  // First condition
            check_out_date, check_in_date,  // Second condition  
            check_in_date, check_out_date   // Third condition
          ];
          
          // เพิ่มเงื่อนไขกรองตามประเภทเตียงถ้ามี
          if (bed_type_avail) {
            availabilityQuery += ' AND rt.bed_type = ?';
            availParams.push(bed_type_avail);
          }
          
          availabilityQuery += ' ORDER BY rt.price_per_night ASC';
          
          const [availableRooms] = await connection.execute(availabilityQuery, availParams);
          
          // เพิ่มข้อมูล hotel details และ process images สำหรับแต่ละห้อง
          const roomsWithFullDetails = await Promise.all(availableRooms.map(async (room) => {
            try {
              // ดึงข้อมูล hotel เพิ่มเติม
              const [hotelRows] = await connection.execute(
                'SELECT address, description FROM hotels WHERE id = ?', 
                [room.hotel_id]
              );
              
              // Process images to flatten nested arrays and parse JSON strings
              let images = room.images || [];
              
              // Parse JSON string if it's a string
              if (typeof images === 'string' && images.trim()) {
                try {
                  images = JSON.parse(images);
                } catch (e) {
                  console.log('Failed to parse images JSON:', images);
                  // If it's a space-separated string, split it
                  images = images.split(' ').filter(img => img.trim());
                }
              }
              
              if (Array.isArray(images) && images.length > 0) {
                images = images.flat(3); // Flatten up to 3 levels deep
                images = images.filter(img => img && typeof img === 'string'); // Remove nulls and non-strings
              }
              
              return {
                ...room,
                images,
                hotel_address: hotelRows[0]?.address || '',
                hotel_description: hotelRows[0]?.description || ''
              };
            } catch (err) {
              console.error('Error fetching hotel details for room:', room.id, err);
              return {
                ...room,
                images: room.images || [],
                hotel_address: '',
                hotel_description: ''
              };
            }
          }));
          
          console.log(`📅 Checking availability for ${check_in_date} to ${check_out_date}`);
          console.log(`🛏️ Available rooms found: ${availableRooms.length}`);
          console.log(`🖼️ Sample room with images:`, roomsWithFullDetails[0]?.images);
          console.log(`🏨 Sample room full data:`, roomsWithFullDetails[0] ? {
            id: roomsWithFullDetails[0].id,
            name: roomsWithFullDetails[0].name,
            bed_type: roomsWithFullDetails[0].bed_type,
            images_count: roomsWithFullDetails[0].images?.length || 0
          } : 'No rooms available');
          
          sendJSON(res, 200, {
            success: true,
            count: roomsWithFullDetails.length,
            data: roomsWithFullDetails,
            filters: {
              check_in_date,
              check_out_date,
              bed_type: bed_type_avail
            }
          });
        } catch (error) {
          console.error('❌ Error checking room availability:', error);
          sendJSON(res, 500, {
            success: false,
            message: 'เกิดข้อผิดพลาดในการตรวจสอบความพร้อมของห้องพัก'
          });
        }
        break;

      case '/api/test-room-types':
        // Endpoint ทดสอบเพื่อดูข้อมูลดิบจาก getRoomTypes
        const testRoomTypes = await getRoomTypes(null);
        console.log('🔍 Raw data from getRoomTypes:', JSON.stringify(testRoomTypes, null, 2));
        sendJSON(res, 200, {
          success: true,
          data: testRoomTypes,
          rawData: true
        });
        break;

      case '/api/admin/payment-settings':
        setCorsHeaders(res);
        // Add no-cache headers to prevent caching of payment settings
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        if (req.method === 'GET') {
          try {
            const paymentSettings = await getPaymentSettings();
            sendJSON(res, 200, {
              success: true,
              data: {
                bankTransfer: {
                  enabled: true,
                  bankName: paymentSettings.bank_name || 'ธนาคารกสิกรไทย',
                  accountNumber: paymentSettings.bank_account || '123-456-7890',
                  accountName: paymentSettings.account_name || 'Hotel Booking System'
                },
                promptPay: {
                  enabled: true,
                  phoneNumber: paymentSettings.phone_number || '081-234-5678',
                  qrCodeUrl: paymentSettings.qr_code_url || '/uploads/qr-code.jpg'
                }
              }
            });
          } catch (error) {
            console.error('Error fetching admin payment settings:', error);
            sendJSON(res, 500, {
              success: false,
              message: 'Failed to fetch payment settings'
            });
          }
        } else if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          
          req.on('end', async () => {
            try {
              console.log('📝 Payment settings POST body:', body);
              const { settings } = JSON.parse(body);
              console.log('🔧 Parsed settings:', settings);
              
              // Get current settings for comparison
              const currentSettings = await getPaymentSettings();
              
              // Update payment settings in database
              const updates = {};
              const changes = [];
              
              // Bank Transfer Settings
              if (settings.bankTransfer && settings.bankTransfer.bankName !== undefined) {
                const oldValue = currentSettings.bank_name;
                const newValue = settings.bankTransfer.bankName;
                if (oldValue !== newValue) {
                  updates.bank_name = newValue;
                  changes.push({
                    type: 'bank_transfer',
                    field: 'bank_name',
                    oldValue,
                    newValue,
                    description: `เปลี่ยนชื่อธนาคารจาก "${oldValue}" เป็น "${newValue}"`
                  });
                }
              }
              if (settings.bankTransfer && settings.bankTransfer.accountNumber !== undefined) {
                const oldValue = currentSettings.bank_account;
                const newValue = settings.bankTransfer.accountNumber;
                if (oldValue !== newValue) {
                  updates.bank_account = newValue;
                  changes.push({
                    type: 'bank_transfer',
                    field: 'bank_account',
                    oldValue,
                    newValue,
                    description: `เปลี่ยนเลขบัญชีจาก "${oldValue}" เป็น "${newValue}"`
                  });
                }
              }
              if (settings.bankTransfer && settings.bankTransfer.accountName !== undefined) {
                const oldValue = currentSettings.account_name;
                const newValue = settings.bankTransfer.accountName;
                if (oldValue !== newValue) {
                  updates.account_name = newValue;
                  changes.push({
                    type: 'bank_transfer',
                    field: 'account_name',
                    oldValue,
                    newValue,
                    description: `เปลี่ยนชื่อบัญชีจาก "${oldValue}" เป็น "${newValue}"`
                  });
                }
              }
              
              // PromptPay Settings
              if (settings.promptPay && settings.promptPay.phoneNumber !== undefined) {
                const oldValue = currentSettings.phone_number;
                const newValue = settings.promptPay.phoneNumber;
                if (oldValue !== newValue) {
                  updates.phone_number = newValue;
                  changes.push({
                    type: 'promptpay',
                    field: 'phone_number',
                    oldValue,
                    newValue,
                    description: `เปลี่ยนเบอร์ PromptPay จาก "${oldValue}" เป็น "${newValue}"`
                  });
                }
              }
              
              console.log('💾 Updates to apply:', updates);
              console.log('📋 Changes detected:', changes.length);
              
              if (Object.keys(updates).length > 0) {
                await updatePaymentSettings(updates);
                
                // Log each change
                const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
                const userAgent = req.headers['user-agent'];
                
                for (const change of changes) {
                  await logPaymentSettingsChange(
                    1, // admin_user_id - should get from auth token in real app
                    'admin@hotel.com', // admin_email - should get from auth token
                    'Admin User', // admin_name - should get from auth token
                    change.type,
                    change.field,
                    change.oldValue,
                    change.newValue,
                    change.description,
                    ipAddress,
                    userAgent
                  );
                }
                
                console.log(`✅ Logged ${changes.length} payment settings changes`);
              }
              
              sendJSON(res, 200, {
                success: true,
                message: 'Payment settings updated successfully',
                changesLogged: changes.length
              });
              
            } catch (error) {
              console.error('Error updating admin payment settings:', error);
              sendJSON(res, 500, {
                success: false,
                message: 'Failed to update payment settings'
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

      case '/api/notifications':
        setCorsHeaders(res);
        
        if (req.method === 'GET') {
          try {
            const limit = parseInt(query.limit) || 10;
            const offset = parseInt(query.offset) || 0;
            const userId = query.user_id || null;
            const unreadOnly = query.unread_only === 'true';
            const adminOnly = query.admin_only === 'true';
            const createdAfter = query.created_after || null;
            
            const notifications = await getNotifications(limit, offset, userId, unreadOnly, adminOnly, createdAfter);
            
            sendJSON(res, 200, {
              success: true,
              count: notifications.length,
              notifications: notifications // ใช้ notifications แทน data เพื่อให้เหมือนกับหน้าหลัก
            });
          } catch (error) {
            console.error('Error fetching notifications:', error);
            sendJSON(res, 500, {
              success: false,
              message: 'Failed to fetch notifications'
            });
          }
        } else if (req.method === 'PUT') {
          // Mark notification as read
          try {
            const body = await getRequestBody(req);
            const { id, read_status } = JSON.parse(body);
            
            if (!id) {
              sendJSON(res, 400, {
                success: false,
                message: 'Notification ID is required'
              });
              return;
            }
            
            const result = await markNotificationAsRead(id, read_status);
            
            sendJSON(res, 200, {
              success: true,
              message: 'Notification updated successfully',
              data: result
            });
          } catch (error) {
            console.error('Error updating notification:', error);
            sendJSON(res, 500, {
              success: false,
              message: 'Failed to update notification'
            });
          }
        } else if (req.method === 'POST') {
          // Create new notification
          try {
            const notificationData = await getRequestBody(req);
            
            if (!notificationData.title || !notificationData.message) {
              sendJSON(res, 400, {
                success: false,
                message: 'Title and message are required'
              });
              return;
            }
            
            const result = await createNotification(notificationData);
            
            sendJSON(res, 201, {
              success: true,
              message: 'Notification created successfully',
              data: { id: result.insertId }
            });
          } catch (error) {
            console.error('Error creating notification:', error);
            sendJSON(res, 500, {
              success: false,
              message: 'Failed to create notification'
            });
          }
        } else {
          sendJSON(res, 405, {
            success: false,
            message: 'Method not allowed'
          });
        }
        break;

      case '/api/payment-settings-changes':
        setCorsHeaders(res);
        
        if (req.method === 'GET') {
          try {
            const limit = parseInt(query.limit) || 10;
            const offset = parseInt(query.offset) || 0;
            const sinceDate = query.since || null;
            
            let changes;
            if (sinceDate) {
              changes = await getLatestPaymentSettingsChanges(sinceDate);
            } else {
              changes = await getPaymentSettingsChangeLogs(limit, offset);
            }
            
            sendJSON(res, 200, {
              success: true,
              count: changes.length,
              data: changes
            });
          } catch (error) {
            console.error('Error fetching payment settings changes:', error);
            sendJSON(res, 500, {
              success: false,
              message: 'Failed to fetch payment settings changes'
            });
          }
        } else {
          sendJSON(res, 405, {
            success: false,
            message: 'Method not allowed'
          });
        }
        break;

      case '/api/notifications/unread-count':
        setCorsHeaders(res);
        
        if (req.method === 'GET') {
          try {
            const userId = query.user_id || null;
            const adminOnly = query.admin_only === 'true';
            const count = await getUnreadNotificationsCount(userId, adminOnly);
            
            sendJSON(res, 200, {
              success: true,
              unreadCount: count
            });
          } catch (error) {
            console.error('Error fetching unread notifications count:', error);
            sendJSON(res, 500, {
              success: false,
              message: 'Failed to fetch unread notifications count'
            });
          }
        } else {
          sendJSON(res, 405, {
            success: false,
            message: 'Method not allowed'
          });
        }
        break;

      case '/api/notifications/read-all':
        setCorsHeaders(res);
        
        if (req.method === 'PUT') {
          try {
            // Get user from authorization header
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
              sendJSON(res, 401, {
                success: false,
                message: 'Authorization header required'
              });
              return;
            }

            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            const userId = decoded.id;

            // Mark all unread notifications as read for this user
            const [result] = await connection.execute(`
              UPDATE notifications 
              SET read_status = TRUE, updated_at = NOW()
              WHERE user_id = ? AND read_status = FALSE
            `, [userId]);

            console.log(`✅ Marked ${result.affectedRows} notifications as read for user ${userId}`);

            sendJSON(res, 200, {
              success: true,
              message: 'All notifications marked as read',
              updatedCount: result.affectedRows
            });
          } catch (error) {
            console.error('❌ Error marking all notifications as read:', error);
            sendJSON(res, 500, {
              success: false,
              message: 'Failed to mark notifications as read'
            });
          }
        } else {
          sendJSON(res, 405, {
            success: false,
            message: 'Method not allowed'
          });
        }
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

      case '/api/simple-payment-settings/qr-upload':
        setCorsHeaders(res);
        
        if (req.method === 'POST') {
          console.log('📸 QR upload request received');
          console.log('Content-Type:', req.headers['content-type']);
          
          try {
            const bb = busboy({ headers: req.headers });
            let fileBuffer = null;
            let filename = null;
            let fieldName = null;

            bb.on('file', (name, file, info) => {
              console.log('📁 File received:', { name, filename: info.filename, mimetype: info.mimeType });
              fieldName = name;
              filename = info.filename;
              
              const chunks = [];
              file.on('data', (chunk) => {
                chunks.push(chunk);
              });
              
              file.on('end', () => {
                fileBuffer = Buffer.concat(chunks);
                console.log('📦 File buffer size:', fileBuffer.length);
              });
            });

            bb.on('finish', async () => {
              console.log('✅ Busboy parsing complete');
              
              if (!fileBuffer || !filename) {
                return sendJSON(res, 400, {
                  success: false,
                  message: 'No file uploaded'
                });
              }

              try {
                // Save file manually
                const uploadDir = path.join(__dirname, 'uploads', 'qr-codes');
                if (!fs.existsSync(uploadDir)) {
                  fs.mkdirSync(uploadDir, { recursive: true });
                }

                const fileExtension = path.extname(filename);
                const savedFilename = 'qr-code' + fileExtension;
                const filePath = path.join(uploadDir, savedFilename);
                
                fs.writeFileSync(filePath, fileBuffer);
                console.log('💾 File saved:', filePath);

                // Update database
                const qrUrl = `/uploads/qr-codes/${savedFilename}`;
                await updatePaymentSettings({
                  qr_code_url: qrUrl
                });

                console.log('✅ QR Code uploaded successfully:', qrUrl);

                sendJSON(res, 200, {
                  success: true,
                  message: 'QR Code uploaded successfully',
                  data: {
                    qrCodeUrl: qrUrl,
                    filename: savedFilename
                  }
                });

              } catch (error) {
                console.error('💥 Save/DB error:', error);
                sendJSON(res, 500, {
                  success: false,
                  message: 'Failed to save QR code'
                });
              }
            });

            bb.on('error', (err) => {
              console.error('🚫 Busboy error:', err);
              sendJSON(res, 400, {
                success: false,
                message: 'Failed to parse upload data'
              });
            });

            req.pipe(bb);

          } catch (error) {
            console.error('💥 QR upload setup error:', error);
            sendJSON(res, 500, {
              success: false,
              message: 'Failed to setup upload handler'
            });
          }
        } else {
          sendJSON(res, 405, {
            success: false,
            message: 'Method not allowed'
          });
        }
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
              
              // ตรวจสอบห้องว่างก่อนสร้างการจอง
              const availability = await checkRoomAvailability(
                bookingData.room_type_id, 
                bookingData.check_in_date, 
                bookingData.check_out_date
              );
              
              if (!availability.isAvailable) {
                sendJSON(res, 400, {
                  success: false,
                  message: 'ห้องไม่ว่างในช่วงเวลาที่เลือก กรุณาเลือกวันที่อื่น',
                  error: 'ROOM_NOT_AVAILABLE',
                  availability: availability
                });
                return;
              }
              
              const booking = await createBooking(bookingData);
              
              if (booking) {
                // สร้างการแจ้งเตือนเมื่อมีการจองใหม่ (สำหรับแอดมิน)
                await createSystemNotification('new_booking', booking.id, 'booking');
                
                // สร้างการแจ้งเตือนสำหรับผู้จอง
                await createBookingNotification({
                  ...booking,
                  room_name: bookingData.room_name || 'ห้องพัก',
                  guests: bookingData.guests || 1
                });
                
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

      case '/api/users/profile':
        setCorsHeaders(res);
        
        if (req.method === 'GET') {
          // GET /api/users/profile - Get current user profile
          try {
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token) {
              return sendJSON(res, 401, {
                success: false,
                message: 'ไม่พบ Token การยืนยันตัวตน'
              });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hotel-booking-secret');
            const userId = decoded.id || decoded.userId;

            const [users] = await connection.execute(
              'SELECT id, email, first_name, last_name, phone, address, national_id, role, created_at, updated_at FROM users WHERE id = ?',
              [userId]
            );

            if (users.length === 0) {
              return sendJSON(res, 404, {
                success: false,
                message: 'ไม่พบข้อมูลผู้ใช้'
              });
            }

            sendJSON(res, 200, {
              success: true,
              data: users[0]
            });
          } catch (error) {
            console.error('❌ Get profile error:', error);
            sendJSON(res, 500, {
              success: false,
              message: 'เกิดข้อผิดพลาดในการดึงข้อมูลโปรไฟล์'
            });
          }
        } else if (req.method === 'PUT') {
          // PUT /api/users/profile - Update current user profile
          try {
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token) {
              return sendJSON(res, 401, {
                success: false,
                message: 'ไม่พบ Token การยืนยันตัวตน'
              });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hotel-booking-secret');
            const userId = decoded.id || decoded.userId;

            const body = await getRequestBody(req);
            
            // Support both direct body format and nested profile format
            const profileData = body.profile || body;
            const { 
              first_name, 
              last_name, 
              email, 
              phone, 
              address, 
              national_id,
              firstName,
              lastName,
              nationalId
            } = profileData;

            // Use either snake_case or camelCase fields
            const finalFirstName = first_name || firstName;
            const finalLastName = last_name || lastName;
            const finalPhone = phone;
            const finalAddress = address;
            const finalNationalId = national_id || nationalId;

            console.log(`👤 Updating user profile: ${userId}`);
            console.log(`📦 Raw body:`, JSON.stringify(body, null, 2));
            console.log(`📊 Profile data:`, JSON.stringify(profileData, null, 2));
            console.log(`📝 Final extracted data:`, {
              firstName: finalFirstName,
              lastName: finalLastName,
              phone: finalPhone,
              address: finalAddress,
              nationalId: finalNationalId
            });
            console.log(`🔍 Field check:`, {
              'body.profile': !!body.profile,
              'profileData.firstName': profileData.firstName,
              'profileData.first_name': profileData.first_name,
              'profileData.nationalId': profileData.nationalId,
              'profileData.national_id': profileData.national_id
            });

            // Get current user data first
            const [currentUser] = await connection.execute(
              'SELECT email FROM users WHERE id = ?',
              [userId]
            );

            if (currentUser.length === 0) {
              return sendJSON(res, 404, {
                success: false,
                message: 'ไม่พบข้อมูลผู้ใช้'
              });
            }

            // Update user profile - only update provided fields including national_id
            const updateQuery = `
              UPDATE users 
              SET first_name = ?, last_name = ?, phone = ?, 
                  address = ?, national_id = ?, updated_at = NOW()
              WHERE id = ?
            `;
            
            const sqlValues = [
              finalFirstName || null, finalLastName || null, finalPhone || null, 
              finalAddress || null, finalNationalId || null, userId
            ];
            
            console.log(`🔄 Executing SQL update with values:`, sqlValues);
            console.log(`📋 SQL Query:`, updateQuery);
            
            const updateResult = await connection.execute(updateQuery, sqlValues);
            
            console.log(`✅ SQL Update result:`, {
              affectedRows: updateResult.affectedRows,
              changedRows: updateResult.changedRows,
              insertId: updateResult.insertId
            });

            // Get updated user including national_id
            const [updatedUsers] = await connection.execute(
              'SELECT id, email, first_name, last_name, phone, address, national_id, role, created_at, updated_at FROM users WHERE id = ?',
              [userId]
            );

            console.log(`🔍 Updated user data from database:`, updatedUsers[0]);

            sendJSON(res, 200, {
              success: true,
              message: 'อัปเดตข้อมูลโปรไฟล์เรียบร้อยแล้ว',
              data: updatedUsers[0]
            });
          } catch (error) {
            console.error('❌ Update profile error:', error);
            sendJSON(res, 500, {
              success: false,
              message: 'เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์'
            });
          }
        }
        break;

      case '/api/admin/bookings/detailed':
        if (req.method === 'GET') {
          try {
            setCorsHeaders(res);
            const userId = query.user_id;
            const date = query.date;
            console.log('🔍 Admin requesting detailed bookings for user:', userId || 'all users', 'date:', date || 'all dates');
            
            const detailedBookings = await getDetailedBookingsForAdmin(
              userId ? parseInt(userId) : null, 
              date || null
            );
            
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

      case '/api/admin/reports':
        if (req.method === 'GET') {
          try {
            setCorsHeaders(res);
            
            const reportType = query.type || 'financial';
            const period = query.period || 'monthly';
            const startDate = query.start_date || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
            const endDate = query.end_date || new Date().toISOString().split('T')[0];
            
            console.log(`📊 Fetching ${reportType} reports for ${period} period: ${startDate} to ${endDate}`);
            
            let reportData = {};
            
            if (reportType === 'financial') {
              // Financial report - simplified version
              try {
                const [summary] = await connection.execute(`
                  SELECT 
                    COUNT(*) as total_bookings,
                    SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_bookings,
                    SUM(CASE WHEN status = 'confirmed' THEN CAST(total_price AS DECIMAL(10,2)) ELSE 0 END) as total_revenue,
                    AVG(CASE WHEN status = 'confirmed' THEN CAST(total_price AS DECIMAL(10,2)) ELSE NULL END) as avg_booking_value
                  FROM bookings 
                  WHERE DATE(created_at) BETWEEN ? AND ?
                `, [startDate, endDate]);
                
                reportData.summary = summary[0] || {
                  total_bookings: 0,
                  confirmed_bookings: 0,
                  total_revenue: 0,
                  avg_booking_value: 0
                };
                
                console.log('📊 Financial summary:', reportData.summary);
                
              } catch (error) {
                console.error('❌ Financial report error:', error);
                reportData.summary = {
                  total_bookings: 0,
                  confirmed_bookings: 0,
                  total_revenue: 0,
                  avg_booking_value: 0
                };
              }
            }
            
            if (reportType === 'occupancy') {
              // Occupancy report - simplified version
              try {
                const [dailyOccupancy] = await connection.execute(`
                  SELECT 
                    DATE(check_in_date) as date,
                    COUNT(*) as total_bookings,
                    SUM(CAST(guests AS SIGNED)) as total_guests
                  FROM bookings 
                  WHERE status = 'confirmed' 
                  AND check_in_date IS NOT NULL
                  AND DATE(check_in_date) BETWEEN ? AND ?
                  GROUP BY DATE(check_in_date)
                  ORDER BY DATE(check_in_date) DESC
                `, [startDate, endDate]);
                
                reportData.daily_occupancy = dailyOccupancy || [];
                console.log('🏨 Occupancy data:', reportData.daily_occupancy);
                
              } catch (error) {
                console.error('❌ Occupancy report error:', error);
                reportData.daily_occupancy = [];
              }
            }
            
            sendJSON(res, 200, {
              success: true,
              data: reportData,
              filters: {
                type: reportType,
                period: period,
                start_date: startDate,
                end_date: endDate
              }
            });
          } catch (error) {
            console.error('❌ Error fetching reports:', error);
            setCorsHeaders(res);
            sendJSON(res, 500, { 
              success: false, 
              message: 'เกิดข้อผิดพลาดในการดึงข้อมูลรายงาน' 
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

      case '/api/admin/users':
        setCorsHeaders(res);
        
        if (req.method === 'GET') {
          try {
            console.log('🔍 Admin users GET request received');
            
            // Get query parameters for pagination and search
            const page = parseInt(query.page) || 1;
            const limit = parseInt(query.limit) || 10;
            const search = query.search || '';
            const offset = (page - 1) * limit;
            
            console.log(`👥 Fetching users - Page: ${page}, Limit: ${limit}, Search: "${search}"`);
            console.log('🔧 About to execute MySQL queries...');
            
            // Build search query
            let whereClause = '';
            let searchParams = [];
            
            if (search.trim()) {
              whereClause = 'WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ?';
              const searchTerm = `%${search.trim()}%`;
              searchParams = [searchTerm, searchTerm, searchTerm];
            }
            
            console.log('🔍 Count query:', `SELECT COUNT(*) as total FROM users ${whereClause}`);
            console.log('🔍 Search params:', searchParams);
            
            // Get total count
            const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
            const [countResult] = await connection.execute(countQuery, searchParams);
            const total = countResult[0].total;
            
            console.log('✅ Count result:', total);
            
            // Get users with pagination
            const usersQuery = `
              SELECT 
                id, 
                email, 
                first_name, 
                last_name, 
                phone, 
                role, 
                created_at, 
                updated_at 
              FROM users 
              ${whereClause}
              ORDER BY created_at DESC 
              LIMIT ${limit} OFFSET ${offset}
            `;
            
            console.log('🔍 Users query:', usersQuery);
            console.log('🔍 Query params:', [...searchParams]);
            
            const [users] = await connection.execute(usersQuery, searchParams);
            
            console.log('✅ Users result count:', users.length);
            
            // Calculate pagination info
            const totalPages = Math.ceil(total / limit);
            const hasNext = page < totalPages;
            const hasPrev = page > 1;
            
            sendJSON(res, 200, {
              success: true,
              users: users,
              pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext,
                hasPrev
              },
              search: search
            });
            
          } catch (error) {
            console.error('❌ Error fetching users:', error);
            sendJSON(res, 500, {
              success: false,
              message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้'
            });
          }
        } else if (req.method === 'POST') {
          // Create new user
          try {
            const body = await getRequestBody(req);
            const { email, password, first_name, last_name, phone, role = 'guest' } = body;
            
            console.log(`👤 Creating new user: ${email}`);
            
            // Validate required fields
            if (!email || !password || !first_name || !last_name) {
              return sendJSON(res, 400, {
                success: false,
                message: 'กรุณากรอกข้อมูลที่จำเป็น: อีเมล, รหัสผ่าน, ชื่อ, นามสกุล'
              });
            }
            
            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Insert new user
            const insertQuery = `
              INSERT INTO users (email, password, first_name, last_name, phone, role, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
            `;
            
            const [result] = await connection.execute(insertQuery, [
              email, hashedPassword, first_name, last_name, phone || null, role
            ]);
            
            // Get the created user
            const [newUser] = await connection.execute(
              'SELECT id, email, first_name, last_name, phone, role, created_at FROM users WHERE id = ?',
              [result.insertId]
            );
            
            sendJSON(res, 201, {
              success: true,
              message: 'สร้างผู้ใช้ใหม่เรียบร้อยแล้ว',
              data: newUser[0]
            });
            
          } catch (error) {
            console.error('❌ Error creating user:', error);
            if (error.code === 'ER_DUP_ENTRY') {
              sendJSON(res, 409, {
                success: false,
                message: 'อีเมลนี้มีอยู่ในระบบแล้ว'
              });
            } else {
              sendJSON(res, 500, {
                success: false,
                message: 'เกิดข้อผิดพลาดในการสร้างผู้ใช้ใหม่'
              });
            }
          }
        } else {
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
          setCorsHeaders(res);
          
          try {
            console.log('🧾 Processing payment slip upload...');
            
            const bb = busboy({ headers: req.headers });
            let fields = {};
            let fileData = null;
            let fileName = '';
            let originalName = '';
            let fileSize = 0;

            bb.on('field', (fieldname, val) => {
              fields[fieldname] = val;
              console.log(`📝 Field: ${fieldname} = ${val}`);
            });

            bb.on('file', (fieldname, file, info) => {
              const { filename, mimeType } = info;
              originalName = filename;
              
              // Generate unique filename
              const timestamp = Date.now();
              const randomId = Math.floor(Math.random() * 1000000);
              const fileExtension = path.extname(filename);
              fileName = `payment-slip-${timestamp}-${randomId}${fileExtension}`;
              
              console.log(`📁 Receiving file: ${originalName} -> ${fileName}`);
              
              const chunks = [];
              file.on('data', (chunk) => {
                chunks.push(chunk);
                fileSize += chunk.length;
              });
              
              file.on('end', () => {
                fileData = Buffer.concat(chunks);
                console.log(`✅ File received: ${fileSize} bytes`);
              });
            });

            bb.on('finish', async () => {
              try {
                if (!fileData) {
                  throw new Error('No file data received');
                }

                // Save file to uploads directory
                const uploadDir = path.join(__dirname, 'uploads');
                if (!fs.existsSync(uploadDir)) {
                  fs.mkdirSync(uploadDir, { recursive: true });
                }
                
                const filePath = path.join(uploadDir, fileName);
                fs.writeFileSync(filePath, fileData);
                console.log(`💾 File saved: ${filePath}`);

                // Debug: Show all received fields
                console.log('🔍 All received fields:', JSON.stringify(fields, null, 2));
                console.log('🔍 booking_id value:', fields.booking_id, 'type:', typeof fields.booking_id);
                console.log('🔍 user_id value:', fields.user_id, 'type:', typeof fields.user_id);
                console.log('🔍 amount value:', fields.amount, 'type:', typeof fields.amount);

                // Save to database
                const insertQuery = `
                  INSERT INTO payment_slips 
                  (booking_id, user_id, file_name, original_name, file_path, file_size, amount, payment_date, status) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 'pending')
                `;

                const insertParams = [
                  (fields.booking_id || fields.bookingId) ? parseInt(fields.booking_id || fields.bookingId) : null,
                  fields.user_id ? parseInt(fields.user_id) : null,
                  fileName,
                  originalName,
                  fileName, // file_path without /uploads/ prefix
                  fileSize,
                  fields.amount ? parseFloat(fields.amount) : null
                ];

                console.log('🔍 Insert parameters:', JSON.stringify(insertParams, null, 2));

                const [result] = await connection.execute(insertQuery, insertParams);

                console.log(`✅ Payment slip saved to database with ID: ${result.insertId}`);

                sendJSON(res, 200, {
                  success: true,
                  message: 'Payment slip uploaded successfully',
                  data: {
                    id: result.insertId,
                    file_path: fileName,
                    file_name: fileName,
                    original_name: originalName,
                    file_size: fileSize,
                    booking_id: fields.booking_id,
                    amount: fields.amount,
                    status: 'pending'
                  }
                });

              } catch (error) {
                console.error('❌ Error saving payment slip:', error);
                sendJSON(res, 500, {
                  success: false,
                  error: 'Failed to save payment slip: ' + error.message
                });
              }
            });

            bb.on('error', (error) => {
              console.error('❌ Busboy error:', error);
              sendJSON(res, 500, {
                success: false,
                error: 'File upload error: ' + error.message
              });
            });

            req.pipe(bb);

          } catch (error) {
            console.error('❌ Payment slip upload error:', error);
            sendJSON(res, 500, {
              success: false,
              error: 'Upload processing failed: ' + error.message
            });
          }
        } else {
          setCorsHeaders(res);
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

      case '/api/room-statistics':
        setCorsHeaders(res);
        if (req.method === 'GET') {
          try {
            console.log('🏨 Fetching room statistics...');
            
            // Get date from query parameter or use today
            const targetDate = query.date || new Date().toISOString().split('T')[0];
            console.log('📅 Fetching statistics for date:', targetDate);
            
            // Get total rooms by type
            const [roomTypeStats] = await connection.execute(`
              SELECT 
                rt.name as room_type_name,
                rt.bed_type,
                SUM(rt.quantity) as total_rooms,
                rt.price_per_night,
                rt.max_guests
              FROM room_types rt 
              GROUP BY rt.name, rt.bed_type, rt.price_per_night, rt.max_guests
              ORDER BY rt.name
            `);
            
            // Get bookings stats for selected date
            const [dateBookings] = await connection.execute(`
              SELECT 
                COUNT(*) as total_bookings,
                COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bookings,
                COUNT(CASE WHEN check_in_date = ? THEN 1 END) as checkin_today,
                COUNT(CASE WHEN check_out_date = ? THEN 1 END) as checkout_today
              FROM bookings 
              WHERE status IN ('confirmed', 'pending', 'completed')
            `, [targetDate, targetDate]);
            
            // Get occupied rooms for selected date
            const [occupiedRooms] = await connection.execute(`
              SELECT COUNT(*) as occupied_rooms
              FROM bookings 
              WHERE status IN ('confirmed', 'completed')
              AND check_in_date <= ? 
              AND check_out_date > ?
            `, [targetDate, targetDate]);
            
            // Get revenue for selected date 
            const [revenueData] = await connection.execute(`
              SELECT 
                COALESCE(SUM(CASE WHEN b.check_in_date = ? THEN b.total_price END), 0) as daily_revenue,
                COUNT(CASE WHEN b.check_in_date = ? THEN 1 END) as checkin_count,
                COALESCE(SUM(CASE WHEN b.check_in_date = ? THEN b.total_price END), 0) as checkin_revenue
              FROM bookings b
              WHERE b.status IN ('confirmed', 'completed')
            `, [targetDate, targetDate, targetDate]);
            
            // Calculate totals
            const totalRooms = roomTypeStats.reduce((sum, room) => sum + room.total_rooms, 0);
            const occupiedCount = occupiedRooms[0]?.occupied_rooms || 0;
            const availableRooms = Math.max(0, totalRooms - occupiedCount);
            
            const bookingStats = dateBookings[0];
            const revenue = revenueData[0];
            
            const statistics = {
              rooms: {
                total: totalRooms,
                occupied: occupiedCount,
                available: availableRooms,
                occupancy_rate: totalRooms > 0 ? Math.round((occupiedCount / totalRooms) * 100) : 0
              },
              bookings: {
                total: bookingStats.total_bookings || 0,
                confirmed: bookingStats.confirmed_bookings || 0,
                pending: bookingStats.pending_bookings || 0,
                checkin_today: bookingStats.checkin_today || 0,
                checkout_today: bookingStats.checkout_today || 0
              },
              revenue: {
                daily_total: parseFloat(revenue.daily_revenue || 0),
                checkin_revenue: parseFloat(revenue.checkin_revenue || 0),
                checkin_count: revenue.checkin_count || 0
              },
              room_types: roomTypeStats,
              date: targetDate
            };
            
            console.log('📊 Room statistics generated:', {
              date: targetDate,
              totalRooms,
              availableRooms,
              occupiedCount,
              bookingsTotal: bookingStats.total_bookings,
              dailyRevenue: revenue.daily_revenue
            });
            
            sendJSON(res, 200, {
              success: true,
              data: statistics
            });
            
          } catch (error) {
            console.error('❌ Error fetching room statistics:', error);
            sendJSON(res, 500, {
              success: false,
              message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสถิติห้องพัก'
            });
          }
        } else {
          sendJSON(res, 405, {
            success: false,
            message: 'Method not allowed'
          });
        }
        break;

      case '/api/contact-settings':
        setCorsHeaders(res);
        if (req.method === 'GET') {
          // GET contact settings
          try {
            console.log('📞 Getting contact settings...');
            
            const [settings] = await connection.execute(`
              SELECT setting_key, setting_value 
              FROM contact_settings
            `);
            
            // Convert array to object
            const contactData = {};
            settings.forEach(setting => {
              contactData[setting.setting_key] = setting.setting_value;
            });
            
            // Set defaults if no data found
            const defaultData = {
              phone: '02-123-4567',
              email: 'support@hotel.com',
              address: '',
              website: '',
              facebook: '',
              line: ''
            };
            
            const finalData = { ...defaultData, ...contactData };
            
            sendJSON(res, 200, {
              success: true,
              data: finalData
            });
            
          } catch (error) {
            console.error('❌ Error fetching contact settings:', error);
            
            // Return default data if database error
            sendJSON(res, 200, {
              success: true,
              data: {
                phone: '02-123-4567',
                email: 'support@hotel.com',
                address: '',
                website: '',
                facebook: '',
                line: ''
              }
            });
          }
        } else if (req.method === 'PUT') {
          // UPDATE contact settings
          let body = '';
          
          req.on('data', chunk => {
            body += chunk.toString();
          });
          
          req.on('end', async () => {
            try {
              const contactData = JSON.parse(body);
              console.log('📞 Updating contact settings:', contactData);
              
              // Update each setting
              for (const [key, value] of Object.entries(contactData)) {
                await connection.execute(`
                  INSERT INTO contact_settings (setting_key, setting_value)
                  VALUES (?, ?)
                  ON DUPLICATE KEY UPDATE 
                  setting_value = VALUES(setting_value)
                `, [key, value]);
              }
              
              sendJSON(res, 200, {
                success: true,
                message: 'อัปเดตข้อมูลติดต่อเรียบร้อยแล้ว',
                data: contactData
              });
              
            } catch (error) {
              console.error('❌ Error updating contact settings:', error);
              console.error('❌ Error details:', error.message);
              console.error('❌ Error stack:', error.stack);
              if (error instanceof SyntaxError) {
                sendJSON(res, 400, {
                  success: false,
                  message: 'รูปแบบข้อมูล JSON ไม่ถูกต้อง'
                });
              } else {
                sendJSON(res, 500, {
                  success: false,
                  message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลติดต่อ: ' + error.message
                });
              }
            }
          });
        } else {
          sendJSON(res, 405, {
            success: false,
            message: 'Method not allowed'
          });
        }
        break;

      default:
        // Handle dynamic routes
        // Handle booking status updates
        console.log('🔍 Checking path for booking status update:', normalizedPathname);
        if (normalizedPathname.match(/^\/api\/bookings\/\d+\/status$/)) {
          console.log('✅ Path matches booking status pattern');
          const pathParts = normalizedPathname.split('/');
          const bookingId = parseInt(pathParts[3]);
          console.log('📝 Extracted booking ID:', bookingId);
          
          if (req.method === 'PUT') {
            // ใช้ Promise เพื่อหลีกเลี่ยง race condition
            const processRequest = new Promise((resolve, reject) => {
              let body = '';
              
              req.on('data', chunk => {
                body += chunk.toString();
              });
              
              req.on('end', () => {
                resolve(body);
              });
              
              req.on('error', (error) => {
                reject(error);
              });
            });
            
            processRequest.then(async (body) => {
              let responseSent = false;
              
              try {
                console.log('� PUT /api/bookings/:id/status - Start processing');
                console.log('�📝 Booking ID:', bookingId);
                console.log('📝 Raw request body:', JSON.stringify(body));
                console.log('📝 Body length:', body.length);
                console.log('📝 Body type:', typeof body);
                
                if (!body || body.trim() === '') {
                  console.log('❌ Empty request body detected - SENDING 400');
                  if (!responseSent) {
                    responseSent = true;
                    sendJSON(res, 400, {
                      success: false,
                      message: 'Request body is empty'
                    });
                  }
                  return;
                }
                
                let requestData;
                try {
                  requestData = JSON.parse(body);
                  console.log('✅ Parsed request data:', JSON.stringify(requestData, null, 2));
                } catch (parseError) {
                  console.error('❌ JSON parse error - SENDING 400:', parseError.message);
                  console.error('❌ Raw body that failed:', JSON.stringify(body));
                  if (!responseSent) {
                    responseSent = true;
                    sendJSON(res, 400, {
                      success: false,
                      message: 'รูปแบบข้อมูลไม่ถูกต้อง: ' + parseError.message
                    });
                  }
                  return;
                }
                
                const { status } = requestData;
                console.log('🔄 Extracted status:', status);
                
                if (!status) {
                  console.log('❌ No status provided in request - SENDING 400');
                  if (!responseSent) {
                    responseSent = true;
                    sendJSON(res, 400, {
                      success: false,
                      message: 'กรุณาระบุสถานะที่ต้องการอัปเดต'
                    });
                  }
                  return;
                }
                
                console.log(`🔄 Attempting to update booking ${bookingId} to status: ${status}`);
                
                // อัปเดตสถานะในฐานข้อมูล
                const [result] = await connection.execute(
                  'UPDATE bookings SET status = ?, updated_at = NOW() WHERE id = ?',
                  [status, bookingId]
                );
                
                console.log('🔄 Update result:', { 
                  affectedRows: result.affectedRows,
                  changedRows: result.changedRows,
                  insertId: result.insertId
                });
                
                if (result.affectedRows === 0) {
                  console.log(`❌ No booking found with ID: ${bookingId}`);
                  if (!responseSent) {
                    responseSent = true;
                    sendJSON(res, 404, {
                      success: false,
                      message: 'ไม่พบการจองที่ระบุ'
                    });
                  }
                  return;
                }
                
                console.log(`✅ Booking ${bookingId} status updated successfully to: ${status}`);
                
                // ดึงข้อมูลการจองที่อัปเดตแล้ว
                console.log('🔄 Fetching updated booking data...');
                const [updatedBooking] = await connection.execute(
                  `SELECT b.*, u.first_name, u.last_name, h.name as hotel_name, rt.name as room_type_name
                   FROM bookings b
                   LEFT JOIN users u ON b.user_id = u.id
                   LEFT JOIN hotels h ON b.hotel_id = h.id
                   LEFT JOIN room_types rt ON b.room_type_id = rt.id
                   WHERE b.id = ?`,
                  [bookingId]
                );
                
                console.log('🔄 Updated booking data:', updatedBooking[0] ? 'Found' : 'Not found');
                
                // ส่ง response เพียงครั้งเดียว
                if (!responseSent) {
                  responseSent = true;
                  console.log('📤 Sending success response to client');
                  try {
                    sendJSON(res, 200, {
                      success: true,
                      message: 'อัปเดตสถานะการจองเรียบร้อยแล้ว',
                      data: updatedBooking[0]
                    });
                  } catch (responseError) {
                    console.error('❌ Error sending response:', responseError.message);
                  }
                }
                
                // สร้างการแจ้งเตือนแบบ background (ไม่รอผลลัพธ์)
                if (updatedBooking[0]) {
                  console.log('🔔 Creating background notification for status change');
                  // ใช้ setTimeout แทน setImmediate เพื่อหลีกเลี่ยงปัญหา
                  setTimeout(() => {
                    createBookingStatusNotification(updatedBooking[0], status)
                      .catch(error => {
                        console.error('⚠️ Background notification error:', error.message);
                      });
                  }, 100);
                } else {
                  console.log('⚠️ No updated booking data for notification');
                }
                
              } catch (error) {
                console.error('❌ Error updating booking status:', error);
                console.error('❌ Error stack:', error.stack);
                if (!responseSent) {
                  responseSent = true;
                  console.log('📤 Sending error response to client');
                  try {
                    sendJSON(res, 500, {
                      success: false,
                      message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะการจอง: ' + error.message
                    });
                  } catch (responseError) {
                    console.error('❌ Error sending error response:', responseError.message);
                  }
                }
              }
            }).catch((error) => {
              console.error('❌ Error processing request:', error);
              if (!res.headersSent) {
                sendJSON(res, 500, {
                  success: false,
                  message: 'เกิดข้อผิดพลาดในการประมวลผลคำขอ'
                });
              }
            });
          } else {
            sendJSON(res, 405, {
              success: false,
              message: 'Method not allowed'
            });
          }
          return; // ป้องกันไม่ให้รันต่อไปยัง default 404
        } else if (normalizedPathname.startsWith('/api/admin/rooms/')) {
          console.log(`🎯 Matching admin rooms route: ${req.method} ${normalizedPathname}`);
          const pathParts = normalizedPathname.split('/');
          const roomIdRaw = pathParts[4]; // /api/admin/rooms/{id}
          const action = pathParts[5]; // /api/admin/rooms/{id}/{action}
          
          // Validate and parse roomId
          console.log(`🔍 Route parts: roomIdRaw=${roomIdRaw}, action=${action}`);
          console.log(`🔍 roomIdRaw type: ${typeof roomIdRaw}`);
          
          // Try to parse roomId
          const roomId = parseInt(roomIdRaw);
          console.log(`🔍 Parsed roomId: ${roomId}, isNaN: ${isNaN(roomId)}`);
          
          // Check if roomId is valid
          if (isNaN(roomId) || roomId <= 0) {
            console.log(`❌ Invalid room ID: ${roomIdRaw}`);
            sendJSON(res, 400, {
              success: false,
              message: `รหัสห้องพักไม่ถูกต้อง: ${roomIdRaw}`
            });
            return;
          }
          
          setCorsHeaders(res);
          
          // Handle OPTIONS for preflight
          if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
          }
          
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
            
            req.on('error', (error) => {
              console.error('❌ Error reading request body:', error);
              sendJSON(res, 400, {
                success: false,
                error: 'Invalid request body'
              });
            });
            
            req.on('end', async () => {
              try {
                console.log(`📨 Raw request body (length ${body.length}):`, body);
                
                if (!body.trim()) {
                  sendJSON(res, 400, {
                    success: false,
                    error: 'Request body is empty'
                  });
                  return;
                }
                
                const roomData = JSON.parse(body);
                console.log(`🏠 Updating room ${roomId}:`, JSON.stringify(roomData, null, 2));
                
                if (!roomId || isNaN(parseInt(roomId))) {
                  sendJSON(res, 400, {
                    success: false,
                    error: 'Invalid room ID'
                  });
                  return;
                }
                
                const result = await updateRoom(parseInt(roomId), roomData);
                sendJSON(res, result.success ? 200 : 400, result);
              } catch (error) {
                if (error instanceof SyntaxError) {
                  console.error('❌ JSON parsing error:', error);
                  sendJSON(res, 400, {
                    success: false,
                    error: 'Invalid JSON format'
                  });
                } else {
                  console.error('❌ Error updating room:', error);
                  sendJSON(res, 500, {
                    success: false,
                    error: 'Internal server error',
                    message: 'เกิดข้อผิดพลาดในการอัพเดทห้องพัก'
                  });
                }
              }
            });
          } else if (req.method === 'POST' && pathname.includes('/upload-images')) {
            // POST /api/admin/rooms/{id}/upload-images
            try {
              console.log(`🖼️ Uploading images for room ${roomId}`);
              console.log('📄 Request Content-Type:', req.headers['content-type']);
              
              uploadRoomImage.array('roomImages', 10)(req, res, async (err) => {
                if (err) {
                  console.error('❌ Upload error:', err);
                  sendJSON(res, 400, {
                    success: false,
                    message: err.message
                  });
                  return;
                }
                
                console.log(`📸 Received ${req.files.length} files:`, req.files.map(f => f.filename));
                
                if (!req.files || req.files.length === 0) {
                  sendJSON(res, 400, {
                    success: false,
                    message: 'ไม่พบไฟล์รูปภาพ'
                  });
                  return;
                }
                
                // Get existing room images
                const existingRoom = await getRoomById(parseInt(roomId));
                let existingImages = [];
                
                if (existingRoom?.images) {
                  try {
                    // Try to parse as JSON array first
                    existingImages = JSON.parse(existingRoom.images);
                    if (!Array.isArray(existingImages)) {
                      existingImages = [existingRoom.images];
                    }
                  } catch (error) {
                    // If parsing fails, treat as single image string
                    existingImages = [existingRoom.images];
                  }
                }
                
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
                let existingImages = [];
                
                if (existingRoom?.images) {
                  try {
                    existingImages = JSON.parse(existingRoom.images);
                    if (!Array.isArray(existingImages)) {
                      existingImages = [existingRoom.images];
                    }
                  } catch (error) {
                    existingImages = [existingRoom.images];
                  }
                }
                
                console.log('📁 Existing images before delete:', JSON.stringify(existingImages, null, 2));
                
                // Function to recursively remove filename from nested arrays
                function removeFromNestedArray(arr, targetFilename) {
                  const result = [];
                  
                  for (let item of arr) {
                    if (Array.isArray(item)) {
                      const filtered = removeFromNestedArray(item, targetFilename);
                      if (filtered.length > 0) {
                        result.push(filtered);
                      }
                    } else if (typeof item === 'string' && item !== targetFilename) {
                      result.push(item);
                    }
                  }
                  
                  return result;
                }
                
                // Remove the image from nested array structure
                const updatedImages = removeFromNestedArray(existingImages, filename);
                
                console.log('📁 Updated images after delete:', JSON.stringify(updatedImages, null, 2));
                
                // Delete physical file
                const imagePath = path.join(__dirname, '..', 'frontend', 'public', 'images', 'rooms', filename);
                console.log('🗂️ Attempting to delete file:', imagePath);
                
                if (fs.existsSync(imagePath)) {
                  fs.unlinkSync(imagePath);
                  console.log('✅ Physical file deleted successfully');
                } else {
                  console.log('⚠️ Physical file not found');
                }
                
                // Update room with remaining images
                console.log('🔄 Calling updateRoomImages with:', JSON.stringify(updatedImages, null, 2));
                const updateResult = await updateRoomImages(parseInt(roomId), updatedImages);
                console.log('📤 updateRoomImages result:', updateResult);
                
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
                  console.log('❌ updateRoomImages failed:', updateResult);
                  sendJSON(res, 500, {
                    success: false,
                    message: 'ลบไฟล์สำเร็จ แต่ไม่สามารถอัปเดตฐานข้อมูลได้'
                  });
                }
              } catch (error) {
                console.error('❌ Error deleting room image:', error);
                console.error('❌ Error stack:', error.stack);
                console.error('❌ Error details:', {
                  name: error.name,
                  message: error.message,
                  code: error.code
                });
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
        
        if (normalizedPathname.startsWith('/api/admin/users/')) {
          const pathParts = normalizedPathname.split('/');
          const userId = pathParts[4]; // /api/admin/users/{id}
          
          setCorsHeaders(res);
          
          if (req.method === 'GET' && userId) {
            // GET /api/admin/users/{id}
            try {
              console.log(`👤 Fetching user: ${userId}`);
              const [users] = await connection.execute(
                'SELECT id, email, first_name, last_name, phone, role, created_at, updated_at FROM users WHERE id = ?',
                [parseInt(userId)]
              );
              
              if (users.length > 0) {
                sendJSON(res, 200, {
                  success: true,
                  data: users[0]
                });
              } else {
                sendJSON(res, 404, {
                  success: false,
                  message: 'ไม่พบผู้ใช้ที่ระบุ'
                });
              }
            } catch (error) {
              console.error('❌ Error fetching user:', error);
              sendJSON(res, 500, {
                success: false,
                message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้'
              });
            }
          } else if (req.method === 'PUT' && userId) {
            // PUT /api/admin/users/{id}
            try {
              const body = await getRequestBody(req);
              const { email, first_name, last_name, phone, role } = body;
              
              console.log(`👤 Updating user: ${userId}`);
              
              // Check if user exists
              const [existingUsers] = await connection.execute('SELECT id FROM users WHERE id = ?', [parseInt(userId)]);
              if (existingUsers.length === 0) {
                return sendJSON(res, 404, {
                  success: false,
                  message: 'ไม่พบผู้ใช้ที่ระบุ'
                });
              }
              
              // Update user
              const updateQuery = `
                UPDATE users 
                SET email = ?, first_name = ?, last_name = ?, phone = ?, role = ?, 
                    address = ?, national_id = ?, updated_at = NOW()
                WHERE id = ?
              `;
              
              await connection.execute(updateQuery, [
                email, first_name, last_name, phone || null, role, 
                body.address || null, body.national_id || null, parseInt(userId)
              ]);
              
              // Get updated user
              const [updatedUsers] = await connection.execute(
                'SELECT id, email, first_name, last_name, phone, role, address, national_id, created_at, updated_at FROM users WHERE id = ?',
                [parseInt(userId)]
              );
              
              const updatedUser = updatedUsers[0];
              
              // Broadcast role update if role was changed
              if (updatedUser && typeof broadcastUserRoleUpdate === 'function') {
                broadcastUserRoleUpdate(updatedUser);
              }
              
              sendJSON(res, 200, {
                success: true,
                message: 'อัปเดตข้อมูลผู้ใช้เรียบร้อยแล้ว',
                data: updatedUser
              });
              
            } catch (error) {
              console.error('❌ Error updating user:', error);
              if (error.code === 'ER_DUP_ENTRY') {
                sendJSON(res, 409, {
                  success: false,
                  message: 'อีเมลนี้มีอยู่ในระบบแล้ว'
                });
              } else {
                sendJSON(res, 500, {
                  success: false,
                  message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลผู้ใช้'
                });
              }
            }
          } else if (req.method === 'PUT' && normalizedPathname.endsWith('/role')) {
            // PUT /api/admin/users/{id}/role - Update user role specifically
            try {
              const pathParts = normalizedPathname.split('/');
              const userId = pathParts[pathParts.length - 2]; // Get ID before '/role'
              
              const body = await getRequestBody(req);
              const { role } = body;
              
              console.log(`👤 Updating user role: ${userId} -> ${role}`);
              
              // Validate role
              const validRoles = ['guest', 'staff', 'manager', 'admin'];
              if (!validRoles.includes(role)) {
                return sendJSON(res, 400, {
                  success: false,
                  message: 'บทบาทไม่ถูกต้อง'
                });
              }
              
              // Check if user exists
              const [existingUsers] = await connection.execute('SELECT id, email FROM users WHERE id = ?', [parseInt(userId)]);
              if (existingUsers.length === 0) {
                return sendJSON(res, 404, {
                  success: false,
                  message: 'ไม่พบผู้ใช้ที่ระบุ'
                });
              }
              
              // Update user role
              await connection.execute(
                'UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?',
                [role, parseInt(userId)]
              );
              
              // Get updated user
              const [updatedUsers] = await connection.execute(
                'SELECT id, email, first_name, last_name, phone, role, address, national_id, created_at, updated_at FROM users WHERE id = ?',
                [parseInt(userId)]
              );
              
              const updatedUser = updatedUsers[0];
              
              // Broadcast role update via WebSocket
              if (updatedUser && typeof broadcastUserRoleUpdate === 'function') {
                broadcastUserRoleUpdate(updatedUser);
              }
              
              sendJSON(res, 200, {
                success: true,
                message: 'อัปเดตบทบาทผู้ใช้เรียบร้อยแล้ว',
                data: updatedUser
              });
              
            } catch (error) {
              console.error('❌ Error updating user role:', error);
              sendJSON(res, 500, {
                success: false,
                message: 'เกิดข้อผิดพลาดในการอัปเดตบทบาทผู้ใช้'
              });
            }
          } else if (req.method === 'DELETE' && userId) {
            // DELETE /api/admin/users/{id}
            try {
              console.log(`👤 Deleting user: ${userId}`);
              
              // Check if user exists
              const [existingUsers] = await connection.execute('SELECT id, role FROM users WHERE id = ?', [parseInt(userId)]);
              if (existingUsers.length === 0) {
                return sendJSON(res, 404, {
                  success: false,
                  message: 'ไม่พบผู้ใช้ที่ระบุ'
                });
              }
              
              // Prevent deleting super_admin
              if (existingUsers[0].role === 'super_admin') {
                return sendJSON(res, 403, {
                  success: false,
                  message: 'ไม่สามารถลบผู้ใช้ Super Admin ได้'
                });
              }
              
              // Delete user
              await connection.execute('DELETE FROM users WHERE id = ?', [parseInt(userId)]);
              
              sendJSON(res, 200, {
                success: true,
                message: 'ลบผู้ใช้เรียบร้อยแล้ว'
              });
              
            } catch (error) {
              console.error('❌ Error deleting user:', error);
              sendJSON(res, 500, {
                success: false,
                message: 'เกิดข้อผิดพลาดในการลบผู้ใช้'
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
          } else if (req.method === 'DELETE') {
            // Handle booking deletion
            setCorsHeaders(res);
            
            console.log(`🗑️ DELETE request for booking ID: ${bookingId}`);
            const result = await deleteBooking(parseInt(bookingId));
            
            sendJSON(res, result.success ? 200 : 400, result);
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
        
        // Handle QR code files serving
        if (normalizedPathname.startsWith('/uploads/qr-codes/') && req.method === 'GET') {
          const fileName = normalizedPathname.split('/').pop();
          const filePath = path.join(__dirname, 'uploads', 'qr-codes', fileName);
          
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
              error: 'QR code file not found'
            });
          }
          break;
        }
        
        // Handle room image files serving
        if (normalizedPathname.startsWith('/uploads/room-images/') && req.method === 'GET') {
          const fileName = normalizedPathname.split('/').pop();
          const filePath = path.join(__dirname, 'uploads', 'room-images', fileName);
          
          console.log('🖼️ Serving room image:', fileName, 'Path:', filePath);
          
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
              case '.gif':
                contentType = 'image/gif';
                break;
              case '.webp':
                contentType = 'image/webp';
                break;
            }
            
            res.writeHead(200, { 
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=86400',
              'Access-Control-Allow-Origin': '*'
            });
            
            const fileStream = fs.createReadStream(filePath);
            fileStream.pipe(res);
          } else {
            console.log('❌ Room image file not found:', filePath);
            sendJSON(res, 404, {
              success: false,
              error: 'Room image file not found'
            });
          }
          break;
        }
        
        // Handle general uploads files serving (for test files)
        if (normalizedPathname.startsWith('/uploads/') && req.method === 'GET') {
          const relativePath = normalizedPathname.replace('/uploads/', '');
          const filePath = path.join(__dirname, 'uploads', relativePath);
          
          console.log('📁 Serving general upload file:', relativePath, 'Path:', filePath);
          
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
              case '.gif':
                contentType = 'image/gif';
                break;
              case '.webp':
                contentType = 'image/webp';
                break;
              case '.svg':
                contentType = 'image/svg+xml';
                break;
              case '.pdf':
                contentType = 'application/pdf';
                break;
            }
            
            res.writeHead(200, { 
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=86400',
              'Access-Control-Allow-Origin': '*'
            });
            
            const fileStream = fs.createReadStream(filePath);
            fileStream.pipe(res);
          } else {
            console.log('❌ Upload file not found:', filePath);
            sendJSON(res, 404, {
              success: false,
              error: 'Upload file not found'
            });
          }
          break;
        }
        
      case '/api/contact-settings':
        setCorsHeaders(res);
        if (req.method === 'GET') {
          try {
            console.log('📞 Fetching contact settings');
            
            // Try to get contact settings from database
            let contactSettings = {};
            
            try {
              // Check if contact_settings table exists
              const [tables] = await connection.execute(`
                SELECT TABLE_NAME 
                FROM information_schema.TABLES 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'contact_settings'
              `);
              
              if (tables.length > 0) {
                // Get all contact settings
                const [settings] = await connection.execute(
                  'SELECT setting_key, setting_value FROM contact_settings'
                );
                
                settings.forEach(setting => {
                  contactSettings[setting.setting_key] = setting.setting_value;
                });
              }
              
              // If no settings exist, use defaults
              if (Object.keys(contactSettings).length === 0) {
                contactSettings = {
                  phone: '02-123-4567',
                  email: 'support@hotel.com',
                  address: '123 ถนนใหญ่ เขตกลาง กรุงเทพฯ 10100',
                  website: 'www.hotel.com',
                  facebook: 'facebook.com/hotel',
                  line: '@hotel'
                };
              }
              
            } catch (dbError) {
              console.log('⚠️ Database error, using default contact settings:', dbError.message);
              contactSettings = {
                phone: '02-123-4567',
                email: 'support@hotel.com',
                address: '123 ถนนใหญ่ เขตกลาง กรุงเทพฯ 10100',
                website: 'www.hotel.com',
                facebook: 'facebook.com/hotel',
                line: '@hotel'
              };
            }
            
            sendJSON(res, 200, {
              success: true,
              data: contactSettings
            });
            
          } catch (error) {
            console.error('❌ Error fetching contact settings:', error);
            sendJSON(res, 500, {
              success: false,
              message: 'เกิดข้อผิดพลาดในการดึงข้อมูลติดต่อ'
            });
          }
          
        } else if (req.method === 'PUT') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          
          req.on('end', async () => {
            try {
              const settingsData = JSON.parse(body);
              console.log('📞 Updating contact settings:', settingsData);
              
              // Ensure contact_settings table exists
              await connection.execute(`
                CREATE TABLE IF NOT EXISTS contact_settings (
                  id INT AUTO_INCREMENT PRIMARY KEY,
                  setting_key VARCHAR(50) NOT NULL UNIQUE,
                  setting_value TEXT,
                  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
              `);
              
              // Update each setting
              for (const [key, value] of Object.entries(settingsData)) {
                await connection.execute(`
                  INSERT INTO contact_settings (setting_key, setting_value) 
                  VALUES (?, ?) 
                  ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()
                `, [key, value]);
              }
              
              sendJSON(res, 200, {
                success: true,
                message: 'อัปเดตข้อมูลติดต่อเรียบร้อยแล้ว',
                data: settingsData
              });
              
            } catch (error) {
              console.error('❌ Error updating contact settings:', error);
              if (error instanceof SyntaxError) {
                sendJSON(res, 400, {
                  success: false,
                  message: 'รูปแบบข้อมูลไม่ถูกต้อง'
                });
              } else {
                sendJSON(res, 500, {
                  success: false,
                  message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลติดต่อ'
                });
              }
            }
          });
          
        } else {
          sendJSON(res, 405, {
            success: false,
            message: 'Method not allowed'
          });
        }
        break;
    }
  } catch (error) {
    console.error('❌ Server error:', error);
    if (!res.headersSent) {
      sendJSON(res, 500, {
        success: false,
        message: 'Internal server error'
      });
    }
  }
});

// Server listen
server.listen(PORT, () => {
  console.log(`🚀 Hotel Backend Server with MySQL is running at http://localhost:${PORT}`);
  
  // Print available endpoints
  console.log('📋 Available endpoints:');
  console.log('   GET /                        - Server info');
  console.log('   GET /health                  - Health check');
  console.log('   POST /api/auth/login         - User login');
  console.log('   POST /api/auth/verify        - Verify token');
  console.log('   GET /api/test                - API test');
  console.log('   GET /api/hotels              - Hotels from database');
  console.log('   GET /api/room-types          - Room types from database');
  console.log('   GET /api/rooms               - Rooms from database');
  console.log('   GET /api/rooms/availability  - Check room availability');
  console.log('   GET /api/check-room-availability - Check room availability by date');
  console.log('   GET /api/room-types-with-images - Room types with images for user');
  console.log('   GET /api/room-statistics     - Room statistics for dashboard');
  console.log('   GET /api/bookings            - Bookings from database');
  console.log('   PUT /api/bookings/{id}/status - Update booking status');
  console.log('   GET /api/admin/bookings/detailed - Detailed bookings for admin');
  console.log('   GET /api/admin/rooms         - All rooms for admin management');
  console.log('   POST /api/admin/rooms        - Create new room');
  console.log('   GET /api/admin/rooms/{id}    - Get room by ID');
  console.log('   PUT /api/admin/rooms/{id}    - Update room');
  console.log('   POST /api/admin/rooms/{id}/upload-images - Upload room images');
  console.log('   DELETE /api/admin/rooms/{id}/delete-image - Delete room image');
  console.log('   DELETE /api/admin/rooms/{id} - Delete room');
  console.log('   PATCH /api/admin/rooms/{id}/toggle-availability - Toggle room availability');
  console.log('   GET /api/cancellation-requests - Cancellation requests');
  console.log('   PUT /api/cancellation-requests - Process cancellation requests');
  console.log('   GET /api/admin/dashboard/stats - Admin dashboard statistics');
  console.log('   GET /api/admin/reports       - Admin reports (financial, occupancy)');
  console.log('   GET /api/admin/users         - Get all users (admin)');
  console.log('   POST /api/admin/users        - Create new user (admin)');
  console.log('   GET /api/admin/users/{id}    - Get user by ID (admin)');
  console.log('   PUT /api/admin/users/{id}    - Update user (admin)');
  console.log('   DELETE /api/admin/users/{id} - Delete user (admin)');
  console.log('   GET /api/notifications       - Get notifications list');
  console.log('   PUT /api/notifications       - Mark notification as read/unread');
  console.log('   POST /api/notifications      - Create new notification');
  console.log('   GET /api/notifications/unread-count - Get unread count');
  console.log('   GET /api/global-settings     - Global settings');
  console.log('   GET /api/database/status     - Database statistics');
  console.log('');
  console.log(`💾 Database: MySQL (${process.env.DB_NAME || 'AppServ'})`);
  console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3002'}`);
  console.log('🔔 Notification system initialized and running');
});

// WebSocket Server for real-time updates
const wss = new WebSocketServer({ 
  server,
  path: '/ws'
});

// Store connected clients with their user info
const connectedClients = new Map();

wss.on('connection', (ws, req) => {
  const userId = new URL(req.url, `http://${req.headers.host}`).searchParams.get('userId');
  const userRole = new URL(req.url, `http://${req.headers.host}`).searchParams.get('role');
  
  console.log(`🔌 WebSocket connected: userId=${userId}, role=${userRole}`);
  
  // Store client info
  connectedClients.set(ws, { userId, userRole, connectedAt: Date.now() });
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connected',
    message: 'WebSocket connection established',
    timestamp: new Date().toISOString()
  }));
  
  // Handle incoming messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      console.log('📨 WebSocket message received:', message);
      
      // Handle ping/pong for keepalive
      if (message.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
      }
    } catch (error) {
      console.error('❌ Error parsing WebSocket message:', error);
    }
  });
  
  // Handle client disconnect
  ws.on('close', () => {
    const clientInfo = connectedClients.get(ws);
    console.log(`🔌 WebSocket disconnected: userId=${clientInfo?.userId}`);
    connectedClients.delete(ws);
  });
  
  // Handle errors
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
    connectedClients.delete(ws);
  });
});

// Function to broadcast user role updates
function broadcastUserRoleUpdate(updatedUser) {
  const message = {
    type: 'user_role_updated',
    data: {
      userId: updatedUser.id,
      newRole: updatedUser.role,
      email: updatedUser.email,
      updatedAt: new Date().toISOString()
    }
  };
  
  // Send to all connected admin clients
  connectedClients.forEach((clientInfo, ws) => {
    if (clientInfo.userRole === 'admin' && ws.readyState === 1) { // OPEN
      ws.send(JSON.stringify(message));
    }
  });
  
  // Also send to the specific user whose role was changed
  connectedClients.forEach((clientInfo, ws) => {
    if (clientInfo.userId == updatedUser.id && ws.readyState === 1) {
      ws.send(JSON.stringify({
        type: 'your_role_updated',
        data: {
          newRole: updatedUser.role,
          message: `สิทธิ์ของคุณถูกเปลี่ยนเป็น ${updatedUser.role}`,
          updatedAt: new Date().toISOString()
        }
      }));
    }
  });
  
  console.log(`📡 Broadcasted role update for user ${updatedUser.id} to ${connectedClients.size} clients`);
}

console.log(`🔌 WebSocket server initialized on ws://localhost:${PORT}/ws`);

// Error handling
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  // Don't exit the process, just log the error
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process, just log the error
});

// Handle warning events
process.on('warning', (warning) => {
  console.warn('⚠️  Warning:', warning.name, warning.message);
});

// Start the server
startServer().catch(console.error);

// ==============================
// NOTIFICATIONS FUNCTIONS
// ==============================

// Get notifications with filtering
async function getNotifications(limit = 10, offset = 0, userId = null, unreadOnly = false, adminOnly = false, createdAfter = null) {
  let query = `
    SELECT 
      id,
      title,
      message,
      type,
      read_status as isRead,
      user_id,
      related_id,
      related_type,
      priority,
      action_url,
      expires_at,
      created_at as createdAt,
      updated_at as updatedAt
    FROM notifications 
    WHERE (expires_at IS NULL OR expires_at > NOW())
  `;
  
  const params = [];
  
  if (adminOnly) {
    // การแจ้งเตือนสำหรับแอดมิน - แจ้งเตือนเกี่ยวกับการจอง, การชำระเงิน, etc.
    query += ` AND (type IN ('booking_pending', 'payment_received', 'booking_cancelled', 'system_alert') OR user_id IS NULL)`;
  } else if (userId !== null) {
    query += ` AND (user_id = ? OR user_id IS NULL)`;
    params.push(userId);
  } else {
    query += ` AND user_id IS NULL`; // Global notifications only
  }
  
  if (unreadOnly) {
    query += ` AND read_status = FALSE`;
  }
  
  if (createdAfter) {
    query += ` AND created_at > FROM_UNIXTIME(?)`;
    params.push(Math.floor(parseInt(createdAfter) / 1000)); // Convert milliseconds to seconds
  }
  
  query += ` ORDER BY 
    CASE priority 
      WHEN 'high' THEN 1 
      WHEN 'medium' THEN 2 
      WHEN 'low' THEN 3 
    END,
    created_at DESC 
    LIMIT ? OFFSET ?`;
  
  params.push(limit, offset);
  
  const [rows] = await connection.execute(query, params);
  return rows;
}

// Check room availability for booking
async function checkRoomAvailability(roomTypeId, checkInDate, checkOutDate) {
  try {
    // Get total number of rooms for this room type
    const roomCountQuery = `
      SELECT quantity as totalRooms
      FROM room_types 
      WHERE id = ?
    `;
    
    const [roomCountRows] = await connection.execute(roomCountQuery, [roomTypeId]);
    const totalAvailableRooms = roomCountRows[0]?.totalRooms || 0;
    
    // Get conflicting bookings for this room type and date range
    const query = `
      SELECT COUNT(*) as conflictCount
      FROM bookings 
      WHERE room_type_id = ? 
      AND status IN ('confirmed', 'checked_in', 'pending')
      AND (
        (check_in_date <= ? AND check_out_date > ?) OR
        (check_in_date < ? AND check_out_date >= ?) OR
        (check_in_date >= ? AND check_out_date <= ?)
      )
    `;
    
    const [rows] = await connection.execute(query, [
      roomTypeId,
      checkInDate, checkInDate,  
      checkOutDate, checkOutDate,  
      checkInDate, checkOutDate   
    ]);
    
    const conflictCount = rows[0].conflictCount;
    
    // ห้ามจองซ้ำในวันที่เดียวกันโดยสิ้นเชิง - ถ้ามีการจองอยู่แล้วให้ถือว่าไม่ว่าง
    const availableRooms = Math.max(0, totalAvailableRooms - conflictCount);
    const isAvailable = conflictCount === 0; // เปลี่ยนจาก availableRooms > 0 เป็น conflictCount === 0
    
    console.log(`🔍 Room availability check:
      - Room type ID: ${roomTypeId}
      - Total available rooms: ${totalAvailableRooms}
      - Conflicting bookings: ${conflictCount}
      - Available rooms: ${availableRooms}
      - Is available: ${isAvailable}
    `);
    
    // Get existing bookings for this room type to show in calendar
    const existingBookingsQuery = `
      SELECT 
        check_in_date,
        check_out_date,
        guest_name,
        status
      FROM bookings 
      WHERE room_type_id = ? 
      AND status IN ('confirmed', 'checked_in', 'pending')
      AND check_out_date >= CURDATE()
      ORDER BY check_in_date
    `;
    
    const [existingBookings] = await connection.execute(existingBookingsQuery, [roomTypeId]);
    
    return {
      isAvailable,
      totalRooms: totalAvailableRooms,
      bookedRooms: conflictCount,
      availableRooms,
      existingBookings: existingBookings.map(booking => ({
        checkIn: booking.check_in_date,
        checkOut: booking.check_out_date,
        guestName: booking.guest_name,
        status: booking.status
      }))
    };
  } catch (error) {
    console.error('Error checking room availability:', error);
    throw error;
  }
}

// Create booking completion notification
async function createBookingNotification(bookingData) {
  try {
    const checkInDate = new Date(bookingData.check_in_date);
    const today = new Date();
    const daysUntilCheckIn = Math.ceil((checkInDate - today) / (1000 * 60 * 60 * 24));
    
    let message = `มีการจองห้องพักเสร็จสิ้นแล้ว! `;
    let title = 'การจองห้องเสร็จสมบูรณ์';
    
    if (daysUntilCheckIn > 0) {
      message += `อีก ${daysUntilCheckIn} วันถึงวันเข้าพัก (${checkInDate.toLocaleDateString('th-TH')})`;
      title = `การจองห้องเสร็จสมบูรณ์ - อีก ${daysUntilCheckIn} วัน`;
    } else if (daysUntilCheckIn === 0) {
      message += `วันนี้เป็นวันเข้าพักของคุณ!`;
      title = 'การจองห้องเสร็จสมบูรณ์ - วันนี้เข้าพัก';
    } else {
      message += `วันเข้าพักได้ผ่านไปแล้ว`;
    }
    
    // Add booking details
    message += ` ห้อง: ${bookingData.room_name || 'ไม่ระบุ'}, ผู้เข้าพัก: ${bookingData.guests} คน`;
    
    const notification = {
      title: title,
      message: message,
      type: 'info',
      user_id: bookingData.user_id,
      related_id: bookingData.id,
      related_type: 'booking',
      priority: daysUntilCheckIn <= 1 ? 'high' : 'medium',
      action_url: `/bookings/${bookingData.id}`
    };
    
    await createSystemNotification('booking_confirmed', bookingData.id, 'booking', notification);
    console.log(`✅ Created booking notification for user ${bookingData.user_id}`);
    
  } catch (error) {
    console.error('❌ Error creating booking notification:', error);
  }
}

// Get unread notifications count
async function getUnreadNotificationsCount(userId = null, adminOnly = false) {
  let query = `
    SELECT COUNT(*) as count 
    FROM notifications 
    WHERE read_status = FALSE 
    AND (expires_at IS NULL OR expires_at > NOW())
  `;
  
  const params = [];
  
  if (adminOnly) {
    // การแจ้งเตือนสำหรับแอดมิน
    query += ` AND (type IN ('booking_pending', 'payment_received', 'booking_cancelled', 'system_alert') OR user_id IS NULL)`;
  } else if (userId !== null) {
    query += ` AND (user_id = ? OR user_id IS NULL)`;
    params.push(userId);
  } else {
    query += ` AND user_id IS NULL`; // Global notifications only
  }
  
  const [rows] = await connection.execute(query, params);
  return rows[0].count;
}

// Mark notification as read/unread
async function markNotificationAsRead(id, readStatus = true) {
  const query = `
    UPDATE notifications 
    SET read_status = ?, updated_at = NOW() 
    WHERE id = ?
  `;
  
  const [result] = await connection.execute(query, [readStatus, id]);
  return result;
}

// Create new notification
async function createNotification(data) {
  const {
    title,
    message,
    type = 'info',
    userId = null,
    relatedId = null,
    relatedType = null,
    priority = 'medium',
    actionUrl = null,
    expiresAt = null
  } = data;
  
  const query = `
    INSERT INTO notifications (
      title, message, type, user_id, related_id, 
      related_type, priority, action_url, expires_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
  `;
  
  const params = [
    title, message, type, userId, relatedId, 
    relatedType, priority, actionUrl, expiresAt
  ];
  
  const [result] = await connection.execute(query, params);
  return result;
}

// Helper function to create system notifications automatically
async function createSystemNotification(type, relatedId = null, relatedType = null, customData = null) {
  // If customData is provided (for booking_confirmed), use it directly
  if (customData && type === 'booking_confirmed') {
    return await createNotification({
      title: customData.title,
      message: customData.message,
      type: customData.type,
      userId: customData.user_id,
      relatedId: customData.related_id,
      relatedType: customData.related_type,
      priority: customData.priority,
      actionUrl: customData.action_url
    });
  }

  let title, message, priority = 'medium';
  
  switch (type) {
    case 'new_booking':
      title = 'การจองใหม่เข้ามา';
      message = 'มีการจองห้องพักใหม่ที่ต้องการการอนุมัติ';
      priority = 'high';
      break;
    case 'payment_received':
      title = 'ได้รับการชำระเงิน';
      message = 'มีการชำระเงินใหม่ที่ต้องตรวจสอบ';
      priority = 'high';
      break;
    case 'checkin_reminder':
      title = 'การเช็คอินใกล้ถึงเวลา';
      message = 'มีลูกค้าที่จะเช็คอินในวันนี้ กรุณาเตรียมห้องพักให้พร้อม';
      priority = 'medium';
      break;
    case 'checkout_reminder':
      title = 'การเช็คเอาต์ใกล้ถึงเวลา';
      message = 'มีลูกค้าที่จะเช็คเอาต์ในวันนี้ กรุณาเตรียมพร้อม';
      priority = 'medium';
      break;
    case 'system_update':
      title = 'อัปเดตระบบสำเร็จ';
      message = 'ระบบได้รับการอัปเดตฟีเจอร์ใหม่เรียบร้อยแล้ว';
      priority = 'low';
      break;
    default:
      return null;
  }
  
  return await createNotification({
    title,
    message,
    type: 'info',
    userId: null, // Global notification
    relatedId,
    relatedType,
    priority
  });
}

// Helper function to create notifications based on booking status changes
async function createBookingStatusNotification(booking, newStatus) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Handle date conversion - could be Date object or string
    let checkInDate = null;
    let checkOutDate = null;
    
    if (booking.check_in_date) {
      try {
        checkInDate = booking.check_in_date instanceof Date 
          ? booking.check_in_date.toISOString().split('T')[0]
          : new Date(booking.check_in_date).toISOString().split('T')[0];
      } catch (dateError) {
        console.warn('Warning: Invalid check_in_date format:', booking.check_in_date);
      }
    }
    
    if (booking.check_out_date) {
      try {
        checkOutDate = booking.check_out_date instanceof Date 
          ? booking.check_out_date.toISOString().split('T')[0]
          : new Date(booking.check_out_date).toISOString().split('T')[0];
      } catch (dateError) {
        console.warn('Warning: Invalid check_out_date format:', booking.check_out_date);
      }
    }

    let notificationType = null;
    
    // Check if it's check-in day
    if (checkInDate === today && (newStatus === 'confirmed' || newStatus === 'checked_in')) {
      notificationType = 'checkin_reminder';
    }
    
    // Check if it's check-out day
    if (checkOutDate === today && newStatus === 'checked_in') {
      notificationType = 'checkout_reminder';
    }
    
    if (notificationType) {
      await createSystemNotification(notificationType, booking.id, 'booking');
    }
    
    console.log(`✅ Booking status notification processed for booking ${booking.id}`);
  } catch (error) {
    console.error('❌ Error in createBookingStatusNotification:', error);
    // Don't throw error to prevent breaking the main flow
  }
}

// Helper function to check and create daily reminders
async function createDailyReminders() {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Check for today's check-ins
    const [checkInBookings] = await connection.execute(`
      SELECT id, guest_name, room_type_id, check_in_date 
      FROM bookings 
      WHERE DATE(check_in_date) = ? AND status = 'confirmed'
    `, [today]);
    
    for (const booking of checkInBookings) {
      await createSystemNotification('checkin_reminder', booking.id, 'booking');
    }
    
    // Check for today's check-outs
    const [checkOutBookings] = await connection.execute(`
      SELECT id, guest_name, room_type_id, check_out_date 
      FROM bookings 
      WHERE DATE(check_out_date) = ? AND status = 'checked_in'
    `, [today]);
    
    for (const booking of checkOutBookings) {
      await createSystemNotification('checkout_reminder', booking.id, 'booking');
    }
    
    console.log(`📅 Daily reminders created: ${checkInBookings.length} check-ins, ${checkOutBookings.length} check-outs`);
    
  } catch (error) {
    console.error('Error creating daily reminders:', error);
  }
}

// Start server
async function startServer() {
  try {
    // Try to connect to database first
    await connectToDatabase();
    
    // Create daily reminders on startup
    await createDailyReminders();
    
    // Set up daily reminder scheduler (runs every hour to check)
    setInterval(async () => {
      const currentHour = new Date().getHours();
      if (currentHour === 8) { // Run at 8 AM every day
        await createDailyReminders();
      }
    }, 60 * 60 * 1000); // Check every hour
  } catch (error) {
    console.error('❌ Error starting server:', error);
    process.exit(1);
  }
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

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  // Don't exit the process, just log the error
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process, just log the error
});

// Handle warning events
process.on('warning', (warning) => {
  console.warn('⚠️  Warning:', warning.name, warning.message);
});

// Start the server
startServer().catch(console.error);