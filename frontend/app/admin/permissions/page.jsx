'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { permissionsAPI } from '../../../lib/api';
import toast from 'react-hot-toast';

const PERMISSION_CATEGORIES = {
  'rooms': { name: 'การจัดการห้องพัก', icon: '🏨', color: 'bg-blue-50 border-blue-200' },
  'bookings': { name: 'การจัดการการจอง', icon: '📅', color: 'bg-green-50 border-green-200' },
  'users': { name: 'การจัดการผู้ใช้', icon: '👥', color: 'bg-purple-50 border-purple-200' },
  'reports': { name: 'รายงาน', icon: '📊', color: 'bg-orange-50 border-orange-200' },
  'payments': { name: 'การเงิน', icon: '💰', color: 'bg-yellow-50 border-yellow-200' },
  'settings': { name: 'การตั้งค่า', icon: '⚙️', color: 'bg-gray-50 border-gray-200' },
  'notifications': { name: 'การแจ้งเตือน', icon: '🔔', color: 'bg-red-50 border-red-200' },
  'reviews': { name: 'รีวิว', icon: '⭐', color: 'bg-pink-50 border-pink-200' }
};

export default function UserPermissionsPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [permissions, setPermissions] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ดึงข้อมูลผู้ใช้ทั้งหมด
  const fetchUsers = async () => {
    try {
      const response = await permissionsAPI.getUsersWithPermissions();
      setUsers(response.users);
      setFilteredUsers(response.users);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้');
    }
  };

  // ดึงข้อมูลสิทธิ์ทั้งหมด
  const fetchPermissions = async () => {
    try {
      const response = await permissionsAPI.getAllPermissions();
      setPermissions(response.permissions);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast.error('เกิดข้อผิดพลาดในการดึงข้อมูลสิทธิ์');
    }
  };

  // ดึงสิทธิ์ของผู้ใช้คนหนึ่ง
  const fetchUserPermissions = async (userId) => {
    try {
      const response = await permissionsAPI.getUserPermissions(userId);
      setUserPermissions(response.permissions);
      
      // ตั้งค่าสิทธิ์ที่เลือกไว้
      const grantedPermissions = new Set(
        response.permissions
          .filter(p => p.granted_at)
          .map(p => p.id)
      );
      setSelectedPermissions(grantedPermissions);
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      toast.error('เกิดข้อผิดพลาดในการดึงข้อมูลสิทธิ์ผู้ใช้');
    }
  };

  // ฟังก์ชันค้นหา User
  const handleSearchUsers = (term) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.first_name?.toLowerCase().includes(term.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(term.toLowerCase()) ||
        user.email?.toLowerCase().includes(term.toLowerCase()) ||
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  };

  // อัปเดตสิทธิ์ผู้ใช้
  const updateUserPermissions = async () => {
    if (!selectedUser) return;

    setSaving(true);
    try {
      await permissionsAPI.updateUserPermissions(selectedUser.id, Array.from(selectedPermissions));
      
      toast.success('อัปเดตสิทธิ์ผู้ใช้เรียบร้อยแล้ว');
      await fetchUsers(); // รีเฟรชข้อมูลผู้ใช้
    } catch (error) {
      console.error('Error updating permissions:', error);
      toast.error(error.response?.data?.error || 'เกิดข้อผิดพลาดในการอัปเดตสิทธิ์');
    } finally {
      setSaving(false);
    }
  };

  // จัดกลุ่มสิทธิ์ตามหมวดหมู่
  const groupedPermissions = userPermissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {});

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchUsers(), fetchPermissions()]);
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchUserPermissions(selectedUser.id);
    }
  }, [selectedUser]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">จัดการสิทธิ์ผู้ใช้</h1>
        <p className="text-gray-600 mt-2">กำหนดสิทธิ์ในการใช้งานระบบให้กับผู้ใช้แต่ละคน</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* รายชื่อผู้ใช้ */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow border">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">รายชื่อผู้ใช้</h2>
              {/* Search Box */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="🔍 ค้นหาชื่อ, นามสกุล หรืออีเมล..."
                  value={searchTerm}
                  onChange={(e) => handleSearchUsers(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {searchTerm && (
                  <button
                    onClick={() => handleSearchUsers('')}
                    className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                  >
                    ✖️
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                แสดง {filteredUsers.length} จาก {users.length} ผู้ใช้
              </p>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="text-4xl mb-2">🔍</div>
                  <p>ไม่พบผู้ใช้ที่ตรงกับคำค้นหา</p>
                  <p className="text-sm mt-1">"{searchTerm}"</p>
                </div>
              ) : (
                filteredUsers.map((userItem) => (
                  <div
                    key={userItem.id}
                    onClick={() => setSelectedUser(userItem)}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedUser?.id === userItem.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {userItem.first_name} {userItem.last_name}
                        </p>
                        <p className="text-sm text-gray-600">{userItem.email}</p>
                        <div className="flex items-center mt-1">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            userItem.role === 'super_admin' ? 'bg-red-100 text-red-800' :
                            userItem.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                            userItem.role === 'staff' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {userItem.role === 'super_admin' ? 'Super Admin' :
                             userItem.role === 'admin' ? 'Admin' :
                             userItem.role === 'staff' ? 'Staff' : 'User'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">{userItem.permission_count} สิทธิ์</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* จัดการสิทธิ์ */}
        <div className="lg:col-span-2">
          {selectedUser ? (
            <div className="bg-white rounded-lg shadow border">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      จัดการสิทธิ์: {selectedUser.first_name} {selectedUser.last_name}
                    </h2>
                    <p className="text-sm text-gray-600">{selectedUser.email}</p>
                  </div>
                  <button
                    onClick={updateUserPermissions}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-6">
                {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => {
                  const categoryInfo = PERMISSION_CATEGORIES[category] || { 
                    name: category, 
                    icon: '📋', 
                    color: 'bg-gray-50 border-gray-200' 
                  };

                  return (
                    <div key={category} className={`rounded-lg border p-4 ${categoryInfo.color}`}>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <span className="mr-2">{categoryInfo.icon}</span>
                        {categoryInfo.name}
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {categoryPermissions.map((permission) => (
                          <label
                            key={permission.id}
                            className="flex items-center space-x-3 p-3 bg-white rounded-lg border cursor-pointer hover:bg-gray-50"
                          >
                            <input
                              type="checkbox"
                              checked={selectedPermissions.has(permission.id)}
                              onChange={(e) => {
                                const newSelected = new Set(selectedPermissions);
                                if (e.target.checked) {
                                  newSelected.add(permission.id);
                                } else {
                                  newSelected.delete(permission.id);
                                }
                                setSelectedPermissions(newSelected);
                              }}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{permission.description}</p>
                              <p className="text-xs text-gray-500">{permission.name}</p>
                              {permission.granted_at && (
                                <p className="text-xs text-green-600">
                                  ได้รับสิทธิ์: {new Date(permission.granted_at).toLocaleDateString('th-TH')}
                                  {permission.granted_by_name && ` โดย ${permission.granted_by_name}`}
                                </p>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow border">
              <div className="p-12 text-center">
                <div className="text-6xl mb-4">👥</div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">เลือกผู้ใช้เพื่อจัดการสิทธิ์</h2>
                <p className="text-gray-600">คลิกที่ชื่อผู้ใช้ทางซ้ายเพื่อเริ่มจัดการสิทธิ์</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
