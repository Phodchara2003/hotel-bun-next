'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/translations';
import { Upload, Image, X, Save } from 'lucide-react';

const AdminPaymentSettings = () => {
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const [settings, setSettings] = useState({
    qrImages: {
      promptPayQR: null,
      bankTransferQR: null,
      slipTemplate: null
    },
    paymentInfo: {
      promptPayId: "0610931494",
      promptPayName: "โรงแรม Hotel Bun Next",
      bankAccount: "123-456-789",
      bankName: "ธนาคารกรุงเทพ",
      accountName: "บริษัท โรงแรม Hotel Bun Next จำกัด"
    },
    settings: {
      enabled: true,
      instructions: "กรุณาสแกน QR Code เพื่อชำระเงิน และส่งสลิปมายืนยันการชำระเงิน"
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [dragOver, setDragOver] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/admin/payment-settings');
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setSettings(data.settings);
        }
      }
    } catch (error) {
      console.error('Error fetching payment settings:', error);
    }
  };

  // Handle file upload
  const handleFileUpload = async (file, type) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage('ขนาดไฟล์ต้องไม่เกิน 5MB');
      return;
    }

    try {
      setLoading(true);
      
      // Convert to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        setSettings(prev => ({
          ...prev,
          qrImages: {
            ...prev.qrImages,
            [type]: e.target.result
          }
        }));
        setLoading(false);
      };
      reader.readAsDataURL(file);
      
    } catch (error) {
      console.error('Error uploading file:', error);
      setMessage('เกิดข้อผิดพลาดในการอัปโหลดไฟล์');
      setLoading(false);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e, type) => {
    e.preventDefault();
    setDragOver(type);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(null);
  };

  const handleDrop = (e, type) => {
    e.preventDefault();
    setDragOver(null);
    const file = e.dataTransfer.files[0];
    handleFileUpload(file, type);
  };

  // Remove image
  const removeImage = (type) => {
    setSettings(prev => ({
      ...prev,
      qrImages: {
        ...prev.qrImages,
        [type]: null
      }
    }));
  };

  const validateForm = () => {
    if (!settings.paymentInfo.promptPayId.trim()) {
      setMessage('กรุณาใส่หมายเลข PromptPay');
      return false;
    }
    if (!settings.paymentInfo.promptPayName.trim()) {
      setMessage('กรุณาใส่ชื่อบัญชี PromptPay');
      return false;
    }
    return true;
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
        setMessage('บันทึกการตั้งค่าสำเร็จ!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setLoading(false);
    }
  };

  // Image upload component
  const ImageUploadBox = ({ title, type, image, description }) => (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
      <h4 className="font-medium text-gray-900 mb-2">{title}</h4>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      
      {image ? (
        <div className="relative">
          <img 
            src={image} 
            alt={title}
            className="max-w-full h-48 object-contain mx-auto rounded"
          />
          <button
            onClick={() => removeImage(type)}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragOver === type 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={(e) => handleDragOver(e, type)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, type)}
        >
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">ลากไฟล์มาวาง หรือ</p>
          <label className="cursor-pointer">
            <span className="text-blue-600 hover:text-blue-500">เลือกไฟล์</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files[0], type)}
            />
          </label>
          <p className="text-xs text-gray-500 mt-2">PNG, JPG, JPEG ขนาดไม่เกิน 5MB</p>
        </div>
      )}
    </div>
  );



  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">การตั้งค่าการชำระเงิน</h2>
        <p className="text-gray-600">จัดการ QR Code และข้อมูลการชำระเงิน</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.includes('สำเร็จ') 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message}
        </div>
      )}

      <div className="space-y-8">
        {/* QR Code Images Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">อัปโหลดรูป QR Code</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ImageUploadBox
              title="PromptPay QR Code"
              type="promptPayQR"
              image={settings.qrImages.promptPayQR}
              description="QR Code สำหรับชำระเงินผ่าน PromptPay"
            />
            <ImageUploadBox
              title="Bank Transfer QR Code"
              type="bankTransferQR"
              image={settings.qrImages.bankTransferQR}
              description="QR Code สำหรับโอนเงินผ่านธนาคาร"
            />
          </div>
          <div className="mt-6">
            <ImageUploadBox
              title="ตัวอย่างสลิป"
              type="slipTemplate"
              image={settings.qrImages.slipTemplate}
              description="รูปตัวอย่างสลิปที่ต้องการให้ลูกค้าส่งมา"
            />
          </div>
        </div>

        {/* Payment Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลการชำระเงิน</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                หมายเลข PromptPay
              </label>
              <input
                type="text"
                value={settings.paymentInfo.promptPayId}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  paymentInfo: { ...prev.paymentInfo, promptPayId: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0812345678 หรือ 1234567890123"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อบัญชี PromptPay
              </label>
              <input
                type="text"
                value={settings.paymentInfo.promptPayName}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  paymentInfo: { ...prev.paymentInfo, promptPayName: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="นาย สมชาย ใจดี"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เลขที่บัญชีธนาคาร
              </label>
              <input
                type="text"
                value={settings.paymentInfo.bankAccount}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  paymentInfo: { ...prev.paymentInfo, bankAccount: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="123-456-789"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อธนาคาร
              </label>
              <input
                type="text"
                value={settings.paymentInfo.bankName}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  paymentInfo: { ...prev.paymentInfo, bankName: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ธนาคารกรุงเทพ"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อบัญชีธนาคาร
              </label>
              <input
                type="text"
                value={settings.paymentInfo.accountName}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  paymentInfo: { ...prev.paymentInfo, accountName: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="บริษัท โรงแรม Hotel Bun Next จำกัด"
              />
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">คำแนะนำสำหรับลูกค้า</h3>
          <textarea
            value={settings.settings.instructions}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              settings: { ...prev.settings, instructions: e.target.value }
            }))}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="ใส่คำแนะนำสำหรับลูกค้าในการชำระเงิน..."
          />
        </div>

        {/* Preview Section */}
        {(settings.qrImages.promptPayQR || settings.qrImages.bankTransferQR) && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ตัวอย่างหน้าชำระเงิน</h3>
            <div className="border rounded-lg p-6 bg-gray-50">
              <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
                <h4 className="text-lg font-semibold text-center mb-4">ชำระเงิน</h4>
                
                {settings.qrImages.promptPayQR && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">PromptPay</p>
                    <img 
                      src={settings.qrImages.promptPayQR} 
                      alt="PromptPay QR"
                      className="w-32 h-32 mx-auto object-contain border rounded"
                    />
                    <p className="text-xs text-center text-gray-600 mt-2">
                      {settings.paymentInfo.promptPayId}
                    </p>
                  </div>
                )}
                
                {settings.qrImages.bankTransferQR && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">โอนเงินผ่านธนาคาร</p>
                    <img 
                      src={settings.qrImages.bankTransferQR} 
                      alt="Bank Transfer QR"
                      className="w-32 h-32 mx-auto object-contain border rounded"
                    />
                    <p className="text-xs text-center text-gray-600 mt-2">
                      {settings.paymentInfo.bankName}: {settings.paymentInfo.bankAccount}
                    </p>
                  </div>
                )}
                
                <div className="mt-4 p-3 bg-blue-50 rounded text-sm text-gray-700">
                  {settings.settings.instructions}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSaveSettings}
            disabled={loading}
            className={`flex items-center px-6 py-2 rounded-lg transition-colors ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {loading ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPaymentSettings;
