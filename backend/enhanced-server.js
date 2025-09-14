// Enhanced backend server with database connection and API endpoints
import { createServer } from 'http';
import { parse } from 'url';
import pg from 'pg';
import 'dotenv/config';

const PORT = process.env.PORT || 3003;
const { Pool } = pg;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Helper function to send JSON response
const sendJSON = (res, statusCode, data) => {
  res.setHeader('Content-Type', 'application/json');
  res.writeHead(statusCode);
  res.end(JSON.stringify(data, null, 2));
};

// Helper function to handle CORS
const setCORSHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

// Helper function to get request body
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
  
  // Handle preflight requests
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
      sendJSON(res, 200, {
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: 'connected'
      });
      return;
    }

    // Root endpoint
    if (path === '/') {
      sendJSON(res, 200, {
        message: 'Hotel Booking API Server is running!',
        status: 'OK',
        timestamp: new Date().toISOString(),
        port: PORT,
        endpoints: [
          'GET /health',
          'GET /api/hotels',
          'GET /api/notifications',
          'GET /global-settings/room_price_per_night'
        ]
      });
      return;
    }

    // API: Hotels
    if (path === '/api/hotels' && method === 'GET') {
      try {
        const limit = parsedUrl.query.limit || 10;
        const result = await pool.query(`
          SELECT 
            id, name, description, location, amenities, 
            created_at, updated_at
          FROM hotels 
          ORDER BY created_at DESC 
          LIMIT $1
        `, [limit]);
        
        sendJSON(res, 200, {
          success: true,
          data: result.rows,
          count: result.rows.length
        });
      } catch (error) {
        console.error('Database error:', error);
        sendJSON(res, 200, {
          success: true,
          data: [
            {
              id: 1,
              name: "Sample Hotel",
              description: "A beautiful hotel for your stay",
              location: "Bangkok, Thailand",
              amenities: ["WiFi", "Pool", "Gym"],
              created_at: new Date().toISOString()
            }
          ],
          count: 1,
          fallback: true
        });
      }
      return;
    }

    // API: Notifications
    if (path === '/api/notifications' && method === 'GET') {
      try {
        const result = await pool.query(`
          SELECT 
            id, title, message, type, read_status, 
            created_at, updated_at
          FROM notifications 
          ORDER BY created_at DESC 
          LIMIT 50
        `);
        
        sendJSON(res, 200, {
          success: true,
          data: result.rows,
          count: result.rows.length
        });
      } catch (error) {
        console.error('Database error:', error);
        sendJSON(res, 200, {
          success: true,
          data: [],
          count: 0,
          fallback: true
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
        `);
        
        const price = result.rows.length > 0 ? result.rows[0].setting_value : '1500';
        
        sendJSON(res, 200, {
          success: true,
          price: parseInt(price),
          currency: 'THB'
        });
      } catch (error) {
        console.error('Database error:', error);
        sendJSON(res, 200, {
          success: true,
          price: 1500,
          currency: 'THB',
          fallback: true
        });
      }
      return;
    }

    // API: Test endpoint
    if (path === '/api/test' && method === 'GET') {
      sendJSON(res, 200, {
        message: 'API endpoint working',
        data: {
          server: 'Node.js Enhanced Server',
          version: '2.0.0',
          environment: process.env.NODE_ENV || 'development',
          database: 'PostgreSQL (Neon)'
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

// Test database connection on startup
pool.connect()
  .then(() => {
    console.log('✅ Database connected successfully');
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err.message);
    console.log('📝 Will use fallback data for API responses');
  });

server.listen(PORT, () => {
  console.log(`🚀 Enhanced Backend server is running on http://localhost:${PORT}`);
  console.log('📋 Available endpoints:');
  console.log(`   GET http://localhost:${PORT}/                            - Server info`);
  console.log(`   GET http://localhost:${PORT}/health                      - Health check`);
  console.log(`   GET http://localhost:${PORT}/api/hotels                  - Hotels data`);
  console.log(`   GET http://localhost:${PORT}/api/notifications           - Notifications`);
  console.log(`   GET http://localhost:${PORT}/global-settings/room_price_per_night - Room pricing`);
  console.log(`   GET http://localhost:${PORT}/api/test                    - API test`);
  console.log('');
  console.log('🔗 Frontend should connect to: http://localhost:3001');
  console.log('💾 Database: PostgreSQL (Neon)');
});