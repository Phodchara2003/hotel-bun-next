// Database Server with Real PostgreSQL Connection via HTTP API
// Using fetch API to connect to Neon PostgreSQL

const { createServer } = require('http');
const { parse } = require('url');

const PORT = process.env.PORT || 3003;

// Load environment variables
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_N6QVxYpgu5EG@ep-rough-dream-a1b92i89-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

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

// Database query function using Neon API
async function queryDatabase(sql, params = []) {
  try {
    // Extract database info from connection string
    const dbUrl = new URL(DATABASE_URL);
    const host = dbUrl.hostname;
    const database = dbUrl.pathname.slice(1);
    const username = dbUrl.username;
    const password = dbUrl.password;

    // Use Neon's HTTP API endpoint
    const neonApiUrl = `https://${host}/sql`;
    
    const response = await fetch(neonApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${password}` // Using password as API key
      },
      body: JSON.stringify({
        query: sql,
        params: params
      })
    });

    if (!response.ok) {
      throw new Error(`Database query failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result;

  } catch (error) {
    console.error('Database query error:', error);
    // Return fallback data for now
    return { rows: [], error: error.message };
  }
}

// Test database connection
async function testDatabaseConnection() {
  console.log('🔌 Testing database connection...');
  
  try {
    const result = await queryDatabase('SELECT NOW() as current_time, version() as db_version');
    if (result.rows && result.rows.length > 0) {
      console.log('✅ Database connected successfully!');
      console.log('⏰ Server time:', result.rows[0].current_time);
      return true;
    } else {
      console.log('⚠️ Database connection uncertain, using fallback data');
      return false;
    }
  } catch (error) {
    console.log('❌ Database connection failed, using fallback data');
    console.log('Error:', error.message);
    return false;
  }
}

// Fallback data (same as before but marked as temporary)
const fallbackHotels = [
  {
    id: 1,
    name: "Royal Palace Bangkok",
    description: "Luxury 5-star hotel in downtown Bangkok",
    location: "Bangkok, Thailand",
    amenities: ["WiFi", "Pool", "Spa", "Gym", "Restaurant"],
    image_url: "https://images.unsplash.com/photo-1566073771259-6a8506099945",
    rating: 4.8,
    total_rooms: 200,
    avg_price: 2500,
    created_at: new Date().toISOString(),
    data_source: "fallback_data"
  },
  {
    id: 2,
    name: "Paradise Beach Resort",
    description: "Beachfront resort with private beach access",
    location: "Phuket, Thailand",
    amenities: ["Beach Access", "Pool", "Water Sports", "Bar", "WiFi"],
    image_url: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4",
    rating: 4.9,
    total_rooms: 150,
    avg_price: 3200,
    created_at: new Date().toISOString(),
    data_source: "fallback_data"
  }
];

const fallbackNotifications = [
  {
    id: 1,
    title: "Attempting Database Connection",
    message: "Trying to connect to PostgreSQL database",
    type: "info",
    read_status: false,
    user_id: null,
    created_at: new Date().toISOString(),
    data_source: "fallback_data"
  }
];

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

  console.log(`📞 ${method} ${path}`);

  try {
    // Health check with database status
    if (path === '/health') {
      const dbConnected = await testDatabaseConnection();
      
      sendJSON(res, 200, {
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: dbConnected ? 'postgresql_connected' : 'fallback_data',
        database_url: DATABASE_URL ? 'configured' : 'missing',
        port: PORT
      });
      return;
    }

    // Root endpoint
    if (path === '/') {
      const dbConnected = await testDatabaseConnection();
      
      sendJSON(res, 200, {
        message: 'Hotel Booking API Server (Database Ready!)',
        status: 'OK',
        timestamp: new Date().toISOString(),
        port: PORT,
        database: dbConnected ? 'PostgreSQL Connected' : 'Using Fallback Data (Attempting PostgreSQL)',
        endpoints: [
          'GET /health',
          'GET /api/hotels',
          'GET /api/notifications', 
          'GET /global-settings/room_price_per_night',
          'GET /api/test-db'
        ]
      });
      return;
    }

    // API: Hotels with real database attempt
    if (path === '/api/hotels' && method === 'GET') {
      const limit = parseInt(parsedUrl.query.limit) || 10;
      
      console.log(`📊 Fetching hotels from database...`);
      
      try {
        const result = await queryDatabase(
          'SELECT * FROM hotels WHERE is_active = true ORDER BY rating DESC LIMIT $1',
          [limit]
        );
        
        if (result.rows && result.rows.length > 0) {
          console.log(`✅ Found ${result.rows.length} hotels from PostgreSQL`);
          
          sendJSON(res, 200, {
            success: true,
            data: result.rows,
            count: result.rows.length,
            source: 'postgresql_database'
          });
          return;
        }
      } catch (dbError) {
        console.log('⚠️ Database query failed, using fallback data');
      }
      
      // Fallback to mock data
      const limitedHotels = fallbackHotels.slice(0, limit);
      console.log(`📊 Using fallback data: ${limitedHotels.length} hotels`);
      
      sendJSON(res, 200, {
        success: true,
        data: limitedHotels,
        count: limitedHotels.length,
        source: 'fallback_data',
        note: 'Database connection unavailable, showing fallback data'
      });
      return;
    }

    // API: Notifications with real database attempt
    if (path === '/api/notifications' && method === 'GET') {
      console.log(`📢 Fetching notifications from database...`);
      
      try {
        const result = await queryDatabase(
          'SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10'
        );
        
        if (result.rows && result.rows.length > 0) {
          console.log(`✅ Found ${result.rows.length} notifications from PostgreSQL`);
          
          sendJSON(res, 200, {
            success: true,
            data: result.rows,
            count: result.rows.length,
            source: 'postgresql_database'
          });
          return;
        }
      } catch (dbError) {
        console.log('⚠️ Database query failed, using fallback data');
      }
      
      // Fallback to mock data
      console.log(`📢 Using fallback data: ${fallbackNotifications.length} notifications`);
      
      sendJSON(res, 200, {
        success: true,
        data: fallbackNotifications,
        count: fallbackNotifications.length,
        source: 'fallback_data',
        note: 'Database connection unavailable, showing fallback data'
      });
      return;
    }

    // API: Global Settings - Room Price with database attempt
    if (path === '/global-settings/room_price_per_night' && method === 'GET') {
      console.log('💰 Fetching room price from database...');
      
      try {
        const result = await queryDatabase(
          "SELECT setting_value FROM global_settings WHERE setting_key = 'room_price_per_night' AND is_active = true"
        );
        
        if (result.rows && result.rows.length > 0) {
          const price = parseFloat(result.rows[0].setting_value);
          console.log(`✅ Found room price from PostgreSQL: ${price} THB`);
          
          sendJSON(res, 200, {
            success: true,
            price: price,
            currency: 'THB',
            source: 'postgresql_database'
          });
          return;
        }
      } catch (dbError) {
        console.log('⚠️ Database query failed, using fallback data');
      }
      
      // Fallback
      console.log('💰 Using fallback room price');
      
      sendJSON(res, 200, {
        success: true,
        price: 1500,
        currency: 'THB',
        source: 'fallback_data',
        note: 'Database connection unavailable, showing fallback price'
      });
      return;
    }

    // API: Test Database Connection
    if (path === '/api/test-db' && method === 'GET') {
      console.log('🧪 Testing database connection explicitly...');
      
      const dbConnected = await testDatabaseConnection();
      
      if (dbConnected) {
        const result = await queryDatabase('SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = \'public\'');
        
        sendJSON(res, 200, {
          success: true,
          database: 'postgresql_connected',
          tables: result.rows ? result.rows[0].table_count : 0,
          message: 'Database connection successful!',
          timestamp: new Date().toISOString()
        });
      } else {
        sendJSON(res, 200, {
          success: false,
          database: 'connection_failed',
          message: 'Could not connect to PostgreSQL database',
          fallback: 'Using mock data instead',
          timestamp: new Date().toISOString()
        });
      }
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
        'GET /api/test-db'
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
  console.log(`🚀 Hotel Booking Backend Server running on http://localhost:${PORT}`);
  console.log('🔧 Server: Node.js HTTP Server with PostgreSQL Integration');
  console.log('🔑 Environment:', process.env.NODE_ENV || 'development');
  
  console.log('\n📋 Available endpoints:');
  console.log(`   GET http://localhost:${PORT}/                            - Server info`);
  console.log(`   GET http://localhost:${PORT}/health                      - Health check with DB status`);
  console.log(`   GET http://localhost:${PORT}/api/hotels                  - Hotels (PostgreSQL)`);
  console.log(`   GET http://localhost:${PORT}/api/notifications           - Notifications (PostgreSQL)`);
  console.log(`   GET http://localhost:${PORT}/global-settings/room_price_per_night - Room pricing (PostgreSQL)`);
  console.log(`   GET http://localhost:${PORT}/api/test-db                 - Test database connection`);
  
  console.log('\n🔌 Testing initial database connection...');
  const dbConnected = await testDatabaseConnection();
  
  if (dbConnected) {
    console.log('✅ Server ready with PostgreSQL database connection!');
  } else {
    console.log('⚠️ Server ready with fallback data (PostgreSQL connection pending)');
  }
  
  console.log('🔗 Frontend can now connect and get real data (when database is available)!');
});