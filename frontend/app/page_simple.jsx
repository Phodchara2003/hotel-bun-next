'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Search, 
  MapPin, 
  Star, 
  Users, 
  Wifi, 
  Car, 
  Coffee,
  Tv,
  Wind,
  Calendar
} from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Mock hotel data ที่จะแสดงเสมอ
  const mockHotel = {
    id: 1,
    name: "Grand Hotel Bangkok",
    address: "123 ถนนสุขุมวิท",
    city: "กรุงเทพฯ",
    country: "ประเทศไทย",
    rating: 4.5,
    description: "โรงแรมหรูใจกลางเมือง พร้อมสิ่งอำนวยความสะดวกครบครัน"
  };

  // Mock room types
  const mockRoomTypes = [
    {
      id: 1,
      name: "Standard Room",
      description: "ห้องพักมาตรฐานสะดวกสบาย",
      pricePerNight: 1200,
      maxGuests: 2,
      sizeSqm: 25,
      amenities: ["Wi-Fi", "ทีวี", "เครื่องปรับอากาศ", "ตู้เย็น"]
    },
    {
      id: 2,
      name: "Deluxe Room",
      description: "ห้องพักระดับดีลักซ์ พร้อมวิวสวยงาม",
      pricePerNight: 1800,
      maxGuests: 3,
      sizeSqm: 35,
      amenities: ["Wi-Fi", "ทีวี", "เครื่องปรับอากาศ", "ตู้เย็น", "ระเบียง", "อาหารเช้าฟรี"]
    },
    {
      id: 3,
      name: "Suite Room",
      description: "ห้องสวีทหรูหราพร้อมห้องนั่งเล่นแยก",
      pricePerNight: 3500,
      maxGuests: 4,
      sizeSqm: 50,
      amenities: ["Wi-Fi", "ทีวี", "เครื่องปรับอากาศ", "ตู้เย็น", "ระเบียง", "อาหารเช้าฟรี", "ห้องนั่งเล่น", "มินิบาร์"]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-8 mb-8 text-white">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">ยินดีต้อนรับสู่ระบบจองโรงแรม</h1>
            <p className="text-xl text-blue-100 mb-6">จองห้องพักคุณภาพในราคาที่ดีที่สุด</p>
            {isAuthenticated ? (
              <p className="text-lg">สวัสดี คุณ{user?.first_name || 'ผู้ใช้'} 👋</p>
            ) : (
              <div className="space-x-4">
                <Link href="/auth/login" className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
                  เข้าสู่ระบบ
                </Link>
                <Link href="/auth/register" className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
                  สมัครสมาชิก
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Hotel Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">{mockHotel.name}</h2>
              <div className="flex items-center mt-2 text-gray-600">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{mockHotel.address}, {mockHotel.city}, {mockHotel.country}</span>
              </div>
              <div className="flex items-center mt-2">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < Math.floor(mockHotel.rating) ? 'fill-current' : ''}`} />
                  ))}
                </div>
                <span className="ml-2 text-sm text-gray-600">({mockHotel.rating} จาก 5)</span>
              </div>
              <p className="mt-3 text-gray-600">{mockHotel.description}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">ห้องพักทั้งหมด</p>
              <p className="text-2xl font-bold text-blue-600">{mockRoomTypes.length} ห้อง</p>
            </div>
          </div>
        </div>

        {/* Quick Booking Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">จองห้องพักแบบด่วน</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">วันที่เข้าพัก</label>
              <input 
                type="date" 
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">วันที่ออก</label>
              <input 
                type="date" 
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">จำนวนผู้เข้าพัก</label>
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
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-6">ประเภทห้องพัก</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockRoomTypes.map((room) => (
              <div key={room.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative h-48 bg-gradient-to-br from-blue-100 to-blue-200">
                  <div className="absolute inset-0 flex items-center justify-center text-blue-600">
                    <div className="text-center">
                      <Calendar className="h-12 w-12 mx-auto mb-2" />
                      <span className="text-sm font-medium">ภาพห้องพัก</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-lg font-semibold text-gray-900">{room.name}</h4>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">฿{room.pricePerNight.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">ต่อคืน</p>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3">{room.description}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      <span>{room.maxGuests} คน</span>
                    </div>
                    <div>
                      <span>{room.sizeSqm} ตร.ม.</span>
                    </div>
                  </div>

                  {/* Amenities */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {room.amenities.slice(0, 4).map((amenity, index) => (
                      <span key={index} className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                        {amenity}
                      </span>
                    ))}
                    {room.amenities.length > 4 && (
                      <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                        +{room.amenities.length - 4} อื่นๆ
                      </span>
                    )}
                  </div>

                  <div className="flex space-x-3">
                    <Link 
                      href="/booking"
                      className="flex-1 bg-blue-600 text-white text-center py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                    >
                      จองเลย
                    </Link>
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                      ดูรายละเอียด
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

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
