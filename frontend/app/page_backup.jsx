'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Users, Wifi, Car, Coffee, Tv, Wind, Phone, Mail, Star, ArrowRight, CheckCircle } from 'lucide-react';
import { hotelAPI } from '../lib/api';
import { getRoomImageUrl, getFallbackRoomImages, getPlaceholderImageUrl } from '../lib/imageUtils';
import { useAuth } from '../contexts/AuthContext';
import ClientOnly from '../components/ClientOnly';
import TopNavigation from '../components/TopNavigation';

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

  useEffect(() => {
    fetchData();
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
      {/* Top Navigation */}
      <TopNavigation />
      
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
          <h1 className="text-5xl lg:text-7xl font-light mb-8 leading-tight italic">
            ยินดีต้อนรับสู่<br />
            <span className="font-normal">โรงแรมวรุณภัฏ</span>
          </h1>

          {/* Booking Form - Gregori Style */}
          <div className="absolute bottom-8 left-8 right-8 lg:bottom-16 lg:left-16 lg:right-auto lg:w-auto">
            <div className="bg-black/40 backdrop-blur-md p-6 lg:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 text-white">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">CHECK IN</label>
                  <input
                    type="date"
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="w-full px-4 py-3 bg-transparent border-b border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-amber-400 transition-colors"
                    placeholder="Select"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">CHECK OUT</label>
                  <input
                    type="date"
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    className="w-full px-4 py-3 bg-transparent border-b border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-amber-400 transition-colors"
                    placeholder="Select"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">GUESTS</label>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(parseInt(e.target.value))}
                    className="w-full px-4 py-3 bg-transparent border-b border-white/30 text-white focus:outline-none focus:border-amber-400 transition-colors"
                  >
                    <option value="" className="text-gray-800">Select</option>
                    {[1,2,3,4,5,6].map(num => (
                      <option key={num} value={num} className="text-gray-800">{num} คน</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleSearch}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white px-8 py-4 font-medium tracking-wide transition-colors duration-300"
                  >
                    Check Availability
                  </button>
                </div>
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
      <section 
        className="relative py-32 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80')`
        }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10 container mx-auto px-6 text-center">
          <h2 className="text-5xl lg:text-7xl font-light text-white mb-8 italic">
            ความหรูหรารอคุณอยู่<br />
            <span className="font-normal">จองที่พักวันนี้!</span>
          </h2>
          <Link 
            href="/rooms"
            className="inline-flex items-center bg-transparent border-2 border-white text-white px-12 py-4 text-lg font-medium hover:bg-white hover:text-black transition-all duration-300"
          >
            จองเลย
          </Link>
        </div>
      </section>

      {/* Room Types Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">

          {roomTypes.slice(0, 3).map((roomType, index) => (
            <div key={roomType.id} className={`relative min-h-screen ${index % 2 === 0 ? 'bg-emerald-900' : 'bg-gray-900'}`}>
              <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
                {/* Image */}
                <div className={`relative ${index % 2 === 0 ? 'order-1' : 'order-2'}`}>
                  <img
                    src={getRoomImageUrl(roomType.image_url) || getPlaceholderImageUrl()}
                    alt={roomType.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Content */}
                <div className={`flex items-center justify-center p-16 text-white ${index % 2 === 0 ? 'order-2' : 'order-1'}`}>
                  <div className="max-w-md">
                    <h2 className="text-4xl lg:text-5xl font-light italic mb-8">
                      {roomType.name}
                    </h2>
                    <div className="flex items-center text-gray-300 text-sm mb-8 space-x-4">
                      <span>{roomType.max_occupancy} ผู้เข้าพัก</span>
                      <span>{roomType.bed_type || '1 King Size Bed'}</span>
                      <span>{roomType.room_size || '32'}m²</span>
                    </div>
                    <p className="text-gray-200 mb-8 leading-relaxed">
                      {roomType.description || 'ห้องพักหรูหราที่ออกแบบด้วยความใส่ใจในทุกรายละเอียด พร้อมสิ่งอำนวยความสะดวกครบครันเพื่อการพักผ่อนที่สมบูรณ์แบบ'}
                    </p>
                    <div className="text-3xl font-light mb-8">
                      ฿{roomType.price_per_night?.toLocaleString()} <span className="text-lg text-gray-400">ต่อคืน</span>
                    </div>
                    <Link 
                      href={`/rooms/${roomType.id}`}
                      className="inline-block bg-transparent border-2 border-white text-white px-8 py-3 hover:bg-white hover:text-black transition-all duration-300"
                    >
                      ดูรายละเอียด
                    </Link>
                  </div>
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
                — เกี่ยวกับเรา
              </div>
              <h2 className="text-4xl lg:text-5xl font-light text-emerald-900 mb-8">
                พักผ่อนอย่างมีสไตล์<br />
                <span className="font-bold">กับโรงแรมวรุณภัฏ</span>
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                ตั้งอยู่ในใจกลางเมืองมหาสารคาม โรงแรมวรุณภัฏเป็นมากกว่าที่พัก 
                เราคือจุดหมายปลายทางที่ผสมผสานความทันสมัยเข้ากับเสน่ห์ดั้งเดิม
              </p>
              <p className="text-lg text-gray-600 mb-12 leading-relaxed">
                ด้วยการออกแบบที่เป็นเอกลักษณ์และบริการที่เป็นมิตร 
                เรามุ่งมั่นที่จะทำให้การเข้าพักของคุณเป็นประสบการณ์ที่ยากลืม
              </p>
              <button className="bg-emerald-800 hover:bg-emerald-900 text-white px-8 py-4 rounded-lg font-medium transition-colors duration-300">
                เรียนรู้เพิ่มเติม
              </button>
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