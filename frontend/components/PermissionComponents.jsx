// Component สำหรับตรวจสอบสิทธิ์และแสดงเฉพาะเนื้อหาที่ผู้ใช้มีสิทธิ์เข้าถึง
'use client';

import { useAuth } from '../contexts/AuthContext';
import { hasPermission, getUserPermissionSummary } from '../lib/permissions';

// Wrapper component สำหรับการตรวจสอบสิทธิ์
export function PermissionGuard({ 
  children, 
  fallback = null, 
  requiredPermission = null,
  requiredAction = null,
  requiredResource = null,
  allowedRoles = null 
}) {
  const { user, isAuthenticated } = useAuth();

  // ถ้าไม่ได้ล็อกอิน
  if (!isAuthenticated || !user) {
    return fallback;
  }

  // ตรวจสอบบทบาทที่อนุญาต
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return fallback;
  }

  // ตรวจสอบสิทธิ์เฉพาะ
  if (requiredAction && requiredResource) {
    if (!hasPermission(user, requiredAction, requiredResource)) {
      return fallback;
    }
  }

  return children;
}

// Component แสดงสถานะสิทธิ์ผู้ใช้
export function UserPermissionStatus() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
        ไม่ได้เข้าสู่ระบบ
      </div>
    );
  }

  const summary = getUserPermissionSummary(user);

  return (
    <div className="flex items-center space-x-2">
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${summary.permissions.adminAccess ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
        {summary.displayName}
      </span>
      {summary.isReadOnly && (
        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
          อ่านอย่างเดียว
        </span>
      )}
    </div>
  );
}

// Component สำหรับแสดงปุ่มตามสิทธิ์
export function PermissionButton({ 
  children, 
  action, 
  resource, 
  allowedRoles = null,
  className = "",
  disabled = false,
  ...props 
}) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return null;
  }

  // ตรวจสอบบทบาท
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return null;
  }

  // ตรวจสอบสิทธิ์
  if (action && resource && !hasPermission(user, action, resource)) {
    return null;
  }

  return (
    <button 
      className={className}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

// Component สำหรับแสดง Link ตามสิทธิ์
export function PermissionLink({ 
  children, 
  action, 
  resource, 
  allowedRoles = null,
  className = "",
  ...props 
}) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return null;
  }

  // ตรวจสอบบทบาท
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return null;
  }

  // ตรวจสอบสิทธิ์
  if (action && resource && !hasPermission(user, action, resource)) {
    return null;
  }

  return (
    <a className={className} {...props}>
      {children}
    </a>
  );
}

// Hook สำหรับการตรวจสอบสิทธิ์ในการทำงาน
export function usePermissions() {
  const { user, isAuthenticated } = useAuth();

  const checkPermission = (action, resource = null) => {
    if (!isAuthenticated || !user) return false;
    return hasPermission(user, action, resource);
  };

  const checkRole = (allowedRoles) => {
    if (!isAuthenticated || !user) return false;
    return allowedRoles.includes(user.role);
  };

  const getPermissionSummary = () => {
    if (!isAuthenticated || !user) return null;
    return getUserPermissionSummary(user);
  };

  return {
    checkPermission,
    checkRole,
    getPermissionSummary,
    user,
    isAuthenticated
  };
}

// Component สำหรับแสดงข้อความเมื่อไม่มีสิทธิ์
export function NoPermissionMessage({ message = "คุณไม่มีสิทธิ์เข้าถึงส่วนนี้" }) {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
      <div className="text-yellow-800 font-medium">{message}</div>
      <div className="text-yellow-600 text-sm mt-1">
        กรุณาติดต่อผู้ดูแลระบบหากคุณคิดว่านี่เป็นข้อผิดพลาด
      </div>
    </div>
  );
}

export default {
  PermissionGuard,
  UserPermissionStatus,
  PermissionButton,
  PermissionLink,
  usePermissions,
  NoPermissionMessage
};
