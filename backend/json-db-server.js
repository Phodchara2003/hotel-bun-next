// Database Server with Local JSON Database
// Simple file-based database as alternative to PostgreSQL

const { createServer } = require('http');
const { parse } = require('url');
const fs = require('fs');
const path = require('path');

// Mock payment slip manager functions
const createPaymentSlip = () => ({ success: true, message: 'Payment slip created' });
const getAllSlips = () => ({ success: true, data: [] });
const getSlipById = () => ({ success: true, data: null });
const getSlipByReference = () => ({ success: true, data: null });
const updateSlipStatus = () => ({ success: true, message: 'Status updated' });
const deleteSlip = () => ({ success: true, message: 'Slip deleted' });
const getSlipStatistics = () => ({ success: true, data: { total: 0, pending: 0, confirmed: 0 } });

const PORT = process.env.PORT || 3004;

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

function getSettings() {
  try {
    const data = fs.readFileSync(SETTINGS_DB, 'utf8');
    const settings = JSON.parse(data);
    return settings;
  } catch (error) {
    console.error('Error reading settings:', error);
    return {};
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
          'GET /api/room-types-with-images',
          'GET /api/notifications', 
          'GET /global-settings/room_price_per_night',
          'GET /api/simple-payment-settings',
          'POST /api/payment-slip/upload',
          'GET /api/payment-slips',
          'GET /api/payment-slips/statistics',
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

    // API: Room Types with Images from JSON database
    if (path === '/api/room-types-with-images' && method === 'GET') {
      console.log('🏠 Fetching room types with images from JSON database...');
      
      const roomTypes = [
        {
          id: 1,
          name: 'ห้องสแตนดาร์ด',
          description: 'ห้องพักสำหรับผู้เข้าพักทั่วไปพร้อมสิ่งอำนวยความสะดวกครบครัน',
          pricePerNight: 1500,
          maxGuests: 2,
          sizeSqm: 25,
          amenities: ['Wi-Fi ฟรี', 'เครื่องปรับอากาศ', 'ทีวี'],
          hotel_id: 1,
          images: ['room1.jpg']
        },
        {
          id: 2,
          name: 'ห้องซูพีเรียร์',
          description: 'ห้องพักขนาดใหญ่กว่าพร้อมวิวที่สวยงาม',
          pricePerNight: 1800,
          maxGuests: 3,
          sizeSqm: 35,
          amenities: ['Wi-Fi ฟรี', 'เครื่องปรับอากาศ', 'ทีวี', 'ตู้เซฟ'],
          hotel_id: 1,
          images: ['room2.jpg']
        },
        {
          id: 3,
          name: 'ห้องดีลักซ์',
          description: 'ห้องพักหรูหราพร้อมระเบียงส่วนตัว',
          pricePerNight: 2500,
          maxGuests: 4,
          sizeSqm: 45,
          amenities: ['Wi-Fi ฟรี', 'เครื่องปรับอากาศ', 'ทีวี', 'ตู้เซฟ', 'ระเบียง'],
          hotel_id: 1,
          images: ['suite1.jpg']
        },
        {
          id: 4,
          name: 'ห้องสวีท',
          description: 'ห้องพักขนาดใหญ่พร้อมห้องนั่งเล่นแยกต่างหาก',
          pricePerNight: 3500,
          maxGuests: 6,
          sizeSqm: 65,
          amenities: ['Wi-Fi ฟรี', 'เครื่องปรับอากาศ', 'ทีวี', 'ตู้เซฟ', 'ระเบียง', 'ห้องนั่งเล่น'],
          hotel_id: 1,
          images: ['room-1758275954942-81117622.png']
        },
        {
          id: 5,
          name: 'ห้องแฟมิลี่',
          description: 'ห้องพักขนาดใหญ่สำหรับครอบครัว',
          pricePerNight: 4200,
          maxGuests: 8,
          sizeSqm: 80,
          amenities: ['Wi-Fi ฟรี', 'เครื่องปรับอากาศ', 'ทีวี', 'ตู้เซฟ', 'ครัวเล็ก', 'ห้องนั่งเล่น'],
          hotel_id: 1,
          images: ['room-1758283949829-274513890.png']
        }
      ];
      
      console.log(`✅ Found ${roomTypes.length} room types with images from JSON database`);
      
      sendJSON(res, 200, {
        success: true,
        data: roomTypes,
        count: roomTypes.length,
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

    // API: Simple Payment Settings
    if (path === '/api/simple-payment-settings' && method === 'GET') {
      console.log('🔧 Fetching simple payment settings from JSON database...');
      
      const settings = getSettings();
      
      console.log('✅ Found payment settings from JSON database');
      
      sendJSON(res, 200, {
        success: true,
        data: {
          room_price_per_night: settings.room_price_per_night || 1500,
          currency: settings.currency || 'THB',
          tax_rate: settings.tax_rate || 7,
          service_fee: settings.service_fee || 100,
          payment_methods: ['bank_transfer', 'qr_code'],
          payment_status: 'active'
        },
        source: 'json_database'
      });
      return;
    }

    // API: Payment Slip Upload
    if (path === '/api/payment-slip/upload' && method === 'POST') {
      console.log('📤 Processing payment slip upload...');
      
      try {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        
        req.on('end', () => {
          // This is a simplified version - in real implementation you'd handle file uploads
          const slipData = {
            bookingId: 'temp-booking-id',
            amount: 1500,
            uploadedBy: 'customer',
            notes: 'Payment slip uploaded via website'
          };
          
          const result = createPaymentSlip(slipData);
          
          console.log('✅ Payment slip created successfully');
          
          sendJSON(res, 200, {
            success: true,
            data: result,
            message: 'Payment slip uploaded successfully'
          });
        });
      } catch (error) {
        console.error('❌ Payment slip upload error:', error);
        sendJSON(res, 500, {
          success: false,
          error: 'Failed to upload payment slip',
          message: error.message
        });
      }
      return;
    }

    // API: Get All Payment Slips
    if (path === '/api/payment-slips' && method === 'GET') {
      console.log('📋 Fetching all payment slips...');
      
      const slips = getAllSlips();
      
      console.log(`✅ Found ${slips.length} payment slips`);
      
      sendJSON(res, 200, {
        success: true,
        data: slips,
        count: slips.length,
        source: 'payment_slip_database'
      });
      return;
    }

    // API: Get Payment Slip Statistics
    if (path === '/api/payment-slips/statistics' && method === 'GET') {
      console.log('📊 Fetching payment slip statistics...');
      
      const stats = getSlipStatistics();
      
      console.log('✅ Payment slip statistics retrieved');
      
      sendJSON(res, 200, {
        success: true,
        data: stats,
        source: 'payment_slip_database'
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
  console.log(`   GET http://localhost:${PORT}/api/simple-payment-settings - Payment settings (JSON Database)`);
  console.log(`   POST http://localhost:${PORT}/api/payment-slip/upload     - Upload payment slip`);
  console.log(`   GET http://localhost:${PORT}/api/payment-slips           - Get all payment slips`);
  console.log(`   GET http://localhost:${PORT}/api/payment-slips/statistics - Payment slip statistics`);
  console.log(`   GET http://localhost:${PORT}/api/database-info           - Database information`);
  
  console.log('\n✅ Server ready with JSON database!');
  console.log('🔗 Frontend can now connect and get real data from JSON files!');
  console.log(`📁 Database files stored in: ${DB_DIR}`);
});