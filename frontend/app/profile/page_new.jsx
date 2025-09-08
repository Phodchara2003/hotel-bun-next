'use client';

import { useState, useEffect } from 'react';
import { User, Settings, Mail, Shield, Key, Bell, Save, Edit, X, ArrowLeft, Phone, MapPin, Calendar, Eye, EyeOff, Lock, Users, Star } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, updateUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Load user data when component mounts or user changes
  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];

      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFormData({
          firstName: data.profile.firstName || '',
          lastName: data.profile.lastName || '',
          phone: data.profile.phone || '',
          email: data.profile.email || '',
          address: data.profile.address || ''
        });
      } else {
        // Fallback to user data from context
        setFormData({
          firstName: user.first_name || user.firstName || '',
          lastName: user.last_name || user.lastName || '',
          phone: user.phone || '',
          email: user.email || '',
          address: user.address || ''
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      // Fallback to user data from context
      setFormData({
        firstName: user.first_name || user.firstName || '',
        lastName: user.last_name || user.lastName || '',
        phone: user.phone || '',
        email: user.email || '',
        address: user.address || ''
      });
    }
  };

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // Show message if no user
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">กรุณาเข้าสู่ระบบเพื่อดูโปรไฟล์</p>
        </div>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setSaving(true);
    setMessage({ type: '', content: '' });
    
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          profile: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            email: formData.email,
            address: formData.address
          }
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', content: 'อัปเดตโปรไฟล์สำเร็จ' });
        setIsEditing(false);
        // อัปเดตข้อมูลใน AuthContext
        updateUser({
          ...user,
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          email: formData.email,
          address: formData.address
        });
        toast.success('อัปเดตโปรไฟล์สำเร็จ');
      } else {
        setMessage({ type: 'error', content: data.error || 'ไม่สามารถอัปเดตโปรไฟล์ได้' });
        toast.error(data.error || 'ไม่สามารถอัปเดตโปรไฟล์ได้');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', content: 'เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์' });
      toast.error('เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', content: 'รหัสผ่านใหม่ไม่ตรงกัน' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', content: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' });
      return;
    }

    setSaving(true);
    setMessage({ type: '', content: '' });

    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];

      const response = await fetch('/api/change-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(passwordData)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', content: 'เปลี่ยนรหัสผ่านสำเร็จ' });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowPasswordForm(false);
        toast.success('เปลี่ยนรหัสผ่านสำเร็จ');
      } else {
        setMessage({ type: 'error', content: data.error || 'ไม่สามารถเปลี่ยนรหัสผ่านได้' });
        toast.error(data.error || 'ไม่สามารถเปลี่ยนรหัสผ่านได้');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setMessage({ type: 'error', content: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' });
      toast.error('เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
    } finally {
      setSaving(false);
    }
  };

  const getRoleInfo = (role) => {
    switch (role) {
      case 'admin':
        return { label: 'ผู้ดูแลระบบ', icon: Shield, color: 'text-red-600', bgColor: 'bg-red-50' };
      case 'staff':
        return { label: 'เจ้าหน้าที่', icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-50' };
      case 'customer':
        return { label: 'ลูกค้า', icon: User, color: 'text-green-600', bgColor: 'bg-green-50' };
      default:
        return { label: 'ผู้ใช้', icon: User, color: 'text-gray-600', bgColor: 'bg-gray-50' };
    }
  };

  const getBackLink = () => {
    if (user?.role === 'admin' || user?.role === 'staff') {
      return '/admin/dashboard';
    }
    return '/'; // หน้าหลักสำหรับลูกค้า
  };

  const roleInfo = getRoleInfo(user?.role);
  const IconComponent = roleInfo.icon;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Back Button */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link 
              href={getBackLink()}
              className="inline-flex items-center text-gray-600 hover:text-gray-900 mr-4"
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              กลับ
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">โปรไฟล์ของฉัน</h1>
          <p className="mt-2 text-gray-600">จัดการข้อมูลส่วนตัวและรหัสผ่าน</p>
        </div>

        {/* Message Alert */}
        {message.content && (
          <div className={`mb-6 p-4 rounded-md ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <p className={`text-sm ${
              message.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {message.content}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Form */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    ข้อมูลส่วนตัว
                  </h3>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    {isEditing ? 'ยกเลิก' : 'แก้ไข'}
                  </button>
                </div>
              </div>
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อ</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">นามสกุล</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">อีเมล</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">เบอร์โทรศัพท์</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">ที่อยู่</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <textarea
                      name="address"
                      rows={3}
                      value={formData.address}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="mt-8 flex justify-end space-x-3">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Info */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">ข้อมูลบัญชี</h3>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <Mail className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">อีเมล:</span>
                  <span className="ml-2 font-medium">{user?.email}</span>
                </div>
                <div className="flex items-center text-sm">
                  <IconComponent className={`h-4 w-4 mr-2 ${roleInfo.color}`} />
                  <span className="text-gray-600">สถานะ:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${roleInfo.color} ${roleInfo.bgColor}`}>
                    {roleInfo.label}
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">เข้าร่วมเมื่อ:</span>
                  <span className="ml-2 font-medium">{user?.created_at ? new Date(user.created_at).toLocaleDateString('th-TH') : '-'}</span>
                </div>
              </div>
            </div>

            {/* Change Password */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Lock className="h-5 w-5 mr-2" />
                เปลี่ยนรหัสผ่าน
              </h3>
              
              {!showPasswordForm ? (
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  เปลี่ยนรหัสผ่าน
                </button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">รหัสผ่านปัจจุบัน</label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="w-full pr-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">รหัสผ่านใหม่</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full pr-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ยืนยันรหัสผ่านใหม่</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full pr-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={handleChangePassword}
                      disabled={saving}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {saving ? 'กำลังเปลี่ยน...' : 'เปลี่ยนรหัสผ่าน'}
                    </button>
                    <button
                      onClick={() => {
                        setShowPasswordForm(false);
                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions for Admin/Staff */}
            {(user?.role === 'admin' || user?.role === 'staff') && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">การดำเนินการด่วน</h3>
                <div className="space-y-3">
                  <Link 
                    href="/admin/dashboard"
                    className="block w-full px-4 py-2 text-center bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                  >
                    กลับไปหน้า Dashboard
                  </Link>
                  {user?.role === 'admin' && (
                    <Link 
                      href="/admin/user-management"
                      className="block w-full px-4 py-2 text-center border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50"
                    >
                      จัดการผู้ใช้
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
