'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/translations';
import { validatePromptPayId } from '@/lib/qrcode-generator';

const AdminPaymentSettings = () => {
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const [settings, setSettings] = useState({
    promptpay: {
      id: "0610931494",
      name: "โรงแรม Hotel Bun Next",
      enabled: true
    },
    qrcode: {
      expiryMinutes: 30,
      showHotelName: true,
      showBookingDetails: true
    },
    ui: {
      showInstructions: true,
      showTimer: true,
      showSupportedApps: true
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/admin/payment-settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error fetching payment settings:', error);
    }
  };

  const validateForm = () => {
    const errors = {};

    // Validate PromptPay ID
    const promptPayValidation = validatePromptPayId(settings.promptpay.id);
    if (!promptPayValidation.isValid) {
      errors.promptPayId = language === 'en' 
        ? 'Invalid PromptPay ID. Must be 10-digit phone number or 13-digit National ID.'
        : 'หมายเลข PromptPay ไม่ถูกต้อง ต้องเป็นเบอร์โทร 10 หลัก หรือ รหัสบัตรประชาชน 13 หลัก';
    }

    // Validate hotel name
    if (!settings.promptpay.name.trim()) {
      errors.hotelName = language === 'en' ? 'Hotel name is required' : 'กรุณาใส่ชื่อโรงแรม';
    }

    // Validate expiry minutes
    if (settings.qrcode.expiryMinutes < 5 || settings.qrcode.expiryMinutes > 60) {
      errors.expiryMinutes = language === 'en' 
        ? 'Expiry time must be between 5-60 minutes'
        : 'เวลาหมดอายุต้องอยู่ระหว่าง 5-60 นาที';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveSettings = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/admin/payment-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      });

      if (response.ok) {
        setMessage(language === 'en' ? 'Settings saved successfully!' : 'บันทึกการตั้งค่าสำเร็จ!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage(language === 'en' ? 'Error saving settings' : 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setLoading(false);
    }
  };

  const handleTestQR = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/admin/test-qr-generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          promptPayId: settings.promptpay.id,
          amount: 100.00,
          testBookingId: 'TEST001'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Show test QR code in a modal or new window
        const newWindow = window.open('', '_blank', 'width=400,height=500');
        newWindow.document.write(`
          <html>
            <head><title>Test QR Code</title></head>
            <body style="text-align: center; padding: 20px;">
              <h3>Test QR Code - ฿100.00</h3>
              <img src="${data.qrCodeImage}" alt="Test QR Code" style="max-width: 300px;">
              <p style="font-size: 12px; color: #666;">
                PromptPay: ${settings.promptpay.id}<br>
                Hotel: ${settings.promptpay.name}
              </p>
            </body>
          </html>
        `);
        
        setMessage(language === 'en' ? 'Test QR generated successfully!' : 'สร้าง QR ทดสอบสำเร็จ!');
      } else {
        throw new Error('Failed to generate test QR');
      }
    } catch (error) {
      console.error('Error generating test QR:', error);
      setMessage(language === 'en' ? 'Error generating test QR' : 'เกิดข้อผิดพลาดในการสร้าง QR ทดสอบ');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {language === 'en' ? 'Payment Settings' : 'ตั้งค่าการชำระเงิน'}
          </h2>
          <div className="flex space-x-3">
            <button
              onClick={handleTestQR}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              {language === 'en' ? 'Test QR' : 'ทดสอบ QR'}
            </button>
            <button
              onClick={handleSaveSettings}
              disabled={loading}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              {loading 
                ? (language === 'en' ? 'Saving...' : 'กำลังบันทึก...') 
                : (language === 'en' ? 'Save Settings' : 'บันทึกการตั้งค่า')
              }
            </button>
          </div>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg ${
            message.includes('Error') || message.includes('ข้อผิดพลาด') 
              ? 'bg-red-100 text-red-700' 
              : 'bg-green-100 text-green-700'
          }`}>
            {message}
          </div>
        )}

        {/* PromptPay Settings */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            {language === 'en' ? 'PromptPay Configuration' : 'การตั้งค่า PromptPay'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'en' ? 'PromptPay ID (Phone/National ID)' : 'หมายเลข PromptPay (เบอร์โทร/รหัสบัตรประชาชน)'}
              </label>
              <input
                type="text"
                value={settings.promptpay.id}
                onChange={(e) => setSettings({
                  ...settings,
                  promptpay: { ...settings.promptpay, id: e.target.value }
                })}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.promptPayId ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0610931494"
              />
              {validationErrors.promptPayId && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.promptPayId}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'en' ? 'Hotel Name' : 'ชื่อโรงแรม'}
              </label>
              <input
                type="text"
                value={settings.promptpay.name}
                onChange={(e) => setSettings({
                  ...settings,
                  promptpay: { ...settings.promptpay, name: e.target.value }
                })}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.hotelName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="โรงแรม Hotel Bun Next"
              />
              {validationErrors.hotelName && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.hotelName}</p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.promptpay.enabled}
                onChange={(e) => setSettings({
                  ...settings,
                  promptpay: { ...settings.promptpay, enabled: e.target.checked }
                })}
                className="mr-2"
              />
              {language === 'en' ? 'Enable PromptPay QR Code Payment' : 'เปิดใช้งานการชำระเงินผ่าน PromptPay QR Code'}
            </label>
          </div>
        </div>

        {/* QR Code Settings */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            {language === 'en' ? 'QR Code Settings' : 'การตั้งค่า QR Code'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'en' ? 'QR Code Expiry Time (minutes)' : 'เวลาหมดอายุ QR Code (นาที)'}
              </label>
              <input
                type="number"
                min="5"
                max="60"
                value={settings.qrcode.expiryMinutes}
                onChange={(e) => setSettings({
                  ...settings,
                  qrcode: { ...settings.qrcode, expiryMinutes: parseInt(e.target.value) }
                })}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.expiryMinutes ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {validationErrors.expiryMinutes && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.expiryMinutes}</p>
              )}
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.qrcode.showHotelName}
                onChange={(e) => setSettings({
                  ...settings,
                  qrcode: { ...settings.qrcode, showHotelName: e.target.checked }
                })}
                className="mr-2"
              />
              {language === 'en' ? 'Show hotel name in QR payment' : 'แสดงชื่อโรงแรมใน QR การชำระเงิน'}
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.qrcode.showBookingDetails}
                onChange={(e) => setSettings({
                  ...settings,
                  qrcode: { ...settings.qrcode, showBookingDetails: e.target.checked }
                })}
                className="mr-2"
              />
              {language === 'en' ? 'Show booking details in QR payment' : 'แสดงรายละเอียดการจองใน QR การชำระเงิน'}
            </label>
          </div>
        </div>

        {/* UI Settings */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            {language === 'en' ? 'User Interface Settings' : 'การตั้งค่าหน้าจอผู้ใช้'}
          </h3>
          
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.ui.showInstructions}
                onChange={(e) => setSettings({
                  ...settings,
                  ui: { ...settings.ui, showInstructions: e.target.checked }
                })}
                className="mr-2"
              />
              {language === 'en' ? 'Show payment instructions' : 'แสดงคำแนะนำการชำระเงิน'}
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.ui.showTimer}
                onChange={(e) => setSettings({
                  ...settings,
                  ui: { ...settings.ui, showTimer: e.target.checked }
                })}
                className="mr-2"
              />
              {language === 'en' ? 'Show countdown timer' : 'แสดงตัวนับถอยหลัง'}
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.ui.showSupportedApps}
                onChange={(e) => setSettings({
                  ...settings,
                  ui: { ...settings.ui, showSupportedApps: e.target.checked }
                })}
                className="mr-2"
              />
              {language === 'en' ? 'Show supported payment apps' : 'แสดงแอปชำระเงินที่รองรับ'}
            </label>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-700 mb-2">
            {language === 'en' ? 'Current Settings Preview:' : 'ตัวอย่างการตั้งค่าปัจจุบัน:'}
          </h4>
          <div className="text-sm text-gray-600 space-y-1">
            <div>📱 PromptPay ID: {settings.promptpay.id}</div>
            <div>🏨 Hotel: {settings.promptpay.name}</div>
            <div>⏰ QR Expiry: {settings.qrcode.expiryMinutes} minutes</div>
            <div>✅ Status: {settings.promptpay.enabled ? 'Enabled' : 'Disabled'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPaymentSettings;
