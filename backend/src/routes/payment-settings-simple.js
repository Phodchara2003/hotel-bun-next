import { Elysia } from 'elysia';
import { sql } from '../db/database.js';
import { requireAdmin } from '../middleware/auth.js';
import { fileTypeFromBuffer } from 'file-type';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

console.log('🔧 Simple Payment Settings Routes loading...');

// Create simple payment settings routes
export const paymentSettingsRoutes = new Elysia({ prefix: '/api/payment-settings' })
  .get('/test', () => {
    console.log('🧪 Test route accessed successfully!');
    return { 
      success: true, 
      message: 'Payment Settings API is working!',
      timestamp: new Date().toISOString()
    };
  })
  
  .get('/', async ({ headers, set }) => {
    console.log('📋 GET /api/payment-settings - Request received');
    
    try {
      // Authenticate admin
      const user = await requireAdmin({ headers, set });
      if (user.error) {
        console.log('❌ Authentication failed:', user.error);
        return user;
      }
      
      console.log('✅ Admin authenticated:', user.email);
      
      // Get payment settings from database
      const settings = await sql`
        SELECT * FROM payment_settings 
        ORDER BY created_at DESC 
        LIMIT 1
      `;
      
      console.log('📊 Settings from DB:', settings.length);
      
      if (settings.length === 0) {
        // Create default settings if none exist
        const defaultSettings = await sql`
          INSERT INTO payment_settings (bank_name, account_number, account_name)
          VALUES ('', '', '')
          RETURNING *
        `;
        
        console.log('🆕 Created default settings');
        return {
          qrCodeUrl: defaultSettings[0].qr_code_url || '',
          bankName: defaultSettings[0].bank_name || '',
          accountNumber: defaultSettings[0].account_number || '',
          accountName: defaultSettings[0].account_name || ''
        };
      }
      
      const result = {
        qrCodeUrl: settings[0].qr_code_url || '',
        bankName: settings[0].bank_name || '',
        accountNumber: settings[0].account_number || '',
        accountName: settings[0].account_name || ''
      };
      
      console.log('✅ Returning settings:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Error in GET /api/payment-settings:', error);
      set.status = 500;
      return { error: 'Internal server error', details: error.message };
    }
  })
  
  .put('/', async ({ body, headers, set }) => {
    console.log('📝 PUT /api/payment-settings - Request received');
    
    try {
      // Authenticate admin
      const user = await requireAdmin({ headers, set });
      if (user.error) {
        console.log('❌ Authentication failed:', user.error);
        return user;
      }
      
      console.log('✅ Admin authenticated:', user.email);
      console.log('📋 Update data:', body);
      
      const { bankName, accountNumber, accountName } = body;
      
      // Update payment settings
      const updated = await sql`
        UPDATE payment_settings 
        SET 
          bank_name = ${bankName},
          account_number = ${accountNumber},
          account_name = ${accountName},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = (
          SELECT id FROM payment_settings 
          ORDER BY created_at DESC 
          LIMIT 1
        )
        RETURNING *
      `;
      
      if (updated.length === 0) {
        // Create new settings if none exist
        const newSettings = await sql`
          INSERT INTO payment_settings (bank_name, account_number, account_name)
          VALUES (${bankName}, ${accountNumber}, ${accountName})
          RETURNING *
        `;
        console.log('🆕 Created new settings');
        return { success: true, message: 'Settings created successfully' };
      }
      
      console.log('✅ Settings updated successfully');
      return { success: true, message: 'Settings updated successfully' };
      
    } catch (error) {
      console.error('❌ Error in PUT /api/payment-settings:', error);
      set.status = 500;
      return { error: 'Internal server error', details: error.message };
    }
  })
  
  .post('/qr-code', async ({ body, headers, set }) => {
    console.log('📸 POST /api/payment-settings/qr-code - File upload request');
    
    try {
      // Authenticate admin
      const user = await requireAdmin({ headers, set });
      if (user.error) {
        console.log('❌ Authentication failed:', user.error);
        return user;
      }
      
      console.log('✅ Admin authenticated:', user.email);
      
      // Get uploaded file
      const qrCodeFile = body.qrCode;
      if (!qrCodeFile) {
        console.log('❌ No file uploaded');
        set.status = 400;
        return { error: 'No file uploaded' };
      }
      
      console.log('📋 File info:', {
        name: qrCodeFile.name,
        size: qrCodeFile.size,
        type: qrCodeFile.type
      });
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(qrCodeFile.type)) {
        console.log('❌ Invalid file type:', qrCodeFile.type);
        set.status = 400;
        return { error: 'Invalid file type. Only JPG, PNG, WEBP allowed.' };
      }
      
      // Validate file size (5MB)
      if (qrCodeFile.size > 5 * 1024 * 1024) {
        console.log('❌ File too large:', qrCodeFile.size);
        set.status = 400;
        return { error: 'File size too large. Maximum 5MB allowed.' };
      }
      
      // Create uploads directory
      const uploadDir = path.join(process.cwd(), 'uploads');
      await mkdir(uploadDir, { recursive: true });
      
      // Generate filename
      const timestamp = Date.now();
      const extension = path.extname(qrCodeFile.name) || '.jpg';
      const filename = `qr-code-${timestamp}${extension}`;
      const filepath = path.join(uploadDir, filename);
      
      // Save file
      const buffer = await qrCodeFile.arrayBuffer();
      await writeFile(filepath, Buffer.from(buffer));
      
      console.log('✅ File saved:', filepath);
      
      // Update database
      const qrCodeUrl = `/uploads/${filename}`;
      await sql`
        UPDATE payment_settings 
        SET 
          qr_code_url = ${qrCodeUrl},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = (
          SELECT id FROM payment_settings 
          ORDER BY created_at DESC 
          LIMIT 1
        )
      `;
      
      console.log('✅ Database updated with QR code URL:', qrCodeUrl);
      
      return {
        success: true,
        message: 'QR code uploaded successfully',
        qrCodeUrl: qrCodeUrl
      };
      
    } catch (error) {
      console.error('❌ Error in POST /api/payment-settings/qr-code:', error);
      set.status = 500;
      return { error: 'Internal server error', details: error.message };
    }
  });

console.log('✅ Simple Payment Settings Routes loaded successfully');
