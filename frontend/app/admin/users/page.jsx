'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { usersAPI } from '../../../lib/api';
import Cookies from 'js-cookie';
import Link from 'next/link';
import { 
  Users, 
  Plus,
  Edit,
  Trash2,
  Mail,
  Phone,
  Search,
  Filter,
  RefreshCw,
  ArrowLeft,
  Settings,
  Activity
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function UsersManagementPage() {
  const { user: currentUser, isAuthenticated, canManageUsers } = useAuth();
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    newUsersThisMonth: 0,
    activeUsers: 0,
    adminUsers: 0,
    managerUsers: 0,
    staffUsers: 0,
    guestUsers: 0,
    regularUsers: 0
  });

  // Define fetchUsers with useCallback
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching users data...');
      
      const token = Cookies.get('auth_token');
      if (!token) {
        toast.error('ไม่พบ token การเข้าสู่ระบบ');
        return;
      }

      const response = await usersAPI.getUsers();
      console.log('👥 Users API Response:', response);
      
      if (response?.users) {
        const processedUsers = response.users.map(user => ({
          ...user,
          name: user.first_name && user.last_name ? 
            `${user.first_name} ${user.last_name}` : 
            user.first_name || user.last_name || user.email || 'ไม่ระบุชื่อ'
        }));
        
        setAllUsers(processedUsers);
        console.log('✅ Users loaded:', processedUsers.length);
        
        // Calculate user statistics
        const totalUsers = processedUsers.length;
        const adminUsers = processedUsers.filter(u => u.role === 'admin' || u.role === 'super_admin').length;
        const managerUsers = processedUsers.filter(u => u.role === 'manager').length;
        const staffUsers = processedUsers.filter(u => u.role === 'staff').length;
        const guestUsers = processedUsers.filter(u => u.role === 'guest').length;
        const regularUsers = processedUsers.filter(u => u.role === 'user' || !u.role).length;
        const newUsersThisMonth = processedUsers.filter(u => {
          const createdDate = new Date(u.created_at);
          const thisMonth = new Date();
          return createdDate.getMonth() === thisMonth.getMonth() && 
                 createdDate.getFullYear() === thisMonth.getFullYear();
        }).length;

        setUserStats({
          totalUsers,
          newUsersThisMonth,
          activeUsers: totalUsers,
          adminUsers,
          managerUsers,
          staffUsers,
          guestUsers,
          regularUsers
        });

        // Remove toast.success to prevent duplicate notifications
        console.log(`✅ โหลดข้อมูลผู้ใช้สำเร็จ (${totalUsers} คน)`);
      }
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      toast.error('ไม่สามารถโหลดข้อมูลผู้ใช้ได้');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && canManageUsers()) {
      fetchUsers();
    }
  }, [isAuthenticated, canManageUsers]); // Remove fetchUsers from dependency array

  // CRUD Functions
  const handleCreateUser = async (userData) => {
    try {
      setLoading(true);
      const response = await usersAPI.createUser(userData);
      if (response?.success) {
        toast.success('เพิ่มผู้ใช้สำเร็จ');
        await fetchUsers();
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('ไม่สามารถเพิ่มผู้ใช้ได้');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (userData) => {
    setEditingUser(userData);
    setShowEditModal(true);
  };

  const handleUpdateUser = async (updatedData) => {
    try {
      setLoading(true);
      const response = await usersAPI.updateUser(editingUser.id, updatedData);
      if (response?.success) {
        toast.success('อัปเดตผู้ใช้สำเร็จ');
        await fetchUsers();
        setShowEditModal(false);
        setEditingUser(null);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('ไม่สามารถอัปเดตผู้ใช้ได้');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบผู้ใช้ "${userName}"?`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await usersAPI.deleteUser(userId);
      if (response?.success) {
        toast.success('ลบผู้ใช้สำเร็จ');
        await fetchUsers();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('ไม่สามารถลบผู้ใช้ได้');
    } finally {
      setLoading(false);
    }
  };



  const handleSendEmail = (userData) => {
    const subject = encodeURIComponent('ข้อความจากระบบจองโรงแรม');
    const body = encodeURIComponent(`สวัสดี ${userData.name},\n\nข้อความจากระบบจองโรงแรม...\n\nขอบคุณ`);
    window.open(`mailto:${userData.email}?subject=${subject}&body=${body}`);
  };

  // Filter users
  const filteredUsers = allUsers.filter(u => {
    const matchesSearch = !searchTerm || 
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const getUserRoleDisplay = (role) => {
    switch (role) {
      case 'admin':
      case 'super_admin':
        return { text: 'ผู้ดูแลระบบ', color: 'bg-red-100 text-red-800' };
      case 'manager':
        return { text: 'ผู้บริหาร', color: 'bg-purple-100 text-purple-800' };
      case 'staff':
        return { text: 'พนักงาน', color: 'bg-blue-100 text-blue-800' };
      case 'guest':
        return { text: 'ลูกค้า', color: 'bg-green-100 text-green-800' };
      case 'user':
      default:
        return { text: 'ผู้ใช้ทั่วไป', color: 'bg-gray-100 text-gray-800' };
    }
  };

  if (!isAuthenticated || !canManageUsers()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">ไม่มีสิทธิ์เข้าถึง</h1>
          <p className="text-gray-600 mb-4">คุณต้องเป็น Admin เท่านั้น</p>
          <Link href="/login" className="text-blue-600 hover:text-blue-700">
            เข้าสู่ระบบ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link 
                href="/admin/dashboard"
                className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <Users className="h-8 w-8 mr-3 text-blue-600" />
                  จัดการผู้ใช้งาน
                </h1>
                <p className="text-gray-600 mt-1">จัดการข้อมูลผู้ใช้ในระบบ</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              ผู้ใช้: {currentUser?.first_name} {currentUser?.last_name} ({currentUser?.role})
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">ผู้ใช้ทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.totalUsers}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Settings className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">ผู้ดูแลระบบ</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.adminUsers}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">ผู้บริหาร</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.managerUsers}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">พนักงาน</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.staffUsers}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">ลูกค้า</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.guestUsers}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="ค้นหาผู้ใช้ (ชื่อ, อีเมล)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">บทบาททั้งหมด</option>
                  <option value="guest">ลูกค้า</option>
                  <option value="user">ผู้ใช้ทั่วไป</option>
                  <option value="staff">พนักงาน</option>
                  <option value="manager">ผู้บริหาร</option>
                  <option value="admin">ผู้ดูแลระบบ</option>
                  <option value="super_admin">ผู้ดูแลระบบสูงสุด</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fetchUsers()}
                disabled={loading}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 flex items-center disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                รีเฟรช
              </button>
              {canManageUsers() && (
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  เพิ่มผู้ใช้
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              รายชื่อผู้ใช้ ({filteredUsers.length} คน)
            </h3>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">กำลังโหลดข้อมูล...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">ไม่พบข้อมูลผู้ใช้</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || roleFilter !== 'all' ? 'ลองค้นหาด้วยคำอื่น' : 'เริ่มต้นด้วยการเพิ่มผู้ใช้ใหม่'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ผู้ใช้
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      บทบาท
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ติดต่อ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      วันที่สมัคร
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      การดำเนินการ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => {
                    const roleDisplay = getUserRoleDisplay(user.role);
                    return (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <Users className="h-5 w-5 text-gray-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${roleDisplay.color}`}>
                            {roleDisplay.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex flex-col gap-1">
                            {user.phone && (
                              <div className="flex items-center">
                                <Phone className="h-4 w-4 mr-1" />
                                {user.phone}
                              </div>
                            )}
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-1" />
                              {user.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString('th-TH') : 'ไม่ระบุ'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            {canManageUsers() && (
                              <button
                                onClick={() => handleEditUser(user)}
                                className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                                title="แก้ไข"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                            )}
                            {canManageUsers() && (
                              <button
                                onClick={() => handleDeleteUser(user.id, user.name)}
                                className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                                title="ลบ"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleSendEmail(user)}
                              className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded"
                              title="ส่งอีเมล"
                            >
                              <Mail className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* User Modals */}
      <UserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateUser}
        title="เพิ่มผู้ใช้ใหม่"
      />

      <UserModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingUser(null);
        }}
        user={editingUser}
        onSave={handleUpdateUser}
        title="แก้ไขข้อมูลผู้ใช้"
      />
    </div>
  );
}

// User Modal Component
function UserModal({ isOpen, onClose, user = null, onSave, title }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: 'guest',
    first_name: '',
    last_name: '',
    phone: '',
    password: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || user.email || '',
        email: user.email || '',
        role: user.role || 'guest',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        password: ''
      });
    } else {
      setFormData({
        username: '',
        email: '',
        role: 'guest',
        first_name: '',
        last_name: '',
        phone: '',
        password: ''
      });
    }
  }, [user, isOpen]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ชื่อผู้ใช้
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              อีเมล
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อจริง
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                นามสกุล
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              เบอร์โทรศัพท์
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              บทบาท
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="guest">ลูกค้า</option>
              <option value="user">ผู้ใช้ทั่วไป</option>
              <option value="staff">พนักงาน</option>
              <option value="manager">ผู้บริหาร</option>
              <option value="admin">ผู้ดูแลระบบ</option>
            </select>
          </div>

          {!user && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                รหัสผ่าน
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required={!user}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              {user ? 'อัปเดต' : 'สร้าง'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
