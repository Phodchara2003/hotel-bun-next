'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Calendar, Users, Wifi, Car, Coffee, Tv, Wind, 
  Phone, Mail, Star, Check, X, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { hotelAPI, bookingAPI, authAPI } from '../../../lib/api';
import { getRoomById } from '../../../lib/roomsData';
import { getRoomImageUrl, getRoomPlaceholder } from '../../../lib/roomImageUtils';
import { useAuth } from '../../../contexts/AuthContext';
import { formatDateThai, formatDateForInput, calculateNights, dateToString } from '../../../lib/dateUtils';
import CustomDatePicker from '../../../components/CustomDatePicker';
import toast from 'react-hot-toast';

export default function RoomDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [room, setRoom] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [checkInDate, setCheckInDate] = useState(null);
  const [checkOutDate, setCheckOutDate] = useState(null);
  const [guests, setGuests] = useState(1);
  
  // Guest information form
  const [guestInfo, setGuestInfo] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    nationalId: '',
    email: ''
  });

  // Format phone number
  const formatPhoneNumber = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
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
  
  useEffect(() => {
    fetchRoomDetails();
    
    // Load dates from URL parameters
    const checkinParam = searchParams.get('checkin');
    const checkoutParam = searchParams.get('checkout');
    const guestsParam = searchParams.get('guests');
    
    console.log('📅 Loading search params:', { checkinParam, checkoutParam, guestsParam });
    
    if (checkinParam) {
      try {
        // สร้างวันที่โดยไม่ให้ timezone มีผล
        const [year, month, day] = checkinParam.split('-').map(Number);
        const checkinDate = new Date(year, month - 1, day);
        setCheckInDate(checkinDate);
        console.log('✅ Set check-in date:', checkinDate);
      } catch (error) {
        console.error('❌ Error parsing check-in date:', error);
      }
    }
    
    if (checkoutParam) {
      try {
        // สร้างวันที่โดยไม่ให้ timezone มีผล
        const [year, month, day] = checkoutParam.split('-').map(Number);
        const checkoutDate = new Date(year, month - 1, day);
        setCheckOutDate(checkoutDate);
        console.log('✅ Set check-out date:', checkoutDate);
      } catch (error) {
        console.error('❌ Error parsing check-out date:', error);
      }
    }
    
    if (guestsParam) {
      const guestCount = parseInt(guestsParam);
      if (guestCount > 0) {
        setGuests(guestCount);
        console.log('✅ Set guests count:', guestCount);
      }
    }
  }, [params.id, searchParams]);

  // Auto-fill guest information from user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        try {
          // Try to get fresh profile data from API
          const profileResponse = await authAPI.getProfile();
          if (profileResponse.success && profileResponse.data) {
            const profileData = profileResponse.data;
            setGuestInfo({
              firstName: profileData.first_name || user.first_name || user.name?.split(' ')[0] || '',
              lastName: profileData.last_name || user.last_name || user.name?.split(' ').slice(1).join(' ') || '',
              phone: profileData.phone || user.phone || user.phone_number || '',
              nationalId: profileData.national_id || user.national_id || user.nationalId || user.id_number || '',
              email: profileData.email || user.email || ''
            });
          } else {
            // Fallback to user data from AuthContext
            setGuestInfo({
              firstName: user.first_name || user.name?.split(' ')[0] || '',
              lastName: user.last_name || user.name?.split(' ').slice(1).join(' ') || '',
              phone: user.phone || user.phone_number || '',
              nationalId: user.national_id || user.nationalId || user.id_number || '',
              email: user.email || ''
            });
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
          // Fallback to user data from AuthContext
          setGuestInfo({
            firstName: user.first_name || user.name?.split(' ')[0] || '',
            lastName: user.last_name || user.name?.split(' ').slice(1).join(' ') || '',
            phone: user.phone || user.phone_number || '',
            nationalId: user.national_id || user.nationalId || user.id_number || '',
            email: user.email || ''
          });
        }
      }
    };

    fetchUserProfile();
  }, [user]);

  const fetchRoomDetails = async () => {
    try {
      setIsLoading(true);
      
      // ดึงข้อมูลล่าสุดจาก API (รวมรูปภาพที่แอดมินอัพเดต)
      const updatedRoom = await getRoomById(params.id);
      if (updatedRoom) {
        setRoom(updatedRoom);
      }
      
      // พยายามดึงข้อมูลเพิ่มเติมจาก API
      try {
        const response = await hotelAPI.getRoomDetails(params.id);
        if (response.success && response.data) {
          // รวมข้อมูลที่อัพเดตแล้วกับข้อมูลจาก API
          const mergedRoom = {
            ...updatedRoom, // ข้อมูลล่าสุด (รวมรูปภาพ)
            ...response.data, // ข้อมูลเพิ่มเติมจาก API
            images: updatedRoom.images || response.data.images, // ใช้รูปภาพที่อัพเดตแล้ว
            image_url: updatedRoom.image_url || response.data.image_url
          };
          setRoom(mergedRoom);
        }
      } catch (apiError) {
        console.log('API not available, using local data');
      }
    } catch (error) {
      console.error('Error fetching room details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateNights = () => {
    // ใช้ utility function แทนเพื่อหลีกเลี่ยงปัญหา timezone
    if (!checkInDate || !checkOutDate) return 1;
    
    const checkInString = dateToString(checkInDate);
    const checkOutString = dateToString(checkOutDate);
    
    // Import calculateNights as calculateNightsUtil เพื่อหลีกเลี่ยงชื่อซ้ำ
    const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
    const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    return nights > 0 ? nights : 1;
  };

  const calculateTotal = () => {
    if (!room) return 0;
    return room.price_per_night * calculateNights();
  };

  // Handle date picker changes
  const handleCheckInChange = (date) => {
    setCheckInDate(date);
    // Reset checkout date if it's before checkin
    if (checkOutDate && date && checkOutDate <= date) {
      setCheckOutDate(null);
    }
    // ไม่ต้อง update URL อัตโนมัติ ให้ใช้ state เป็นหลัก
  };

  const handleCheckOutChange = (date) => {
    setCheckOutDate(date);
    // ไม่ต้อง update URL อัตโนมัติ ให้ใช้ state เป็นหลัก
  };

  const handleGuestsChange = (newGuests) => {
    setGuests(newGuests);
    // ไม่ต้อง update URL อัตโนมัติ ให้ใช้ state เป็นหลัก
  };

  const handleBooking = async () => {
    if (!user) {
      toast.error('กรุณาเข้าสู่ระบบก่อนทำการจอง');
      router.push('/login');
      return;
    }

    // ใช้วิธีสร้าง date string ที่ปลอดภัยจาก timezone
    const checkinDate = checkInDate ? 
      `${checkInDate.getFullYear()}-${String(checkInDate.getMonth() + 1).padStart(2, '0')}-${String(checkInDate.getDate()).padStart(2, '0')}` : 
      null;
    const checkoutDate = checkOutDate ? 
      `${checkOutDate.getFullYear()}-${String(checkOutDate.getMonth() + 1).padStart(2, '0')}-${String(checkOutDate.getDate()).padStart(2, '0')}` : 
      null;
    const guestCount = guests;

    if (!checkinDate || !checkoutDate) {
      toast.error('กรุณาเลือกวันที่เข้าพักและออก');
      return;
    }

    try {
      setIsBooking(true);
      
      // Validate required data
      if (!room.id) {
        toast.error('ไม่พบข้อมูลห้องพัก กรุณาลองใหม่');
        return;
      }
      
      if (!user?.id) {
        toast.error('กรุณาเข้าสู่ระบบก่อนทำการจอง');
        router.push('/login');
        return;
      }
      
      // Calculate and validate price
      const totalPrice = calculateTotal();
      const nights = calculateNights();
      
      if (totalPrice <= 0 || nights <= 0) {
        toast.error('ข้อมูลราคาหรือจำนวนคืนไม่ถูกต้อง');
        return;
      }
      
      // ตรวจสอบว่า bed_type มีค่าหรือไม่
      if (!room.bed_type) {
        console.error('❌ bed_type is missing from room data:', room);
        toast.error('ข้อมูลประเภทเตียงไม่ครบถ้วน กรุณาลองใหม่');
        return;
      }

      const bookingData = {
        user_id: parseInt(user.id),
        hotel_id: parseInt(room.hotel_id || 2), // Use hotel_id 2 as default (from database)
        bed_type: room.bed_type, // ใช้ bed_type แทน room_type_id
        check_in_date: checkinDate,
        check_out_date: checkoutDate,
        guests: parseInt(guestCount),
        total_price: parseFloat(totalPrice),
        guest_name: '', // Will be filled in payment page
        guest_phone: '', // Will be filled in payment page
        guest_email: '', // Will be filled in payment page
        guest_national_id: '', // Will be filled in payment page
        special_requests: ''
      };

      console.log('🔍 Creating booking with data:', bookingData);
      console.log('🔍 bed_type value:', bookingData.bed_type);
      console.log('📊 Calculated nights:', nights, 'Total price:', totalPrice);
      
      // เก็บข้อมูลการจองไว้ใน localStorage
      localStorage.setItem('pendingBookingData', JSON.stringify(bookingData));
      
      toast.success('กำลังพาไปยังหน้าชำระเงิน...');
      
      // สร้าง URL สำหรับหน้าชำระเงินโดยไม่ต้องมี booking ID
      const paymentUrl = `/payment/create?room=${room.id}&checkin=${checkinDate}&checkout=${checkoutDate}&guests=${guestCount}`;
      setTimeout(() => {
        router.push(paymentUrl);
      }, 1000);
      
    } catch (error) {
      console.error('Error preparing booking data:', error);
      toast.error('เกิดข้อผิดพลาดในการเตรียมข้อมูล');
    } finally {
      setIsBooking(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    // ใช้ utility function แทนเพื่อหลีกเลี่ยงปัญหา timezone
    return formatDateThai(dateString);
  };

  // Function to convert bed_type to Thai display text
  const getBedTypeDisplay = (bedType) => {
    switch (bedType) {
      case 'single': return 'เตียงเดี่ยว';
      case 'double': return 'เตียงคู่';
      default: return bedType;
    }
  };

  const nextImage = () => {
    if (room && room.images && room.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % room.images.length);
    }
  };

  const prevImage = () => {
    if (room && room.images && room.images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + room.images.length) % room.images.length);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-thai">กำลังโหลดข้อมูลห้องพัก...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🏨</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2 font-thai-header">ไม่พบห้องพักที่ต้องการ</h2>
          <p className="text-slate-600 font-thai mb-4">ห้องพักที่คุณค้นหาอาจไม่พร้อมให้บริการ</p>
          <Link
            href="/rooms"
            className="inline-block bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 font-thai"
          >
            ดูห้องพักอื่น
          </Link>
        </div>
      </div>
    );
  }

  const displayImages = room.images && room.images.length > 0 ? room.images : [room.image_url];

  return (
    <div className="min-h-screen bg-slate-50 pt-20">
      {/* Back Button */}
      <div className="container mx-auto px-6 py-4">
        <Link href="/rooms" className="inline-flex items-center text-slate-600 hover:text-slate-800 font-thai">
          <ArrowLeft className="h-5 w-5 mr-2" />
          กลับไปยังรายการห้องพัก
        </Link>
      </div>

      <div className="container mx-auto px-6 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative h-96 rounded-2xl overflow-hidden">
              <img
                src={getRoomImageUrl(displayImages[currentImageIndex]) || getRoomPlaceholder(room.bed_type)}
                alt={room.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = getRoomPlaceholder(room.bed_type);
                }}
              />
              
              {displayImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {displayImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-3 h-3 rounded-full transition-colors ${
                          index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            
            {displayImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {displayImages.slice(0, 4).map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      index === currentImageIndex ? 'border-amber-500' : 'border-transparent'
                    }`}
                  >
                    <img
                      src={getRoomImageUrl(image) || getRoomPlaceholder(room.bed_type)}
                      alt={`${room.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Room Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2 font-thai-header">{room.name}</h1>
              <div className="flex items-center space-x-4 text-slate-600 mb-4 font-thai">
                <span className="flex items-center">
                  <Users className="h-5 w-5 mr-1" />
                  {room.max_occupancy} ผู้เข้าพัก
                </span>
                <span>{room.bed_type}</span>
              </div>
              <p className="text-slate-700 leading-relaxed font-thai">{room.description}</p>
            </div>

            {/* Amenities */}
            {room.amenities && room.amenities.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-3 font-thai-header">สิ่งอำนวยความสะดวก</h3>
                <div className="grid grid-cols-2 gap-2">
                  {room.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center space-x-2 text-slate-700 font-thai">
                      <Check className="h-5 w-5 text-green-500" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Booking Summary */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold text-slate-800 mb-4 font-thai-header">สรุปการจอง</h3>
              
              {/* Date Picker Section - Always Visible */}
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <CustomDatePicker
                    selected={checkInDate}
                    onChange={handleCheckInChange}
                    label="วันที่เข้าพัก"
                    placeholder="เลือกวันที่เข้าพัก"
                    minDate={new Date()}
                    selectsStart
                    startDate={checkInDate}
                    endDate={checkOutDate}
                    required
                  />
                  <CustomDatePicker
                    selected={checkOutDate}
                    onChange={handleCheckOutChange}
                    label="วันที่ออก"
                    placeholder="เลือกวันที่ออก"
                    minDate={checkInDate ? new Date(checkInDate.getTime() + 24 * 60 * 60 * 1000) : new Date()}
                    selectsEnd
                    startDate={checkInDate}
                    endDate={checkOutDate}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    จำนวนผู้เข้าพัก
                  </label>
                  <select
                    value={guests}
                    onChange={(e) => handleGuestsChange(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {Array.from({ length: room.max_occupancy || 4 }, (_, i) => i + 1).map(num => (
                      <option key={num} value={num}>{num} คน</option>
                    ))}
                  </select>
                </div>
              </div>



              {/* Price Summary - Show when dates are selected */}
              {checkInDate && checkOutDate ? (
                <div className="bg-amber-50 p-4 rounded-lg space-y-3">
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>จำนวนคืน:</span>
                    <span className="font-medium">
                      {calculateNights()} คืน
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>ราคาต่อคืน:</span>
                    <span className="font-medium">฿{room.price_per_night?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold text-amber-600 border-t pt-2">
                    <span>ราคารวม:</span>
                    <span>
                      ฿{calculateTotal().toLocaleString()}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-gray-600 font-thai">เลือกวันที่เพื่อดูราคา</p>
                </div>
              )}

              {/* Book Button */}
              <button
                onClick={handleBooking}
                disabled={
                  isBooking || 
                  !checkInDate || !checkOutDate
                }
                className="w-full mt-6 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-4 rounded-lg font-semibold transition-colors duration-200 font-thai"
              >
                {isBooking ? 'กำลังจอง...' : 'ดำเนินการต่อ'}
              </button>

              {!user && (
                <p className="text-center text-sm text-slate-500 mt-2 font-thai">
                  <Link href="/login" className="text-amber-600 hover:text-amber-700">
                    เข้าสู่ระบบ
                  </Link>
                  {' '}เพื่อทำการจอง
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}