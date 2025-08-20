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
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {t('common.loading', 'กำลังตรวจสอบสถานะผู้ใช้...')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="scroll-smooth dark-bg min-h-screen">
      <ThemeLanguageHandler />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto container-padding section-padding">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              {hotel ? hotel.name : t('hero.title', 'ค้นหาที่พักในฝันของคุณ')}
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto leading-relaxed">
              {hotel ? hotel.description : t('hero.subtitle', 'โรงแรมหรูระดับ 5 ดาว ใจกลางกรุงเทพฯ พร้อมสิ่งอำนวยความสะดวกครบครัน')}
            </p>
          </div>
          
          {/* Search Box */}
          <SearchBox className="max-w-4xl mx-auto" />
        </div>
      </section>

      {/* Quick Actions Section */}
      <section className="py-12 dark-bg-secondary">
        <div className="max-w-7xl mx-auto container-padding">
          <div className="flex flex-wrap justify-center gap-4">
            <a 
              href="#rooms" 
              className="btn-primary shadow-lg"
            >
              {t('hero.viewRooms', 'ดูห้องพัก')}
            </a>
            {!isAuthenticated ? (
              <>
                <a 
                  href="/login" 
                  className="btn-outline shadow-sm"
                >
                  {t('header.login', 'เข้าสู่ระบบ')}
                </a>
                <a 
                  href="/register" 
                  className="btn-secondary shadow-sm"
                >
                  {t('header.register', 'สมัครสมาชิก')}
                </a>
              </>
            ) : (
              <a 
                href="/bookings" 
                className="btn-outline shadow-sm"
              >
                {t('header.bookings', 'ดูการจองของฉัน')}
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Room Types Section */}
      <section id="rooms" className="section-padding dark-bg">
        <div className="max-w-7xl mx-auto container-padding">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold dark-text mb-6">
              {t('rooms.title', 'ห้องพักของเรา')}
            </h2>
            <p className="text-xl dark-text-secondary max-w-2xl mx-auto">
              {t('rooms.subtitle', 'เลือกห้องพักที่เหมาะสมกับความต้องการของคุณ')}
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="card animate-pulse">
                  <div className="h-56 bg-neutral-300 dark:bg-neutral-600"></div>
                  <div className="p-6">
                    <div className="h-6 bg-neutral-300 dark:bg-neutral-600 rounded mb-3"></div>
                    <div className="h-4 bg-neutral-300 dark:bg-neutral-600 rounded mb-2"></div>
                    <div className="h-4 bg-neutral-300 dark:bg-neutral-600 rounded w-3/4"></div>
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
            <div className="text-center py-16">
              <Bed className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold dark-text-secondary mb-2">
                {t('rooms.noRooms', 'ไม่พบข้อมูลห้องพัก')}
              </h3>
              <p className="dark-text-muted">
                {t('rooms.tryAgain', 'กรุณาลองใหม่อีกครั้งในภายหลัง')}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Hotel Information Section */}
      {hotel && (
        <section className="section-padding dark-bg-secondary">
          <div className="max-w-7xl mx-auto container-padding">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold dark-text mb-8">
                  {t('hotel.about', 'เกี่ยวกับโรงแรม')}
                </h2>
                <p className="text-lg dark-text-secondary mb-8 leading-relaxed">
                  {hotel.description}
                </p>
                <div className="space-y-6">
                  <div className="flex items-center">
                    <div className="flex items-center justify-center w-10 h-10 bg-warning-100 rounded-lg mr-4">
                      <Star className="h-5 w-5 text-warning-600" />
                    </div>
                    <span className="dark-text font-medium">
                      {t('hotel.rating', 'คะแนนรีวิว')} {hotel.rating}/5.0
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="flex items-center justify-center w-10 h-10 bg-secondary-100 rounded-lg mr-4">
                      <Bed className="h-5 w-5 text-secondary-600" />
                    </div>
                    <span className="dark-text font-medium">
                      {roomTypes.length} {t('hotel.roomTypes', 'ประเภทห้องพัก')}
                    </span>
                  </div>
                </div>
                
                {/* Hotel Amenities */}
                {hotel.amenities && hotel.amenities.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-xl font-semibold mb-6 dark-text">
                      {t('hotel.amenities', 'สิ่งอำนวยความสะดวก')}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {hotel.amenities.map((amenity, index) => (
                        <div key={index} className="flex items-center dark-text-secondary">
                          <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
                          {amenity}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hotel.images && hotel.images.slice(0, 4).map((image, index) => (
                  <div key={index} className="relative h-52 rounded-xl overflow-hidden group">
                    <img 
                      src={image} 
                      alt={`${hotel.name} ${index + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="section-padding dark-bg">
        <div className="max-w-7xl mx-auto container-padding">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold dark-text mb-6">
              {t('features.title', 'ทำไมต้องเลือกเรา?')}
            </h2>
            <p className="text-xl dark-text-secondary max-w-2xl mx-auto">
              {t('features.subtitle', 'เราให้บริการที่ดีที่สุด พร้อมความสะดวกและปลอดภัย')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-2xl mb-8 group-hover:shadow-lg transition-all duration-300">
                <Bed className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4 dark-text">
                {t('features.quality', 'ห้องพักคุณภาพ')}
              </h3>
              <p className="dark-text-secondary leading-relaxed">
                {t('features.qualityDesc', 'ห้องพักที่ผ่านการคัดสรรแล้ว พร้อมสิ่งอำนวยความสะดวกครบครัน')}
              </p>
            </div>

            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-success-500 to-success-600 rounded-2xl mb-8 group-hover:shadow-lg transition-all duration-300">
                <Shield className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4 dark-text">
                {t('features.secure', 'จองง่าย ปลอดภัย')}
              </h3>
              <p className="dark-text-secondary leading-relaxed">
                {t('features.secureDesc', 'ระบบจองที่ปลอดภัย รองรับการชำระเงินหลายช่องทาง')}
              </p>
            </div>

            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-warning-500 to-warning-600 rounded-2xl mb-8 group-hover:shadow-lg transition-all duration-300">
                <Clock className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4 dark-text">
                {t('features.flexible', 'ยกเลิกได้ฟรี')}
              </h3>
              <p className="dark-text-secondary leading-relaxed">
                {t('features.flexibleDesc', 'ยกเลิกการจองได้ฟรีก่อน 24 ชั่วโมงของวันเข้าพัก')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600 text-white">
        <div className="max-w-4xl mx-auto container-padding text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 leading-tight">
            {t('cta.title', 'พร้อมจองห้องพักแล้วใช่ไหม?')}
          </h2>
          <p className="text-xl mb-12 text-blue-100 leading-relaxed">
            {t('cta.subtitle', 'สมัครสมาชิกวันนี้ รับส่วนลดพิเศษสำหรับการจองครั้งแรก')}
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <a 
              href="/register" 
              className="bg-white text-primary-600 font-semibold py-4 px-8 rounded-xl 
                       hover:bg-neutral-50 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {t('cta.register', 'สมัครสมาชิกฟรี')}
            </a>
            <a 
              href="#rooms" 
              className="bg-transparent border-2 border-white text-white font-semibold py-4 px-8 rounded-xl 
                       hover:bg-white hover:text-primary-600 transition-all duration-200"
            >
              {t('cta.browse', 'ดูห้องพัก')}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
