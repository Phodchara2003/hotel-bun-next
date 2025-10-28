'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { bookingAPI, paymentAPI, authAPI } from '../../../lib/api';
import { 
  CreditCard, 
  User, 
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Upload,
  ImageIcon,
  Building2,
  QrCode,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CreatePaymentPageAnimated() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState(null);
  const [paymentReceiptFile, setPaymentReceiptFile] = useState(null);
  const [paymentReceiptUrl, setPaymentReceiptUrl] = useState('');
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [isBookingSubmitted, setIsBookingSubmitted] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState(null);
  const [customerInfo, setCustomerInfo] = useState({
    guestName: '',
    guestPhone: '',
    guestEmail: '',
    guestAddress: '',
    guestIdNumber: '',
    specialRequests: ''
  });
  
  // State สำหรับ flip card animation
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('bank'); // 'bank' หรือ 'qr'

  useEffect(() => {
    if (isAuthenticated) {
      loadBookingData();
      fetchPaymentSettings();
      fetchUserProfile();
    }
  }, [isAuthenticated]);

  const loadBookingData = () => {
    try {
      const storedData = localStorage.getItem('pendingBookingData');
      if (!storedData) {
        toast.error('ไม่พบข้อมูลการจอง กรุณาเริ่มใหม่');
        router.push('/');
        return;
      }
      
      const data = JSON.parse(storedData);
      console.log('🔍 Loaded booking data with bed_type:', data.bed_type);
      setBookingData(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading booking data:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      router.push('/');
    }
  };

  const fetchPaymentSettings = async () => {
    try {
      const result = await paymentAPI.getPaymentSettings();
      if (result.success && result.data) {
        const paymentData = {
          success: true,
          data: {
            qrCodeUrl: result.data.qr_code_url || '/uploads/qr-codes/qr-code.jpg',
            bankName: result.data.bank_name || 'ธนาคารกสิกรไทย',
            bankAccount: result.data.bank_account || '123-456-7890',
            accountName: result.data.account_name || 'โรงแรมวรุณภัฏ',
            phoneNumber: result.data.phone_number || '081-234-5678'
          }
        };
        setPaymentSettings(paymentData);
      }
    } catch (error) {
      console.error('Error fetching payment settings:', error);
      setPaymentSettings({
        success: true,
        data: {
          qrCodeUrl: '/uploads/qr-codes/qr-code.jpg',
          bankName: 'ธนาคารกสิกรไทย',
          bankAccount: '123-456-7890',
          accountName: 'โรงแรมวรุณภัฏ',
          phoneNumber: '081-234-5678'
        }
      });
    }
  };

  const fetchUserProfile = async () => {
    try {
      let token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];
      
      if (!token && typeof window !== 'undefined') {
        token = localStorage.getItem('auth_token_persistent') || 
                localStorage.getItem('auth_token_backup');
      }
      
      if (!token) {
        console.warn('No token found for profile loading');
        return;
      }

      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.profile) {
          const profile = data.profile;
          setCustomerInfo(prev => ({
            ...prev,
            guestEmail: profile.email || '',
            guestName: profile.firstName && profile.lastName ? `${profile.firstName} ${profile.lastName}` : (profile.first_name && profile.last_name ? `${profile.first_name} ${profile.last_name}` : ''),
            guestPhone: profile.phone || '',
            guestAddress: profile.address || '',
            guestIdNumber: profile.nationalId || profile.national_id || ''
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      if (user) {
        setCustomerInfo(prev => ({
          ...prev,
          guestEmail: user.email || '',
          guestName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : (user.name || ''),
          guestPhone: user.phone || '',
          guestAddress: user.address || '',
          guestIdNumber: user.national_id || user.nationalId || user.id_number || ''
        }));
      }
    }
  };

  const handleCustomerInfoChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleReceiptFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.match(/^image\/(jpeg|jpg|png|gif)$/)) {
        toast.error('กรุณาเลือกไฟล์รูปภาพ (JPEG, PNG, GIF)');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error('ไฟล์รูปภาพต้องมีขนาดไม่เกิน 5MB');
        return;
      }
      
      setPaymentReceiptFile(file);
      const previewUrl = URL.createObjectURL(file);
      setPaymentReceiptUrl(previewUrl);
    }
  };

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // ฟังก์ชันสำหรับเปลี่ยนวิธีการชำระเงิน
  const handlePaymentMethodChange = (method) => {
    setSelectedPaymentMethod(method);
    setIsCardFlipped(method === 'qr');
  };

  const handlePaymentConfirm = async () => {
    if (isBookingSubmitted || isUploadingReceipt) {
      toast.error('กำลังดำเนินการอยู่ กรุณารอสักครู่...');
      return;
    }

    if (!paymentReceiptFile) {
      toast.error('กรุณาอัพโหลดรูปใบเสร็จการชำระเงิน');
      return;
    }

    if (!customerInfo.guestName.trim() || !customerInfo.guestPhone.trim() || 
        !customerInfo.guestEmail.trim() || !customerInfo.guestIdNumber.trim()) {
      toast.error('กรุณากรอกข้อมูลผู้เข้าพักให้ครบถ้วน');
      return;
    }

    try {
      setIsBookingSubmitted(true);
      setIsUploadingReceipt(true);
      
      console.log('🔄 Starting booking creation process...');
      
      const completeBookingData = {
        ...bookingData,
        guest_name: customerInfo.guestName,
        guest_phone: customerInfo.guestPhone,
        guest_email: customerInfo.guestEmail,
        guest_national_id: customerInfo.guestIdNumber,
        guest_address: customerInfo.guestAddress,
        special_requests: customerInfo.specialRequests
      };

      console.log('🔍 Creating booking with complete data:', completeBookingData);
      
      const bookingResponse = await bookingAPI.createBooking(completeBookingData);
      
      if (!bookingResponse.success) {
        throw new Error(bookingResponse.message || 'การสร้างการจองล้มเหลว');
      }
      
      const bookingId = bookingResponse.data?.id;
      if (!bookingId) {
        throw new Error('ไม่ได้รับ ID การจอง');
      }
      
      console.log('✅ Booking created successfully with ID:', bookingId);
      
      const base64 = await convertFileToBase64(paymentReceiptFile);
      
      await bookingAPI.uploadPaymentReceipt(
        bookingId, 
        base64, 
        paymentReceiptFile.name, 
        paymentReceiptFile.size
      );
      
      console.log('✅ Payment receipt uploaded successfully');
      
      localStorage.removeItem('pendingBookingData');
      
      toast.success('จองสำเร็จและอัพโหลดใบเสร็จเรียบร้อยแล้ว!');
      
      setTimeout(() => {
        const successUrl = new URLSearchParams({
          bookingId: bookingId,
          reference: bookingResponse.data?.booking_reference || '',
          roomName: bookingResponse.data?.room_type_name || '',
          roomNumber: bookingResponse.data?.room_number || '',
          floor: bookingResponse.data?.floor || '',
          hotelName: bookingResponse.data?.hotel_name || '',
          checkIn: completeBookingData.check_in_date,
          checkOut: completeBookingData.check_out_date,
          guests: completeBookingData.guests,
          guestName: completeBookingData.guest_name,
          guestEmail: completeBookingData.guest_email,
          guestPhone: completeBookingData.guest_phone,
          total: completeBookingData.total_price
        }).toString();
        
        router.push(`/booking-success?${successUrl}`);
      }, 2000);
      
    } catch (error) {
      console.error('❌ Error creating booking or uploading receipt:', error);
      toast.error(error.message || 'เกิดข้อผิดพลาดในการสร้างการจองหรืออัพโหลดใบเสร็จ');
      setIsBookingSubmitted(false);
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">กรุณาเข้าสู่ระบบ</h2>
          <p className="text-gray-600">เพื่อดำเนินการชำระเงิน</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">ไม่พบข้อมูลการจอง</h2>
          <p className="text-gray-600">กรุณาเริ่มต้นการจองใหม่</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <style jsx>{`
        .flip-card {
          background-color: transparent;
          perspective: 1000px;
        }
        
        .flip-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          text-align: center;
          transition: transform 0.8s;
          transform-style: preserve-3d;
        }
        
        .flip-card.flipped .flip-card-inner {
          transform: rotateY(180deg);
        }
        
        .flip-card-front, .flip-card-back {
          position: absolute;
          width: 100%;
          height: 100%;
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
          border-radius: 0.5rem;
        }
        
        .flip-card-back {
          transform: rotateY(180deg);
        }
        
        .payment-method-selector {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
        }
        
        .payment-method-btn {
          flex: 1;
          padding: 1rem;
          border: 2px solid #e5e7eb;
          border-radius: 0.5rem;
          background: white;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-weight: 600;
        }
        
        .payment-method-btn:hover {
          border-color: #10b981;
          background-color: #f0f9ff;
        }
        
        .payment-method-btn.active {
          border-color: #10b981;
          background-color: #dcfce7;
          color: #166534;
        }
      `}</style>

      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-4">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-700 hover:text-gray-900 mb-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            กลับ
          </button>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-1">ชำระเงิน</h1>
          <p className="text-sm text-gray-600">กรอกข้อมูลและอัพโหลดใบเสร็จเพื่อยืนยันการจอง</p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Customer Information */}
            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <User className="h-6 w-6 mr-3 text-green-600" />
                ข้อมูลผู้เข้าพัก
              </h2>
              <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-700 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  ข้อมูลถูกดึงมาจากโปรไฟล์ของคุณ คุณสามารถแก้ไขได้หากต้องการ
                </p>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">ชื่อ-นามสกุล *</label>
                    <input
                      type="text"
                      name="guestName"
                      value={customerInfo.guestName}
                      onChange={handleCustomerInfoChange}
                      className="w-full px-4 py-3 text-base bg-white border-2 border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                      required
                      placeholder="ชื่อจริง นามสกุล"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">เบอร์โทรศัพท์ *</label>
                    <input
                      type="tel"
                      name="guestPhone"
                      value={customerInfo.guestPhone}
                      onChange={handleCustomerInfoChange}
                      className="w-full px-4 py-3 text-base bg-white border-2 border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                      required
                      placeholder="08X-XXX-XXXX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">อีเมล *</label>
                    <input
                      type="email"
                      name="guestEmail"
                      value={customerInfo.guestEmail}
                      onChange={handleCustomerInfoChange}
                      className="w-full px-4 py-3 text-base bg-white border-2 border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                      required
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">รหัสบัตรประชาชน *</label>
                    <input
                      type="text"
                      name="guestIdNumber"
                      value={customerInfo.guestIdNumber}
                      onChange={handleCustomerInfoChange}
                      className="w-full px-4 py-3 text-base bg-white border-2 border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                      required
                      placeholder="X-XXXX-XXXXX-XX-X"
                      maxLength="17"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">ที่อยู่</label>
                    <textarea
                      name="guestAddress"
                      value={customerInfo.guestAddress}
                      onChange={handleCustomerInfoChange}
                      rows="3"
                      className="w-full px-4 py-3 text-base bg-white border-2 border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                      placeholder="ที่อยู่ (ไม่บังคับ)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">ความต้องการพิเศษ</label>
                    <textarea
                      name="specialRequests"
                      value={customerInfo.specialRequests}
                      onChange={handleCustomerInfoChange}
                      rows="3"
                      className="w-full px-4 py-3 text-base bg-white border-2 border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                      placeholder="เตียงเสริม, ห้องติดกัน, อื่นๆ"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Payment Information with Flip Card */}
            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <CreditCard className="h-6 w-6 mr-3 text-green-600" />
                ข้อมูลการชำระเงิน
              </h2>

              {paymentSettings ? (
                <div className="space-y-6">
                  {/* Payment Method Selector */}
                  <div className="payment-method-selector">
                    <div 
                      className={`payment-method-btn ${selectedPaymentMethod === 'bank' ? 'active' : ''}`}
                      onClick={() => handlePaymentMethodChange('bank')}
                    >
                      <Building2 className="h-5 w-5" />
                      ชำระผ่านธนาคาร
                    </div>
                    <div 
                      className={`payment-method-btn ${selectedPaymentMethod === 'qr' ? 'active' : ''}`}
                      onClick={() => handlePaymentMethodChange('qr')}
                    >
                      <QrCode className="h-5 w-5" />
                      ชำระผ่าน QR Code
                    </div>
                  </div>

                  {/* Flip Card Container */}
                  <div className={`flip-card ${isCardFlipped ? 'flipped' : ''}`} style={{ height: '400px' }}>
                    <div className="flip-card-inner">
                      {/* Front: Bank Information */}
                      <div className="flip-card-front bg-gradient-to-br from-green-50 to-green-100 p-6 border-2 border-green-200 shadow-lg">
                        <div className="h-full flex flex-col justify-center">
                          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center justify-center">
                            <Building2 className="h-6 w-6 mr-3 text-green-600" />
                            ข้อมูลธนาคาร
                          </h3>
                          
                          <div className="space-y-4">
                            <div className="bg-white rounded-lg p-4 border-2 border-green-100 shadow-sm">
                              <span className="text-gray-600 block mb-2 text-sm font-medium">ธนาคาร</span>
                              <span className="text-gray-900 font-bold text-lg">{paymentSettings.data.bankName}</span>
                            </div>
                            <div className="bg-white rounded-lg p-4 border-2 border-green-100 shadow-sm">
                              <span className="text-gray-600 block mb-2 text-sm font-medium">ชื่อบัญชี</span>
                              <span className="text-gray-900 font-bold text-lg">{paymentSettings.data.accountName}</span>
                            </div>
                            <div className="bg-white rounded-lg p-4 border-2 border-green-100 shadow-sm">
                              <span className="text-gray-600 block mb-2 text-sm font-medium">เลขที่บัญชี</span>
                              <span className="text-gray-900 font-bold text-xl font-mono tracking-wider">{paymentSettings.data.bankAccount}</span>
                            </div>
                            {paymentSettings.data.phoneNumber && (
                              <div className="bg-white rounded-lg p-4 border-2 border-green-100 shadow-sm">
                                <span className="text-gray-600 block mb-2 text-sm font-medium">PromptPay</span>
                                <span className="text-gray-900 font-bold text-xl font-mono tracking-wider">{paymentSettings.data.phoneNumber}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-4 text-center">
                            <p className="text-green-600 font-bold text-xl">จำนวน: ฿{bookingData?.total_price?.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>

                      {/* Back: QR Code */}
                      <div className="flip-card-back bg-gradient-to-br from-blue-50 to-blue-100 p-6 border-2 border-blue-200 shadow-lg">
                        <div className="h-full flex flex-col justify-center items-center">
                          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                            <QrCode className="h-6 w-6 mr-3 text-blue-600" />
                            QR Code สำหรับชำระเงิน
                          </h3>
                          
                          {paymentSettings.data.qrCodeUrl && (
                            <div className="bg-white rounded-lg p-4 shadow-lg border-2 border-blue-300 mb-4">
                              <img 
                                src={`http://localhost:5680${paymentSettings.data.qrCodeUrl}`} 
                                alt="QR Code สำหรับชำระเงิน" 
                                className="w-48 h-48 object-contain mx-auto"
                                onError={(e) => {
                                  console.error('❌ Failed to load QR Code image:', e.target.src);
                                }}
                              />
                            </div>
                          )}
                          
                          <p className="text-gray-700 font-semibold text-base text-center mb-2">สแกน QR Code ด้านบนเพื่อชำระเงิน</p>
                          <p className="text-blue-600 font-bold text-xl">จำนวน: ฿{bookingData?.total_price?.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Receipt Upload Section */}
                  <div className="bg-green-50 rounded-lg p-6 border-2 border-green-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <Upload className="h-6 w-6 mr-3 text-green-600" />
                      อัพโหลดใบเสร็จการโอนเงิน
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="bg-green-100 border-2 border-green-300 rounded-lg p-4">
                        <p className="text-gray-700 text-sm font-semibold">
                          เลือกไฟล์รูปภาพใบเสร็จ (JPEG, PNG, GIF - ไม่เกิน 5MB)
                        </p>
                      </div>
                      
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif"
                        onChange={handleReceiptFileChange}
                        className="block w-full text-sm text-gray-700 file:mr-3 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-100 file:text-green-700 hover:file:bg-green-200 bg-white border-2 border-green-300 rounded-lg"
                      />
                      
                      {paymentReceiptUrl && (
                        <div className="border-2 border-green-300 rounded-lg p-6 bg-white shadow-lg">
                          <p className="text-base text-gray-900 mb-4 text-center font-bold">ใบเสร็จที่อัพโหลดแล้ว</p>
                          <div className="flex justify-center">
                            <img
                              src={paymentReceiptUrl}
                              alt="ใบเสร็จการโอนเงิน"
                              className="max-w-full max-h-80 object-contain border-2 border-gray-300 rounded-lg shadow-lg"
                            />
                          </div>
                        </div>
                      )}
                      
                      <button
                        onClick={handlePaymentConfirm}
                        disabled={!paymentReceiptFile || isUploadingReceipt || isBookingSubmitted}
                        className={`bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-4 px-6 rounded-lg shadow-lg flex items-center justify-center w-full transition-all duration-200 ${
                          !paymentReceiptFile || isUploadingReceipt || isBookingSubmitted ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl transform hover:scale-105'
                        }`}
                      >
                        {isUploadingReceipt ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                            กำลังสร้างการจองและอัพโหลด...
                          </>
                        ) : isBookingSubmitted ? (
                          <>
                            <CheckCircle className="h-6 w-6 mr-3" />
                            การจองเสร็จสิ้นแล้ว
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-6 w-6 mr-3" />
                            ยืนยันการจองและชำระเงิน
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">กำลังโหลดข้อมูลการชำระเงิน...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}