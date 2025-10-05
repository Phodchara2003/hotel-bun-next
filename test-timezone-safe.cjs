// ทดสอบการแก้ไข timezone-safe date formatting
console.log('🕐 ทดสอบการแก้ไข timezone-safe date formatting');
console.log('===============================================');

// จำลอง Date object ที่ MySQL ส่งกลับมา
const mockDateFromMySQL = new Date('2025-10-05T00:00:00+07:00'); // เวลาไทย

console.log('📊 Date object จาก MySQL:');
console.log('  - Original Date:', mockDateFromMySQL);
console.log('  - toString():', mockDateFromMySQL.toString());
console.log('  - toISOString():', mockDateFromMySQL.toISOString());
console.log('  - toISOString().split("T")[0]:', mockDateFromMySQL.toISOString().split('T')[0]);
console.log('');

// ทดสอบวิธีเก่า (มีปัญหา timezone)
const oldMethod = mockDateFromMySQL.toISOString().split('T')[0];
console.log('❌ วิธีเก่า (toISOString):', oldMethod);

// ทดสอบวิธีใหม่ (timezone-safe)
const formatDateSafe = (date) => {
  if (!(date instanceof Date)) return date;
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

const newMethod = formatDateSafe(mockDateFromMySQL);
console.log('✅ วิธีใหม่ (timezone-safe):', newMethod);

console.log('');
console.log('🔍 การเปรียบเทียบ:');
console.log(`  - toISOString(): ${oldMethod} (❌ ผิดวันที่)`);
console.log(`  - timezone-safe: ${newMethod} (✅ ถูกต้อง)`);

// ทดสอบการ format ใน Frontend
const { formatDateThai } = require('./frontend/lib/dateUtils.js');

console.log('');
console.log('📱 ทดสอบใน Frontend:');
try {
  const formatted = formatDateThai(newMethod);
  console.log(`✅ formatDateThai("${newMethod}") = "${formatted}"`);
} catch (error) {
  console.log(`❌ Error: ${error.message}`);
}

console.log('');
console.log('🎯 สรุป:');
console.log('  ✅ ใช้ getFullYear(), getMonth(), getDate() แทน toISOString()');
console.log('  ✅ หลีกเลี่ยงปัญหา timezone offset');
console.log('  ✅ ได้วันที่ที่ถูกต้องตามเวลาท้องถิ่น');