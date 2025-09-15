// Enhanced Payment Slip Upload Handler
// ระบบจัดการอัพโหลดสลีปสำหรับ Express-like HTTP server

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createPaymentSlip } = require('../payment-slip-manager.cjs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads', 'payment-slips');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, 'slip-' + uniqueSuffix + extension);
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images are allowed'), false);
  }
};

// Multer upload configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1
  }
});

// Function to handle multipart form data parsing for basic HTTP server
function parseMultipartForm(req, res, callback) {
  const multerSingle = upload.single('slipImage');
  
  // Create Express-like request/response objects for multer
  const expressReq = Object.assign(req, {
    files: undefined,
    file: undefined
  });
  
  const expressRes = Object.assign(res, {
    locals: {}
  });

  multerSingle(expressReq, expressRes, (error) => {
    if (error) {
      callback(error, null);
    } else {
      callback(null, {
        file: expressReq.file,
        body: expressReq.body || {}
      });
    }
  });
}

// Function to parse form data from request body (for basic form parsing)
function parseFormData(data) {
  const formData = {};
  const boundary = data.match(/boundary=(.+)/)?.[1];
  
  if (!boundary) return formData;
  
  const parts = data.split(`--${boundary}`);
  
  for (const part of parts) {
    const match = part.match(/name="([^"]+)"\r?\n\r?\n(.+)/s);
    if (match) {
      const [, name, value] = match;
      formData[name] = value.trim();
    }
  }
  
  return formData;
}

// Main upload handler for payment slips
async function handlePaymentSlipUpload(req, res) {
  try {
    console.log('💰 Processing payment slip upload...');
    
    // Handle multipart form data
    return new Promise((resolve, reject) => {
      parseMultipartForm(req, res, async (error, result) => {
        if (error) {
          console.error('Upload error:', error);
          
          let errorMessage = 'Upload failed';
          let statusCode = 500;
          
          if (error.code === 'LIMIT_FILE_SIZE') {
            errorMessage = 'File too large. Maximum size is 10MB';
            statusCode = 400;
          } else if (error.code === 'LIMIT_FILE_COUNT') {
            errorMessage = 'Too many files. Only 1 file allowed';
            statusCode = 400;
          } else if (error.message.includes('Invalid file type')) {
            errorMessage = 'Invalid file type. Only images are allowed (JPEG, PNG, GIF, WebP)';
            statusCode = 400;
          }
          
          res.writeHead(statusCode, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: errorMessage,
            details: error.message
          }));
          resolve();
          return;
        }

        if (!result.file) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'No file uploaded'
          }));
          resolve();
          return;
        }

        // Parse form data from body
        let bodyData = {};
        if (req.body) {
          try {
            bodyData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
          } catch (e) {
            // If JSON parsing fails, try to get data from result.body
            bodyData = result.body || {};
          }
        }

        const {
          customerId,
          customerName,
          bookingReference,
          amount,
          bankName,
          transferDate,
          transferTime,
          description
        } = bodyData;

        // Validate required fields
        if (!customerId || !amount || !bankName) {
          // Remove uploaded file if validation fails
          if (fs.existsSync(result.file.path)) {
            fs.unlinkSync(result.file.path);
          }
          
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Missing required fields: customerId, amount, bankName'
          }));
          resolve();
          return;
        }

        // Create payment slip record
        const slipData = {
          customerId,
          customerName: customerName || 'Unknown',
          bookingReference: bookingReference || null,
          amount: parseFloat(amount),
          bankName,
          transferDate: transferDate || new Date().toISOString().split('T')[0],
          transferTime: transferTime || new Date().toTimeString().split(' ')[0],
          description: description || '',
          filePath: result.file.path,
          fileName: result.file.filename,
          originalName: result.file.originalname,
          fileSize: result.file.size,
          mimeType: result.file.mimetype
        };

        const slipResult = createPaymentSlip(slipData);

        if (slipResult.success) {
          console.log(`✅ Payment slip uploaded: ${slipResult.slip.slipReference}`);
          
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            message: 'Payment slip uploaded successfully',
            slip: slipResult.slip,
            fileUrl: `/uploads/payment-slips/${result.file.filename}`
          }));
        } else {
          // Remove uploaded file if database save fails
          if (fs.existsSync(result.file.path)) {
            fs.unlinkSync(result.file.path);
          }
          
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(slipResult));
        }
        
        resolve();
      });
    });

  } catch (error) {
    console.error('Payment slip upload error:', error);
    
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: 'Upload failed',
      details: error.message
    }));
  }
}

// Simple file serving function for uploaded images
function serveUploadedFile(req, res, filename) {
  const filePath = path.join(uploadsDir, filename);
  
  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'File not found' }));
    return;
  }

  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp'
  };

  const contentType = mimeTypes[ext] || 'application/octet-stream';
  
  res.writeHead(200, { 'Content-Type': contentType });
  
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
}

module.exports = {
  handlePaymentSlipUpload,
  serveUploadedFile,
  uploadsDir
};