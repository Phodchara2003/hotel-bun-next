'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Star, Users, Wifi, Car, Coffee, Tv, Wind } from 'lucide-react';
import { hotelAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

export default function HomePage() {
  const { user } = useAuth();
  const [hotel, setHotel] = useState(null);
  const [roomTypes, setRoomTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const fetchHotelAndRooms = async () => {
    try {
      setIsLoading(true);
      
      // Get global pricing first
      let uniformPrice = 1500; // Default fallback price
      try {
        const globalPriceRes = await fetch('http://localhost:3001/api/global-settings');
        const globalPriceData = await globalPriceRes.json();
        uniformPrice = parseFloat(globalPriceData.data?.room_price_per_night || '1500');
      } catch (priceError) {
        console.log('⚠️ Homepage: Could not fetch global price, using default 1500');
      }
      
      // ดึงข้อมูลโรงแรมและห้องพักในครั้งเดียว
      const response = await hotelAPI.getHotelAndRoomTypes();
      
      if (response && response.success && response.data) {
        setHotel(response.data.hotel);
        
        // Apply uniform pricing to all room types
        const roomTypesWithUniformPricing = response.data.roomTypes.map(room => ({
          ...room,
          price: uniformPrice
        }));
        
        setRoomTypes(roomTypesWithUniformPricing);
        console.log('✅ Homepage: Data loaded successfully with uniform pricing');
      } else {
        // ใช้ fallback data with uniform pricing
        console.log('⚠️ Homepage: Using fallback data due to API response issue');
        setHotel(fallbackHotel);
        
        const fallbackRoomsWithUniformPricing = fallbackRooms.map(room => ({
          ...room,
          price: uniformPrice
        }));
        
        setRoomTypes(fallbackRoomsWithUniformPricing);
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
      // ไม่แสดง toast error เพราะ user ยังได้เห็นข้อมูลอยู่
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHotelAndRooms();
  }, []);

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
              <div className="flex items-center text-sm text-gray-500 space-x-4">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{hotel?.address || 'กรุงเทพฯ'}</span>
                </div>
                <div className="flex items-center">
                  <Star className="h-4 w-4 mr-1 fill-yellow-400 text-yellow-400" />
                  <span>{hotel?.rating || '4.5'} คะแนน</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">
                ห้องพักพร้อม {roomTypes.length} ประเภท
              </p>
              <p className="text-sm text-gray-500">ราคาเริ่มต้น ฿{roomTypes.length > 0 ? Math.min(...roomTypes.map(r => r.pricePerNight)).toLocaleString() : '1,200'}</p>
            </div>
          </div>
        </div>

        {/* Quick Booking Form */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">วันที่เช็คอิน</label>
              <input 
                type="date" 
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">วันที่เช็คเอาท์</label>
              <input 
                type="date" 
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
            <div className="flex items-end">
              <Link 
                href="/booking" 
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center font-semibold"
              >
                ค้นหาห้องพัก
              </Link>
            </div>
          </div>
        </div>

        {/* Room Types Section */}
        {roomTypes.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">ประเภทห้องพัก</h3>
              <div className="text-sm text-gray-600">
                ราคาเริ่มต้น ฿{Math.min(...roomTypes.map(r => r.pricePerNight)).toLocaleString()} - ฿{Math.max(...roomTypes.map(r => r.pricePerNight)).toLocaleString()}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {roomTypes.map((room) => (
                <div key={room.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100">
                  <div className="relative h-40 bg-gradient-to-br from-blue-100 to-blue-200">
                    <div className="absolute inset-0 flex items-center justify-center text-blue-600">
                      <div className="text-center">
                        <Calendar className="h-8 w-8 mx-auto mb-1" />
                        <span className="text-xs font-medium">ภาพห้องพัก</span>
                      </div>
                    </div>
                    {/* Price Badge */}
                    <div className="absolute top-3 right-3 bg-blue-600 text-white px-2 py-1 rounded-lg text-sm font-semibold">
                      ฿{room.pricePerNight.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="mb-2">
                      <h4 className="text-base font-semibold text-gray-900 truncate">{room.name}</h4>
                      <p className="text-xs text-gray-600 mt-1">{room.description}</p>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
                      <div className="flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        <span>{room.maxGuests} คน</span>
                      </div>
                      <div>
                        <span>{room.sizeSqm || 'N/A'} ตร.ม.</span>
                      </div>
                    </div>

                    {/* Amenities - แสดงเฉพาะ 3 ตัวแรก */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {(room.amenities || []).slice(0, 3).map((amenity, index) => (
                        <span key={index} className="inline-flex px-1.5 py-0.5 text-xs bg-blue-50 text-blue-600 rounded">
                          {amenity}
                        </span>
                      ))}
                      {(room.amenities || []).length > 3 && (
                        <span className="inline-flex px-1.5 py-0.5 text-xs bg-gray-100 text-gray-500 rounded">
                          +{room.amenities.length - 3}
                        </span>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <Link 
                        href="/booking"
                        className="flex-1 bg-blue-600 text-white text-center py-2 px-2 rounded text-xs font-semibold hover:bg-blue-700 transition-colors"
                      >
                        จองเลย
                      </Link>
                      <button className="px-3 py-2 border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-50 transition-colors">
                        ดูรายละเอียด
                      </button>
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่พบข้อมูลห้องพัก</h3>
            <p className="text-gray-600 mb-4">ขณะนี้ยังไม่มีข้อมูลห้องพักในระบบ</p>
            <button
              onClick={fetchHotelAndRooms}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              โหลดข้อมูลใหม่
            </button>
          </div>
        )}

        {/* Room Statistics */}
        {roomTypes.length > 0 && (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{roomTypes.length}</div>
              <div className="text-sm text-gray-600">ประเภทห้องพัก</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 text-center">
              <div className="text-2xl font-bold text-green-600">฿{Math.min(...roomTypes.map(r => r.pricePerNight)).toLocaleString()}</div>
              <div className="text-sm text-gray-600">ราคาเริ่มต้น</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{Math.max(...roomTypes.map(r => r.maxGuests))}</div>
              <div className="text-sm text-gray-600">รองรับสูงสุด (คน)</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{Math.max(...roomTypes.map(r => r.sizeSqm || 0))}</div>
              <div className="text-sm text-gray-600">ขนาดใหญ่สุด (ตร.ม.)</div>
            </div>
          </div>
        )}

        {/* Room Categories */}
        {roomTypes.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">หมวดหมู่ห้องพัก</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">
                  {roomTypes.filter(r => r.pricePerNight <= 2000).length}
                </div>
                <div className="text-sm text-blue-800">ห้องราคาประหยัด</div>
                <div className="text-xs text-blue-600">≤ ฿2,000</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">
                  {roomTypes.filter(r => r.pricePerNight > 2000 && r.pricePerNight <= 5000).length}
                </div>
                <div className="text-sm text-green-800">ห้องระดับกลาง</div>
                <div className="text-xs text-green-600">฿2,001 - ฿5,000</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-lg font-bold text-purple-600">
                  {roomTypes.filter(r => r.pricePerNight > 5000).length}
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

        {/* Call to Action */}
        <div className="mt-12 bg-gradient-to-r from-green-600 to-green-800 rounded-lg shadow-lg p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">พร้อมจองห้องพักแล้วหรือยัง?</h3>
          <p className="text-green-100 mb-6">เริ่มต้นการเดินทางที่น่าจดจำของคุณกับเรา</p>
          <Link 
            href="/booking" 
            className="inline-block bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors"
          >
            จองห้องพักตอนนี้
          </Link>
        </div>
      </div>
    </div>
  );
}
