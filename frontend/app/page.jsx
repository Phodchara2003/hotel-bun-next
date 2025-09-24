'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Users, Wifi, Car, Coffee, Tv, Wind, Phone, Mail, Globe, Facebook, MessageCircle, Bed, Square } from 'lucide-react';
import { hotelAPI } from '../lib/api';
import { getRoomImageUrl, getFallbackRoomImages, getPlaceholderImageUrl, getRoomImageUrlWithCache } from '../lib/imageUtils';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

export default function HomePage() {
  const { user } = useAuth();
  const [hotel, setHotel] = useState(null);
  const [roomTypes, setRoomTypes] = useState([]);
  const [filteredRoomTypes, setFilteredRoomTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [contactInfo, setContactInfo] = useState(null);
  const [selectedBedType, setSelectedBedType] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [availabilityMessage, setAvailabilityMessage] = useState('');
  
  // State สำหรับการเลื่อนรูปอัตโนมัติ
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  
  // รายการประเภทเตียงทั้งหมดที่คงที่ (เฉพาะที่มีในระบบ)
  const allBedTypes = ['single', 'double'];

  // แสดงสถานะ authentication ใน console
  useEffect(() => {
    if (user) {
      console.log('🔐 Authentication Status: Logged in as', user.email, '(' + user.role + ')');
      
      // ตรวจสอบข้อมูลโทเคนใน localStorage
      if (typeof window !== 'undefined') {
        const persistentToken = localStorage.getItem('auth_token_persistent');
        const persistentUser = localStorage.getItem('user_data_persistent');
        const authExpires = localStorage.getItem('auth_expires_at');
        const rememberMe = localStorage.getItem('remember_me');
        
        console.log('💾 Token Storage Status:');
        console.log('  - Persistent Token:', persistentToken ? 'Stored ✅' : 'Missing ❌');
        console.log('  - Persistent User Data:', persistentUser ? 'Stored ✅' : 'Missing ❌');
        console.log('  - Remember Me:', rememberMe === 'true' ? 'Enabled ✅' : 'Disabled ❌');
        
        if (authExpires) {
          const expiresDate = new Date(parseInt(authExpires));
          console.log('  - Expires At:', expiresDate.toLocaleString('th-TH'));
        }
      }
    } else {
      console.log('🔐 Authentication Status: Not logged in');
    }
  }, [user]);

  // Fallback data ในกรณีที่ API ไม่ได้
  const fallbackHotel = {
    name: "โรงแรมสวยงาม",
    description: "โรงแรมสุดหรูใจกลางเมือง พร้อมสิ่งอำนวยความสะดวกครบครัน",
    address: "123 ถนนใหญ่ กรุงเทพฯ",
    rating: 4.5
  };

  const fallbackRooms = [
    {
      id: 1,
      name: "ห้องสแตนดาร์ด",
      description: "ห้องพักสำหรับผู้เข้าพักทั่วไปพร้อมสิ่งอำนวยความสะดวกครบครัน",
      pricePerNight: 1200,
      maxGuests: 2,
      sizeSqm: 25,
      amenities: ["Wi-Fi ฟรี", "เครื่องปรับอากาศ", "ทีวี"]
    },
    {
      id: 2,
      name: "ห้องซูพีเรียร์",
      description: "ห้องพักขนาดใหญ่กว่าพร้อมวิวที่สวยงาม",
      pricePerNight: 1800,
      maxGuests: 3,
      sizeSqm: 35,
      amenities: ["Wi-Fi ฟรี", "เครื่องปรับอากาศ", "ทีวี", "ตู้เซฟ"]
    },
    {
      id: 3,
      name: "ห้องดีลักซ์",
      description: "ห้องพักหรูหราพร้อมระเบียงส่วนตัว",
      pricePerNight: 2500,
      maxGuests: 4,
      sizeSqm: 45,
      amenities: ["Wi-Fi ฟรี", "เครื่องปรับอากาศ", "ทีวี", "ตู้เซฟ", "ระเบียง"]
    },
    {
      id: 4,
      name: "ห้องสวีท",
      description: "ห้องพักขนาดใหญ่พร้อมห้องนั่งเล่นแยกต่างหาก",
      pricePerNight: 3500,
      maxGuests: 6,
      sizeSqm: 65,
      amenities: ["Wi-Fi ฟรี", "เครื่องปรับอากาศ", "ทีวี", "ตู้เซฟ", "ระเบียง", "ห้องนั่งเล่น"]
    },
    {
      id: 5,
      name: "ห้องแฟมิลี่",
      description: "ห้องพักขนาดใหญ่สำหรับครอบครัว",
      pricePerNight: 4200,
      maxGuests: 8,
      sizeSqm: 80,
      amenities: ["Wi-Fi ฟรี", "เครื่องปรับอากาศ", "ทีวี", "ตู้เซฟ", "ครัวเล็ก", "ห้องนั่งเล่น"]
    }
  ];

  // Helper function to get price from room object
  const getPrice = (room) => {
    return room.price_per_night || room.pricePerNight || room.price || 1500;
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

  // Auto slide images effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex(prev => {
        const newIndex = { ...prev };
        
        // วนลูปผ่านห้องพักทั้งหมดที่มีรูปมากกว่า 1 รูป
        filteredRoomTypes.forEach(room => {
          if (room.images && Array.isArray(room.images) && room.images.length > 1) {
            const currentIndex = newIndex[room.id] || 0;
            newIndex[room.id] = (currentIndex + 1) % room.images.length;
          }
        });
        
        return newIndex;
      });
    }, 3000); // เปลี่ยนรูปทุก 3 วินาที

    return () => clearInterval(interval);
  }, [filteredRoomTypes]);

  const fetchHotelAndRooms = async (bedTypeFilter = '') => {
    try {
      setIsLoading(true);
      console.log('🚀 Starting to fetch hotel and room data...', bedTypeFilter ? `with bed type filter: ${bedTypeFilter}` : '');
      
      // Get global pricing first
      let uniformPrice = 1500; // Default fallback price
      try {
        console.log('💰 Fetching global pricing...');
        const globalPriceRes = await fetch('http://localhost:3001/api/global-settings');
        const globalPriceData = await globalPriceRes.json();
        uniformPrice = parseFloat(globalPriceData.data?.room_price_per_night || '1500');
        console.log('💰 Global price fetched:', uniformPrice);
      } catch (priceError) {
        console.log('⚠️ Homepage: Could not fetch global price, using default 1500', priceError);
      }
      
      // Try direct API calls instead of hotelAPI
      console.log('🏨 Fetching hotels directly...');
      const hotelsResponse = await fetch('http://localhost:3001/api/hotels');
      const hotelsData = await hotelsResponse.json();
      console.log('🏨 Hotels response:', hotelsData);
      
      // Build URL with bed type filter if provided
      let roomTypesUrl = `http://localhost:3001/api/room-types-with-images?t=${Date.now()}`;
      if (bedTypeFilter) {
        roomTypesUrl += `&bed_type=${encodeURIComponent(bedTypeFilter)}`;
      }
      
      console.log('🏠 Fetching room types with images directly...', roomTypesUrl);
      const roomTypesResponse = await fetch(roomTypesUrl, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      const roomTypesData = await roomTypesResponse.json();
      console.log('🏠 Room types response:', roomTypesData);
      
      if (hotelsData.success && roomTypesData.success) {
        // Use first hotel from database
        setHotel(hotelsData.data[0]);
        
        const roomTypesWithUniformPricing = roomTypesData.data.map(room => ({
          ...room,
          price: uniformPrice
        }));
        
        setRoomTypes(roomTypesWithUniformPricing);
        setFilteredRoomTypes(roomTypesWithUniformPricing);
        
        console.log('✅ Homepage: Data loaded successfully from direct API calls');
        console.log('🛏️ Available bed types:', allBedTypes);
      } else {
        throw new Error('API response failed');
      }
      
    } catch (error) {
      console.log('⚠️ Homepage: API failed, using fallback data:', error.message);
      setHotel(fallbackHotel);
      
      // Apply uniform pricing to fallback rooms
      const fallbackRoomsWithUniformPricing = fallbackRooms.map(room => ({
        ...room,
        price: 1500 // Fallback uniform price
      }));
      
      setRoomTypes(fallbackRoomsWithUniformPricing);
      setFilteredRoomTypes(fallbackRoomsWithUniformPricing);
      // ไม่แสดง toast error เพราะ user ยังได้เห็นข้อมูลอยู่
    } finally {
      setIsLoading(false);
    }
  };

  const fetchContactInfo = async () => {
    try {
      console.log('📞 Fetching hotel contact information...');
      const response = await fetch('http://localhost:3001/api/contact-settings');
      const result = await response.json();
      
      console.log('📞 Contact info response:', result);
      
      if (result.success && result.data) {
        setContactInfo(result.data);
        console.log('✅ Contact info loaded:', result.data);
      } else {
        console.log('⚠️ Using default contact info');
        // Fallback to default contact info
        setContactInfo({
          phone: '02-123-4567',
          email: 'support@hotel.com',
          address: '123 ถนนใหญ่ เขตกลาง กรุงเทพฯ 10100',
          website: 'www.hotel.com',
          facebook: 'facebook.com/hotel',
          line: '@hotel'
        });
      }
    } catch (error) {
      console.error('❌ Error fetching contact info:', error);
      // Fallback to default contact info
      setContactInfo({
        phone: '02-123-4567',
        email: 'support@hotel.com',
        address: '123 ถนนใหญ่ เขตกลาง กรุงเทพฯ 10100',
        website: 'www.hotel.com',
        facebook: 'facebook.com/hotel',
        line: '@hotel'
      });
    }
  };

  useEffect(() => {
    fetchHotelAndRooms();
    fetchContactInfo();
  }, []);

  // Refresh data when page gets focus to show latest room images
  useEffect(() => {
    const handleFocus = () => {
      if (!isLoading) {
        console.log('🔄 Refreshing hotel and room data on page focus');  
        fetchHotelAndRooms();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isLoading]);

  // ฟังก์ชันตรวจสอบความพร้อมของห้องพัก
  const checkRoomAvailability = async () => {
    if (!checkInDate || !checkOutDate) {
      // หากไม่มีวันที่ ให้แสดงห้องพักทั้งหมด
      if (selectedBedType === '') {
        setFilteredRoomTypes(roomTypes);
      } else {
        const filtered = roomTypes.filter(room => room.bed_type === selectedBedType);
        setFilteredRoomTypes(filtered);
      }
      setAvailabilityMessage('');
      return;
    }

    // ตรวจสอบว่าวันที่เช็คอินต้องเป็นก่อนวันที่เช็คเอาท์
    if (new Date(checkInDate) >= new Date(checkOutDate)) {
      setAvailabilityMessage('⚠️ วันที่เช็คอินต้องเป็นก่อนวันที่เช็คเอาท์');
      setFilteredRoomTypes([]);
      return;
    }

    try {
      console.log('🔍 Checking availability for:', { checkInDate, checkOutDate, selectedBedType });
      
      let apiUrl = `http://localhost:3001/api/check-room-availability?check_in_date=${checkInDate}&check_out_date=${checkOutDate}`;
      if (selectedBedType) {
        apiUrl += `&bed_type=${selectedBedType}`;
      }

      const response = await fetch(apiUrl);
      const result = await response.json();

      if (result.success) {
        if (result.data.length === 0) {
          setAvailabilityMessage('❌ ขออภัย ไม่มีห้องว่างในช่วงวันที่ที่เลือก กรุณาเลือกวันอื่น');
          setFilteredRoomTypes([]);
        } else {
          // Get global pricing for uniform price
          let uniformPrice = 1500; // Default fallback price
          try {
            const globalPriceRes = await fetch('http://localhost:3001/api/global-settings');
            const globalPriceData = await globalPriceRes.json();
            uniformPrice = parseFloat(globalPriceData.data?.room_price_per_night || '1500');
          } catch (priceError) {
            console.log('⚠️ Could not fetch global price for availability check, using default 1500');
          }

          // Apply uniform pricing to available rooms
          const roomsWithUniformPricing = result.data.map(room => ({
            ...room,
            price: uniformPrice
          }));

          setAvailabilityMessage(`✅ พบห้องว่าง ${result.data.length} ห้อง ในช่วงวันที่ ${checkInDate} ถึง ${checkOutDate}`);
          setFilteredRoomTypes(roomsWithUniformPricing);
          console.log('🖼️ Available rooms with images:', roomsWithUniformPricing);
        }
      } else {
        setAvailabilityMessage('❌ เกิดข้อผิดพลาดในการตรวจสอบความพร้อม');
        setFilteredRoomTypes([]);
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      setAvailabilityMessage('❌ เกิดข้อผิดพลาดในการตรวจสอบความพร้อม');
      setFilteredRoomTypes([]);
    }
  };

  // กรองห้องพักตามเงื่อนไขต่างๆ
  useEffect(() => {
    checkRoomAvailability();
  }, [selectedBedType, checkInDate, checkOutDate, roomTypes]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hotel Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {hotel?.name || 'ยินดีต้อนรับ'}
              </h1>
              <p className="text-gray-600 mb-2">
                {hotel?.description || 'โรงแรมสุดหรูใจกลางเมือง'}
              </p>
              <div className="flex items-center text-sm text-gray-500">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{hotel?.address || 'กรุงเทพฯ'}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">
                ห้องพักพร้อม {roomTypes.length} ประเภท
              </p>
              <p className="text-sm text-gray-500">ราคาเริ่มต้น ฿{roomTypes.length > 0 ? Math.min(...roomTypes.map(r => getPrice(r))).toLocaleString() : '1,500'}</p>
            </div>
          </div>
        </div>

        {/* Quick Booking Form */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">วันที่เช็คอิน</label>
              <input 
                type="date" 
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">วันที่เช็คเอาท์</label>
              <input 
                type="date" 
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนผู้เข้าพัก</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="1">1 คน</option>
                <option value="2">2 คน</option>
                <option value="3">3 คน</option>
                <option value="4">4 คน</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ประเภทเตียง</label>
              <select 
                value={selectedBedType}
                onChange={(e) => setSelectedBedType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">ทุกประเภท</option>
                {allBedTypes.map((bedType) => (
                  <option key={bedType} value={bedType}>
                    {getBedTypeLabel(bedType)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Link 
                href="/booking-step" 
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center font-semibold"
              >
                ค้นหาห้องพัก
              </Link>
            </div>
          </div>
        </div>

        {/* Availability Message */}
        {availabilityMessage && (
          <div className={`mb-6 p-4 rounded-lg ${
            availabilityMessage.includes('❌') || availabilityMessage.includes('⚠️') 
              ? 'bg-red-50 border border-red-200 text-red-800' 
              : 'bg-green-50 border border-green-200 text-green-800'
          }`}>
            <p className="font-medium">{availabilityMessage}</p>
          </div>
        )}

        {/* Room Types Section */}
        {filteredRoomTypes.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                ประเภทห้องพัก
                {selectedBedType && (
                  <span className="text-lg font-normal text-blue-600 ml-2">
                    ({getBedTypeLabel(selectedBedType)})
                  </span>
                )}
              </h3>
              <div className="text-sm text-gray-600">
                <p className="text-gray-600 mb-4">
                  ราคาเริ่มต้น ฿{filteredRoomTypes.length > 0 ? Math.min(...filteredRoomTypes.map(r => getPrice(r))).toLocaleString() : '1,500'} - ฿{filteredRoomTypes.length > 0 ? Math.max(...filteredRoomTypes.map(r => getPrice(r))).toLocaleString() : '2,500'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRoomTypes.map((room) => (
                <div key={room.id} className="group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 overflow-hidden">
                  <div className="relative h-48 bg-gradient-to-br from-blue-100 to-blue-200 overflow-hidden">
                    {(() => {
                      // Process images - simplified processing since backend now handles parsing
                      let imageArray = [];
                      
                      if (room.images) {
                        console.log('🖼️ Processing images for room:', room.name, 'Raw images:', room.images);
                        
                        if (Array.isArray(room.images)) {
                          imageArray = room.images.filter(img => img && typeof img === 'string' && img.trim());
                        } else if (typeof room.images === 'string' && room.images.trim()) {
                          // Backend should have parsed it, but handle just in case
                          try {
                            const parsed = JSON.parse(room.images);
                            imageArray = Array.isArray(parsed) ? parsed : [room.images];
                          } catch (e) {
                            imageArray = [room.images];
                          }
                        }
                      }
                      
                      console.log('🖼️ Final processed images for', room.name, ':', imageArray);
                      
                      // Use room images that are uploaded by admin
                      const getRoomImageSrc = (imageName, roomId) => {
                        const imageSrc = getRoomImageUrlWithCache(imageName, roomId);
                        console.log('🖼️ Getting image source:', imageSrc);
                        return imageSrc;
                      };

                      const getFallbackImageSrc = (roomId, roomName) => {
                        // Fallback to predefined room images 
                        const fallbackImages = getFallbackRoomImages();
                        const fallbackSrc = fallbackImages[(roomId - 1) % fallbackImages.length] || getPlaceholderImageUrl();
                        console.log('🔄 Using fallback image:', fallbackSrc);
                        return fallbackSrc;
                      };

                      return imageArray.length > 0 ? (
                        <>
                          <img 
                            src={getRoomImageSrc(imageArray[currentImageIndex[room.id] || 0], room.id)}
                            alt={room.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                            onLoad={() => {
                              console.log('✅ Room image loaded successfully:', getRoomImageSrc(imageArray[currentImageIndex[room.id] || 0], room.id));
                            }}
                            onError={(e) => {
                              console.log('❌ Room image failed to load:', e.target.src);
                              console.log('❌ Available images for room:', room.name, ':', imageArray);
                              // Try fallback image
                              const fallbackSrc = getFallbackImageSrc(room.id, room.name);
                              if (e.target.src !== fallbackSrc) {
                                console.log('🔄 Trying fallback image:', fallbackSrc);
                                e.target.src = fallbackSrc;
                              } else {
                                // Final fallback to placeholder
                                console.log('❌ All images failed, showing placeholder');
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }
                            }}
                          />
                          
                          {/* Image Indicators - แสดงเฉพาะเมื่อมีรูปมากกว่า 1 รูป */}
                          {imageArray.length > 1 && (
                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
                              {imageArray.map((_, index) => (
                                <button
                                  key={index}
                                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                    index === (currentImageIndex[room.id] || 0)
                                      ? 'bg-white shadow-lg scale-125'
                                      : 'bg-white/60 hover:bg-white/80'
                                  }`}
                                  onClick={() => {
                                    setCurrentImageIndex(prev => ({
                                      ...prev,
                                      [room.id]: index
                                    }));
                                  }}
                                />
                              ))}
                            </div>
                          )}
                          
                          {/* Image Counter - แสดงเฉพาะเมื่อมีรูปมากกว่า 1 รูป */}
                          {imageArray.length > 1 && (
                            <div className="absolute bottom-4 right-4 bg-black/50 text-white px-2 py-1 rounded-full text-xs font-medium">
                              {(currentImageIndex[room.id] || 0) + 1}/{imageArray.length}
                            </div>
                          )}
                          
                          <div className="absolute inset-0 hidden items-center justify-center text-blue-600 bg-gradient-to-br from-blue-100 to-blue-200">
                            <div className="text-center">
                              <Calendar className="h-8 w-8 mx-auto mb-1" />
                              <span className="text-xs font-medium">ภาพห้องพัก</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-blue-600">
                          <img 
                            src={getFallbackImageSrc(room.id, room.name)}
                            alt={room.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              console.log('❌ Fallback image failed, showing placeholder icon');
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div className="absolute inset-0 hidden items-center justify-center text-blue-600 bg-gradient-to-br from-blue-100 to-blue-200">
                            <div className="text-center">
                              <Calendar className="h-8 w-8 mx-auto mb-1" />
                              <span className="text-xs font-medium">ภาพห้องพัก</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                    {/* Price Badge - Enhanced */}
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-2 rounded-full text-sm font-bold shadow-lg backdrop-blur-sm">
                      ฿{getPrice(room).toLocaleString()}
                      <span className="text-xs opacity-90 ml-1">/คืน</span>
                    </div>
                    {/* Room Type Badge */}
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-gray-700 px-3 py-1 rounded-full text-xs font-medium shadow-sm">
                      {room.type === 'standard' ? 'ห้องมาตรฐาน' : 
                       room.type === 'deluxe' ? 'ห้องดีลักซ์' : 
                       room.type === 'suite' ? 'ห้องสวีท' : 
                       room.type === 'family' ? 'ห้องแฟมิลี่' : room.type}
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="mb-4">
                      <h4 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-200">
                        {room.name}
                      </h4>
                      {room.bed_type && (
                        <div className="mb-2">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <Bed className="h-3 w-3 mr-1.5" />
                            {getBedTypeLabel(room.bed_type)}
                          </span>
                        </div>
                      )}
                      <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{room.description}</p>
                    </div>
                    
                    {/* Room Details Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-2 text-blue-500" />
                        <span className="font-medium">{room.max_guests || room.maxGuests || 2} คน</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Square className="h-4 w-4 mr-2 text-blue-500" />
                        <span className="font-medium">{room.size_sqm || room.sizeSqm || 30} ตร.ม.</span>
                      </div>
                    </div>

                    {/* Amenities - Enhanced */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {(room.amenities || []).slice(0, 3).map((amenity, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-md font-medium border border-blue-200">
                          {amenity}
                        </span>
                      ))}
                      {(room.amenities || []).length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md font-medium border border-gray-200">
                          +{room.amenities.length - 3} อื่นๆ
                        </span>
                      )}
                    </div>

                    {/* Enhanced Action Buttons */}
                    <div className="flex space-x-3 pt-2 border-t border-gray-100">
                      <Link 
                        href={`/booking-step?roomId=${room.id}&hotelId=${room.hotel_id || hotel?.id || 1}`}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-center py-3 px-4 rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                      >
                        จองห้องนี้
                      </Link>
                      <Link 
                        href={`/room-details/${room.id}`}
                        className="px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 text-center"
                      >
                        ดูรายละเอียด
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-gray-400 mb-4">
              <Calendar className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่พบห้องพักที่ตรงกับเงื่อนไข</h3>
            <p className="text-gray-600 mb-4">
              {selectedBedType ? 
                `ไม่มีห้องพักประเภท${getBedTypeLabel(selectedBedType)}ในขณะนี้` : 
                'ขณะนี้ยังไม่มีข้อมูลห้องพักในระบบ'
              }
            </p>
            <div className="space-x-4">
              {selectedBedType && (
                <button
                  onClick={() => setSelectedBedType('')}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  แสดงห้องทั้งหมด
                </button>
              )}
              <button
                onClick={() => fetchHotelAndRooms()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                โหลดข้อมูลใหม่
              </button>
            </div>
          </div>
        )}

        {/* Room Statistics */}
        {filteredRoomTypes.length > 0 && (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{filteredRoomTypes.length}</div>
              <div className="text-sm text-gray-600">ประเภทห้องพัก</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 text-center">
              <div className="text-2xl font-bold text-green-600">฿{filteredRoomTypes.length > 0 ? Math.min(...filteredRoomTypes.map(r => getPrice(r))).toLocaleString() : '1,500'}</div>
              <div className="text-sm text-gray-600">ราคาเริ่มต้น</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {filteredRoomTypes.length > 0 ? Math.max(...filteredRoomTypes.map(r => r.max_guests || r.maxGuests || 2)) : '2'}
              </div>
              <div className="text-sm text-gray-600">รองรับสูงสุด (คน)</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {filteredRoomTypes.length > 0 ? Math.max(...filteredRoomTypes.map(r => r.size_sqm || r.sizeSqm || 30)) : '30'}
              </div>
              <div className="text-sm text-gray-600">ขนาดใหญ่สุด (ตร.ม.)</div>
            </div>
          </div>
        )}

        {/* Room Categories */}
        {filteredRoomTypes.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">หมวดหมู่ห้องพัก</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">
                  {filteredRoomTypes.filter(r => getPrice(r) <= 2000).length}
                </div>
                <div className="text-sm text-blue-800">ห้องราคาประหยัด</div>
                <div className="text-xs text-blue-600">≤ ฿2,000</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">
                  {filteredRoomTypes.filter(r => getPrice(r) > 2000 && getPrice(r) <= 5000).length}
                </div>
                <div className="text-sm text-green-800">ห้องระดับกลาง</div>
                <div className="text-xs text-green-600">฿2,001 - ฿5,000</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-lg font-bold text-purple-600">
                  {filteredRoomTypes.filter(r => getPrice(r) > 5000).length}
                </div>
                <div className="text-sm text-purple-800">ห้องหรูหรา</div>
                <div className="text-xs text-purple-600">&gt; ฿5,000</div>
              </div>
            </div>
          </div>
        )}

        {/* Features Section */}
        <div className="mt-12 bg-white rounded-lg shadow-sm p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">สิ่งอำนวยความสะดวก</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {[
              { icon: Wifi, name: "Wi-Fi ฟรี" },
              { icon: Car, name: "ที่จอดรถ" },
              { icon: Coffee, name: "อาหารเช้า" },
              { icon: Tv, name: "ทีวี" },
              { icon: Wind, name: "เครื่องปรับอากาศ" }
            ].map((feature, index) => (
              <div key={index} className="text-center">
                <feature.icon className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <p className="text-sm text-gray-700 font-medium">{feature.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Hotel Contact Information */}
        {contactInfo && (
          <div className="mt-12 bg-white rounded-lg shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center flex items-center justify-center">
              <Phone className="mr-3 text-blue-600" size={28} />
              ติดต่อเรา
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <Phone className="text-green-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">โทรศัพท์</p>
                    <p className="text-lg font-semibold text-gray-800">{contactInfo.phone}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <Mail className="text-red-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">อีเมล</p>
                    <p className="text-lg font-semibold text-gray-800">{contactInfo.email}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    <MapPin className="text-purple-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">ที่อยู่</p>
                    <p className="text-lg font-semibold text-gray-800 leading-relaxed">{contactInfo.address}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                {contactInfo.website && (
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <Globe className="text-blue-600" size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">เว็บไซต์</p>
                      <a 
                        href={`https://${contactInfo.website}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-lg font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                      >
                        {contactInfo.website}
                      </a>
                    </div>
                  </div>
                )}
                {contactInfo.facebook && (
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <Facebook className="text-blue-700" size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Facebook</p>
                      <a 
                        href={`https://${contactInfo.facebook}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-lg font-semibold text-blue-700 hover:text-blue-900 hover:underline transition-colors"
                      >
                        {contactInfo.facebook}
                      </a>
                    </div>
                  </div>
                )}
                {contactInfo.line && (
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <MessageCircle className="text-green-500" size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">LINE ID</p>
                      <p className="text-lg font-semibold text-gray-800">{contactInfo.line}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
