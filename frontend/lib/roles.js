// Helper functions for role checking

export const isAdmin = (user) => {
  return user?.role === 'admin';
};

export const isStaff = (user) => {
  return user?.role === 'staff';
};

export const isStaffOrAdmin = (user) => {
  return ['staff', 'admin'].includes(user?.role);
};

export const canAccess = (user, page = 'admin') => {
  switch (page) {
    case 'admin':
      return isStaffOrAdmin(user);
    case 'admin-write':
      return isAdmin(user); // Only admin can write/modify
    default:
      return false;
  }
};

// Check if user can modify/edit data (admin and staff for bookings)
export const canEdit = (user) => {
  return isStaffOrAdmin(user);
};

// Check if user can delete data (only admin)
export const canDelete = (user) => {
  return isAdmin(user);
};

// Check if user can create new data (only admin)
export const canCreate = (user) => {
  return isAdmin(user);
};

// Check if user can manage bookings (confirm/cancel) - both admin and staff
export const canManageBookings = (user) => {
  return isStaffOrAdmin(user);
};

// Check if user can approve bookings (only admin)
export const canApproveBookings = (user) => {
  return isAdmin(user);
};

// Check if user is in read-only mode (staff for most operations)
export const isReadOnly = (user) => {
  return isStaff(user);
};

export const getRoleText = (role) => {
  switch (role) {
    case 'admin':
      return 'ผู้ดูแลระบบ';
    case 'staff':
      return 'พนักงาน';
    case 'user':
      return 'ผู้ใช้งาน';
    default:
      return 'ไม่ระบุ';
  }
};

export const getRoleColor = (role) => {
  switch (role) {
    case 'admin':
      return 'bg-red-100 text-red-800';
    case 'staff':
      return 'bg-blue-100 text-blue-800';
    case 'user':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
