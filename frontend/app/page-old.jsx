'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Users, Wifi, Car, Coffee, Tv, Wind, Phone, Mail, Star, ArrowRight, CheckCircle } from 'lucide-react';
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
        setRoomTypes(roomTypesResponse.data.slice(0, 4)); // แสดงเฉพาะ 4 ห้องแรก
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
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
      {/* Hero Section */}
      <section className="relative h-screen bg-gradient-to-r from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="absolute inset-0 bg-black opacity-40"></div>
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1564501049412-61c2a3083791?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1932&q=80')`
          }}
        ></div>
        
        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
          <h1 className="text-5xl md:text-7xl font-light mb-6 leading-tight">
            ยินดีต้อนรับสู่<br />
            <span className="font-bold text-amber-400">โรงแรมวรุณภัฏ</span>
          </h1>
          <p className="text-xl md:text-2xl mb-12 font-light opacity-90">
            ประสบการณ์การพักผ่อนที่หรูหราและไม่เหมือนใคร
          </p>
          
          {/* Booking Form */}
          <div className="bg-white rounded-lg p-6 md:p-8 max-w-4xl mx-auto shadow-2xl">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-gray-700 text-sm font-medium mb-2">วันที่เช็คอิน</label>
                <input
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-700"
                />
              </div>
              <div className="flex-1">
                <label className="block text-gray-700 text-sm font-medium mb-2">วันที่เช็คเอาท์</label>
                <input
                  type="date"
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-700"
                />
              </div>
              <div className="flex-1">
                <label className="block text-gray-700 text-sm font-medium mb-2">จำนวนผู้เข้าพัก</label>
                <select
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-700"
                >
                  <option value={1}>1 ท่าน</option>
                  <option value={2}>2 ท่าน</option>
                  <option value={3}>3 ท่าน</option>
                  <option value={4}>4 ท่าน</option>
                </select>
              </div>
              <Link
                href="/rooms"
                className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200 whitespace-nowrap"
              >
                ตรวจสอบที่ว่าง
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-amber-600 font-medium tracking-wider uppercase text-sm">ปรัชญา</span>
              <h2 className="text-4xl md:text-5xl font-light text-gray-900 mt-4 mb-6">
                ความมุ่งมั่นสู่<br />
                <span className="font-bold">ความเป็นเลิศ</span>
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-8">
                เราให้ความสำคัญกับคุณภาพการบริการและความพึงพอใจของแขกทุกท่าน 
                ด้วยทีมงานมืออาชีพและสิ่งอำนวยความสะดวกครบครัน 
                เพื่อมอบประสบการณ์การพักผ่อนที่ไม่เหมือนใคร
              </p>
              <Link
                href="/about"
                className="inline-flex items-center text-amber-600 hover:text-amber-700 font-medium transition-colors"
              >
                เรียนรู้เพิ่มเติม
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1280&q=80"
                alt="Hotel Interior"
                className="rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Rooms Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-amber-600 font-medium tracking-wider uppercase text-sm">ห้องพัก</span>
            <h2 className="text-4xl md:text-5xl font-light text-gray-900 mt-4 mb-6">
              พักผ่อนอย่าง<br />
              <span className="font-bold">มีสไตล์</span>
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              เลือกห้องพักที่เหมาะสมกับความต้องการของคุณ ทุกห้องได้รับการออกแบบอย่างประณีต
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {roomTypes.map((room) => (
              <div key={room.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="relative h-64">
                  <img
                    src={getRoomImageUrl(room.images?.[0]) || getPlaceholderImageUrl()}
                    alt={room.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-amber-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    ฿{room.price?.toLocaleString()}/คืน
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{room.name}</h3>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      {room.max_occupancy} ท่าน
                    </div>
                    <div className="flex items-center">
                      <Bed className="h-4 w-4 mr-2" />
                      {room.bed_type || 'เตียงคู่'}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      {room.size || '25'} ตร.ม.
                    </div>
                  </div>
                  <Link
                    href={`/rooms/${room.id}`}
                    className="block w-full text-center bg-gray-900 hover:bg-gray-800 text-white py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    ดูรายละเอียด
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/rooms"
              className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200"
            >
              ดูห้องพักทั้งหมด
            </Link>
          </div>
        </div>
      </section>

      {/* Amenities Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-amber-600 font-medium tracking-wider uppercase text-sm">สิ่งอำนวยความสะดวก</span>
            <h2 className="text-4xl md:text-5xl font-light text-gray-900 mt-4 mb-6">
              บริการ &<br />
              <span className="font-bold">ความสะดวกสบาย</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1280&q=80"
                  alt="Restaurant"
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mt-6 mb-4">ห้องอาหาร</h3>
              <p className="text-gray-600">
                ลิ้มรสอาหารไทยและนานาชาติที่ปรุงโดยเชฟมืออาชีพ ในบรรยากาศหรูหราและอบอุ่น
              </p>
            </div>

            <div className="text-center">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1571902943202-507ec2618e8f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1280&q=80"
                  alt="Spa & Wellness"
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mt-6 mb-4">สปา & เวลเนส</h3>
              <p className="text-gray-600">
                ผ่อนคลายกับบริการนวดและสปาระดับ 5 ดาว เพื่อฟื้นฟูร่างกายและจิตใจ
              </p>
            </div>

            <div className="text-center">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1280&q=80"
                  alt="Activities"
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mt-6 mb-4">กิจกรรม & กีฬา</h3>
              <p className="text-gray-600">
                สนุกสนานกับกิจกรรมหลากหลาย ทั้งสระว่ายน้ำ ฟิตเนส และกิจกรรมกลางแจ้ง
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-light mb-6">
            ความหรูหราอยู่รอคุณ<br />
            <span className="font-bold text-amber-400">จองวันนี้!</span>
          </h2>
          <p className="text-xl opacity-90 mb-8">
            อย่าพลาดโอกาสสัมผัสประสบการณ์การพักผ่อนที่ไม่เหมือนใคร
          </p>
          <Link
            href="/rooms"
            className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-4 rounded-lg font-medium text-lg transition-colors duration-200"
          >
            จองเลย
          </Link>
        </div>
      </section>
    </div>
  );
}