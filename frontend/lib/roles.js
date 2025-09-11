// Helper functions for role checking
// ไฟล์นี้เป็น legacy - ใช้ permissions.js แทน

import {
  isAdmin as checkIsAdmin,
  isStaff as checkIsStaff,
  isStaffOrAdmin as checkIsStaffOrAdmin,
  canEditBookings,
  canDeleteBookings,
  canCreateBookings,
  getRoleDisplayName,
  getRoleBadgeClass
} from './permissions.js';

// Legacy functions for backward compatibility
export const isAdmin = checkIsAdmin;
export const isStaff = checkIsStaff;
export const isStaffOrAdmin = checkIsStaffOrAdmin;

export const canAccess = (user, page = 'admin') => {
  switch (page) {
    case 'admin':
      return checkIsStaffOrAdmin(user);
    case 'admin-write':
      return checkIsAdmin(user); // Only admin can write/modify
    default:
      return false;
  }
};

// Check if user can modify/edit data (admin and staff for bookings)
export const canEdit = (user) => {
  return canEditBookings(user).all || canEditBookings(user).own;
};

// Check if user can delete data (only admin)
export const canDelete = (user) => {
  return canDeleteBookings(user).all || canDeleteBookings(user).own;
};

// Check if user can create new data (only admin)
export const canCreate = (user) => {
  return canCreateBookings(user);
};

// Check if user can manage bookings (confirm/cancel) - both admin and staff
export const canManageBookings = (user) => {
  return checkIsStaffOrAdmin(user);
};

// Check if user can approve bookings (only admin)
export const canApproveBookings = (user) => {
  return checkIsAdmin(user);
};

// Check if user is in read-only mode (staff for most operations)
export const isReadOnly = (user) => {
  return checkIsStaff(user);
};

export const getRoleText = getRoleDisplayName;
export const getRoleColor = getRoleBadgeClass;
