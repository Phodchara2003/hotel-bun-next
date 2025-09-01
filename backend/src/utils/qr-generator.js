// QR Code Generator for PromptPay (Backend Version)
import QRCode from 'qrcode';

/**
 * สร้าง PromptPay QR Code
 * @param {string} promptPayId - หมายเลข PromptPay (เบอร์โทรหรือ ID)
 * @param {number} amount - จำนวนเงิน
 * @param {string} ref1 - Reference 1 (Booking ID)
 * @param {string} ref2 - Reference 2 (Customer ID หรือ Room Number)
 * @returns {Promise<string>} - Base64 QR Code image
 */
export const generatePromptPayQR = async (promptPayId, amount, ref1 = '', ref2 = '') => {
  try {
    // Format PromptPay ID (remove spaces and dashes)
    const cleanPromptPayId = promptPayId.replace(/[^0-9]/g, '');
    
    // Validate amount
    if (!amount || amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    // Format amount to 2 decimal places
    const formattedAmount = parseFloat(amount).toFixed(2);

    // Build PromptPay QR Code data according to EMVCo standard
    const qrData = buildPromptPayQRData(cleanPromptPayId, formattedAmount, ref1, ref2);
    
    // Generate QR Code
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 300
    });

    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating PromptPay QR Code:', error);
    throw error;
  }
};

/**
 * สร้างข้อมูล QR Code ตามมาตรฐาน PromptPay
 */
const buildPromptPayQRData = (promptPayId, amount, ref1, ref2) => {
  // EMVCo QR Code specification for PromptPay
  let qrData = '';
  
  // Payload Format Indicator
  qrData += '000201';
  
  // Point of Initiation Method
  qrData += '010212';
  
  // Merchant Account Information (PromptPay)
  let merchantInfo = '';
  merchantInfo += '0016A000000677010111'; // PromptPay identifier
  merchantInfo += '0113' + promptPayId; // PromptPay ID
  qrData += '29' + merchantInfo.length.toString().padStart(2, '0') + merchantInfo;
  
  // Transaction Currency (THB = 764)
  qrData += '5303764';
  
  // Transaction Amount
  if (amount && parseFloat(amount) > 0) {
    const amountStr = parseFloat(amount).toFixed(2);
    qrData += '54' + amountStr.length.toString().padStart(2, '0') + amountStr;
  }
  
  // Country Code (TH)
  qrData += '5802TH';
  
  // Additional Data Field Template
  let additionalData = '';
  if (ref1) {
    const ref1Str = ref1.substring(0, 25); // Max 25 characters
    additionalData += '05' + ref1Str.length.toString().padStart(2, '0') + ref1Str;
  }
  if (ref2) {
    const ref2Str = ref2.substring(0, 25); // Max 25 characters
    additionalData += '07' + ref2Str.length.toString().padStart(2, '0') + ref2Str;
  }
  
  if (additionalData) {
    qrData += '62' + additionalData.length.toString().padStart(2, '0') + additionalData;
  }
  
  // CRC16-CCITT
  qrData += '6304';
  const crc = calculateCRC16(qrData);
  qrData += crc;
  
  return qrData;
};

/**
 * คำนวณ CRC16-CCITT
 */
const calculateCRC16 = (data) => {
  let crc = 0xFFFF;
  
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
      crc &= 0xFFFF;
    }
  }
  
  return crc.toString(16).toUpperCase().padStart(4, '0');
};

/**
 * สร้าง Reference ID สำหรับการทำรายการ
 */
export const generateTransactionRef = (bookingId, customerId) => {
  const timestamp = Date.now().toString().slice(-6);
  return {
    ref1: `BOOK${bookingId}`,
    ref2: `USER${customerId}${timestamp}`
  };
};

/**
 * Validate PromptPay ID
 */
export const validatePromptPayId = (promptPayId) => {
  const cleaned = promptPayId.replace(/[^0-9]/g, '');
  
  // Phone number (10 digits)
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    return { isValid: true, type: 'phone', formatted: cleaned };
  }
  
  // National ID (13 digits)
  if (cleaned.length === 13) {
    return { isValid: true, type: 'national_id', formatted: cleaned };
  }
  
  return { isValid: false, type: null, formatted: cleaned };
};
