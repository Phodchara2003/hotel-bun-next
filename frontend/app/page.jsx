'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../translations';
import { useRouter } from 'next/navigation';
import SearchBox from '../components/SearchBox';
import RoomCard from '../components/RoomCard';
import { hotelAPI } from '../lib/api';
import { Bed, Star, Shield, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function HomePage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { language } = useLanguage();
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
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  // Show loading while processing auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {t('common.loading')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="scroll-smooth bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary-600 to-primary-800 text-white dark:from-primary-700 dark:to-primary-900">
        <div className="absolute inset-0 bg-black opacity-20 dark:opacity-40"></div>
        <div className="relative max-w-7xl mx-auto container-padding section-padding">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {hotel ? hotel.name : 'Royal Garden Hotel Bangkok'}
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100 dark:text-primary-200">
              {hotel ? hotel.description : t('hero.subtitle')}
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
              className="bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-800 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {t('rooms.title')}
            </a>
            {!isAuthenticated ? (
              <>
                <a 
                  href="/login" 
                  className="bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-primary-600 dark:text-primary-400 border border-primary-600 dark:border-primary-400 px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  {t('header.login')}
                </a>
                <a 
                  href="/register" 
                  className="bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  {t('header.register')}
                </a>
              </>
            ) : (
              <a 
                href="/bookings" 
                className="bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-primary-600 dark:text-primary-400 border border-primary-600 dark:border-primary-400 px-6 py-3 rounded-lg font-medium transition-colors"
              >
                {t('header.bookings')}
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Room Types Section - ย้ายขึ้นมาด้านบน */}
      <section id="rooms" className="section-padding bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto container-padding">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {language === 'en' ? 'Our Rooms' : 'ห้องพักของเรา'}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              {language === 'en' ? 'Choose the room that suits your needs' : 'เลือกห้องพักที่เหมาะสมกับความต้องการของคุณ'}
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden animate-pulse">
                  <div className="h-56 bg-gray-300 dark:bg-gray-700"></div>
                  <div className="p-6">
                    <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded mb-3"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
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
              <Bed className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                {language === 'en' ? 'No rooms found' : 'ไม่พบข้อมูลห้องพัก'}
              </h3>
              <p className="text-gray-500 dark:text-gray-500">
                {language === 'en' ? 'Please try again later' : 'กรุณาลองใหม่อีกครั้งในภายหลัง'}
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
                  {language === 'en' ? 'About Hotel' : 'เกี่ยวกับโรงแรม'}
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                  {hotel.description}
                </p>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Star className="h-5 w-5 text-yellow-400 mr-2" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {language === 'en' ? `Rating ${hotel.rating}/5.0` : `คะแนนรีวิว ${hotel.rating}/5.0`}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Bed className="h-5 w-5 text-primary-600 dark:text-primary-400 mr-2" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {language === 'en' ? `${roomTypes.length} Room Types` : `${roomTypes.length} ประเภทห้องพัก`}
                    </span>
                  </div>
                </div>
                
                {/* Hotel Amenities */}
                {hotel.amenities && hotel.amenities.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      {language === 'en' ? 'Amenities' : 'สิ่งอำนวยความสะดวก'}
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {hotel.amenities.map((amenity, index) => (
                        <div key={index} className="flex items-center text-gray-600 dark:text-gray-300">
                          <div className="w-2 h-2 bg-primary-600 dark:bg-primary-400 rounded-full mr-3"></div>
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
      <section className="section-padding bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto container-padding">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {language === 'en' ? 'Why Choose Us?' : 'ทำไมต้องเลือกเรา?'}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              {language === 'en' 
                ? 'We provide the best service with convenience and security' 
                : 'เราให้บริการที่ดีที่สุด พร้อมความสะดวกและปลอดภัย'
              }
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full mb-6">
                <Bed className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold mb-4 dark:text-gray-100">
                {language === 'en' ? 'Quality Rooms' : 'ห้องพักคุณภาพ'}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {language === 'en' 
                  ? 'Carefully selected rooms with complete amenities' 
                  : 'ห้องพักที่ผ่านการคัดสรรแล้ว พร้อมสิ่งอำนวยความสะดวกครบครัน'
                }
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full mb-6">
                <Shield className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold mb-4 dark:text-gray-100">
                {language === 'en' ? 'Easy & Secure Booking' : 'จองง่าย ปลอดภัย'}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {language === 'en' 
                  ? 'Secure booking system with multiple payment options' 
                  : 'ระบบจองที่ปลอดภัย รองรับการชำระเงินหลายช่องทาง'
                }
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full mb-6">
                <Clock className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold mb-4 dark:text-gray-100">
                {language === 'en' ? 'Free Cancellation' : 'ยกเลิกได้ฟรี'}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {language === 'en' 
                  ? 'Free cancellation up to 24 hours before check-in' 
                  : 'ยกเลิกการจองได้ฟรีก่อน 24 ชั่วโมงของวันเข้าพัก'
                }
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-primary-600 dark:bg-primary-800 text-white">
        <div className="max-w-4xl mx-auto container-padding text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {language === 'en' ? 'Ready to Book Your Room?' : 'พร้อมจองห้องพักแล้วใช่ไหม?'}
          </h2>
          <p className="text-xl mb-8 text-primary-100 dark:text-primary-200">
            {language === 'en' 
              ? 'Sign up today and get special discounts for your first booking' 
              : 'สมัครสมาชิกวันนี้ รับส่วนลดพิเศษสำหรับการจองครั้งแรก'
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/register" 
              className="bg-white text-primary-600 font-semibold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {language === 'en' ? 'Sign Up Free' : 'สมัครสมาชิกฟรี'}
            </a>
            <a 
              href="#rooms" 
              className="border-2 border-white text-white font-semibold py-3 px-8 rounded-lg hover:bg-white hover:text-primary-600 transition-colors"
            >
              {language === 'en' ? 'View All Rooms' : 'ดูห้องพักทั้งหมด'}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
