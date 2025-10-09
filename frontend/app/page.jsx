'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Users, Wifi, Car, Coffee, Tv, Wind, Phone, Mail, Star, ArrowRight, CheckCircle, Search, AlertCircle, XCircle, CheckCircle2 } from 'lucide-react';
import { hotelAPI } from '../lib/api';
import { getRoomImageUrl, getFallbackRoomImages, getPlaceholderImageUrl, getRoomPlaceholder } from '../lib/roomImageUtils';
import { getRoomsData, getFeaturedRooms } from '../lib/roomsData';
import { dateToString } from '../lib/dateUtils';
import { useAuth } from '../contexts/AuthContext';
import ClientOnly from '../components/ClientOnly';
import ModernDatePicker from '../components/ModernDatePicker';
import { FadeInUp, FadeInLeft, FadeInRight, ScaleIn, StaggerContainer } from '../components/AnimatedComponents';
import toast from 'react-hot-toast';

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
  const [checkInDate, setCheckInDate] = useState(null);
  const [checkOutDate, setCheckOutDate] = useState(null);
  const [guests, setGuests] = useState(1);
  const [bedType, setBedType] = useState('');
  const [contactSettings, setContactSettings] = useState({});

  useEffect(() => {
    fetchData();
    fetchContactSettings();
  }, []);

  // Force refresh เมื่อหน้าจอได้ focus (กลับมาจากหน้าอื่น)
  useEffect(() => {
    const handleFocus = () => {
      console.log('Page focused - refreshing data...');
      fetchData(true); // Force refresh
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Page visible - refreshing data...');
        fetchData(true); // Force refresh
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const fetchData = async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      
      // ลบ cache ถ้าต้องการ force refresh
      if (forceRefresh) {
        // Clear browser cache for API endpoints
        if ('caches' in window) {
          try {
            const cacheNames = await caches.keys();
            await Promise.all(
              cacheNames.map(cacheName => caches.delete(cacheName))
            );
            console.log('All caches cleared');
          } catch (error) {
            console.log('Cache clearing error:', error);
          }
        }
        
        // Clear localStorage cache
        try {
          Object.keys(localStorage).forEach(key => {
            if (key.includes('room') || key.includes('cache')) {
              localStorage.removeItem(key);
            }
          });
        } catch (error) {
          console.log('localStorage clear error:', error);
        }
      }
      
      // ดึงข้อมูลห้องพักล่าสุดจาก API (รวมรูปภาพที่แอดมินอัพเดต)
      const updatedRooms = await getFeaturedRooms(forceRefresh);
      console.log('🏠 Homepage received room data:', updatedRooms.map(r => ({
        id: r.id,
        name: r.name,
        bed_type: r.bed_type,
        room_type: r.room_type
      })));
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
      const localRooms = await getFeaturedRooms(forceRefresh);
      console.log('🏠 Homepage fallback room data:', localRooms.map(r => ({
        id: r.id,
        name: r.name,
        bed_type: r.bed_type,
        room_type: r.room_type
      })));
      setRoomTypes(localRooms);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!checkInDate || !checkOutDate) {
      toast.error('กรุณาเลือกวันที่เข้าพักและออก', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '12px',
          fontSize: '16px',
          fontWeight: '600',
          boxShadow: '0 10px 30px rgba(220, 38, 38, 0.3)',
          border: '2px solid rgba(255, 255, 255, 0.2)',
        },
        icon: '📅',
      });
      return;
    }
    
    // ตรวจสอบวันที่
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (checkInDate < today) {
      toast.error('วันที่เข้าพักต้องไม่เป็นวันที่ผ่านมาแล้ว', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '12px',
          fontSize: '16px',
          fontWeight: '600',
          boxShadow: '0 10px 30px rgba(220, 38, 38, 0.3)',
          border: '2px solid rgba(255, 255, 255, 0.2)',
        },
        icon: '⏰',
      });
      return;
    }
    
    if (checkOutDate <= checkInDate) {
      toast.error('วันที่ออกต้องมาหลังวันที่เข้าพัก', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '12px',
          fontSize: '16px',
          fontWeight: '600',
          boxShadow: '0 10px 30px rgba(220, 38, 38, 0.3)',
          border: '2px solid rgba(255, 255, 255, 0.2)',
        },
        icon: '📅',
      });
      return;
    }
    
    if (guests > 2) {
      toast.error('ขออภัย ห้องพักของเรารองรับผู้เข้าพักสูงสุด 2 คนเท่านั้น\nกรุณาเลือกจำนวนผู้เข้าพัก 1-2 คน', {
        duration: 5000,
        position: 'top-center',
        style: {
          background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '12px',
          fontSize: '16px',
          fontWeight: '600',
          boxShadow: '0 10px 30px rgba(220, 38, 38, 0.3)',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          whiteSpace: 'pre-line',
        },
        icon: '👥',
      });
      return;
    }
    
    // แปลงวันที่เป็น string format (แก้ไข timezone issue)
    const checkinStr = dateToString(checkInDate);
    const checkoutStr = dateToString(checkOutDate);
    
    console.log('📅 Date conversion check:', {
      checkInDate: checkInDate,
      checkinStr: checkinStr,
      checkOutDate: checkOutDate,
      checkoutStr: checkoutStr
    });
    
    const searchParams = new URLSearchParams({
      checkin: checkinStr,
      checkout: checkoutStr,
      guests: guests.toString()
    });

    // เพิ่ม bedType ถ้ามีการเลือก
    if (bedType) {
      searchParams.set('bedType', bedType);
    }
    
    // ค้นหาห้องว่างด้วย API ใหม่
    try {
      console.log('🔍 Searching rooms with params:', {
        checkin: checkinStr,
        checkout: checkoutStr,
        guests: guests,
        bedType: bedType || 'ทุกประเภท'
      });
      
      const response = await hotelAPI.searchRooms({
        checkin: checkinStr,
        checkout: checkoutStr,
        guests: guests,
        bedType: bedType || null
      });
      
      console.log('📥 Search response:', response);
      
      if (response.success) {
        if (response.data && response.data.length > 0) {
          console.log(`✅ Found ${response.data.length} available rooms`);
          console.log('🏨 Sample room:', response.data[0]);
          
          // แสดง success toast
          toast.success(`พบห้องพักที่เหมาะสม!\nกำลังนำคุณไปยังหน้าจอง...`, {
            duration: 2000,
            position: 'top-center',
            style: {
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              padding: '16px 24px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              boxShadow: '0 10px 30px rgba(16, 185, 129, 0.4)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              whiteSpace: 'pre-line',
            },
            icon: '🎉',
          });
          
          // เลือกห้องแรกที่พบและไปยังหน้ารายละเอียดห้อง
          const firstRoom = response.data[0];
          const roomId = firstRoom.room_type_id;
          
          console.log(`🏨 Redirecting to room details: /rooms/${roomId}`);
          
          // รอ toast แสดงเสร็จแล้วค่อย redirect
          setTimeout(() => {
            window.location.href = `/rooms/${roomId}?${searchParams.toString()}`;
          }, 1500);
        } else {
          console.log('❌ No rooms available');
          if (guests > 2) {
            toast.error('ขออภัย ห้องพักของเรารองรับผู้เข้าพักสูงสุด 2 คนเท่านั้น\nกรุณาเลือกจำนวนผู้เข้าพัก 1-2 คน', {
              duration: 5000,
              position: 'top-center',
              style: {
                background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                color: 'white',
                padding: '16px 24px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                boxShadow: '0 10px 30px rgba(220, 38, 38, 0.3)',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                whiteSpace: 'pre-line',
              },
              icon: '👥',
            });
          } else {
            toast.error(`ไม่มีห้องว่างในช่วงวันที่ที่เลือก\n(${checkinStr} ถึง ${checkoutStr}) สำหรับ ${guests} คน\nกรุณาเลือกวันที่อื่น`, {
              duration: 5000,
              position: 'top-center',
              style: {
                background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                color: 'white',
                padding: '16px 24px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                boxShadow: '0 10px 30px rgba(220, 38, 38, 0.3)',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                whiteSpace: 'pre-line',
              },
              icon: '🏨',
            });
          }
          return;
        }
      } else {
        console.log('❌ Search failed:', response.error);
        toast.error('เกิดข้อผิดพลาดในการค้นหาห้องพัก กรุณาลองใหม่อีกครั้ง', {
          duration: 4000,
          position: 'top-center',
          style: {
            background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
            color: 'white',
            padding: '16px 24px',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            boxShadow: '0 10px 30px rgba(220, 38, 38, 0.3)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
          },
          icon: '⚠️',
        });
        return;
      }
    } catch (error) {
      console.error('❌ Room search error:', error);
      if (error.message.includes('fetch')) {
        toast.error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้\n\nกรุณาตรวจสอบ:\n• Backend Server ทำงานที่ http://localhost:3001\n• การเชื่อมต่ออินเทอร์เน็ต\n• การตั้งค่า CORS', {
          duration: 6000,
          position: 'top-center',
          style: {
            background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
            color: 'white',
            padding: '20px 24px',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: '600',
            boxShadow: '0 10px 30px rgba(220, 38, 38, 0.3)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            whiteSpace: 'pre-line',
            maxWidth: '400px',
          },
          icon: '🔌',
        });
      } else {
        toast.error('เกิดข้อผิดพลาดในการค้นหาห้องพัก กรุณาลองใหม่อีกครั้ง', {
          duration: 4000,
          position: 'top-center',
          style: {
            background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
            color: 'white',
            padding: '16px 24px',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            boxShadow: '0 10px 30px rgba(220, 38, 38, 0.3)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
          },
          icon: '❌',
        });
      }
      // ไม่ redirect ถ้า error เพื่อให้ user ลองใหม่ได้
      return;
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
      {/* Refresh Button - Fixed position */}
      <div className="fixed top-20 right-4 z-50">
        <button
          onClick={() => fetchData(true)}
          disabled={isLoading}
          className="bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white px-4 py-2 rounded-full shadow-lg transition-all duration-300 flex items-center gap-2 text-sm font-medium"
          title="รีเฟรชข้อมูลห้องพัก"
        >
          <svg 
            className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {isLoading ? 'กำลังโหลด...' : 'รีเฟรช'}
        </button>
      </div>

      {/* Hero Section - แบบ Gregori Hotel */}
      <section className="relative h-screen">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/images/rooms/493674840_1159118906242394_3883760380452361632_n.jpg')`
          }}
        />
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/50 z-0"></div>
        


        {/* Hero Content with Booking Form */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center text-white px-6 pt-8">
          <FadeInUp delay={300}>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-light mb-8 leading-tight font-thai-header">
              ยินดีต้อนรับสู่<br />
              <span className="font-medium text-amber-300">โรงแรมวรุณภัฏ</span>
            </h1>
          </FadeInUp>
          
          {/* Booking Form - Moved up and integrated with hero content */}
          <div className="w-full max-w-7xl px-4 lg:px-8 mt-6">
          <FadeInUp delay={800}>
            <div className="backdrop-blur-lg rounded-3xl p-8 lg:p-12 border-2 border-white/20 relative z-30 shadow-2xl" style={{ background: 'linear-gradient(135deg, rgba(18, 43, 41, 0.95) 0%, rgba(15, 38, 35, 0.98) 50%, rgba(13, 31, 29, 0.95) 100%)' }}>
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 text-white" style={{ position: 'relative', zIndex: 100 }}>
                <div style={{ position: 'relative', zIndex: 101 }}>
                  <ModernDatePicker
                    selectedDate={checkInDate}
                    onDateSelect={(date) => setCheckInDate(date)}
                    minDate={new Date()}
                    maxDate={checkOutDate ? new Date(checkOutDate.getTime() - 24*60*60*1000) : null}
                    placeholder="วันเข้าพัก"
                    label="เช็คอิน"
                    language="th"
                    className="room-search-datepicker"
                  />
                </div>
                <div style={{ position: 'relative', zIndex: 101 }}>
                  <ModernDatePicker
                    selectedDate={checkOutDate}
                    onDateSelect={(date) => setCheckOutDate(date)}
                    minDate={checkInDate ? new Date(checkInDate.getTime() + 24*60*60*1000) : new Date(Date.now() + 24*60*60*1000)}
                    placeholder="วันออก"
                    label="เช็คเอาท์"
                    language="th"
                    className="room-search-datepicker"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-4 text-white uppercase tracking-wider font-thai">ผู้เข้าพัก</label>
                  <div className="relative">
                    <select
                      value={guests}
                      onChange={(e) => setGuests(parseInt(e.target.value))}
                      className="w-full px-8 py-5 border-2 border-emerald-400 rounded-xl text-emerald-900 bg-gradient-to-r from-white to-emerald-50 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-300 font-thai font-semibold appearance-none cursor-pointer shadow-lg text-lg"
                      style={{ 
                        position: 'relative',
                        zIndex: 101,
                        pointerEvents: 'auto',
                        minWidth: '140px'
                      }}
                    >
                      {[1,2].map(num => (
                        <option key={num} value={num} className="text-emerald-900 bg-white py-2">{num} คน</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                      <Users className="w-5 h-5 text-emerald-600" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-4 text-white uppercase tracking-wider font-thai">เตียง</label>
                  <div className="relative">
                    <select
                      value={bedType}
                      onChange={(e) => setBedType(e.target.value)}
                      className="w-full px-8 py-5 border-2 border-emerald-400 rounded-xl text-emerald-900 bg-gradient-to-r from-white to-emerald-50 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-300 font-thai font-semibold appearance-none cursor-pointer shadow-lg text-lg"
                      style={{ 
                        position: 'relative',
                        zIndex: 101,
                        pointerEvents: 'auto',
                        minWidth: '160px'
                      }}
                    >
                      <option value="" className="text-emerald-900 bg-white py-2">ทุกประเภท</option>
                      <option value="single" className="text-emerald-900 bg-white py-2">เตียงเดี่ยว</option>
                      <option value="double" className="text-emerald-900 bg-white py-2">เตียงคู่</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                      <span className="text-2xl">🛏️</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleSearch}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    className="w-full bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 hover:from-emerald-700 hover:via-emerald-800 hover:to-emerald-900 text-white px-8 py-5 rounded-xl font-bold text-lg tracking-wide transition-all duration-300 transform hover:scale-105 hover:shadow-2xl font-thai border-2 border-emerald-500 hover:border-emerald-400"
                    style={{ 
                      position: 'relative',
                      zIndex: 101,
                      pointerEvents: 'auto',
                      minWidth: '180px'
                    }}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Search className="w-5 h-5" />
                      <span className="whitespace-nowrap">ตรวจสอบห้องว่าง</span>
                    </div>
                  </button>
                </div>
            </div>
            </div>
          </FadeInUp>
          </div>
        </div>
      </section>

      {/* Luxury Section */}
      <section 
        className="relative py-32 bg-cover bg-center"
        style={{
          backgroundImage: `url('/images/rooms/493674840_1159118906242394_3883760380452361632_n.jpg')`
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
          {/* Data Update Indicator */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              ข้อมูลห้องพักล่าสุด (อัปเดต: {new Date().toLocaleTimeString('th-TH')})
            </div>
          </div>
          
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
                        <span>🛏️ {roomType.bed_type === 'single' ? 'เตียงเดี่ยว (Single)' : roomType.bed_type === 'double' ? 'เตียงคู่ (Double)' : roomType.bed_type || '1 King Size Bed'}</span>
                        <span className="bg-amber-500/20 px-2 py-1 rounded text-xs">
                          ID: {roomType.id}
                        </span>
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

      {/* About Section */}
      <section 
        className="py-20" 
        style={{ background: 'linear-gradient(90deg, #f8fafc, #fffbeb)' }}
      >
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <FadeInLeft delay={200}>
              <img
                src="/images/rooms/493674840_1159118906242394_3883760380452361632_n.jpg"
                alt="Hotel Building"
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