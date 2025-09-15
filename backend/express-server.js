import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Hotel Booking Backend API',
    status: 'running',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/test', (req, res) => {
  res.json({
    message: 'API endpoint working',
    data: {
      server: 'Express with Node.js',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

// Hotel endpoints
app.get('/api/hotels', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        name: 'Grand Hotel Bangkok',
        description: 'Luxury hotel in the heart of Bangkok',
        address: '123 Sukhumvit Road, Bangkok',
        rating: 4.5,
        price_range: '1000-3000'
      },
      {
        id: 2,
        name: 'Seaside Resort Phuket',
        description: 'Beautiful beachfront resort',
        address: '456 Patong Beach, Phuket',
        rating: 4.8,
        price_range: '2000-5000'
      }
    ]
  });
});

app.get('/api/rooms', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        hotel_id: 1,
        type: 'Standard Room',
        price: 1500,
        available: true
      },
      {
        id: 2,
        hotel_id: 1,
        type: 'Deluxe Room',
        price: 2500,
        available: true
      }
    ]
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Hotel Backend Server is running at http://localhost:${PORT}`);
  console.log('📋 Available endpoints:');
  console.log('   GET /        - Server info');
  console.log('   GET /health  - Health check');
  console.log('   GET /api/test - API test');
  console.log('   GET /api/hotels - Hotels list');
  console.log('   GET /api/rooms - Rooms list');
});