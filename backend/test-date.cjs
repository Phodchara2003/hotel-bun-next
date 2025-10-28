// Simple test to check date format used in API

const today = new Date().toISOString().split('T')[0];
console.log('📅 API today format:', today);
console.log('📅 API today type:', typeof today);

// Also check if there's a timezone issue
const now = new Date();
console.log('🕐 Current time:', now);
console.log('🕐 ISO string:', now.toISOString());
console.log('🕐 Local string:', now.toLocaleDateString());
console.log('🕐 Timezone offset:', now.getTimezoneOffset());