'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Users, Wifi, Car, Coffee, Tv, Wind, Phone, Mail, Star, ArrowRight, CheckCircle, Menu, X } from 'lucide-react';
import { hotelAPI } from '../lib/api';
import { getRoomImageUrl, getFallbackRoomImages, getPlaceholderImageUrl } from '../lib/imageUtils';
import { useAuth } from '../contexts/AuthContext';
import ClientOnly from '../components/ClientOnly';

export default function HomePage() {
  return (
    <ClientOnly fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    }>
      <HomePageContent />
    </ClientOnly>
  );
}

function HomePageContent() {
  const { user } = useAuth();
  const [hotel, setHotel] = useState(null);
  const [roomTypes, setRoomTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [guests, setGuests] = useState(1);
  const [bedType, setBedType] = useState(''); // เพิ่ม state สำหรับประเภทเตียง
  const [contactSettings, setContactSettings] = useState({});
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    fetchData();
    fetchContactSettings();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [hotelResponse, roomTypesResponse] = await Promise.all([
        hotelAPI.getHotels(),
        hotelAPI.getRoomTypes()
      ]);
      
      if (hotelResponse.data && hotelResponse.data.length > 0) {
        setHotel(hotelResponse.data[0]);
      }
      
      if (roomTypesResponse.data) {
        setRoomTypes(roomTypesResponse.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchContactSettings = async () => {
    try {
      const response = await fetch('http://localhost:5680/api/admin/contact-settings');
      const data = await response.json();
      if (data.success) {
        setContactSettings(data.data);
      }
    } catch (error) {
      console.error('Error fetching contact settings:', error);
    }
  };

  const handleSearch = async () => {
    if (!checkInDate || !checkOutDate) {
      alert('กรุณาเลือกวันที่เข้าพักและออก');
      return;
    }
    
    // ตรวจสอบว่าวันที่เข้าพักไม่เกินวันที่ออก
    if (new Date(checkInDate) >= new Date(checkOutDate)) {
      alert('วันที่ออกต้องหลังจากวันที่เข้าพัก');
      return;
    }
    
    setIsSearching(true);
    setShowSearchResults(false);
    
    try {
      const searchParams = {
        checkin: checkInDate,
        checkout: checkOutDate,
        guests: guests.toString(),
        bedType: bedType || undefined // เพิ่มประเภทเตียงในการค้นหา
      };
      
      console.log('🔍 Searching for available rooms with params:', searchParams);
      const response = await hotelAPI.searchRooms(searchParams);
      
      console.log('📊 API Response:', response);
      console.log('📊 API Response.data:', response.data);
      console.log('📊 API Response.data.data:', response.data?.data);
      
      if (response.success && response.data) {
        console.log('✅ Search successful, setting results:', response.data);
        // response.data คือ API response ที่มี structure { success, data, count }
        setSearchResults(response.data);
        setShowSearchResults(true);
        
        // Scroll to search results
        setTimeout(() => {
          const resultsSection = document.getElementById('search-results');
          if (resultsSection) {
            resultsSection.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      } else {
        console.error('❌ Search failed:', response.error);
        alert('ไม่สามารถค้นหาห้องพักได้ กรุณาลองใหม่อีกครั้ง');
      }
    } catch (error) {
      console.error('❌ Error during search:', error);
      alert('เกิดข้อผิดพลาดในการค้นหา กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSearching(false);
    }
  };

  const resetSearch = () => {
    setShowSearchResults(false);
    setSearchResults(null);
    setCheckInDate('');
    setCheckOutDate('');
    setGuests(1);
    setBedType(''); // รีเซ็ตประเภทเตียงด้วย
  };

  // ฟังก์ชันสำหรับการจองห้อง - ตรวจสอบห้องว่างอีกครั้งก่อนไปหน้าจอง
  const handleBookingClick = async (room) => {
    try {
      console.log('🔍 Re-checking room availability before booking:', room.room_type_id);
      
      // เรียก API ตรวจสอบห้องว่างเฉพาะประเภทห้องนี้
      const availabilityResponse = await hotelAPI.checkRoomTypeAvailability(
        room.room_type_id,
        checkInDate,
        checkOutDate
      );
      
      if (availabilityResponse.success && availabilityResponse.data) {
        const availability = availabilityResponse.data;
        
        if (availability.available && availability.available_count > 0) {
          // ห้องยังว่างอยู่ ไปหน้าจอง
          const bookingUrl = `/booking/new?roomType=${room.room_type_id}&checkin=${checkInDate}&checkout=${checkOutDate}&guests=${guests}&bedType=${room.bed_type}&availableCount=${availability.available_count}&roomTypeName=${encodeURIComponent(room.room_type_name)}&price=${room.price_per_night}`;
          
          console.log('✅ Room available, redirecting to booking:', bookingUrl);
          window.location.href = bookingUrl;
        } else {
          // ห้องไม่ว่างแล้ว
          alert(`ขออภัย ห้อง "${room.room_type_name}" ไม่ว่างแล้วในช่วงวันที่ที่เลือก กرุณาเลือกห้องอื่นหรือเปลี่ยนวันที่`);
          
          // รีเฟรชผลการค้นหาเพื่อแสดงสถานะล่าสุด
          console.log('🔄 Refreshing search results...');
          handleSearch();
        }
      } else {
        throw new Error(availabilityResponse.error || 'ไม่สามารถตรวจสอบห้องว่างได้');
      }
    } catch (error) {
      console.error('❌ Error checking room availability:', error);
      alert('เกิดข้อผิดพลาดในการตรวจสอบห้องว่าง กรุณาลองใหม่อีกครั้ง');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section - แบบ Gregori Hotel */}
      <section className="relative h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-900">
        {/* Background Image Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-80"
          style={{
            backgroundImage: `url('/images/rooms/493674840_1159118906242394_3883760380452361632_n.jpg')`
          }}
        />
        
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40" />
        
        {/* Navigation */}
        <nav className="relative z-10 flex items-center justify-between px-6 lg:px-8 py-6">
          <div className="text-white text-2xl font-bold tracking-widest">
            วรุณภัฏ
          </div>
          
          <div className="hidden lg:flex items-center space-x-8 text-white">
            <Link href="/rooms" className="hover:text-amber-400 transition-colors duration-300">ห้องพัก</Link>
            <Link href="/about" className="hover:text-amber-400 transition-colors duration-300">เกี่ยวกับเรา</Link>
            <Link href="/blog" className="hover:text-amber-400 transition-colors duration-300">บล็อก</Link>
            {user ? (
              <Link href="/dashboard" className="bg-amber-600 px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors duration-300">
                แดชบอร์ด
              </Link>
            ) : (
              <Link href="/login" className="bg-amber-600 px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors duration-300">
                เข้าสู่ระบบ
              </Link>
            )}
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center text-white px-6">
          <h1 className="text-6xl lg:text-8xl font-light mb-8 leading-tight">
            ยินดีต้อนรับสู่<br />
            <span className="font-bold">โรงแรมวรุณภัฏ</span>
          </h1>
          
          <p className="text-xl lg:text-2xl mb-12 max-w-2xl font-light">
            ประสบการณ์การพักผ่อนที่หรูหราในบรรยากาศที่อบอุ่น
          </p>

          {/* Booking Form */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-4xl w-full">
            {showSearchResults && (
              <div className="text-center mb-6">
                <p className="text-white/80 text-lg mb-4">
                  แสดงผลการค้นหาด้านล่าง - ค้นหาใหม่ได้ที่นี่
                </p>
                <button
                  onClick={resetSearch}
                  className="bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-300 mr-4"
                >
                  ล้างการค้นหา
                </button>
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">วันที่เข้าพัก</label>
                <input
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/20 backdrop-blur border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">วันที่ออก</label>
                <input
                  type="date"
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/20 backdrop-blur border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">จำนวนผู้เข้าพัก</label>
                <select
                  value={guests}
                  onChange={(e) => setGuests(parseInt(e.target.value))}
                  className="w-full px-4 py-3 rounded-lg bg-white/20 backdrop-blur border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  {[1,2,3,4,5,6].map(num => (
                    <option key={num} value={num} className="text-gray-800">{num} คน</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">ประเภทเตียง</label>
                <select
                  value={bedType}
                  onChange={(e) => setBedType(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/20 backdrop-blur border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="" className="text-gray-800">ทุกประเภท</option>
                  <option value="single" className="text-gray-800">เตียงเดี่ยว</option>
                  <option value="double" className="text-gray-800">เตียงคู่</option>
                  <option value="twin" className="text-gray-800">เตียงแฝด</option>
                  <option value="king" className="text-gray-800">เตียงคิงไซส์</option>
                  <option value="queen" className="text-gray-800">เตียงควีนไซส์</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">&nbsp;</label>
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors duration-300 flex items-center justify-center"
                >
                  {isSearching ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      กำลังค้นหา...
                    </>
                  ) : (
                    'ตรวจสอบห้องว่าง'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white animate-bounce">
          <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Search Results Section */}
      {showSearchResults && searchResults && (
        <section id="search-results" className="py-20 bg-gray-50">
          {console.log('🎯 Rendering search results:', searchResults)}
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-4xl lg:text-5xl font-light text-emerald-900 mb-4">
                ผลการค้นหา
              </h2>
              <p className="text-xl text-gray-600">
                พบห้องพักว่าง {searchResults?.data?.length || searchResults?.length || 0} ประเภท
                สำหรับวันที่ {new Date(checkInDate).toLocaleDateString('th-TH')} - {new Date(checkOutDate).toLocaleDateString('th-TH')}
                {bedType && (
                  <span className="text-emerald-600 font-medium">
                    {' '}• ประเภทเตียง: {bedType === 'single' ? 'เตียงเดี่ยว' : 
                                      bedType === 'double' ? 'เตียงคู่' : 
                                      bedType === 'twin' ? 'เตียงแฝด' : 
                                      bedType === 'king' ? 'เตียงคิงไซส์' : 
                                      bedType === 'queen' ? 'เตียงควีนไซส์' : bedType}
                  </span>
                )}
              </p>
            </div>

            {searchResults && searchResults.data && searchResults.data.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {searchResults.data.map((room) => (
                  <div key={room.room_type_id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                    <div className="relative overflow-hidden aspect-[4/3]">
                      <img
                        src={getRoomImageUrl(room.images?.[0]) || getPlaceholderImageUrl()}
                        alt={room.room_type_name}
                        className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                      />
                      <div className="absolute top-4 right-4 bg-emerald-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                        {room.available_count} ห้องว่าง
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-2xl font-light text-emerald-900 mb-2">
                            {room.room_type_name}
                          </h3>
                          <p className="text-gray-600 text-sm mb-3">
                            {room.description}
                          </p>
                          <div className="flex items-center text-gray-600 text-sm mb-4">
                            <Users className="h-4 w-4 mr-2" />
                            <span>สูงสุด {room.max_guests} ผู้เข้าพัก</span>
                            {room.bed_type && (
                              <>
                                <span className="mx-2">•</span>
                                <span>{room.bed_type}</span>
                              </>
                            )}
                            {room.size_sqm && (
                              <>
                                <span className="mx-2">•</span>
                                <span>{room.size_sqm} ตร.ม.</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-emerald-800">
                            ฿{room.price_per_night?.toLocaleString()}
                          </div>
                          <div className="text-gray-500 text-sm">ต่อคืน</div>
                        </div>
                      </div>

                      {/* Amenities */}
                      {room.amenities && room.amenities.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">สิ่งอำนวยความสะดวก:</p>
                          <div className="flex flex-wrap gap-2">
                            {room.amenities.slice(0, 4).map((amenity, index) => (
                              <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                {amenity}
                              </span>
                            ))}
                            {room.amenities.length > 4 && (
                              <span className="text-gray-500 text-xs">+{room.amenities.length - 4} เพิ่มเติม</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Available Rooms Info */}
                      {room.room_numbers && room.room_numbers.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">ห้องที่ว่าง:</p>
                          <p className="text-sm text-gray-600">
                            {room.room_numbers.slice(0, 5).join(', ')}
                            {room.room_numbers.length > 5 && ` และอีก ${room.room_numbers.length - 5} ห้อง`}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-3 mt-6">
                        <Link 
                          href={`/rooms/${room.room_type_id}`}
                          className="flex-1 bg-emerald-800 hover:bg-emerald-900 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-300 text-center"
                        >
                          ดูรายละเอียด
                        </Link>
                        <button
                          onClick={() => handleBookingClick(room)}
                          className="flex-1 bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-300"
                        >
                          จองเลย
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-light text-gray-700 mb-4">
                  ไม่พบห้องพักว่าง
                </h3>
                <p className="text-gray-600 mb-8">
                  ขออภัย ไม่มีห้องพักว่างในช่วงวันที่ที่คุณเลือก
                </p>
                <button
                  onClick={() => setShowSearchResults(false)}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-300"
                >
                  ลองค้นหาใหม่
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Luxury Section */}
      <section className="py-20 bg-gradient-to-r from-amber-50 to-emerald-50">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-5xl lg:text-6xl font-light text-emerald-900 mb-8">
            ความหรูหรารอคุณอยู่<br />
            <span className="font-bold">จองที่พักวันนี้!</span>
          </h2>
          <p className="text-xl text-emerald-700 mb-12 max-w-2xl mx-auto">
            สัมผัสประสบการณ์การพักผ่อนที่ไม่เหมือนใครในโรงแรมของเรา
          </p>
          <Link 
            href="/rooms"
            className="inline-flex items-center bg-emerald-800 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-emerald-900 transition-colors duration-300"
          >
            จองเลย
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Room Types Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-light text-emerald-900 mb-4">
              ห้องพักของเรา
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              เลือกห้องพักที่เหมาะสมกับความต้องการของคุณ
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {roomTypes.slice(0, 4).map((roomType, index) => (
              <div key={roomType.id} className="group cursor-pointer">
                <div className="relative overflow-hidden rounded-2xl aspect-[4/3] mb-6">
                  <img
                    src={getRoomImageUrl(roomType.image_url) || getPlaceholderImageUrl()}
                    alt={roomType.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-light text-emerald-900 mb-2">
                      {roomType.name}
                    </h3>
                    <div className="flex items-center text-gray-600 text-sm mb-4">
                      <Users className="h-4 w-4 mr-2" />
                      <span>{roomType.max_occupancy} ผู้เข้าพัก</span>
                      <span className="mx-2">•</span>
                      <span>{roomType.bed_type || 'เตียงคิงไซส์'}</span>
                      <span className="mx-2">•</span>
                      <span>{roomType.room_size || '32'} ตร.ม.</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-emerald-800">
                      ฿{roomType.price_per_night?.toLocaleString()}
                    </div>
                    <div className="text-gray-500 text-sm">ต่อคืน</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link 
              href="/rooms"
              className="inline-flex items-center text-emerald-800 hover:text-emerald-900 font-medium text-lg"
            >
              ดูห้องพักทั้งหมด
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-gradient-to-r from-gray-50 to-emerald-50">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Hotel Lounge"
                className="rounded-2xl w-full h-[600px] object-cover"
              />
            </div>
            
            <div>
              <div className="text-emerald-600 text-sm font-medium tracking-widest mb-4">
                — ติดต่อเรา
              </div>
              <h2 className="text-4xl lg:text-5xl font-light text-emerald-900 mb-8">
                ข้อมูลติดต่อ<br />
                <span className="font-bold">โรงแรมวรุณภัฏ</span>
              </h2>
              
              <div className="space-y-6 mb-12">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mr-4">
                    <Phone className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-emerald-600">โทรศัพท์</p>
                    <p className="text-lg text-gray-800">{contactSettings.phone || '0912345678'}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mr-4">
                    <Mail className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-emerald-600">อีเมล</p>
                    <p className="text-lg text-gray-800">{contactSettings.email || 'support@hotel.com'}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mr-4">
                    <MapPin className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-emerald-600">ที่อยู่</p>
                    <p className="text-lg text-gray-800">{contactSettings.address || 'มหาวิทยาลัยราชภัฏมหาสารคาม'}</p>
                  </div>
                </div>

                {contactSettings.facebook && (
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mr-4">
                      <span className="text-2xl">📘</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-emerald-600">Facebook</p>
                      <a href={contactSettings.facebook} target="_blank" rel="noopener noreferrer" className="text-lg text-emerald-800 hover:text-emerald-900 underline">
                        {contactSettings.facebook}
                      </a>
                    </div>
                  </div>
                )}

                {contactSettings.line && (
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mr-4">
                      <span className="text-2xl">💬</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-emerald-600">LINE</p>
                      <p className="text-lg text-gray-800">{contactSettings.line}</p>
                    </div>
                  </div>
                )}

                {contactSettings.website && (
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mr-4">
                      <span className="text-2xl">🌐</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-emerald-600">เว็บไซต์</p>
                      <a href={contactSettings.website} target="_blank" rel="noopener noreferrer" className="text-lg text-emerald-800 hover:text-emerald-900 underline">
                        {contactSettings.website}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Subscription */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center justify-between">
            <div className="lg:w-1/2 mb-8 lg:mb-0">
              <h2 className="text-3xl lg:text-4xl font-light text-emerald-900 mb-4">
                <span className="font-bold">ข่าวสารพิเศษ</span> ส่งตรงถึงคุณ
              </h2>
              <p className="text-gray-600 text-lg">
                รับข้อมูลโปรโมชั่นและข่าวสารใหม่ล่าสุดจากโรงแรมของเรา
              </p>
            </div>
            
            <div className="lg:w-1/2 lg:pl-12">
              <div className="flex">
                <input
                  type="email"
                  placeholder="อีเมลของคุณ"
                  className="flex-1 px-6 py-4 rounded-l-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-lg"
                />
                <button className="bg-emerald-800 hover:bg-emerald-900 text-white px-8 py-4 rounded-r-lg font-medium transition-colors duration-300">
                  สมัครสมาชิก
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}