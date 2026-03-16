'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, MapPin, Users, Wifi, Car, Coffee, Tv, Wind, Phone, Mail, Star, ArrowRight, CheckCircle, Settings, BarChart3, Home, MessageSquare } from 'lucide-react';
import { hotelAPI } from '../../lib/api';
import { getRoomImageUrl, getFallbackRoomImages, getPlaceholderImageUrl, getRoomPlaceholder } from '../../lib/roomImageUtils';
import { getRoomsData, getFeaturedRooms } from '../../lib/roomsData';
import { useAuth } from '../../contexts/AuthContext';
import ClientOnly from '@/components/ui/ClientOnly';
import { FadeInUp, FadeInLeft, FadeInRight, ScaleIn, StaggerContainer } from '@/components/ui/AnimatedComponents';

export default function AdminPage() {
  return (
    <ClientOnly fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    }>
      <AdminPageContent />
    </ClientOnly>
  );
}

function AdminPageContent() {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();
  const [hotel, setHotel] = useState(null);
  const [roomTypes, setRoomTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [guests, setGuests] = useState(1);

  // Function to get role display name in Thai
  const getRoleDisplayName = (role) => {
    const roleNames = {
      'admin': 'ผู้ดูแลระบบ',
      'manager': 'ผู้บริหาร',
      'staff': 'พนักงาน',
      'guest': 'ผู้เข้าพัก'
    };
    return roleNames[role] || role;
  };

  // Check authentication and role
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.replace('/login?redirect=/admin');
        return;
      }

      if (!user || !['admin', 'staff', 'manager'].includes(user.role)) {
        router.replace('/');
        return;
      }
    }
  }, [loading, isAuthenticated, user, router]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchData();
    }
  }, [isAuthenticated, user]);

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
    
    window.location.href = `/rooms?${searchParams.toString()}`;
  };

  // Show loading while checking authentication
  if (loading || isLoading) {
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
      {/* Admin Header Bar */}
      <div className="bg-gradient-to-r from-emerald-600 to-green-600 text-white py-3 px-4 shadow-lg relative z-50">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Settings className="w-5 h-5" />
            <span className="font-semibold">โหมดแอดมิน - {user?.first_name} {user?.last_name}</span>
            <span className="ml-2 text-xs bg-white/20 px-2 py-1 rounded">({getRoleDisplayName(user?.role)})</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              href="/admin/dashboard" 
              className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm">แดชบอร์ด</span>
            </Link>
            <Link 
              href="/" 
              className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-colors"
            >
              <Home className="w-4 h-4" />
              <span className="text-sm">หน้าผู้ใช้</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Admin Quick Access Menu */}
      <section className="py-8 bg-gray-50">
        <div className="container mx-auto px-6">
          <FadeInUp delay={200}>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">เมนูจัดการระบบ</h2>
          </FadeInUp>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <FadeInUp delay={300}>
              <Link href="/admin/dashboard" className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-200 group">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">แดชบอร์ด</h3>
                <p className="text-gray-600 text-sm">ดูสถิติและข้อมูลรวม</p>
              </Link>
            </FadeInUp>

            <FadeInUp delay={400}>
              <Link href="/admin/rooms" className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-200 group">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <Home className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">จัดการห้องพัก</h3>
                <p className="text-gray-600 text-sm">ควบคุมสถานะห้องแต่ละห้อง</p>
              </Link>
            </FadeInUp>

            <FadeInUp delay={500}>
              <Link href="/admin/bookings" className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-200 group">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <Calendar className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">จัดการการจอง</h3>
                <p className="text-gray-600 text-sm">ดูและจัดการการจองทั้งหมด</p>
              </Link>
            </FadeInUp>

            <FadeInUp delay={600}>
              <Link href="/admin/users" className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-200 group">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                    <Users className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">จัดการผู้ใช้</h3>
                <p className="text-gray-600 text-sm">จัดการบัญชีผู้ใช้งาน</p>
              </Link>
            </FadeInUp>

            <FadeInUp delay={700}>
              <Link href="/admin/reviews" className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-200 group">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
                    <MessageSquare className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">จัดการรีวิว</h3>
                <p className="text-gray-600 text-sm">ดูและจัดการรีวิวจากลูกค้า</p>
              </Link>
            </FadeInUp>
          </div>
        </div>
      </section>

      {/* Hero Section - แบบ Gregori Hotel */}
      <section className="relative h-screen">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/hotel-building.jpg')`
          }}
        />
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/50"></div>
        
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

          <div className="text-center mt-12">
            <Link 
              href="/rooms"
              className="inline-flex items-center text-slate-700 hover:text-slate-800 font-medium text-lg font-thai"
            >
              ดูห้องพักทั้งหมด
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
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
                — เกี่ยวกับเรา
              </div>
              <h2 className="text-4xl lg:text-5xl font-light text-slate-800 mb-8 font-thai-header">
                พักผ่อนอย่างมีสไตล์<br />
                <span className="font-bold text-amber-600">กับโรงแรมวรุณภัฏ</span>
              </h2>
              <p className="text-lg text-slate-700 mb-8 leading-relaxed font-thai">
                ตั้งอยู่ในใจกลางเมืองมหาสารคาม โรงแรมวรุณภัฏเป็นมากกว่าที่พัก 
                เราคือจุดหมายปลายทางที่ผสมผสานความทันสมัยเข้ากับเสน่ห์ดั้งเดิม
              </p>
              <p className="text-lg text-slate-700 mb-12 leading-relaxed font-thai">
                ด้วยการออกแบบที่เป็นเอกลักษณ์และบริการที่เป็นมิตร 
                เรามุ่งมั่นที่จะทำให้การเข้าพักของคุณเป็นประสบการณ์ที่ยากลืม
              </p>
              <button 
                className="text-amber-100 px-8 py-4 rounded-lg font-medium transition-colors duration-300 font-thai"
                style={{ backgroundColor: '#082220' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#0a2b28'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#082220'}
              >
                เรียนรู้เพิ่มเติม
              </button>
            </FadeInRight>
          </div>
        </div>
      </section>

      {/* Newsletter Subscription */}
      <section className="py-16" style={{ backgroundColor: '#f8fafc' }}>
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center justify-between">
            <FadeInLeft delay={200}>
              <div className="lg:w-1/2 mb-8 lg:mb-0">
                <h2 className="text-3xl lg:text-4xl font-light text-slate-800 mb-4 font-thai-header">
                  <span className="font-bold text-amber-600">ข่าวสารพิเศษ</span> ส่งตรงถึงคุณ
                </h2>
                <p className="text-slate-600 text-lg font-thai">
                  รับข้อมูลโปรโมชั่นและข่าวสารใหม่ล่าสุดจากโรงแรมของเรา
                </p>
              </div>
            </FadeInLeft>
            
            <FadeInRight delay={400}>
              <div className="lg:w-1/2 lg:pl-12">
                <div className="flex">
                  <input
                    type="email"
                    placeholder="อีเมลของคุณ"
                    className="flex-1 px-6 py-4 rounded-l-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-lg font-thai"
                  />
                  <button 
                    className="text-amber-100 px-8 py-4 rounded-r-lg font-medium transition-colors duration-300 font-thai"
                    style={{ backgroundColor: '#082220' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#0a2b28'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#082220'}
                  >
                    สมัครสมาชิก
                  </button>
                </div>
              </div>
            </FadeInRight>
          </div>
        </div>
      </section>
    </div>
  );
}
