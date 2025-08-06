'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { isAdmin } from '../../../lib/roles';

export default function PaymentSettings() {
  const { user, token, isAuthenticated } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState({
    qrCodeUrl: '',
    bankName: '',
    accountNumber: '',
    accountName: ''
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // ตรวจสอบสิทธิ์ admin
  useEffect(() => {
    if (!isAuthenticated || !isAdmin(user)) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/payment-settings');

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        console.log('Settings loaded:', data);
      } else {
        console.error('Failed to fetch settings:', response.status);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setError('ไม่สามารถโหลดข้อมูลการตั้งค่าได้');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // ตรวจสอบประเภทไฟล์
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('กรุณาเลือกไฟล์รูปภาพ (JPG, PNG, WEBP)');
      return;
    }

    // ตรวจสอบขนาดไฟล์ (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('ขนาดไฟล์ต้องไม่เกิน 5MB');
      return;
    }

    setUploading(true);
    setError('');
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('qrCode', file);

      const response = await fetch('http://localhost:3001/api/payment-settings/qr-code', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      console.log('Upload response:', data);

      if (response.ok && data.success) {
        setSettings(prev => ({ ...prev, qrCodeUrl: data.qrCodeUrl }));
        setMessage('อัปโหลด QR Code สำเร็จ');
        
        // Clear message after 3 seconds
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError(data.message || 'เกิดข้อผิดพลาดในการอัปโหลด');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('http://localhost:3001/api/payment-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bankName: settings.bankName,
          accountNumber: settings.accountNumber,
          accountName: settings.accountName,
          instructions: settings.instructions || 'กรุณาโอนเงินตามจำนวนที่ระบุ และแนบสลิปการโอนเงิน'
        })
      });

      const data = await response.json();
      console.log('Save response:', data);

      if (response.ok && data.success) {
        setMessage('บันทึกข้อมูลสำเร็จ');
        
        // Clear message after 3 seconds
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError(data.message || 'เกิดข้อผิดพลาดในการบันทึก');
      }
    } catch (error) {
      console.error('Save error:', error);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">ตั้งค่าการชำระเงิน</h1>

        {/* Messages */}
        {message && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* QR Code Upload Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700">QR Code สำหรับการชำระเงิน</h2>
            
            {/* Current QR Code */}
            {settings.qrCodeUrl && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  QR Code ปัจจุบัน:
                </label>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <img 
                    src={`http://localhost:3001${settings.qrCodeUrl}`}
                    alt="Payment QR Code"
                    className="max-w-xs mx-auto"
                  />
                </div>
              </div>
            )}

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                อัปโหลด QR Code ใหม่:
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                รองรับไฟล์: JPG, PNG, WEBP (ขนาดไม่เกิน 5MB)
              </p>
              
              {uploading && (
                <div className="mt-2 text-sm text-blue-600">
                  กำลังอัปโหลด...
                </div>
              )}
            </div>
          </div>

          {/* Bank Details Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700">ข้อมูลบัญชีธนาคาร</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อธนาคาร:
              </label>
              <input
                type="text"
                value={settings.bankName}
                onChange={(e) => handleInputChange('bankName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="เช่น ธนาคารกสิกรไทย"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เลขที่บัญชี:
              </label>
              <input
                type="text"
                value={settings.accountNumber}
                onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="เช่น 123-4-56789-0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อบัญชี:
              </label>
              <input
                type="text"
                value={settings.accountName}
                onChange={(e) => handleInputChange('accountName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="เช่น บริษัท โรงแรม จำกัด"
              />
            </div>

            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
            </button>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">วิธีการใช้งาน:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• อัปโหลด QR Code สำหรับการชำระเงินผ่านแอปธนาคาร</li>
            <li>• กรอกข้อมูลบัญชีธนาคารให้ครบถ้วน</li>
            <li>• QR Code จะแสดงให้ลูกค้าดูในหน้าการชำระเงิน</li>
            <li>• ลูกค้าสามารถสแกน QR Code เพื่อโอนเงินได้ทันที</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
