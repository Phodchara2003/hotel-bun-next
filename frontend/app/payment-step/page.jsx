'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function PaymentStepPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const [paymentSettings, setPaymentSettings] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('pending');
  const [uploadMessage, setUploadMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [paymentChanges, setPaymentChanges] = useState([]);
  const [showChangeNotification, setShowChangeNotification] = useState(false);

  // รับข้อมูลจาก URL
  const bookingData = {
    bookingId: searchParams.get('bookingId'),
    roomName: searchParams.get('roomName'),
    hotelName: searchParams.get('hotelName'),
    checkIn: searchParams.get('checkIn'),
    checkOut: searchParams.get('checkOut'),
    guests: searchParams.get('guests'),
    guestName: searchParams.get('guestName'),
    guestEmail: searchParams.get('guestEmail'),
    guestPhone: searchParams.get('guestPhone'),
    total: parseFloat(searchParams.get('total'))
  };

  useEffect(() => {
    fetchPaymentSettings();
    fetchRecentPaymentChanges();
  }, []);

  const fetchPaymentSettings = async () => {
    try {
      setLoading(true);
      // เพิ่ม timestamp เพื่อป้องกัน cache
      const timestamp = new Date().getTime();
      // เรียก admin payment settings เพื่อใช้ข้อมูลที่แอดมินตั้งค่า
      const response = await fetch(`http://localhost:3001/api/admin/payment-settings?t=${timestamp}`, {
        method: 'GET'
      });
      if (response.ok) {
        const result = await response.json();
        console.log('📋 Admin payment settings loaded for payment step:', result);
        
        if (result.success && result.data) {
          // แปลงข้อมูลให้เข้ากับรูปแบบเดิม
          const legacyFormat = {
            qrCodeUrl: result.data.promptPay.qrCodeUrl,
            bankName: result.data.bankTransfer.bankName,
            bankAccount: result.data.bankTransfer.accountNumber,
            accountName: result.data.bankTransfer.accountName,
            phoneNumber: result.data.promptPay.phoneNumber
          };
          setPaymentSettings(legacyFormat);
          console.log('💾 Payment step settings:', legacyFormat);
        }
      } else {
        console.warn('❌ Failed to load admin settings for payment step, falling back to simple settings');
        // Fallback เรียก simple settings
        const fallbackResponse = await fetch('http://localhost:3001/api/simple-payment-settings');
        if (fallbackResponse.ok) {
          const fallbackResult = await fallbackResponse.json();
          if (fallbackResult.success && fallbackResult.data) {
            setPaymentSettings(fallbackResult.data);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching payment settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentPaymentChanges = async () => {
    try {
      // ดึง payment changes ย้อนหลัง 24 ชั่วโมง
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const since = yesterday.toISOString().split('T')[0];
      
      const response = await fetch(`http://localhost:3001/api/payment-settings-changes?limit=5&since=${since}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data && result.data.length > 0) {
          setPaymentChanges(result.data);
          setShowChangeNotification(true);
          console.log('📋 Recent payment changes:', result.data);
        }
      }
    } catch (err) {
      console.error('Error fetching payment changes:', err);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // ตรวจสอบประเภทไฟล์
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        alert('กรุณาเลือกไฟล์รูปภาพ (JPG, PNG) หรือ PDF เท่านั้น');
        return;
      }

      // ตรวจสอบขนาดไฟล์ (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('ไฟล์ต้องมีขนาดไม่เกิน 5MB');
        return;
      }

      setSelectedFile(file);
      setUploadStatus('pending');
    }
  };

  const uploadPaymentSlip = async () => {
    if (!selectedFile) {
      alert('กรุณาเลือกไฟล์สลิปการโอนเงิน');
      return;
    }

    try {
      setUploadLoading(true);
      setUploadStatus('uploading');
      setUploadMessage('กำลังอัปโหลดสลิป...');

      const formData = new FormData();
      formData.append('paymentSlip', selectedFile);
      formData.append('bookingId', bookingData.bookingId);
      formData.append('user_id', user?.id || 1);
      formData.append('amount', bookingData.total);

      const response = await fetch('http://localhost:3001/api/payment-slip/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setUploadStatus('completed');
        setUploadMessage('อัปโหลดสลิปการโอนเงินเรียบร้อย! กรุณารอการตรวจสอบ');
        
        // รอสักครู่แล้วไปหน้าสำเร็จ
        setTimeout(() => {
          router.push(`/booking-success?bookingId=1&amount=${bookingData.total}`);
        }, 2000);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('failed');
      setUploadMessage('อัปโหลดสลิปไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setUploadLoading(false);
    }
  };

  const calculateNights = () => {
    if (!bookingData.checkIn || !bookingData.checkOut) return 1;
    const checkIn = new Date(bookingData.checkIn);
    const checkOut = new Date(bookingData.checkOut);
    return Math.max(1, Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูลการชำระเงิน...</p>
        </div>
      </div>
    );
  }

  if (!bookingData.bookingId || !bookingData.total || isNaN(bookingData.total)) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">ข้อมูลการจองไม่ครบถ้วน</h1>
            <p className="text-gray-600 mb-6">กรุณาทำการจองใหม่</p>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
            >
              กลับไปหน้าแรก
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">ชำระเงิน</h1>
          <p className="text-gray-600">ขั้นตอนที่ 2: ชำระเงินและอัปโหลดสลิป</p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Booking Summary */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">สรุปการจอง</h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">ห้องพัก:</span>
                  <span>{bookingData.roomName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">โรงแรม:</span>
                  <span>{bookingData.hotelName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">วันที่เข้าพัก:</span>
                  <span>{bookingData.checkIn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">วันที่ออก:</span>
                  <span>{bookingData.checkOut}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">จำนวนคืน:</span>
                  <span>{calculateNights()} คืน</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">จำนวนผู้เข้าพัก:</span>
                  <span>{bookingData.guests} คน</span>
                </div>
                <div className="flex justify-between border-t pt-3">
                  <span className="font-medium text-gray-600">ชื่อผู้จอง:</span>
                  <span>{bookingData.guestName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">อีเมล:</span>
                  <span>{bookingData.guestEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">เบอร์โทร:</span>
                  <span>{bookingData.guestPhone}</span>
                </div>
                <div className="border-t pt-3 flex justify-between font-bold text-lg">
                  <span>ยอดรวมทั้งหมด:</span>
                  <span className="text-green-600">฿{bookingData.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Payment Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">ชำระเงิน</h2>
              
              {/* QR Code Display */}
              {paymentSettings?.qrCodeUrl ? (
                <div className="flex flex-col items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-3">สแกน QR Code เพื่อชำระเงิน</h3>
                  <div className="bg-white p-6 rounded-lg border-2 border-gray-200 shadow-sm">
                    <img
                      src={`http://localhost:3001${paymentSettings.qrCodeUrl}`}
                      alt="QR Code สำหรับชำระเงิน"
                      className="w-64 h-64 object-contain"
                      onLoad={() => console.log('QR Code loaded successfully')}
                      onError={(e) => {
                        console.error('QR Code failed to load:', `http://localhost:3001${paymentSettings.qrCodeUrl}`);
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <div className="w-64 h-64 bg-gray-100 flex items-center justify-center text-gray-500" style={{display: 'none'}}>
                      <div className="text-center">
                        <div className="text-4xl mb-2">📱</div>
                        <p className="text-sm">ไม่สามารถโหลด QR Code ได้</p>
                        <p className="text-xs text-gray-400 mt-1">{paymentSettings.qrCodeUrl}</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 text-center mt-3 font-medium">
                    สแกน QR Code ด้วยแอปธนาคารของคุณ
                  </p>
                  <div className="mt-2 text-center">
                    <p className="text-2xl font-bold text-green-600">
                      จำนวนเงิน: ฿{bookingData.total.toLocaleString()}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400 mb-6 py-8">
                  <div className="text-6xl mb-2">📱</div>
                  <p>ยังไม่มี QR Code สำหรับชำระเงิน</p>
                  <p className="text-sm mt-1">กรุณาติดต่อเจ้าหน้าที่โรงแรม</p>
                </div>
              )}

              {/* Bank Details */}
              {paymentSettings && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3">รายละเอียดบัญชี</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">ธนาคาร:</span>
                      <span>{paymentSettings.bankName || 'ธนาคารกสิกรไทย'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">เลขที่บัญชี:</span>
                      <span className="font-mono">{paymentSettings.bankAccount || '123-4-56789-0'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">ชื่อบัญชี:</span>
                      <span>{paymentSettings.accountName || 'Hotel Booking System'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Instructions */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h5 className="font-semibold text-blue-800 mb-2">วิธีการชำระเงิน:</h5>
                <ol className="text-sm text-blue-700 space-y-1">
                  <li>1. สแกน QR Code หรือโอนเงินไปยังบัญชีข้างต้น</li>
                  <li>2. โอนเงินตามจำนวนที่ระบุ</li>
                  <li>3. อัปโหลดสลิปการโอนเงินด้านล่าง</li>
                  <li>4. รอการตรวจสอบจากเจ้าหน้าที่โรงแรม</li>
                </ol>
              </div>

              {/* Upload Section */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                  อัปโหลดสลิปการโอนเงิน
                </h4>

                {/* File Selection */}
                <div className="text-center mb-4">
                  <input
                    type="file"
                    id="payment-slip"
                    accept="image/*,.pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={uploadStatus === 'completed'}
                  />
                  
                  <label
                    htmlFor="payment-slip"
                    className={`cursor-pointer inline-block px-6 py-3 rounded-lg border-2 border-gray-300 hover:border-blue-500 transition-colors ${
                      uploadStatus === 'completed' ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {selectedFile ? (
                      <div className="text-center">
                        <div className="text-green-500 text-2xl mb-2">✅</div>
                        <p className="text-green-600 font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-gray-500">คลิกเพื่อเปลี่ยนไฟล์</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="text-gray-400 text-2xl mb-2">📄</div>
                        <p className="text-gray-600 font-medium">คลิกเพื่อเลือกไฟล์สลิป</p>
                        <p className="text-sm text-gray-500">รองรับไฟล์ JPG, PNG, PDF ขนาดไม่เกิน 5MB</p>
                      </div>
                    )}
                  </label>
                </div>

                {/* Upload Status */}
                {uploadStatus !== 'pending' && (
                  <div className="text-center mb-4">
                    {uploadStatus === 'uploading' && (
                      <div className="text-blue-600">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p>{uploadMessage}</p>
                      </div>
                    )}
                    
                    {uploadStatus === 'completed' && (
                      <div className="text-green-600">
                        <div className="text-2xl mb-2">✅</div>
                        <p className="font-medium">{uploadMessage}</p>
                      </div>
                    )}
                    
                    {uploadStatus === 'failed' && (
                      <div className="text-red-600">
                        <div className="text-2xl mb-2">❌</div>
                        <p className="font-medium">{uploadMessage}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Upload Button */}
                {uploadStatus !== 'completed' && (
                  <button
                    onClick={uploadPaymentSlip}
                    disabled={!selectedFile || uploadLoading}
                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {uploadLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        กำลังอัปโหลด...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <span className="mr-2">📤</span>
                        อัปโหลดสลิปการโอนเงิน
                      </div>
                    )}
                  </button>
                )}
              </div>

              {/* Navigation */}
              <div className="flex justify-between mt-6">
                <button
                  onClick={() => router.back()}
                  className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  ← กลับไปแก้ไขข้อมูล
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}