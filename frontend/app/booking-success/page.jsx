'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  CheckCircle, 
  Calendar, 
  Users, 
  MapPin, 
  Building, 
  CreditCard,
  Phone,
  Mail,
  Home,
  Receipt,
  ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function BookingSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [bookingDetails, setBookingDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    fetchBookingDetails();
  }, []);

  // Countdown timer to redirect
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          router.push('/bookings');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const fetchBookingDetails = async () => {
    try {
      const bookingId = searchParams.get('bookingId');
      
      if (!bookingId) {
        toast.error('ไม่พบข้อมูลการจอง');
        router.push('/');
        return;
      }

      console.log('🔍 Fetching booking details for ID:', bookingId);

      const response = await fetch(`http://localhost:3001/api/booking-details?booking_id=${bookingId}`, {
        headers: {
          'Authorization': `Bearer ${user?.token || localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setBookingDetails(result.data);
          console.log('✅ Booking details loaded:', result.data);
        } else {
          throw new Error(result.message || 'ไม่สามารถโหลดข้อมูลการจองได้');
        }
      } else {
        throw new Error('ไม่สามารถโหลดข้อมูลการจองได้');
      }
    } catch (error) {
      console.error('Error fetching booking details:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      // ใช้ข้อมูลจาก URL parameters เป็น fallback
      loadFallbackData();
    } finally {
      setLoading(false);
    }
  };

  const loadFallbackData = () => {
    // ใช้ข้อมูลจาก URL parameters หากไม่สามารถดึงจาก API ได้
    const fallbackData = {
      id: searchParams.get('bookingId') || 'N/A',
      booking_reference: searchParams.get('reference') || 'HTL' + Date.now().toString().slice(-6),
      room_number: searchParams.get('roomNumber') || 'กำลังจัดสรร',
      floor: searchParams.get('floor') || 'N/A',
      room_type_name: searchParams.get('roomName') || 'ห้องพัก',
      hotel_name: searchParams.get('hotelName') || 'โรงแรมวรุณภัฏ',
      check_in_date: searchParams.get('checkIn') || '',
      check_out_date: searchParams.get('checkOut') || '',
      guests: parseInt(searchParams.get('guests')) || 1,
      total_price: parseFloat(searchParams.get('total')) || 0,
      guest_name: searchParams.get('guestName') || '',
      guest_email: searchParams.get('guestEmail') || '',
      guest_phone: searchParams.get('guestPhone') || '',
      status: 'pending',
      payment_status: 'pending'
    };
    setBookingDetails(fallbackData);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('th-TH').format(price);
  };

  const calculateNights = () => {
    if (!bookingDetails?.check_in_date || !bookingDetails?.check_out_date) return 1;
    const checkIn = new Date(bookingDetails.check_in_date);
    const checkOut = new Date(bookingDetails.check_out_date);
    const timeDiff = checkOut.getTime() - checkIn.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  const getBedTypeDisplay = (bedType) => {
    switch (bedType) {
      case 'single': return 'เตียงเดี่ยว';
      case 'double': return 'เตียงคู่';
      default: return bedType;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-thai">กำลังโหลดข้อมูลการจอง...</p>
        </div>
      </div>
    );
  }

  if (!bookingDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2 font-thai-header">ไม่พบข้อมูลการจอง</h2>
          <p className="text-gray-600 font-thai mb-4">กรุณาตรวจสอบอีกครั้ง</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 font-thai"
          >
            กลับไปหน้าแรก
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2 font-thai-header">
            จองสำเร็จแล้ว! 🎉
          </h1>
          <p className="text-gray-600 font-thai text-lg">
            ขอบคุณที่เลือกใช้บริการของเรา
          </p>
        </div>

        {/* Booking Details Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          
          {/* Booking Reference */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">หมายเลขการจอง</p>
                <p className="text-xl font-bold">{bookingDetails.booking_reference}</p>
              </div>
              <Receipt className="w-8 h-8 text-blue-200" />
            </div>
          </div>

          {/* Room Assignment - Highlight */}
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-6 rounded-lg mb-6">
            <h3 className="text-xl font-bold mb-3 flex items-center">
              <MapPin className="w-6 h-6 mr-2" />
              ห้องพักที่จัดสรรให้
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/20 rounded-lg p-4">
                <p className="text-amber-100 text-sm">หมายเลขห้อง</p>
                <p className="text-2xl font-bold">{bookingDetails.room_number}</p>
              </div>
              <div className="bg-white/20 rounded-lg p-4">
                <p className="text-amber-100 text-sm">ชั้น</p>
                <p className="text-2xl font-bold">ชั้น {bookingDetails.floor}</p>
              </div>
              <div className="bg-white/20 rounded-lg p-4">
                <p className="text-amber-100 text-sm">ประเภทห้อง</p>
                <p className="text-lg font-bold">{bookingDetails.room_type_name}</p>
              </div>
            </div>
          </div>

          {/* Booking Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            
            {/* Hotel & Dates */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Building className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">โรงแรม</p>
                  <p className="font-medium">{bookingDetails.hotel_name}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">วันที่เข้าพัก</p>
                  <p className="font-medium">{formatDate(bookingDetails.check_in_date)}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">วันที่ออก</p>
                  <p className="font-medium">{formatDate(bookingDetails.check_out_date)}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">จำนวนผู้เข้าพัก</p>
                  <p className="font-medium">{bookingDetails.guests} คน</p>
                </div>
              </div>
            </div>

            {/* Guest Information */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">ชื่อผู้จอง</p>
                  <p className="font-medium">{bookingDetails.guest_name}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">เบอร์โทรศัพท์</p>
                  <p className="font-medium">{bookingDetails.guest_phone}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">อีเมล</p>
                  <p className="font-medium">{bookingDetails.guest_email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              สรุปการชำระเงิน
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>จำนวนคืน:</span>
                <span className="font-medium">{calculateNights()} คืน</span>
              </div>
              <div className="flex justify-between">
                <span>ราคาต่อคืน:</span>
                <span className="font-medium">฿{formatPrice(bookingDetails.total_price / calculateNights())}</span>
              </div>
              <div className="border-t pt-2 flex justify-between text-lg font-bold text-green-600">
                <span>ราคารวม:</span>
                <span>฿{formatPrice(bookingDetails.total_price)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-bold text-blue-800 mb-3">ขั้นตอนต่อไป</h3>
          <div className="space-y-2 text-blue-700">
            <p>✅ การจองของคุณได้รับการยืนยันแล้ว</p>
            <p>⏳ กำลังรอการตรวจสอบใบเสร็จการชำระเงิน</p>
            <p>📧 จะได้รับอีเมลยืนยันการจองภายใน 24 ชั่วโมง</p>
            <p>🏨 สามารถเข้าพักได้ตามวันที่ที่จองไว้</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.push('/bookings')}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200 font-thai flex items-center justify-center"
          >
            <Receipt className="w-5 h-5 mr-2" />
            ดูการจองทั้งหมด
          </button>
          
          <button
            onClick={() => router.push('/')}
            className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200 font-thai flex items-center justify-center"
          >
            <Home className="w-5 h-5 mr-2" />
            กลับไปหน้าแรก
          </button>
        </div>

        {/* Auto Redirect Notice */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm font-thai">
            จะพาไปยังหน้าการจองอัตโนมัติใน {countdown} วินาที
          </p>
        </div>

      </div>
    </div>
  );
}