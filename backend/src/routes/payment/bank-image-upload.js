import { Elysia } from 'elysia';

console.log('📁 Bank QR Code Upload Routes loading...');

export const bankImageRoutes = new Elysia()
  .post('/api/upload-bank-image', async ({ body, set }) => {
    console.log('📷 POST /api/upload-bank-image - QR Code upload request received');
    
    try {
      const { image, filename } = body;
      
      if (!image) {
        console.log('❌ No image data provided');
        set.status = 400;
        return { error: 'No image data provided' };
      }

      // Validate base64 format
      if (!image.startsWith('data:image/')) {
        console.log('❌ Invalid image format');
        set.status = 400;
        return { error: 'Invalid image format' };
      }

      // Create uploads directory if it doesn't exist
      const fs = await import('fs');
      const path = await import('path');
      const uploadsDir = path.join(process.cwd(), 'uploads', 'bank-images');
      
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log('📁 Created uploads directory:', uploadsDir);
      }

      // Generate unique filename
      const timestamp = Date.now();
      const ext = filename ? path.extname(filename) : '.jpg';
      const newFilename = `bank-qr-${timestamp}${ext}`;
      const filepath = path.join(uploadsDir, newFilename);

      // Extract base64 data and save
      const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, '');
      fs.writeFileSync(filepath, base64Data, 'base64');

      const imageUrl = `/uploads/bank-images/${newFilename}`;
      console.log('✅ Bank QR Code uploaded successfully:', imageUrl);

      return {
        success: true,
        url: imageUrl,
        filename: newFilename
      };

    } catch (error) {
      console.error('❌ Error uploading bank QR code:', error);
      console.error('Stack trace:', error.stack);
      set.status = 500;
      return { error: 'Internal server error', details: error.message };
    }
  });

console.log('✅ Bank QR Code Upload Routes loaded');
