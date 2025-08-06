import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import 'dotenv/config';
import { authRoutes } from './routes/auth.js';
import { hotelRoutes } from './routes/hotels.js';
import { bookingRoutes } from './routes/bookings.js';
import { notificationRoutes } from './routes/notifications.js';
import { adminRoomsRoutes } from './routes/admin-rooms.js';
import { adminUsersRoutes } from './routes/admin-users.js';
import { paymentSettingsRoutes } from './routes/payment-settings-real.js';
import { paymentSlipRoutes } from './routes/payment-slip.js';
import { roomStatusRoutes } from './routes/room-status-new.js';
import forgotPasswordRoutes from './routes/forgotPassword.js';
import userEmailRoutes from './routes/userEmailSettings.js';
import changeEmailRoutes from './routes/changeEmail.js';
import './db/create-user-email-table.js'; // Create user email settings table
import './db/create-payment-settings-table.js'; // Create payment settings table
import './db/add-payment-slip-columns.js'; // Add payment slip columns

// Load environment variables
if (process.env.NODE_ENV !== 'production') {
  const fs = await import('fs');
  const path = await import('path');
  const envPath = path.join(path.dirname(import.meta.url.replace('file:///', '')), '..', '.env');
  console.log('Looking for .env at:', envPath);
  
  if (fs.existsSync(envPath)) {
    console.log('Found .env file, loading...');
    const env = fs.readFileSync(envPath, 'utf-8');
    env.split('\n').forEach(line => {
      const [key, ...rest] = line.split('=');
      const value = rest.join('=');
      if (key && value && !key.startsWith('#')) {
        process.env[key.trim()] = value.trim();
      }
    });
    console.log('DATABASE_URL loaded:', process.env.DATABASE_URL ? 'Yes' : 'No');
  } else {
    console.log('.env file not found at:', envPath);
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
  
  // Static file serving for uploads
  .get('/uploads/*', async ({ params, set }) => {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.join(process.cwd(), 'uploads', params['*']);
      
      if (!fs.existsSync(filePath)) {
        set.status = 404;
        return { error: 'File not found' };
      }
      
      const file = fs.readFileSync(filePath);
      const ext = path.extname(filePath).toLowerCase();
      
      // Set appropriate content type
      const contentTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.gif': 'image/gif'
      };
      
      set.headers['Content-Type'] = contentTypes[ext] || 'application/octet-stream';
      set.headers['Cache-Control'] = 'public, max-age=31536000'; // 1 year cache
      
      return file;
    } catch (error) {
      console.error('Static file serving error:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })
  
  // API routes
  .group('/api', (app) => 
    app
      .use(authRoutes)
      .use(hotelRoutes)
      .use(bookingRoutes)
      .use(notificationRoutes)
      .use(adminRoomsRoutes)
      .use(adminUsersRoutes)
      .use(paymentSettingsRoutes)
      .use(roomStatusRoutes)
      .use(forgotPasswordRoutes)
      .use(userEmailRoutes)
      .use(changeEmailRoutes)
      .use(paymentSlipRoutes)
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
