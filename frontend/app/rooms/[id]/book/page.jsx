'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import { hotelAPI, bookingAPI } from '../../../../lib/api';
import { 
  Calendar, 
  Users, 
  Bed, 
  MapPin, 
  Star, 
  Wifi, 
  Car, 
  Coffee,
  ArrowLeft,
  CreditCard
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function BookRoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  
  const roomId = params.id;
  const hotelId = searchParams.get('hotelId');
  
  console.log('BookRoomPage - Params:', { roomId, hotelId, isAuthenticated, params: params, searchParams: Object.fromEntries(searchParams.entries()) });
  
  // Debug: Check if we have both required params
  if (!roomId || !hotelId) {
    console.error('Missing required parameters:', { roomId, hotelId });
    // Redirect to homepage if missing params
    if (typeof window !== 'undefined') {
      router.push('/?error=missing-params');
    }
  }
  
  const [hotel, setHotel] = useState(null);
  const [roomType, setRoomType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Booking form data
  const [bookingData, setBookingData] = useState({
    checkIn: '',
    checkOut: '',
    guests: 1,
    specialRequests: ''
  });

  useEffect(() => {
    if (roomId && hotelId) {
      fetchRoomData();
    }
  }, [roomId, hotelId]);

  const fetchRoomData = async () => {
    try {
      setLoading(true);
      console.log('Fetching room data for:', { roomId, hotelId });
      
      // Try to get from cache first
      const cacheKey = `hotel_data_${hotelId}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        console.log('Using cached hotel data for booking');
        const cachedData = JSON.parse(cached);
        // Check if cache is still valid (5 minutes)
        if (Date.now() - cachedData.timestamp < 300000) {
          setHotel(cachedData.data);
          
          const room = cachedData.data.roomTypes?.find(rt => rt.id === parseInt(roomId));
          if (room) {
            setRoomType(room);
            setLoading(false);
            return;
          }
        }
      }
      
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 8000)
      );
      
      // Fallback to API call with timeout
      const apiPromise = hotelAPI.getHotelById(hotelId);
      const hotelResponse = await Promise.race([apiPromise, timeoutPromise]);
      
      console.log('Hotel response:', hotelResponse);
      setHotel(hotelResponse);
      
      // Cache for future use with timestamp
      sessionStorage.setItem(cacheKey, JSON.stringify({
        data: hotelResponse,
        timestamp: Date.now()
      }));
      
      const room = hotelResponse.roomTypes?.find(rt => rt.id === parseInt(roomId));
      console.log('Found room:', room);
      
      if (room) {
        setRoomType(room);
      } else {
        console.error('Room not found with ID:', roomId);
        toast.error('ไม่พบข้อมูลห้องพัก');
        router.push('/');
      }
    } catch (error) {
      console.error('Error fetching room data:', error);
      if (error.message === 'Timeout') {
        toast.error('การโหลดข้อมูลใช้เวลานานเกินไป กรุณาลองใหม่');
      } else {
        toast.error('ไม่สามารถโหลดข้อมูลห้องพักได้');
      }
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateNights = () => {
    if (!bookingData.checkIn || !bookingData.checkOut) return 0;
    const checkIn = new Date(bookingData.checkIn);
    const checkOut = new Date(bookingData.checkOut);
    const diffTime = Math.abs(checkOut - checkIn);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calculateTotal = () => {
    const nights = calculateNights();
    return nights * (roomType?.pricePerNight || 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check authentication before booking
    if (!isAuthenticated) {
      toast.error('กรุณาเข้าสู่ระบบก่อนทำการจอง');
      router.push('/login');
      return;
    }
    
    if (!bookingData.checkIn || !bookingData.checkOut) {
      toast.error('กรุณาเลือกวันที่เข้าพักและออก');
      return;
    }
    
    if (new Date(bookingData.checkIn) >= new Date(bookingData.checkOut)) {
      toast.error('วันที่ออกต้องหลังจากวันที่เข้าพัก');
      return;
    }
    
    if (calculateNights() === 0) {
      toast.error('จำนวนคืนต้องมากกว่า 0');
      return;
    }

    try {
      setSubmitting(true);
      
      const booking = {
        hotelId: parseInt(hotelId),
        roomTypeId: parseInt(roomId),
        checkInDate: bookingData.checkIn,
        checkOutDate: bookingData.checkOut,
        guests: parseInt(bookingData.guests),
        specialRequests: bookingData.specialRequests,
        totalAmount: calculateTotal()
      };

      console.log('📝 Creating booking with data:', booking);
      console.log('🚀 Calling bookingAPI.createBooking...');
      
      const response = await bookingAPI.createBooking(booking);
      console.log('✅ Booking response:', response);
      
      toast.success('จองห้องพักสำเร็จ!');
      router.push('/dashboard');
      
    } catch (error) {
      console.error('❌ Booking error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      });
      toast.error(error.response?.data?.error || 'เกิดข้อผิดพลาดในการจอง');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-700 text-lg font-medium">กำลังโหลดข้อมูลห้องพัก...</p>
          <p className="text-slate-500 text-sm mt-2">กรุณารอสักครู่</p>
        </div>
      </div>
    );
  }

  if (!roomType || !hotel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-md mx-4">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">ไม่พบข้อมูลห้องพัก</h2>
          <p className="text-slate-600 mb-6">ขออภัย ไม่สามารถโหลดข้อมูลห้องพักได้ในขณะนี้</p>
          <Link 
            href="/" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            กลับสู่หน้าแรก
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center">
            <Link 
              href="/"
              className="flex items-center text-blue-600 hover:text-blue-700 mr-4"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              กลับ
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">จองห้องพัก</h1>
              <p className="text-gray-600">{hotel.name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Room Details */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="aspect-w-16 aspect-h-9 bg-gray-200">
              <div className="flex items-center justify-center">
                <Bed className="h-16 w-16 text-gray-400" />
              </div>
            </div>
            
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{roomType.name}</h2>
              <p className="text-gray-600 mb-4">{roomType.description}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-blue-600 mr-2" />
                  <span>สูงสุด {roomType.maxGuests} ท่าน</span>
                </div>
                {roomType.sizeSqm && (
                  <div className="flex items-center">
                    <Bed className="h-5 w-5 text-blue-600 mr-2" />
                    <span>{roomType.sizeSqm} ตร.ม.</span>
                  </div>
                )}
              </div>

              {/* Amenities */}
              {roomType.amenities && roomType.amenities.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">สิ่งอำนวยความสะดวก</h3>
                  <div className="flex flex-wrap gap-2">
                    {roomType.amenities.map((amenity, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="text-3xl font-bold text-blue-600">
                  ฿{roomType.pricePerNight?.toLocaleString()}
                </div>
                <div className="text-gray-600">ต่อคืน (รวมภาษี)</div>
              </div>
            </div>
          </div>

          {/* Booking Form */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">รายละเอียดการจอง</h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Check-in Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  วันที่เข้าพัก
                </label>
                <input
                  type="date"
                  name="checkIn"
                  value={bookingData.checkIn}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Check-out Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  วันที่ออก
                </label>
                <input
                  type="date"
                  name="checkOut"
                  value={bookingData.checkOut}
                  onChange={handleInputChange}
                  min={bookingData.checkIn || new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Number of Guests */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  จำนวนผู้เข้าพัก
                </label>
                <select
                  name="guests"
                  value={bookingData.guests}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {Array.from({ length: roomType.maxGuests }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>
                      {num} ท่าน
                    </option>
                  ))}
                </select>
              </div>

              {/* Special Requests */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  คำขอพิเศษ (ไม่บังคับ)
                </label>
                <textarea
                  name="specialRequests"
                  value={bookingData.specialRequests}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="เช่น เตียงเสริม, ห้องสูบบุหรี่, ชั้นสูง..."
                />
              </div>

              {/* Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">สรุปการจอง</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>จำนวนคืน:</span>
                    <span>{calculateNights()} คืน</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ราคาต่อคืน:</span>
                    <span>฿{roomType.pricePerNight?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg border-t pt-2">
                    <span>ราคารวม:</span>
                    <span className="text-blue-600">฿{calculateTotal().toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              {!isAuthenticated ? (
                <div className="text-center">
                  <p className="text-gray-600 mb-4">กรุณาเข้าสู่ระบบเพื่อทำการจอง</p>
                  <Link
                    href="/login"
                    className="w-full flex items-center justify-center px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
                  >
                    เข้าสู่ระบบ
                  </Link>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={submitting || calculateNights() === 0}
                  className={`w-full flex items-center justify-center px-6 py-3 rounded-lg text-white font-semibold ${
                    submitting || calculateNights() === 0
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  } transition-colors`}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      กำลังจอง...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5 mr-2" />
                      ยืนยันการจอง
                    </>
                  )}
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
