'use client';

import { useState, useEffect } from 'react';
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
      console.log('🔍 Fetching payment settings from database...');
      
      const result = await paymentAPI.getPaymentSettings();
      console.log('📋 Payment settings from database:', result);
      
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
        console.log('💾 Database payment settings loaded:', paymentData);
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

  // Format national ID
  const formatNationalId = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 1) return cleaned;
    if (cleaned.length <= 5) return `${cleaned.slice(0, 1)}-${cleaned.slice(1)}`;
    if (cleaned.length <= 10) return `${cleaned.slice(0, 1)}-${cleaned.slice(1, 5)}-${cleaned.slice(5)}`;
    if (cleaned.length <= 12) return `${cleaned.slice(0, 1)}-${cleaned.slice(1, 5)}-${cleaned.slice(5, 10)}-${cleaned.slice(10)}`;
    return `${cleaned.slice(0, 1)}-${cleaned.slice(1, 5)}-${cleaned.slice(5, 10)}-${cleaned.slice(10, 12)}-${cleaned.slice(12, 13)}`;
  };

  // Format phone number
  const formatPhoneNumber = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const fetchBookingDetails = async () => {
    try {
      const response = await bookingAPI.getBookingById(params.bookingId);
      if (response.success) {
        setBooking(response.data);
        
        // Auto-fill customer info from user profile if available
        if (user) {
          setCustomerInfo({
            guestName: user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.name || '',
            guestPhone: user.phone || user.phone_number || '',
            guestEmail: user.email || '',
            guestAddress: user.address || '',
            guestIdNumber: user.national_id || user.nationalId || user.id_number || '',
            specialRequests: ''
          });
        }
      } else {
        toast.error('ไม่พบข้อมูลการจอง');
        router.push('/rooms');
      }
    } catch (error) {
      console.error('Error fetching booking:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลการจอง');
      router.push('/rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerInfoChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'guestIdNumber') {
      const formatted = formatNationalId(value);
      setCustomerInfo(prev => ({ ...prev, [name]: formatted }));
    } else if (name === 'guestPhone') {
      const formatted = formatPhoneNumber(value);
      setCustomerInfo(prev => ({ ...prev, [name]: formatted }));
    } else {
      setCustomerInfo(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleReceiptFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('ไฟล์มีขนาดใหญ่เกิน 5MB');
        return;
      }
      
      setPaymentReceiptFile(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setPaymentReceiptUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateCustomerInfo = () => {
    if (!customerInfo.guestName.trim()) {
      toast.error('กรุณากรอกชื่อ-นามสกุล');
      return false;
    }
    if (!customerInfo.guestPhone.trim()) {
      toast.error('กรุณากรอกเบอร์โทรศัพท์');
      return false;
    }
    if (!customerInfo.guestEmail.trim()) {
      toast.error('กรุณากรอกอีเมล');
      return false;
    }
    if (!customerInfo.guestIdNumber.trim()) {
      toast.error('กรุณากรอกรหัสบัตรประชาชน');
      return false;
    }
    
    // Validate national ID format (13 digits)
    const nationalIdNumbers = customerInfo.guestIdNumber.replace(/\D/g, '');
    if (nationalIdNumbers.length !== 13) {
      toast.error('รหัสบัตรประชาชนต้องมี 13 หลัก');
      return false;
    }
    
    return true;
  };

  const handlePaymentConfirm = async () => {
    if (!validateCustomerInfo()) {
      return;
    }

    if (!paymentReceiptFile) {
      toast.error('กรุณาอัพโหลดใบเสร็จการโอนเงิน');
      return;
    }

    try {
      setIsUploadingReceipt(true);

      // Update booking with customer info first
      const updateResponse = await bookingAPI.updateBooking(booking.id, {
        guest_name: customerInfo.guestName,
        guest_phone: customerInfo.guestPhone,
        guest_email: customerInfo.guestEmail,
        guest_address: customerInfo.guestAddress,
        guest_national_id: customerInfo.guestIdNumber.replace(/\D/g, ''),
        special_requests: customerInfo.specialRequests
      });

      if (!updateResponse.success) {
        throw new Error('ไม่สามารถอัปเดตข้อมูลการจองได้');
      }

      // Upload payment receipt
      const formData = new FormData();
      formData.append('paymentReceipt', paymentReceiptFile);
      formData.append('bookingId', booking.id);

      const uploadResponse = await fetch('/api/bookings/upload-receipt', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('ไม่สามารถอัพโหลดใบเสร็จได้');
      }

      // Confirm payment
      const confirmResponse = await fetch('/api/bookings/confirm-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: booking.id,
          paymentMethod: 'bank_transfer'
        }),
      });

      if (!confirmResponse.ok) {
        throw new Error('ไม่สามารถยืนยันการชำระเงินได้');
      }

      toast.success('ยืนยันการชำระเงินสำเร็จ!');
      setPaymentStep('completed');
      
    } catch (error) {
      console.error('Payment confirmation error:', error);
      toast.error(error.message || 'เกิดข้อผิดพลาดในการยืนยันการชำระเงิน');
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">ไม่พบข้อมูลการจอง</h2>
          <p className="text-gray-600 mb-4">การจองที่คุณค้นหาอาจไม่พร้อมใช้งาน</p>
          <button
            onClick={() => router.push('/rooms')}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
          >
            กลับไปหน้าห้องพัก
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            ย้อนกลับ
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ชำระเงิน</h1>
          <p className="text-gray-600">รหัสการจอง: {booking.bookingReference}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Customer Info & Payment */}
          <div className="space-y-6">
            {paymentStep === 'payment' && (
              <>
                {/* Customer Information Section */}
                <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    ข้อมูลผู้เข้าพัก
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Guest Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        maxLength="12"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Guest Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        อีเมล *
                      </label>
                      <input
                        type="email"
                        name="guestEmail"
                        value={customerInfo.guestEmail}
                        onChange={handleCustomerInfoChange}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                        placeholder="email@example.com"
                      />
                    </div>

                    {/* Guest ID Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        รหัสบัตรประชาชน *
                      </label>
                      <input
                        type="text"
                        name="guestIdNumber"
                        value={customerInfo.guestIdNumber}
                        onChange={handleCustomerInfoChange}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                        placeholder="X-XXXX-XXXXX-XX-X"
                        maxLength="17"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    {/* Guest Address */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ที่อยู่
                      </label>
                      <textarea
                        name="guestAddress"
                        value={customerInfo.guestAddress}
                        onChange={handleCustomerInfoChange}
                        rows="3"
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="ที่อยู่ (ไม่บังคับ)"
                      />
                    </div>
                  </div>

                  <div>
                    {/* Special Requests */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ความต้องการพิเศษ
                      </label>
                      <textarea
                        name="specialRequests"
                        value={customerInfo.specialRequests}
                        onChange={handleCustomerInfoChange}
                        rows="2"
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="เตียงเสริม, ห้องติดกัน, อื่นๆ (ไม่บังคับ)"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Section */}
                <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    ชำระเงิน
                  </h2>
                  
                  {/* Bank Transfer Payment */}
                  <div className="text-center mb-6">
                    <div className="bg-gray-50 rounded-lg p-6 mb-4 border border-gray-200">
                      {paymentSettings ? (
                        <div className="flex flex-col items-center">
                          {paymentSettings.data.qrCodeUrl ? (
                            <div className="mb-4">
                              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center justify-center">
                                <ImageIcon className="h-5 w-5 mr-2 text-green-600" />
                                สแกน QR Code เพื่อชำระเงิน
                              </h3>
                              <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200">
                                <img 
                                  src={`http://localhost:3001${paymentSettings.data.qrCodeUrl}`} 
                                  alt="QR Code ธนาคาร" 
                                  className="w-64 h-64 object-contain mx-auto rounded-lg"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="mb-4">
                              <Building2 className="h-32 w-32 mx-auto text-blue-600 mb-4" />
                            </div>
                          )}
                          
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            {paymentSettings.data.qrCodeUrl ? 'หรือโอนเงินตามข้อมูลด้านล่าง' : 'ข้อมูลบัญชีธนาคาร'}
                          </h3>
                          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200 shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="text-center p-3 bg-white rounded-lg border border-blue-200 shadow-sm">
                                <span className="block text-gray-600 text-sm mb-1">ธนาคาร</span>
                                <span className="text-blue-800 font-bold text-sm">{paymentSettings.data.bankName}</span>
                              </div>
                              <div className="text-center p-3 bg-white rounded-lg border border-green-200 shadow-sm">
                                <span className="block text-gray-600 text-sm mb-1">เลขที่บัญชี</span>
                                <span className="text-green-800 font-bold text-sm font-mono">{paymentSettings.data.bankAccount}</span>
                              </div>
                              <div className="text-center p-3 bg-white rounded-lg border border-orange-200 shadow-sm">
                                <span className="block text-gray-600 text-sm mb-1">ชื่อบัญชี</span>
                                <span className="text-orange-800 font-bold text-sm">{paymentSettings.data.accountName}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <Building2 className="h-32 w-32 mx-auto text-gray-600 mb-4" />
                          <p className="text-gray-600 mb-2">กำลังโหลดข้อมูลบัญชีธนาคาร...</p>
                        </div>
                      )}
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
                                className="max-w-full max-h-48 object-contain border border-gray-300 rounded"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={handlePaymentConfirm}
                      disabled={!paymentReceiptFile || isUploadingReceipt}
                      className={`bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-3 px-6 rounded-lg shadow-lg flex items-center justify-center w-full transition-all duration-200 transform hover:scale-105 ${
                        !paymentReceiptFile || isUploadingReceipt ? 'opacity-50 cursor-not-allowed hover:scale-100' : ''
                      }`}
                    >
                      {isUploadingReceipt ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          กำลังประมวลผล...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-6 w-6 mr-2" />
                          ยืนยันการชำระเงิน
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}

            {paymentStep === 'completed' && (
              <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200 text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-gray-900 mb-4">การชำระเงินสำเร็จ!</h2>
                <p className="text-gray-600 mb-6">
                  ขอบคุณสำหรับการจองห้องพัก เราได้รับใบเสร็จการโอนเงินของคุณแล้ว
                  และจะตรวจสอบการชำระเงินภายใน 24 ชั่วโมง
                </p>
                <div className="flex space-x-4 justify-center">
                  <button
                    onClick={() => router.push('/bookings')}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                  >
                    ดูการจองของฉัน
                  </button>
                  <button
                    onClick={() => router.push('/rooms')}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                  >
                    จองห้องพักเพิ่ม
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Booking Summary */}
          <div className="lg:sticky lg:top-8 lg:h-fit">
            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">สรุปการจอง</h3>
              
              {/* Booking Details */}
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">รหัสการจอง:</span>
                  <span className="font-medium text-gray-900">{booking.bookingReference}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">ประเภทห้อง:</span>
                  <span className="font-medium text-gray-900">{booking.roomTypeName}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">วันที่เข้าพัก:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(booking.checkInDate).toLocaleDateString('th-TH')}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">วันที่ออก:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(booking.checkOutDate).toLocaleDateString('th-TH')}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">จำนวนผู้เข้าพัก:</span>
                  <span className="font-medium text-gray-900">{booking.guests} คน</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">จำนวนคืน:</span>
                  <span className="font-medium text-gray-900">
                    {Math.ceil((new Date(booking.checkOutDate) - new Date(booking.checkInDate)) / (1000 * 60 * 60 * 24))} คืน
                  </span>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">ราคาต่อคืน:</span>
                  <span className="text-gray-900">฿{(booking.totalPrice / Math.ceil((new Date(booking.checkOutDate) - new Date(booking.checkInDate)) / (1000 * 60 * 60 * 24))).toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between text-lg font-bold text-primary-600 border-t pt-3">
                  <span>ราคารวม:</span>
                  <span>฿{booking.totalPrice?.toLocaleString()}</span>
                </div>
              </div>

              {/* Payment Status */}
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-amber-600 mr-2" />
                  <span className="text-sm font-medium text-amber-800">
                    สถานะ: รอการชำระเงิน
                  </span>
                </div>
                <p className="text-sm text-amber-700 mt-1">
                  กรุณาชำระเงินเพื่อยืนยันการจอง
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}