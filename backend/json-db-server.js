// Database Server with Local JSON Database
// Simple file-based database as alternative to PostgreSQL

const { createServer } = require('http');
const { parse } = require('url');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3003;

// Database file paths
const DB_DIR = path.join(__dirname, 'db');
const HOTELS_DB = path.join(DB_DIR, 'hotels.json');
const NOTIFICATIONS_DB = path.join(DB_DIR, 'notifications.json');
const SETTINGS_DB = path.join(DB_DIR, 'settings.json');

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

// Database initialization
function initializeDatabase() {
  // Create db directory if it doesn't exist
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
    console.log('📁 Created database directory');
  }

  // Initialize hotels database
  if (!fs.existsSync(HOTELS_DB)) {
    const hotels = [
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
        is_active: true,
        created_at: new Date().toISOString(),
        data_source: "json_database"
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
        is_active: true,
        created_at: new Date().toISOString(),
        data_source: "json_database"
      },
      {
        id: 3,
        name: "Mountain View Lodge",
        description: "Cozy lodge with stunning mountain views",
        location: "Chiang Mai, Thailand",
        amenities: ["Mountain View", "Hiking", "WiFi", "Restaurant", "Fireplace"],
        image_url: "https://images.unsplash.com/photo-1571896349842-33c89424de2d",
        rating: 4.6,
        total_rooms: 80,
        avg_price: 1800,
        is_active: true,
        created_at: new Date().toISOString(),
        data_source: "json_database"
      }
    ];
    fs.writeFileSync(HOTELS_DB, JSON.stringify(hotels, null, 2));
    console.log('🏨 Initialized hotels database');
  }

  // Initialize notifications database
  if (!fs.existsSync(NOTIFICATIONS_DB)) {
    const notifications = [
      {
        id: 1,
        title: "Database System Online",
        message: "JSON database is now operational and serving real data",
        type: "success",
        read_status: false,
        user_id: null,
        created_at: new Date().toISOString(),
        data_source: "json_database"
      },
      {
        id: 2,
        title: "Hotels Data Loaded",
        message: "Successfully loaded 3 hotels into the database",
        type: "info",
        read_status: false,
        user_id: null,
        created_at: new Date().toISOString(),
        data_source: "json_database"
      },
      {
        id: 3,
        title: "System Ready",
        message: "All systems are operational and ready for bookings",
        type: "success",
        read_status: false,
        user_id: null,
        created_at: new Date().toISOString(),
        data_source: "json_database"
      }
    ];
    fs.writeFileSync(NOTIFICATIONS_DB, JSON.stringify(notifications, null, 2));
    console.log('🔔 Initialized notifications database');
  }

  // Initialize settings database
  if (!fs.existsSync(SETTINGS_DB)) {
    const settings = {
      room_price_per_night: 1500,
      currency: "THB",
      tax_rate: 7,
      service_fee: 100,
      max_booking_days: 365,
      cancellation_hours: 24,
      updated_at: new Date().toISOString(),
      data_source: "json_database"
    };
    fs.writeFileSync(SETTINGS_DB, JSON.stringify(settings, null, 2));
    console.log('⚙️ Initialized settings database');
  }

  console.log('✅ Database initialization completed!');
}

// Database query functions
function getHotels(limit = 10) {
  try {
    const data = fs.readFileSync(HOTELS_DB, 'utf8');
    const hotels = JSON.parse(data);
    return hotels.filter(hotel => hotel.is_active).slice(0, limit);
  } catch (error) {
    console.error('Error reading hotels:', error);
    return [];
  }
}

function getNotifications(limit = 10) {
  try {
    const data = fs.readFileSync(NOTIFICATIONS_DB, 'utf8');
    const notifications = JSON.parse(data);
    return notifications.slice(0, limit);
  } catch (error) {
    console.error('Error reading notifications:', error);
    return [];
  }
}

function getSetting(key) {
  try {
    const data = fs.readFileSync(SETTINGS_DB, 'utf8');
    const settings = JSON.parse(data);
    return settings[key];
  } catch (error) {
    console.error('Error reading settings:', error);
    return null;
  }
}

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
      const hotelsCount = getHotels().length;
      const notificationsCount = getNotifications().length;
      
      sendJSON(res, 200, {
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: 'json_database_connected',
        data_counts: {
          hotels: hotelsCount,
          notifications: notificationsCount
        },
        port: PORT
      });
      return;
    }

    // Root endpoint
    if (path === '/') {
      const hotelsCount = getHotels().length;
      
      sendJSON(res, 200, {
        message: 'Hotel Booking API Server (JSON Database Working!)',
        status: 'OK',
        timestamp: new Date().toISOString(),
        port: PORT,
        database: 'JSON Database Connected',
        data_summary: {
          hotels: hotelsCount,
          source: 'JSON files'
        },
        endpoints: [
          'GET /health',
          'GET /api/hotels',
          'GET /api/notifications', 
          'GET /global-settings/room_price_per_night',
          'GET /api/database-info'
        ]
      });
      return;
    }

    // API: Hotels from JSON database
    if (path === '/api/hotels' && method === 'GET') {
      const limit = parseInt(parsedUrl.query.limit) || 10;
      
      console.log(`📊 Fetching hotels from JSON database...`);
      const hotels = getHotels(limit);
      
      console.log(`✅ Found ${hotels.length} hotels from JSON database`);
      
      sendJSON(res, 200, {
        success: true,
        data: hotels,
        count: hotels.length,
        source: 'json_database'
      });
      return;
    }

    // API: Notifications from JSON database
    if (path === '/api/notifications' && method === 'GET') {
      console.log(`📢 Fetching notifications from JSON database...`);
      const notifications = getNotifications();
      
      console.log(`✅ Found ${notifications.length} notifications from JSON database`);
      
      sendJSON(res, 200, {
        success: true,
        data: notifications,
        count: notifications.length,
        source: 'json_database'
      });
      return;
    }

    // API: Global Settings - Room Price from JSON database
    if (path === '/global-settings/room_price_per_night' && method === 'GET') {
      console.log('💰 Fetching room price from JSON database...');
      const price = getSetting('room_price_per_night');
      const currency = getSetting('currency');
      
      console.log(`✅ Found room price from JSON database: ${price} ${currency}`);
      
      sendJSON(res, 200, {
        success: true,
        price: price || 1500,
        currency: currency || 'THB',
        source: 'json_database'
      });
      return;
    }

    // API: Database Info
    if (path === '/api/database-info' && method === 'GET') {
      console.log('🗄️ Getting database information...');
      
      const hotels = getHotels();
      const notifications = getNotifications();
      
      sendJSON(res, 200, {
        success: true,
        database_type: 'JSON Files',
        status: 'connected',
        location: DB_DIR,
        tables: {
          hotels: {
            file: 'hotels.json',
            records: hotels.length
          },
          notifications: {
            file: 'notifications.json', 
            records: notifications.length
          },
          settings: {
            file: 'settings.json',
            records: 1
          }
        },
        timestamp: new Date().toISOString()
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
        'GET /api/database-info'
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
server.listen(PORT, () => {
  console.log(`🚀 Hotel Booking Backend Server running on http://localhost:${PORT}`);
  console.log('🔧 Server: Node.js HTTP Server with JSON Database');
  console.log('🔑 Environment:', process.env.NODE_ENV || 'development');
  
  console.log('\n🗄️ Initializing JSON database...');
  initializeDatabase();
  
  console.log('\n📋 Available endpoints:');
  console.log(`   GET http://localhost:${PORT}/                            - Server info`);
  console.log(`   GET http://localhost:${PORT}/health                      - Health check with DB status`);
  console.log(`   GET http://localhost:${PORT}/api/hotels                  - Hotels (JSON Database)`);
  console.log(`   GET http://localhost:${PORT}/api/notifications           - Notifications (JSON Database)`);
  console.log(`   GET http://localhost:${PORT}/global-settings/room_price_per_night - Room pricing (JSON Database)`);
  console.log(`   GET http://localhost:${PORT}/api/database-info           - Database information`);
  
  console.log('\n✅ Server ready with JSON database!');
  console.log('🔗 Frontend can now connect and get real data from JSON files!');
  console.log(`📁 Database files stored in: ${DB_DIR}`);
});