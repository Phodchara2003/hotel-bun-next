import { Elysia } from 'elysia';
import { sql } from '../db/database.js';
import { requireAdmin } from '../middleware/auth.js';
import { fileTypeFromBuffer } from 'file-type';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import 'dotenv/config';

console.log('🔧 Payment Settings Routes loaded');

// Payment Settings API
export const paymentSettingsRoutes = new Elysia({ prefix: '/api/payment-settings' })
  // Simple test route
  .get('/test', () => {
    console.log('🧪 Test route hit!');
    return { message: 'Payment Settings API is working!' };
  })
  // Get current payment settings
  .get('/', async ({ headers, set }) => {
    try {
      console.log('Get payment settings request received');
      
      // Authenticate admin
      const user = await requireAdmin({ headers, set });
      if (user.error) {
        console.log('Authentication failed:', user.error);
        return user;
      }
      
      console.log('Authenticated admin:', { id: user.id, role: user.role });
      
      const settings = await sql`
        SELECT * FROM payment_settings 
        ORDER BY created_at DESC 
        LIMIT 1
      `;
      
      if (!settings.length) {
        return {
          qr_code_url: null,
          bank_name: null,
          account_number: null,
          account_name: null,
          instructions: null
        };
      }
      
      const setting = settings[0];
      
      return {
        id: setting.id,
        qr_code_url: setting.qr_code_url,
        bank_name: setting.bank_name,
        account_number: setting.account_number,
        account_name: setting.account_name,
        instructions: setting.instructions,
        created_at: setting.created_at,
        updated_at: setting.updated_at
      };
    } catch (error) {
      console.error('Get payment settings error:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })
  
  // Upload QR Code and update payment settings
  .post('/qr-code', async ({ headers, body, set }) => {
    try {
      console.log('Upload QR code request received');
      
      // Authenticate admin
      const user = await requireAdmin({ headers, set });
      if (user.error) {
        console.log('Authentication failed:', user.error);
        return user;
      }
      
      console.log('Authenticated admin:', { id: user.id, role: user.role });
      
      if (!body.qr_code_file) {
        set.status = 400;
        return { error: 'QR code file is required' };
      }
      
      // Validate file type
      const buffer = Buffer.from(body.qr_code_file, 'base64');
      const fileType = await fileTypeFromBuffer(buffer);
      
      if (!fileType || !['image/jpeg', 'image/png', 'image/webp'].includes(fileType.mime)) {
        set.status = 400;
        return { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' };
      }
      
      // Create uploads directory if not exists
      const uploadsDir = path.join(process.cwd(), 'uploads', 'qr-codes');
      await mkdir(uploadsDir, { recursive: true });
      
      // Generate unique filename
      const timestamp = Date.now();
      const filename = `qr-code-${timestamp}.${fileType.ext}`;
      const filePath = path.join(uploadsDir, filename);
      
      // Save file
      await writeFile(filePath, buffer);
      
      // Generate URL
      const qr_code_url = `/uploads/qr-codes/${filename}`;
      
      // Update or insert payment settings
      const existingSettings = await sql`
        SELECT id FROM payment_settings 
        ORDER BY created_at DESC 
        LIMIT 1
      `;
      
      let result;
      if (existingSettings.length > 0) {
        // Update existing
        result = await sql`
          UPDATE payment_settings 
          SET 
            qr_code_url = ${qr_code_url},
            bank_name = ${body.bank_name || null},
            account_number = ${body.account_number || null},
            account_name = ${body.account_name || null},
            instructions = ${body.instructions || null},
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${existingSettings[0].id}
          RETURNING *
        `;
      } else {
        // Insert new
        result = await sql`
          INSERT INTO payment_settings (
            qr_code_url, bank_name, account_number, account_name, instructions
          ) VALUES (
            ${qr_code_url}, ${body.bank_name || null}, ${body.account_number || null}, 
            ${body.account_name || null}, ${body.instructions || null}
          )
          RETURNING *
        `;
      }
      
      console.log('QR code uploaded successfully:', qr_code_url);
      
      return {
        message: 'QR code uploaded successfully',
        qr_code_url: qr_code_url,
        settings: result[0]
      };
    } catch (error) {
      console.error('Upload QR code error:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })
  
  // Update payment settings (without file upload)
  .put('/', async ({ headers, body, set }) => {
    try {
      console.log('Update payment settings request received');
      
      // Authenticate admin
      const user = await requireAdmin({ headers, set });
      if (user.error) {
        console.log('Authentication failed:', user.error);
        return user;
      }
      
      console.log('Authenticated admin:', { id: user.id, role: user.role });
      
      const existingSettings = await sql`
        SELECT id FROM payment_settings 
        ORDER BY created_at DESC 
        LIMIT 1
      `;
      
      let result;
      if (existingSettings.length > 0) {
        // Update existing
        result = await sql`
          UPDATE payment_settings 
          SET 
            bank_name = ${body.bank_name || null},
            account_number = ${body.account_number || null},
            account_name = ${body.account_name || null},
            instructions = ${body.instructions || null},
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${existingSettings[0].id}
          RETURNING *
        `;
      } else {
        // Insert new
        result = await sql`
          INSERT INTO payment_settings (
            bank_name, account_number, account_name, instructions
          ) VALUES (
            ${body.bank_name || null}, ${body.account_number || null}, 
            ${body.account_name || null}, ${body.instructions || null}
          )
          RETURNING *
        `;
      }
      
      console.log('Payment settings updated successfully');
      
      return {
        message: 'Payment settings updated successfully',
        settings: result[0]
      };
    } catch (error) {
      console.error('Update payment settings error:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  });
