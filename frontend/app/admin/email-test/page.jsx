'use client';

import { useState, useEffect } from 'react';
import { Mail, Send, CheckCircle, AlertCircle, Clock, Users } from 'lucide-react';
import toast from 'react-hot-toast';

function EmailTestContent() {
  const [isTestingAdmin, setIsTestingAdmin] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const testAdminNotification = async () => {
    setIsTestingAdmin(true);
    setTestResults(null);

    try {
      // ข้อมูลจำลองการจองใหม่ (ใช้ค่าคงที่เพื่อหลีกเลี่ยง hydration error)
      const mockBookingData = {
        bookingReference: 'HTL123456789',
        customerName: 'คุณทดสอบ ระบบอีเมล',
        customerEmail: 'customer.test@gmail.com',
        hotelName: 'โรงแรมวรุณภัฏมหาวิทยาลัยราชภัฏมหาสารคาม',
        roomTypeName: 'ห้องดีลักซ์ เตียงคู่',
        checkInDate: '2025-10-15',
        checkOutDate: '2025-10-17',
        totalPrice: 2500
      };

      const response = await fetch('http://localhost:3001/api/test-admin-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockBookingData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setTestResults(result);
        toast.success('ทดสอบส่งอีเมลแจ้งเตือนแอดมินสำเร็จ!');
      } else {
        toast.error('ทดสอบล้มเหลว: ' + result.error);
      }
    } catch (error) {
      console.error('Error testing admin email:', error);
      toast.error('เกิดข้อผิดพลาดในการทดสอบอีเมล');
    } finally {
      setIsTestingAdmin(false);
    }
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ทดสอบระบบอีเมลแจ้งเตือน</h1>
              <p className="text-gray-600">ทดสอบการส่งอีเมลแจ้งเตือนไปยังแอดมินเมื่อมีการจองใหม่</p>
            </div>
          </div>
        </div>

        {/* Test Admin Notification */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">ทดสอบอีเมลแจ้งเตือนแอดมิน</h2>
              <p className="text-gray-600 text-sm">
                ส่งอีเมลแจ้งเตือนจำลองไปยังแอดมินทุกคน เมื่อมีการจองใหม่เข้ามาในระบบ
              </p>
            </div>
            <button
              onClick={testAdminNotification}
              disabled={isTestingAdmin}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isTestingAdmin ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  กำลังทดสอบ...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  ทดสอบส่งอีเมล
                </>
              )}
            </button>
          </div>

          {/* Mock Data Preview */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-gray-900 mb-3">ข้อมูลจำลองที่จะส่ง:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">รหัสการจอง:</span>
                <span className="ml-2 font-medium">HTL123456789</span>
              </div>
              <div>
                <span className="text-gray-600">ชื่อลูกค้า:</span>
                <span className="ml-2 font-medium">คุณทดสอบ ระบบอีเมล</span>
              </div>
              <div>
                <span className="text-gray-600">ประเภทห้อง:</span>
                <span className="ml-2 font-medium">ห้องดีลักซ์ เตียงคู่</span>
              </div>
              <div>
                <span className="text-gray-600">ราคารวม:</span>
                <span className="ml-2 font-medium text-green-600">฿2,500</span>
              </div>
            </div>
          </div>

          {/* Results */}
          {testResults && (
            <div className="border-t border-gray-200 pt-4">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                ผลลัพธ์การทดสอบ
              </h3>
              
              <div className="space-y-3">
                {testResults.results?.map((result, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      result.success 
                        ? 'bg-green-50 border border-green-200' 
                        : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1 rounded-full ${
                        result.success ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {result.success ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{result.email}</p>
                        {result.success && result.messageId && (
                          <p className="text-xs text-gray-500">Message ID: {result.messageId}</p>
                        )}
                        {!result.success && result.error && (
                          <p className="text-xs text-red-600">Error: {result.error}</p>
                        )}
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      result.success 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {result.success ? 'ส่งสำเร็จ' : 'ส่งไม่สำเร็จ'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Email Configuration Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 mb-2">การตั้งค่าอีเมลแอดมิน</h3>
              <p className="text-blue-700 text-sm mb-3">
                ระบบจะส่งอีเมลแจ้งเตือนไปยังแอดมินตามที่ตั้งค่าไว้ในไฟล์ .env
              </p>
              <div className="text-sm text-blue-600">
                <p><strong>ตัวแปรในไฟล์ .env:</strong></p>
                <p>• ADMIN_EMAILS=hotelsystem.rmu.ac.th@gmail.com,admin@hotel.com,manager@hotel.com</p>
                <p>• หรือ ADMIN_EMAIL_1=hotelsystem.rmu.ac.th@gmail.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EmailTestPage() {
  return <EmailTestContent />;
}