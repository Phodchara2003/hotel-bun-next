// ตัวอย่างการใช้งาน Permission Components ในหน้าต่างๆ
'use client';

import { useState } from 'react';
import { 
  PermissionGuard, 
  PermissionButton, 
  PermissionLink,
  UserPermissionStatus,
  NoPermissionMessage,
  usePermissions 
} from '../components/PermissionComponents';
import { Trash2, Edit, Plus, Eye } from 'lucide-react';

// ตัวอย่างหน้า Dashboard ที่มีการตรวจสอบสิทธิ์
export default function ExampleDashboard() {
  const { checkPermission, checkRole, getPermissionSummary } = usePermissions();
  const [users, setUsers] = useState([
    { id: 1, name: 'ลูกค้า A', email: 'user1@hotel.com', role: 'user' },
    { id: 2, name: 'พนักงาน B', email: 'staff1@hotel.com', role: 'staff' },
    { id: 3, name: 'แอดมิน C', email: 'admin1@hotel.com', role: 'admin' }
  ]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header with User Status */}
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">แดชบอร์ดตัวอย่าง</h1>
        <UserPermissionStatus />
      </div>

      {/* Navigation Menu - แสดงตามสิทธิ์ */}
      <nav className="mb-8 bg-white rounded-lg shadow p-4">
        <div className="flex space-x-4">
          {/* เมนูที่ทุกคนเห็นได้ */}
          <a href="/" className="text-blue-600 hover:text-blue-800">หน้าหลัก</a>
          
          {/* เมนูสำหรับ Staff และ Admin */}
          <PermissionGuard allowedRoles={['staff', 'admin']}>
            <a href="/admin/bookings" className="text-blue-600 hover:text-blue-800">การจอง</a>
            <a href="/admin/reports" className="text-blue-600 hover:text-blue-800">รายงาน</a>
          </PermissionGuard>

          {/* เมนูสำหรับ Admin เท่านั้น */}
          <PermissionGuard allowedRoles={['admin']}>
            <a href="/admin/users" className="text-blue-600 hover:text-blue-800">จัดการผู้ใช้</a>
            <a href="/admin/settings" className="text-blue-600 hover:text-blue-800">ตั้งค่า</a>
          </PermissionGuard>
        </div>
      </nav>

      {/* Quick Actions - แสดงปุ่มตามสิทธิ์ */}
      <div className="mb-8 bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-4">การทำงานด่วน</h2>
        <div className="flex space-x-3">
          {/* ปุ่มสร้างการจอง - ทุกคนที่ล็อกอินแล้วทำได้ */}
          <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            <Plus className="w-4 h-4 inline mr-2" />
            จองห้องพัก
          </button>

          {/* ปุ่มสำหรับ Staff และ Admin */}
          <PermissionButton 
            allowedRoles={['staff', 'admin']}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            <Eye className="w-4 h-4 inline mr-2" />
            ดูการจองทั้งหมด
          </PermissionButton>

          {/* ปุ่มสำหรับ Admin เท่านั้น */}
          <PermissionButton 
            action="create" 
            resource="users"
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
          >
            <Plus className="w-4 h-4 inline mr-2" />
            เพิ่มผู้ใช้ใหม่
          </PermissionButton>
        </div>
      </div>

      {/* User Management Section - เฉพาะ Admin */}
      <PermissionGuard 
        allowedRoles={['admin']}
        fallback={
          <NoPermissionMessage message="คุณไม่มีสิทธิ์เข้าถึงการจัดการผู้ใช้" />
        }
      >
        <div className="bg-white rounded-lg shadow p-4 mb-8">
          <h2 className="text-lg font-semibold mb-4">จัดการผู้ใช้</h2>
          <div className="space-y-3">
            {users.map(user => (
              <div key={user.id} className="flex justify-between items-center p-3 border rounded">
                <div>
                  <span className="font-medium">{user.name}</span>
                  <span className="text-gray-500 ml-2">({user.email})</span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm ml-2">
                    {user.role}
                  </span>
                </div>
                <div className="space-x-2">
                  {/* ปุ่มดู - ทุกคนที่เข้าถึงส่วนนี้ได้ */}
                  <button className="text-blue-600 hover:text-blue-800">
                    <Eye className="w-4 h-4" />
                  </button>

                  {/* ปุ่มแก้ไข - เฉพาะที่มีสิทธิ์แก้ไขผู้ใช้ */}
                  <PermissionButton 
                    action="edit" 
                    resource="users"
                    className="text-yellow-600 hover:text-yellow-800"
                  >
                    <Edit className="w-4 h-4" />
                  </PermissionButton>

                  {/* ปุ่มลบ - เฉพาะที่มีสิทธิ์ลบผู้ใช้ */}
                  <PermissionButton 
                    action="delete" 
                    resource="users"
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </PermissionButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      </PermissionGuard>

      {/* Booking History - แสดงตามสิทธิ์ */}
      <div className="bg-white rounded-lg shadow p-4 mb-8">
        <h2 className="text-lg font-semibold mb-4">ประวัติการจอง</h2>
        
        {/* เนื้อหาสำหรับผู้ใช้ทั่วไป */}
        <PermissionGuard allowedRoles={['user']}>
          <p className="text-gray-600">แสดงเฉพาะการจองของคุณ</p>
          <div className="mt-3 p-3 border rounded">
            <span>การจอง #1234 - ห้อง Deluxe - 15-16 ก.ย. 2025</span>
            <div className="mt-2 space-x-2">
              <button className="text-blue-600 hover:text-blue-800">ดูรายละเอียด</button>
              <button className="text-red-600 hover:text-red-800">ยกเลิก</button>
            </div>
          </div>
        </PermissionGuard>

        {/* เนื้อหาสำหรับ Staff และ Admin */}
        <PermissionGuard allowedRoles={['staff', 'admin']}>
          <p className="text-gray-600">แสดงการจองทั้งหมด</p>
          <div className="mt-3 space-y-2">
            <div className="p-3 border rounded">
              <span>การจอง #1234 - ลูกค้า A - ห้อง Deluxe</span>
              <div className="mt-2 space-x-2">
                <button className="text-blue-600 hover:text-blue-800">ดูรายละเอียด</button>
                
                {/* ปุ่มแก้ไข - เฉพาะ Admin */}
                <PermissionButton 
                  action="edit" 
                  resource="bookings"
                  className="text-yellow-600 hover:text-yellow-800"
                >
                  แก้ไข
                </PermissionButton>

                {/* ปุ่มลบ - เฉพาะ Admin */}
                <PermissionButton 
                  action="delete" 
                  resource="bookings"
                  className="text-red-600 hover:text-red-800"
                >
                  ลบ
                </PermissionButton>
              </div>
            </div>
            <div className="p-3 border rounded">
              <span>การจอง #1235 - ลูกค้า B - ห้อง Standard</span>
              <div className="mt-2 space-x-2">
                <button className="text-blue-600 hover:text-blue-800">ดูรายละเอียด</button>
                
                <PermissionButton 
                  action="edit" 
                  resource="bookings"
                  className="text-yellow-600 hover:text-yellow-800"
                >
                  แก้ไข
                </PermissionButton>

                <PermissionButton 
                  action="delete" 
                  resource="bookings"
                  className="text-red-600 hover:text-red-800"
                >
                  ลบ
                </PermissionButton>
              </div>
            </div>
          </div>
        </PermissionGuard>
      </div>

      {/* System Settings - เฉพาะ Admin */}
      <PermissionGuard 
        allowedRoles={['admin']}
        fallback={
          <div className="bg-gray-100 rounded-lg p-4 text-center text-gray-500">
            <p>การตั้งค่าระบบ - เฉพาะผู้ดูแลระบบ</p>
          </div>
        }
      >
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">การตั้งค่าระบบ</h2>
          <div className="grid grid-cols-2 gap-4">
            <button className="p-3 border rounded hover:bg-gray-50">
              ตั้งค่าการชำระเงิน
            </button>
            <button className="p-3 border rounded hover:bg-gray-50">
              จัดการประเภทห้อง
            </button>
            <button className="p-3 border rounded hover:bg-gray-50">
              ตั้งค่าอีเมล
            </button>
            <button className="p-3 border rounded hover:bg-gray-50">
              สำรองข้อมูล
            </button>
          </div>
        </div>
      </PermissionGuard>

      {/* Debug Information - แสดงสิทธิ์ปัจจุบัน */}
      <div className="mt-8 bg-gray-100 rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-2">ข้อมูลการดีบัก (สิทธิ์ปัจจุบัน)</h3>
        <PermissionSummaryDebug />
      </div>
    </div>
  );
}

// Component สำหรับแสดงข้อมูลสิทธิ์ (ใช้สำหรับดีบัก)
function PermissionSummaryDebug() {
  const { getPermissionSummary, user } = usePermissions();
  const summary = getPermissionSummary();

  if (!summary) {
    return <p className="text-sm text-gray-500">ไม่ได้เข้าสู่ระบบ</p>;
  }

  return (
    <div className="text-sm space-y-1">
      <p><strong>บทบาท:</strong> {summary.displayName} ({user.role})</p>
      <p><strong>อีเมล:</strong> {user.email}</p>
      <p><strong>เข้าถึงแอดมิน:</strong> {summary.permissions.adminAccess ? '✅' : '❌'}</p>
      <p><strong>จัดการผู้ใช้:</strong> {summary.permissions.userManagement ? '✅' : '❌'}</p>
      <p><strong>จัดการการจอง:</strong> 
        {summary.permissions.bookingEdit.all ? ' ✅ ทั้งหมด' : 
         summary.permissions.bookingEdit.own ? ' 🔸 ตัวเอง' : ' ❌'}
      </p>
      <p><strong>โหมดอ่านอย่างเดียว:</strong> {summary.isReadOnly ? '✅' : '❌'}</p>
    </div>
  );
}
