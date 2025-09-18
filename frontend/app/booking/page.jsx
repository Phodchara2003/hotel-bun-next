'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, Users, Bed, CreditCard, ArrowLeft, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BookingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    checkIn: '',
    checkOut: '',
    guests: 1,
    roomType: '',
    totalAmount: 0,
    nights: 0
  });
  const [paymentSettings, setPaymentSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentSlip, setPaymentSlip] = useState(null);
  const [uploadingSlip, setUploadingSlip] = useState(false);

  // ข้อมูลห้องพักแบบเดียว (ราคาเดียวกัน)
  const singleRoomType = { 
    id: 'room', 
    name: 'ห้องพัก', 
    price: 1500, 
    description: 'ห้องพักสะดวกสบายพร้อมสิ่งอำนวยความสะดวกครบครัน' 
  };

  // คำนวณจำนวนคืนและราคารวม
  useEffect(() => {
    if (bookingData.checkIn && bookingData.checkOut) {
      const checkIn = new Date(bookingData.checkIn);
      const checkOut = new Date(bookingData.checkOut);
      const timeDiff = checkOut.getTime() - checkIn.getTime();
      const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      if (nights > 0) {
        // คำนวณราคาห้องเท่านั้น ไม่บวกตามจำนวนคน
        const roomPrice = singleRoomType.price;
        const total = nights * roomPrice; // ไม่คูณกับจำนวนคน
        
        setBookingData(prev => ({
          ...prev,
          nights: nights,
          totalAmount: total,
          roomType: 'room' // Set default room type
        }));
      }
    }
  }, [bookingData.checkIn, bookingData.checkOut, bookingData.roomType]);

  // ดึงข้อมูล QR Code เมื่อไปถึงขั้นตอนชำระเงิน
  useEffect(() => {
    if (step === 4) {
      fetchPaymentSettings();
    }
  }, [step]);

  const fetchPaymentSettings = async () => {
    try {
      setLoading(true);
      // เรียก admin payment settings เพื่อใช้ข้อมูลที่แอดมินตั้งค่า
      const response = await fetch('http://localhost:3001/api/admin/payment-settings');
      
      if (response.ok) {
        const result = await response.json();
        console.log('📋 Admin payment settings loaded for booking:', result);
        
        if (result.success && result.data) {
          // แปลงข้อมูลให้เข้ากับรูปแบบเดิม
          const legacyFormat = {
            success: true,
            data: {
              qrCodeUrl: result.data.promptPay.qrCodeUrl,
              bankName: result.data.bankTransfer.bankName,
              bankAccount: result.data.bankTransfer.accountNumber,
              accountName: result.data.bankTransfer.accountName,
              phoneNumber: result.data.promptPay.phoneNumber
            }
          };
          setPaymentSettings(legacyFormat);
          console.log('💾 Booking payment settings:', legacyFormat);
        }
      } else {
        console.warn('❌ Failed to load admin settings for booking, falling back to simple settings');
        // Fallback เรียก simple settings
        const fallbackResponse = await fetch('http://localhost:3001/api/simple-payment-settings');
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          setPaymentSettings(fallbackData);
          console.log('💳 Fallback booking payment settings loaded:', fallbackData);
        }
      }
    } catch (error) {
      console.error('Error fetching payment settings:', error);
      toast.error('ไม่สามารถโหลดข้อมูลการชำระเงินได้');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setBookingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateStep = (stepNum) => {
    switch (stepNum) {
      case 1:
        if (!bookingData.checkIn || !bookingData.checkOut) {
          toast.error('กรุณาเลือกวันที่เข้าพักและออก');
          return false;
        }
        if (new Date(bookingData.checkIn) >= new Date(bookingData.checkOut)) {
          toast.error('วันที่ออกต้องหลังจากวันที่เข้าพัก');
          return false;
        }
        return true;
      case 2:
        if (!bookingData.guests || bookingData.guests < 1) {
          toast.error('กรุณาระบุจำนวนผู้เข้าพัก');
          return false;
        }
        return true;
      case 3:
        // ไม่ต้องตรวจสอบประเภทห้อง เพราะมีแค่ห้องเดียว
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  // ฟังก์ชันอัปโหลดสลิป
  const handleSlipUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // ตรวจสอบประเภทไฟล์
    if (!file.type.startsWith('image/')) {
      toast.error('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      return;
    }

    // ตรวจสอบขนาดไฟล์ (ไม่เกิน 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('ขนาดไฟล์ต้องไม่เกิน 5MB');
      return;
    }

    setUploadingSlip(true);
    
    try {
      const formData = new FormData();
      formData.append('paymentSlip', file);
      formData.append('bookingId', 'TEMP_' + Date.now()); // Temporary booking ID
      formData.append('amount', bookingData.totalAmount.toString());

      const response = await fetch('http://localhost:3001/api/payment-slip/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setPaymentSlip(result.filePath);
        toast.success('อัปโหลดสลิปเรียบร้อย!');
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading slip:', error);
      toast.error('เกิดข้อผิดพลาดในการอัปโหลดสลิป');
    } finally {
      setUploadingSlip(false);
    }
  };

  const completeBooking = async () => {
    if (!paymentSlip) {
      toast.error('กรุณาอัปโหลดสลิปการโอนเงินก่อนยืนยันการจอง');
      return;
    }

    try {
      setLoading(true);
      
      // สร้างการจองพร้อมข้อมูลสลิป
      const bookingPayload = {
        ...bookingData,
        paymentSlip: paymentSlip,
        paymentStatus: 'pending_verification',
        bookingDate: new Date().toISOString(),
        userId: user?.id
      };

      const response = await fetch('http://localhost:3001/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(bookingPayload)
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('จองห้องพักเรียบร้อย! กำลังรอการตรวจสอบการชำระเงิน');
        
        // ไปยังหน้าสรุปการจอง
        router.push(`/booking-confirmation/${result.bookingId || 'HTL' + Date.now()}`);
      } else {
        throw new Error('Booking failed');
      }
      
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('เกิดข้อผิดพลาดในการจอง');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 text-center">เลือกวันที่เข้าพัก</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  วันที่เข้าพัก
                </label>
                <input
                  type="date"
                  value={bookingData.checkIn}
                  onChange={(e) => handleInputChange('checkIn', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  วันที่ออก
                </label>
                <input
                  type="date"
                  value={bookingData.checkOut}
                  onChange={(e) => handleInputChange('checkOut', e.target.value)}
                  min={bookingData.checkIn || new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {bookingData.checkIn && bookingData.checkOut && bookingData.nights > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <p className="text-blue-800 font-medium">
                  จำนวนคืนที่เข้าพัก: {bookingData.nights} คืน
                </p>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 text-center">จำนวนผู้เข้าพัก</h2>
            
            <div className="max-w-md mx-auto">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                จำนวนผู้เข้าพัก
              </label>
              <select
                value={bookingData.guests}
                onChange={(e) => handleInputChange('guests', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {[1, 2, 3, 4, 5, 6].map(num => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? 'คน' : 'คน'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 text-center">ข้อมูลห้องพัก</h2>
            
            <div className="max-w-md mx-auto">
              <div className="p-6 border-2 border-blue-500 bg-blue-50 rounded-lg">
                <div className="text-center">
                  <Bed className="w-16 h-16 mx-auto mb-4 text-blue-600" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{singleRoomType.name}</h3>
                  <p className="text-gray-600 mb-4">{singleRoomType.description}</p>
                  <p className="text-2xl font-bold text-blue-600 mb-2">
                    ฿{singleRoomType.price.toLocaleString()}/คืน
                  </p>
                  {bookingData.nights > 0 && (
                    <div className="bg-white rounded-lg p-4 mt-4">
                      <p className="text-lg font-semibold text-gray-800">
                        รวม {bookingData.nights} คืน: ฿{(singleRoomType.price * bookingData.nights).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 text-center">ชำระเงิน</h2>
            
            {/* สรุปการจอง */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">สรุปการจอง</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>วันที่เข้าพัก:</span>
                  <span>{new Date(bookingData.checkIn).toLocaleDateString('th-TH')}</span>
                </div>
                <div className="flex justify-between">
                  <span>วันที่ออก:</span>
                  <span>{new Date(bookingData.checkOut).toLocaleDateString('th-TH')}</span>
                </div>
                <div className="flex justify-between">
                  <span>จำนวนคืน:</span>
                  <span>{bookingData.nights} คืน</span>
                </div>
                <div className="flex justify-between">
                  <span>ผู้เข้าพัก:</span>
                  <span>{bookingData.guests} คน</span>
                </div>
                <div className="flex justify-between">
                  <span>ประเภทห้อง:</span>
                  <span>{singleRoomType.name}</span>
                </div>
                <hr className="my-3" />
                <div className="flex justify-between text-lg font-semibold text-blue-600">
                  <span>ยอดรวมทั้งสิ้น:</span>
                  <span>฿{bookingData.totalAmount.toLocaleString()}</span>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  (คิดราคาห้องเท่านั้น ไม่บวกตามจำนวนคน)
                </div>
              </div>
            </div>

            {/* แสดงห้องที่เลือกและตัวเลือกอื่น */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-4">ห้องที่คุณเลือก</h3>
              <div className="max-w-md mx-auto">
                <div className="p-4 border-2 border-blue-500 bg-blue-100 shadow-md rounded-lg">
                  <div className="text-center">
                    <Bed className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <h4 className="font-semibold text-blue-900 mb-1">{singleRoomType.name}</h4>
                    <p className="text-blue-700 text-sm mb-2">{singleRoomType.description}</p>
                    <p className="text-lg font-bold text-blue-600">
                      ฿{singleRoomType.price.toLocaleString()}/คืน
                    </p>
                    <p className="text-xs text-blue-500 mt-1">
                      ราคาเดียวกันทุกห้อง ไม่ขึ้นกับจำนวนคน
                    </p>
                    {bookingData.nights > 0 && (
                      <p className="text-sm text-blue-600 mt-1">
                        รวม {bookingData.nights} คืน: ฿{(singleRoomType.price * bookingData.nights).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code Payment */}
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600">กำลังโหลดข้อมูลการชำระเงิน...</p>
              </div>
            ) : paymentSettings && paymentSettings.qrCodeUrl ? (
              <div className="bg-white border-2 border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                  ชำระเงินด้วย QR Code
                </h3>
                
                <div className="text-center mb-4">
                  <div className="bg-white p-4 rounded-lg border inline-block">
                    <img
                      src={`http://localhost:3001${paymentSettings.qrCodeUrl}`}
                      alt="QR Code สำหรับชำระเงิน"
                      className="w-48 h-48 object-contain mx-auto"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <div className="w-48 h-48 bg-gray-100 flex items-center justify-center text-gray-500" style={{display: 'none'}}>
                      <div className="text-center">
                        <CreditCard className="w-12 h-12 mx-auto mb-2" />
                        <p className="text-sm">ไม่สามารถโหลด QR Code ได้</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center mb-4">
                  <p className="text-gray-700 font-medium mb-2">
                    สแกน QR Code ด้วยแอปธนาคารของคุณ
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    จำนวนเงิน: ฿{bookingData.totalAmount.toLocaleString()}
                  </p>
                </div>

                {/* ข้อมูลธนาคาร */}
                {(paymentSettings.bankName || paymentSettings.accountNumber) && (
                  <div className="bg-blue-50 rounded-lg p-4 mt-4">
                    <h4 className="font-semibold text-blue-800 mb-2">หรือโอนเงินเข้าบัญชี:</h4>
                    <div className="text-sm text-blue-700 space-y-1">
                      {paymentSettings.bankName && (
                        <p><span className="font-medium">ธนาคาร:</span> {paymentSettings.bankName}</p>
                      )}
                      {paymentSettings.accountNumber && (
                        <p><span className="font-medium">เลขที่บัญชี:</span> {paymentSettings.accountNumber}</p>
                      )}
                      {paymentSettings.accountName && (
                        <p><span className="font-medium">ชื่อบัญชี:</span> {paymentSettings.accountName}</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="bg-yellow-50 rounded-lg p-4 mt-4">
                  <p className="text-yellow-800 text-sm">
                    <span className="font-medium">หมายเหตุ:</span> หลังจากโอนเงินแล้ว กรุณาอัปโหลดสลิปการโอนเงินด้านล่าง
                  </p>
                </div>

                {/* ส่วนอัปโหลดสลิป */}
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mt-6">
                  <h4 className="text-lg font-semibold text-green-800 mb-4 text-center">
                    อัปโหลดสลิปการโอนเงิน
                  </h4>
                  
                  {!paymentSlip ? (
                    <div className="text-center">
                      <div className="border-2 border-dashed border-green-300 rounded-lg p-6 mb-4">
                        <CreditCard className="w-12 h-12 mx-auto mb-3 text-green-500" />
                        <p className="text-green-700 mb-3">
                          เลือกไฟล์สลิปการโอนเงิน (JPG, PNG)
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleSlipUpload}
                          disabled={uploadingSlip}
                          className="hidden"
                          id="slip-upload"
                        />
                        <label
                          htmlFor="slip-upload"
                          className={`inline-flex items-center px-4 py-2 border border-green-300 rounded-md shadow-sm text-sm font-medium text-green-700 bg-white hover:bg-green-50 cursor-pointer ${
                            uploadingSlip ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {uploadingSlip ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                              กำลังอัปโหลด...
                            </>
                          ) : (
                            <>
                              <CreditCard className="w-4 h-4 mr-2" />
                              เลือกไฟล์สลิป
                            </>
                          )}
                        </label>
                      </div>
                      <p className="text-sm text-green-600">
                        ขนาดไฟล์ไม่เกิน 5MB
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="bg-white rounded-lg p-4 border-2 border-green-300">
                        <div className="flex items-center justify-center mb-3">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <CreditCard className="w-6 h-6 text-green-600" />
                          </div>
                        </div>
                        <p className="text-green-800 font-medium mb-2">
                          ✅ อัปโหลดสลิปเรียบร้อยแล้ว
                        </p>
                        <p className="text-sm text-green-600 mb-3">
                          ไฟล์: {paymentSlip.split('/').pop()}
                        </p>
                        <button
                          onClick={() => setPaymentSlip(null)}
                          className="text-sm text-green-700 hover:text-green-800 underline"
                        >
                          เปลี่ยนไฟล์
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <CreditCard className="w-12 h-12 mx-auto mb-3 text-red-500" />
                <h3 className="text-lg font-semibold text-red-800 mb-2">ยังไม่สามารถชำระเงินได้</h3>
                <p className="text-red-700">
                  ขออภัย QR Code สำหรับชำระเงินยังไม่พร้อมใช้งาน
                  <br />กรุณาติดต่อเจ้าหน้าที่โรงแรม
                </p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { number: 1, title: 'เลือกวันที่', icon: Calendar },
      { number: 2, title: 'จำนวนผู้เข้าพัก', icon: Users },
      { number: 3, title: 'ประเภทห้อง', icon: Bed },
      { number: 4, title: 'ชำระเงิน', icon: CreditCard },
    ];

    return (
      <div className="flex justify-center mb-8">
        <div className="flex items-center space-x-4">
          {steps.map((stepInfo, index) => {
            const Icon = stepInfo.icon;
            const isActive = step === stepInfo.number;
            const isCompleted = step > stepInfo.number;
            
            return (
              <div key={stepInfo.number} className="flex items-center">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                  isActive 
                    ? 'border-blue-500 bg-blue-500 text-white' 
                    : isCompleted 
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-gray-300 text-gray-400'
                }`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="ml-2 hidden sm:block">
                  <p className={`text-sm font-medium ${
                    isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {stepInfo.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`mx-4 h-0.5 w-8 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">จองห้องพัก</h1>
          <p className="text-gray-600">เลือกรายละเอียดการเข้าพักของคุณ</p>
        </div>

        {renderStepIndicator()}

        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          {renderStepContent()}
        </div>

        <div className="flex justify-between">
          <button
            onClick={prevStep}
            disabled={step === 1}
            className="flex items-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            ย้อนกลับ
          </button>

          {step < 4 ? (
            <button
              onClick={nextStep}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              ถัดไป
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          ) : (
            <button
              onClick={completeBooking}
              disabled={loading || !paymentSettings?.qrCodeUrl || !paymentSlip}
              className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  กำลังจอง...
                </div>
              ) : !paymentSlip ? (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  กรุณาอัปโหลดสลิปก่อน
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  ยืนยันการจองและชำระเงิน
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
