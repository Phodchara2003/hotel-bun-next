'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Users, Wifi, Car, Coffee, Tv, Wind, Phone, Mail, Star, ArrowRight, CheckCircle, Search } from 'lucide-react';
import { hotelAPI } from '../lib/api';
import { getRoomImageUrl, getFallbackRoomImages, getPlaceholderImageUrl, getRoomPlaceholder } from '../lib/roomImageUtils';
import { getRoomsData, getFeaturedRooms } from '../lib/roomsData';
import { useAuth } from '../contexts/AuthContext';
import ClientOnly from '../components/ClientOnly';
import { FadeInUp, FadeInLeft, FadeInRight, ScaleIn, StaggerContainer } from '../components/AnimatedComponents';

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
  const [contactSettings, setContactSettings] = useState({});

  useEffect(() => {
    fetchData();
    fetchContactSettings();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // ดึงข้อมูลห้องพักล่าสุดจาก API (รวมรูปภาพที่แอดมินอัพเดต)
      const updatedRooms = await getFeaturedRooms();
      setRoomTypes(updatedRooms);
      
      // พยายามดึงข้อมูลโรงแรมจาก API
      try {
        const hotelResponse = await hotelAPI.getHotels();
        
        if (hotelResponse.data && hotelResponse.data.length > 0) {
          setHotel(hotelResponse.data[0]);
        }
      } catch (apiError) {
        console.log('Hotel API not available:', apiError.message);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      // Fallback ไปใช้ข้อมูลท้องถิ่น
      const localRooms = await getFeaturedRooms();
      setRoomTypes(localRooms);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!checkInDate || !checkOutDate) {
      alert('กรุณาเลือกวันที่เข้าพักและออก');
      return;
    }
    
    // ตรวจสอบวันที่
    const checkin = new Date(checkInDate);
    const checkout = new Date(checkOutDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (checkin < today) {
      alert('วันที่เข้าพักต้องไม่เป็นวันที่ผ่านมาแล้ว');
      return;
    }
    
    if (checkout <= checkin) {
      alert('วันที่ออกต้องมาหลังวันที่เข้าพัก');
      return;
    }
    
    const searchParams = new URLSearchParams({
      checkin: checkInDate,
      checkout: checkOutDate,
      guests: guests.toString()
    });
    
    // ลองค้นหาห้องว่างก่อนไปหน้าผลการค้นหา
    try {
      const response = await hotelAPI.searchRooms({
        checkin: checkInDate,
        checkout: checkOutDate,
        guests: guests
      });
      console.log('Available rooms:', response);
    } catch (error) {
      console.log('Room search API not available, redirecting to rooms page');
    }
    
    window.location.href = `/booking?${searchParams.toString()}`;
  };

  const fetchContactSettings = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/admin/contact-settings');
      const data = await response.json();
      if (data.success) {
        setContactSettings(data.data);
      }
    } catch (error) {
      console.error('Error fetching contact settings:', error);
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
    <div className="min-h-screen pt-16">
      {/* Hero Section - แบบ Gregori Hotel */}
      <section className="relative h-screen">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80')`
          }}
        />
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/30"></div>
        


        {/* Hero Content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center text-white px-6 pt-16">
          <FadeInUp delay={300}>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-light mb-16 leading-tight font-thai-header">
              ยินดีต้อนรับสู่<br />
              <span className="font-medium text-amber-300">โรงแรมวรุณภัฏ</span>
            </h1>
          </FadeInUp>
        </div>

        {/* Booking Form - Centered at Bottom */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-6xl px-4 lg:px-8">
          <FadeInUp delay={800}>
            <div className="backdrop-blur-md rounded-2xl p-6 lg:p-8 border border-amber-300/20" style={{ backgroundColor: 'rgba(8, 34, 32, 0.9)' }}>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 text-white">
              <div>
                <label className="block text-sm font-semibold mb-3 text-white uppercase tracking-wider font-thai">เช็คอิน</label>
                <input
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="w-full px-4 py-4 border border-amber-300/30 rounded-lg text-white placeholder-amber-200/70 focus:outline-none focus:border-amber-400 transition-all duration-300 font-thai"
                  style={{ backgroundColor: 'rgba(10, 43, 40, 0.5)' }}
                  onFocus={(e) => e.target.style.backgroundColor = 'rgba(10, 43, 40, 0.7)'}
                  onBlur={(e) => e.target.style.backgroundColor = 'rgba(10, 43, 40, 0.5)'}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-3 text-white uppercase tracking-wider font-thai">เช็คเอาท์</label>
                <input
                  type="date"
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  className="w-full px-4 py-4 border border-amber-300/30 rounded-lg text-white placeholder-amber-200/70 focus:outline-none focus:border-amber-400 transition-all duration-300 font-thai"
                  style={{ backgroundColor: 'rgba(10, 43, 40, 0.5)' }}
                  onFocus={(e) => e.target.style.backgroundColor = 'rgba(10, 43, 40, 0.7)'}
                  onBlur={(e) => e.target.style.backgroundColor = 'rgba(10, 43, 40, 0.5)'}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-3 text-white uppercase tracking-wider font-thai">จำนวนผู้เข้าพัก</label>
                <select
                  value={guests}
                  onChange={(e) => setGuests(parseInt(e.target.value))}
                  className="w-full px-4 py-4 border border-amber-300/30 rounded-lg text-white focus:outline-none focus:border-amber-400 transition-all duration-300 font-thai"
                  style={{ backgroundColor: 'rgba(10, 43, 40, 0.5)' }}
                  onFocus={(e) => e.target.style.backgroundColor = 'rgba(10, 43, 40, 0.7)'}
                  onBlur={(e) => e.target.style.backgroundColor = 'rgba(10, 43, 40, 0.5)'}
                >
                  <option value="" className="text-gray-800">เลือกจำนวนคน</option>
                  {[1,2,3,4,5,6].map(num => (
                    <option key={num} value={num} className="text-gray-800">{num} คน</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleSearch}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 px-8 py-4 rounded-lg font-semibold tracking-wide transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-thai"
                >
                  ตรวจสอบห้องว่าง
                </button>
              </div>
            </div>
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* Luxury Section */}
      <section 
        className="relative py-32 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80')`
        }}
      >
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(8, 34, 32, 0.7)' }}></div>
        <div className="relative z-10 container mx-auto px-6 text-center">
          <FadeInUp delay={200}>
            <h2 className="text-5xl lg:text-7xl font-light text-amber-100 mb-8 font-thai-header">
              ความหรูหรารอคุณอยู่<br />
              <span className="font-normal text-amber-300">จองที่พักวันนี้!</span>
            </h2>
          </FadeInUp>
          <FadeInUp delay={400}>
            <Link 
              href="/rooms"
              className="inline-flex items-center bg-transparent border-2 border-amber-400 text-amber-300 px-12 py-4 text-lg font-medium hover:bg-amber-400 hover:text-slate-900 transition-all duration-300 font-thai"
            >
              จองเลย
            </Link>
          </FadeInUp>
        </div>
      </section>

      {/* Room Types Section */}
      <section className="py-20 bg-slate-100">
        <div className="container mx-auto px-6">
          {roomTypes.slice(0, 3).map((roomType, index) => (
            <div 
              key={roomType.id} 
              className="relative min-h-screen"
              style={{ backgroundColor: index % 2 === 0 ? '#082220' : '#0a2b28' }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
                {/* Image */}
                <div className={`relative ${index % 2 === 0 ? 'order-1' : 'order-2'}`}>
                  <div className="relative w-full h-full">
                    <img
                      src={getRoomImageUrl(roomType.image_url) || getRoomPlaceholder(roomType.bed_type) || getPlaceholderImageUrl()}
                      alt={roomType.name}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      onError={(e) => {
                        // Fallback ตามประเภทห้อง
                        e.target.src = getRoomPlaceholder(roomType.bed_type);
                      }}
                    />
                    {/* Overlay สำหรับข้อมูลเพิ่มเติม */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-end p-8">
                      <div className="text-white">
                        <p className="text-sm font-thai">ดูรูปเพิ่มเติม</p>
                        <p className="text-xs text-amber-200 font-thai">
                          {roomType.images ? `${roomType.images.length} รูป` : '1 รูป'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Content */}
                <div className={`flex items-center justify-center p-16 text-white ${index % 2 === 0 ? 'order-2' : 'order-1'}`}>
                  <div className="max-w-md">
                    <FadeInUp delay={300}>
                      <h2 className="text-4xl lg:text-5xl font-light italic mb-8">
                        {roomType.name}
                      </h2>
                    </FadeInUp>
                    <FadeInUp delay={500}>
                      <div className="flex items-center text-amber-200 text-sm mb-8 space-x-4 font-thai">
                        <span>👥 {roomType.max_occupancy} ผู้เข้าพัก</span>
                        <span>🛏️ {roomType.bed_type || '1 King Size Bed'}</span>
                      </div>
                    </FadeInUp>
                    <FadeInUp delay={700}>
                      <p className="text-amber-100 mb-6 leading-relaxed font-thai">
                        {roomType.description || 'ห้องพักหรูหราที่ออกแบบด้วยความใส่ใจในทุกรายละเอียด พร้อมสิ่งอำนวยความสะดวกครบครันเพื่อการพักผ่อนที่สมบูรณ์แบบ'}
                      </p>
                    </FadeInUp>
                    
                    {/* แสดงสิ่งอำนวยความสะดวก */}
                    <FadeInUp delay={900}>
                      {roomType.amenities && roomType.amenities.length > 0 && (
                        <div className="mb-6">
                          <p className="text-amber-200 text-sm mb-2 font-thai">สิ่งอำนวยความสะดวก:</p>
                          <div className="flex flex-wrap gap-2">
                            {roomType.amenities.slice(0, 4).map((amenity, i) => (
                              <span key={i} className="bg-amber-500/20 text-amber-200 px-2 py-1 rounded text-xs font-thai">
                                {amenity}
                              </span>
                            ))}
                            {roomType.amenities.length > 4 && (
                              <span className="text-amber-300 text-xs font-thai">
                                +{roomType.amenities.length - 4} เพิ่มเติม
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </FadeInUp>
                    
                    <FadeInUp delay={1100}>
                      <div className="text-3xl font-light mb-8 text-amber-300 font-thai">
                        ฿{roomType.price_per_night?.toLocaleString()} <span className="text-lg text-amber-200">ต่อคืน</span>
                        {roomType.available && (
                          <div className="text-sm text-green-300 mt-1">✅ ห้องว่าง</div>
                        )}
                      </div>
                    </FadeInUp>
                    
                    <FadeInUp delay={1300}>
                      <Link 
                        href={`/rooms/${roomType.id}`}
                        className="inline-block bg-transparent border-2 border-amber-400 text-amber-300 px-8 py-3 hover:bg-amber-400 hover:text-slate-900 transition-all duration-300 font-thai"
                      >
                        ดูรายละเอียด
                      </Link>
                    </FadeInUp>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="text-center mt-12 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                href="/booking"
                className="inline-flex items-center bg-amber-500 hover:bg-amber-600 text-slate-900 px-8 py-3 rounded-lg font-medium text-lg transition-colors duration-300 font-thai"
              >
                จองห้องพักเลย
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              
              <Link 
                href="/rooms"
                className="inline-flex items-center text-slate-700 hover:text-slate-800 font-medium text-lg font-thai border border-slate-300 hover:border-slate-400 px-8 py-3 rounded-lg transition-colors duration-300"
              >
                ดูห้องพักทั้งหมด
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
            
            <p className="text-sm text-gray-600 font-thai">
              เลือกประเภทห้องพัก → ตรวจสอบห้องว่าง → จองทันที
            </p>
          </div>
        </div>
      </section>

      {/* Philosophy Section - แบบ Gregori */}
      <section className="py-20 text-white" style={{ backgroundColor: '#082220' }}>
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <FadeInLeft>
              <div className="text-amber-400 text-sm font-medium tracking-widest mb-4 font-thai">
                — ปรัชญาของเรา
              </div>
              <h2 className="text-4xl lg:text-5xl font-light mb-8 font-thai-header">
                ความมุ่งมั่นของเรา<br />
                <span className="font-bold text-amber-300">สู่ความเป็นเลิศ</span>
              </h2>
              <p className="text-lg text-amber-100 mb-8 leading-relaxed font-thai">
                เราเชื่อว่าการเดินทางแต่ละครั้งควรเป็นประสบการณ์ที่ไม่ลืม 
                ด้วยการบริการที่เป็นเลิศและความใส่ใจในทุกรายละเอียด 
                เราสร้างความทรงจำอันมีค่าให้กับแขกทุกท่าน
              </p>
              <p className="text-lg text-amber-100 mb-12 leading-relaxed font-thai">
                จากห้องพักที่ออกแบบอย่างพิถีพิถัน ไปจนถึงบริการที่อบอุ่น 
                ทุกสิ่งที่เราทำคือเพื่อความสุขและความพึงพอใจของคุณ
              </p>
              <button className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-8 py-4 rounded-lg font-medium transition-colors duration-300 font-thai">
                เรียนรู้เพิ่มเติม
              </button>
            </FadeInLeft>
            
            <FadeInRight delay={300}>
              <img
                src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Hotel Interior"
                className="rounded-2xl w-full h-[600px] object-cover"
              />
            </FadeInRight>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section 
        className="py-20" 
        style={{ background: 'linear-gradient(90deg, #f8fafc, #fffbeb)' }}
      >
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <FadeInLeft delay={200}>
              <img
                src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Hotel Lounge"
                className="rounded-2xl w-full h-[600px] object-cover"
              />
            </FadeInLeft>
            
            <FadeInRight delay={400}>
              <div className="text-slate-600 text-sm font-medium tracking-widest mb-4 font-thai">
                — ติดต่อเรา
              </div>
              <h2 className="text-4xl lg:text-5xl font-light text-slate-800 mb-8 font-thai-header">
                ข้อมูลติดต่อ <br />
                <span className="font-bold text-amber-600">โรงแรมวรุณภัฏ</span>
              </h2>
              
              <div className="space-y-6 mb-12">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mr-4">
                    <Phone className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-600 font-thai">โทรศัพท์</p>
                    <p className="text-lg text-slate-800 font-thai">{contactSettings.phone || '0912345678'}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mr-4">
                    <Mail className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-600 font-thai">อีเมล</p>
                    <p className="text-lg text-slate-800 font-thai">{contactSettings.email || 'support@hotel.com'}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mr-4">
                    <MapPin className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-600 font-thai">ที่อยู่</p>
                    <p className="text-lg text-slate-800 font-thai">{contactSettings.address || 'มหาวิทยาลัยราชภัฏมหาสารคาม'}</p>
                  </div>
                </div>

                {contactSettings.facebook && (
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mr-4">
                      <span className="text-2xl">📘</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-amber-600 font-thai">Facebook</p>
                      <a href={contactSettings.facebook} target="_blank" rel="noopener noreferrer" className="text-lg text-amber-700 hover:text-amber-800 underline font-thai">
                        {contactSettings.facebook}
                      </a>
                    </div>
                  </div>
                )}

                {contactSettings.line && (
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mr-4">
                      <span className="text-2xl">💬</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-amber-600 font-thai">LINE</p>
                      <p className="text-lg text-slate-800 font-thai">{contactSettings.line}</p>
                    </div>
                  </div>
                )}

                {contactSettings.website && (
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mr-4">
                      <span className="text-2xl">🌐</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-amber-600 font-thai">เว็บไซต์</p>
                      <a href={contactSettings.website} target="_blank" rel="noopener noreferrer" className="text-lg text-amber-700 hover:text-amber-800 underline font-thai">
                        {contactSettings.website}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </FadeInRight>
          </div>
        </div>
      </section>


    </div>
  );
}