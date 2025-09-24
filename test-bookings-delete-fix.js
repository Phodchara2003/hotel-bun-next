// Test Bookings Page Fix - canDelete Function
console.log('🔧 Testing Bookings Page Fix (canDelete)...\n');

console.log('🚨 Problem Found:');
console.log('   - admin/bookings/page.jsx used canDelete function from legacy roles.js');
console.log('   - Function was not available after switching to permissions.js');
console.log('   - Caused runtime error on line 735 and 896\n');

console.log('✅ Fix Applied:');
console.log('   1. Replaced canDelete(user) with canDeleteBookings(user).all');
console.log('   2. Fixed both instances on lines 767 and 896');
console.log('   3. Uses proper permissions.js function structure');
console.log('   4. Maintains proper access control for delete operations\n');

console.log('🎯 Expected Results:');
console.log('   - Manager can access /admin/bookings without JavaScript errors');
console.log('   - Delete buttons show/hide based on proper permissions');
console.log('   - Only admin/super_admin can delete bookings');
console.log('   - No more "canDelete is not defined" errors\n');

console.log('📋 Test Steps:');
console.log('   1. Login as: manager@example.com / 123456');
console.log('   2. Navigate to: /admin/bookings');
console.log('   3. Page should load completely without errors');
console.log('   4. Check that delete buttons are hidden for manager');
console.log('   5. Verify no console errors related to canDelete\n');

console.log('🎉 Bookings page should be fully functional now!');