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

  // ข้อมูลประเภทห้องตัวอย่าง
  const roomTypes = [
    { id: 'standard', name: 'Standard Room', price: 1500, description: 'ห้องมาตรฐานพร้อมสิ่งอำนวยความสะดวก' },
    { id: 'deluxe', name: 'Deluxe Room', price: 2500, description: 'ห้องดีลักซ์ขนาดใหญ่พร้อมวิวสวยงาม' },
    { id: 'suite', name: 'Suite Room', price: 4000, description: 'ห้องสวีทพร้อมห้องนั่งเล่นแยก' },
  ];

  // คำนวณจำนวนคืนและราคารวม
  useEffect(() => {
    if (bookingData.checkIn && bookingData.checkOut) {
      const checkIn = new Date(bookingData.checkIn);
      const checkOut = new Date(bookingData.checkOut);
      const timeDiff = checkOut.getTime() - checkIn.getTime();
      const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      if (nights > 0) {
        const selectedRoom = roomTypes.find(room => room.id === bookingData.roomType);
        const roomPrice = selectedRoom ? selectedRoom.price : 0;
        const total = nights * roomPrice;
        
        setBookingData(prev => ({
          ...prev,
          nights: nights,
          totalAmount: total
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
      const response = await fetch('http://localhost:3001/api/simple-payment-settings');
      
      if (response.ok) {
        const data = await response.json();
        setPaymentSettings(data);
        console.log('Payment settings loaded:', data);
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
        if (!bookingData.roomType) {
          toast.error('กรุณาเลือกประเภทห้อง');
          return false;
        }
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

  const completeBooking = async () => {
    try {
      setLoading(true);
      
      // สร้างการจอง (จำลอง)
      const bookingId = 'HTL' + Date.now();
      
      toast.success('จองห้องพักเรียบร้อย!');
      
      // ไปยังหน้าสรุปการจอง
      router.push(`/booking-confirmation/${bookingId}`);
      
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
            <h2 className="text-2xl font-bold text-gray-900 text-center">เลือกประเภทห้อง</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {roomTypes.map(room => (
                <div
                  key={room.id}
                  onClick={() => handleInputChange('roomType', room.id)}
                  className={`p-6 border-2 rounded-lg cursor-pointer transition-colors ${
                    bookingData.roomType === room.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-300'
                  }`}
                >
                  <div className="text-center">
                    <Bed className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{room.name}</h3>
                    <p className="text-gray-600 text-sm mb-3">{room.description}</p>
                    <p className="text-xl font-bold text-blue-600">
                      ฿{room.price.toLocaleString()}/คืน
                    </p>
                    {bookingData.nights > 0 && (
                      <p className="text-sm text-gray-500 mt-1">
                        รวม {bookingData.nights} คืน: ฿{(room.price * bookingData.nights).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
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
                  <span>{roomTypes.find(r => r.id === bookingData.roomType)?.name}</span>
                </div>
                <hr className="my-3" />
                <div className="flex justify-between text-lg font-semibold text-blue-600">
                  <span>ยอดรวมทั้งสิ้น:</span>
                  <span>฿{bookingData.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* แสดงห้องที่เลือกและตัวเลือกอื่น */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-4">ห้องที่คุณเลือก</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {roomTypes.map(room => (
                  <div
                    key={room.id}
                    onClick={() => handleInputChange('roomType', room.id)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      bookingData.roomType === room.id
                        ? 'border-blue-500 bg-blue-100 shadow-md'
                        : 'border-gray-300 bg-white hover:border-blue-300'
                    }`}
                  >
                    <div className="text-center">
                      <Bed className={`w-8 h-8 mx-auto mb-2 ${
                        bookingData.roomType === room.id ? 'text-blue-600' : 'text-gray-600'
                      }`} />
                      <h4 className={`font-semibold mb-1 ${
                        bookingData.roomType === room.id ? 'text-blue-800' : 'text-gray-900'
                      }`}>
                        {room.name}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">{room.description}</p>
                      <p className={`font-bold ${
                        bookingData.roomType === room.id ? 'text-blue-600' : 'text-gray-800'
                      }`}>
                        ฿{room.price.toLocaleString()}/คืน
                      </p>
                      {bookingData.nights > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          รวม {bookingData.nights} คืน: ฿{(room.price * bookingData.nights).toLocaleString()}
                        </p>
                      )}
                      {bookingData.roomType === room.id && (
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-800 bg-blue-200 rounded-full">
                            ✓ เลือกแล้ว
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-center text-sm text-blue-600 mt-3">
                คลิกที่ห้องอื่นเพื่อเปลี่ยนแปลงการเลือก
              </p>
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
                    <span className="font-medium">หมายเหตุ:</span> หลังจากโอนเงินแล้ว ระบบจะนำคุณไปยังหน้าอัปโหลดสลิปการโอนเงิน
                  </p>
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
              disabled={loading || !paymentSettings?.qrCodeUrl}
              className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  กำลังจอง...
                </div>
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
