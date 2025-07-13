'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { bookingAPI } from '../../../lib/api';
import { 
  CreditCard, 
  QrCode, 
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
  ImageIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';
import QRCode from 'qrcode';

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentStep, setPaymentStep] = useState('payment'); // payment, customer-info, completed
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [paymentReceiptFile, setPaymentReceiptFile] = useState(null);
  const [paymentReceiptUrl, setPaymentReceiptUrl] = useState('');
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
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
    }
  }, [isAuthenticated, params.bookingId]);

  const fetchBookingDetails = async () => {
    try {
      const response = await bookingAPI.getBookingById(params.bookingId);
      setBooking(response);
      
      // Generate QR Code for payment
      const paymentData = {
        bookingId: params.bookingId,
        amount: response.totalPrice,
        bookingRef: response.bookingReference
      };
      const qrData = `PAY:${JSON.stringify(paymentData)}`;
      const qrUrl = await QRCode.toDataURL(qrData, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(qrUrl);
      
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
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
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
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">ชำระเงิน</h2>
                
                {/* QR Code Payment */}
                <div className="text-center mb-8">
                  <div className="bg-gray-100 rounded-lg p-8 mb-4">
                    {qrCodeUrl ? (
                      <div className="flex flex-col items-center">
                        <Image
                          src={qrCodeUrl}
                          alt="QR Code สำหรับชำระเงิน"
                          width={200}
                          height={200}
                          className="mb-4"
                        />
                        <p className="text-sm text-gray-600 mb-2">สแกน QR Code เพื่อชำระเงิน</p>
                        <p className="text-lg font-semibold text-primary-600">
                          จำนวนเงิน: ฿{booking.totalPrice?.toLocaleString()}
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <QrCode className="h-32 w-32 mx-auto text-gray-600 mb-4" />
                        <p className="text-sm text-gray-600 mb-2">กำลังสร้าง QR Code...</p>
                        <p className="text-lg font-semibold text-primary-600">
                          จำนวนเงิน: ฿{booking.totalPrice?.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Payment Instructions */}
                  <div className="bg-blue-50 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-blue-900 mb-2">วิธีการชำระเงิน</h3>
                    <div className="text-sm text-blue-800 space-y-1">
                      <p>1. เปิดแอพธนาคารบนมือถือ</p>
                      <p>2. เลือกเมนู "สแกน QR Code"</p>
                      <p>3. สแกน QR Code ด้านบน</p>
                      <p>4. ตรวจสอบจำนวนเงินและยืนยันการชำระ</p>
                      <p>5. อัพโหลดรูปใบเสร็จการชำระเงิน</p>
                    </div>
                  </div>

                  {/* Payment Receipt Upload */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <Upload className="h-5 w-5 mr-2" />
                      อัพโหลดใบเสร็จการชำระเงิน
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          เลือกไฟล์รูปภาพ (JPEG, PNG, GIF - ขนาดไม่เกิน 5MB)
                        </label>
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/gif"
                          onChange={handleReceiptFileChange}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                        />
                      </div>
                      
                      {paymentReceiptUrl && (
                        <div className="border rounded-lg p-4 bg-white">
                          <h4 className="font-medium text-gray-900 mb-2">ตัวอย่างใบเสร็จที่อัพโหลด:</h4>
                          <div className="flex justify-center">
                            <img
                              src={paymentReceiptUrl}
                              alt="ใบเสร็จการชำระเงิน"
                              className="max-w-full max-h-64 object-contain border rounded"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={handlePaymentConfirm}
                    disabled={!paymentReceiptFile || isUploadingReceipt}
                    className={`btn-primary flex items-center justify-center w-full py-3 ${
                      !paymentReceiptFile || isUploadingReceipt ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isUploadingReceipt ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        กำลังอัพโหลด...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5 mr-2" />
                        ยืนยันการชำระเงิน
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {paymentStep === 'customer-info' && (
              <div className="bg-white rounded-lg shadow-lg p-6">
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
                        className="input-field"
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
                        className="input-field"
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
                        className="input-field"
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
                        className="input-field"
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
                      className="input-field"
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
                      className="input-field"
                      placeholder="เช่น ขอเตียงเสริม, ห้องที่เงียบ, อาหารพิเศษ"
                    />
                  </div>                    <button
                      type="submit"
                      className="btn-primary w-full py-3 flex items-center justify-center"
                    >
                      <CheckCircle className="h-5 w-5 mr-2" />
                      บันทึกข้อมูลและส่งรอการอนุมัติ
                    </button>
                </form>
              </div>
            )}

            {paymentStep === 'completed' && (
              <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                <div className="mb-6">
                  <Clock className="h-16 w-16 text-orange-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-semibold text-orange-600 mb-2">ข้อมูลถูกส่งแล้ว!</h2>
                  <p className="text-gray-600">รอการอนุมัติจากผู้ดูแลระบบ</p>
                </div>

                <div className="bg-orange-50 rounded-lg p-4 mb-6">
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
                    className="btn-primary"
                  >
                    ดูการจองของฉัน
                  </button>
                  <button
                    onClick={() => router.push('/')}
                    className="btn-secondary"
                  >
                    กลับหน้าแรก
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Booking Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
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

                <div className="border-t pt-4">
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
