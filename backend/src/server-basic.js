import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';

// Simple server for testing without dotenv
const app = new Elysia()
  .use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'Accept', 
      'Origin', 
      'X-Requested-With',
      'Cache-Control',
      'Pragma',
      'Expires',
      'If-Modified-Since',
      'If-None-Match'
    ]
  }))
  .get('/', () => ({
    message: 'Hotel Booking Backend API',
    status: 'running',
    timestamp: new Date().toISOString()
  }))
  .get('/health', () => ({
    status: 'healthy',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  }))
  .get('/api/test', () => ({
    message: 'API endpoint working',
    data: {
      server: 'Elysia',
      version: '1.0.0',
      environment: 'development'
    }
  }))
  .listen(3001);

console.log('🦊 Hotel Backend Server is running at http://localhost:3001');
console.log('📋 Available endpoints:');
console.log('  - GET / (Home)');
console.log('  - GET /health (Health check)'); 
console.log('  - GET /api/test (API test)');