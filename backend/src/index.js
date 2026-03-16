import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import 'dotenv/config';

import { rateLimiter }   from './middleware/index.js';
import { notificationScheduler } from './utils/notifications/index.js';
import { adminEmailScheduler }   from './utils/adminEmailScheduler.js';

import {
  // Auth
  authRoutes,
  changeEmailRoutes,
  forgotPasswordRoutes,
  passwordResetRoutes,
  // Admin
  adminDashboardRoutes,
  adminPaymentsRoutes,
  adminRoomsRoutes,
  roomTypesRoutes,
  adminUsersRoutes,
  adminEmailRoutes,
  permissionRoutes,
  // Payment
  bankImageRoutes,
  bankPaymentRoutes,
  paymentSettingsRoutes,
  paymentSlipRoutes,
  qrPaymentRoutes,
  simplePaymentRoutes,
  userPaymentRoutes,
  // Core
  hotelRoutes,
  bookingRoutes,
  notificationRoutes,
  reviewRoutes,
  globalSettingsRoutes,
  profileRoutes,
  roomStatusRoutes,
  checkinRoutes,
  housekeepingRoutes,
  userEmailRoutes,
} from './routes/index.js';

// Load environment variables (development only)
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
  .use(rateLimiter())
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
      'If-None-Match',
    ],
  }))
  .use(swagger({
    documentation: {
      info: {
        title: 'Hotel Booking API',
        version: '1.0.0',
        description: 'API for hotel booking system',
      },
      tags: [
        { name: 'Authentication', description: 'User authentication endpoints' },
        { name: 'Hotels',         description: 'Hotel and room management endpoints' },
        { name: 'Bookings',       description: 'Booking management endpoints' },
      ],
    },
  }))

  // Global request logging (development only)
  .onRequest(({ request }) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`${request.method} ${new URL(request.url).pathname}`);
    }
  })

  // Health check
  .get('/health', () => ({
    status: 'OK',
    message: 'Hotel Booking API is running',
    timestamp: new Date().toISOString(),
  }))

  // Static file serving for uploads
  .get('/uploads/*', async ({ params, set }) => {
    console.log('🗂️ Static file request:', params['*']);
    try {
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.join(process.cwd(), 'uploads', params['*']);

      if (!fs.existsSync(filePath)) {
        set.status = 404;
        return { error: 'File not found' };
      }

      const file = fs.readFileSync(filePath);
      const ext  = path.extname(filePath).toLowerCase();
      const contentTypes = {
        '.jpg':  'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png':  'image/png',
        '.webp': 'image/webp',
        '.gif':  'image/gif',
      };

      set.headers['Content-Type']  = contentTypes[ext] || 'application/octet-stream';
      set.headers['Cache-Control'] = 'public, max-age=31536000';
      return file;
    } catch (error) {
      console.error('❌ Static file serving error:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })

  // ── API routes (/api/*) ────────────────────────────────────────────────────
  .group('/api', (app) =>
    app
      .get('/health', () => ({ status: 'OK', timestamp: new Date().toISOString(), version: '1.0.0' }))

      // Auth
      .use(authRoutes)
      .use(forgotPasswordRoutes)
      .use(changeEmailRoutes)
      .use(passwordResetRoutes)
      .use(userEmailRoutes)

      // Core
      .use(hotelRoutes)
      .use(bookingRoutes)
      .use(notificationRoutes)
      .use(reviewRoutes)
      .use(profileRoutes)
      .use(roomStatusRoutes)
      .use(globalSettingsRoutes)

      // Admin
      .group('/admin/rooms',       (a) => a.use(adminRoomsRoutes))
      .group('/admin/room-types',  (a) => a.use(roomTypesRoutes))
      .group('/admin/dashboard',   (a) => a.use(adminDashboardRoutes))
      .group('/admin/users',       (a) => {
        console.log('🔧 Loading Admin Users Routes...');
        a.use(adminUsersRoutes);
        console.log('✅ Admin Users Routes loaded');
        return a;
      })
      .group('/admin/permissions', (a) => a.use(permissionRoutes))
      .use(adminPaymentsRoutes)
      .use(adminEmailRoutes)

      // Operations
      .group('/checkin',      (a) => a.use(checkinRoutes))
      .group('/housekeeping', (a) => a.use(housekeepingRoutes))

      // Payment
      .use(paymentSettingsRoutes)
      .use(bankPaymentRoutes)
      .use(paymentSlipRoutes)
      .use(qrPaymentRoutes)
  )

  // Routes outside /api group (legacy prefixes)
  .use(simplePaymentRoutes)
  .use(userPaymentRoutes)
  .use(bankImageRoutes)

  // Error handling
  .onError(({ code, error, set }) => {
    console.error('Server error:', error);
    switch (code) {
      case 'VALIDATION':
        set.status = 422;
        return { error: 'Validation Error',      message: error.message };
      case 'NOT_FOUND':
        set.status = 404;
        return { error: 'Not Found',             message: 'The requested resource was not found' };
      default:
        set.status = 500;
        return { error: 'Internal Server Error', message: 'Something went wrong' };
    }
  })

  .listen({
    hostname: '0.0.0.0',
    port: parseInt(process.env.PORT) || 3001,
  });

// ── Schedulers ────────────────────────────────────────────────────────────────
notificationScheduler.startAll();

console.log('📧 [ADMIN-EMAIL] Initializing admin email notification system...');
const adminEmailIntervals = adminEmailScheduler.startScheduledTasks();
console.log('✅ [ADMIN-EMAIL] Admin email notification system started');

console.log(`🚀 Hotel Booking API is running at 0.0.0.0:3001`);
console.log(`📚 API Documentation available at http://localhost:3001/swagger`);
console.log(`🕐 Notification scheduler is running for:
  ✅ Check-in reminders (daily at 09:00 Bangkok time)
  ✅ Expired booking checks (hourly)
  ✅ Daily admin summaries (daily at 18:00 Bangkok time)`);

export default app;
