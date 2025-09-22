'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Users, MapPin, Wifi, Car, Coffee, Tv, Wind, CreditCard, User, Mail, Phone, Bed } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../../contexts/AuthContext';

export default function BookRoomPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  
  const [room, setRoom] = useState(null);
  const [hotel, setHotel] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Booking form state
  const [bookingData, setBookingData] = useState({
    checkIn: '',
    checkOut: '',
    guests: 1,
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    nationalId: '',
    address: '',
    specialRequests: ''
  });

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
        
        console.log('📝 Loading profile data for booking form:', profile);
        
        // อัปเดตข้อมูลฟอร์มจากโปรไฟล์
        const updatedFormData = {
          ...bookingData,
          firstName: profile?.firstName || profile?.first_name || user?.first_name || '',
          lastName: profile?.lastName || profile?.last_name || user?.last_name || '',
          email: profile?.email || user?.email || '',
          phone: profile?.phone || user?.phone || '',
          nationalId: profile?.nationalId || profile?.national_id || user?.national_id || '',
          address: profile?.address || user?.address || ''
        };
        
        setBookingData(updatedFormData);
        
        console.log('✅ Auto-fill completed with data:', updatedFormData);

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
        console.log('📝 Using user context data for booking form');
        const userName = user?.name || '';
        const nameParts = userName.split(' ');
        const fallbackData = {
          ...bookingData,
          firstName: user?.first_name || (nameParts.length > 0 ? nameParts[0] : '') || '',
          lastName: user?.last_name || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '') || '',
          email: user?.email || '',
          phone: user?.phone || '',
          nationalId: user?.national_id || '',
          address: user?.address || ''
        };
        
        setBookingData(fallbackData);
        toast.success('ใช้ข้อมูลผู้ใช้พื้นฐาน', {
          duration: 2000,
          icon: '👤'
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      // Fallback to user context data
      const userName = user?.name || '';
      const nameParts = userName.split(' ');
      setBookingData(prev => ({
        ...prev,
        firstName: user?.first_name || (nameParts.length > 0 ? nameParts[0] : '') || '',
        lastName: user?.last_name || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '') || '',
        email: user?.email || '',
        phone: user?.phone || '',
        nationalId: user?.national_id || '',
        address: user?.address || ''
      }));
    }
  };

  // Initialize form with user data
  useEffect(() => {
    if (user && isAuthenticated) {
      loadUserProfile();
    }
  }, [user, isAuthenticated]);

  const fetchRoomDetails = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Fetching room details for booking, ID:', params.id);
      
      // Use the same API endpoint as room details page
      const roomTypesResponse = await fetch('http://localhost:3001/api/room-types-with-images');
      const roomTypesData = await roomTypesResponse.json();
      
      if (roomTypesData.success && roomTypesData.data) {
        const foundRoom = roomTypesData.data.find(r => r.id.toString() === params.id);
        
        if (foundRoom) {
          console.log('🏠 Found room data for booking:', foundRoom);
          
          // Process images - simplified processing like homepage
          let imageArray = [];
          
          if (foundRoom.images) {
            console.log('🖼️ Processing images for booking room:', foundRoom.name, 'Raw images:', foundRoom.images);
            
            if (Array.isArray(foundRoom.images)) {
              imageArray = foundRoom.images.filter(img => img && typeof img === 'string' && img.trim());
            } else if (typeof foundRoom.images === 'string' && foundRoom.images.trim()) {
              // Backend should have parsed it, but handle just in case
              try {
                const parsed = JSON.parse(foundRoom.images);
                imageArray = Array.isArray(parsed) ? parsed : [foundRoom.images];
              } catch (e) {
                imageArray = [foundRoom.images];
              }
            }
          }
          
          console.log('🖼️ Final processed images for booking:', foundRoom.name, ':', imageArray);
          
          // Convert to public folder paths
          let imageUrls = [];
          if (imageArray.length > 0) {
            imageUrls = imageArray.map(img => `/images/rooms/${img}`);
          }
          
          // Add beautiful fallback images based on room type
          const roomTypeLower = (foundRoom.name || foundRoom.type || '').toLowerCase();
          const fallbackImages = [];
          
          if (roomTypeLower.includes('standard')) {
            fallbackImages.push(
              'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80',
              'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80'
            );
          } else if (roomTypeLower.includes('deluxe')) {
            fallbackImages.push(
              'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600&q=80',
              'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&q=80'
            );
          } else if (roomTypeLower.includes('suite')) {
            fallbackImages.push(
              'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&q=80',
              'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600&q=80'
            );
          } else {
            fallbackImages.push(
              'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600&q=80',
              'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80'
            );
          }
          
          // Combine processed images with fallbacks
          const allImages = [...imageUrls, ...fallbackImages];

          const roomData = {
            id: foundRoom.id,
            name: foundRoom.name,
            description: foundRoom.description,
            price: parseFloat(foundRoom.price_per_night || 1500),
            maxGuests: parseInt(foundRoom.max_guests || 2),
            sizeSqm: parseInt(foundRoom.size_sqm || 30),
            amenities: Array.isArray(foundRoom.amenities) ? foundRoom.amenities : [],
            imageUrls: imageUrls.length > 0 ? imageUrls : ['/images/rooms/placeholder.svg'],
            images: allImages, // Keep for backwards compatibility
            type: foundRoom.type,
            hotel_id: foundRoom.hotel_id,
            hotel_name: foundRoom.hotel_name,
            hotel_address: foundRoom.hotel_address
          };
          
          setRoom(roomData);
          
          // Set hotel data
          if (foundRoom.hotel_name) {
            setHotel({
              id: foundRoom.hotel_id,
              name: foundRoom.hotel_name,
              address: foundRoom.hotel_address,
              description: foundRoom.hotel_description
            });
          }
          
        } else {
          toast.error('ไม่พบข้อมูลห้องพัก');
          router.push('/');
        }
      } else {
        throw new Error('ไม่สามารถโหลดข้อมูลห้องพักได้');
      }
    } catch (error) {
      console.error('❌ Error fetching room details:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomDetails();
  }, [params.id]);

  // Format National ID (14 digits)
  const formatNationalId = (value) => {
    const digits = value.replace(/\D/g, '');
    const limitedDigits = digits.substring(0, 14);
    
    if (limitedDigits.length >= 14) {
      return limitedDigits.replace(/(\d{1})(\d{4})(\d{5})(\d{2})(\d{2})/, '$1-$2-$3-$4-$5');
    } else if (limitedDigits.length >= 12) {
      return limitedDigits.replace(/(\d{1})(\d{4})(\d{5})(\d{2})(\d{0,2})/, '$1-$2-$3-$4-$5');
    } else if (limitedDigits.length >= 10) {
      return limitedDigits.replace(/(\d{1})(\d{4})(\d{5})(\d{0,2})/, '$1-$2-$3-$4');
    } else if (limitedDigits.length >= 5) {
      return limitedDigits.replace(/(\d{1})(\d{4})(\d{0,5})/, '$1-$2-$3');
    } else if (limitedDigits.length >= 1) {
      return limitedDigits.replace(/(\d{1})(\d{0,4})/, '$1-$2');
    }
    
    return limitedDigits;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    
    if (name === 'nationalId') {
      processedValue = formatNationalId(value);
    }
    
    setBookingData(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  // Helper function to get bed type label
  const getBedTypeLabel = (bedType) => {
    const bedTypes = {
      'single': 'เตียงเดี่ยว',
      'double': 'เตียงคู่',
      'queen': 'เตียงควีน',
      'king': 'เตียงคิง',
      'twin': 'เตียงแฝด'
    };
    return bedTypes[bedType] || bedType;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate National ID
    const nationalIdDigits = bookingData.nationalId.replace(/\D/g, '');
    if (nationalIdDigits.length !== 14) {
      toast.error('รหัสบัตรประชาชนต้องมี 14 หลัก');
      return;
    }

    // Validate required fields
    if (!bookingData.firstName || !bookingData.lastName || !bookingData.email || !bookingData.checkIn || !bookingData.checkOut) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    if (calculateNights() <= 0) {
      toast.error('กรุณาเลือกวันที่เข้าพักและออกที่ถูกต้อง');
      return;
    }

    try {
      console.log('📝 Submitting booking data:', bookingData);
      
      const bookingPayload = {
        roomTypeId: room.id,
        hotelId: room.hotelId,
        checkInDate: bookingData.checkIn,
        checkOutDate: bookingData.checkOut,
        guests: parseInt(bookingData.guests),
        totalPrice: calculateTotal(),
        guestName: `${bookingData.firstName} ${bookingData.lastName}`,
        guestPhone: bookingData.phone,
        guestEmail: bookingData.email,
        guestNationalId: bookingData.nationalId,
        guestAddress: bookingData.address,
        specialRequests: bookingData.specialRequests
      };

      // Here you would typically send to payment processing
      // For now, let's show a success message
      toast.success('ข้อมูลการจองถูกต้อง! กำลังเปลี่ยนเส้นทางไปหน้าชำระเงิน...', {
        duration: 3000
      });
      
      // TODO: Integrate with payment system
      console.log('💳 Booking payload ready for payment:', bookingPayload);
      
    } catch (error) {
      console.error('Error processing booking:', error);
      toast.error('เกิดข้อผิดพลาดในการประมวลผลการจอง');
    }
  };



  const calculateTotal = () => {
    if (!bookingData.checkIn || !bookingData.checkOut || !room) return 0;
    
    const checkIn = new Date(bookingData.checkIn);
    const checkOut = new Date(bookingData.checkOut);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    
    return nights > 0 ? nights * room.price : 0;
  };

  const calculateNights = () => {
    if (!bookingData.checkIn || !bookingData.checkOut) return 0;
    
    const checkIn = new Date(bookingData.checkIn);
    const checkOut = new Date(bookingData.checkOut);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    
    return nights > 0 ? nights : 0;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดข้อมูลห้องพัก...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">ไม่พบข้อมูลห้องพัก</p>
          <Link href="/" className="text-blue-600 hover:text-blue-700 mt-2 inline-block">
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href={`/room-details/${room.id}`}
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              กลับหน้ารายละเอียด
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">จองห้องพัก</h1>
            <div></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column - Room Info */}
          <div className="space-y-6">
            {/* Room Images */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="relative h-80">
                <img
                  src={room.imageUrls?.[currentImageIndex] || room.imageUrls?.[0] || '/images/rooms/placeholder.svg'}
                  alt={room.name}
                  className="w-full h-full object-cover"
                  onLoad={() => {
                    console.log('✅ Booking room image loaded:', room.imageUrls?.[currentImageIndex]);
                  }}
                  onError={(e) => {
                    console.log('❌ Booking room image failed to load:', e.target.src);
                    // Try next image if available
                    if (currentImageIndex < (room.imageUrls?.length || 0) - 1) {
                      setCurrentImageIndex(currentImageIndex + 1);
                    } else {
                      // Fallback to placeholder
                      e.target.src = '/images/rooms/placeholder.svg';
                    }
                  }}
                />
                
                {/* Image Navigation */}
                {room.imageUrls && room.imageUrls.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                    <div className="flex gap-2 bg-black/50 backdrop-blur-sm px-3 py-2 rounded-full">
                      {room.imageUrls.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Room Details */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {room.name}{room.bed_type ? ` - ${getBedTypeLabel(room.bed_type)}` : ''}
                  </h2>
                  <p className="text-gray-600 mb-4">{room.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">฿{room.price.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">ต่อคืน</div>
                </div>
              </div>

              {/* Room Info Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center text-gray-600">
                  <Users className="h-4 w-4 mr-2" />
                  <span>รองรับ {room.maxGuests} คน</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{room.sizeSqm} ตร.ม.</span>
                </div>
              </div>

              {/* Amenities */}
              {room.amenities.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">สิ่งอำนวยความสะดวก</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {room.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center text-gray-600">
                        <div className="h-4 w-4 mr-2">
                          {amenity.toLowerCase().includes('wifi') && <Wifi className="h-4 w-4" />}
                          {amenity.toLowerCase().includes('parking') && <Car className="h-4 w-4" />}
                          {amenity.toLowerCase().includes('coffee') && <Coffee className="h-4 w-4" />}
                          {amenity.toLowerCase().includes('tv') && <Tv className="h-4 w-4" />}
                          {amenity.toLowerCase().includes('air') && <Wind className="h-4 w-4" />}
                        </div>
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Booking Form */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">ข้อมูลการจอง</h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Check-in & Check-out */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    วันที่เข้าพัก <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="checkIn"
                    value={bookingData.checkIn}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    วันที่ออก <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="checkOut"
                    value={bookingData.checkOut}
                    onChange={handleInputChange}
                    min={bookingData.checkIn || new Date().toISOString().split('T')[0]}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Number of Guests */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  จำนวนผู้เข้าพัก <span className="text-red-500">*</span>
                </label>
                <select
                  name="guests"
                  value={bookingData.guests}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: room.maxGuests }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>{num} คน</option>
                  ))}
                </select>
              </div>

              {/* Guest Information */}
              <div className="border-t pt-6">
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
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ชื่อ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={bookingData.firstName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      นามสกุล <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={bookingData.lastName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    อีเมล <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={bookingData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    เบอร์โทรศัพท์
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={bookingData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    รหัสบัตรประชาชน <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nationalId"
                    value={bookingData.nationalId}
                    onChange={handleInputChange}
                    required
                    placeholder="1-XXXX-XXXXX-XX-X"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ที่อยู่
                  </label>
                  <textarea
                    name="address"
                    value={bookingData.address}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ที่อยู่สำหรับการติดต่อ"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ข้อความเพิ่มเติม
                  </label>
                  <textarea
                    name="specialRequests"
                    value={bookingData.specialRequests}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ความต้องการพิเศษ หรือข้อความอื่นๆ"
                  />
                </div>
              </div>

              {/* Price Summary */}
              {calculateNights() > 0 && (
                <div className="border-t pt-6">
                  <h4 className="font-medium text-gray-900 mb-4">สรุปการจอง</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-gray-600">
                      <span>฿{room.price.toLocaleString()} x {calculateNights()} คืน</span>
                      <span>฿{(room.price * calculateNights()).toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                      <span>รวมทั้งสิ้น</span>
                      <span className="text-blue-600">฿{calculateTotal().toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={!isAuthenticated || calculateNights() === 0}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {!isAuthenticated ? 'กรุณาเข้าสู่ระบบ' : 'ดำเนินการจ่ายเงิน →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}