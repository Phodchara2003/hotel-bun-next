'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/translations';
import QRCodePayment from '@/components/QRCodePayment';

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  
  const [paymentMethod, setPaymentMethod] = useState('qr-promptpay');
  const [bookingDetails, setBookingDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [legacySettings, setLegacySettings] = useState(null);

  // Get booking details from URL params
  const bookingId = searchParams.get('bookingId');
  const amount = searchParams.get('amount');
  const hotelName = searchParams.get('hotelName') || 'โรงแรม Hotel Bun Next';

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    }
    fetchLegacySettings();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/bookings/${bookingId}`);
      if (response.ok) {
        const data = await response.json();
        setBookingDetails(data);
      }
    } catch (err) {
      console.error('Error fetching booking details:', err);
      setError(language === 'en' ? 'Failed to load booking details' : 'ไม่สามารถโหลดข้อมูลการจองได้');
    } finally {
      setLoading(false);
    }
  };

  const fetchLegacySettings = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/simple-payment-settings');
      if (response.ok) {
        const data = await response.json();
        setLegacySettings(data);
      }
    } catch (err) {
      console.error('Error fetching legacy settings:', err);
    }
  };

  const handlePaymentComplete = (result) => {
    // Handle successful payment
    alert(language === 'en' 
      ? 'Payment submitted successfully! Please wait for verification.' 
      : 'ส่งการชำระเงินเรียบร้อย! กรุณารอการตรวจสอบ'
    );
    
    // Redirect to booking confirmation or success page
    window.location.href = `/bookings/${bookingId}?payment=success`;
  };

  const handlePaymentCancel = () => {
    // Handle payment cancellation
    if (confirm(language === 'en' ? 'Cancel payment?' : 'ยกเลิกการชำระเงิน?')) {
      window.location.href = `/bookings/${bookingId}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{language === 'en' ? 'Loading payment details...' : 'กำลังโหลดข้อมูลการชำระเงิน...'}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {language === 'en' ? 'Payment Error' : 'ข้อผิดพลาดการชำระเงิน'}
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
          >
            {language === 'en' ? 'Try Again' : 'ลองใหม่'}
          </button>
        </div>
      </div>
    );
  }

  if (!bookingId || !amount) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <div className="text-yellow-500 text-6xl mb-4">📋</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {language === 'en' ? 'Missing Payment Information' : 'ข้อมูลการชำระเงินไม่ครบถ้วน'}
          </h2>
          <p className="text-gray-600 mb-6">
            {language === 'en' 
              ? 'Booking ID and amount are required for payment.'
              : 'ต้องการรหัสการจองและจำนวนเงินเพื่อชำระเงิน'
            }
          </p>
          <button
            onClick={() => window.location.href = '/bookings'}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
          >
            {language === 'en' ? 'Go to Bookings' : 'ไปยังการจอง'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            {language === 'en' ? 'Payment' : 'ชำระเงิน'}
          </h1>
          <p className="text-gray-600">
            {language === 'en' 
              ? 'Choose your preferred payment method' 
              : 'เลือกวิธีการชำระเงินที่คุณต้องการ'
            }
          </p>
        </div>

        {/* Booking Summary */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {language === 'en' ? 'Booking Summary' : 'สรุปการจอง'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">
                  {language === 'en' ? 'Booking ID:' : 'รหัสการจอง:'}
                </span>
                <p className="font-mono text-blue-600">{bookingId}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">
                  {language === 'en' ? 'Hotel:' : 'โรงแรม:'}
                </span>
                <p>{hotelName}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">
                  {language === 'en' ? 'Total Amount:' : 'จำนวนเงินรวม:'}
                </span>
                <p className="text-2xl font-bold text-green-600">
                  ฿{parseFloat(amount).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {language === 'en' ? 'Payment Method' : 'วิธีการชำระเงิน'}
            </h3>
            
            <div className="space-y-4">
              {/* PromptPay QR Payment */}
              <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="qr-promptpay"
                  checked={paymentMethod === 'qr-promptpay'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mr-4"
                />
                <div className="flex items-center flex-1">
                  <div className="text-3xl mr-4">📱</div>
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      {language === 'en' ? 'PromptPay QR Code' : 'พร้อมเพย์ QR Code'}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {language === 'en' 
                        ? 'Scan QR code with any banking app' 
                        : 'สแกน QR Code ด้วยแอปธนาคารใดก็ได้'
                      }
                    </p>
                  </div>
                </div>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                  {language === 'en' ? 'Recommended' : 'แนะนำ'}
                </span>
              </label>

              {/* Legacy Bank Transfer */}
              {legacySettings && (
                <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="bank-transfer"
                    checked={paymentMethod === 'bank-transfer'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-4"
                  />
                  <div className="flex items-center flex-1">
                    <div className="text-3xl mr-4">🏦</div>
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        {language === 'en' ? 'Bank Transfer' : 'โอนเงินผ่านธนาคาร'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {language === 'en' 
                          ? 'Manual bank transfer with QR code' 
                          : 'โอนเงินด้วยตนเองผ่าน QR Code'
                        }
                      </p>
                    </div>
                  </div>
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Payment Component */}
        <div className="max-w-4xl mx-auto">
          {paymentMethod === 'qr-promptpay' && (
            <QRCodePayment
              bookingId={bookingId}
              amount={parseFloat(amount)}
              hotelName={hotelName}
              onPaymentComplete={handlePaymentComplete}
              onCancel={handlePaymentCancel}
            />
          )}

          {paymentMethod === 'bank-transfer' && legacySettings && (
            <LegacyBankTransfer
              settings={legacySettings}
              bookingId={bookingId}
              amount={amount}
              language={language}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Legacy Bank Transfer Component with Payment Slip Upload
function LegacyBankTransfer({ settings, bookingId, amount, language }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('pending'); // pending, uploading, completed, failed
  const [uploadMessage, setUploadMessage] = useState('');

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // ตรวจสอบประเภทไฟล์
      if (!file.type.startsWith('image/')) {
        alert(language === 'en' ? 'Please select image files only' : 'กรุณาเลือกไฟล์รูปภาพเท่านั้น');
        return;
      }

      // ตรวจสอบขนาดไฟล์ (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert(language === 'en' ? 'File size must not exceed 5MB' : 'ไฟล์รูปภาพต้องมีขนาดไม่เกิน 5MB');
        return;
      }

      setSelectedFile(file);
      setUploadStatus('pending');
    }
  };

  const uploadPaymentSlip = async () => {
    if (!selectedFile) {
      alert(language === 'en' ? 'Please select a payment slip file' : 'กรุณาเลือกไฟล์สลิปการโอนเงิน');
      return;
    }

    try {
      setUploadLoading(true);
      setUploadStatus('uploading');
      setUploadMessage(language === 'en' ? 'Uploading payment slip...' : 'กำลังอัปโหลดสลิป...');

      const formData = new FormData();
      formData.append('paymentSlip', selectedFile);
      formData.append('bookingId', bookingId);
      formData.append('amount', amount);

      const response = await fetch('http://localhost:3003/api/payment-slip/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setUploadStatus('completed');
        setUploadMessage(language === 'en' 
          ? 'Payment slip uploaded successfully! Please wait for verification.' 
          : 'อัปโหลดสลิปการโอนเงินเรียบร้อย! กรุณารอการตรวจสอบ'
        );
        
        // รอสักครู่แล้วรีเฟรช
        setTimeout(() => {
          window.location.href = `/bookings/${bookingId}?payment=pending`;
        }, 2000);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('failed');
      setUploadMessage(language === 'en' 
        ? 'Failed to upload payment slip. Please try again.' 
        : 'อัปโหลดสลิปไม่สำเร็จ กรุณาลองใหม่อีกครั้ง'
      );
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">
        {language === 'en' ? 'Bank Transfer Payment' : 'ชำระเงินโดยการโอน'}
      </h3>
      
          {/* QR Code Display */}
          {settings.qrCodeUrl ? (
            <div className="flex flex-col items-center mb-6">
              <h3 className="text-lg font-medium text-gray-800 mb-3">สแกน QR Code เพื่อชำระเงิน</h3>
              <div className="bg-white p-6 rounded-lg border-2 border-gray-200 shadow-sm">
                <img
                  src={`http://localhost:3003${settings.qrCodeUrl}`}
                  alt="QR Code สำหรับชำระเงิน"
                  className="w-64 h-64 object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <div className="w-64 h-64 bg-gray-100 flex items-center justify-center text-gray-500" style={{display: 'none'}}>
                  <div className="text-center">
                    <div className="text-4xl mb-2">📱</div>
                    <p className="text-sm">ไม่สามารถโหลด QR Code ได้</p>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 text-center mt-3 font-medium">
                สแกน QR Code ด้วยแอปธนาคารของคุณ
              </p>
              <div className="mt-2 text-center">
                <p className="text-2xl font-bold text-green-600">
                  จำนวนเงิน: ฿{parseFloat(amount).toLocaleString()}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 mb-6 py-8">
              <div className="text-6xl mb-2">📱</div>
              <p>ยังไม่มี QR Code สำหรับชำระเงิน</p>
              <p className="text-sm mt-1">กรุณาติดต่อเจ้าหน้าที่โรงแรม</p>
            </div>
          )}      {/* Bank Details */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 className="font-semibold text-gray-800 mb-3">
          {language === 'en' ? 'Bank Details' : 'รายละเอียดบัญชี'}
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="font-medium text-gray-600">
              {language === 'en' ? 'Bank:' : 'ธนาคาร:'}
            </span>
            <span>{settings.bankName || 'ธนาคารกสิกรไทย'}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-600">
              {language === 'en' ? 'Account Number:' : 'เลขที่บัญชี:'}
            </span>
            <span className="font-mono">{settings.accountNumber || '123-4-56789-0'}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-600">
              {language === 'en' ? 'Account Name:' : 'ชื่อบัญชี:'}
            </span>
            <span>{settings.accountName || 'Royal Garden Hotel'}</span>
          </div>
          <div className="flex justify-between border-t pt-2 mt-3">
            <span className="font-medium text-gray-600">
              {language === 'en' ? 'Amount:' : 'จำนวนเงิน:'}
            </span>
            <span className="text-green-600 font-bold text-lg">
              ฿{parseFloat(amount).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Instructions */}
      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <h5 className="font-semibold text-blue-800 mb-2">
          {language === 'en' ? 'Payment Instructions:' : 'วิธีการชำระเงิน:'}
        </h5>
        <ol className="text-sm text-blue-700 space-y-1">
          <li>1. {language === 'en' ? 'Scan QR Code or transfer to the account above' : 'สแกน QR Code หรือโอนเงินไปยังบัญชีข้างต้น'}</li>
          <li>2. {language === 'en' ? 'Transfer the exact amount shown' : 'โอนเงินตามจำนวนที่ระบุ'}</li>
          <li>3. {language === 'en' ? 'Upload your payment slip below' : 'อัปโหลดสลิปการโอนเงินด้านล่าง'}</li>
          <li>4. {language === 'en' ? 'Wait for verification from hotel staff' : 'รอการตรวจสอบจากเจ้าหน้าที่โรงแรม'}</li>
        </ol>
      </div>

      {/* Payment Slip Upload Section */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4 text-center">
          {language === 'en' ? 'Upload Payment Slip' : 'อัปโหลดสลิปการโอนเงิน'}
        </h4>

        {/* File Selection */}
        <div className="text-center mb-4">
          <input
            type="file"
            id="payment-slip"
            accept="image/*"
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
                <p className="text-sm text-gray-500">
                  {language === 'en' ? 'Click to change file' : 'คลิกเพื่อเปลี่ยนไฟล์'}
                </p>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-gray-400 text-2xl mb-2">📄</div>
                <p className="text-gray-600 font-medium">
                  {language === 'en' ? 'Click to select payment slip' : 'คลิกเพื่อเลือกไฟล์สลิป'}
                </p>
                <p className="text-sm text-gray-500">
                  {language === 'en' ? 'JPG, PNG files only (max 5MB)' : 'รองรับไฟล์ JPG, PNG ขนาดไม่เกิน 5MB'}
                </p>
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
                {language === 'en' ? 'Uploading...' : 'กำลังอัปโหลด...'}
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <span className="mr-2">📤</span>
                {language === 'en' ? 'Upload Payment Slip' : 'อัปโหลดสลิปการโอนเงิน'}
              </div>
            )}
          </button>
        )}
      </div>

      {/* Contact Information */}
      <div className="mt-6 bg-yellow-50 rounded-lg p-4 text-center">
        <h5 className="font-semibold text-yellow-800 mb-2">
          {language === 'en' ? 'Need Help?' : 'ต้องการความช่วยเหลือ?'}
        </h5>
        <p className="text-yellow-700 text-sm mb-2">
          {language === 'en' 
            ? 'If you have any issues with payment, please contact us:'
            : 'หากมีปัญหาในการชำระเงิน กรุณาติดต่อเรา:'
          }
        </p>
        <div className="space-y-1 text-sm text-yellow-600">
          <p>📞 {language === 'en' ? 'Phone: 02-123-4567' : 'โทร: 02-123-4567'}</p>
          <p>📧 {language === 'en' ? 'Email: support@hotel.com' : 'อีเมล: support@hotel.com'}</p>
        </div>
      </div>
    </div>
  );
}
