// Test Bookings Page Fix - Missing canManageBookings Function
console.log('🔧 Testing Bookings Page Fix...\n');

console.log('🚨 Problem Found:');
console.log('   - admin/bookings/page.jsx used canManageBookings function');
console.log('   - Function was not imported from permissions.js');
console.log('   - Caused runtime error when accessing bookings page\n');

console.log('✅ Fix Applied:');
console.log('   1. Added canManageBookings to lib/permissions.js');
console.log('   2. Added canConfirmBookings and canCancelBookings functions');
console.log('   3. Updated import in admin/bookings/page.jsx');
console.log('   4. Manager now has booking management permissions\n');

console.log('🎯 Expected Results:');
console.log('   - Manager can access /admin/bookings without errors');
console.log('   - Can view all booking management buttons');
console.log('   - Can confirm/cancel pending bookings');
console.log('   - No more function undefined errors\n');

console.log('📋 Test Steps:');
console.log('   1. Login as: manager@example.com / 123456');
console.log('   2. Navigate to: /admin/bookings');
console.log('   3. Page should load without errors');
console.log('   4. Check console for no "canManageBookings is not defined"');
console.log('   5. Verify booking action buttons are visible\n');

console.log('🎉 Bookings page should work perfectly for manager now!');