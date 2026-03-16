'use client';

import { useState, useEffect } from 'react';
import { Mail, Key, Server, TestTube, Shield, AlertCircle, CheckCircle, X, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EmailSettings({ isOpen, onClose, userId }) {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [settings, setSettings] = useState(null);
  const [formData, setFormData] = useState({
    provider: 'gmail',
    email: '',
    appPassword: '',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587
  });

  // Load existing settings
  useEffect(() => {
    if (isOpen && userId) {
      loadSettings();
    }
  }, [isOpen, userId]);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/user-email/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      if (data.success && data.settings) {
        setSettings(data.settings);
        setFormData({
          provider: data.settings.provider,
          email: data.settings.email,
          appPassword: '', // ไม่แสดงรหัสผ่าน
          smtpHost: data.settings.smtp_host,
          smtpPort: data.settings.smtp_port
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleProviderChange = (provider) => {
    setFormData(prev => ({
      ...prev,
      provider,
      smtpHost: provider === 'gmail' ? 'smtp.gmail.com' : 
                provider === 'outlook' ? 'smtp-mail.outlook.com' :
                provider === 'yahoo' ? 'smtp.mail.yahoo.com' : 'smtp.gmail.com',
      smtpPort: provider === 'gmail' ? 587 : 587
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!formData.email || !formData.appPassword) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/user-email/configure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success('ตั้งค่าอีเมลสำเร็จ');
        loadSettings();
      } else {
        toast.error(data.message || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const response = await fetch('/api/user-email/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        toast.success('ทดสอบส่งอีเมลสำเร็จ! ตรวจสอบกล่องจดหมายของคุณ');
        loadSettings();
      } else {
        toast.error(data.message || 'ทดสอบส่งอีเมลไม่สำเร็จ');
      }
    } catch (error) {
      console.error('Error testing email:', error);
      toast.error('เกิดข้อผิดพลาดในการทดสอบ');
    } finally {
      setTesting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('คุณต้องการลบการตั้งค่าอีเมลหรือไม่?')) return;

    setLoading(true);
    try {
      const response = await fetch('/api/user-email/settings', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        toast.success('ลบการตั้งค่าสำเร็จ');
        setSettings(null);
        setFormData({
          provider: 'gmail',
          email: '',
          appPassword: '',
          smtpHost: 'smtp.gmail.com',
          smtpPort: 587
        });
      } else {
        toast.error(data.message || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error deleting settings:', error);
      toast.error('เกิดข้อผิดพลาดในการลบ');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Mail className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              การตั้งค่าอีเมลส่วนตัว
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">ทำไมต้องตั้งค่าอีเมลส่วนตัว?</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>ใช้อีเมลของคุณเองในการส่ง OTP</li>
                  <li>ไม่จำกัดจำนวนการส่งเหมือน Gmail ของระบบ</li>
                  <li>ความปลอดภัยสูงกว่า - ไม่ผ่าน email ของคนอื่น</li>
                  <li>สามารถใช้ Gmail, Outlook, หรือ Yahoo ได้</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Status */}
          {settings && (
            <div className="mb-6">
              <div className={`flex items-center space-x-2 px-4 py-3 rounded-lg ${
                settings.is_verified 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-yellow-50 border border-yellow-200'
              }`}>
                {settings.is_verified ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                )}
                <span className={`text-sm font-medium ${
                  settings.is_verified ? 'text-green-800' : 'text-yellow-800'
                }`}>
                  {settings.is_verified 
                    ? 'อีเมลได้รับการยืนยันแล้ว' 
                    : 'อีเมลยังไม่ได้รับการยืนยัน'
                  }
                </span>
              </div>
            </div>
          )}

          {/* Provider Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              เลือกผู้ให้บริการอีเมล
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'gmail', label: 'Gmail', color: 'red' },
                { value: 'outlook', label: 'Outlook', color: 'blue' },
                { value: 'yahoo', label: 'Yahoo', color: 'purple' }
              ].map(provider => (
                <button
                  key={provider.value}
                  onClick={() => handleProviderChange(provider.value)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.provider === provider.value
                      ? `border-${provider.color}-500 bg-${provider.color}-50`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="font-medium text-gray-900">{provider.label}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Email Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              อีเมลของคุณ
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="your-email@gmail.com"
                className="input-field pl-10"
              />
            </div>
          </div>

          {/* App Password Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              App Password
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="appPassword"
                value={formData.appPassword}
                onChange={handleInputChange}
                placeholder="16-digit app password"
                className="input-field pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              สร้าง App Password ได้ที่ Google Account Security → 2-Step Verification → App passwords
            </p>
          </div>

          {/* Advanced Settings */}
          <details className="mb-6">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-3 flex items-center">
              <Server className="w-4 h-4 mr-2" />
              การตั้งค่าขั้นสูง
            </summary>
            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Host
                </label>
                <input
                  type="text"
                  name="smtpHost"
                  value={formData.smtpHost}
                  onChange={handleInputChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Port
                </label>
                <input
                  type="number"
                  name="smtpPort"
                  value={formData.smtpPort}
                  onChange={handleInputChange}
                  className="input-field"
                />
              </div>
            </div>
          </details>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 btn-primary flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  <span>บันทึกการตั้งค่า</span>
                </>
              )}
            </button>

            {settings && (
              <button
                onClick={handleTest}
                disabled={testing}
                className="btn-secondary flex items-center justify-center space-x-2"
              >
                {testing ? (
                  <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <TestTube className="w-5 h-5" />
                    <span>ทดสอบ</span>
                  </>
                )}
              </button>
            )}

            {settings && (
              <button
                onClick={handleDelete}
                className="btn-outline-danger"
              >
                ลบ
              </button>
            )}
          </div>

          {/* Help Section */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">💡 วิธีสร้าง App Password</h4>
            <div className="text-sm text-gray-600 space-y-2">
              <p><strong>Gmail:</strong></p>
              <ol className="list-decimal list-inside ml-4 space-y-1">
                <li>ไปที่ Google Account Security</li>
                <li>เปิด 2-Step Verification</li>
                <li>ไปที่ App passwords</li>
                <li>เลือก Mail → Other (custom name)</li>
                <li>ใส่ชื่อ "Hotel Booking System"</li>
                <li>คัดลอกรหัส 16 หลักที่ได้</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
