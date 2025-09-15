// Quick Test Runner - สำหรับรันเทสง่ายๆ
// Usage: node quick-test.js

const { runAllTests } = require('./auto-test-suite');

console.log('🚀 Hotel Booking System - Quick Test');
console.log('=====================================\n');

runAllTests().then(success => {
  if (success) {
    console.log('\n✨ System is working perfectly!');
  } else {
    console.log('\n❌ Some issues found. Check the report above.');
  }
}).catch(error => {
  console.error('❌ Test failed:', error.message);
});