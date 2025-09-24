'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ArrowLeft, Calendar, MapPin, Users, CreditCard, Clock, 
  CheckCircle, XCircle, AlertCircle, Phone, Mail, User,
  Bed, Wifi, Car, Coffee, Tv, Bath, 
  UtensilsCrossed, Shield
} from 'lucide-react';

export default function BookingDetailsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id;

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.id && bookingId) {
      fetchBookingDetails();
    }
  }, [user, bookingId]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/bookings/${bookingId}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Check if user owns this booking
          if (result.data.user_id !== user.id) {
            setError('คุณไม่มีสิทธิ์ดูการจองนี้');
            return;
          }
          setBooking(result.data);
        } else {
          setError(result.message || 'ไม่พบข้อมูลการจอง');
        }
      } else {
        setError('ไม่สามารถโหลดข้อมูลการจองได้');
      }
    } catch (err) {
      console.error('Error fetching booking details:', err);
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'pending':
        return <Clock className="w-6 h-6 text-yellow-500" />;
      case 'cancelled':
        return <XCircle className="w-6 h-6 text-red-500" />;
      default:
        return <AlertCircle className="w-6 h-6 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed':
        return 'ยืนยันแล้ว';
      case 'pending':
        return 'รอการยืนยัน';
      case 'cancelled':
        return 'ยกเลิกแล้ว';
      default:
        return 'ไม่ทราบสถานะ';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const calculateNights = (checkIn, checkOut) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Check if booking can be cancelled (check-in date hasn't passed)
  const canCancelBooking = (booking) => {
    if (!booking || booking.status === 'cancelled' || booking.status === 'completed') {
      return false;
    }
    
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    const checkInDateValue = booking.check_in_date || booking.checkInDate || booking.checkin_date;
    if (!checkInDateValue) {
      console.warn('No check-in date found for booking:', booking);
      return false;
    }
    
    const checkInDate = new Date(checkInDateValue);
    checkInDate.setHours(0, 0, 0, 0);
    
    // Only allow cancellation if check-in date hasn't passed
    return checkInDate >= currentDate;
  };

  // Mock room amenities (เนื่องจากในฐานข้อมูลยังไม่มี)
  const roomAmenities = [
    { icon: Wifi, label: 'Wi-Fi ฟรี' },
    { icon: Tv, label: 'ทีวี' },
    { icon: Bath, label: 'ห้องน้ำส่วนตัว' },
    { icon: Coffee, label: 'เครื่องชงกาแฟ' },
    { icon: Car, label: 'ที่จอดรถฟรี' },
  ];

  const hotelFacilities = [
    { icon: Wifi, label: 'สระว่ายน้ำ' },
    { icon: CreditCard, label: 'ฟิตเนส' },
    { icon: UtensilsCrossed, label: 'ร้านอาหาร' },
    { icon: Shield, label: 'รักษาความปลอดภัย 24 ชม.' },
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">เข้าสู่ระบบเพื่อดูรายละเอียดการจอง</h1>
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
          >
            เข้าสู่ระบบ
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดรายละเอียดการจอง...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-md mx-auto">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">เกิดข้อผิดพลาด</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-x-3">
            <button
              onClick={() => router.push('/my-bookings')}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
            >
              กลับไปดูการจองทั้งหมด
            </button>
            <button
              onClick={fetchBookingDetails}
              className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50"
            >
              ลองใหม่อีกครั้ง
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">ไม่พบข้อมูลการจอง</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.push('/my-bookings')}
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors mr-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            กลับไปดูการจองทั้งหมด
          </button>
        </div>

        {/* Booking Status Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between">
            <div className="flex items-center space-x-4 mb-4 lg:mb-0">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  การจอง #{booking.booking_reference || `HTL${String(booking.id).padStart(3, '0')}`}
                </h1>
                <p className="text-gray-600">
                  จองเมื่อ {formatDate(booking.created_at)} เวลา {formatTime(booking.created_at)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className={`px-4 py-2 rounded-full text-lg font-medium border ${getStatusBadgeClass(booking.status)}`}>
                {getStatusText(booking.status)}
              </span>
              {getStatusIcon(booking.status)}
            </div>
          </div>
        </div>

        {/* Hotel Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">ข้อมูลโรงแรม</h2>
          <div>
            <h3 className="text-xl font-bold text-blue-600 mb-2">
              {booking.hotel_name || 'โรงแรม'}
            </h3>
            <div className="flex items-start space-x-2 text-gray-600 mb-4">
              <MapPin className="w-5 h-5 mt-1 flex-shrink-0" />
              <p>{booking.hotel_address || 'ที่อยู่โรงแรม'}</p>
            </div>
          </div>
        </div>

        {/* Room Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">ข้อมูลห้องพัก</h2>
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-green-100 p-2 rounded-lg">
                <Bed className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  {booking.room_type_name || 'ห้องพัก'}
                </h3>
                <p className="text-gray-600">ห้องหมายเลข {booking.room_number || 'จะแจ้งในวันเข้าพัก'}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <span className="text-sm text-gray-500">ราคาต่อคืน</span>
                <p className="text-lg font-semibold text-green-600">
                  ฿{booking.room_price?.toLocaleString() || '0'}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">จำนวนผู้เข้าพัก</span>
                <p className="text-lg font-semibold">{booking.guests} คน</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stay Details */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">รายละเอียดการเข้าพัก</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center bg-blue-50 rounded-lg p-4">
              <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-1">วันที่เข้าพัก</p>
              <p className="font-semibold">{formatDate(booking.check_in_date)}</p>
              <p className="text-sm text-gray-500">14:00 น.</p>
            </div>
            
            <div className="text-center bg-orange-50 rounded-lg p-4">
              <Calendar className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-1">วันที่ออก</p>
              <p className="font-semibold">{formatDate(booking.check_out_date)}</p>
              <p className="text-sm text-gray-500">12:00 น.</p>
            </div>
            
            <div className="text-center bg-green-50 rounded-lg p-4">
              <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-1">จำนวนคืน</p>
              <p className="font-semibold text-2xl">
                {calculateNights(booking.check_in_date, booking.check_out_date)}
              </p>
              <p className="text-sm text-gray-500">คืน</p>
            </div>
            
            <div className="text-center bg-purple-50 rounded-lg p-4">
              <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-1">ผู้เข้าพัก</p>
              <p className="font-semibold text-2xl">{booking.guests}</p>
              <p className="text-sm text-gray-500">คน</p>
            </div>
          </div>
        </div>

        {/* Guest Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">ข้อมูลผู้เข้าพัก</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">ชื่อผู้เข้าพัก</p>
                <p className="font-semibold">{booking.guest_name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <Mail className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">อีเมล</p>
                <p className="font-semibold">{booking.guest_email}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="bg-orange-100 p-2 rounded-lg">
                <Phone className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">เบอร์โทร</p>
                <p className="font-semibold">{booking.guest_phone}</p>
              </div>
            </div>
          </div>
          
          {booking.special_requests && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold text-gray-800 mb-2">คำขอพิเศษ</h3>
              <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">{booking.special_requests}</p>
            </div>
          )}
        </div>

        {/* Payment Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">ข้อมูลการชำระเงิน</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">ราคาห้องต่อคืน</span>
                <span className="font-medium">฿{booking.room_price?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">จำนวนคืน</span>
                <span className="font-medium">{calculateNights(booking.check_in_date, booking.check_out_date)} คืน</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">ภาษีและค่าธรรมเนียม</span>
                <span className="font-medium">รวมแล้ว</span>
              </div>
              <div className="flex justify-between items-center py-3 bg-green-50 px-4 rounded-lg">
                <span className="text-lg font-semibold text-gray-800">ยอดรวมทั้งสิ้น</span>
                <span className="text-2xl font-bold text-green-600">
                  ฿{booking.total_price?.toLocaleString() || '0'}
                </span>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">สถานะการชำระเงิน</h3>
              <div className="flex items-center space-x-3 mb-3">
                {booking.payment_status === 'paid' ? (
                  <>
                    <CheckCircle className="w-6 h-6 text-green-500" />
                    <span className="text-green-700 font-semibold">ชำระเงินแล้ว</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-6 h-6 text-yellow-500" />
                    <span className="text-yellow-700 font-semibold">รอการชำระเงิน</span>
                  </>
                )}
              </div>
              
              <div className="text-sm text-gray-600 space-y-1">
                <p>วิธีการชำระเงิน: {booking.payment_method || 'โอนเงิน/QR Code'}</p>
                {booking.payment_reference && (
                  <p>หมายเลขอ้างอิง: {booking.payment_reference}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}