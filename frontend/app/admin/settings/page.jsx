'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { 
  Settings, 
  CreditCard, 
  QrCode, 
  Building2, 
  Phone, 
  DollarSign,
  Save,
  Upload,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Loader2,
  Mail,
  Key,
  Lock
} from 'lucide-react';

export default function AdminSettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, canManageSettings } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showQRPreview, setShowQRPreview] = useState(false);

  // Payment settings state
  const [paymentSettings, setPaymentSettings] = useState({
    qr_code_url: '',
    bank_name: '',
    bank_account: '',
    account_name: '',
    phone_number: ''
  });

  // Email settings state
  const [emailSettings, setEmailSettings] = useState({
    gmail_user: '',
    gmail_app_password: '',
    from_email: '',
    from_name: '',
    admin_emails: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);

  // File upload states
  const [qrFile, setQrFile] = useState(null);
  const [uploadingQR, setUploadingQR] = useState(false);

  // Check authentication
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !canManageSettings()) {
        toast.error('คุณไม่มีสิทธิ์เข้าถึงหน้านี้ (เฉพาะ Admin เท่านั้น)');
        router.push('/admin/dashboard');
        return;
      }
      fetchPaymentSettings();
      fetchEmailSettings();
    }
  }, [authLoading, isAuthenticated, user, router]);

  // Fetch payment settings from database
  const fetchPaymentSettings = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching payment settings from database...');
      
      const response = await fetch('http://localhost:5680/api/global-settings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('📋 Payment settings loaded:', result);
        
        if (result.success && result.data) {
          setPaymentSettings({
            qr_code_url: result.data.qr_code_url || '',
            bank_name: result.data.bank_name || '',
            bank_account: result.data.bank_account || '',
            account_name: result.data.account_name || '',
            phone_number: result.data.phone_number || ''
          });
        }
      } else {
        console.error('❌ Failed to fetch payment settings');
        toast.error('ไม่สามารถโหลดข้อมูลการตั้งค่าได้');
      }

      // Fetch email settings
      await fetchEmailSettings();
    } catch (error) {
      console.error('❌ Error fetching payment settings:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  // Fetch email settings
  const fetchEmailSettings = async () => {
    try {
      console.log('📧 Fetching email settings...');
      
      const response = await fetch('http://localhost:5680/api/admin/email-settings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('📧 Email settings loaded:', result);
        
        if (result.success && result.data) {
          setEmailSettings({
            gmail_user: result.data.gmail_user || '',
            gmail_app_password: result.data.gmail_app_password || '',
            from_email: result.data.from_email || '',
            from_name: result.data.from_name || '',
            admin_emails: result.data.admin_emails || ''
          });
        }
      } else {
        console.log('ℹ️ Email settings not found, using defaults');
      }
    } catch (error) {
      console.error('❌ Error fetching email settings:', error);
    }
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setPaymentSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle email input changes
  const handleEmailInputChange = (field, value) => {
    setEmailSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle QR code file upload
  const handleQRUpload = async (file) => {
    if (!file) return;

    setUploadingQR(true);
    const formData = new FormData();
    formData.append('qrCode', file);

    try {
      const response = await fetch('http://localhost:5680/api/admin/upload-qr', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        console.log('📸 QR Code uploaded:', result);
        
        if (result.success) {
          setPaymentSettings(prev => ({
            ...prev,
            qr_code_url: result.qrCodeUrl
          }));
          toast.success('อัปโหลด QR Code สำเร็จ');
        }
      } else {
        toast.error('ไม่สามารถอัปโหลด QR Code ได้');
      }
    } catch (error) {
      console.error('❌ Error uploading QR code:', error);
      toast.error('เกิดข้อผิดพลาดในการอัปโหลด');
    } finally {
      setUploadingQR(false);
    }
  };

  // Save payment settings
  const handleSave = async () => {
    setSaving(true);
    
    try {
      console.log('💾 Saving payment settings:', paymentSettings);
      
      const response = await fetch('http://localhost:5680/api/admin/payment-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: paymentSettings
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Payment settings saved:', result);
        toast.success('บันทึกการตั้งค่าการชำระเงินสำเร็จ');
      } else {
        const errorData = await response.json();
        console.error('❌ Save failed:', errorData);
        toast.error(errorData.message || 'ไม่สามารถบันทึกการตั้งค่าได้');
      }
    } catch (error) {
      console.error('❌ Error saving settings:', error);
      toast.error('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSaving(false);
    }
  };

  // Save email settings
  const handleSaveEmail = async () => {
    setSaving(true);
    try {
      console.log('📧 Saving email settings:', emailSettings);
      const response = await fetch('http://localhost:5680/api/admin/email-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: emailSettings
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Email settings saved:', result);
        
        // โหลดข้อมูลใหม่หลังจากบันทึกสำเร็จ เพื่อแสดงค่าปัจจุบันที่อัปเดตแล้ว
        await fetchEmailSettings();
        
        toast.success('บันทึกการตั้งค่าอีเมลสำเร็จ');
      } else {
        const errorData = await response.json();
        console.error('❌ Email save failed:', errorData);
        toast.error(errorData.message || 'ไม่สามารถบันทึกการตั้งค่าอีเมลได้');
      }
    } catch (error) {
      console.error('❌ Error saving email settings:', error);
      toast.error('เกิดข้อผิดพลาดในการบันทึกการตั้งค่าอีเมล');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-600">กำลังโหลด...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">การตั้งค่าระบบ</h1>
          </div>
          <p className="text-gray-600">จัดการการตั้งค่าการชำระเงินและข้อมูลต่างๆ ของระบบ</p>
        </div>

        {/* Payment Settings Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">การตั้งค่าการชำระเงิน</h2>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Bank Transfer Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-green-600" />
                การโอนเงินผ่านธนาคาร
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ชื่อธนาคาร
                  </label>
                  <input
                    type="text"
                    value={paymentSettings.bank_name}
                    onChange={(e) => handleInputChange('bank_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="เช่น ธนาคารกสิกรไทย"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    เลขที่บัญชี
                  </label>
                  <input
                    type="text"
                    value={paymentSettings.bank_account}
                    onChange={(e) => handleInputChange('bank_account', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="เช่น 123-4-56789-0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ชื่อเจ้าของบัญชี
                  </label>
                  <input
                    type="text"
                    value={paymentSettings.account_name}
                    onChange={(e) => handleInputChange('account_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="เช่น นาย สมชาย ใจดี"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    หมายเลขพร้อมเพย์
                  </label>
                  <input
                    type="text"
                    value={paymentSettings.phone_number}
                    onChange={(e) => handleInputChange('phone_number', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="เช่น 081-234-5678"
                  />
                </div>
              </div>
            </div>

            {/* QR Code Settings */}
            <div className="space-y-4 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <QrCode className="h-5 w-5 text-purple-600" />
                QR Code สำหรับการชำระเงิน
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    อัปโหลด QR Code ใหม่
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setQrFile(file);
                          handleQRUpload(file);
                        }
                      }}
                      className="hidden"
                      id="qr-upload"
                    />
                    <label
                      htmlFor="qr-upload"
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer"
                    >
                      {uploadingQR ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      {uploadingQR ? 'กำลังอัปโหลด...' : 'เลือกไฟล์'}
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    QR Code ปัจจุบัน
                  </label>
                  {paymentSettings.qr_code_url ? (
                    <div className="relative">
                      <img
                        src={`http://localhost:5680${paymentSettings.qr_code_url}`}
                        alt="QR Code"
                        className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        onClick={() => setShowQRPreview(!showQRPreview)}
                        className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 text-white rounded"
                      >
                        {showQRPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                      <QrCode className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-6 border-t border-gray-200">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Save className="h-5 w-5" />
                )}
                {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
              </button>
            </div>
          </div>
        </div>

        {/* Email Settings Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-6">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">การตั้งค่าอีเมล</h2>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              จัดการการตั้งค่าอีเมลสำหรับส่งการแจ้งเตือนและยืนยันการจอง
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    อีเมลของระบบ (Gmail)
                  </div>
                </label>
                <input
                  type="email"
                  value={emailSettings.gmail_user}
                  onChange={(e) => handleEmailInputChange('gmail_user', e.target.value)}
                  placeholder="example@gmail.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  อีเมล Gmail ที่จะใช้ส่งการแจ้งเตือน
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    รหัสผ่านแอป Gmail (App Password)
                  </div>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={emailSettings.gmail_app_password}
                    onChange={(e) => handleEmailInputChange('gmail_app_password', e.target.value)}
                    placeholder="xxxx xxxx xxxx xxxx"
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  App Password จาก Google Account Settings
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อผู้ส่ง
                </label>
                <input
                  type="text"
                  value={emailSettings.from_name}
                  onChange={(e) => handleEmailInputChange('from_name', e.target.value)}
                  placeholder="Hotel System"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  ชื่อที่จะแสดงเป็นผู้ส่งอีเมล
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  อีเมลผู้ดูแลระบบ
                </label>
                <input
                  type="email"
                  value={emailSettings.admin_emails}
                  onChange={(e) => handleEmailInputChange('admin_emails', e.target.value)}
                  placeholder="admin1@hotel.com, admin2@hotel.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  อีเมลแอดมินที่จะได้รับการแจ้งเตือน (คั่นด้วยจุลภาค)
                </p>
              </div>
            </div>

            {/* Email Instructions */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900 mb-2">
                    วิธีการสร้าง Gmail App Password:
                  </h4>
                  <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                    <li>ไปที่ <a href="https://myaccount.google.com" target="_blank" rel="noopener noreferrer" className="underline">Google Account Settings</a></li>
                    <li>เลือก Security → 2-Step Verification (เปิดให้เรียบร้อยก่อน)</li>
                    <li>เลือก Security → App passwords</li>
                    <li>Select app: Mail, Select device: Other (Custom name)</li>
                    <li>ตั้งชื่อ: "Hotel Booking System"</li>
                    <li>คัดลอกรหัส 16 ตัวอักษร (รูปแบบ: xxxx xxxx xxxx xxxx)</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Email Save Button */}
            <div className="pt-6 border-t border-gray-200 mt-6">
              <button
                onClick={handleSaveEmail}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Save className="h-5 w-5" />
                )}
                {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าอีเมล'}
              </button>
            </div>
          </div>
        </div>

        {/* Preview Modal */}
        {showQRPreview && paymentSettings.qr_code_url && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowQRPreview(false)}>
            <div className="bg-white p-4 rounded-lg max-w-md max-h-[80vh] overflow-auto">
              <img
                src={`http://localhost:5680${paymentSettings.qr_code_url}`}
                alt="QR Code Preview"
                className="w-full h-auto"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}