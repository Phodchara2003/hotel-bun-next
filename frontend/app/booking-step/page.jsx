'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Users, MapPin, Star, User } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function BookingStepPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [selectedRoom, setSelectedRoom] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [bookingForm, setBookingForm] = useState({
    checkIn: '',
    checkOut: '',
    guests: 1,
    guestName: user?.name || '',
    guestEmail: user?.email || '',
    guestPhone: ''
  });

  // รับ roomId จาก URL
  const roomId = searchParams.get('roomId');

  useEffect(() => {
    fetchHotelsAndRooms();
  }, []);

  // Auto-fill profile data when user is authenticated
  useEffect(() => {
    if (user && isAuthenticated) {
      loadUserProfile();
    }
  }, [user, isAuthenticated]);

  useEffect(() => {
    if (roomId && roomTypes.length > 0) {
      const room = roomTypes.find(r => r.id === parseInt(roomId));
      console.log('🏠 Selected room in booking-step:', room);
      console.log('🖼️ Room images:', room?.images);
      setSelectedRoom(room);
    }
  }, [roomId, roomTypes]);

  const fetchHotelsAndRooms = async () => {
    try {
      setLoading(true);
      
      const hotelsRes = await fetch('http://localhost:3001/api/hotels');
      const hotelsData = await hotelsRes.json();
      
      const roomsRes = await fetch('http://localhost:3001/api/room-types-with-images');
      const roomsData = await roomsRes.json();
      
      if (hotelsData.success) {
        setHotels(hotelsData.data);
      }
      
      if (roomsData.success) {
        setRoomTypes(roomsData.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load profile data for autofill
  const loadUserProfile = async () => {
    if (!isAuthenticated) return;
    
    try {
      // ตรวจสอบ token จากหลายแหล่ง
      let token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];
      
      // ถ้าไม่มี token ใน cookie ให้ลองหาใน localStorage
      if (!token && typeof window !== 'undefined') {
        token = localStorage.getItem('auth_token_persistent') || 
                localStorage.getItem('auth_token_backup');
      }

      if (!token) {
        console.warn('No token found for profile loading');
        toast.error('ไม่พบข้อมูลการยืนยันตัวตน กรุณาเข้าสู่ระบบใหม่');
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
        const profile = data?.profile || {};
        
        console.log('📝 Loading profile data for booking-step form:', profile);
        
        // อัปเดตข้อมูลฟอร์มจากโปรไฟล์
        const updatedFormData = {
          ...bookingForm,
          guestName: `${profile?.firstName || profile?.first_name || ''} ${profile?.lastName || profile?.last_name || ''}`.trim() || user?.name || '',
          guestEmail: profile?.email || user?.email || '',
          guestPhone: profile?.phone || user?.phone || ''
        };
        
        setBookingForm(updatedFormData);
        
        console.log('✅ Booking-step auto-fill completed with data:', updatedFormData);

        toast.success('ดึงข้อมูลจากโปรไฟล์เรียบร้อย', {
          duration: 2000,
          icon: '👤'
        });
      } else if (response.status === 401) {
        // Token หมดอายุ
        toast.error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
        router.push('/login');
      } else {
        // Fallback to user context data
        console.log('📝 Using user context data for booking-step form');
        const fallbackData = {
          ...bookingForm,
          guestName: user?.name || '',
          guestEmail: user?.email || '',
          guestPhone: user?.phone || ''
        };
        
        setBookingForm(fallbackData);
        toast.success('ใช้ข้อมูลผู้ใช้พื้นฐาน', {
          duration: 2000,
          icon: '👤'
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      // Fallback to user context data
      const fallbackData = {
        ...bookingForm,
        guestName: user?.name || '',
        guestEmail: user?.email || '',
        guestPhone: user?.phone || ''
      };
      
      setBookingForm(fallbackData);
      toast.error('เกิดข้อผิดพลาดในการดึงข้อมูลโปรไฟล์');
    }
  };

  const getPrice = (room) => {
    return room.price_per_night || room.pricePerNight || room.price || 1500;
  };

  const calculateTotal = () => {
    if (!selectedRoom || !bookingForm.checkIn || !bookingForm.checkOut) return 0;
    
    const checkIn = new Date(bookingForm.checkIn);
    const checkOut = new Date(bookingForm.checkOut);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    
    return Math.max(1, nights) * getPrice(selectedRoom);
  };

  const handleFormChange = (field, value) => {
    setBookingForm(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Check if room is selected
    if (!selectedRoom) {
      newErrors.room = 'กรุณาเลือกห้องพัก';
    }

    // Check dates
    if (!bookingForm.checkIn) {
      newErrors.checkIn = 'กรุณาเลือกวันที่เข้าพัก';
    }
    
    if (!bookingForm.checkOut) {
      newErrors.checkOut = 'กรุณาเลือกวันที่ออก';
    }
    
    if (bookingForm.checkIn && bookingForm.checkOut) {
      const checkInDate = new Date(bookingForm.checkIn);
      const checkOutDate = new Date(bookingForm.checkOut);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (checkInDate < today) {
        newErrors.checkIn = 'วันที่เข้าพักต้องเป็นวันนี้หรือวันถัดไป';
      }
      
      if (checkOutDate <= checkInDate) {
        newErrors.checkOut = 'วันที่ออกต้องหลังจากวันที่เข้าพัก';
      }
    }

    // Check guest information
    if (!bookingForm.guestName?.trim()) {
      newErrors.guestName = 'กรุณากรอกชื่อผู้เข้าพัก';
    } else if (bookingForm.guestName.trim().length < 2) {
      newErrors.guestName = 'ชื่อผู้เข้าพักต้องมีอย่างน้อย 2 ตัวอักษร';
    }
    
    if (!bookingForm.guestEmail?.trim()) {
      newErrors.guestEmail = 'กรุณากรอกอีเมล';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(bookingForm.guestEmail.trim())) {
        newErrors.guestEmail = 'รูปแบบอีเมลไม่ถูกต้อง';
      }
    }
    
    if (!bookingForm.guestPhone?.trim()) {
      newErrors.guestPhone = 'กรุณากรอกเบอร์โทรศัพท์';
    } else {
      const phoneRegex = /^[0-9]{9,10}$/;
      const cleanPhone = bookingForm.guestPhone.replace(/[-\s]/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        newErrors.guestPhone = 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 9-10 หลัก';
      }
    }

    // Check guests number
    if (selectedRoom && bookingForm.guests > selectedRoom.max_guests) {
      newErrors.guests = `จำนวนผู้เข้าพักไม่เกิน ${selectedRoom.max_guests} คน`;
    }

    // Check authentication
    if (!user?.id) {
      newErrors.auth = 'กรุณาเข้าสู่ระบบก่อนทำการจอง';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProceedToPayment = async () => {
    // Validate form first
    if (!validateForm()) {
      // Scroll to first error
      const firstErrorField = document.querySelector('.error-field');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    try {
      setSubmitting(true);
      
      const total = calculateTotal();
      const hotel = hotels.find(h => h.id === selectedRoom.hotel_id) || { id: 1 };

      // สร้างการจองในฐานข้อมูล
      const bookingData = {
        user_id: user.id,
        hotel_id: hotel.id,
        room_type_id: selectedRoom.id,
        check_in_date: bookingForm.checkIn,
        check_out_date: bookingForm.checkOut,
        guests: bookingForm.guests,
        guest_name: bookingForm.guestName.trim(),
        guest_email: bookingForm.guestEmail.trim(),
        guest_phone: bookingForm.guestPhone.trim(),
        total_price: total
      };

      console.log('Sending booking data:', bookingData);

      const response = await fetch('http://localhost:3001/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Check if data has booking ID
        const bookingId = result.data?.id || result.data?.insertId || (Array.isArray(result.data) ? null : null);
        
        if (bookingId) {
          // ไปหน้าชำระเงินพร้อม booking ID
          const paymentUrl = `/payment-step?` + new URLSearchParams({
            bookingId: bookingId,
            roomName: selectedRoom.name,
            hotelName: hotel.name,
            checkIn: bookingForm.checkIn,
            checkOut: bookingForm.checkOut,
            guests: bookingForm.guests,
            guestName: bookingForm.guestName,
            guestEmail: bookingForm.guestEmail,
            guestPhone: bookingForm.guestPhone,
            total: total
          }).toString();

          router.push(paymentUrl);
        } else {
          setErrors({ submit: 'ไม่สามารถสร้าง ID การจองได้ กรุณาลองใหม่' });
        }
      } else {
        setErrors({ submit: result.message || 'เกิดข้อผิดพลาดในการสร้างการจอง' });
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      setErrors({ submit: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (!selectedRoom) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">เลือกห้องพัก</h1>
            <p className="text-gray-600 mb-6">กรุณาเลือกห้องพักจากหน้าแรก</p>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
            >
              กลับไปหน้าแรก
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hotel = hotels.find(h => h.id === selectedRoom.hotel_id) || { name: 'โรงแรม', address: '', rating: 4.5 };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">จองห้องพัก</h1>
          <p className="text-gray-600">ขั้นตอนที่ 1: กรอกข้อมูลการจอง</p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Room Details */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">ห้องพักที่เลือก</h2>
              
              <div className="mb-4">
                <img
                  src={
                    selectedRoom.images && Array.isArray(selectedRoom.images) && selectedRoom.images.length > 0
                      ? `/images/rooms/${selectedRoom.images[0]}`
                      : "/images/rooms/placeholder.svg"
                  }
                  alt={selectedRoom.name}
                  className="w-full h-48 object-cover rounded-lg"
                  onLoad={() => {
                    console.log('✅ Booking step image loaded:', selectedRoom.images?.[0]);
                  }}
                  onError={(e) => {
                    console.log('❌ Booking step image failed:', selectedRoom.images?.[0]);
                    e.target.src = "/images/rooms/placeholder.svg";
                  }}
                />
              </div>

              <h3 className="text-xl font-semibold text-blue-600 mb-2">{selectedRoom.name}</h3>
              <p className="text-gray-600 mb-4">{selectedRoom.description}</p>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>{hotel.name}</span>
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  <span>รองรับได้สูงสุด {selectedRoom.max_guests} คน</span>
                </div>
                <div className="flex items-center">
                  <Star className="w-4 h-4 mr-2 text-yellow-500" />
                  <span>คะแนน {hotel.rating}/5</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">ราคาต่อคืน</span>
                  <span className="text-2xl font-bold text-green-600">
                    ฿{getPrice(selectedRoom).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Booking Form */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">ข้อมูลการจอง</h2>
              
              {/* Show general errors */}
              {(errors.room || errors.auth || errors.submit) && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-red-800 text-sm space-y-1">
                    {errors.room && <div>• {errors.room}</div>}
                    {errors.auth && <div>• {errors.auth}</div>}
                    {errors.submit && <div>• {errors.submit}</div>}
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                {/* Check-in & Check-out */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      วันที่เข้าพัก <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={bookingForm.checkIn}
                      onChange={(e) => handleFormChange('checkIn', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.checkIn ? 'border-red-300 error-field' : 'border-gray-300'
                      }`}
                      required
                    />
                    {errors.checkIn && <p className="text-red-500 text-sm mt-1">{errors.checkIn}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      วันที่ออก <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={bookingForm.checkOut}
                      onChange={(e) => handleFormChange('checkOut', e.target.value)}
                      min={bookingForm.checkIn || new Date().toISOString().split('T')[0]}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.checkOut ? 'border-red-300 error-field' : 'border-gray-300'
                      }`}
                      required
                    />
                    {errors.checkOut && <p className="text-red-500 text-sm mt-1">{errors.checkOut}</p>}
                  </div>
                </div>

                {/* Number of Guests */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    จำนวนผู้เข้าพัก <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={bookingForm.guests}
                    onChange={(e) => handleFormChange('guests', parseInt(e.target.value))}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.guests ? 'border-red-300 error-field' : 'border-gray-300'
                    }`}
                  >
                    {[...Array(selectedRoom.max_guests)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1} คน
                      </option>
                    ))}
                  </select>
                  {errors.guests && <p className="text-red-500 text-sm mt-1">{errors.guests}</p>}
                </div>

                {/* Guest Information */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">ข้อมูลผู้เข้าพัก</h4>
                    {isAuthenticated && (
                      <button
                        type="button"
                        onClick={loadUserProfile}
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <User className="h-4 w-4" />
                        ดึงข้อมูลจากโปรไฟล์
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อผู้เข้าพัก <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={bookingForm.guestName}
                    onChange={(e) => handleFormChange('guestName', e.target.value)}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.guestName ? 'border-red-300 error-field' : 'border-gray-300'
                    }`}
                    placeholder="กรอกชื่อเต็ม"
                    required
                  />
                  {errors.guestName && <p className="text-red-500 text-sm mt-1">{errors.guestName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    อีเมล <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={bookingForm.guestEmail}
                    onChange={(e) => handleFormChange('guestEmail', e.target.value)}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.guestEmail ? 'border-red-300 error-field' : 'border-gray-300'
                    }`}
                    placeholder="example@email.com"
                    required
                  />
                  {errors.guestEmail && <p className="text-red-500 text-sm mt-1">{errors.guestEmail}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={bookingForm.guestPhone}
                    onChange={(e) => handleFormChange('guestPhone', e.target.value)}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.guestPhone ? 'border-red-300 error-field' : 'border-gray-300'
                    }`}
                    placeholder="08x-xxx-xxxx"
                    required
                  />
                  {errors.guestPhone && <p className="text-red-500 text-sm mt-1">{errors.guestPhone}</p>}
                </div>

                {/* Total Calculation */}
                {bookingForm.checkIn && bookingForm.checkOut && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-2">สรุปการจอง</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>จำนวนคืน:</span>
                        <span>{Math.max(1, Math.ceil((new Date(bookingForm.checkOut) - new Date(bookingForm.checkIn)) / (1000 * 60 * 60 * 24)))} คืน</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ราคาต่อคืน:</span>
                        <span>฿{getPrice(selectedRoom).toLocaleString()}</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between font-bold text-lg">
                        <span>รวมทั้งหมด:</span>
                        <span className="text-green-600">฿{calculateTotal().toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-4">
                  <button
                    onClick={() => router.push('/')}
                    disabled={submitting}
                    className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← กลับหน้าแรก
                  </button>
                  
                  <button
                    onClick={handleProceedToPayment}
                    disabled={submitting}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        กำลังบันทึก...
                      </>
                    ) : (
                      'ดำเนินการชำระเงิน →'
                    )}
                  </button>
                </div>

                {/* Required Fields Note */}
                <div className="text-sm text-gray-500 text-center pt-2">
                  <span className="text-red-500">*</span> ข้อมูลที่จำเป็นต้องกรอก
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}