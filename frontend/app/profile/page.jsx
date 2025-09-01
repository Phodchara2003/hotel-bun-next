'use client';

import { useState, useEffect } from 'react';
import { User, Settings, Mail, Shield, Key, Bell, Save, Edit, X } from 'lucide-react';
import EmailSettings from '../../components/EmailSettings';
import ChangeEmailModal from '../../components/ChangeEmailModal';
import ChangePasswordModal from '../../components/ChangePasswordModal';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslation } from '../../translations';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, updateUser, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const [showEmailSettings, setShowEmailSettings] = useState(false);
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setSaving] = useState(false);
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    bookingUpdates: true
  });
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: ''
  });

  // Load user data when component mounts or user changes
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.first_name || user.firstName || '',
        lastName: user.last_name || user.lastName || '',
        phone: user.phone || '',
        email: user.email || ''
      });
    }
  }, [user]);

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
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('อัพเดทข้อมูลสำเร็จ');
        setIsEditing(false);
        
        // Update user context with new data
        if (updateUser) {
          updateUser({
            ...user,
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone
          });
        }
      } else {
        toast.error(data.message || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('เกิดข้อผิดพลาดในการอัพเดท');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original user data
    setFormData({
      firstName: user?.first_name || user?.firstName || '',
      lastName: user?.last_name || user?.lastName || '',
      phone: user?.phone || '',
      email: user?.email || ''
    });
    setIsEditing(false);
  };

  const handleNotificationChange = async (type, value) => {
    const newNotifications = { ...notifications, [type]: value };
    setNotifications(newNotifications);
    
    try {
      // บันทึกการตั้งค่าการแจ้งเตือนไปยัง backend (ถ้าต้องการ)
      const response = await fetch('/api/auth/notification-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newNotifications)
      });

      if (response.ok) {
        toast.success('บันทึกการตั้งค่าการแจ้งเตือนแล้ว');
      }
    } catch (error) {
      console.error('Error saving notification settings:', error);
      // ไม่แสดง error เพราะเป็น feature เสริม
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('profile.title')}</h1>
          <p className="text-gray-600">
            {language === 'en' 
              ? 'Manage your personal information and account settings'
              : 'จัดการข้อมูลส่วนตัวและการตั้งค่าบัญชีของคุณ'
            }
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Profile Info */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <User className="w-5 h-5 mr-2 text-primary-600" />
                  {t('profile.personalInfo')}
                </h2>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Avatar */}
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="w-10 h-10 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {user?.first_name && user?.last_name ? 
                        `${user.first_name} ${user.last_name}` : 
                        user?.firstName && user?.lastName ?
                        `${user.firstName} ${user.lastName}` :
                        'ผู้ใช้'
                      }
                    </h3>
                    <p className="text-gray-600">{user?.email}</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      user?.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user?.role === 'admin' 
                        ? (language === 'en' ? 'Administrator' : 'ผู้ดูแลระบบ')
                        : (language === 'en' ? 'User' : 'ผู้ใช้ทั่วไป')
                      }
                    </span>
                  </div>
                  
                  {/* Edit Toggle Button */}
                  <div className="ml-auto">
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="btn-secondary flex items-center space-x-2"
                      >
                        <Edit className="w-4 h-4" />
                        <span>{t('common.edit')}</span>
                      </button>
                    ) : (
                      <div className="flex space-x-2">
                        <button
                          onClick={handleSave}
                          disabled={loading}
                          className="btn-primary flex items-center space-x-2"
                        >
                          {loading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          <span>บันทึก</span>
                        </button>
                        <button
                          onClick={handleCancel}
                          className="btn-outline-secondary flex items-center space-x-2"
                        >
                          <X className="w-4 h-4" />
                          <span>ยกเลิก</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* User Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('auth.firstName')} *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
                      placeholder={language === 'en' ? 'Enter first name' : 'กรอกชื่อ'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('auth.lastName')} *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
                      placeholder={language === 'en' ? 'Enter last name' : 'กรอกนามสกุล'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('auth.phone')}
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`input-field ${!isEditing ? 'bg-gray-50' : ''}`}
                      placeholder="กรอกเบอร์โทรศัพท์"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      อีเมล
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        disabled={true}
                        className="input-field bg-gray-100 cursor-not-allowed flex-1"
                      />
                      <button
                        onClick={() => setShowChangeEmail(true)}
                        className="btn-outline-primary flex items-center space-x-1 px-3"
                      >
                        <Mail className="w-4 h-4" />
                        <span>เปลี่ยน</span>
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      คลิก "เปลี่ยน" เพื่อเปลี่ยนอีเมล (ต้องยืนยันตัวตน)
                    </p>
                  </div>
                </div>

                {/* Action Buttons - เหลือแค่ปุ่มเปลี่ยนรหัสผ่าน */}
                {!isEditing && (
                  <div className="flex space-x-3 pt-4">
                    <button 
                      onClick={() => setShowChangePassword(true)}
                      className="btn-secondary"
                    >
                      <Key className="w-4 h-4 mr-2" />
                      เปลี่ยนรหัสผ่าน
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Settings Sidebar */}
          <div className="space-y-6">
            
            {/* Email Settings Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Mail className="w-5 h-5 mr-2 text-primary-600" />
                  การตั้งค่าอีเมล
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  ตั้งค่าอีเมลส่วนตัวสำหรับการส่ง OTP และการรีเซ็ตรหัสผ่าน
                </p>
                <button
                  onClick={() => setShowEmailSettings(true)}
                  className="w-full btn-outline-primary"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  {t('profile.emailSettings')}
                </button>
              </div>
            </div>

            {/* Security Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-green-600" />
                  ความปลอดภัย
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">การยืนยันตัวตน</span>
                    <span className="text-green-600 font-medium">เปิดใช้งาน</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">รหัสผ่าน</span>
                    <span className="text-green-600 font-medium">แข็งแรง</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">เข้าสู่ระบบล่าสุด</span>
                    <span className="text-gray-600">วันนี้</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Language Settings Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  🌐
                  <span className="ml-2">{t('language.changeLanguage')}</span>
                </h3>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 mb-3">
                    {language === 'en' 
                      ? 'Choose your preferred language for the interface'
                      : 'เลือกภาษาที่ต้องการใช้งานในระบบ'
                    }
                  </p>
                  <LanguageSwitcher showLabel={true} size="default" />
                </div>
              </div>
            </div>

            {/* Notifications Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Bell className="w-5 h-5 mr-2 text-yellow-600" />
                  การแจ้งเตือน
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">อีเมลแจ้งเตือน</span>
                    <input 
                      type="checkbox" 
                      checked={notifications.emailNotifications}
                      onChange={(e) => handleNotificationChange('emailNotifications', e.target.checked)}
                      className="form-checkbox text-primary-600 focus:ring-primary-500" 
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">การอัพเดทการจอง</span>
                    <input 
                      type="checkbox" 
                      checked={notifications.bookingUpdates}
                      onChange={(e) => handleNotificationChange('bookingUpdates', e.target.checked)}
                      className="form-checkbox text-primary-600 focus:ring-primary-500" 
                    />
                  </label>
                </div>
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start">
                    <div className="text-blue-600 mr-2">🤖</div>
                    <div>
                      <p className="text-sm font-medium text-blue-800">ระบบส่งอีเมลอัตโนมัติ</p>
                      <ul className="text-xs text-blue-700 mt-1 space-y-1">
                        <li>• ระบบเป็นผู้ส่งทันทีเมื่อมีเหตุการณ์</li>
                        <li>• ไม่ต้องรอแอดมินดำเนินการ</li>
                        <li>• ทำงานแบบ Background Processing</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start">
                    <div className="text-green-600 mr-2">✅</div>
                    <div>
                      <p className="text-sm font-medium text-green-800">ประเภทการแจ้งเตือน</p>
                      <ul className="text-xs text-green-700 mt-1 space-y-1">
                        <li>• แจ้งเตือนการจองสำเร็จ (ทันที)</li>
                        <li>• แจ้งเตือนการยกเลิกการจอง (ทันที)</li>
                        <li>• แจ้งเตือนการอัปเดตข้อมูล (ทันที)</li>
                        <li>• แจ้งเตือนก่อนเข้าพัก (อัตโนมัติ)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Email Settings Modal */}
        {showEmailSettings && (
          <EmailSettings
            isOpen={showEmailSettings}
            onClose={() => setShowEmailSettings(false)}
            userId={user?.id}
          />
        )}

        {/* Change Email Modal */}
        {showChangeEmail && (
          <ChangeEmailModal
            isOpen={showChangeEmail}
            onClose={() => setShowChangeEmail(false)}
            currentEmail={user?.email}
          />
        )}

        {/* Change Password Modal */}
        {showChangePassword && (
          <ChangePasswordModal
            isOpen={showChangePassword}
            onClose={() => setShowChangePassword(false)}
          />
        )}
      </div>
    </div>
  );
}
