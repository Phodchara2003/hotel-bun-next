import { createServer } from 'http';
import { parse } from 'url';

const PORT = 3001;

// Mock data
const hotels = [
  {
    id: 1,
    name: 'Grand Hotel Bangkok',
    description: 'Luxury hotel in the heart of Bangkok',
    address: '123 Sukhumvit Road, Bangkok',
    rating: 4.5,
    price_range: '1000-3000',
    images: ['/images/hotel1.jpg'],
    amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant']
  },
  {
    id: 2,
    name: 'Seaside Resort Phuket',
    description: 'Beautiful beachfront resort',
    address: '456 Patong Beach, Phuket',
    rating: 4.8,
    price_range: '2000-5000',
    images: ['/images/hotel2.jpg'],
    amenities: ['WiFi', 'Beach Access', 'Pool', 'Spa']
  }
];

const rooms = [
  {
    id: 1,
    hotel_id: 1,
    type: 'Standard Room',
    price: 1500,
    available: true,
    max_guests: 2
  },
  {
    id: 2,
    hotel_id: 1,
    type: 'Deluxe Room',
    price: 2500,
    available: true,
    max_guests: 3
  },
  {
    id: 3,
    hotel_id: 2,
    type: 'Beach Villa',
    price: 4000,
    available: true,
    max_guests: 4
  }
];

const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cache-Control, Pragma, Expires, If-Modified-Since, If-None-Match');
};

const sendJSON = (res, statusCode, data) => {
  setCorsHeaders(res);
  res.setHeader('Content-Type', 'application/json');
  res.writeHead(statusCode);
  res.end(JSON.stringify(data, null, 2));
};

const server = createServer((req, res) => {
  const { pathname, query } = parse(req.url, true);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    res.writeHead(200);
    res.end();
    return;
  }

  console.log(`${req.method} ${pathname}`);

  // Routes
  switch (pathname) {
    case '/':
      sendJSON(res, 200, {
        message: 'Hotel Booking Backend API',
        status: 'running',
        timestamp: new Date().toISOString(),
        port: PORT
      });
      break;

    case '/health':
      sendJSON(res, 200, {
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      });
      break;

    case '/api/test':
      sendJSON(res, 200, {
        message: 'API endpoint working',
        data: {
          server: 'Node.js HTTP Server',
          version: '1.0.0',
          environment: process.env.NODE_ENV || 'development'
        }
      });
      break;

    case '/api/hotels':
      sendJSON(res, 200, {
        success: true,
        data: hotels
      });
      break;

    case '/api/rooms':
      const hotel_id = query.hotel_id ? parseInt(query.hotel_id) : null;
      const filteredRooms = hotel_id 
        ? rooms.filter(room => room.hotel_id === hotel_id)
        : rooms;
      
      sendJSON(res, 200, {
        success: true,
        data: filteredRooms
      });
      break;

    case '/api/bookings':
      sendJSON(res, 200, {
        success: true,
        data: [
          {
            id: 1,
            user_id: 1,
            hotel_id: 1,
            room_id: 1,
            check_in: '2025-09-20',
            check_out: '2025-09-25',
            status: 'confirmed'
          }
        ]
      });
      break;

    default:
      sendJSON(res, 404, {
        error: 'Not Found',
        message: `Endpoint ${pathname} not found`
      });
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Hotel Backend Server is running at http://localhost:${PORT}`);
  console.log('📋 Available endpoints:');
  console.log('   GET /             - Server info');
  console.log('   GET /health       - Health check');
  console.log('   GET /api/test     - API test');
  console.log('   GET /api/hotels   - Hotels list');
  console.log('   GET /api/rooms    - Rooms list');
  console.log('   GET /api/bookings - Bookings list');
});