import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import 'dotenv/config';

import { authRoutes } from './routes/auth/auth-sqlite.js';
import { hotelRoutes } from './routes/hotels.js';
import { bookingRoutes } from './routes/bookings.js';
import { notificationRoutes } from './routes/notifications.js';
import { reviewRoutes } from './routes/reviews.js';
import { adminRoomsRoutes, roomTypesRoutes } from './routes/admin/admin-rooms-final.js';
import { adminUsersRoutes } from './routes/admin/admin-users.js';
import { adminRoomManagementRoutes } from './routes/admin/admin-room-management.js';
import { globalSettingsRoutes } from './routes/global-settings.js';
// Unified profile routes (replaces admin-profile & user-profile)
import { profileRoutes } from './routes/profile.js';
import { adminDashboardRoutes } from './routes/admin/admin-dashboard.js';
import { adminPaymentsRoutes } from './routes/admin/admin-payments.js';
import { paymentSettingsRoutes } from './routes/payment/payment-settings-real.js';
import { bankPaymentRoutes } from './routes/payment/bank-payment.js';
import { simplePaymentRoutes, userPaymentRoutes } from './routes/payment/simple-payment-settings.js';
import { bankImageRoutes } from './routes/payment/bank-image-upload.js';
import { paymentSlipRoutes } from './routes/payment/payment-slip.js';
import { roomStatusRoutes } from './routes/room-status-new.js';
import { permissionRoutes } from './routes/admin/permissions.js';
import { checkinRoutes } from './routes/checkin.js';
import { housekeepingRoutes } from './routes/housekeeping.js';
import { qrPaymentRoutes } from './routes/payment/qr-payment.js';
import forgotPasswordRoutes from './routes/auth/forgotPassword.js';
import userEmailRoutes from './routes/userEmailSettings.js';
import changeEmailRoutes from './routes/auth/changeEmail.js';
import { passwordResetRoutes } from './routes/auth/password-reset.js';
import { adminEmailRoutes } from './routes/admin/adminEmailRoutes.js';
// import './db/create-user-email-table.js'; // Create user email settings table
// import './db/create-payment-settings-table.js'; // Create payment settings table
// import './db/add-payment-slip-columns.js'; // Add payment slip columns

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
    origin: process.env.CORS_ORIGIN || 'http://localhost:3680',
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
  
  // Global request logging (development only)
  .onRequest(({ request }) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`${request.method} ${new URL(request.url).pathname}`);
    }
  })
  
  // Health check endpoint
  .get('/health', () => ({ 
    status: 'OK', 
    message: 'Hotel Booking API is running',
    timestamp: new Date().toISOString()
  }))
  
  // Add global request logging

  // Static file serving for uploads
  .get('/uploads/*', async ({ params, set }) => {
    console.log('🗂️ Static file request:', params['*']);
    try {
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.join(process.cwd(), 'uploads', params['*']);
      
      console.log('📁 Looking for file at:', filePath);
      
      if (!fs.existsSync(filePath)) {
        console.log('❌ File not found:', filePath);
        set.status = 404;
        return { error: 'File not found' };
      }
      
      console.log('✅ File found, serving:', filePath);
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
      
      const contentType = contentTypes[ext] || 'application/octet-stream';
      console.log('📄 Content-Type:', contentType);
      
      set.headers['Content-Type'] = contentType;
      set.headers['Cache-Control'] = 'public, max-age=31536000'; // 1 year cache
      
      return file;
    } catch (error) {
      console.error('❌ Static file serving error:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })
  
  // API routes
  .group('/api', (app) => 
    app
      // Health check endpoint
      .get('/health', () => ({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: '1.0.0' 
      }))
      
      .use(authRoutes)
      .use(hotelRoutes)
      .use(bookingRoutes)
      .use(notificationRoutes)
      .use(reviewRoutes)

      .group('/admin/rooms', (adminRoomsApp) => adminRoomsApp.use(adminRoomsRoutes))
      .group('/admin/room-types', (roomTypesApp) => roomTypesApp.use(roomTypesRoutes))
      .group('/admin/dashboard', (adminDashboardApp) => adminDashboardApp.use(adminDashboardRoutes))
      .use(adminPaymentsRoutes)
      .group('/admin/users', (adminUsersApp) => {
        console.log('🔧 Loading Admin Users Routes...');
        adminUsersApp.use(adminUsersRoutes);
        console.log('✅ Admin Users Routes loaded');
        return adminUsersApp;
      })
  .use(adminRoomManagementRoutes)
  .use(globalSettingsRoutes)
  .use(profileRoutes)
      .group('/admin/permissions', (permissionsApp) => permissionsApp.use(permissionRoutes))
      .group('/checkin', (checkinApp) => checkinApp.use(checkinRoutes))
      .group('/housekeeping', (housekeepingApp) => housekeepingApp.use(housekeepingRoutes))
      .use(paymentSettingsRoutes)
      .use(bankPaymentRoutes)
      .use(roomStatusRoutes)
      .use(forgotPasswordRoutes)
      .use(userEmailRoutes)
      .use(changeEmailRoutes)
      .use(passwordResetRoutes)
      .use(paymentSlipRoutes)
      .use(qrPaymentRoutes)
      .use(adminEmailRoutes)
  )
  
  // Admin payment settings routes (outside /api group)
  .use(simplePaymentRoutes)
  
  // User-facing payment routes (without /api prefix)
  .use(userPaymentRoutes)
  
  // Bank image upload route
  .use(bankImageRoutes)
  
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
  
  .listen({
    hostname: '0.0.0.0',
    port: parseInt(process.env.PORT) || 3001
  });

// เริ่มต้นระบบ Notification Scheduler
import { notificationScheduler } from './utils/notifications/notificationScheduler.js';
import { adminEmailScheduler } from './utils/adminEmailScheduler.js';

notificationScheduler.startAll();

// เริ่มต้นระบบส่งอีเมลแอดมินอัตโนมัติ
console.log('📧 [ADMIN-EMAIL] Initializing admin email notification system...');
const adminEmailIntervals = adminEmailScheduler.startScheduledTasks();
console.log('✅ [ADMIN-EMAIL] Admin email notification system started');

console.log(`🚀 Hotel Booking API is running at 0.0.0.0:3001`);
console.log(`📚 API Documentation available at http://localhost:3001/swagger`);
console.log(`Started development server: http://localhost:3001`);
console.log(`🕐 Notification scheduler is running for:
  ✅ Check-in reminders (daily at 09:00 Bangkok time)
  ✅ Expired booking checks (hourly)
  ✅ Daily admin summaries (daily at 18:00 Bangkok time)`);

export default app;
