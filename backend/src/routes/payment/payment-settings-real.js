import { Elysia } from 'elysia';
import { sql } from '../../db/database.js';
import path from 'path';
import fs from 'fs';

console.log('🔧 Loading Real Payment Settings Routes...');

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
const qrUploadsDir = path.join(uploadsDir, 'qr');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory');
}
if (!fs.existsSync(qrUploadsDir)) {
  fs.mkdirSync(qrUploadsDir, { recursive: true });
  console.log('📁 Created QR uploads directory');
}

export const paymentSettingsRoutes = new Elysia({ prefix: '/admin' })
  
  // Add support for file uploads
  .use((app) => {
    return app.onParse(({ request, contentType }) => {
      if (contentType && contentType.includes('multipart/form-data')) {
        return request.formData();
      }
    });
  })
  
  // Get payment settings
  .get('/', async () => {
    try {
      console.log('📋 GET Payment Settings from database');
      
      const result = await sql`
        SELECT qr_code_url, bank_name, account_number, account_name, instructions
        FROM payment_settings 
        ORDER BY id DESC 
        LIMIT 1
      `;
      
      if (result.length === 0) {
        // Return default values if no settings exist
        return {
          qrCodeUrl: '',
          bankName: 'ธนาคารทดสอบ',
          accountNumber: '123-456-789',
          accountName: 'Hotel Account',
          instructions: 'กรุณาโอนเงินตามจำนวนที่ระบุ และแนบสลิปการโอนเงิน'
        };
      }
      
      const settings = result[0];
      return {
        qrCodeUrl: settings.qr_code_url || '',
        bankName: settings.bank_name || 'ธนาคารทดสอบ',
        accountNumber: settings.account_number || '123-456-789',
        accountName: settings.account_name || 'Hotel Account',  
        instructions: settings.instructions || 'กรุณาโอนเงินตามจำนวนที่ระบุ และแนบสลิปการโอนเงิน'
      };
      
    } catch (error) {
      console.error('❌ Error getting payment settings:', error);
      return {
        qrCodeUrl: '',
        bankName: 'ธนาคารทดสอบ',
        accountNumber: '123-456-789',
        accountName: 'Hotel Account',
        instructions: 'กรุณาโอนเงินตามจำนวนที่ระบุ และแนบสลิปการโอนเงิน'
      };
    }
  })
  
  // Update payment settings
  .put('/', async ({ body }) => {
    try {
      console.log('📝 PUT Payment Settings:', body);
      
      const { 
        bankName, 
        accountNumber, 
        accountName, 
        instructions = 'กรุณาโอนเงินตามจำนวนที่ระบุ และแนบสลิปการโอนเงิน'
      } = body;

      // Validate required fields
      if (!bankName || !accountNumber || !accountName) {
        return {
          success: false,
          message: 'กรุณากรอกข้อมูลให้ครบถ้วน'
        };
      }
      
      // Check if settings exist
      const existing = await sql`
        SELECT id FROM payment_settings LIMIT 1
      `;
      
      if (existing.length === 0) {
        // Insert new record
        await sql`
          INSERT INTO payment_settings (bank_name, account_number, account_name, instructions)
          VALUES (${bankName}, ${accountNumber}, ${accountName}, ${instructions})
        `;
      } else {
        // Update existing record
        await sql`
          UPDATE payment_settings 
          SET bank_name = ${bankName},
              account_number = ${accountNumber},
              account_name = ${accountName},
              instructions = ${instructions},
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ${existing[0].id}
        `;
      }
      
      return { 
        success: true, 
        message: 'ตั้งค่าการชำระเงินอัพเดทเรียบร้อยแล้ว' 
      };
      
    } catch (error) {
      console.error('❌ Error updating payment settings:', error);
      return { 
        success: false, 
        message: 'เกิดข้อผิดพลาดในการอัพเดทการตั้งค่า' 
      };
    }
  })
  
  // Upload QR code
  .post('/qr-code', async ({ body }) => {
    try {
      console.log('📸 POST QR Code upload received');
      console.log('Body type:', typeof body);
      console.log('Body constructor:', body?.constructor?.name);
      
      // Handle both FormData and JSON uploads
      let imageData = null;
      let contentType = null;
      
      if (body instanceof FormData) {
        // Handle FormData upload
        console.log('📋 Processing FormData upload');
        const file = body.get('qrCode');
        
        if (!file) {
          return {
            success: false,
            message: 'ไม่พบไฟล์รูปภาพ'
          };
        }
        
        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        imageData = Buffer.from(arrayBuffer);
        contentType = file.type;
        
      } else if (body && body.qrCodeImage) {
        // Handle base64 upload
        console.log('📋 Processing base64 upload');
        const base64Data = body.qrCodeImage.replace(/^data:image\/[a-z]+;base64,/, '');
        imageData = Buffer.from(base64Data, 'base64');
        contentType = 'image/jpeg';
      } else {
        return {
          success: false,
          message: 'ไม่พบไฟล์รูปภาพ - Body type: ' + typeof body
        };
      }
      
      // Generate filename
      const timestamp = Date.now();
      const ext = contentType === 'image/png' ? 'png' : 'jpg';
      const filename = `qr-code-${timestamp}.${ext}`;
      const filePath = path.join(qrUploadsDir, filename);
      const publicUrl = `/uploads/qr/${filename}`;
      
      // Save image to file
      fs.writeFileSync(filePath, imageData);
      
      console.log('💾 QR Code saved to:', filePath);
      
      // Update database with new QR code URL
      const existing = await sql`
        SELECT id FROM payment_settings LIMIT 1
      `;
      
      if (existing.length === 0) {
        // Insert new record with QR code
        await sql`
          INSERT INTO payment_settings (qr_code_url, bank_name, account_number, account_name)
          VALUES (${publicUrl}, 'ธนาคารทดสอบ', '123-456-789', 'Hotel Account')
        `;
      } else {
        // Update existing record
        await sql`
          UPDATE payment_settings 
          SET qr_code_url = ${publicUrl},
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ${existing[0].id}
        `;
      }
      
      return {
        success: true,
        message: 'อัพโหลด QR Code เรียบร้อยแล้ว',
        qrCodeUrl: publicUrl
      };
      
    } catch (error) {
      console.error('❌ Error uploading QR code:', error);
      return {
        success: false,
        message: 'เกิดข้อผิดพลาดในการอัพโหลด QR Code'
      };
    }
  })
  
  // Simple admin payment settings routes
  .get('/admin/payment-settings', async ({ set }) => {
    console.log('📋 GET /admin/payment-settings - Simple bank settings');
    
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
      
      console.log('📊 Simple settings from DB:', settings.length);
      
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
      console.error('❌ Error fetching simple payment settings:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })
  
  .post('/admin/payment-settings', async ({ body, set }) => {
    console.log('💾 POST /admin/payment-settings - Save simple bank settings');
    
    try {
      const { settings } = body;
      
      if (!settings) {
        console.log('❌ No settings provided');
        set.status = 400;
        return { error: 'Settings data is required' };
      }
      
      console.log('📝 Saving simple settings:', JSON.stringify(settings, null, 2));
      
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
      
      console.log('✅ Simple settings saved successfully');
      
      return { 
        success: true, 
        message: 'Payment settings saved successfully',
        settings 
      };
    } catch (error) {
      console.error('❌ Error saving simple payment settings:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  });

console.log('✅ Real Payment Settings Routes loaded');
