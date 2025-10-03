'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { bookingAPI, paymentAPI, authAPI } from '../../../lib/api';
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

  // Load user profile data from database
  useEffect(() => {
    if (user?.id) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      console.log('🔍 Fetching user profile from database...');
      
      // ใช้ endpoint เดียวกับหน้า profile
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
        throw new Error('No token available');
      }

      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Profile data from database:', data);
        
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
          console.log('✅ Customer info loaded from database with national ID:', profile.nationalId || profile.national_id || 'ไม่พบ');
        } else {
          throw new Error('Invalid profile data structure');
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
      console.log('⚠️ Could not fetch profile from database, using cached user data');
      
      // Fallback to cached user data
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

  const fetchPaymentSettings = async () => {
    try {
      console.log('🔍 Fetching payment settings from database...');
      
      // เรียก payment settings จากฐานข้อมูลผ่าน API
      const result = await paymentAPI.getPaymentSettings();
      console.log('📋 Payment settings from database:', result);
      
      if (result.success && result.data) {
        // แปลงข้อมูลจากฐานข้อมูลให้เข้ากับรูปแบบที่หน้าใช้
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
        console.log('💾 Database payment settings loaded:', paymentData);
        
        // แสดงข้อมูลที่ได้จากแอดมิน
        console.log('💳 Admin configured payment settings:');
        console.log('🏦 Bank:', paymentData.data.bankName);
        console.log('💰 Account:', paymentData.data.bankAccount);
        console.log('👤 Account Name:', paymentData.data.accountName);
        console.log('📱 PromptPay:', paymentData.data.phoneNumber);
        console.log('🏷️ QR Code:', paymentData.data.qrCodeUrl);
      } else {
        console.warn('❌ No payment settings found in database, using defaults');
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
    } catch (error) {
      console.error('❌ Error fetching payment settings:', error);
      // ใช้ค่าเริ่มต้นเมื่อเกิดข้อผิดพลาด
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

  const fetchBookingDetails = async () => {
    try {
      const response = await bookingAPI.getBookingById(params.bookingId);
      setBooking(response);
      
      // Customer info will be loaded from user profile via useEffect
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
      // Save customer info first
      await bookingAPI.saveCustomerInfo(params.bookingId, customerInfo);
      
      // Then confirm payment
      await confirmPayment();
      
    } catch (error) {
      console.error('Error saving customer info:', error);
      const message = error.response?.data?.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
      toast.error(message);
    }
  };

  const confirmPayment = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/bookings/confirm-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: params.bookingId,
          paymentMethod: 'bank_transfer',
          paymentRef: `PAY-${Date.now()}`
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setPaymentStep('completed');
        toast.success('🎉 ยืนยันการชำระเงินสำเร็จ! ห้องพักได้รับการจองแล้ว');
        
        // Refresh booking data
        setTimeout(() => {
          fetchBookingDetails();
        }, 1000);
      } else {
        toast.error(result.message || 'ไม่สามารถยืนยันการชำระเงินได้');
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast.error('เกิดข้อผิดพลาดในการยืนยันการชำระเงิน');
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
          <p className="text-sm text-gray-600">รหัสการจอง: {booking.bookingReference}</p>
        </div>



        <div className="max-w-4xl mx-auto">
          {/* Payment Section */}
          <div className="space-y-4">
            {paymentStep === 'payment' && (
              <>
                {/* Customer Info + Payment Information Section */}
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

                      {/* Bank Account Information */}
                      {paymentSettings && (
                        <div className="bg-green-50 rounded-lg p-6 border-2 border-green-200 mt-6">
                          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                            <Building2 className="h-6 w-6 mr-3 text-green-600" />
                            ข้อมูลธนาคาร
                          </h3>
                          
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-white rounded-lg p-4 border-2 border-green-100 shadow-sm">
                                <span className="text-gray-600 block mb-2 text-sm font-medium">ธนาคาร</span>
                                <span className="text-gray-900 font-bold text-lg">{paymentSettings.data.bankName}</span>
                              </div>
                              <div className="bg-white rounded-lg p-4 border-2 border-green-100 shadow-sm">
                                <span className="text-gray-600 block mb-2 text-sm font-medium">ชื่อบัญชี</span>
                                <span className="text-gray-900 font-bold text-lg">{paymentSettings.data.accountName}</span>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Payment Information */}
                  <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                      <CreditCard className="h-6 w-6 mr-3 text-green-600" />
                      ข้อมูลการชำระเงิน
                    </h2>

                    {paymentSettings ? (
                      <div className="space-y-6">
                        {/* QR Code Section */}
                        {paymentSettings.data.qrCodeUrl && (
                          <div className="text-center bg-green-50 rounded-lg p-8 border-2 border-green-200">
                            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center justify-center">
                              <ImageIcon className="h-6 w-6 mr-3 text-green-600" />
                              QR Code สำหรับชำระเงิน
                            </h3>
                            <div className="bg-white rounded-lg p-6 shadow-lg border-2 border-green-300">
                              <img 
                                src={`http://localhost:3001${paymentSettings.data.qrCodeUrl}`} 
                                alt="QR Code สำหรับชำระเงิน" 
                                className="w-80 h-80 object-contain mx-auto"
                                onError={(e) => {
                                  console.error('❌ Failed to load QR Code image:', e.target.src);
                                }}
                              />
                            </div>
                            <p className="text-gray-700 font-semibold text-base mt-4">สแกน QR Code ด้านบนเพื่อชำระเงิน</p>
                          </div>
                        )}

                        {/* Payment Receipt Upload */}
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
                              disabled={!paymentReceiptFile || isUploadingReceipt}
                              className={`bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-4 px-6 rounded-lg shadow-lg flex items-center justify-center w-full transition-all duration-200 ${
                                !paymentReceiptFile || isUploadingReceipt ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl transform hover:scale-105'
                              }`}
                            >
                              {isUploadingReceipt ? (
                                <>
                                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                                  กำลังอัพโหลด...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-6 w-6 mr-3" />
                                  ยืนยันการโอนเงิน
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-gray-600 text-sm">กำลังโหลดข้อมูลการชำระเงิน...</p>
                      </div>
                    )}
                  </div>
                </div>


              </>
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
        </div>
      </div>
    </div>
  );
}
