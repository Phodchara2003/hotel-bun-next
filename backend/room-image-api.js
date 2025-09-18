const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');

const router = express.Router();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hotel_booking',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Multer configuration for room images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '..', 'frontend', 'public', 'images', 'rooms');
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `room-${req.params.roomId}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Maximum 10 files
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (jpeg, jpg, png, webp) are allowed!'));
    }
  }
});

// Authentication middleware
const authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No authentication token provided'
    });
  }
  
  // Simple token validation (you should implement proper JWT validation)
  // For now, we'll just check if token exists
  req.user = { role: 'admin' };
  next();
};

// POST /api/admin/rooms/:roomId/images - Upload room images
router.post('/:roomId/images', authenticateAdmin, upload.array('images', 10), async (req, res) => {
  const { roomId } = req.params;
  
  try {
    console.log(`📸 Uploading images for room ${roomId}`);
    console.log(`📸 Received ${req.files?.length || 0} files`);
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images provided'
      });
    }
    
    // Check if room exists
    const [roomCheck] = await pool.execute(
      'SELECT id, images FROM room_types WHERE id = ?', 
      [roomId]
    );
    
    if (roomCheck.length === 0) {
      // Clean up uploaded files if room doesn't exist
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
      
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }
    
    // Get existing images
    let existingImages = [];
    if (roomCheck[0].images) {
      try {
        const parsed = JSON.parse(roomCheck[0].images);
        existingImages = Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        existingImages = [roomCheck[0].images];
      }
    }
    
    // Add new image filenames
    const newImages = req.files.map(file => path.basename(file.path));
    const allImages = [...existingImages, ...newImages];
    
    // Update database
    await pool.execute(
      'UPDATE room_types SET images = ?, updated_at = NOW() WHERE id = ?',
      [JSON.stringify(allImages), roomId]
    );
    
    console.log(`✅ Successfully uploaded ${newImages.length} images for room ${roomId}`);
    
    res.json({
      success: true,
      message: `อัปโหลดรูปภาพสำเร็จ ${newImages.length} รูป`,
      data: {
        roomId: parseInt(roomId),
        uploadedFiles: newImages,
        totalImages: allImages.length,
        allImages: allImages
      }
    });
    
  } catch (error) {
    console.error('❌ Error uploading images:', error);
    
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ',
      error: error.message
    });
  }
});

// DELETE /api/admin/rooms/:roomId/images/:filename - Delete room image
router.delete('/:roomId/images/:filename', authenticateAdmin, async (req, res) => {
  const { roomId, filename } = req.params;
  
  try {
    console.log(`🗑️ Deleting image ${filename} from room ${roomId}`);
    
    // Check if room exists
    const [roomCheck] = await pool.execute(
      'SELECT id, images FROM room_types WHERE id = ?', 
      [roomId]
    );
    
    if (roomCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }
    
    // Get existing images
    let existingImages = [];
    if (roomCheck[0].images) {
      try {
        const parsed = JSON.parse(roomCheck[0].images);
        existingImages = Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        existingImages = [roomCheck[0].images];
      }
    }
    
    // Check if image exists in database
    if (!existingImages.includes(filename)) {
      return res.status(404).json({
        success: false,
        message: 'Image not found in room'
      });
    }
    
    // Remove image from array
    const updatedImages = existingImages.filter(img => img !== filename);
    
    // Update database
    await pool.execute(
      'UPDATE room_types SET images = ?, updated_at = NOW() WHERE id = ?',
      [JSON.stringify(updatedImages), roomId]
    );
    
    // Delete physical file
    const imagePath = path.join(__dirname, '..', 'frontend', 'public', 'images', 'rooms', filename);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
      console.log(`🗑️ Deleted physical file: ${filename}`);
    }
    
    console.log(`✅ Successfully deleted image ${filename} from room ${roomId}`);
    
    res.json({
      success: true,
      message: 'ลบรูปภาพสำเร็จ',
      data: {
        roomId: parseInt(roomId),
        deletedFile: filename,
        remainingImages: updatedImages,
        totalImages: updatedImages.length
      }
    });
    
  } catch (error) {
    console.error('❌ Error deleting image:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลบรูปภาพ',
      error: error.message
    });
  }
});

// GET /api/admin/rooms/:roomId/images - Get room images
router.get('/:roomId/images', authenticateAdmin, async (req, res) => {
  const { roomId } = req.params;
  
  try {
    console.log(`🖼️ Getting images for room ${roomId}`);
    
    // Get room images
    const [roomCheck] = await pool.execute(
      'SELECT id, images FROM room_types WHERE id = ?', 
      [roomId]
    );
    
    if (roomCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }
    
    let images = [];
    if (roomCheck[0].images) {
      try {
        const parsed = JSON.parse(roomCheck[0].images);
        images = Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        images = [roomCheck[0].images];
      }
    }
    
    // Create full URLs for images
    const imageUrls = images.map(img => ({
      filename: img,
      url: `/images/rooms/${img}`,
      fullUrl: `${req.protocol}://${req.get('host')}/images/rooms/${img}`
    }));
    
    res.json({
      success: true,
      data: {
        roomId: parseInt(roomId),
        images: imageUrls,
        totalImages: images.length
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting images:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงรูปภาพ',
      error: error.message
    });
  }
});

module.exports = router;