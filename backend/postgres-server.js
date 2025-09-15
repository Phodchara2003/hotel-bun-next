const { createServer } = require('http');
const { parse } = require('url');
const { Client } = require('pg');
require('dotenv/config');

const PORT = process.env.PORT || 3001;

// Create PostgreSQL client
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Connect to database
async function connectToDatabase() {
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL database');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
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
    const result = await client.query(`
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
    return result.rows;
  } catch (error) {
    console.error('Error fetching hotels:', error);
    return [];
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
      query += ' WHERE rt.hotel_id = $1';
      params = [hotel_id];
    }
    
    query += ' ORDER BY rt.price_per_night ASC';
    
    const result = await client.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Error fetching room types:', error);
    return [];
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
      query += ' WHERE r.hotel_id = $1';
      params = [hotel_id];
    }
    
    query += ' ORDER BY r.room_number ASC';
    
    const result = await client.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return [];
  }
}

async function getBookings() {
  try {
    const result = await client.query(`
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
        h.name as hotel_name,
        rt.name as room_type_name
      FROM bookings b
      LEFT JOIN hotels h ON b.hotel_id = h.id
      LEFT JOIN room_types rt ON b.room_type_id = rt.id
      ORDER BY b.created_at DESC
      LIMIT 50
    `);
    return result.rows;
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return [];
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

  console.log(`${req.method} ${pathname}`);

  try {
    // Routes
    switch (pathname) {
      case '/':
        sendJSON(res, 200, {
          message: 'Hotel Booking Backend API with PostgreSQL',
          status: 'running',
          timestamp: new Date().toISOString(),
          port: PORT,
          database: 'connected'
        });
        break;

      case '/health':
        // Test database connection
        let dbStatus = 'connected';
        try {
          await client.query('SELECT 1');
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

      case '/api/test':
        sendJSON(res, 200, {
          message: 'API endpoint working with PostgreSQL',
          data: {
            server: 'Node.js HTTP Server',
            database: 'PostgreSQL (Neon)',
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

      case '/api/bookings':
        const bookings = await getBookings();
        sendJSON(res, 200, {
          success: true,
          count: bookings.length,
          data: bookings
        });
        break;

      case '/api/database/status':
        try {
          const result = await client.query(`
            SELECT 
              (SELECT COUNT(*) FROM hotels) as hotels_count,
              (SELECT COUNT(*) FROM room_types) as room_types_count,
              (SELECT COUNT(*) FROM rooms) as rooms_count,
              (SELECT COUNT(*) FROM bookings) as bookings_count
          `);
          
          sendJSON(res, 200, {
            success: true,
            database: 'PostgreSQL',
            connection: 'active',
            statistics: result.rows[0]
          });
        } catch (error) {
          sendJSON(res, 500, {
            success: false,
            error: 'Database query failed',
            message: error.message
          });
        }
        break;

      default:
        sendJSON(res, 404, {
          error: 'Not Found',
          message: `Endpoint ${pathname} not found`,
          available_endpoints: [
            '/',
            '/health',
            '/api/test',
            '/api/hotels',
            '/api/room-types',
            '/api/rooms',
            '/api/bookings',
            '/api/database/status'
          ]
        });
    }
  } catch (error) {
    console.error('Server error:', error);
    sendJSON(res, 500, {
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// Start server
async function startServer() {
  await connectToDatabase();
  
  server.listen(PORT, () => {
    console.log(`🚀 Hotel Backend Server with PostgreSQL is running at http://localhost:${PORT}`);
    console.log('📋 Available endpoints:');
    console.log('   GET /                    - Server info');
    console.log('   GET /health              - Health check');
    console.log('   GET /api/test            - API test');
    console.log('   GET /api/hotels          - Hotels from database');
    console.log('   GET /api/room-types      - Room types from database');
    console.log('   GET /api/rooms           - Rooms from database');
    console.log('   GET /api/bookings        - Bookings from database');
    console.log('   GET /api/database/status - Database statistics');
    console.log('\n💾 Database: PostgreSQL (Neon)');
    console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL}`);
  });
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏹️  Shutting down server...');
  await client.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⏹️  Shutting down server...');
  await client.end();
  process.exit(0);
});

startServer().catch(console.error);