import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import 'dotenv/config';

// Simple server for testing
const app = new Elysia()
  .use(cors())
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
      environment: process.env.NODE_ENV || 'development'
    }
  }))
  .listen(3001);

console.log('🦊 Hotel Backend Server is running at http://localhost:3001');
console.log('📋 Available endpoints:');
console.log('  - GET / (Home)');
console.log('  - GET /health (Health check)'); 
console.log('  - GET /api/test (API test)');