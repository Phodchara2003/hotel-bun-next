'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { bookingAPI, paymentAPI } from '../../../lib/api';
import { 
  CreditCard, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Clock,
  Upload,
  ImageIcon,
  Building2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PaymentPage() {
  const { bookingId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [booking, setBooking] = useState(null);
  const [paymentSettings, setPaymentSettings] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [paymentStep, setPaymentStep] = useState('select-payment');
  const [isLoading, setIsLoading] = useState(true);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Customer Information State
  const [customerInfo, setCustomerInfo] = useState({
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    guestNationalId: '',
    guestAddress: ''
  });

  // Auto-fill from user profile
  useEffect(() => {
    if (user) {
      setCustomerInfo(prev => ({
        ...prev,
        guestName: user.name || user.username || '',
        guestEmail: user.email || '',
        guestPhone: user.phone || '',
        guestNationalId: user.national_id || '',
        guestAddress: user.address || ''
      }));
    }
  }, [user]);

  // Fetch booking and payment settings
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        const bookingResponse = await bookingAPI.getBookingById(bookingId);
        if (bookingResponse.success) {
          setBooking(bookingResponse.booking);
        }
        
        const paymentResponse = await paymentAPI.getPaymentSettings();
        if (paymentResponse.success) {
          setPaymentSettings(paymentResponse.paymentSettings);
        }
        
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      } finally {
        setIsLoading(false);
      }
    };

    if (bookingId) {
      fetchData();
    }
  }, [bookingId]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateNights = (checkIn, checkOut) => {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  const handlePaymentMethodSelect = (method) => {
    setSelectedPaymentMethod(method);
    setPaymentStep('customer-info');
  };

  const handleCustomerInfoSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!customerInfo.guestName || !customerInfo.guestEmail || !customerInfo.guestPhone) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    // Validate phone number (Thai format)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(customerInfo.guestPhone.replace(/[-\s]/g, ''))) {
      toast.error('กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง (10 หลัก)');
      return;
    }

    // Validate national ID (13 digits for Thai)
    if (customerInfo.guestNationalId) {
      const nationalIdRegex = /^[0-9]{13}$/;
      if (!nationalIdRegex.test(customerInfo.guestNationalId.replace(/[-\s]/g, ''))) {
        toast.error('กรุณากรอกเลขบัตรประจำตัวประชาชนให้ถูกต้อง (13 หลัก)');
        return;
      }
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerInfo.guestEmail)) {
      toast.error('กรุณากรอกอีเมลให้ถูกต้อง');
      return;
    }
    
    setPaymentStep('upload-slip');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('กรุณาอัพโหลดไฟล์รูปภาพ (JPG, JPEG, PNG) เท่านั้น');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('ขนาดไฟล์ต้องไม่เกิน 5MB');
        return;
      }

      setUploadedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmPayment = async () => {
    if (!uploadedImage) {
      toast.error('กรุณาอัพโหลดหลักฐานการโอนเงิน');
      return;
    }

    setSubmittingPayment(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('bookingId', bookingId);
      formData.append('paymentSlip', uploadedImage);
      formData.append('paymentMethod', selectedPaymentMethod.method_name);
      formData.append('customerInfo', JSON.stringify(customerInfo));

      const response = await fetch('/api/bookings/confirm-payment', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        toast.success('ยืนยันการชำระเงินเรียบร้อยแล้ว');
        setPaymentStep('success');
      } else {
        toast.error(result.message || 'เกิดข้อผิดพลาดในการยืนยันการชำระเงิน');
      }
    } catch (error) {
      console.error('Payment confirmation error:', error);
      toast.error('เกิดข้อผิดพลาดในการยืนยันการชำระเงิน');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleInputChange = (field, value) => {
    setCustomerInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">ไม่พบข้อมูลการจอง</h1>
          <p className="text-gray-600 mb-4">ไม่สามารถค้นหาข้อมูลการจองนี้ได้</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            กลับหน้าแรก
          </button>
        </div>
      </div>
    );
  }

  const nights = calculateNights(booking.check_in_date, booking.check_out_date);
  const totalAmount = booking.total_price || (booking.price_per_night * nights);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            
            <div className="mb-8">
              <button
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                ย้อนกลับ
              </button>
              <h1 className="text-3xl font-bold text-gray-900">ชำระเงิน</h1>
              <p className="text-gray-600 mt-2">รหัสการจอง: #{booking.id}</p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 mb-8 border border-gray-200">
              <div className="flex items-center justify-between">
                <div className={`flex items-center ${paymentStep === 'select-payment' ? 'text-blue-600' : paymentStep === 'customer-info' || paymentStep === 'upload-slip' || paymentStep === 'success' ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${paymentStep === 'select-payment' ? 'bg-blue-100 border-2 border-blue-600' : paymentStep === 'customer-info' || paymentStep === 'upload-slip' || paymentStep === 'success' ? 'bg-green-100 border-2 border-green-600' : 'bg-gray-100 border-2 border-gray-300'}`}>
                    {(paymentStep === 'customer-info' || paymentStep === 'upload-slip' || paymentStep === 'success') ? <CheckCircle className="h-4 w-4" /> : '1'}
                  </div>
                  <span className="ml-2 font-medium">เลือกวิธีชำระเงิน</span>
                </div>
                
                <div className={`flex items-center ${paymentStep === 'customer-info' ? 'text-blue-600' : paymentStep === 'upload-slip' || paymentStep === 'success' ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${paymentStep === 'customer-info' ? 'bg-blue-100 border-2 border-blue-600' : paymentStep === 'upload-slip' || paymentStep === 'success' ? 'bg-green-100 border-2 border-green-600' : 'bg-gray-100 border-2 border-gray-300'}`}>
                    {(paymentStep === 'upload-slip' || paymentStep === 'success') ? <CheckCircle className="h-4 w-4" /> : '2'}
                  </div>
                  <span className="ml-2 font-medium">กรอกข้อมูล</span>
                </div>
                
                <div className={`flex items-center ${paymentStep === 'upload-slip' ? 'text-blue-600' : paymentStep === 'success' ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${paymentStep === 'upload-slip' ? 'bg-blue-100 border-2 border-blue-600' : paymentStep === 'success' ? 'bg-green-100 border-2 border-green-600' : 'bg-gray-100 border-2 border-gray-300'}`}>
                    {paymentStep === 'success' ? <CheckCircle className="h-4 w-4" /> : '3'}
                  </div>
                  <span className="ml-2 font-medium">อัพโหลดหลักฐาน</span>
                </div>
                
                <div className={`flex items-center ${paymentStep === 'success' ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${paymentStep === 'success' ? 'bg-green-100 border-2 border-green-600' : 'bg-gray-100 border-2 border-gray-300'}`}>
                    {paymentStep === 'success' ? <CheckCircle className="h-4 w-4" /> : '4'}
                  </div>
                  <span className="ml-2 font-medium">เสร็จสิ้น</span>
                </div>
              </div>
            </div>

            {paymentStep === 'select-payment' && (
              <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">เลือกวิธีการชำระเงิน</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paymentSettings.map((method) => (
                    <div
                      key={method.id}
                      onClick={() => handlePaymentMethodSelect(method)}
                      className="border-2 border-gray-200 rounded-lg p-6 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">{method.method_name}</h3>
                        <Building2 className="h-6 w-6 text-gray-400" />
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">
                          <strong>ธนาคาร:</strong> {method.bank_name}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>เลขบัญชี:</strong> {method.account_number}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>ชื่อบัญชี:</strong> {method.account_name}
                        </p>
                      </div>
                      
                      {method.qr_code && (
                        <div className="mt-4 flex justify-center">
                          <img
                            src={method.qr_code}
                            alt="QR Code"
                            className="w-20 h-20 object-contain border rounded"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {paymentStep === 'customer-info' && (
              <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">ข้อมูลผู้เข้าพัก</h2>
                
                <form onSubmit={handleCustomerInfoSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <User className="h-4 w-4 inline mr-1" />
                        ชื่อ-นามสกุล *
                      </label>
                      <input
                        type="text"
                        required
                        value={customerInfo.guestName}
                        onChange={(e) => handleInputChange('guestName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="กรอกชื่อ-นามสกุล"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Mail className="h-4 w-4 inline mr-1" />
                        อีเมล *
                      </label>
                      <input
                        type="email"
                        required
                        value={customerInfo.guestEmail}
                        onChange={(e) => handleInputChange('guestEmail', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="กรอกอีเมล"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Phone className="h-4 w-4 inline mr-1" />
                        เบอร์โทรศัพท์ *
                      </label>
                      <input
                        type="tel"
                        required
                        value={customerInfo.guestPhone}
                        onChange={(e) => handleInputChange('guestPhone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="กรอกเบอร์โทรศัพท์ (10 หลัก)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <CreditCard className="h-4 w-4 inline mr-1" />
                        เลขบัตรประจำตัวประชาชน
                      </label>
                      <input
                        type="text"
                        value={customerInfo.guestNationalId}
                        onChange={(e) => handleInputChange('guestNationalId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="กรอกเลขบัตรประจำตัวประชาชน (13 หลัก)"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="h-4 w-4 inline mr-1" />
                      ที่อยู่
                    </label>
                    <textarea
                      value={customerInfo.guestAddress}
                      onChange={(e) => handleInputChange('guestAddress', e.target.value)}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="กรอกที่อยู่"
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setPaymentStep('select-payment')}
                      className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                    >
                      ย้อนกลับ
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex-1"
                    >
                      ดำเนินการต่อ
                    </button>
                  </div>
                </form>
              </div>
            )}

            {paymentStep === 'upload-slip' && selectedPaymentMethod && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">ข้อมูลการโอนเงิน</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedPaymentMethod.method_name}</h3>
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">
                            <strong>ธนาคาร:</strong> {selectedPaymentMethod.bank_name}
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>เลขบัญชี:</strong> {selectedPaymentMethod.account_number}
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>ชื่อบัญชี:</strong> {selectedPaymentMethod.account_name}
                          </p>
                          <p className="text-lg font-semibold text-blue-600">
                            <strong>จำนวนเงิน:</strong> {formatPrice(totalAmount)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {selectedPaymentMethod.qr_code && (
                      <div className="flex justify-center">
                        <div className="text-center">
                          <p className="text-sm text-gray-600 mb-2">สแกน QR Code เพื่อโอนเงิน</p>
                          <img
                            src={selectedPaymentMethod.qr_code}
                            alt="QR Code for Payment"
                            className="w-48 h-48 object-contain border rounded-lg"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">อัพโหลดหลักฐานการโอนเงิน</h3>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    {imagePreview ? (
                      <div className="space-y-4">
                        <img
                          src={imagePreview}
                          alt="Payment Slip Preview"
                          className="max-w-md max-h-64 mx-auto rounded-lg border"
                        />
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">หลักฐานการโอนเงินที่อัพโหลด</p>
                          <button
                            type="button"
                            onClick={() => {
                              setUploadedImage(null);
                              setImagePreview(null);
                            }}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            ลบรูปภาพ
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">อัพโหลดหลักฐานการโอนเงิน</p>
                        <p className="text-sm text-gray-500 mb-4">รองรับไฟล์ JPG, JPEG, PNG ขนาดไม่เกิน 5MB</p>
                        <label className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg cursor-pointer transition-colors inline-flex items-center">
                          <Upload className="h-4 w-4 mr-2" />
                          เลือกไฟล์
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex gap-4">
                    <button
                      type="button"
                      onClick={() => setPaymentStep('customer-info')}
                      className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                    >
                      ย้อนกลับ
                    </button>
                    <button
                      onClick={handleConfirmPayment}
                      disabled={!uploadedImage || submittingPayment}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors flex-1 flex items-center justify-center"
                    >
                      {submittingPayment ? (
                        <div>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          กำลังประมวลผล...
                        </div>
                      ) : (
                        <div>
                          <CheckCircle className="h-6 w-6 mr-2" />
                          ยืนยันการโอนเงิน
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {paymentStep === 'success' && (
              <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200 text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-4">ยืนยันการชำระเงินเรียบร้อยแล้ว!</h2>
                <p className="text-gray-600 mb-6">
                  เราได้รับหลักฐานการโอนเงินของคุณแล้ว กรุณารอการตรวจสอบจากเจ้าหน้าที่
                  <br />
                  ระบบจะส่งอีเมลยืนยันไปที่ {customerInfo.guestEmail}
                </p>
                <div className="space-y-2 text-sm text-gray-500 mb-6">
                  <p>รหัสการจอง: #{booking.id}</p>
                  <p>จำนวนเงิน: {formatPrice(totalAmount)}</p>
                  <p>วันที่: {new Date().toLocaleDateString('th-TH')}</p>
                </div>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => router.push('/')}
                    className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
                  >
                    กลับหน้าแรก
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">สรุปการจอง</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">ห้อง:</span>
                  <span className="font-medium">{booking.room_name || `ห้อง ${booking.room_id}`}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">เช็คอิน:</span>
                  <span className="font-medium">{formatDate(booking.check_in_date)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">เช็คเอาท์:</span>
                  <span className="font-medium">{formatDate(booking.check_out_date)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">จำนวนคืน:</span>
                  <span className="font-medium">{nights} คืน</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">จำนวนผู้เข้าพัก:</span>
                  <span className="font-medium">{booking.number_of_guests} คน</span>
                </div>
                
                <hr className="my-4" />
                
                <div className="flex justify-between text-lg font-semibold">
                  <span>ยอดรวม:</span>
                  <span className="text-blue-600">{formatPrice(totalAmount)}</span>
                </div>

                <div className="text-xs text-gray-500">
                  <p>* ราคารวมภาษีและค่าบริการแล้ว</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}