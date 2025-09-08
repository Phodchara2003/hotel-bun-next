'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { usersAPI, authAPI } from '../../lib/api';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Save, 
  Eye,
  EyeOff,
  ArrowLeft,
  AlertCircle,
  MapPin
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, isAuthenticated, updateUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Profile form data
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: ''
  });

  // Password form data
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Form validation errors
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user) {
      setProfileData({
        firstName: user.firstName || user.first_name || '',
        lastName: user.lastName || user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || ''
      });
    }
  }, [user, isAuthenticated, router]);

  // Handle profile form changes
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle password form changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate profile form
  const validateProfileForm = () => {
    const newErrors = {};

    if (!profileData.firstName.trim()) {
      newErrors.firstName = 'กรุณากรอกชื่อ';
    }

    if (!profileData.lastName.trim()) {
      newErrors.lastName = 'กรุณากรอกนามสกุล';
    }

    if (!profileData.email.trim()) {
      newErrors.email = 'กรุณากรอกอีเมล';
    } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
      newErrors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    }

    if (profileData.phone && !/^[0-9]{10}$/.test(profileData.phone.replace(/[-\s]/g, ''))) {
      newErrors.phone = 'รูปแบบเบอร์โทรไม่ถูกต้อง (10 หลัก)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate password form
  const validatePasswordForm = () => {
    const newErrors = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'กรุณากรอกรหัสผ่านปัจจุบัน';
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = 'กรุณากรอกรหัสผ่านใหม่';
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
    }

    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = 'กรุณายืนยันรหัสผ่านใหม่';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'รหัสผ่านไม่ตรงกัน';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();

    if (!validateProfileForm()) {
      return;
    }

    try {
      setLoading(true);

      const updateData = {
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        email: profileData.email,
        phone: profileData.phone,
        address: profileData.address
      };

      const response = await usersAPI.updateProfile(updateData);

      if (response.success) {
        // Update user context
        updateUser({
          ...user,
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          email: profileData.email,
          phone: profileData.phone,
          address: profileData.address
        });

        toast.success('อัพเดทข้อมูลโปรไฟล์สำเร็จ');
      }

    } catch (error) {
      console.error('Error updating profile:', error);
      
      if (error.response?.status === 400) {
        toast.error('ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง');
      } else if (error.response?.status === 409) {
        toast.error('อีเมลนี้ถูกใช้งานแล้ว');
      } else {
        toast.error('ไม่สามารถอัพเดทข้อมูลได้ กรุณาลองใหม่');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle password change
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();

    if (!validatePasswordForm()) {
      return;
    }

    try {
      setLoading(true);

      const response = await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (response.success) {
        toast.success('เปลี่ยนรหัสผ่านสำเร็จ');
        
        // Reset password form
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }

    } catch (error) {
      console.error('Error changing password:', error);
      
      if (error.response?.status === 400) {
        toast.error('รหัสผ่านปัจจุบันไม่ถูกต้อง');
      } else {
        toast.error('ไม่สามารถเปลี่ยนรหัสผ่านได้ กรุณาลองใหม่');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link 
                href="/dashboard"
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">โปรไฟล์ของฉัน</h1>
                <p className="text-gray-600">จัดการข้อมูลส่วนตัวและการตั้งค่าบัญชี</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              {/* User Info */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold text-2xl mx-auto mb-4">
                  {(user.firstName || user.first_name || user.email)?.charAt(0)?.toUpperCase()}
                </div>
                <h3 className="text-lg font-medium text-gray-900">
                  {user.firstName || user.first_name} {user.lastName || user.last_name}
                </h3>
                <p className="text-sm text-gray-600 mb-2">{user.email}</p>
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                  ผู้ใช้ทั่วไป
                </span>
              </div>

              {/* Navigation Tabs */}
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'profile'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <User className="h-4 w-4 mr-3" />
                  ข้อมูลส่วนตัว
                </button>
                
                <button
                  onClick={() => setActiveTab('password')}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'password'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Lock className="h-4 w-4 mr-3" />
                  เปลี่ยนรหัสผ่าน
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'profile' && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">ข้อมูลส่วนตัว</h2>
                  <p className="text-sm text-gray-600">อัพเดทข้อมูลโปรไฟล์และข้อมูลติดต่อของคุณ</p>
                </div>

                <form onSubmit={handleProfileUpdate} className="p-6 space-y-6">
                  {/* Name Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                        <User className="h-4 w-4 inline mr-1" />
                        ชื่อ *
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={profileData.firstName}
                        onChange={handleProfileChange}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                          errors.firstName ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="กรอกชื่อของคุณ"
                      />
                      {errors.firstName && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.firstName}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                        <User className="h-4 w-4 inline mr-1" />
                        นามสกุล *
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={profileData.lastName}
                        onChange={handleProfileChange}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                          errors.lastName ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="กรอกนามสกุลของคุณ"
                      />
                      {errors.lastName && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.lastName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Email Field */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="h-4 w-4 inline mr-1" />
                      อีเมล *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleProfileChange}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="กรอกอีเมลของคุณ"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Phone Field */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="h-4 w-4 inline mr-1" />
                      เบอร์โทรศัพท์
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleProfileChange}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                        errors.phone ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="08X-XXX-XXXX"
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  {/* Address Field */}
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="h-4 w-4 inline mr-1" />
                      ที่อยู่
                    </label>
                    <textarea
                      id="address"
                      name="address"
                      value={profileData.address}
                      onChange={handleProfileChange}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="ที่อยู่ของคุณ"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end pt-6 border-t border-gray-200">
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          กำลังบันทึก...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          บันทึกการเปลี่ยนแปลง
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'password' && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">เปลี่ยนรหัสผ่าน</h2>
                  <p className="text-sm text-gray-600">อัพเดทรหัสผ่านเพื่อความปลอดภัยของบัญชี</p>
                </div>

                <form onSubmit={handlePasswordUpdate} className="p-6 space-y-6">
                  {/* Current Password */}
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      <Lock className="h-4 w-4 inline mr-1" />
                      รหัสผ่านปัจจุบัน *
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        id="currentPassword"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                          errors.currentPassword ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="กรอกรหัสผ่านปัจจุบัน"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {errors.currentPassword && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.currentPassword}
                      </p>
                    )}
                  </div>

                  {/* New Password */}
                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      <Lock className="h-4 w-4 inline mr-1" />
                      รหัสผ่านใหม่ *
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        id="newPassword"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                          errors.newPassword ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="กรอกรหัสผ่านใหม่"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {errors.newPassword && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.newPassword}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      <Lock className="h-4 w-4 inline mr-1" />
                      ยืนยันรหัสผ่านใหม่ *
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                          errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>

                  {/* Password Requirements */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-md p-4">
                    <h4 className="text-sm font-medium text-emerald-900 mb-2">ข้อกำหนดรหัสผ่าน:</h4>
                    <ul className="text-sm text-emerald-800 space-y-1">
                      <li>• อย่างน้อย 6 ตัวอักษร</li>
                      <li>• ควรประกอบด้วยตัวอักษรและตัวเลข</li>
                      <li>• หลีกเลี่ยงข้อมูลส่วนตัวที่เดาได้ง่าย</li>
                    </ul>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end pt-6 border-t border-gray-200">
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          กำลังเปลี่ยน...
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4 mr-2" />
                          เปลี่ยนรหัสผ่าน
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
