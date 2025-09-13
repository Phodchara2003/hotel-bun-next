'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import Cookies from 'js-cookie';
import { 
  CreditCard, 
  Smartphone, 
  Upload, 
  Save, 
  Eye, 
  EyeOff,
  AlertCircle,
  CheckCircle,
  Settings,
  QrCode,
  DollarSign
} from 'lucide-react';

export default function PaymentSettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });
  const [showQRPreview, setShowQRPreview] = useState(false);

  // Payment settings state
  const [settings, setSettings] = useState({
    bankTransfer: {
      enabled: true,
      bankName: 'ธนาคารกสิกรไทย',
      accountName: 'โรงแรมตัวอย่าง จำกัด',
      accountNumber: '123-4-56789-0',
      branchName: 'สาขาสยามพารากอน'
    },
    promptPay: {
      enabled: true,
      phoneNumber: '081-234-5678',
      qrCodeUrl: '/qr-codes/promptpay-qr.png'
    }
  });

  // Check authentication
  useEffect(() => {
    console.log('🔐 Payment Settings Auth Check:', { 
      authLoading, 
      isAuthenticated, 
      user: user ? { id: user.id, role: user.role, email: user.email } : null 
    });
    
    if (authLoading) return; // รอให้ AuthContext โหลดเสร็จก่อน
    
    if (!isAuthenticated || !user) {
      console.log('❌ Not authenticated, redirecting to login');
      router.push('/admin/login');
      return;
    }

    if (!['admin', 'super_admin'].includes(user.role)) {
      console.log('❌ Insufficient permissions, redirecting to dashboard');
      router.push('/admin/dashboard');
      return;
    }

    console.log('✅ Authentication passed, loading payment settings');
    loadPaymentSettings();
  }, [authLoading, isAuthenticated, user, router]);

  const loadPaymentSettings = async () => {
    try {
      const token = Cookies.get('auth_token');
      if (!token) {
        console.log('❌ No auth token found');
        setLoading(false);
        return;
      }

      console.log('🔄 Loading payment settings with token:', token.substring(0, 20) + '...');
      
      const response = await fetch('http://localhost:3003/api/admin/payment-settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 API Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Payment settings loaded:', data);
        if (data.settings) {
          setSettings(prev => ({ ...prev, ...data.settings }));
        }
      } else {
        console.log('⚠️ API failed, using default settings');
        // ใช้ค่าเริ่มต้นถ้า API fail
      }
    } catch (error) {
      console.error('❌ Error loading payment settings:', error);
      // ใช้ค่าเริ่มต้นถ้ามีข้อผิดพลาด
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setMessage({ type: '', content: '' });

    try {
      const token = Cookies.get('auth_token');
      const response = await fetch('http://localhost:3003/api/admin/payment-settings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ settings })
      });

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          content: 'บันทึกการตั้งค่าการชำระเงินเรียบร้อยแล้ว' 
        });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving payment settings:', error);
      setMessage({ 
        type: 'error', 
        content: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (event, type) => {
    const file = event.target.files[0];
    if (!file) return;

    // ตรวจสอบประเภทไฟล์
    if (!file.type.startsWith('image/')) {
      setMessage({ 
        type: 'error', 
        content: 'กรุณาเลือกไฟล์รูปภาพเท่านั้น' 
      });
      return;
    }

    // ตรวจสอบขนาดไฟล์ (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ 
        type: 'error', 
        content: 'ไฟล์รูปภาพต้องมีขนาดไม่เกิน 2MB' 
      });
      return;
    }

    const formData = new FormData();
    formData.append('qrImage', file);

    try {
      setSaving(true);
      setMessage({ type: 'info', content: 'กำลังอัปโหลด QR Code...' });

      const response = await fetch('http://localhost:3003/api/simple-payment-settings/qr-upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        
        // อัปเดต settings ใน state
        setSettings(prev => ({
          ...prev,
          promptPay: {
            ...prev.promptPay,
            qrCodeUrl: data.qrCodeUrl
          }
        }));

        setMessage({ 
          type: 'success', 
          content: 'อัปโหลด QR Code เรียบร้อยแล้ว' 
        });

        // ล้างข้อความหลังจาก 3 วินาที
        setTimeout(() => {
          setMessage({ type: '', content: '' });
        }, 3000);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'อัปโหลดไม่สำเร็จ');
      }
    } catch (error) {
      console.error('Error uploading QR code:', error);
      setMessage({ 
        type: 'error', 
        content: `เกิดข้อผิดพลาดในการอัปโหลดไฟล์: ${error.message}` 
      });
    } finally {
      setSaving(false);
      // ล้างข้อความ error หลังจาก 5 วินาที
      setTimeout(() => {
        if (message.type === 'error') {
          setMessage({ type: '', content: '' });
        }
      }, 5000);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // จะ redirect ไปหน้า login
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">การตั้งค่าการชำระเงิน</h1>
              <p className="mt-2 text-gray-600">จัดการช่องทางการชำระเงินสำหรับลูกค้า</p>
            </div>
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
            </button>
          </div>
        </div>

        {/* Message Alert */}
        {message.content && (
          <div className={`mb-6 p-4 rounded-md ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {message.type === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-400" />
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm ${
                  message.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {message.content}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Bank Transfer Settings */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CreditCard className="h-6 w-6 text-blue-600 mr-3" />
                  <h3 className="text-lg font-medium text-gray-900">โอนเงินผ่านธนาคาร</h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.bankTransfer.enabled}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      bankTransfer: { ...prev.bankTransfer, enabled: e.target.checked }
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อธนาคาร</label>
                  <input
                    type="text"
                    value={settings.bankTransfer.bankName}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      bankTransfer: { ...prev.bankTransfer, bankName: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!settings.bankTransfer.enabled}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อบัญชี</label>
                  <input
                    type="text"
                    value={settings.bankTransfer.accountName}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      bankTransfer: { ...prev.bankTransfer, accountName: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!settings.bankTransfer.enabled}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">เลขที่บัญชี</label>
                  <input
                    type="text"
                    value={settings.bankTransfer.accountNumber}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      bankTransfer: { ...prev.bankTransfer, accountNumber: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!settings.bankTransfer.enabled}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">สาขา</label>
                  <input
                    type="text"
                    value={settings.bankTransfer.branchName}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      bankTransfer: { ...prev.bankTransfer, branchName: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!settings.bankTransfer.enabled}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* PromptPay Settings */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <QrCode className="h-6 w-6 text-green-600 mr-3" />
                  <h3 className="text-lg font-medium text-gray-900">พร้อมเพย์ (PromptPay)</h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.promptPay.enabled}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      promptPay: { ...prev.promptPay, enabled: e.target.checked }
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">หมายเลขโทรศัพท์</label>
                  <input
                    type="tel"
                    value={settings.promptPay.phoneNumber}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      promptPay: { ...prev.promptPay, phoneNumber: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!settings.promptPay.enabled}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">QR Code</label>
                  <div className="flex items-center space-x-4">
                    <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                      <Upload className="h-4 w-4 mr-2" />
                      อัปโหลด QR Code
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'promptpay')}
                        className="hidden"
                        disabled={!settings.promptPay.enabled}
                      />
                    </label>
                    {settings.promptPay.qrCodeUrl && (
                      <>
                        <button
                          onClick={() => setShowQRPreview(!showQRPreview)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                          {showQRPreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                          {showQRPreview ? 'ซ่อน' : 'ดู'} QR Code
                        </button>
                        {showQRPreview && (
                          <div className="mt-4">
                            <img 
                              src={settings.promptPay.qrCodeUrl.startsWith('http') 
                                ? settings.promptPay.qrCodeUrl 
                                : `http://localhost:3003${settings.promptPay.qrCodeUrl}`} 
                              alt="PromptPay QR Code" 
                              className="w-48 h-48 object-contain border border-gray-300 rounded-lg"
                              onError={(e) => {
                                console.error('Failed to load QR Code image:', e.target.src);
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Save className="h-5 w-5 mr-2" />
            {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าทั้งหมด'}
          </button>
        </div>
      </div>
    </div>
  );
}
