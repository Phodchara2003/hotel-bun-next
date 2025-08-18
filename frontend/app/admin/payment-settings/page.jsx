'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useTranslation } from '../../../translations';
import { useRouter } from 'next/navigation';
import { isAdmin } from '../../../lib/roles';

export default function PaymentSettings() {
  const { user, token, isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('bank-transfer');

  // ตรวจสอบสิทธิ์ admin
  useEffect(() => {
    if (!isAuthenticated || !isAdmin(user)) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || !isAdmin(user)) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            {language === 'en' ? 'Access Denied' : 'ไม่อนุญาตให้เข้าถึง'}
          </h2>
          <p className="text-gray-600">
            {language === 'en' 
              ? 'You need admin privileges to access this page.' 
              : 'คุณต้องมีสิทธิ์แอดมินเพื่อเข้าถึงหน้านี้'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          {language === 'en' ? 'Payment Settings Management' : 'จัดการการตั้งค่าการชำระเงิน'}
        </h1>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('bank-transfer')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'bank-transfer'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                💳 {language === 'en' ? 'Bank Transfer Payment' : 'การชำระเงินผ่านธนาคาร'}
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'bank-transfer' && <BankTransferSettings />}
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple Bank Transfer Settings Component
function BankTransferSettings() {
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const [settings, setSettings] = useState({
    bankName: '',
    accountNumber: '',
    accountName: '',
    bankImageUrl: ''
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/admin/payment-settings');
      if (response.ok) {
        const data = await response.json();
        const bankInfo = data.settings?.bankInfo || {};
        setSettings({
          bankName: bankInfo.bankName || '',
          accountNumber: bankInfo.accountNumber || '',
          accountName: bankInfo.accountName || '',
          bankImageUrl: bankInfo.bankImageUrl || ''
        });
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError(language === 'en' ? 'File size must be less than 5MB' : 'ขนาดไฟล์ต้องไม่เกิน 5MB');
      return;
    }

    try {
      setUploading(true);
      
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64 = e.target.result;
          
          const response = await fetch('http://localhost:3001/api/upload-bank-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              image: base64,
              filename: file.name
            }),
          });

          if (response.ok) {
            const data = await response.json();
            setSettings(prev => ({ ...prev, bankImageUrl: data.url }));
            setMessage(language === 'en' ? 'Bank QR Code uploaded successfully!' : 'อัปโหลด QR Code ธนาคารสำเร็จ!');
            setError('');
          } else {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Upload failed');
          }
        } catch (err) {
          console.error('Upload error:', err);
          setError(language === 'en' ? 'Failed to upload bank QR code' : 'ไม่สามารถอัปโหลด QR Code ธนาคารได้');
        } finally {
          setUploading(false);
        }
      };
      
      reader.onerror = () => {
        setError(language === 'en' ? 'Failed to read file' : 'ไม่สามารถอ่านไฟล์ได้');
        setUploading(false);
      };
      
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Upload error:', err);
      setError(language === 'en' ? 'Failed to upload bank QR code' : 'ไม่สามารถอัปโหลด QR Code ธนาคารได้');
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const bankSettings = {
        bankInfo: {
          bankName: settings.bankName,
          accountNumber: settings.accountNumber,
          accountName: settings.accountName,
          bankImageUrl: settings.bankImageUrl
        },
        instructions: 'กรุณาโอนเงินเข้าบัญชีตามรายละเอียดข้างต้น และส่งสลิปการโอนเงินเพื่อยืนยันการชำระเงิน'
      };
      
      const response = await fetch('http://localhost:3001/api/admin/payment-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings: bankSettings }),
      });

      if (response.ok) {
        setMessage(language === 'en' ? 'Bank settings saved successfully!' : 'บันทึกข้อมูลธนาคารสำเร็จ!');
        setError('');
      } else {
        throw new Error('Save failed');
      }
    } catch (err) {
      console.error('Save error:', err);
      setError(language === 'en' ? 'Failed to save settings' : 'ไม่สามารถบันทึกการตั้งค่าได้');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {message}
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Bank QR Code Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {language === 'en' ? 'Bank QR Code Image (Optional)' : 'รูป QR Code ธนาคาร (ไม่บังคับ)'}
        </label>
        <p className="text-xs text-gray-500 mb-3">
          {language === 'en' 
            ? 'Upload a QR code image that customers can scan to make payments easily. If no QR code is uploaded, customers will use bank account details below.' 
            : 'อัปโหลดรูป QR Code ที่ลูกค้าสามารถสแกนเพื่อชำระเงินได้สะดวก หากไม่อัปโหลด QR Code ลูกค้าจะใช้ข้อมูลบัญชีธนาคารด้านล่าง'
          }
        </p>
        {settings.bankImageUrl && (
          <div className="mb-4">
            <img 
              src={`http://localhost:3001${settings.bankImageUrl}`} 
              alt="Bank QR Code" 
              className="w-64 h-64 object-contain border rounded-lg"
            />
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={uploading}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {uploading && <p className="text-sm text-gray-500 mt-2">กำลังอัปโหลดรูป...</p>}
        <p className="text-xs text-gray-500 mt-1">
          {language === 'en' ? 'Supported formats: JPG, PNG, GIF. Max size: 5MB' : 'รองรับไฟล์: JPG, PNG, GIF ขนาดไม่เกิน 5MB'}
        </p>
      </div>

      {/* Bank Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <p className="text-sm text-gray-600 mb-4">
            {language === 'en' 
              ? 'Bank account details below will be shown to customers as an alternative payment method (required even if QR code is uploaded).'
              : 'ข้อมูลบัญชีธนาคารด้านล่างจะแสดงให้ลูกค้าเป็นทางเลือกในการชำระเงิน (จำเป็นต้องกรอกแม้ว่าจะอัปโหลด QR Code แล้ว)'
            }
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {language === 'en' ? 'Bank Name' : 'ชื่อธนาคาร'}
          </label>
          <input
            type="text"
            value={settings.bankName}
            onChange={(e) => setSettings(prev => ({ ...prev, bankName: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder={language === 'en' ? 'e.g., Kasikorn Bank' : 'เช่น ธนาคารกสิกรไทย'}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {language === 'en' ? 'Account Number' : 'เลขที่บัญชี'}
          </label>
          <input
            type="text"
            value={settings.accountNumber}
            onChange={(e) => setSettings(prev => ({ ...prev, accountNumber: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="xxx-x-xxxxx-x"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {language === 'en' ? 'Account Name' : 'ชื่อบัญชี'}
          </label>
          <input
            type="text"
            value={settings.accountName}
            onChange={(e) => setSettings(prev => ({ ...prev, accountName: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder={language === 'en' ? 'Account holder name' : 'ชื่อเจ้าของบัญชี'}
          />
        </div>
      </div>

      {/* Preview */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">
          {language === 'en' ? 'Payment Page Preview' : 'ตัวอย่างหน้าการชำระเงิน'}
        </h3>
        <div className="space-y-4 bg-white rounded p-4 border">
          {settings.bankImageUrl && (
            <div className="text-center">
              <h4 className="font-medium text-gray-900 mb-2">สแกน QR Code เพื่อชำระเงิน</h4>
              <img 
                src={`http://localhost:3001${settings.bankImageUrl}`} 
                alt="QR Code Preview" 
                className="w-32 h-32 object-contain mx-auto border rounded"
              />
              <p className="text-xs text-gray-500 mt-1">ลูกค้าจะเห็น QR Code นี้</p>
            </div>
          )}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">
              {settings.bankImageUrl ? 'หรือโอนเงินตามข้อมูลด้านล่าง' : 'ข้อมูลบัญชีธนาคาร'}
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">{language === 'en' ? 'Bank:' : 'ธนาคาร:'}</span>
                <span className="font-semibold">{settings.bankName || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{language === 'en' ? 'Account Number:' : 'เลขที่บัญชี:'}</span>
                <span className="font-semibold">{settings.accountNumber || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{language === 'en' ? 'Account Name:' : 'ชื่อบัญชี:'}</span>
                <span className="font-semibold">{settings.accountName || '-'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {saving 
            ? (language === 'en' ? 'Saving...' : 'กำลังบันทึก...') 
            : (language === 'en' ? 'Save Bank Settings' : 'บันทึกข้อมูลธนาคาร')
          }
        </button>
      </div>
    </div>
  );
}
