'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Bed, Users2, Calendar, MapPin, Phone, Mail, MessageSquare, CreditCard, Clock, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NewBookingPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [roomTypes, setRoomTypes] = useState([]);
  const [availabilityData, setAvailabilityData] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  
  const [bookingData, setBookingData] = useState({
    // Step 1: วันที่และจำนวนคน
    checkIn: '',
    checkOut: '',
    guests: 1,
    
    // Step 2: ประเภทเตียง
    bedType: '', // 'single' หรือ 'double'
    
    // Step 3: ข้อมูลส่วนตัว
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    nationalId: '',
    specialRequests: ''
  });

  // Load user profile data
  useEffect(() => {
    if (user) {
      setBookingData(prev => ({
        ...prev,
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        email: user.email || '',
        phone: user.phone || ''
      }));
    }
  }, [user]);

  // Load room types
  useEffect(() => {
    fetchRoomTypes();
  }, []);

  const fetchRoomTypes = async () => {
    try {
      const response = await fetch('http://localhost:5680/api/room-types');
      const data = await response.json();
      
      if (data.success) {
        setRoomTypes(data.data);
      }
    } catch (error) {
      console.error('Error fetching room types:', error);
    }
  };

  const checkAvailability = async () => {
    if (!bookingData.bedType || !bookingData.checkIn || !bookingData.checkOut) {
      return;
    }

    setCheckingAvailability(true);
    try {
      const response = await fetch('http://localhost:5680/api/rooms/check-availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bed_type: bookingData.bedType,
          check_in_date: bookingData.checkIn,
          check_out_date: bookingData.checkOut
        })
      });

      const data = await response.json();
      setAvailabilityData(data.data);
      
      if (data.success && data.data.totalAvailable > 0) {
        toast.success(`พบห้อง${bookingData.bedType === 'single' ? 'เตียงเดี่ยว' : 'เตียงคู่'}ว่าง ${data.data.totalAvailable} ห้อง`);
      } else {
        toast.error(`ไม่มีห้อง${bookingData.bedType === 'single' ? 'เตียงเดี่ยว' : 'เตียงคู่'}ว่างในช่วงเวลาดังกล่าว`);
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      toast.error('เกิดข้อผิดพลาดในการตรวจสอบห้องว่าง');
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleInputChange = (field, value) => {
    setBookingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateNights = () => {
    if (!bookingData.checkIn || !bookingData.checkOut) return 0;
    const checkIn = new Date(bookingData.checkIn);
    const checkOut = new Date(bookingData.checkOut);
    const timeDiff = checkOut.getTime() - checkIn.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  const calculateTotal = () => {
    const nights = calculateNights();
    if (!availabilityData || nights <= 0) return 0;
    return nights * availabilityData.pricePerNight;
  };

  const handleNext = async () => {
    if (step === 1) {
      // ตรวจสอบวันที่
      if (!bookingData.checkIn || !bookingData.checkOut) {
        toast.error('กรุณาเลือกวันที่เข้าพักและออก');
        return;
      }
      
      const checkIn = new Date(bookingData.checkIn);
      const checkOut = new Date(bookingData.checkOut);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (checkIn < today) {
        toast.error('วันที่เข้าพักต้องเป็นวันนี้หรือหลังจากนี้');
        return;
      }
      
      if (checkOut <= checkIn) {
        toast.error('วันที่ออกต้องหลังจากวันที่เข้าพัก');
        return;
      }
    }
    
    if (step === 2) {
      // ตรวจสอบการเลือกประเภทเตียง
      if (!bookingData.bedType) {
        toast.error('กรุณาเลือกประเภทเตียง');
        return;
      }
      
      // ตรวจสอบความพร้อมของห้อง
      if (!availabilityData || availabilityData.totalAvailable === 0) {
        toast.error('ไม่มีห้องว่างในช่วงเวลาที่เลือก');
        return;
      }
    }
    
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('กรุณาเข้าสู่ระบบก่อนทำการจอง');
      router.push('/login');
      return;
    }

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!bookingData.firstName || !bookingData.lastName || !bookingData.email) {
      toast.error('กรุณากรอกข้อมูลส่วนตัวให้ครบถ้วน');
      return;
    }

    // ตรวจสอบเลขบัตรประชาชน
    const nationalIdDigits = bookingData.nationalId.replace(/\\D/g, '');
    if (nationalIdDigits.length !== 13) {
      toast.error('รหัสบัตรประชาชนต้องมี 13 หลัก');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5680/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          user_id: parseInt(user.id),
          hotel_id: 2, // โรงแรมหลัก
          bed_type: bookingData.bedType,
          check_in_date: bookingData.checkIn,
          check_out_date: bookingData.checkOut,
          guests: bookingData.guests,
          guest_name: `${bookingData.firstName} ${bookingData.lastName}`,
          guest_phone: bookingData.phone,
          guest_email: bookingData.email,
          guest_national_id: nationalIdDigits,
          special_requests: bookingData.specialRequests || ''
        })
      });

      const data = await response.json();
      console.log('Booking response data:', data); // Debug log

      if (data.success) {
        toast.success('จองห้องพักสำเร็จ!');
        
        // Debug log booking data
        console.log('Booking data from backend:', data.booking);
        console.log('Frontend booking data:', bookingData);
        
        // สร้าง URL พร้อมข้อมูลครบถ้วน
        const successUrl = new URLSearchParams({
          bookingId: data.booking.id,
          reference: data.booking.bookingReference || '',
          roomName: data.booking.roomTypeName || '',
          roomNumber: data.booking.room_number || '',
          floor: data.booking.floor || '',
          hotelName: data.booking.hotelName || 'โรงแรมวรุณภัฏ',
          checkIn: data.booking.checkInDate || bookingData.checkIn,
          checkOut: data.booking.checkOutDate || bookingData.checkOut,
          guests: data.booking.guests || bookingData.guests,
          guestName: `${bookingData.firstName} ${bookingData.lastName}`,
          guestEmail: bookingData.email,
          guestPhone: bookingData.phone,
          total: data.booking.totalPrice || calculateTotal()
        }).toString();
        
        console.log('Success URL params:', successUrl); // Debug log
        
        router.push(`/booking-success?${successUrl}`);
      } else {
        toast.error(data.message || 'เกิดข้อผิดพลาดในการจอง');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('เกิดข้อผิดพลาดในการจอง');
    } finally {
      setLoading(false);
    }
  };

  const formatNationalId = (value) => {
    const cleaned = value.replace(/\\D/g, '');
    const limited = cleaned.substring(0, 13);
    
    if (limited.length >= 10) {
      return limited.replace(/(\\d{1})(\\d{4})(\\d{5})(\\d{0,2})(\\d{0,1})/, '$1-$2-$3-$4-$5');
    } else if (limited.length >= 6) {
      return limited.replace(/(\\d{1})(\\d{4})(\\d{0,5})/, '$1-$2-$3');
    } else if (limited.length >= 1) {
      return limited.replace(/(\\d{1})(\\d{0,4})/, '$1-$2');
    }
    
    return limited;
  };

  // Check availability when bed type or dates change
  useEffect(() => {
    if (bookingData.bedType && bookingData.checkIn && bookingData.checkOut) {
      checkAvailability();
    }
  }, [bookingData.bedType, bookingData.checkIn, bookingData.checkOut]);

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Calendar className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">เลือกวันที่เข้าพัก</h2>
        <p className="text-gray-600">กรุณาเลือกวันที่เข้าพักและออก</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            วันที่เข้าพัก <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={bookingData.checkIn}
            onChange={(e) => handleInputChange('checkIn', e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            วันที่ออก <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={bookingData.checkOut}
            onChange={(e) => handleInputChange('checkOut', e.target.value)}
            min={bookingData.checkIn || new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="max-w-md mx-auto">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          จำนวนผู้เข้าพัก <span className="text-red-500">*</span>
        </label>
        <select
          value={bookingData.guests}
          onChange={(e) => handleInputChange('guests', parseInt(e.target.value))}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {[1, 2].map(num => (
            <option key={num} value={num}>
              {num} คน
            </option>
          ))}
        </select>
        <p className="text-sm text-gray-500 mt-2">
          💡 เตียงเดี่ยว: สูงสุด 1 คน | เตียงคู่: สูงสุด 2 คน
        </p>
      </div>

      {bookingData.checkIn && bookingData.checkOut && (
        <div className="max-w-md mx-auto bg-blue-50 p-4 rounded-lg">
          <p className="text-blue-800 font-medium">
            จำนวนคืน: {calculateNights()} คืน
          </p>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Bed className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">เลือกประเภทเตียง</h2>
        <p className="text-gray-600">ระบบจะจัดสรรห้องพักให้อัตโนมัติตามประเภทเตียงที่เลือก</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Single Bed */}
        <div
          onClick={() => handleInputChange('bedType', 'single')}
          className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
            bookingData.bedType === 'single'
              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
              : 'border-gray-300 hover:border-blue-300 bg-white hover:bg-gray-50'
          }`}
        >
          <div className="text-center">
            <Bed className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">เตียงเดี่ยว</h3>
            <p className="text-gray-600 mb-4">สำหรับ 1 คน</p>
            <div className="text-2xl font-bold text-blue-600 mb-2">
              ฿800 <span className="text-sm font-normal text-gray-500">/ คืน</span>
            </div>
            <div className="text-sm text-gray-500">
              ห้องพักขนาดมาตรฐาน เตียงเดี่ยว
            </div>
          </div>
        </div>

        {/* Double Bed */}
        <div
          onClick={() => handleInputChange('bedType', 'double')}
          className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
            bookingData.bedType === 'double'
              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
              : 'border-gray-300 hover:border-blue-300 bg-white hover:bg-gray-50'
          }`}
        >
          <div className="text-center">
            <Bed className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">เตียงคู่</h3>
            <p className="text-gray-600 mb-4">สำหรับ 2 คน</p>
            <div className="text-2xl font-bold text-blue-600 mb-2">
              ฿1,200 <span className="text-sm font-normal text-gray-500">/ คืน</span>
            </div>
            <div className="text-sm text-gray-500">
              ห้องพักขนาดมาตรฐาน เตียงคู่
            </div>
          </div>
        </div>
      </div>

      {/* Availability Status */}
      {checkingAvailability && (
        <div className="max-w-md mx-auto bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600 mr-2"></div>
            <p className="text-yellow-800">กำลังตรวจสอบห้องว่าง...</p>
          </div>
        </div>
      )}

      {availabilityData && bookingData.bedType && (
        <div className="max-w-md mx-auto">
          <div className={`p-4 rounded-lg ${
            availabilityData.totalAvailable > 0 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center justify-center mb-2">
              {availabilityData.totalAvailable > 0 ? (
                <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
              ) : (
                <Clock className="w-6 h-6 text-red-600 mr-2" />
              )}
              <p className={`font-medium ${
                availabilityData.totalAvailable > 0 ? 'text-green-800' : 'text-red-800'
              }`}>
                {availabilityData.totalAvailable > 0 
                  ? `ห้อง${bookingData.bedType === 'single' ? 'เตียงเดี่ยว' : 'เตียงคู่'}ว่าง ${availabilityData.totalAvailable} ห้อง`
                  : `ไม่มีห้อง${bookingData.bedType === 'single' ? 'เตียงเดี่ยว' : 'เตียงคู่'}ว่าง`
                }
              </p>
            </div>
            {availabilityData.totalAvailable > 0 && (
              <div className="text-center">
                <p className="text-green-700 font-semibold">
                  ราคารวม {calculateNights()} คืน: ฿{calculateTotal().toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Users2 className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">ข้อมูลผู้เข้าพัก</h2>
        <p className="text-gray-600">กรุณากรอกข้อมูลส่วนตัวสำหรับการจอง</p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ชื่อ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={bookingData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="ชื่อจริง"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              นามสกุล <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={bookingData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="นามสกุล"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            อีเมล <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="email"
              value={bookingData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="example@email.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            เบอร์โทรศัพท์
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="tel"
              value={bookingData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="08x-xxx-xxxx"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            เลขบัตรประชาชน <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <IdCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={bookingData.nationalId}
              onChange={(e) => handleInputChange('nationalId', formatNationalId(e.target.value))}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="x-xxxx-xxxxx-xx-x"
              maxLength={17}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            คำขอพิเศษ (ไม่บังคับ)
          </label>
          <div className="relative">
            <MessageSquare className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <textarea
              value={bookingData.specialRequests}
              onChange={(e) => handleInputChange('specialRequests', e.target.value)}
              rows={3}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="ขอห้องที่มีวิวสวย, ขอเตียงเสริม, ฯลฯ"
            />
          </div>
        </div>

        {/* Booking Summary */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">สรุปการจอง</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>ประเภทเตียง:</span>
              <span className="font-medium">
                {bookingData.bedType === 'single' ? 'เตียงเดี่ยว' : 'เตียงคู่'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>วันที่เข้าพัก:</span>
              <span className="font-medium">{bookingData.checkIn}</span>
            </div>
            <div className="flex justify-between">
              <span>วันที่ออก:</span>
              <span className="font-medium">{bookingData.checkOut}</span>
            </div>
            <div className="flex justify-between">
              <span>จำนวนคืน:</span>
              <span className="font-medium">{calculateNights()} คืน</span>
            </div>
            <div className="flex justify-between">
              <span>จำนวนผู้เข้าพัก:</span>
              <span className="font-medium">{bookingData.guests} คน</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between text-lg font-bold text-blue-600">
                <span>ราคารวม:</span>
                <span>฿{calculateTotal().toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">จองห้องพัก</h1>
          <p className="text-gray-600">ระบบจองห้องพักอัตโนมัติ</p>
        </div>

        {/* Progress Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNumber 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {stepNumber}
                </div>
                {stepNumber < 3 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>วันที่</span>
            <span>ประเภทเตียง</span>
            <span>ข้อมูลส่วนตัว</span>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8 mb-8">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>

        {/* Navigation Buttons */}
        <div className="max-w-4xl mx-auto flex justify-between">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : router.push('/')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {step > 1 ? 'ย้อนกลับ' : 'กลับหน้าแรก'}
          </button>
          
          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={
                (step === 1 && (!bookingData.checkIn || !bookingData.checkOut)) ||
                (step === 2 && (!bookingData.bedType || !availabilityData || availabilityData.totalAvailable === 0))
              }
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              ถัดไป
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading || !bookingData.firstName || !bookingData.lastName || !bookingData.email}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  กำลังจอง...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  ยืนยันการจอง
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}