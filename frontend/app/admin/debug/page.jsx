'use client';

import { useAuth } from '../../../contexts/AuthContext';
import { isStaffOrAdmin } from '../../../lib/roles';

export default function AdminDebug() {
  const { user, isAuthenticated, loading } = useAuth();

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-6">
          Debug ข้อมูล Admin
        </h1>
        
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg mb-6">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">
            สถานะการเข้าสู่ระบบ
          </h2>
          <div className="space-y-2 text-sm">
            <p><span className="font-semibold">Loading:</span> {loading ? 'true' : 'false'}</p>
            <p><span className="font-semibold">isAuthenticated:</span> {isAuthenticated ? 'true' : 'false'}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg mb-6">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">
            ข้อมูลผู้ใช้
          </h2>
          <div className="space-y-2 text-sm">
            <p><span className="font-semibold">User object:</span></p>
            <pre className="bg-neutral-100 dark:bg-neutral-700 p-3 rounded text-xs overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg mb-6">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">
            การตรวจสอบสิทธิ์
          </h2>
          <div className="space-y-2 text-sm">
            <p><span className="font-semibold">user?.role:</span> {user?.role || 'ไม่พบ'}</p>
            <p><span className="font-semibold">isStaffOrAdmin(user):</span> {isStaffOrAdmin(user) ? 'true' : 'false'}</p>
            <p><span className="font-semibold">isStaffOrAdmin(user?.role):</span> {isStaffOrAdmin(user?.role) ? 'true' : 'false'}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">
            ลิงก์ทดสอบ
          </h2>
          <div className="space-y-2">
            <a href="/admin/dashboard" className="block text-blue-600 hover:underline">
              Admin Dashboard
            </a>
            <a href="/admin/bookings" className="block text-blue-600 hover:underline">
              Admin Bookings
            </a>
            <a href="/login" className="block text-blue-600 hover:underline">
              Login Page
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
