// Test which admin pages are accessible for manager role
console.log('🧪 Testing Manager Access to Admin Pages...\n');

// Import the updated permissions
import { 
  isStaffOrAdmin,
  canAccessAdminDashboard,
  canAccessUserManagement,
  canAccessReports,
  ROLES 
} from './frontend/lib/permissions.js';

// Test user object
const managerUser = {
  id: 20,
  email: 'manager@example.com',
  role: 'manager',
  first_name: 'Manager',
  last_name: 'User'
};

const adminUser = {
  id: 1,
  email: 'admin@example.com',
  role: 'admin',
  first_name: 'Admin',
  last_name: 'User'
};

const staffUser = {
  id: 2,
  email: 'staff@example.com',
  role: 'staff',
  first_name: 'Staff',
  last_name: 'User'
};

console.log('🔍 Testing Manager User Permissions:');
console.log(`   Email: ${managerUser.email}`);
console.log(`   Role: ${managerUser.role}`);
console.log('');

console.log('📋 Permission Test Results:');
console.log(`   isStaffOrAdmin(manager): ${isStaffOrAdmin(managerUser)}`);
console.log(`   canAccessAdminDashboard(manager): ${canAccessAdminDashboard(managerUser)}`);
console.log(`   canAccessUserManagement(manager): ${canAccessUserManagement(managerUser)}`);
console.log(`   canAccessReports(manager): ${canAccessReports(managerUser)}`);
console.log('');

console.log('🔄 Comparison with Admin User:');
console.log(`   isStaffOrAdmin(admin): ${isStaffOrAdmin(adminUser)}`);
console.log(`   canAccessAdminDashboard(admin): ${canAccessAdminDashboard(adminUser)}`);
console.log(`   canAccessUserManagement(admin): ${canAccessUserManagement(adminUser)}`);
console.log(`   canAccessReports(admin): ${canAccessReports(adminUser)}`);
console.log('');

console.log('🔄 Comparison with Staff User:');
console.log(`   isStaffOrAdmin(staff): ${isStaffOrAdmin(staffUser)}`);
console.log(`   canAccessAdminDashboard(staff): ${canAccessAdminDashboard(staffUser)}`);
console.log(`   canAccessUserManagement(staff): ${canAccessUserManagement(staffUser)}`);
console.log(`   canAccessReports(staff): ${canAccessReports(staffUser)}`);
console.log('');

console.log('✅ Manager should now have access to:');
console.log('   - Admin Dashboard (/admin/dashboard)');
console.log('   - User Management (/admin/user-management) - Read Only');
console.log('   - Reports (/admin/reports)');
console.log('   - Calendar (/admin/calendar)');
console.log('   - Bookings View (/admin/bookings)');
console.log('');

console.log('🎉 Permission test completed!');