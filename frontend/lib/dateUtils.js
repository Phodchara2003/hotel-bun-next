// Date Utility Functions - แก้ไขปัญหา timezone สำหรับการแสดงวันที่

/**
 * แปลงวันที่ string (YYYY-MM-DD หรือ ISO string) เป็น Date object โดยไม่มีผลกระทบจาก timezone
 * @param {string} dateString - วันที่ในรูปแบบ YYYY-MM-DD หรือ ISO string
 * @returns {Date|null} - Date object หรือ null หากไม่มีข้อมูล
 */
export const createDateFromString = (dateString) => {
  if (!dateString) return null;
  
  // หากเป็น ISO string (มี T และ Z)
  if (dateString.includes('T') && dateString.includes('Z')) {
    const date = new Date(dateString);
    // แปลงเป็น local date เพื่อแสดงผลที่ถูกต้อง
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
  
  // หากเป็น YYYY-MM-DD format
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * แปลงวันที่เป็นรูปแบบ string สำหรับแสดงผลภาษาไทย
 * @param {string} dateString - วันที่ในรูปแบบ YYYY-MM-DD หรือ ISO string
 * @param {object} options - ตัวเลือกการแสดงผล
 * @returns {string} - วันที่ในรูปแบบภาษาไทย
 */
export const formatDateThai = (dateString, options = {}) => {
  if (!dateString) return 'ไม่ระบุวันที่';
  
  try {
    const date = createDateFromString(dateString);
    if (!date || isNaN(date.getTime())) return 'วันที่ไม่ถูกต้อง';
    
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    
    return date.toLocaleDateString('th-TH', { ...defaultOptions, ...options });
  } catch (error) {
    console.error('Error formatting date:', dateString, error);
    return 'วันที่ไม่ถูกต้อง';
  }
};

/**
 * แปลงวันที่เป็นรูปแบบ string สำหรับแสดงผลแบบสั้น
 * @param {string} dateString - วันที่ในรูปแบบ YYYY-MM-DD หรือ ISO string
 * @returns {string} - วันที่ในรูปแบบสั้น (เช่น 05/10/2025)
 */
export const formatDateShort = (dateString) => {
  if (!dateString) return 'ไม่ระบุ';
  
  try {
    const date = createDateFromString(dateString);
    if (!date || isNaN(date.getTime())) return 'วันที่ไม่ถูกต้อง';
    
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting date short:', dateString, error);
    return 'วันที่ไม่ถูกต้อง';
  }
};

/**
 * แปลงวันที่สำหรับใช้ใน input[type="date"]
 * @param {string} dateString - วันที่ในรูปแบบ YYYY-MM-DD หรือ ISO string
 * @returns {string} - วันที่ในรูปแบบ YYYY-MM-DD
 */
export const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  
  try {
    // ตรวจสอบว่าเป็นรูปแบบ YYYY-MM-DD แล้วหรือไม่
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    const date = createDateFromString(dateString);
    if (!date || isNaN(date.getTime())) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error formatting date for input:', dateString, error);
    return '';
  }
};

/**
 * คำนวณจำนวนคืนระหว่างวันที่เข้าพักและออก
 * @param {string} checkInDate - วันที่เข้าพัก (YYYY-MM-DD หรือ ISO string)
 * @param {string} checkOutDate - วันที่ออก (YYYY-MM-DD หรือ ISO string)
 * @returns {number} - จำนวนคืน
 */
export const calculateNights = (checkInDate, checkOutDate) => {
  if (!checkInDate || !checkOutDate) return 0;
  
  try {
    const checkIn = createDateFromString(checkInDate);
    const checkOut = createDateFromString(checkOutDate);
    
    if (!checkIn || !checkOut || isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) return 0;
    
    const timeDiff = checkOut.getTime() - checkIn.getTime();
    const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    return nights > 0 ? nights : 0;
  } catch (error) {
    console.error('Error calculating nights:', checkInDate, checkOutDate, error);
    return 0;
  }
};

/**
 * สร้างวันที่ปัจจุบันในรูปแบบ YYYY-MM-DD
 * @returns {string} - วันที่ปัจจุบัน
 */
export const getCurrentDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * เพิ่มจำนวนวันจากวันที่ที่กำหนด
 * @param {string} dateString - วันที่ในรูปแบบ YYYY-MM-DD
 * @param {number} days - จำนวนวันที่ต้องการเพิ่ม
 * @returns {string} - วันที่ใหม่ในรูปแบบ YYYY-MM-DD
 */
export const addDays = (dateString, days) => {
  if (!dateString) return '';
  
  const date = createDateFromString(dateString);
  if (!date) return '';
  
  date.setDate(date.getDate() + days);
  
  return formatDateForInput(
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  );
};

/**
 * ตรวจสอบว่าวันที่แรกอยู่ก่อนวันที่สองหรือไม่
 * @param {string} date1 - วันที่แรก (YYYY-MM-DD)
 * @param {string} date2 - วันที่สอง (YYYY-MM-DD)
 * @returns {boolean} - true หาก date1 อยู่ก่อน date2
 */
export const isDateBefore = (date1, date2) => {
  if (!date1 || !date2) return false;
  
  const d1 = createDateFromString(date1);
  const d2 = createDateFromString(date2);
  
  if (!d1 || !d2) return false;
  
  return d1.getTime() < d2.getTime();
};

/**
 * ตรวจสอบว่าวันที่อยู่ในอดีตหรือไม่
 * @param {string} dateString - วันที่ในรูปแบบ YYYY-MM-DD
 * @returns {boolean} - true หากวันที่อยู่ในอดีต
 */
export const isPastDate = (dateString) => {
  if (!dateString) return false;
  
  const date = createDateFromString(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (!date) return false;
  
  return date.getTime() < today.getTime();
};

/**
 * แปลง Date object เป็น string สำหรับส่งไปยัง backend
 * @param {Date} date - Date object
 * @returns {string} - วันที่ในรูปแบบ YYYY-MM-DD
 */
export const dateToString = (date) => {
  if (!date || !(date instanceof Date)) return '';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

// Default export สำหรับใช้งานหลักๆ
export default {
  formatDateThai,
  formatDateShort,
  formatDateForInput,
  calculateNights,
  getCurrentDateString,
  addDays,
  isDateBefore,
  isPastDate,
  createDateFromString,
  dateToString
};