'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../translations';
import { useRouter } from 'next/navigation';
import SearchBox from '../components/SearchBox';
import RoomCard from '../components/RoomCard';
import ThemeLanguageHandler from '../components/ThemeLanguageHandler';
import { hotelAPI } from '../lib/api';
import { Bed, Star, Shield, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function HomePage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { t } = useTranslation(language);
  const router = useRouter();
  const [hotel, setHotel] = useState(null);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch hotel data regardless of authentication status
    fetchHotelAndRooms();
  }, []);

  const fetchHotelAndRooms = async () => {
    try {
      // Get hotel details (assuming hotel ID = 1 since we have only one hotel)
      const hotelResponse = await hotelAPI.getHotelById(1);
      setHotel(hotelResponse);
      setRoomTypes(hotelResponse.roomTypes || []);
    } catch (error) {
      console.error('Error fetching hotel data:', error);
      toast.error('ไม่สามารถโหลดข้อมูลโรงแรมได้');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while processing auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {t('common.loading', 'กำลังตรวจสอบสถานะผู้ใช้...')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="scroll-smooth bg-white dark:bg-gray-900 min-h-screen">
      <ThemeLanguageHandler />
      
      {/* Hero Section */}
      <section className="relative bg-white dark:from-primary-700 dark:to-primary-900 text-gray-900 border-b border-gray-200">
        <div className="relative max-w-7xl mx-auto container-padding section-padding">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {hotel ? hotel.name : t('hero.title', 'ค้นหาที่พักในฝันของคุณ')}
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-600">
              {hotel ? hotel.description : t('hero.subtitle', 'โรงแรมหรูระดับ 5 ดาว ใจกลางกรุงเทพฯ พร้อมสิ่งอำนวยความสะดวกครบครัน')}
            </p>
          </div>
          
          {/* Search Box */}
          <SearchBox className="max-w-4xl mx-auto" />
        </div>
      </section>

      {/* Quick Actions Section */}
      <section className="py-8 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto container-padding">
          <div className="flex flex-wrap justify-center gap-4">
            <a 
              href="#rooms" 
              className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {t('hero.viewRooms', 'ดูห้องพัก')}
            </a>
            {!isAuthenticated ? (
              <>
                <a 
                  href="/login" 
                  className="bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 
                           text-gray-900 dark:text-primary-400 border border-gray-300 dark:border-primary-400 
                           px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  {t('header.login', 'เข้าสู่ระบบ')}
                </a>
                <a 
                  href="/register" 
                  className="bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 
                           text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 
                           px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  {t('header.register', 'สมัครสมาชิก')}
                </a>
              </>
            ) : (
              <a 
                href="/bookings" 
                className="bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 
                         text-gray-900 dark:text-primary-400 border border-gray-300 dark:border-primary-400 
                         px-6 py-3 rounded-lg font-medium transition-colors"
              >
                {t('header.bookings', 'ดูการจองของฉัน')}
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Room Types Section */}
      <section id="rooms" className="section-padding bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto container-padding">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {t('rooms.title', 'ห้องพักของเรา')}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              {t('rooms.subtitle', 'เลือกห้องพักที่เหมาะสมกับความต้องการของคุณ')}
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="bg-white dark:bg-gray-700 rounded-lg shadow-lg overflow-hidden animate-pulse">
                  <div className="h-56 bg-gray-300 dark:bg-gray-600"></div>
                  <div className="p-6">
                    <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded mb-3"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {roomTypes.map((roomType) => (
                <RoomCard key={roomType.id} roomType={roomType} hotelId={hotel?.id} />
              ))}
            </div>
          )}

          {!loading && roomTypes.length === 0 && (
            <div className="text-center py-12">
              <Bed className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                {t('rooms.noRooms', 'ไม่พบข้อมูลห้องพัก')}
              </h3>
              <p className="text-gray-500 dark:text-gray-500">
                {t('rooms.tryAgain', 'กรุณาลองใหม่อีกครั้งในภายหลัง')}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Hotel Information Section */}
      {hotel && (
        <section className="section-padding bg-gray-50 dark:bg-gray-800">
          <div className="max-w-7xl mx-auto container-padding">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                  {t('hotel.about', 'เกี่ยวกับโรงแรม')}
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                  {hotel.description}
                </p>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Star className="h-5 w-5 text-yellow-400 mr-2" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {t('hotel.rating', 'คะแนนรีวิว')} {hotel.rating}/5.0
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Bed className="h-5 w-5 text-gray-600 mr-2" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {roomTypes.length} {t('hotel.roomTypes', 'ประเภทห้องพัก')}
                    </span>
                  </div>
                </div>
                
                {/* Hotel Amenities */}
                {hotel.amenities && hotel.amenities.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                      {t('hotel.amenities', 'สิ่งอำนวยความสะดวก')}
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {hotel.amenities.map((amenity, index) => (
                        <div key={index} className="flex items-center text-gray-600 dark:text-gray-400">
                          <div className="w-2 h-2 bg-gray-600 rounded-full mr-3"></div>
                          {amenity}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hotel.images && hotel.images.slice(0, 4).map((image, index) => (
                  <div key={index} className="relative h-48 rounded-lg overflow-hidden">
                    <img 
                      src={image} 
                      alt={`${hotel.name} ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="section-padding bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto container-padding">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {t('features.title', 'ทำไมต้องเลือกเรา?')}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              {t('features.subtitle', 'เราให้บริการที่ดีที่สุด พร้อมความสะดวกและปลอดภัย')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-primary-900 rounded-full mb-6">
                <Bed className="h-8 w-8 text-gray-700 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                {t('features.quality', 'ห้องพักคุณภาพ')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('features.qualityDesc', 'ห้องพักที่ผ่านการคัดสรรแล้ว พร้อมสิ่งอำนวยความสะดวกครบครัน')}
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-primary-900 rounded-full mb-6">
                <Shield className="h-8 w-8 text-gray-700 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                {t('features.secure', 'จองง่าย ปลอดภัย')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('features.secureDesc', 'ระบบจองที่ปลอดภัย รองรับการชำระเงินหลายช่องทาง')}
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-primary-900 rounded-full mb-6">
                <Clock className="h-8 w-8 text-gray-700 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                {t('features.flexible', 'ยกเลิกได้ฟรี')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('features.flexibleDesc', 'ยกเลิกการจองได้ฟรีก่อน 24 ชั่วโมงของวันเข้าพัก')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-gray-900 dark:bg-primary-700 text-white">
        <div className="max-w-4xl mx-auto container-padding text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {t('cta.title', 'พร้อมจองห้องพักแล้วใช่ไหม?')}
          </h2>
          <p className="text-xl mb-8 text-gray-200">
            {t('cta.subtitle', 'สมัครสมาชิกวันนี้ รับส่วนลดพิเศษสำหรับการจองครั้งแรก')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/register" 
              className="bg-white text-gray-900 font-semibold py-3 px-8 rounded-lg 
                       hover:bg-gray-100 dark:hover:bg-gray-200 transition-colors"
            >
              {t('cta.register', 'สมัครสมาชิกฟรี')}
            </a>
            <a 
              href="#rooms" 
              className="bg-transparent border-2 border-white text-white font-semibold py-3 px-8 rounded-lg 
                       hover:bg-white hover:text-gray-900 transition-colors"
            >
              {t('cta.browse', 'ดูห้องพัก')}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
