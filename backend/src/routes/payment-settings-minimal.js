// Simple Payment Settings test without database
import { Elysia } from 'elysia';

console.log('🔧 Loading Minimal Payment Settings Routes...');

export const paymentSettingsRoutes = new Elysia({ prefix: '/payment-settings' })
  .get('/test', () => {
    console.log('🧪 TEST ROUTE HIT! Payment Settings API working!');
    return { 
      success: true, 
      message: 'Payment Settings Test Route Working!',
      timestamp: new Date().toISOString()
    };
  })
  
  .get('/', () => {
    console.log('📋 GET Payment Settings - Simple response');
    return {
      qrCodeUrl: '',
      bankName: 'ธนาคารทดสอบ',
      accountNumber: '123-456-789',
      accountName: 'Hotel Test Account'
    };
  })
  
  .put('/', async ({ body }) => {
    console.log('📝 PUT Payment Settings received:', body);
    return { 
      success: true, 
      message: 'Settings updated successfully (mock)' 
    };
  })
  
  .post('/qr-code', async ({ body }) => {
    console.log('📸 POST QR Code upload received');
    return {
      success: true,
      message: 'QR code uploaded successfully (mock)',
      qrCodeUrl: '/uploads/mock-qr-code.jpg'
    };
  });

console.log('✅ Minimal Payment Settings Routes loaded');
