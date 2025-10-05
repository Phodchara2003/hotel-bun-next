// Test date formatting functions
import { formatDateThai, formatDateShort, calculateNights, createDateFromString } from './frontend/lib/dateUtils.js';

// Test data from API
const testDates = [
  "2025-10-04T17:00:00.000Z",
  "2025-10-05T17:00:00.000Z",
  "2025-10-06",
  null,
  undefined,
  "",
  "invalid-date"
];

console.log('=== ทดสอบการแปลงวันที่ ===');

testDates.forEach((date, index) => {
  console.log(`\nTest ${index + 1}: ${date}`);
  console.log('formatDateThai:', formatDateThai(date));
  console.log('formatDateShort:', formatDateShort(date));
  console.log('createDateFromString:', createDateFromString(date));
});

console.log('\n=== ทดสอบการคำนวณจำนวนคืน ===');
console.log('API dates (ISO):', calculateNights("2025-10-04T17:00:00.000Z", "2025-10-05T17:00:00.000Z"));
console.log('Normal dates:', calculateNights("2025-10-04", "2025-10-06"));
console.log('Null dates:', calculateNights(null, null));