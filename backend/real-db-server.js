// Real Database Backend Server - PostgreSQL Connection (CommonJS)
const { createServer } = require('http');
const { parse } = require('url');
const { Pool } = require('pg');
require('dotenv').config();

const PORT = process.env.PORT || 3003;

// Database connection with error handling
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test database connection
async function testDatabaseConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    
    // Test query to check available tables
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('📋 Available tables:', result.rows.map(row => row.table_name));
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Helper functions
const sendJSON = (res, statusCode, data) => {
  res.setHeader('Content-Type', 'application/json');
  res.writeHead(statusCode);
  res.end(JSON.stringify(data, null, 2));
};

const setCORSHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

const getRequestBody = (req) => {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        resolve({});
      }
    });
  });
};

const server = createServer(async (req, res) => {
  setCORSHeaders(res);
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  try {
    // Health check
    if (path === '/health') {
      const dbStatus = await testDatabaseConnection();
      sendJSON(res, 200, {
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: dbStatus ? 'connected' : 'disconnected',
        port: PORT
      });
      return;
    }

    // Root endpoint
    if (path === '/') {
      sendJSON(res, 200, {
        message: 'Hotel Booking API Server (Real Database)',
        status: 'OK',
        timestamp: new Date().toISOString(),
        port: PORT,
        database: 'PostgreSQL (Neon)',
        endpoints: [
          'GET /health',
          'GET /api/hotels',
          'GET /api/notifications', 
          'GET /global-settings/room_price_per_night'
        ]
      });
      return;
    }

    // API: Hotels - Real data from database
    if (path === '/api/hotels' && method === 'GET') {
      try {
        const limit = parseInt(parsedUrl.query.limit) || 10;
        
        const result = await pool.query(`
          SELECT 
            h.id,
            h.name,
            h.description,
            h.location,
            h.amenities,
            h.image_url,
            h.rating,
            h.total_rooms,
            h.created_at,
            h.updated_at,
            COALESCE(
              (SELECT AVG(price_per_night) FROM room_types WHERE hotel_id = h.id),
              1500
            ) as avg_price
          FROM hotels h
          WHERE h.status = 'active'
          ORDER BY h.created_at DESC 
          LIMIT $1
        `, [limit]);
        
        console.log(`📊 Retrieved ${result.rows.length} hotels from database`);
        
        sendJSON(res, 200, {
          success: true,
          data: result.rows,
          count: result.rows.length,
          source: 'database'
        });
      } catch (error) {
        console.error('Database error (hotels):', error);
        sendJSON(res, 500, {
          success: false,
          error: 'Database query failed',
          message: error.message
        });
      }
      return;
    }

    // API: Notifications - Real data from database
    if (path === '/api/notifications' && method === 'GET') {
      try {
        const result = await pool.query(`
          SELECT 
            id,
            title,
            message,
            type,
            read_status,
            user_id,
            created_at,
            updated_at
          FROM notifications 
          ORDER BY created_at DESC 
          LIMIT 50
        `);
        
        console.log(`📢 Retrieved ${result.rows.length} notifications from database`);
        
        sendJSON(res, 200, {
          success: true,
          data: result.rows,
          count: result.rows.length,
          source: 'database'
        });
      } catch (error) {
        console.error('Database error (notifications):', error);
        sendJSON(res, 500, {
          success: false,
          error: 'Database query failed',
          message: error.message
        });
      }
      return;
    }

    // API: Global Settings - Room Price
    if (path === '/global-settings/room_price_per_night' && method === 'GET') {
      try {
        const result = await pool.query(`
          SELECT setting_value 
          FROM global_settings 
          WHERE setting_key = 'room_price_per_night'
          LIMIT 1
        `);
        
        let price = 1500; // default
        if (result.rows.length > 0) {
          price = parseInt(result.rows[0].setting_value);
        }
        
        console.log(`💰 Retrieved room price: ${price} THB from database`);
        
        sendJSON(res, 200, {
          success: true,
          price: price,
          currency: 'THB',
          source: 'database'
        });
      } catch (error) {
        console.error('Database error (settings):', error);
        sendJSON(res, 500, {
          success: false,
          error: 'Database query failed',
          message: error.message
        });
      }
      return;
    }

    // API: Room Types - Real data
    if (path === '/api/room-types' && method === 'GET') {
      try {
        const hotelId = parsedUrl.query.hotel_id;
        let query = `
          SELECT 
            rt.id,
            rt.name,
            rt.description,
            rt.price_per_night,
            rt.max_occupancy,
            rt.amenities,
            rt.hotel_id,
            h.name as hotel_name
          FROM room_types rt
          LEFT JOIN hotels h ON rt.hotel_id = h.id
          WHERE rt.status = 'active'
        `;
        
        const params = [];
        if (hotelId) {
          query += ' AND rt.hotel_id = $1';
          params.push(hotelId);
        }
        
        query += ' ORDER BY rt.price_per_night ASC';
        
        const result = await pool.query(query, params);
        
        console.log(`🏨 Retrieved ${result.rows.length} room types from database`);
        
        sendJSON(res, 200, {
          success: true,
          data: result.rows,
          count: result.rows.length,
          source: 'database'
        });
      } catch (error) {
        console.error('Database error (room-types):', error);
        sendJSON(res, 500, {
          success: false,
          error: 'Database query failed',
          message: error.message
        });
      }
      return;
    }

    // API: Test endpoint
    if (path === '/api/test' && method === 'GET') {
      const dbStatus = await testDatabaseConnection();
      sendJSON(res, 200, {
        message: 'API endpoint working with real database',
        server: 'Node.js + PostgreSQL',
        version: '2.0.0',
        environment: process.env.NODE_ENV || 'development',
        database: {
          type: 'PostgreSQL (Neon)',
          status: dbStatus ? 'connected' : 'disconnected',
          url: process.env.DATABASE_URL ? 'configured' : 'missing'
        }
      });
      return;
    }

    // 404 - Not Found
    sendJSON(res, 404, {
      error: 'Not Found',
      message: `Path ${path} not found`,
      availableEndpoints: [
        'GET /',
        'GET /health',
        'GET /api/hotels',
        'GET /api/notifications',
        'GET /global-settings/room_price_per_night',
        'GET /api/room-types',
        'GET /api/test'
      ]
    });

  } catch (error) {
    console.error('Server error:', error);
    sendJSON(res, 500, {
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// Start server
server.listen(PORT, async () => {
  console.log(`🚀 Real Database Backend Server running on http://localhost:${PORT}`);
  console.log('🗄️  Database: PostgreSQL (Neon)');
  console.log('🔑 Environment:', process.env.NODE_ENV || 'development');
  
  // Test database connection on startup
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    console.log('⚠️  Server will continue but database operations may fail');
  }
  
  console.log('📋 Available endpoints:');
  console.log(`   GET http://localhost:${PORT}/                            - Server info`);
  console.log(`   GET http://localhost:${PORT}/health                      - Health check`);
  console.log(`   GET http://localhost:${PORT}/api/hotels                  - Hotels (real data)`);
  console.log(`   GET http://localhost:${PORT}/api/notifications           - Notifications (real data)`);
  console.log(`   GET http://localhost:${PORT}/global-settings/room_price_per_night - Room pricing (real data)`);
  console.log(`   GET http://localhost:${PORT}/api/room-types              - Room types (real data)`);
  console.log(`   GET http://localhost:${PORT}/api/test                    - API test`);
  console.log('');
  console.log('✅ Server ready to serve REAL DATA from PostgreSQL database!');
});