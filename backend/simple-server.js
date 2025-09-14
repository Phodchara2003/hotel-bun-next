import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';

const app = new Elysia()
  .use(cors())
  .get('/', () => ({ 
    message: 'Hotel Booking API Server is running!',
    status: 'OK',
    timestamp: new Date().toISOString()
  }))
  .get('/health', () => ({ 
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  }))
  .listen(3003);

console.log('🚀 Backend server is running on http://localhost:3003');
console.log('📝 API documentation: http://localhost:3003/swagger');
console.log('💚 Health check: http://localhost:3003/health');