'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LanguageContext';
import QRCodePayment from '@/components/QRCodePayment';

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { t, language } = useTranslation();
  
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
      // เพิ่ม timestamp เพื่อป้องกัน cache
      const timestamp = new Date().getTime();
      // เรียก admin payment settings เพื่อใช้ข้อมูลที่แอดมินตั้งค่า
      const response = await fetch(`http://localhost:3001/api/admin/payment-settings?t=${timestamp}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      if (response.ok) {
        const result = await response.json();
        console.log('📋 Admin payment settings loaded:', result);
        
        if (result.success && result.data) {
          // แปลงข้อมูลให้เข้ากับรูปแบบเดิม
          const legacyFormat = {
            qrCodeUrl: result.data.promptPay.qrCodeUrl,
            bankName: result.data.bankTransfer.bankName,
            bankAccount: result.data.bankTransfer.accountNumber,
            accountName: result.data.bankTransfer.accountName,
            phoneNumber: result.data.promptPay.phoneNumber
          };
          
          console.log('🔄 Legacy format for enhanced page:', legacyFormat);
          setLegacySettings(legacyFormat);
        }
      } else {
        console.log('⚠️ Admin API failed, trying fallback...');
        // ลองใช้ API ธรรมดา (ถ้ามี)
        const fallbackResponse = await fetch('http://localhost:3001/api/simple-payment-settings');
        if (fallbackResponse.ok) {
          const fallbackResult = await fallbackResponse.json();
          if (fallbackResult.success) {
            setLegacySettings(fallbackResult.data);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching legacy settings:', error);
      // ใช้ค่าเริ่มต้นถ้าไม่สามารถดึงข้อมูลได้
      setLegacySettings({
        qrCodeUrl: '/uploads/qr-code.svg',
        bankName: 'ธนาคารกสิกรไทย',
        bankAccount: '123-4-56789-0',
        accountName: 'Hotel Booking System',
        phoneNumber: '081-234-5678'
      });
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

// Legacy Bank Transfer Component
function LegacyBankTransfer({ settings, bookingId, amount, language }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">
        {language === 'en' ? 'Bank Transfer Payment' : 'ชำระเงินโดยการโอน'}
      </h3>
      
      {settings.qrCodeUrl ? (
        <div className="flex flex-col items-center mb-6">
          <img
            src={`http://localhost:3001${settings.qrCodeUrl}`}
            alt="QR Code สำหรับชำระเงิน"
            className="w-64 h-64 object-contain border rounded-lg mb-4"
          />
          <p className="text-gray-600 text-center">
            {language === 'en' 
              ? 'Scan QR Code to transfer money'
              : 'สแกน QR Code เพื่อโอนเงิน'
            }
          </p>
        </div>
      ) : (
        <div className="text-center text-gray-400 mb-6">
          {language === 'en' ? 'No QR Code available' : 'ยังไม่มี QR Code สำหรับชำระเงิน'}
        </div>
      )}
      
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 className="font-semibold text-gray-800 mb-3">
          {language === 'en' ? 'Bank Details' : 'รายละเอียดบัญชี'}
        </h4>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium text-gray-600">
              {language === 'en' ? 'Bank:' : 'ธนาคาร:'}
            </span>
            <span className="ml-2">{settings.bankName || '-'}</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">
              {language === 'en' ? 'Account Number:' : 'เลขที่บัญชี:'}
            </span>
            <span className="ml-2 font-mono">{settings.accountNumber || '-'}</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">
              {language === 'en' ? 'Account Name:' : 'ชื่อบัญชี:'}
            </span>
            <span className="ml-2">{settings.accountName || '-'}</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">
              {language === 'en' ? 'Amount:' : 'จำนวนเงิน:'}
            </span>
            <span className="ml-2 text-green-600 font-bold">
              ฿{parseFloat(amount).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-4">
        <h5 className="font-semibold text-blue-800 mb-2">
          {language === 'en' ? 'Instructions:' : 'วิธีการชำระเงิน:'}
        </h5>
        <ol className="text-sm text-blue-700 space-y-1">
          <li>1. {language === 'en' ? 'Transfer the exact amount to the account above' : 'โอนเงินจำนวนที่ระบุไปยังบัญชีข้างต้น'}</li>
          <li>2. {language === 'en' ? 'Take a screenshot of the transaction' : 'ถ่ายหน้าจอการทำรายการ'}</li>
          <li>3. {language === 'en' ? 'Contact hotel staff to confirm payment' : 'ติดต่อเจ้าหน้าที่โรงแรมเพื่อยืนยันการชำระเงิน'}</li>
        </ol>
      </div>
    </div>
  );
}
