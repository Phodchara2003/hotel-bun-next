'use client';

import { useState, useEffect } from 'react';
import { generatePromptPayQR, generateTransactionRef } from '@/lib/qrcode-generator';
import { DEFAULT_PAYMENT_SETTINGS, SUPPORTED_PAYMENT_APPS } from '@/lib/payment-config';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/translations';
import { useAuth } from '@/contexts/AuthContext';

const QRCodePayment = ({ 
  bookingId, 
  amount, 
  hotelName = "โรงแรม Hotel Bun Next",
  onPaymentComplete,
  onCancel,
  paymentSettings = DEFAULT_PAYMENT_SETTINGS 
}) => {
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const { user } = useAuth();
  const [qrCodeImage, setQrCodeImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(paymentSettings.qrcode.expiryMinutes * 60);
  const [transactionRef, setTransactionRef] = useState(null);
  const [paymentProof, setPaymentProof] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    generateQRCode();
  }, []);

  useEffect(() => {
    // Countdown timer
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const generateQRCode = async () => {
    try {
      setLoading(true);
      setError(null);

      // Generate transaction reference
      const ref = generateTransactionRef(bookingId, user?.id || 'GUEST');
      setTransactionRef(ref);

      // Generate QR Code
      const qrImage = await generatePromptPayQR(
        paymentSettings.promptpay.id,
        amount,
        ref.ref1,
        ref.ref2
      );

      setQrCodeImage(qrImage);
    } catch (err) {
      console.error('Error generating QR Code:', err);
      setError(language === 'en' ? 'Failed to generate QR Code' : 'ไม่สามารถสร้าง QR Code ได้');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target.result);
        setPaymentProof(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitPayment = async () => {
    if (!paymentProof) {
      alert(language === 'en' ? 'Please upload payment slip' : 'กรุณาอัปโหลดสลิปการโอนเงิน');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('bookingId', bookingId);
      formData.append('amount', amount);
      formData.append('paymentMethod', 'promptpay_qr');
      formData.append('transactionRef1', transactionRef.ref1);
      formData.append('transactionRef2', transactionRef.ref2);
      formData.append('paymentSlip', paymentProof);

      const response = await fetch('http://localhost:5680/api/payment/verify-qr-payment', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        onPaymentComplete(result);
      } else {
        throw new Error('Payment verification failed');
      }
    } catch (error) {
      console.error('Payment submission error:', error);
      alert(language === 'en' ? 'Payment verification failed' : 'การยืนยันการชำระเงินล้มเหลว');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2">{language === 'en' ? 'Generating QR Code...' : 'กำลังสร้าง QR Code...'}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-red-500 mb-4">❌ {error}</div>
        <button 
          onClick={generateQRCode}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {language === 'en' ? 'Try Again' : 'ลองใหม่'}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          {language === 'en' ? 'Scan QR Code to Pay' : 'สแกน QR Code เพื่อชำระเงิน'}
        </h3>
        <div className="text-3xl font-bold text-green-600">
          ฿{parseFloat(amount).toLocaleString()}
        </div>
        <div className="text-sm text-gray-600">
          {language === 'en' ? `Booking ID: ${bookingId}` : `รหัสการจอง: ${bookingId}`}
        </div>
      </div>

      {/* Timer */}
      {timeLeft > 0 ? (
        <div className="text-center mb-4">
          <div className="text-sm text-gray-600 mb-1">
            {language === 'en' ? 'Time remaining' : 'เหลือเวลา'}
          </div>
          <div className="text-lg font-mono text-red-500">
            {formatTime(timeLeft)}
          </div>
        </div>
      ) : (
        <div className="text-center mb-4 text-red-500">
          {language === 'en' ? 'QR Code expired' : 'QR Code หมดอายุแล้ว'}
        </div>
      )}

      {/* QR Code */}
      <div className="text-center mb-6">
        {qrCodeImage && timeLeft > 0 ? (
          <img 
            src={qrCodeImage} 
            alt="PromptPay QR Code" 
            className="mx-auto border-2 border-gray-200 rounded-lg"
          />
        ) : (
          <div className="w-64 h-64 mx-auto bg-gray-200 rounded-lg flex items-center justify-center">
            <button 
              onClick={generateQRCode}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              {language === 'en' ? 'Generate New QR' : 'สร้าง QR ใหม่'}
            </button>
          </div>
        )}
      </div>

      {/* Payment Info */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="text-center text-sm text-gray-700">
          <div className="font-semibold">{paymentSettings.promptpay.name}</div>
          <div className="text-gray-600">PromptPay: {paymentSettings.promptpay.id}</div>
          {transactionRef && (
            <div className="text-xs text-gray-500 mt-2">
              <div>Ref1: {transactionRef.ref1}</div>
              <div>Ref2: {transactionRef.ref2}</div>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <h4 className="font-semibold text-blue-800 mb-2">
          {language === 'en' ? 'How to pay:' : 'วิธีชำระเงิน:'}
        </h4>
        <ol className="text-sm text-blue-700 space-y-1">
          <li>1. {language === 'en' ? 'Open your banking app' : 'เปิดแอปธนาคารของคุณ'}</li>
          <li>2. {language === 'en' ? 'Scan this QR code' : 'สแกน QR Code นี้'}</li>
          <li>3. {language === 'en' ? 'Confirm the payment' : 'ยืนยันการชำระเงิน'}</li>
          <li>4. {language === 'en' ? 'Upload payment slip below' : 'อัปโหลดสลิปการโอนด้านล่าง'}</li>
        </ol>
      </div>

      {/* Supported Apps */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">
          {language === 'en' ? 'Supported Apps:' : 'แอปที่รองรับ:'}
        </h4>
        <div className="flex flex-wrap gap-2">
          {SUPPORTED_PAYMENT_APPS.map((app, index) => (
            <div key={index} className="text-xs bg-gray-100 rounded-full px-3 py-1">
              {app.icon} {app.name}
            </div>
          ))}
        </div>
      </div>

      {/* Upload Payment Slip */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {language === 'en' ? 'Upload Payment Slip:' : 'อัปโหลดสลิปการโอน:'}
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {uploadedImage && (
          <div className="mt-3">
            <img 
              src={uploadedImage} 
              alt="Payment slip" 
              className="w-full max-w-xs mx-auto rounded-lg border"
            />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          onClick={onCancel}
          className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
        >
          {language === 'en' ? 'Cancel' : 'ยกเลิก'}
        </button>
        <button
          onClick={handleSubmitPayment}
          disabled={!paymentProof || isSubmitting}
          className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting 
            ? (language === 'en' ? 'Verifying...' : 'กำลังตรวจสอบ...') 
            : (language === 'en' ? 'Confirm Payment' : 'ยืนยันการชำระเงิน')
          }
        </button>
      </div>
    </div>
  );
};

export default QRCodePayment;
