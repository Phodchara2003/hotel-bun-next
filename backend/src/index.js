import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import 'dotenv/config';
import { authRoutes } from './routes/auth.js';
import { hotelRoutes } from './routes/hotels.js';
import { bookingRoutes } from './routes/bookings.js';
import { adminRoomsRoutes } from './routes/admin-rooms.js';
import { adminUsersRoutes } from './routes/admin-users.js';

// Load environment variables
if (process.env.NODE_ENV !== 'production') {
  const fs = await import('fs');
  if (fs.existsSync('.env')) {
    const env = fs.readFileSync('.env', 'utf-8');
    env.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    });
  }
}

const app = new Elysia()
  .use(cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3003',
      process.env.FRONTEND_URL
    ].filter(Boolean),
    credentials: true
  }))
  .use(swagger({
    documentation: {
      info: {
        title: 'Hotel Booking API',
        version: '1.0.0',
        description: 'API for hotel booking system'
      },
      tags: [
        { name: 'Authentication', description: 'User authentication endpoints' },
        { name: 'Hotels', description: 'Hotel and room management endpoints' },
        { name: 'Bookings', description: 'Booking management endpoints' }
      ]
    }
  }))
  
  // Health check endpoint
  .get('/health', () => ({ 
    status: 'OK', 
    message: 'Hotel Booking API is running',
    timestamp: new Date().toISOString()
  }))
  
  // API routes
  .group('/api', (app) => 
    app
      .use(authRoutes)
      .use(hotelRoutes)
      .use(bookingRoutes)
      .use(adminRoomsRoutes)
      .use(adminUsersRoutes)
  )
  
  // Error handling
  .onError(({ code, error, set }) => {
    console.error('Server error:', error);
    
    switch (code) {
      case 'VALIDATION':
        set.status = 422;
        return {
          error: 'Validation Error',
          message: error.message
        };
      case 'NOT_FOUND':
        set.status = 404;
        return {
          error: 'Not Found',
          message: 'The requested resource was not found'
        };
      default:
        set.status = 500;
        return {
          error: 'Internal Server Error',
          message: 'Something went wrong'
        };
    }
  })
  
  .listen(process.env.PORT || 3001);

console.log(`🚀 Hotel Booking API is running at ${app.server?.hostname}:${app.server?.port}`);
console.log(`📚 API Documentation available at http://localhost:${process.env.PORT || 3001}/swagger`);

export default app;
