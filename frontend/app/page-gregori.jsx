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
  const [contactSettings, setContactSettings] = useState({});

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
      const response = await fetch('http://localhost:3001/api/admin/contact-settings');
      const data = await response.json();
      if (data.success) {
        setContactSettings(data.data);
      }
    } catch (error) {
      console.error('Error fetching contact settings:', error);
    }
  };

  const handleSearch = () => {
    if (!checkInDate || !checkOutDate) {
      alert('กรุณาเลือกวันที่เข้าพักและออก');
      return;
    }
    
    const searchParams = new URLSearchParams({
      checkin: checkInDate,
      checkout: checkOutDate,
      guests: guests.toString()
    });
    
    window.location.href = `/rooms?${searchParams.toString()}`;
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
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80')`
          }}
        />
        
        {/* Navigation */}
        <nav className="relative z-10 flex items-center justify-between px-6 lg:px-8 py-6">
          <div className="text-white text-2xl font-bold tracking-widest">
            วรุณภัฏ
          </div>
          
          <div className="hidden lg:flex items-center space-x-8 text-white">
            <Link href="/rooms" className="hover:text-amber-400 transition-colors duration-300">ห้องพัก</Link>
            <Link href="/about" className="hover:text-amber-400 transition-colors duration-300">เกี่ยวกับเรา</Link>
            <Link href="/blog" className="hover:text-amber-400 transition-colors duration-300">บล็อก</Link>
            <Link href="/contact" className="hover:text-amber-400 transition-colors duration-300">ติดต่อเรา</Link>
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
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
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
                <label className="block text-sm font-medium mb-2">&nbsp;</label>
                <button
                  onClick={handleSearch}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-300"
                >
                  ตรวจสอบห้องว่าง
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

      {/* Philosophy Section - แบบ Gregori */}
      <section className="py-20 bg-emerald-900 text-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="text-amber-400 text-sm font-medium tracking-widest mb-4">
                — ปรัชญาของเรา
              </div>
              <h2 className="text-4xl lg:text-5xl font-light mb-8">
                ความมุ่งมั่นของเรา<br />
                <span className="font-bold">สู่ความเป็นเลิศ</span>
              </h2>
              <p className="text-lg text-emerald-100 mb-8 leading-relaxed">
                เราเชื่อว่าการเดินทางแต่ละครั้งควรเป็นประสบการณ์ที่ไม่ลืม 
                ด้วยการบริการที่เป็นเลิศและความใส่ใจในทุกรายละเอียด 
                เราสร้างความทรงจำอันมีค่าให้กับแขกทุกท่าน
              </p>
              <p className="text-lg text-emerald-100 mb-12 leading-relaxed">
                จากห้องพักที่ออกแบบอย่างพิถีพิถัน ไปจนถึงบริการที่อบอุ่น 
                ทุกสิ่งที่เราทำคือเพื่อความสุขและความพึงพอใจของคุณ
              </p>
              <button className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-4 rounded-lg font-medium transition-colors duration-300">
                เรียนรู้เพิ่มเติม
              </button>
            </div>
            
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Hotel Interior"
                className="rounded-2xl w-full h-[600px] object-cover"
              />
            </div>
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