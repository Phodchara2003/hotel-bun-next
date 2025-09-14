import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';

const app = new Elysia()
  .use(cors())
  .get('/', () => {
    return {
      message: 'Hotel Booking Backend API',
      status: 'running',
      timestamp: new Date().toISOString(),
      port: 3001
    };
  })
  .get('/health', () => {
    return {
      status: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };
  })
  .get('/api/test', () => {
    return {
      message: 'API endpoint working',
      data: {
        server: 'Elysia with Bun',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      }
    };
  })
  .listen(3001);

console.log('🦊 Hotel Backend Server is running at http://localhost:3001');
console.log('📋 Available endpoints:');
console.log('   GET /        - Server info');
console.log('   GET /health  - Health check');
console.log('   GET /api/test - API test');