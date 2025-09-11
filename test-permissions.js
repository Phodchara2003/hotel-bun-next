// ทดสอบระบบสิทธิ์การเข้าถึงสำหรับบทบาทต่างๆ
const { 
  ROLES,
  isAdmin,
  isStaff,
  isUser,
  isStaffOrAdmin,
  canViewBookings,
  canEditBookings,
  canDeleteBookings,
  canViewUsers,
  canEditUsers,
  canDeleteUsers,
  hasPermission,
  getUserPermissionSummary,
  getRoleDisplayName 
} = require('./frontend/lib/permissions.js');

console.log('🔐 ทดสอบระบบสิทธิ์การเข้าถึง (Role-Based Access Control)');
console.log('=' * 70);

// สร้างผู้ใช้ทดสอบ
const testUsers = [
  { id: 1, email: 'user@hotel.com', role: 'user', name: 'ลูกค้าทั่วไป' },
  { id: 2, email: 'staff@hotel.com', role: 'staff', name: 'พนักงาน' },
  { id: 3, email: 'admin@hotel.com', role: 'admin', name: 'ผู้ดูแลระบบ' },
  { id: 4, email: 'super@hotel.com', role: 'super_admin', name: 'ผู้ดูแลระบบสูงสุด' }
];

// ทดสอบฟังก์ชันตรวจสอบบทบาท
console.log('\n📋 ทดสอบการตรวจสอบบทบาท:');
console.log('-' * 50);

testUsers.forEach(user => {
  console.log(`\n👤 ${user.name} (${user.role}):`);
  console.log(`   isUser: ${isUser(user)}`);
  console.log(`   isStaff: ${isStaff(user)}`);
  console.log(`   isAdmin: ${isAdmin(user)}`);
  console.log(`   isStaffOrAdmin: ${isStaffOrAdmin(user)}`);
  console.log(`   ชื่อบทบาท: ${getRoleDisplayName(user.role)}`);
});

// ทดสอบสิทธิ์การดูข้อมูล
console.log('\n📊 ทดสอบสิทธิ์การดูข้อมูล:');
console.log('-' * 50);

testUsers.forEach(user => {
  const bookingAccess = canViewBookings(user);
  const userAccess = canViewUsers(user);
  
  console.log(`\n👤 ${user.name}:`);
  console.log(`   ดูการจอง - ของตัวเอง: ${bookingAccess.own}, ทั้งหมด: ${bookingAccess.all}`);
  console.log(`   ดูข้อมูลผู้ใช้: ${userAccess}`);
  console.log(`   เข้าถึงแอดมิน: ${hasPermission(user, 'admin_access')}`);
});

// ทดสอบสิทธิ์การแก้ไข
console.log('\n✏️  ทดสอบสิทธิ์การแก้ไข:');
console.log('-' * 50);

testUsers.forEach(user => {
  const bookingEdit = canEditBookings(user);
  const userEdit = canEditUsers(user);
  
  console.log(`\n👤 ${user.name}:`);
  console.log(`   แก้ไขการจอง - ของตัวเอง: ${bookingEdit.own}, ทั้งหมด: ${bookingEdit.all}`);
  console.log(`   แก้ไขผู้ใช้: ${userEdit}`);
  console.log(`   สร้างการจอง: ${hasPermission(user, 'create', 'bookings')}`);
  console.log(`   สร้างผู้ใช้: ${hasPermission(user, 'create', 'users')}`);
});

// ทดสอบสิทธิ์การลบ
console.log('\n🗑️  ทดสอบสิทธิ์การลบ:');
console.log('-' * 50);

testUsers.forEach(user => {
  const bookingDelete = canDeleteBookings(user);
  const userDelete = canDeleteUsers(user);
  
  console.log(`\n👤 ${user.name}:`);
  console.log(`   ลบการจอง - ของตัวเอง: ${bookingDelete.own}, ทั้งหมด: ${bookingDelete.all}`);
  console.log(`   ลบผู้ใช้: ${userDelete}`);
});

// ทดสอบสรุปสิทธิ์
console.log('\n📝 สรุปสิทธิ์ทั้งหมด:');
console.log('-' * 50);

testUsers.forEach(user => {
  const summary = getUserPermissionSummary(user);
  
  console.log(`\n👤 ${user.name} (${summary.displayName}):`);
  console.log(`   🔐 เข้าถึงแอดมิน: ${summary.permissions.adminAccess ? '✅' : '❌'}`);
  console.log(`   👥 จัดการผู้ใช้: ${summary.permissions.userManagement ? '✅' : '❌'}`);
  console.log(`   📅 ดูการจอง: ${summary.permissions.bookingView.all ? '✅ ทั้งหมด' : summary.permissions.bookingView.own ? '🔸 ตัวเอง' : '❌'}`);
  console.log(`   ✏️  แก้ไขการจอง: ${summary.permissions.bookingEdit.all ? '✅ ทั้งหมด' : summary.permissions.bookingEdit.own ? '🔸 ตัวเอง' : '❌'}`);
  console.log(`   🗑️  ลบการจอง: ${summary.permissions.bookingDelete.all ? '✅ ทั้งหมด' : summary.permissions.bookingDelete.own ? '🔸 ตัวเอง' : '❌'}`);
  console.log(`   🏨 จัดการห้อง: ${summary.permissions.roomManagement ? '✅' : '❌'}`);
  console.log(`   💰 เข้าถึงการเงิน: ${summary.permissions.paymentAccess.all ? '✅ ทั้งหมด' : summary.permissions.paymentAccess.own ? '🔸 ตัวเอง' : '❌'}`);
  console.log(`   ⚙️  ตั้งค่าระบบ: ${summary.permissions.systemSettings ? '✅' : '❌'}`);
  console.log(`   📖 โหมดอ่านอย่างเดียว: ${summary.isReadOnly ? '✅' : '❌'}`);
});

// ทดสอบสถานการณ์จริง
console.log('\n🎭 ทดสอบสถานการณ์การใช้งานจริง:');
console.log('-' * 50);

const scenarios = [
  {
    name: 'ลูกค้าต้องการดูการจองของตัวเอง',
    user: testUsers[0], // user
    action: 'view',
    resource: 'bookings',
    expected: true
  },
  {
    name: 'ลูกค้าต้องการดูการจองของคนอื่น',
    user: testUsers[0], // user
    check: (user) => canViewBookings(user).all,
    expected: false
  },
  {
    name: 'พนักงานต้องการดูการจองทั้งหมด',
    user: testUsers[1], // staff
    check: (user) => canViewBookings(user).all,
    expected: true
  },
  {
    name: 'พนักงานต้องการแก้ไขการจอง',
    user: testUsers[1], // staff
    check: (user) => canEditBookings(user).all,
    expected: false
  },
  {
    name: 'แอดมินต้องการลบผู้ใช้',
    user: testUsers[2], // admin
    action: 'delete',
    resource: 'users',
    expected: true
  },
  {
    name: 'พนักงานต้องการสร้างผู้ใช้ใหม่',
    user: testUsers[1], // staff
    action: 'create',
    resource: 'users',
    expected: false
  }
];

scenarios.forEach((scenario, index) => {
  let result;
  if (scenario.action && scenario.resource) {
    result = hasPermission(scenario.user, scenario.action, scenario.resource);
  } else if (scenario.check) {
    result = scenario.check(scenario.user);
  }

  const status = result === scenario.expected ? '✅ ผ่าน' : '❌ ไม่ผ่าน';
  console.log(`\n${index + 1}. ${scenario.name}`);
  console.log(`   ผู้ทดสอบ: ${scenario.user.name}`);
  console.log(`   ผลลัพธ์: ${result} (คาดหวัง: ${scenario.expected})`);
  console.log(`   สถานะ: ${status}`);
});

console.log('\n' + '=' * 70);
console.log('🎉 การทดสอบระบบสิทธิ์เสร็จสิ้น');
console.log('💡 ระบบสิทธิ์ช่วยให้:');
console.log('   - ลูกค้าเห็นเฉพาะข้อมูลของตัวเอง');
console.log('   - พนักงานดูข้อมูลได้แต่แก้ไขไม่ได้');
console.log('   - แอดมินมีสิทธิ์เต็มในการจัดการ');
console.log('   - ป้องกันการเข้าถึงข้อมูลที่ไม่ได้รับอนุญาต');
