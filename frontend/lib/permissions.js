// การจัดการสิทธิ์การเข้าถึงตามบทบาทผู้ใช้
// Role-based Access Control (RBAC) System

/**
 * บทบาทและสิทธิ์ในระบบ:
 * - user: ผู้ใช้ทั่วไป (จองห้อง, ดูประวัติ, แก้ไขโปรไฟล์)
 * - staff: พนักงาน (ดูข้อมูลการจอง, เช็คอิน/เช็คเอาท์, ดูรายงาน - อ่านอย่างเดียว)
 * - admin: ผู้ดูแลระบบ (เต็มสิทธิ์ทุกอย่าง)
 * - super_admin: ผู้ดูแลระบบสูงสุด (เต็มสิทธิ์ + จัดการสิทธิ์ผู้อื่น)
 */

export const ROLES = {
  USER: 'user',
  GUEST: 'guest',
  STAFF: 'staff',
  MANAGER: 'manager', 
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
};

// ตรวจสอบบทบาท
export const isUser = (user) => user?.role === ROLES.USER;
export const isGuest = (user) => user?.role === ROLES.GUEST;
export const isStaff = (user) => user?.role === ROLES.STAFF;
export const isManager = (user) => user?.role === ROLES.MANAGER;
export const isAdmin = (user) => user?.role === ROLES.ADMIN;
export const isSuperAdmin = (user) => user?.role === ROLES.SUPER_ADMIN;

// ตรวจสอบกลุ่มสิทธิ์
export const isStaffOrAdmin = (user) => [ROLES.STAFF, ROLES.MANAGER, ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(user?.role);
export const isAdminOrSuper = (user) => [ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(user?.role);
export const isManagerOrAdmin = (user) => [ROLES.MANAGER, ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(user?.role);

// สิทธิ์การเข้าถึงหน้าต่างๆ
export const canAccessAdminDashboard = (user) => isStaffOrAdmin(user);
export const canAccessUserManagement = (user) => isManagerOrAdmin(user); // Manager can view users (read-only)
export const canAccessReports = (user) => isStaffOrAdmin(user);
export const canAccessSettings = (user) => isAdminOrSuper(user);
export const canAccessPaymentSettings = (user) => isAdminOrSuper(user);

// สิทธิ์การจัดการข้อมูล
export const canViewBookings = (user) => {
  if (isUser(user)) return { own: true, all: false }; // ดูของตัวเองเท่านั้น
  if (isStaffOrAdmin(user)) return { own: true, all: true }; // ดูทั้งหมดได้
  return { own: false, all: false };
};

export const canEditBookings = (user) => {
  if (isUser(user)) return { own: true, all: false }; // แก้ไขของตัวเองเท่านั้น (ภายในเวลาที่กำหนด)
  if (isAdmin(user)) return { own: true, all: true }; // แก้ไขทั้งหมดได้
  if (isStaff(user)) return { own: false, all: false }; // พนักงานไม่สามารถแก้ไขได้
  return { own: false, all: false };
};

export const canDeleteBookings = (user) => {
  if (isUser(user)) return { own: true, all: false }; // ยกเลิกของตัวเองเท่านั้น
  if (isAdmin(user)) return { own: true, all: true }; // ลบทั้งหมดได้
  return { own: false, all: false };
};

export const canCreateBookings = (user) => {
  return !!user; // ผู้ใช้ที่ล็อกอินแล้วทุกคนสามารถจองได้
};

// สิทธิ์การจัดการผู้ใช้
export const canViewUsers = (user) => isAdminOrSuper(user);
export const canCreateUsers = (user) => isAdminOrSuper(user);
export const canEditUsers = (user) => isAdminOrSuper(user);
export const canDeleteUsers = (user) => isAdminOrSuper(user);
export const canChangeUserRoles = (user) => isAdminOrSuper(user);

// สิทธิ์การจัดการห้องพัก
export const canViewRooms = (user) => true; // ทุกคนดูได้
export const canCreateRooms = (user) => isAdminOrSuper(user);
export const canEditRooms = (user) => isAdminOrSuper(user);
export const canDeleteRooms = (user) => isAdminOrSuper(user);
export const canManageRoomStatus = (user) => isStaffOrAdmin(user);

// สิทธิ์การจัดการการจอง (Booking Management)
export const canManageBookings = (user) => isStaffOrAdmin(user); // Staff, Manager, Admin can manage bookings
export const canConfirmBookings = (user) => isStaffOrAdmin(user);
export const canCancelBookings = (user) => isStaffOrAdmin(user);

// สิทธิ์การจัดการการเงิน
export const canViewPayments = (user) => {
  if (isUser(user)) return { own: true, all: false };
  if (isStaffOrAdmin(user)) return { own: true, all: true };
  return { own: false, all: false };
};

export const canProcessPayments = (user) => isStaffOrAdmin(user);
export const canRefundPayments = (user) => isAdminOrSuper(user);
export const canViewFinancialReports = (user) => isStaffOrAdmin(user);

// สิทธิ์พิเศษ
export const canManagePermissions = (user) => isSuperAdmin(user);
export const canAccessSystemLogs = (user) => isAdminOrSuper(user);
export const canManageSystemSettings = (user) => isAdminOrSuper(user);

// ฟังก์ชันตรวจสอบสิทธิ์แบบกว้างๆ
export const hasPermission = (user, action, resource = null) => {
  if (!user) return false;

  switch (action) {
    case 'view':
      if (resource === 'bookings') return canViewBookings(user).all || canViewBookings(user).own;
      if (resource === 'users') return canViewUsers(user);
      if (resource === 'rooms') return canViewRooms(user);
      if (resource === 'payments') return canViewPayments(user).all || canViewPayments(user).own;
      break;

    case 'create':
      if (resource === 'bookings') return canCreateBookings(user);
      if (resource === 'users') return canCreateUsers(user);
      if (resource === 'rooms') return canCreateRooms(user);
      break;

    case 'edit':
      if (resource === 'bookings') return canEditBookings(user).all;
      if (resource === 'users') return canEditUsers(user);
      if (resource === 'rooms') return canEditRooms(user);
      break;

    case 'delete':
      if (resource === 'bookings') return canDeleteBookings(user).all;
      if (resource === 'users') return canDeleteUsers(user);
      if (resource === 'rooms') return canDeleteRooms(user);
      break;

    case 'admin_access':
      return canAccessAdminDashboard(user);

    default:
      return false;
  }

  return false;
};

// ข้อความแสดงบทบาท
export const getRoleDisplayName = (role) => {
  switch (role) {
    case ROLES.USER: return 'ผู้ใช้งาน';
    case ROLES.STAFF: return 'พนักงาน';
    case ROLES.ADMIN: return 'ผู้ดูแลระบบ';
    case ROLES.SUPER_ADMIN: return 'ผู้ดูแลระบบสูงสุด';
    default: return 'ไม่ระบุ';
  }
};

// สีสำหรับแสดงบทบาท
export const getRoleBadgeClass = (role) => {
  switch (role) {
    case ROLES.USER: return 'bg-blue-100 text-blue-800';
    case ROLES.STAFF: return 'bg-green-100 text-green-800';
    case ROLES.ADMIN: return 'bg-red-100 text-red-800';
    case ROLES.SUPER_ADMIN: return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// สรุปสิทธิ์ของผู้ใช้
export const getUserPermissionSummary = (user) => {
  if (!user) return null;

  return {
    role: user.role,
    displayName: getRoleDisplayName(user.role),
    permissions: {
      adminAccess: canAccessAdminDashboard(user),
      userManagement: canAccessUserManagement(user),
      bookingView: canViewBookings(user),
      bookingEdit: canEditBookings(user),
      bookingDelete: canDeleteBookings(user),
      roomManagement: canEditRooms(user),
      paymentAccess: canViewPayments(user),
      systemSettings: canAccessSettings(user)
    },
    isReadOnly: isStaff(user) // พนักงานส่วนใหญ่เป็น read-only
  };
};

export default {
  ROLES,
  isUser,
  isGuest,
  isStaff,
  isManager,
  isAdmin,
  isSuperAdmin,
  isStaffOrAdmin,
  isAdminOrSuper,
  isManagerOrAdmin,
  canAccessAdminDashboard,
  canAccessUserManagement,
  canAccessReports,
  hasPermission,
  getUserPermissionSummary,
  getRoleDisplayName,
  getRoleBadgeClass
};
