'use client';

import Link from 'next/link';
import { Hotel, Star, MapPin, Users, Calendar, Wifi, Car, Coffee } from 'lucide-react';

export default function GuestHomepage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-3xl"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-xl opacity-70"></div>
                <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-full shadow-2xl">
                  <Hotel className="h-12 w-12 text-white" />
                </div>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              ยินดีต้อนรับสู่
              <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                HotelBook
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              สัมผัสประสบการณ์การพักผ่อนที่ไม่เหมือนใครในโรงแรมสุดหรูของเรา
              พร้อมบริการระดับพรีเมียมและสิ่งอำนวยความสะดวกครบครัน
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link
                href="/login"
                className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-2xl hover:shadow-blue-500/25 transform hover:scale-105 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-70 group-hover:opacity-100 transition-opacity"></div>
                <span className="relative">เข้าสู่ระบบ</span>
              </Link>
              
              <Link
                href="/register"
                className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transform hover:scale-105 transition-all duration-300"
              >
                สมัครสมาชิก
              </Link>
              
              <Link
                href="#rooms"
                className="px-6 py-3 text-gray-300 hover:text-white font-medium border-b-2 border-transparent hover:border-blue-400 transition-all duration-300"
              >
                ดูห้องพัก (ไม่ต้องเข้าสู่ระบบ)
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">เพราะเหตุใดถึงเลือกเรา</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              เรามุ่งมั่นที่จะมอบประสบการณ์การพักผ่อนที่ดีที่สุดให้กับแขกทุกท่าน
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group p-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-blue-500/50 hover:bg-white/10 transition-all duration-300">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-60"></div>
                <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-lg w-fit">
                  <Star className="h-6 w-6 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">บริการระดับพรีเมียม</h3>
              <p className="text-gray-400">
                ทีมงานมืออาชีพพร้อมให้บริการตลอด 24 ชั่วโมง เพื่อความสะดวกสบายของท่าน
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-blue-500/50 hover:bg-white/10 transition-all duration-300">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg blur opacity-60"></div>
                <div className="relative bg-gradient-to-r from-green-600 to-blue-600 p-3 rounded-lg w-fit">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">ทำเลที่ตั้งสะดวก</h3>
              <p className="text-gray-400">
                ตั้งอยู่ในใจกลางเมือง ใกล้แหล่งท่องเที่ยวและแหล่งช้อปปิ้งสำคัญ
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-blue-500/50 hover:bg-white/10 transition-all duration-300">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg blur opacity-60"></div>
                <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 p-3 rounded-lg w-fit">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">ห้องพักหลากหลาย</h3>
              <p className="text-gray-400">
                ห้องพักสุดหรูแบบต่างๆ พร้อมสิ่งอำนวยความสะดวกครบครัน
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Amenities Section */}
      <section className="py-20 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">สิ่งอำนวยความสะดวก</h2>
            <p className="text-gray-400 text-lg">ครบครันทุกความต้องการของท่าน</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="relative mb-4 mx-auto w-fit">
                <div className="absolute inset-0 bg-blue-600 rounded-full blur opacity-60"></div>
                <div className="relative bg-blue-600 p-4 rounded-full">
                  <Wifi className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="text-white font-semibold">WiFi ฟรี</h3>
              <p className="text-gray-400 text-sm mt-2">อินเทอร์เน็ตความเร็วสูง</p>
            </div>

            <div className="text-center">
              <div className="relative mb-4 mx-auto w-fit">
                <div className="absolute inset-0 bg-green-600 rounded-full blur opacity-60"></div>
                <div className="relative bg-green-600 p-4 rounded-full">
                  <Car className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="text-white font-semibold">ที่จอดรถ</h3>
              <p className="text-gray-400 text-sm mt-2">ฟรีสำหรับแขกของโรงแรม</p>
            </div>

            <div className="text-center">
              <div className="relative mb-4 mx-auto w-fit">
                <div className="absolute inset-0 bg-purple-600 rounded-full blur opacity-60"></div>
                <div className="relative bg-purple-600 p-4 rounded-full">
                  <Coffee className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="text-white font-semibold">ร้านอาหาร</h3>
              <p className="text-gray-400 text-sm mt-2">อาหารนานาชาติ</p>
            </div>

            <div className="text-center">
              <div className="relative mb-4 mx-auto w-fit">
                <div className="absolute inset-0 bg-indigo-600 rounded-full blur opacity-60"></div>
                <div className="relative bg-indigo-600 p-4 rounded-full">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="text-white font-semibold">จองออนไลน์</h3>
              <p className="text-gray-400 text-sm mt-2">ระบบจองที่สะดวก</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="rooms" className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">พร้อมเริ่มต้นการเดินทางแล้วหรือยัง?</h2>
          <p className="text-gray-400 text-lg mb-8">
            สมัครสมาชิกวันนี้เพื่อรับสิทธิพิเศษและข้อเสนอสุดพิเศษ หรือเข้าสู่ระบบเพื่อจองห้องพักได้ทันที
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-block px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-2xl hover:shadow-blue-500/25 transform hover:scale-105 transition-all duration-300"
            >
              สมัครสมาชิก
            </Link>
            <Link
              href="/login"
              className="inline-block px-10 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transform hover:scale-105 transition-all duration-300"
            >
              เข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </section>

      {/* Room Preview Section */}
      <section className="py-20 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">ห้องพักของเรา</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              ห้องพักสุดหรูพร้อมสิ่งอำนวยความสะดวกครบครัน เข้าสู่ระบบเพื่อดูรายละเอียดและจองได้ทันที
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Sample Room 1 */}
            <div className="group p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:border-blue-500/50 hover:bg-white/15 transition-all duration-300">
              <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl mb-4 flex items-center justify-center">
                <Hotel className="h-12 w-12 text-white opacity-70" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">ห้องดีลักซ์</h3>
              <p className="text-gray-400 text-sm mb-4">
                ห้องพักขนาดใหญ่พร้อมสิ่งอำนวยความสะดวกครบครัน
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-4 w-4 text-gray-400 mr-1" />
                  <span className="text-gray-400 text-sm">2-3 ท่าน</span>
                </div>
                <div className="text-blue-400 font-semibold">เข้าสู่ระบบเพื่อดูราคา</div>
              </div>
            </div>

            {/* Sample Room 2 */}
            <div className="group p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:border-blue-500/50 hover:bg-white/15 transition-all duration-300">
              <div className="w-full h-48 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl mb-4 flex items-center justify-center">
                <Hotel className="h-12 w-12 text-white opacity-70" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">ห้องสวีท</h3>
              <p className="text-gray-400 text-sm mb-4">
                ห้องพักสุดหรูพร้อมพื้นที่นั่งเล่นแยกต่างหาก
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-4 w-4 text-gray-400 mr-1" />
                  <span className="text-gray-400 text-sm">2-4 ท่าน</span>
                </div>
                <div className="text-blue-400 font-semibold">เข้าสู่ระบบเพื่อดูราคา</div>
              </div>
            </div>

            {/* Sample Room 3 */}
            <div className="group p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:border-blue-500/50 hover:bg-white/15 transition-all duration-300">
              <div className="w-full h-48 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl mb-4 flex items-center justify-center">
                <Hotel className="h-12 w-12 text-white opacity-70" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">ห้องแฟมิลี่</h3>
              <p className="text-gray-400 text-sm mb-4">
                ห้องพักขนาดใหญ่เหมาะสำหรับครอบครัว
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-4 w-4 text-gray-400 mr-1" />
                  <span className="text-gray-400 text-sm">4-6 ท่าน</span>
                </div>
                <div className="text-blue-400 font-semibold">เข้าสู่ระบบเพื่อดูราคา</div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/login"
              className="inline-block px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-blue-500/25 transform hover:scale-105 transition-all duration-300"
            >
              เข้าสู่ระบบเพื่อดูห้องพักทั้งหมดและจองเลย
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
