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
  RefreshCw,
  Landmark,
  UserCircle,
  Hash,
  Smartphone,
  DollarSign,
  Copy,
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import './payment-animation.css';

export default function CreatePaymentPage() {
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
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('bank');
  const [copiedField, setCopiedField] = useState('');

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

  // ฟังก์ชันสำหรับ copy text
  const copyToClipboard = async (text, fieldName) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast.success(`คัดลอก${fieldName}เรียบร้อย!`);
      setTimeout(() => setCopiedField(''), 2000);
    } catch (err) {
      toast.error('ไม่สามารถคัดลอกได้');
    }
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
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-8 border border-gray-200 relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#092724] to-transparent opacity-5 rounded-full -mr-16 -mt-16"></div>
              
              <div className="relative z-10">
                <div className="flex items-center mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mr-4" style={{ 
                    background: `linear-gradient(135deg, rgba(9, 39, 36, 0.1) 0%, rgba(9, 39, 36, 0.2) 100%)` 
                  }}>
                    <User className="h-6 w-6" style={{ color: '#092724' }} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">ข้อมูลผู้เข้าพัก</h2>
                    <p className="text-sm text-gray-600">กรุณาตรวจสอบและแก้ไขข้อมูลให้ถูกต้อง</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {/* Required Fields Section */}
                  <div>
                    <div className="flex items-center mb-4">
                      <div className="h-0.5 flex-1 bg-gradient-to-r from-[#092724] to-transparent"></div>
                      <span className="px-3 text-sm font-semibold text-[#092724]">ข้อมูลจำเป็น</span>
                      <div className="h-0.5 flex-1 bg-gradient-to-l from-[#092724] to-transparent"></div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-800 flex items-center mb-2">
                          <span>ชื่อ-นามสกุล</span>
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            name="guestName"
                            value={customerInfo.guestName}
                            onChange={handleCustomerInfoChange}
                            className="w-full px-4 py-3 text-base bg-white border-2 border-gray-300 rounded-xl text-gray-900 focus:outline-none transition-all duration-300 shadow-sm hover:shadow-md custom-focus"
                            required
                            placeholder="ชื่อจริง นามสกุล"
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <User className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-800 flex items-center mb-2">
                          <span>เบอร์โทรศัพท์</span>
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="tel"
                            name="guestPhone"
                            value={customerInfo.guestPhone}
                            onChange={handleCustomerInfoChange}
                            className="w-full px-4 py-3 text-base bg-white border-2 border-gray-300 rounded-xl text-gray-900 focus:outline-none transition-all duration-300 shadow-sm hover:shadow-md custom-focus"
                            required
                            placeholder="08X-XXX-XXXX"
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <Smartphone className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-800 flex items-center mb-2">
                          <span>อีเมล</span>
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            name="guestEmail"
                            value={customerInfo.guestEmail}
                            onChange={handleCustomerInfoChange}
                            className="w-full px-4 py-3 text-base bg-white border-2 border-gray-300 rounded-xl text-gray-900 focus:outline-none transition-all duration-300 shadow-sm hover:shadow-md custom-focus"
                            required
                            placeholder="email@example.com"
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-800 flex items-center mb-2">
                          <span>รหัสบัตรประชาชน</span>
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            name="guestIdNumber"
                            value={customerInfo.guestIdNumber}
                            onChange={handleCustomerInfoChange}
                            className="w-full px-4 py-3 text-base bg-white border-2 border-gray-300 rounded-xl text-gray-900 focus:outline-none transition-all duration-300 shadow-sm hover:shadow-md custom-focus font-mono"
                            required
                            placeholder="X-XXXX-XXXXX-XX-X"
                            maxLength="17"
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <Hash className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Optional Fields Section */}
                  <div>
                    <div className="flex items-center mb-4">
                      <div className="h-0.5 flex-1 bg-gradient-to-r from-gray-300 to-transparent"></div>
                      <span className="px-3 text-sm font-semibold text-gray-600">ข้อมูลเสริม (ไม่บังคับ)</span>
                      <div className="h-0.5 flex-1 bg-gradient-to-l from-gray-300 to-transparent"></div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-800">ที่อยู่</label>
                        <div className="relative">
                          <textarea
                            name="guestAddress"
                            value={customerInfo.guestAddress}
                            onChange={handleCustomerInfoChange}
                            rows="4"
                            className="w-full px-4 py-3 text-base bg-white border-2 border-gray-300 rounded-xl text-gray-900 focus:outline-none transition-all duration-300 shadow-sm hover:shadow-md custom-focus resize-none"
                            placeholder="บ้านเลขที่ ซอย ถนน แขวง เขต จังหวัด รหัสไปรษณีย์"
                          />
                          <div className="absolute top-3 right-3 pointer-events-none">
                            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-800">ความต้องการพิเศษ</label>
                        <div className="relative">
                          <textarea
                            name="specialRequests"
                            value={customerInfo.specialRequests}
                            onChange={handleCustomerInfoChange}
                            rows="4"
                            className="w-full px-4 py-3 text-base bg-white border-2 border-gray-300 rounded-xl text-gray-900 focus:outline-none transition-all duration-300 shadow-sm hover:shadow-md custom-focus resize-none"
                            placeholder="เตียงเสริม, ห้องติดกัน, อาหารแพ้, หรือความต้องการอื่นๆ"
                          />
                          <div className="absolute top-3 right-3 pointer-events-none">
                            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Payment Information with Flip Card */}
            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <CreditCard className="h-6 w-6 mr-3" style={{ color: '#092724' }} />
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
                  <div className={`flip-card ${isCardFlipped ? 'flipped' : ''}`} style={{ height: '500px' }}>
                    <div className="flip-card-inner">
                      {/* Front: Bank Information */}
                      <div className="flip-card-front p-6 border-2 shadow-xl" style={{ 
                        background: `linear-gradient(135deg, #092724 0%, #0d4e47 50%, #092724 100%)`,
                        borderColor: '#092724'
                      }}>
                        <div className="h-full flex flex-col">
                          {/* Header Section */}
                          <div className="text-center mb-6">
                          </div>
                          
                          {/* Main Content Grid */}
                          <div className="flex-1 grid grid-cols-2 gap-3 auto-rows-fr">
                            {/* Bank Name - Top Left */}
                            <div className="bg-white bg-opacity-95 backdrop-blur rounded-xl p-4 border border-white border-opacity-50 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-center">
                              <div className="text-center">
                                <div className="inline-flex p-2 rounded-full mb-2" style={{ backgroundColor: 'rgba(9, 39, 36, 0.1)' }}>
                                  <Building2 className="h-5 w-5" style={{ color: '#092724' }} />
                                </div>
                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">ธนาคาร</div>
                                <div className="text-lg font-bold text-gray-900 leading-tight">{paymentSettings.data.bankName}</div>
                              </div>
                            </div>

                            {/* Account Name - Top Right */}
                            <div 
                              className="bg-white bg-opacity-95 backdrop-blur rounded-xl p-4 border border-white border-opacity-50 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col justify-center"
                              onClick={() => copyToClipboard(paymentSettings.data.accountName, 'ชื่อบัญชี')}
                            >
                              <div className="text-center">
                                <div className="inline-flex p-2 bg-blue-100 rounded-full mb-2 relative">
                                  <UserCircle className="h-5 w-5 text-blue-600" />
                                  <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {copiedField === 'ชื่อบัญชี' ? (
                                      <div className="rounded-full p-1" style={{ backgroundColor: '#092724' }}>
                                        <Check className="h-2 w-2 text-white" />
                                      </div>
                                    ) : (
                                      <div className="bg-gray-500 rounded-full p-1">
                                        <Copy className="h-2 w-2 text-white" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">ชื่อบัญชี</div>
                                <div className="text-lg font-bold text-gray-900 leading-tight break-words">{paymentSettings.data.accountName}</div>
                              </div>
                            </div>

                            {/* Account Number - Bottom Left */}
                            <div 
                              className="bg-white bg-opacity-95 backdrop-blur rounded-xl p-4 border border-white border-opacity-50 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col justify-center"
                              onClick={() => copyToClipboard(paymentSettings.data.bankAccount, 'เลขที่บัญชี')}
                            >
                              <div className="text-center">
                                <div className="inline-flex p-2 bg-purple-100 rounded-full mb-2 relative">
                                  <Hash className="h-5 w-5 text-purple-600" />
                                  <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {copiedField === 'เลขที่บัญชี' ? (
                                      <div className="rounded-full p-1" style={{ backgroundColor: '#092724' }}>
                                        <Check className="h-2 w-2 text-white" />
                                      </div>
                                    ) : (
                                      <div className="bg-gray-500 rounded-full p-1">
                                        <Copy className="h-2 w-2 text-white" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">เลขที่บัญชี</div>
                                <div className="text-base font-mono font-bold text-gray-900 leading-tight break-all">{paymentSettings.data.bankAccount}</div>
                              </div>
                            </div>

                            {/* PromptPay - Bottom Right */}
                            {paymentSettings.data.phoneNumber && (
                              <div 
                                className="bg-white bg-opacity-95 backdrop-blur rounded-xl p-4 border border-white border-opacity-50 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col justify-center"
                                onClick={() => copyToClipboard(paymentSettings.data.phoneNumber, 'PromptPay')}
                              >
                                <div className="text-center">
                                  <div className="inline-flex p-2 bg-orange-100 rounded-full mb-2 relative">
                                    <Smartphone className="h-5 w-5 text-orange-600" />
                                    <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      {copiedField === 'PromptPay' ? (
                                        <div className="rounded-full p-1" style={{ backgroundColor: '#092724' }}>
                                          <Check className="h-2 w-2 text-white" />
                                        </div>
                                      ) : (
                                        <div className="bg-gray-500 rounded-full p-1">
                                          <Copy className="h-2 w-2 text-white" />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">PromptPay</div>
                                  <div className="text-base font-mono font-bold text-gray-900 leading-tight break-all">{paymentSettings.data.phoneNumber}</div>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Footer - Amount */}
                          <div className="mt-4 text-center">
                            <div className="inline-flex items-center justify-center bg-white bg-opacity-95 backdrop-blur rounded-xl px-6 py-3 shadow-xl border-2 border-white">
                              <DollarSign className="h-6 w-6 mr-2" style={{ color: '#092724' }} />
                              <div className="text-center">
                                <div className="text-xs font-medium text-gray-600">ยอดชำระ</div>
                                <div className="text-2xl font-bold" style={{ color: '#092724' }}>฿{bookingData?.total_price?.toLocaleString()}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Back: QR Code */}
                      <div className="flip-card-back bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 p-3 border-2 border-blue-200 shadow-xl">
                        <div className="h-full flex flex-col justify-center items-center">
                          {paymentSettings.data.qrCodeUrl && (
                            <div className="bg-white rounded-2xl p-4 shadow-2xl border-2 border-white mb-3 relative z-10 w-full max-w-sm">
                              <img 
                                src={`http://localhost:3001${paymentSettings.data.qrCodeUrl}`} 
                                alt="QR Code สำหรับชำระเงิน" 
                                className="w-80 h-80 object-contain mx-auto block"
                                style={{ 
                                  maxWidth: '100%', 
                                  maxHeight: '100%',
                                  position: 'relative',
                                  zIndex: 20
                                }}
                                onError={(e) => {
                                  console.error('❌ Failed to load QR Code image:', e.target.src);
                                }}
                              />
                            </div>
                          )}
                          
                          <div className="text-center">
                            <div className="inline-flex items-center justify-center bg-white bg-opacity-90 backdrop-blur rounded-xl px-6 py-3 shadow-lg">
                              <DollarSign className="h-6 w-6 text-blue-600 mr-2" />
                              <span className="text-blue-600 font-bold text-2xl">฿{bookingData?.total_price?.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Receipt Upload Section */}
                  <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 border border-gray-200 shadow-xl">
                    <div className="text-center mb-8">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{
                        background: `linear-gradient(135deg, rgba(9, 39, 36, 0.1) 0%, rgba(9, 39, 36, 0.2) 100%)`
                      }}>
                        <Upload className="h-8 w-8 text-[#092724]" />
                      </div>
                      <h3 className="text-2xl font-bold text-[#092724] mb-2">
                        อัพโหลดใบเสร็จการโอนเงิน
                      </h3>
                      <p className="text-gray-600 text-sm">
                        กรุณาอัพโหลดใบเสร็จเพื่อยืนยันการชำระเงิน
                      </p>
                    </div>
                    
                    <div className="space-y-6">
                      {/* File Upload Area */}
                      <div className="relative">
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 bg-gray-50 hover:bg-gray-100 transition-all duration-300 hover:border-[#092724] group">
                          <div className="text-center">
                            <div className="inline-flex items-center justify-center w-12 h-12 bg-white rounded-full mb-4 shadow-md group-hover:shadow-lg transition-all duration-300">
                              <ImageIcon className="h-6 w-6 text-[#092724]" />
                            </div>
                            <p className="text-[#092724] font-semibold mb-2">
                              เลือกไฟล์รูปภาพใบเสร็จ
                            </p>
                            <p className="text-gray-500 text-sm mb-4">
                              รองรับ JPEG, PNG, GIF • ขนาดไม่เกิน 5MB
                            </p>
                            <div className="inline-flex items-center space-x-2 text-xs text-gray-400">
                              <span>หรือลากไฟล์มาวางที่นี่</span>
                            </div>
                          </div>
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/gif"
                            onChange={handleReceiptFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                        </div>
                        
                        {!paymentReceiptFile && (
                          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="flex items-center">
                              <AlertCircle className="h-5 w-5 text-amber-600 mr-3 flex-shrink-0" />
                              <p className="text-amber-800 text-sm">
                                ยังไม่ได้เลือกไฟล์ใด กรุณาเลือกใบเสร็จเพื่อดำเนินการต่อ
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {paymentReceiptUrl && (
                        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg">
                          <div className="flex items-center justify-center mb-4">
                            <div className="inline-flex items-center space-x-2 text-[#092724] px-4 py-2 rounded-full text-sm font-semibold" style={{
                              backgroundColor: 'rgba(9, 39, 36, 0.1)'
                            }}>
                              <CheckCircle className="h-4 w-4" />
                              <span>ใบเสร็จที่อัพโหลดแล้ว</span>
                            </div>
                          </div>
                          <div className="flex justify-center">
                            <div className="relative group">
                              <img
                                src={paymentReceiptUrl}
                                alt="ใบเสร็จการโอนเงิน"
                                className="max-w-full max-h-80 object-contain border border-gray-200 rounded-lg shadow-md group-hover:shadow-lg transition-all duration-300"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all duration-300"></div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Submit Button */}
                      <div className="pt-4">
                        <button
                          onClick={handlePaymentConfirm}
                          disabled={!paymentReceiptFile || isUploadingReceipt || isBookingSubmitted}
                          className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 transform ${
                            !paymentReceiptFile || isUploadingReceipt || isBookingSubmitted 
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                              : 'text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
                          }`}
                          style={
                            !(!paymentReceiptFile || isUploadingReceipt || isBookingSubmitted)
                              ? {
                                  background: `linear-gradient(135deg, #092724 0%, #0d4e47 50%, #092724 100%)`,
                                  transition: 'all 0.3s ease',
                                  color: 'white'
                                }
                              : {}
                          }
                          onMouseEnter={(e) => {
                            if (!e.target.disabled) {
                              e.target.style.background = `linear-gradient(135deg, #0d4e47 0%, #092724 50%, #0d4e47 100%)`;
                              e.target.style.color = 'white';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!e.target.disabled) {
                              e.target.style.background = `linear-gradient(135deg, #092724 0%, #0d4e47 50%, #092724 100%)`;
                              e.target.style.color = 'white';
                            }
                          }}
                        >
                          {isUploadingReceipt ? (
                            <div className="flex items-center justify-center text-white">
                              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                              <span className="text-white">กำลังสร้างการจองและอัพโหลด...</span>
                            </div>
                          ) : isBookingSubmitted ? (
                            <div className="flex items-center justify-center text-white">
                              <CheckCircle className="h-6 w-6 mr-3 text-white" />
                              <span className="text-white">การจองเสร็จสิ้นแล้ว</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center text-white">
                              <CheckCircle className="h-6 w-6 mr-3 text-white" />
                              <span className="text-white">ยืนยันการจองและชำระเงิน</span>
                            </div>
                          )}
                        </button>
                        
                        {!paymentReceiptFile && (
                          <p className="text-center text-gray-500 text-sm mt-3">
                            กรุณาอัพโหลดใบเสร็จก่อนยืนยันการจอง
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{
                    borderColor: '#092724'
                  }}></div>
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
