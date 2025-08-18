'use client';

import { useState, useEffect } from 'react';

const AdminPaymentSettings = () => {
  const [settings, setSettings] = useState({
    bankInfo: {
      bankName: 'ธนาคารทดสอบใหม่',
      accountNumber: '999-888-777',
      accountName: 'New Test Account'
    },
    instructions: 'กรุณาโอนเงินเข้าบัญชีตามรายละเอียดข้างต้น และส่งสลิปการโอนเงินเพื่อยืนยันการชำระเงิน'
  });
  
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Load existing settings
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/admin/payment-settings');
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setSettings(data.settings);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/admin/payment-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      });

      if (response.ok) {
        setMessage('บันทึกการตั้งค่าสำเร็จ');
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

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">การตั้งค่าการชำระเงิน</h2>
        <p className="text-gray-600">จัดการข้อมูลบัญชีธนาคารสำหรับการรับชำระเงิน</p>
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

      <div className="space-y-6">
        {/* Bank Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลบัญชีธนาคาร</h3>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ธนาคาร:
              </label>
              <input
                type="text"
                value={settings.bankInfo.bankName}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  bankInfo: { ...prev.bankInfo, bankName: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ชื่อธนาคาร"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เลขที่บัญชี:
              </label>
              <input
                type="text"
                value={settings.bankInfo.accountNumber}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  bankInfo: { ...prev.bankInfo, accountNumber: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="เลขที่บัญชีธนาคาร"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อบัญชี:
              </label>
              <input
                type="text"
                value={settings.bankInfo.accountName}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  bankInfo: { ...prev.bankInfo, accountName: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ชื่อเจ้าของบัญชี"
              />
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">คำแนะนำสำหรับลูกค้า</h3>
          <textarea
            value={settings.instructions}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              instructions: e.target.value
            }))}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="ใส่คำแนะนำสำหรับลูกค้าในการชำระเงิน..."
          />
        </div>

        {/* Preview Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">ตัวอย่างหน้าชำระเงิน</h3>
          <div className="border rounded-lg p-6 bg-gray-50">
            <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
              <h4 className="text-lg font-semibold text-center mb-4">ข้อมูลการชำระเงิน</h4>
              
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-700">ธนาคาร:</span>
                  <p className="text-gray-900">{settings.bankInfo.bankName}</p>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-700">เลขที่บัญชี:</span>
                  <p className="text-gray-900 font-mono">{settings.bankInfo.accountNumber}</p>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-700">ชื่อบัญชี:</span>
                  <p className="text-gray-900">{settings.bankInfo.accountName}</p>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded text-sm text-gray-700">
                {settings.instructions}
              </div>
            </div>
          </div>
        </div>

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
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"></path>
              </svg>
            )}
            {loading ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPaymentSettings;
