'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { bookingAPI } from '../../../lib/api';
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
import Image from 'next/image';

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentStep, setPaymentStep] = useState('payment'); // payment, customer-info, completed
  const [paymentReceiptFile, setPaymentReceiptFile] = useState(null);
  const [paymentReceiptUrl, setPaymentReceiptUrl] = useState('');
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState(null);
  const [customerInfo, setCustomerInfo] = useState({
    guestName: '',
    guestPhone: '',
    guestEmail: '',
    guestAddress: '',
    guestIdNumber: '',
    specialRequests: ''
  });

  useEffect(() => {
    if (isAuthenticated && params.bookingId) {
      fetchBookingDetails();
      fetchPaymentSettings();
    }
  }, [isAuthenticated, params.bookingId]);

  const fetchPaymentSettings = async () => {
    try {
      console.log('🔍 Fetching payment settings for user...');
      const response = await fetch('http://localhost:3001/api/simple-payment-settings');
      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('💳 Payment settings loaded:', data);
        setPaymentSettings(data);
      } else {
        console.error('❌ Failed to fetch payment settings:', response.status);
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
      }
    } catch (error) {
      console.error('❌ Error fetching payment settings:', error);
    }
  };

  const fetchBookingDetails = async () => {
    try {
      const response = await bookingAPI.getBookingById(params.bookingId);
      setBooking(response);
      
      // Pre-fill customer info with user data
      if (user) {
        setCustomerInfo(prev => ({
          ...prev,
          guestEmail: user.email || '',
          guestName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : ''
        }));
      }
    } catch (error) {
      console.error('Error fetching booking:', error);
      toast.error('ไม่สามารถโหลดข้อมูลการจองได้');
      router.push('/bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerInfoChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePaymentConfirm = async () => {
    if (!paymentReceiptFile) {
      toast.error('กรุณาอัพโหลดรูปใบเสร็จการชำระเงิน');
      return;
    }

    try {
      setIsUploadingReceipt(true);
      
      // Convert file to base64
      const base64 = await convertFileToBase64(paymentReceiptFile);
      
      // Upload receipt to backend
      await bookingAPI.uploadPaymentReceipt(params.bookingId, base64);
      
      setPaymentStep('customer-info');
      toast.success('อัพโหลดใบเสร็จสำเร็จ กรุณากรอกข้อมูลผู้เข้าพัก');
    } catch (error) {
      console.error('Error uploading receipt:', error);
      toast.error('เกิดข้อผิดพลาดในการอัพโหลดใบเสร็จ');
    } finally {
      setIsUploadingReceipt(false);
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

  const handleReceiptFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.match(/^image\/(jpeg|jpg|png|gif)$/)) {
        toast.error('กรุณาเลือกไฟล์รูปภาพ (JPEG, PNG, GIF)');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('ไฟล์รูปภาพต้องมีขนาดไม่เกิน 5MB');
        return;
      }
      
      setPaymentReceiptFile(file);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setPaymentReceiptUrl(previewUrl);
    }
  };

  const handleCustomerInfoSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!customerInfo.guestName || !customerInfo.guestPhone || !customerInfo.guestEmail) {
      toast.error('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      return;
    }

    try {
      const response = await bookingAPI.saveCustomerInfo(params.bookingId, customerInfo);
      setPaymentStep('completed');
      toast.success('บันทึกข้อมูลสำเร็จ รอการอนุมัติจากผู้ดูแลระบบ');
    } catch (error) {
      console.error('Error saving customer info:', error);
      const message = error.response?.data?.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
      toast.error(message);
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

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">ไม่พบข้อมูลการจอง</h2>
          <p className="text-gray-600">กรุณาตรวจสอบรหัสการจองของคุณ</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto container-padding">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-700 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            กลับ
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ชำระเงิน</h1>
          <p className="text-gray-600">รหัสการจอง: {booking.bookingReference}</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center">
            <div className={`flex items-center ${paymentStep === 'payment' ? 'text-primary-600' : paymentStep === 'customer-info' || paymentStep === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${paymentStep === 'payment' ? 'border-primary-600 bg-primary-600 text-white' : paymentStep === 'customer-info' || paymentStep === 'completed' ? 'border-green-600 bg-green-600 text-white' : 'border-gray-300'}`}>
                {paymentStep === 'customer-info' || paymentStep === 'completed' ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <span>1</span>
                )}
              </div>
              <span className="ml-2 font-medium">ชำระเงิน</span>
            </div>
            
            <div className={`flex-1 h-1 mx-4 ${paymentStep === 'customer-info' || paymentStep === 'completed' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
            
            <div className={`flex items-center ${paymentStep === 'customer-info' ? 'text-primary-600' : paymentStep === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${paymentStep === 'customer-info' ? 'border-primary-600 bg-primary-600 text-white' : paymentStep === 'completed' ? 'border-green-600 bg-green-600 text-white' : 'border-gray-300'}`}>
                {paymentStep === 'completed' ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <span>2</span>
                )}
              </div>
              <span className="ml-2 font-medium">ข้อมูลผู้เข้าพัก</span>
            </div>
            
            <div className={`flex-1 h-1 mx-4 ${paymentStep === 'completed' ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
            
            <div className={`flex items-center ${paymentStep === 'completed' ? 'text-orange-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${paymentStep === 'completed' ? 'border-orange-600 bg-orange-600 text-white' : 'border-gray-300'}`}>
                {paymentStep === 'completed' ? (
                  <Clock className="h-5 w-5" />
                ) : (
                  <span>3</span>
                )}
              </div>
              <span className="ml-2 font-medium">รอการอนุมัติ</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {paymentStep === 'payment' && (
              <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">ชำระเงิน</h2>
                
                {/* Bank Information */}
                {paymentSettings && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                      <Building2 className="h-5 w-5 mr-2" />
                      ข้อมูลบัญชีธนาคาร
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="bg-white rounded-lg p-3 border border-blue-200 shadow-sm">
                        <span className="block text-gray-600 text-xs mb-1">ธนาคาร</span>
                        <span className="text-blue-800 font-semibold">{paymentSettings.bankName}</span>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-green-200 shadow-sm">
                        <span className="block text-gray-600 text-xs mb-1">เลขที่บัญชี</span>
                        <span className="text-green-800 font-mono font-semibold">{paymentSettings.accountNumber}</span>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-orange-200 shadow-sm">
                        <span className="block text-gray-600 text-xs mb-1">ชื่อบัญชี</span>
                        <span className="text-orange-800 font-semibold">{paymentSettings.accountName}</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-blue-200">
                      <p className="text-xs text-blue-700">{paymentSettings.instructions}</p>
                    </div>
                  </div>
                )}
                
                {/* Bank Transfer Payment */}
                <div className="text-center mb-8">
                  <div className="bg-gray-50 rounded-lg p-8 mb-4 border border-gray-200">
                    {paymentSettings ? (
                      <div className="flex flex-col items-center">
                        {paymentSettings.bankImageUrl ? (
                          <div className="mb-6">
                            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center justify-center">
                              <ImageIcon className="h-6 w-6 mr-2 text-green-600" />
                              สแกน QR Code เพื่อชำระเงิน
                            </h3>
                            <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200">
                              <img 
                                src={`http://localhost:3001${paymentSettings.bankImageUrl}`} 
                                alt="QR Code ธนาคาร" 
                                className="w-80 h-80 object-contain mx-auto rounded-lg"
                                onError={(e) => {
                                  console.error('❌ Failed to load QR Code image:', e.target.src);
                                  console.error('❌ Payment settings:', paymentSettings);
                                }}
                                onLoad={() => {
                                  console.log('✅ QR Code image loaded successfully:', paymentSettings.bankImageUrl);
                                }}
                              />
                            </div>
                            <p className="text-green-700 font-medium mt-4 mb-2">สแกน QR Code ด้านบนเพื่อชำระเงิน</p>
                            <p className="text-xs text-gray-500">Debug: {paymentSettings.bankImageUrl}</p>
                          </div>
                        ) : (
                          <div className="mb-4">
                            <Building2 className="h-32 w-32 mx-auto text-blue-600 mb-4" />
                            <p className="text-xs text-red-600">Debug: No bankImageUrl - {JSON.stringify(paymentSettings, null, 2)}</p>
                          </div>
                        )}
                        
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">
                          {paymentSettings.bankImageUrl ? 'หรือโอนเงินตามข้อมูลด้านล่าง' : 'ข้อมูลบัญชีธนาคาร'}
                        </h3>
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200 shadow-sm">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-white rounded-lg border border-blue-200 shadow-sm">
                              <span className="block text-gray-600 text-sm mb-2">ธนาคาร</span>
                              <span className="text-blue-800 font-bold text-lg">{paymentSettings.bankName}</span>
                            </div>
                            <div className="text-center p-4 bg-white rounded-lg border border-green-200 shadow-sm">
                              <span className="block text-gray-600 text-sm mb-2">เลขที่บัญชี</span>
                              <span className="text-green-800 font-bold text-lg font-mono">{paymentSettings.accountNumber}</span>
                            </div>
                            <div className="text-center p-4 bg-white rounded-lg border border-orange-200 shadow-sm">
                              <span className="block text-gray-600 text-sm mb-2">ชื่อบัญชี</span>
                              <span className="text-orange-800 font-bold text-lg">{paymentSettings.accountName}</span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-6 bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-4 border border-primary-500 shadow-lg">
                          <p className="text-white font-bold text-2xl">
                            จำนวนเงิน: ฿{booking.totalPrice?.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Building2 className="h-32 w-32 mx-auto text-gray-600 mb-4" />
                        <p className="text-gray-600 mb-2">กำลังโหลดข้อมูลบัญชีธนาคาร...</p>
                        <p className="text-lg font-semibold text-primary-600">
                          จำนวนเงิน: ฿{booking.totalPrice?.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Payment Instructions */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      วิธีการชำระเงิน
                    </h3>
                    <div className="text-sm text-blue-800 space-y-2">
                      {paymentSettings?.bankImageUrl ? (
                        <>
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                            <p className="font-semibold text-green-800 mb-2">🔥 วิธีที่ 1: สแกน QR Code (แนะนำ - รวดเร็ว)</p>
                            <div className="text-green-700 space-y-1 ml-4">
                              <p>• เปิดแอพธนาคารบนมือถือ</p>
                              <p>• เลือกเมนู "สแกน QR Code"</p>
                              <p>• สแกน QR Code ด้านบน</p>
                              <p>• ตรวจสอบจำนวนเงินและยืนยันการชำระ</p>
                            </div>
                          </div>
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
                            <p className="font-semibold text-orange-800 mb-2">💰 วิธีที่ 2: โอนเงินด้วยตนเอง</p>
                            <div className="text-orange-700 space-y-1 ml-4">
                              <p>• โอนเงินผ่านแอพธนาคารหรือ ATM</p>
                              <p>• ใช้ข้อมูลบัญชีธนาคารด้านบน</p>
                              <p>• โอนจำนวนเงินที่แสดงด้านบน</p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
                          <div className="text-gray-700 space-y-1">
                            <p>• โอนเงินผ่านแอพธนาคารหรือ ATM</p>
                            <p>• ใช้ข้อมูลบัญชีธนาคารด้านบน</p>
                            <p>• โอนจำนวนเงินที่แสดงด้านบน</p>
                          </div>
                        </div>
                      )}
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="font-semibold text-red-800 mb-2">📋 สุดท้าย - สำคัญมาก:</p>
                        <div className="text-red-700 space-y-1 ml-4">
                          <p>• เก็บหลักฐานการโอนเงิน</p>
                          <p>• อัพโหลดรูปใบเสร็จการโอนเงิน</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Receipt Upload */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <Upload className="h-5 w-5 mr-2 text-green-600" />
                      อัพโหลดใบเสร็จการโอนเงิน
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          เลือกไฟล์รูปภาพใบเสร็จการโอนเงิน (JPEG, PNG, GIF - ขนาดไม่เกิน 5MB)
                        </label>
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/gif"
                          onChange={handleReceiptFileChange}
                          className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 bg-gray-50 border border-gray-300 rounded-md"
                        />
                      </div>
                      
                      {paymentReceiptUrl && (
                        <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                          <h4 className="font-medium text-gray-900 mb-2">ตัวอย่างใบเสร็จการโอนเงินที่อัพโหลด:</h4>
                          <div className="flex justify-center">
                            <img
                              src={paymentReceiptUrl}
                              alt="ใบเสร็จการโอนเงิน"
                              className="max-w-full max-h-64 object-contain border border-gray-300 rounded"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={handlePaymentConfirm}
                    disabled={!paymentReceiptFile || isUploadingReceipt}
                    className={`bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-4 px-6 rounded-lg shadow-lg flex items-center justify-center w-full transition-all duration-200 transform hover:scale-105 ${
                      !paymentReceiptFile || isUploadingReceipt ? 'opacity-50 cursor-not-allowed hover:scale-100' : ''
                    }`}
                  >
                    {isUploadingReceipt ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        กำลังอัพโหลด...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-6 w-6 mr-2" />
                        ยืนยันการโอนเงิน
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {paymentStep === 'customer-info' && (
              <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">ข้อมูลผู้เข้าพัก</h2>
                
                <form onSubmit={handleCustomerInfoSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Guest Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <User className="h-4 w-4 inline mr-1" />
                        ชื่อ-นามสกุลผู้เข้าพัก *
                      </label>
                      <input
                        type="text"
                        name="guestName"
                        value={customerInfo.guestName}
                        onChange={handleCustomerInfoChange}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                        placeholder="ชื่อจริง นามสกุล"
                      />
                    </div>

                    {/* Guest Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Phone className="h-4 w-4 inline mr-1" />
                        เบอร์โทรศัพท์ *
                      </label>
                      <input
                        type="tel"
                        name="guestPhone"
                        value={customerInfo.guestPhone}
                        onChange={handleCustomerInfoChange}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                        placeholder="08X-XXX-XXXX"
                      />
                    </div>

                    {/* Guest Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Mail className="h-4 w-4 inline mr-1" />
                        อีเมล *
                      </label>
                      <input
                        type="email"
                        name="guestEmail"
                        value={customerInfo.guestEmail}
                        onChange={handleCustomerInfoChange}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                        placeholder="example@email.com"
                      />
                    </div>

                    {/* Guest ID Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <CreditCard className="h-4 w-4 inline mr-1" />
                        เลขบัตรประชาชน
                      </label>
                      <input
                        type="text"
                        name="guestIdNumber"
                        value={customerInfo.guestIdNumber}
                        onChange={handleCustomerInfoChange}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="1-XXXX-XXXXX-XX-X"
                      />
                    </div>
                  </div>

                  {/* Guest Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="h-4 w-4 inline mr-1" />
                      ที่อยู่
                    </label>
                    <textarea
                      name="guestAddress"
                      value={customerInfo.guestAddress}
                      onChange={handleCustomerInfoChange}
                      rows={3}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="ที่อยู่สำหรับจัดส่งเอกสาร (ถ้ามี)"
                    />
                  </div>

                  {/* Special Requests */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ความต้องการพิเศษ
                    </label>
                    <textarea
                      name="specialRequests"
                      value={customerInfo.specialRequests}
                      onChange={handleCustomerInfoChange}
                      rows={3}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="เช่น ขอเตียงเสริม, ห้องที่เงียบ, อาหารพิเศษ"
                    />
                  </div>

                    <button
                      type="submit"
                      className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-4 px-6 rounded-lg shadow-lg w-full flex items-center justify-center transition-all duration-200 transform hover:scale-105"
                    >
                      <CheckCircle className="h-5 w-5 mr-2" />
                      บันทึกข้อมูลและส่งรอการอนุมัติ
                    </button>
                </form>
              </div>
            )}

            {paymentStep === 'completed' && (
              <div className="bg-white rounded-lg shadow-lg p-6 text-center border border-gray-200">
                <div className="mb-6">
                  <Clock className="h-16 w-16 text-orange-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-semibold text-orange-600 mb-2">ข้อมูลถูกส่งแล้ว!</h2>
                  <p className="text-gray-600">รอการอนุมัติจากผู้ดูแลระบบ</p>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                  <p className="text-orange-800 font-medium">
                    ข้อมูลการจองและการชำระเงินได้ถูกส่งแล้ว กรุณารอการอนุมัติจากผู้ดูแลระบบ
                  </p>
                  <p className="text-orange-700 text-sm mt-2">
                    ผลการอนุมัติจะถูกส่งไปยังอีเมล: {customerInfo.guestEmail}
                  </p>
                  <p className="text-orange-700 text-sm mt-1">
                    <strong>หมายเหตุ:</strong> การอนุมัติจะเสร็จสมบูรณ์เมื่อผู้ดูแลระบบตรวจสอบใบเสร็จการชำระเงินแล้ว
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => router.push('/bookings')}
                    className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
                  >
                    ดูการจองของฉัน
                  </button>
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

          {/* Booking Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">สรุปการจอง</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">{booking.hotel?.name}</h4>
                  <p className="text-sm text-gray-600">{booking.roomType?.name}</p>
                </div>

                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>
                    {new Date(booking.checkInDate).toLocaleDateString('th-TH')} - {new Date(booking.checkOutDate).toLocaleDateString('th-TH')}
                  </span>
                </div>

                <div className="flex items-center text-sm text-gray-600">
                  <User className="h-4 w-4 mr-2" />
                  <span>{booking.guests} ผู้เข้าพัก</span>
                </div>

                <div className="border-t border-gray-300 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">ราคารวม</span>
                    <span className="text-xl font-bold text-primary-600">
                      ฿{booking.totalPrice?.toLocaleString()}
                    </span>
                  </div>
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
