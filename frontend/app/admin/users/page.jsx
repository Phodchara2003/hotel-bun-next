'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { usersAPI } from '../../../lib/api';
import { isStaffOrAdmin, canEdit, canDelete, canCreate, isReadOnly } from '../../../lib/roles';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  X, 
  Save,
  User,
  Users,
  Crown,
  Shield,
  Search,
  Filter,
  Calendar,
  Mail,
  Phone,
  UserCheck,
  UserX
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function UsersManagement() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add', 'edit', 'view'
  const [selectedUser, setSelectedUser] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    role: ''
  });
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'user'
  });

  // User roles
  const userRoles = [
    { value: 'user', label: 'ผู้ใช้งาน', icon: User },
    { value: 'staff', label: 'พนักงาน', icon: Users },
    { value: 'admin', label: 'ผู้ดูแลระบบ', icon: Crown }
  ];

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (isAuthenticated && isStaffOrAdmin(user)) {
      fetchUsers();
    } else if (isAuthenticated && !isStaffOrAdmin(user)) {
      toast.error('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
    } else if (!isAuthenticated) {
      toast.error('กรุณาเข้าสู่ระบบก่อน');
    }
  }, [isAuthenticated, user, authLoading, pagination.page, filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.search && { search: filters.search }),
        ...(filters.role && { role: filters.role })
      };
      
      const data = await usersAPI.getAllUsers(params);
      setUsers(data.users || []);
      setPagination(prev => ({
        ...prev,
        ...data.pagination
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      if (error.response?.status === 401) {
        toast.error('กรุณาเข้าสู่ระบบใหม่');
      } else {
        toast.error('ไม่สามารถโหลดข้อมูลผู้ใช้ได้');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (type, userData = null) => {
    setModalType(type);
    setSelectedUser(userData);
    
    if (type === 'add') {
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        role: 'user'
      });
    } else if (type === 'edit' && userData) {
      setFormData({
        email: userData.email,
        password: '', // Don't pre-fill password
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone || '',
        role: userData.role
      });
    }
    
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      role: 'user'
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (modalType === 'add') {
        await usersAPI.createUser(formData);
        toast.success('เพิ่มผู้ใช้สำเร็จ');
      } else if (modalType === 'edit') {
        const updateData = { ...formData };
        // Remove password if empty
        if (!updateData.password) {
          delete updateData.password;
        }
        await usersAPI.updateUser(selectedUser.id, updateData);
        toast.success('แก้ไขข้อมูลผู้ใช้สำเร็จ');
      }
      
      handleCloseModal();
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      const message = error.response?.data?.error || 'เกิดข้อผิดพลาด';
      toast.error(message);
    }
  };

  const handleDelete = async (userId, userName) => {
    if (!confirm(`คุณต้องการลบผู้ใช้ "${userName}" หรือไม่?`)) {
      return;
    }

    try {
      await usersAPI.deleteUser(userId);
      toast.success('ลบผู้ใช้สำเร็จ');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      const message = error.response?.data?.error || 'ไม่สามารถลบผู้ใช้ได้';
      toast.error(message);
    }
  };

  const handleToggleRole = async (userId, currentRole, userName) => {
    // Cycle through roles: user -> staff -> admin -> user
    let newRole;
    let roleText;
    
    switch (currentRole) {
      case 'user':
        newRole = 'staff';
        roleText = 'พนักงาน';
        break;
      case 'staff':
        newRole = 'admin';
        roleText = 'ผู้ดูแลระบบ';
        break;
      case 'admin':
        newRole = 'user';
        roleText = 'ผู้ใช้งาน';
        break;
      default:
        newRole = 'user';
        roleText = 'ผู้ใช้งาน';
    }
    
    if (!confirm(`คุณต้องการเปลี่ยนสิทธิ์ของ "${userName}" เป็น "${roleText}" หรือไม่?`)) {
      return;
    }

    try {
      await usersAPI.updateUserRole(userId, newRole);
      toast.success(`เปลี่ยนสิทธิ์ผู้ใช้เป็น "${roleText}" สำเร็จ`);
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user role:', error);
      const message = error.response?.data?.error || 'ไม่สามารถเปลี่ยนสิทธิ์ผู้ใช้ได้';
      toast.error(message);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getRoleIcon = (role) => {
    const roleConfig = userRoles.find(r => r.value === role);
    return roleConfig ? roleConfig.icon : User;
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'text-purple-600 bg-purple-100';
      case 'user':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">กรุณาเข้าสู่ระบบ</h2>
          <p className="text-gray-600">เพื่อเข้าถึงระบบจัดการ</p>
        </div>
      </div>
    );
  }

  if (!isStaffOrAdmin(user)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">ไม่มีสิทธิ์เข้าถึง</h2>
          <p className="text-gray-600">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto container-padding">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">จัดการสมาชิก</h1>
              <p className="text-gray-600">
                {isReadOnly(user) ? 'ดูข้อมูลสมาชิกของระบบ' : 'เพิ่ม แก้ไข และจัดการสมาชิกของระบบ'}
              </p>
            </div>
            {canCreate(user) && (
              <button
                onClick={() => handleOpenModal('add')}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>เพิ่มสมาชิกใหม่</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  name="search"
                  placeholder="🔍 ค้นหาด้วยชื่อ, นามสกุล หรืออีเมล..."
                  value={filters.search}
                  onChange={handleFilterChange}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {filters.search && (
                  <button
                    onClick={() => handleFilterChange({ target: { name: 'search', value: '' } })}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <select
                name="role"
                value={filters.role}
                onChange={handleFilterChange}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">ทุกสิทธิ์</option>
                <option value="user">ผู้ใช้งาน</option>
                <option value="admin">ผู้ดูแลระบบ</option>
              </select>
            </div>
          </div>
          
          {/* Search Results Info */}
          {(filters.search || filters.role) && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                🔍 ผลการค้นหา: พบ <span className="font-semibold">{pagination.total}</span> รายการ
                {filters.search && (
                  <span> สำหรับ "<span className="font-semibold">{filters.search}</span>"</span>
                )}
                {filters.role && (
                  <span> ในกลุ่ม "<span className="font-semibold">
                    {filters.role === 'admin' ? 'ผู้ดูแลระบบ' : filters.role === 'user' ? 'ผู้ใช้งาน' : filters.role}
                  </span>"</span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">กำลังโหลดข้อมูล...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">ไม่พบข้อมูลสมาชิก</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        สมาชิก
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ติดต่อ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        สิทธิ์
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        วันที่สมัคร
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        การจัดการ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((userData) => {
                      const RoleIcon = getRoleIcon(userData.role);
                      return (
                        <tr key={userData.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                  <User className="h-5 w-5 text-primary-600" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {userData.fullName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  ID: {userData.id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 flex items-center">
                              <Mail className="h-4 w-4 mr-2 text-gray-400" />
                              {userData.email}
                            </div>
                            {userData.phone && (
                              <div className="text-sm text-gray-500 flex items-center mt-1">
                                <Phone className="h-4 w-4 mr-2 text-gray-400" />
                                {userData.phone}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(userData.role)}`}>
                              <RoleIcon className="h-3 w-3 mr-1" />
                              {userRoles.find(r => r.value === userData.role)?.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                              {new Date(userData.createdAt).toLocaleDateString('th-TH')}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => handleOpenModal('view', userData)}
                                className="text-blue-600 hover:text-blue-900 p-1"
                                title="ดูรายละเอียด"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              {canEdit(user) && (
                                <button
                                  onClick={() => handleOpenModal('edit', userData)}
                                  className="text-green-600 hover:text-green-900 p-1"
                                  title="แก้ไข"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              )}
                              {canEdit(user) && (
                                <button
                                  onClick={() => handleToggleRole(userData.id, userData.role, userData.fullName)}
                                  className="text-purple-600 hover:text-purple-900 p-1"
                                  title="เปลี่ยนสิทธิ์"
                                >
                                  {userData.role === 'admin' ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                                </button>
                              )}
                              {canDelete(user) && (
                                <button
                                  onClick={() => handleDelete(userData.id, userData.fullName)}
                                  className="text-red-600 hover:text-red-900 p-1"
                                  title="ลบ"
                                  disabled={userData.id === user.id}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                      disabled={pagination.page === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      ก่อนหน้า
                    </button>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                      disabled={pagination.page === pagination.totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      ถัดไป
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        แสดง <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> ถึง{' '}
                        <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> จาก{' '}
                        <span className="font-medium">{pagination.total}</span> รายการ
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                          disabled={pagination.page === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          ก่อนหน้า
                        </button>
                        {[...Array(Math.min(5, pagination.totalPages))].map((_, index) => {
                          const pageNumber = index + Math.max(1, pagination.page - 2);
                          if (pageNumber > pagination.totalPages) return null;
                          return (
                            <button
                              key={pageNumber}
                              onClick={() => setPagination(prev => ({ ...prev, page: pageNumber }))}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                pageNumber === pagination.page
                                  ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              {pageNumber}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                          disabled={pagination.page === pagination.totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          ถัดไป
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {modalType === 'add' && 'เพิ่มสมาชิกใหม่'}
                  {modalType === 'edit' && 'แก้ไขข้อมูลสมาชิก'}
                  {modalType === 'view' && 'รายละเอียดสมาชิก'}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {modalType === 'view' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
                      <p className="text-sm text-gray-900">{selectedUser?.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ-นามสกุล</label>
                      <p className="text-sm text-gray-900">{selectedUser?.fullName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรศัพท์</label>
                      <p className="text-sm text-gray-900">{selectedUser?.phone || 'ไม่ระบุ'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">สิทธิ์</label>
                      <p className="text-sm text-gray-900">
                        {userRoles.find(r => r.value === selectedUser?.role)?.label}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">วันที่สมัคร</label>
                      <p className="text-sm text-gray-900">
                        {selectedUser?.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('th-TH') : '-'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">แก้ไขล่าสุด</label>
                      <p className="text-sm text-gray-900">
                        {selectedUser?.updatedAt ? new Date(selectedUser.updatedAt).toLocaleDateString('th-TH') : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        อีเมล *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                        รหัสผ่าน {modalType === 'add' ? '*' : '(เว้นว่างหากไม่ต้องการเปลี่ยน)'}
                      </label>
                      <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required={modalType === 'add'}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                        ชื่อ *
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                        นามสกุล *
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                        เบอร์โทรศัพท์
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                        สิทธิ์ *
                      </label>
                      <select
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        {userRoles.map(role => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="btn-secondary"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="btn-primary flex items-center space-x-2"
                    >
                      <Save className="h-4 w-4" />
                      <span>{modalType === 'add' ? 'เพิ่มสมาชิก' : 'บันทึกการแก้ไข'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
