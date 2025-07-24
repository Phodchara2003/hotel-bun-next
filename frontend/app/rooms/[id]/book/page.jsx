'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import { hotelAPI, bookingAPI } from '../../../../lib/api';
import { Calendar, Users, CreditCard, ArrowLeft, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BookRoomPage({ params }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [roomType, setRoomType] = useState(null);
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [unavailableDates, setUnavailableDates] = useState([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  
  const roomTypeId = params.id;
  const hotelId = searchParams.get('hotelId');
  
  const [bookingData, setBookingData] = useState({
    checkInDate: '',
    checkOutDate: '',
    guests: 1,
    specialRequests: ''
  });

  useEffect(() => {
    if (roomTypeId && hotelId) {
      fetchRoomData();
      // Check availability on page load
      checkRoomAvailabilityOnLoad();
    }
  }, [roomTypeId, hotelId]);

  const checkRoomAvailabilityOnLoad = async () => {
    setCheckingAvailability(true);
    try {
      // Check availability for the next 2 months
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 2);
      
      const availability = await bookingAPI.getRoomAvailability(
        roomTypeId, 
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
      
      // Convert booking dates to unavailable date ranges
      const unavailable = [];
      availability.existingBookings.forEach(booking => {
        const bookingStart = new Date(booking.checkInDate);
        const bookingEnd = new Date(booking.checkOutDate);
        
        // Add each day in the booking range to unavailable dates
        const currentDate = new Date(bookingStart);
        while (currentDate < bookingEnd) { // Don't include checkout date
          unavailable.push(currentDate.toISOString().split('T')[0]);
          currentDate.setDate(currentDate.getDate() + 1);
        }
      });
      
      setUnavailableDates(unavailable);
      
    } catch (error) {
      console.error('Error checking availability on load:', error);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const fetchRoomData = async () => {
    try {
      // Get hotel data to find room type
      const hotelResponse = await hotelAPI.getHotelById(hotelId);
      setHotel(hotelResponse);
      
      // Find the specific room type
      const room = hotelResponse.roomTypes.find(rt => rt.id == roomTypeId);
      if (room) {
        setRoomType(room);
      } else {
        toast.error('ไม่พบข้อมูลห้องพัก');
        router.back();
      }
    } catch (error) {
      console.error('Error fetching room data:', error);
      toast.error('ไม่สามารถโหลดข้อมูลห้องพักได้');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Validate date selection
    if (name === 'checkInDate' || name === 'checkOutDate') {
      const dateStatus = getDateStatus(value);
      
      if (dateStatus.status === 'past') {
        toast.error('ไม่สามารถเลือกวันที่ในอดีตได้', { icon: '⚠️' });
        return;
      }
      
      if (dateStatus.status === 'unavailable') {
        toast.error('วันที่นี้ไม่ว่าง - มีการจองแล้ว กรุณาเลือกวันที่อื่น', { 
          icon: '❌',
          duration: 4000
        });
        return;
      }
      
      // If check-out date is before check-in date, show error
      if (name === 'checkOutDate' && bookingData.checkInDate && value <= bookingData.checkInDate) {
        toast.error('วันที่ออกต้องมาหลังวันที่เข้าพัก', { icon: '⚠️' });
        return;
      }
    }
    
    setBookingData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateTotalPrice = () => {
    if (!bookingData.checkInDate || !bookingData.checkOutDate || !roomType) {
      return 0;
    }
    
    const checkIn = new Date(bookingData.checkInDate);
    const checkOut = new Date(bookingData.checkOutDate);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    
    return nights > 0 ? nights * roomType.pricePerNight : 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const totalPrice = calculateTotalPrice();
      
      if (totalPrice <= 0) {
        toast.error('กรุณาเลือกวันที่ที่ถูกต้อง');
        return;
      }

      const booking = {
        hotelId: parseInt(hotelId),
        roomTypeId: parseInt(roomTypeId),
        checkInDate: bookingData.checkInDate,
        checkOutDate: bookingData.checkOutDate,
        guests: parseInt(bookingData.guests),
        specialRequests: bookingData.specialRequests
      };

      console.log('Booking data to send:', booking);
      console.log('Hotel ID:', hotelId, 'Room Type ID:', roomTypeId);
      console.log('Booking data:', bookingData);

      const response = await bookingAPI.createBooking(booking);
      
      if (response.booking) {
        toast.success('จองห้องพักสำเร็จ! กำลังพาไปหน้าชำระเงิน...');
        // Redirect to payment page immediately after booking
        router.push(`/payment/${response.booking.id}`);
      }
    } catch (error) {
      console.error('Booking error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let message = 'ไม่สามารถจองห้องพักได้';
      
      if (error.response?.data?.error) {
        const errorMessage = error.response.data.error;
        
        if (errorMessage.includes('not available')) {
          message = 'ห้องพักไม่ว่างสำหรับวันที่ที่เลือก กรุณาเลือกวันที่อื่น';
        } else if (errorMessage.includes('past')) {
          message = 'ไม่สามารถจองวันที่ในอดีตได้ กรุณาเลือกวันที่ในอนาคต';
        } else if (errorMessage.includes('date')) {
          message = 'วันที่ออกต้องมาหลังวันที่เข้าพัก';
        } else {
          message = errorMessage;
        }
        
        // Show conflicting bookings if available
        if (error.response.data.conflictingBookings) {
          console.log('Conflicting bookings:', error.response.data.conflictingBookings);
          message += '\n\nการจองที่ขัดแย้ง:';
          error.response.data.conflictingBookings.forEach(booking => {
            const checkIn = new Date(booking.checkIn).toLocaleDateString('th-TH');
            const checkOut = new Date(booking.checkOut).toLocaleDateString('th-TH');
            message += `\n- การจอง #${booking.id}: ${checkIn} - ${checkOut} (${booking.status})`;
          });
          message += '\n\nกรุณาเลือกวันที่อื่นที่ไม่ซ้ำกับการจองข้างต้น';
        }
      }
      
      toast.error(message, { duration: 7000 });
    } finally {
      setSubmitting(false);
    }
  };

  // Check room availability when dates change
  const checkRoomAvailability = async () => {
    if (!bookingData.checkInDate || !bookingData.checkOutDate) {
      return;
    }

    setCheckingAvailability(true);
    try {
      const checkInDate = new Date(bookingData.checkInDate);
      const checkOutDate = new Date(bookingData.checkOutDate);
      
      // Get current unavailable dates and check if selection conflicts
      const availability = await bookingAPI.getRoomAvailability(
        roomTypeId, 
        bookingData.checkInDate,
        bookingData.checkOutDate
      );
      
      // Check if current selection conflicts with any existing booking
      if (availability.existingBookings.length > 0) {
        const hasConflict = availability.existingBookings.some(booking => {
          const bookingStart = new Date(booking.checkInDate);
          const bookingEnd = new Date(booking.checkOutDate);
          return (checkInDate < bookingEnd && checkOutDate > bookingStart);
        });
        
        if (hasConflict) {
          toast.error('วันที่ที่เลือกซ้ำกับการจองอื่น กรุณาเลือกวันที่ใหม่', { 
            duration: 4000,
            icon: '⚠️'
          });
          
          // Show conflicting bookings details
          const conflictingBookings = availability.existingBookings.filter(booking => {
            const bookingStart = new Date(booking.checkInDate);
            const bookingEnd = new Date(booking.checkOutDate);
            return (checkInDate < bookingEnd && checkOutDate > bookingStart);
          });
          
          console.log('Conflicting bookings:', conflictingBookings);
        } else {
          // No conflict, show success message
          toast.success('วันที่ที่เลือกว่าง สามารถจองได้', { 
            duration: 3000,
            icon: '✅'
          });
        }
      } else {
        // No existing bookings, available
        toast.success('วันที่ที่เลือกว่าง สามารถจองได้', { 
          duration: 3000,
          icon: '✅'
        });
      }
      
    } catch (error) {
      console.error('Error checking availability:', error);
      toast.error('ไม่สามารถตรวจสอบความพร้อมของห้องได้');
    } finally {
      setCheckingAvailability(false);
    }
  };

  useEffect(() => {
    if (roomTypeId && bookingData.checkInDate && bookingData.checkOutDate) {
      const debounceTimer = setTimeout(() => {
        checkRoomAvailability();
      }, 500);
      
      return () => clearTimeout(debounceTimer);
    }
  }, [roomTypeId, bookingData.checkInDate, bookingData.checkOutDate]);

  const isDateUnavailable = (dateString) => {
    return unavailableDates.includes(dateString);
  };

  const isDateInPast = (dateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(dateString);
    return checkDate < today;
  };

  const getDateStatus = (dateString) => {
    if (isDateInPast(dateString)) {
      return { status: 'past', message: 'วันที่ผ่านมาแล้ว' };
    }
    if (isDateUnavailable(dateString)) {
      return { status: 'unavailable', message: 'ไม่ว่าง - มีการจองแล้ว' };
    }
    return { status: 'available', message: 'ว่าง - สามารถจองได้' };
  };

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

  if (!roomType || !hotel) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">ไม่พบข้อมูลห้องพัก</p>
        </div>
      </div>
    );
  }

  // Show login required message if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto container-padding">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            กลับ
          </button>

          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-primary-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">ต้องเข้าสู่ระบบเพื่อจองห้องพัก</h2>
            <p className="text-gray-600 mb-6">
              กรุณาเข้าสู่ระบบหรือสมัครสมาชิกเพื่อดำเนินการจองห้องพัก
            </p>
            
            {/* Room Preview */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">{roomType.name}</h3>
              <p className="text-gray-600 mb-2">{hotel.name}</p>
              <div className="text-2xl font-bold text-primary-600">
                ฿{roomType.pricePerNight?.toLocaleString()} <span className="text-sm font-normal text-gray-500">ต่อคืน</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => router.push('/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search))}
                className="btn-primary"
              >
                เข้าสู่ระบบ
              </button>
              <button
                onClick={() => router.push('/register?redirect=' + encodeURIComponent(window.location.pathname + window.location.search))}
                className="btn-outline-primary"
              >
                สมัครสมาชิก
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalPrice = calculateTotalPrice();
  const nights = bookingData.checkInDate && bookingData.checkOutDate ? 
    Math.ceil((new Date(bookingData.checkOutDate) - new Date(bookingData.checkInDate)) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto container-padding">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          กลับ
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Room Information */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              จองห้องพัก
            </h1>
            
            {/* Hotel & Room Info */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                {hotel.name}
              </h2>
              <h3 className="text-xl font-bold text-primary-600 mb-2">
                {roomType.name}
              </h3>
              <p className="text-gray-600 mb-4">
                {roomType.description}
              </p>
              
              {/* Room Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-gray-500" />
                  <span>สูงสุด {roomType.maxGuests} ผู้เข้าพัก</span>
                </div>
                {roomType.sizeSqm && (
                  <div className="flex items-center">
                    <span className="text-gray-500 mr-2">📐</span>
                    <span>{roomType.sizeSqm} ตรม.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Room Image */}
            {roomType.images && roomType.images.length > 0 && (
              <div className="mb-6">
                <img
                  src={roomType.images[0]}
                  alt={roomType.name}
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
            )}

            {/* Amenities */}
            {roomType.amenities && roomType.amenities.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">สิ่งอำนวยความสะดวก</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {roomType.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-600">
                      <div className="w-2 h-2 bg-primary-600 rounded-full mr-3"></div>
                      {amenity}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Booking Form */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              ข้อมูลการจอง
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Room Availability Status */}
              {checkingAvailability && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
                    <span className="text-blue-800">กำลังตรวจสอบความพร้อมของห้อง...</span>
                  </div>
                </div>
              )}

              {/* Unavailable Dates Info */}
              {unavailableDates.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-red-800 mb-2">วันที่ไม่ว่าง</h4>
                      <p className="text-sm text-red-700 mb-2">
                        วันที่ต่อไปนี้มีการจองแล้ว กรุณาเลือกวันที่อื่น:
                      </p>
                      <div className="max-h-20 overflow-y-auto">
                        <div className="text-sm text-red-600 space-y-1">
                          {unavailableDates.slice(0, 10).map((date, index) => (
                            <div key={index} className="flex items-center">
                              <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                              {new Date(date).toLocaleDateString('th-TH', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </div>
                          ))}
                          {unavailableDates.length > 10 && (
                            <div className="text-red-500 text-xs">
                              และอีก {unavailableDates.length - 10} วัน...
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Availability Legend */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-3">คำอธิบายสถานะ</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <span className="text-green-700">ว่าง - สามารถจองได้</span>
                  </div>
                  <div className="flex items-center">
                    <XCircle className="h-4 w-4 text-red-600 mr-2" />
                    <span className="text-red-700">เต็ม - มีการจองแล้ว</span>
                  </div>
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-gray-600 mr-2" />
                    <span className="text-gray-700">วันที่ผ่านมาแล้ว</span>
                  </div>
                </div>
              </div>
              {/* Check-in Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  วันที่เข้าพัก
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="checkInDate"
                    value={bookingData.checkInDate}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    className={`input-field ${bookingData.checkInDate && getDateStatus(bookingData.checkInDate).status === 'unavailable' ? 'border-red-500 bg-red-50' : ''}`}
                    required
                  />
                  {bookingData.checkInDate && (
                    <div className="mt-1 text-sm">
                      <div className={`flex items-center ${
                        getDateStatus(bookingData.checkInDate).status === 'available' ? 'text-green-600' :
                        getDateStatus(bookingData.checkInDate).status === 'unavailable' ? 'text-red-600' :
                        'text-gray-500'
                      }`}>
                        {getDateStatus(bookingData.checkInDate).status === 'available' && <CheckCircle className="h-4 w-4 mr-1" />}
                        {getDateStatus(bookingData.checkInDate).status === 'unavailable' && <XCircle className="h-4 w-4 mr-1" />}
                        {getDateStatus(bookingData.checkInDate).status === 'past' && <AlertCircle className="h-4 w-4 mr-1" />}
                        {getDateStatus(bookingData.checkInDate).message}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Check-out Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  วันที่ออก
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="checkOutDate"
                    value={bookingData.checkOutDate}
                    onChange={handleInputChange}
                    min={bookingData.checkInDate || new Date().toISOString().split('T')[0]}
                    className={`input-field ${bookingData.checkOutDate && getDateStatus(bookingData.checkOutDate).status === 'unavailable' ? 'border-red-500 bg-red-50' : ''}`}
                    required
                  />
                  {bookingData.checkOutDate && (
                    <div className="mt-1 text-sm">
                      <div className={`flex items-center ${
                        getDateStatus(bookingData.checkOutDate).status === 'available' ? 'text-green-600' :
                        getDateStatus(bookingData.checkOutDate).status === 'unavailable' ? 'text-red-600' :
                        'text-gray-500'
                      }`}>
                        {getDateStatus(bookingData.checkOutDate).status === 'available' && <CheckCircle className="h-4 w-4 mr-1" />}
                        {getDateStatus(bookingData.checkOutDate).status === 'unavailable' && <XCircle className="h-4 w-4 mr-1" />}
                        {getDateStatus(bookingData.checkOutDate).status === 'past' && <AlertCircle className="h-4 w-4 mr-1" />}
                        {getDateStatus(bookingData.checkOutDate).message}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Guests */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="h-4 w-4 inline mr-1" />
                  จำนวนผู้เข้าพัก
                </label>
                <select
                  name="guests"
                  value={bookingData.guests}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                >
                  {[...Array(roomType.maxGuests)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1} คน
                    </option>
                  ))}
                </select>
              </div>

              {/* Special Requests */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ความต้องการพิเศษ (ไม่บังคับ)
                </label>
                <textarea
                  name="specialRequests"
                  value={bookingData.specialRequests}
                  onChange={handleInputChange}
                  rows={3}
                  className="input-field"
                  placeholder="เช่น เตียงเสริม, ชั้นสูง, ห้องเงียบ..."
                />
              </div>

              {/* Price Summary */}
              {nights > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">สรุปราคา</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>฿{roomType.pricePerNight.toLocaleString()} × {nights} คืน</span>
                      <span>฿{(roomType.pricePerNight * nights).toLocaleString()}</span>
                    </div>
                    <div className="border-t border-gray-300 pt-2 flex justify-between font-semibold">
                      <span>รวมทั้งหมด</span>
                      <span className="text-primary-600">฿{totalPrice.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={
                  submitting || 
                  totalPrice <= 0 || 
                  checkingAvailability ||
                  (bookingData.checkInDate && getDateStatus(bookingData.checkInDate).status !== 'available') ||
                  (bookingData.checkOutDate && getDateStatus(bookingData.checkOutDate).status !== 'available')
                }
                className={`w-full flex items-center justify-center py-3 text-lg font-medium rounded-lg transition-colors ${
                  submitting || 
                  totalPrice <= 0 || 
                  checkingAvailability ||
                  (bookingData.checkInDate && getDateStatus(bookingData.checkInDate).status !== 'available') ||
                  (bookingData.checkOutDate && getDateStatus(bookingData.checkOutDate).status !== 'available')
                    ? 'bg-gray-400 cursor-not-allowed text-gray-600' 
                    : 'btn-primary hover:bg-primary-700'
                }`}
              >
                {submitting ? (
                  <>
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    กำลังจองห้องพัก...
                  </>
                ) : checkingAvailability ? (
                  <>
                    <div className="w-6 h-6 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                    กำลังตรวจสอบความพร้อม...
                  </>
                ) : totalPrice <= 0 ? (
                  <>
                    <AlertCircle className="h-5 w-5 mr-2" />
                    กรุณาเลือกวันที่
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5 mr-2" />
                    จองและชำระเงิน (฿{totalPrice.toLocaleString()})
                  </>
                )}
              </button>
              
              {/* Booking Status Messages */}
              {bookingData.checkInDate && bookingData.checkOutDate && (
                <div className="text-center text-sm">
                  {getDateStatus(bookingData.checkInDate).status === 'available' && 
                   getDateStatus(bookingData.checkOutDate).status === 'available' ? (
                    <div className="text-green-600 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      พร้อมจองได้! ห้องพักว่างในช่วงวันที่ที่เลือก
                    </div>
                  ) : (
                    <div className="text-red-600 flex items-center justify-center">
                      <XCircle className="h-4 w-4 mr-1" />
                      ไม่สามารถจองได้ กรุณาเลือกวันที่อื่น
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
