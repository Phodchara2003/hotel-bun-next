import { Elysia } from 'elysia';
import { sql } from '../db/database.js';

console.log('🏦 Simple Payment Settings Routes loading...');

// Simple payment settings routes
export const simplePaymentRoutes = new Elysia()
  .get('/api/admin/payment-settings', async ({ set }) => {
    console.log('📋 GET /api/admin/payment-settings - Request received');
    
    try {
      // Create table if not exists
      await sql`
        CREATE TABLE IF NOT EXISTS simple_payment_settings (
          id SERIAL PRIMARY KEY,
          settings JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      
      // Get payment settings from database
      const settings = await sql`
        SELECT settings FROM simple_payment_settings 
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
      
      // Parse settings properly (handle both JSON string and object)
      const rawSettings = settings[0].settings;
      const parsedSettings = typeof rawSettings === 'string' ? JSON.parse(rawSettings) : rawSettings;
      console.log('🔍 Returning admin settings:', parsedSettings);
      
      return { settings: parsedSettings };
    } catch (error) {
      console.error('❌ Error fetching payment settings:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })
  
  .post('/api/admin/payment-settings', async ({ body, set }) => {
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
        CREATE TABLE IF NOT EXISTS simple_payment_settings (
          id SERIAL PRIMARY KEY,
          settings JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      
      // Insert new settings
      await sql`
        INSERT INTO simple_payment_settings (settings, updated_at)
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
  })
  
  // Get payment settings for user payment page
  .get('/api/admin/payment-info', async ({ set }) => {
    console.log('💳 GET /api/admin/payment-info - For user payment page');
    
    try {
      // Get payment settings from database
      const settings = await sql`
        SELECT settings FROM simple_payment_settings 
        ORDER BY updated_at DESC 
        LIMIT 1
      `;
      
      if (settings.length === 0) {
        // Return default settings
        return {
          bankInfo: {
            bankName: 'ธนาคารทดสอบใหม่',
            accountNumber: '999-888-777',
            accountName: 'New Test Account'
          },
          instructions: 'กรุณาโอนเงินเข้าบัญชีตามรายละเอียดข้างต้น และส่งสลิปการโอนเงินเพื่อยืนยันการชำระเงิน'
        };
      }
      
      return settings[0].settings;
    } catch (error) {
      console.error('❌ Error fetching payment info:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  });

console.log('✅ Simple Payment Settings Routes loaded');

// Add user-facing routes without admin prefix
export const userPaymentRoutes = new Elysia()
  .get('/api/simple-payment-settings', async ({ set }) => {
    console.log('💳 GET /api/simple-payment-settings - For user payment page');
    
    try {
      // Create table if not exists
      await sql`
        CREATE TABLE IF NOT EXISTS simple_payment_settings (
          id SERIAL PRIMARY KEY,
          settings JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      
      // Get payment settings from database
      const settings = await sql`
        SELECT settings FROM simple_payment_settings 
        ORDER BY updated_at DESC 
        LIMIT 1
      `;
      
      console.log('📊 Settings from DB for user:', settings.length);
      
      if (settings.length === 0) {
        // Return default settings flattened for user display
        const defaultSettings = {
          bankName: 'ธนาคารทดสอบใหม่',
          accountNumber: '999-888-777',
          accountName: 'New Test Account',
          bankImageUrl: '',
          instructions: 'กรุณาโอนเงินเข้าบัญชีตามรายละเอียดข้างต้น และส่งสลิปการโอนเงินเพื่อยืนยันการชำระเงิน'
        };
        console.log('🔄 Returning default settings:', defaultSettings);
        return defaultSettings;
      }
      
      // Parse settings properly (handle both JSON string and object)
      const rawSettings = settings[0].settings;
      const parsedSettings = typeof rawSettings === 'string' ? JSON.parse(rawSettings) : rawSettings;
      
      console.log('🔍 Raw settings type:', typeof rawSettings);
      console.log('🔍 Parsed settings:', parsedSettings);
      
      // Return flattened bank info for user display
      const bankInfo = parsedSettings.bankInfo || parsedSettings;
      const userSettings = {
        bankName: bankInfo.bankName || 'ธนาคารทดสอบใหม่',
        accountNumber: bankInfo.accountNumber || '999-888-777',
        accountName: bankInfo.accountName || 'New Test Account',
        bankImageUrl: bankInfo.bankImageUrl || '',
        instructions: parsedSettings.instructions || 'กรุณาโอนเงินเข้าบัญชีตามรายละเอียดข้างต้น และส่งสลิปการโอนเงินเพื่อยืนยันการชำระเงิน'
      };
      console.log('✅ Returning user settings:', userSettings);
      return userSettings;
    } catch (error) {
      console.error('❌ Error fetching payment settings for user:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  });
