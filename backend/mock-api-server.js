// API Backend server with mock data (no database dependency)
import { createServer } from 'http';
import { parse } from 'url';

const PORT = process.env.PORT || 3003;

// Mock data
const mockHotels = [
  {
    id: 1,
    name: "Grand Palace Hotel Bangkok",
    description: "Luxury hotel in the heart of Bangkok with stunning city views",
    location: "Bangkok, Thailand",
    amenities: ["WiFi", "Pool", "Gym", "Spa", "Restaurant"],
    price_per_night: 2500,
    rating: 4.8,
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    name: "Seaside Resort Phuket",
    description: "Beautiful beachfront resort with private beach access",
    location: "Phuket, Thailand",
    amenities: ["WiFi", "Beach Access", "Pool", "Water Sports", "Bar"],
    price_per_night: 3200,
    rating: 4.9,
    created_at: new Date().toISOString()
  }
];

const mockNotifications = [
  {
    id: 1,
    title: "Welcome to Hotel Booking System",
    message: "Thank you for choosing our hotel booking platform",
    type: "info",
    read_status: false,
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    title: "Booking Confirmation",
    message: "Your booking has been confirmed. Check-in: Today",
    type: "success",
    read_status: false,
    created_at: new Date().toISOString()
  }
];

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
        database: 'mock_data'
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
      const limit = parseInt(parsedUrl.query.limit) || 10;
      const limitedHotels = mockHotels.slice(0, limit);
      
      sendJSON(res, 200, {
        success: true,
        data: limitedHotels,
        count: limitedHotels.length,
        total: mockHotels.length
      });
      return;
    }

    // API: Notifications
    if (path === '/api/notifications' && method === 'GET') {
      sendJSON(res, 200, {
        success: true,
        data: mockNotifications,
        count: mockNotifications.length
      });
      return;
    }

    // API: Global Settings - Room Price
    if (path === '/global-settings/room_price_per_night' && method === 'GET') {
      sendJSON(res, 200, {
        success: true,
        price: 1500,
        currency: 'THB',
        source: 'default_setting'
      });
      return;
    }

    // API: Test endpoint
    if (path === '/api/test' && method === 'GET') {
      sendJSON(res, 200, {
        message: 'API endpoint working',
        data: {
          server: 'Node.js Mock API Server',
          version: '1.5.0',
          environment: process.env.NODE_ENV || 'development',
          database: 'Mock Data (In-Memory)'
        }
      });
      return;
    }

    // Additional API endpoints that frontend might call
    
    // API: Room Types
    if (path === '/api/room-types' && method === 'GET') {
      sendJSON(res, 200, {
        success: true,
        data: [
          { id: 1, name: 'Standard Room', price: 1500, capacity: 2 },
          { id: 2, name: 'Deluxe Room', price: 2500, capacity: 2 },
          { id: 3, name: 'Suite', price: 4000, capacity: 4 }
        ]
      });
      return;
    }

    // API: User Profile (basic)
    if (path === '/api/profile' && method === 'GET') {
      sendJSON(res, 200, {
        success: true,
        data: {
          id: 1,
          name: 'Guest User',
          email: 'guest@example.com',
          role: 'guest'
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
        'GET /api/profile',
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

server.listen(PORT, () => {
  console.log(`🚀 Mock API Backend server is running on http://localhost:${PORT}`);
  console.log('📋 Available endpoints:');
  console.log(`   GET http://localhost:${PORT}/                            - Server info`);
  console.log(`   GET http://localhost:${PORT}/health                      - Health check`);
  console.log(`   GET http://localhost:${PORT}/api/hotels                  - Hotels data (mock)`);
  console.log(`   GET http://localhost:${PORT}/api/notifications           - Notifications (mock)`);
  console.log(`   GET http://localhost:${PORT}/global-settings/room_price_per_night - Room pricing (mock)`);
  console.log(`   GET http://localhost:${PORT}/api/room-types              - Room types (mock)`);
  console.log(`   GET http://localhost:${PORT}/api/profile                 - User profile (mock)`);
  console.log(`   GET http://localhost:${PORT}/api/test                    - API test`);
  console.log('');
  console.log('🔗 Frontend should connect to: http://localhost:3001');
  console.log('💾 Database: Mock Data (In-Memory)');
  console.log('✅ All API endpoints are ready!');
});