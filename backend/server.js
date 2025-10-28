import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { Pool } from 'pg';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/hotel_db'
});

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
  // Notifications API
  .get('/api/notifications', async ({ headers }) => {
    try {
      // ตรวจสอบ authorization (แบบง่าย)
      const authHeader = headers.authorization;
      if (!authHeader) {
        return { success: false, message: 'Unauthorized' };
      }

      // Mock notifications for customers - เพิ่มการจองใหม่, การยกเลิก, ข้อมูลโปรโมชัน
      const notifications = [
        {
          id: 1,
          message: '🎉 ยินดีต้อนรับสู่ระบบจองห้องพักออนไลน์!',
          type: 'welcome',
          read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString() // 5 minutes ago
        },
        {
          id: 2,
          message: '💡 เคล็ดลับ: คุณสามารถกรองห้องพักตามจำนวนผู้เข้าพักได้จากหน้าแรก',
          type: 'tip',
          read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutes ago
        },
        {
          id: 3,
          message: '🏨 มีห้องพักใหม่ 2 ประเภทเพิ่มเข้ามาในระบบแล้ว',
          type: 'info',
          read: true,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
        }
      ];

      return {
        success: true,
        data: notifications
      };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return { success: false, message: 'Failed to fetch notifications' };
    }
  })
  .put('/api/notifications/:id/read', async ({ params }) => {
    try {
      const { id } = params;
      console.log(`Marking notification ${id} as read`);
      
      // Mock response - in real app would update database
      return {
        success: true,
        message: 'Notification marked as read'
      };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, message: 'Failed to mark notification as read' };
    }
  })
  .listen(process.env.PORT || 5680);

console.log(`🦊 Hotel Backend Server is running at http://localhost:${process.env.PORT || 5680}`);
console.log('📋 Available endpoints:');
console.log('   GET /        - Server info');
console.log('   GET /health  - Health check');
console.log('   GET /api/test - API test');