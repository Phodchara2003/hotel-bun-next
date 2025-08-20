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
    <div className="min-h-screen dark-bg py-8">
      <div className="max-w-7xl mx-auto container-padding">
        {/* Header */}
        <div className="mb-12 animate-slideUp">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold dark-text mb-3 tracking-tight">จัดการผู้ใช้งาน</h1>
              <p className="text-lg dark-text-secondary">
                {isReadOnly(user) ? 'ดูข้อมูลผู้ใช้งานในระบบ' : 'เพิ่ม แก้ไข และจัดการผู้ใช้งานในระบบ'}
              </p>
            </div>
            {canCreate(user) && (
              <button
                onClick={() => handleOpenModal('add')}
                className="btn-primary flex items-center space-x-2 shadow-lg hover-lift"
              >
                <Plus className="h-5 w-5" />
                <span>เพิ่มผู้ใช้งาน</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card-elevated p-6 bg-gradient-to-br from-primary-500 to-primary-600 text-white animate-slideUp">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium opacity-90">ผู้ใช้งานทั้งหมด</h3>
                <p className="text-3xl font-bold mt-1">{pagination.total}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="card-elevated p-6 bg-gradient-to-br from-accent-500 to-accent-600 text-white animate-slideUp stagger-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium opacity-90">ผู้ดูแลระบบ</h3>
                <p className="text-3xl font-bold mt-1">{users.filter(u => u.role === 'admin').length}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Crown className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="card-elevated p-6 bg-gradient-to-br from-secondary-500 to-secondary-600 text-white animate-slideUp stagger-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium opacity-90">พนักงาน</h3>
                <p className="text-3xl font-bold mt-1">{users.filter(u => u.role === 'staff').length}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="card-elevated p-6 bg-gradient-to-br from-success-500 to-success-600 text-white animate-slideUp stagger-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium opacity-90">ลูกค้า</h3>
                <p className="text-3xl font-bold mt-1">{users.filter(u => u.role === 'user').length}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <User className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card-elevated p-8 mb-8 animate-slideUp">
          <h2 className="text-xl font-semibold dark-text mb-6 flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center mr-3">
              <Filter className="h-4 w-4 text-white" />
            </div>
            ค้นหาและกรองข้อมูล
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium dark-text-secondary mb-2">
                ค้นหา
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  name="search"
                  placeholder="ชื่อ, อีเมล, เบอร์โทร..."
                  value={filters.search}
                  onChange={handleFilterChange}
                  className="pl-10 input-field"
                />
              </div>
            </div>
            
            {/* Role Filter */}
            <div>
              <label className="block text-sm font-medium dark-text-secondary mb-2">
                ระดับการเข้าถึง
              </label>
              <select
                name="role"
                value={filters.role}
                onChange={handleFilterChange}
                className="input-field"
              >
                <option value="">ทั้งหมด</option>
                {userRoles.map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex justify-between items-center">
            <span className="text-sm dark-text-muted">
              แสดงผล {users.length} จาก {pagination.total} ผู้ใช้งาน
            </span>
            <button
              onClick={() => setFilters({ search: '', role: '' })}
              className="btn-secondary text-sm"
            >
              ล้างตัวกรอง
            </button>
          </div>
        </div>

        {/* Users Grid */}
        <div className="animate-slideUp stagger-2">
          {loading ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="dark-text-secondary">กำลังโหลดข้อมูล...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-16">
              <Users className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold dark-text-secondary mb-2">ไม่พบข้อมูลผู้ใช้งาน</h3>
              <p className="dark-text-muted mb-6">
                {filters.search || filters.role 
                  ? 'ลองปรับเปลี่ยนเงื่อนไขการค้นหา' 
                  : 'เริ่มต้นด้วยการเพิ่มผู้ใช้งานคนแรก'
                }
              </p>
              {canCreate(user) && (
                <button
                  onClick={() => handleOpenModal('add')}
                  className="btn-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  เพิ่มผู้ใช้งาน
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.map((userData, index) => {
                const RoleIcon = getRoleIcon(userData.role);
                const roleConfig = userRoles.find(r => r.value === userData.role);
                
                return (
                  <div 
                    key={userData.id} 
                    className={`card-elevated group hover-lift transition-all duration-300 animate-slideUp`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* User Header */}
                    <div className="p-6 border-b dark-border">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                            <User className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold dark-text group-hover:text-primary-600 transition-colors">
                              {userData.fullName}
                            </h3>
                            <p className="text-sm dark-text-muted">ID: {userData.id}</p>
                          </div>
                        </div>
                        
                        {/* Role Badge */}
                        <div className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center space-x-1 ${
                          userData.role === 'admin' 
                            ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-white'
                            : userData.role === 'staff'
                            ? 'bg-gradient-to-r from-secondary-500 to-secondary-600 text-white'
                            : 'status-info'
                        }`}>
                          <RoleIcon className="h-3 w-3" />
                          <span>{roleConfig?.label}</span>
                        </div>
                      </div>
                    </div>

                    {/* User Details */}
                    <div className="p-6 space-y-4">
                      {/* Contact Info */}
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                            <Mail className="h-4 w-4 text-primary-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm dark-text-muted">อีเมล</p>
                            <p className="text-sm dark-text font-medium truncate">{userData.email}</p>
                          </div>
                        </div>

                        {userData.phone && (
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center">
                              <Phone className="h-4 w-4 text-success-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm dark-text-muted">เบอร์โทร</p>
                              <p className="text-sm dark-text font-medium">{userData.phone}</p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center">
                            <Calendar className="h-4 w-4 text-neutral-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm dark-text-muted">วันที่สมัคร</p>
                            <p className="text-sm dark-text font-medium">
                              {new Date(userData.createdAt).toLocaleDateString('th-TH', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-between items-center pt-4 border-t dark-border">
                        <button
                          onClick={() => handleOpenModal('view', userData)}
                          className="btn-ghost text-sm flex items-center"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          ดูรายละเอียด
                        </button>
                        
                        <div className="flex space-x-2">
                          {canEdit(user) && (
                            <button
                              onClick={() => handleOpenModal('edit', userData)}
                              className="p-2 text-warning-600 hover:bg-warning-50 rounded-lg transition-colors"
                              title="แก้ไข"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                          {userData.role !== 'admin' && canEdit(user) && (
                            <button
                              onClick={() => handleToggleRole(userData.id, userData.role, userData.fullName)}
                              className="p-2 text-secondary-600 hover:bg-secondary-50 rounded-lg transition-colors"
                              title="เปลี่ยนสิทธิ์"
                            >
                              <UserCheck className="h-4 w-4" />
                            </button>
                          )}
                          {canDelete(user) && userData.id !== user?.id && (
                            <button
                              onClick={() => handleDelete(userData.id, userData.fullName)}
                              className="p-2 text-error-600 hover:bg-error-50 rounded-lg transition-colors"
                              title="ลบ"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="card-elevated p-6 mt-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm dark-text-muted">
                  แสดงผล <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> ถึง{' '}
                  <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> จาก{' '}
                  <span className="font-medium">{pagination.total}</span> รายการ
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ก่อนหน้า
                </button>
                
                <div className="flex items-center space-x-1">
                  {[...Array(Math.min(5, pagination.totalPages))].map((_, index) => {
                    const pageNumber = index + Math.max(1, pagination.page - 2);
                    if (pageNumber > pagination.totalPages) return null;
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setPagination(prev => ({ ...prev, page: pageNumber }))}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          pageNumber === pagination.page
                            ? 'bg-primary-600 text-white'
                            : 'hover:bg-neutral-100 dark-text'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ถัดไป
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
