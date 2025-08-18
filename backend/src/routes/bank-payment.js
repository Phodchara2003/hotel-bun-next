import { Elysia } from 'elysia';
import { sql } from '../db/database.js';

console.log('🏦 Bank Payment Settings Routes loading...');

// Simple bank payment settings routes
export const bankPaymentRoutes = new Elysia({ prefix: '/api/admin/payment-settings' })
  .get('/', async ({ set }) => {
    console.log('📋 GET /api/admin/payment-settings - Request received');
    
    try {
      // Create table if not exists
      await sql`
        CREATE TABLE IF NOT EXISTS bank_payment_settings (
          id SERIAL PRIMARY KEY,
          settings JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      
      // Get payment settings from database
      const settings = await sql`
        SELECT settings FROM bank_payment_settings 
        ORDER BY updated_at DESC 
        LIMIT 1
      `;
      
      console.log('📊 Settings from DB:', settings.length);
      
      if (settings.length === 0) {
        // Return default settings
        const defaultSettings = {
          bankInfo: {
            bankName: 'ธนาคารทดสอบใหม่',
            accountNumber: '999-888-777',
            accountName: 'New Test Account'
          },
          instructions: 'กรุณาโอนเงินเข้าบัญชีตามรายละเอียดข้างต้น และส่งสลิปการโอนเงินเพื่อยืนยันการชำระเงิน'
        };
        
        return { settings: defaultSettings };
      }
      
      return { settings: settings[0].settings };
    } catch (error) {
      console.error('❌ Error fetching payment settings:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })
  
  .post('/', async ({ body, set }) => {
    console.log('💾 POST /api/admin/payment-settings - Save request received');
    
    try {
      const { settings } = body;
      
      if (!settings) {
        console.log('❌ No settings provided');
        set.status = 400;
        return { error: 'Settings data is required' };
      }
      
      console.log('📝 Saving settings:', JSON.stringify(settings, null, 2));
      
      // Create table if not exists
      await sql`
        CREATE TABLE IF NOT EXISTS bank_payment_settings (
          id SERIAL PRIMARY KEY,
          settings JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      
      // Insert new settings
      await sql`
        INSERT INTO bank_payment_settings (settings, updated_at)
        VALUES (${JSON.stringify(settings)}, CURRENT_TIMESTAMP)
      `;
      
      console.log('✅ Settings saved successfully');
      
      return { 
        success: true, 
        message: 'Payment settings saved successfully',
        settings 
      };
    } catch (error) {
      console.error('❌ Error saving payment settings:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  });
