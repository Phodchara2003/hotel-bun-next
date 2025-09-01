'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslation } from '../../translations';
import { useRouter } from 'next/navigation';
import { bookingAPI, hotelAPI } from '../../lib/api';
import { 
  Calendar, 
  MapPin, 
  CreditCard, 
  Clock,
  User,
  Bell,
  MessageSquare,
  Settings,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Heart
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function CustomerDashboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const router = useRouter();
  const [stats, setStats] = useState({
    totalBookings: 0,
    upcomingBookings: 0,
    completedStays: 0
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [upcomingStays, setUpcomingStays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated && user) {
      fetchDashboardData();
    }
  }, [authLoading, isAuthenticated, user, router]);

  const fetchDashboardData = async () => {
    try {
      // Fetch user's bookings
      const bookingsResponse = await bookingAPI.getBookings();
      const bookings = bookingsResponse.bookings || [];
      
      // Calculate stats
      const totalBookings = bookings.length;
      const upcomingBookings = bookings.filter(b => 
        b.status === 'confirmed' && new Date(b.checkInDate) > new Date()
      ).length;
      const completedStays = bookings.filter(b => b.status === 'completed').length;
      
      setStats({
        totalBookings,
        upcomingBookings,
        completedStays
      });

      // Recent bookings (last 3)
      setRecentBookings(bookings.slice(0, 3));
      
      // Upcoming stays
      const upcoming = bookings
        .filter(b => b.status === 'confirmed' && new Date(b.checkInDate) > new Date())
        .sort((a, b) => new Date(a.checkInDate) - new Date(b.checkInDate))
        .slice(0, 2);
      setUpcomingStays(upcoming);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('ไม่สามารถโหลดข้อมูลแดชบอร์ดได้');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-700 text-lg font-medium">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            สวัสดี {user?.first_name || user?.firstName || 'คุณลูกค้า'}! 👋
          </h1>
          <p className="text-gray-600 mt-2">ยินดีต้อนรับสู่แดชบอร์ดส่วนตัวของคุณ</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">การจองทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">การจองที่กำลังจะมา</p>
                <p className="text-2xl font-bold text-gray-900">{stats.upcomingBookings}</p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">การเข้าพักที่สำเร็จ</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedStays}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upcoming Stays */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">การเข้าพักที่กำลังจะมา</h2>
                <Link href="/bookings" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  ดูทั้งหมด →
                </Link>
              </div>
              
              {upcomingStays.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">ไม่มีการจองที่กำลังจะมา</p>
                  <Link href="/" className="inline-block mt-4 btn-primary">
                    จองห้องพัก
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingStays.map((booking) => (
                    <div key={booking.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{booking.hotel?.name}</h3>
                          <p className="text-gray-600">{booking.roomType?.name}</p>
                          <div className="flex items-center mt-2 text-sm text-gray-500">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(booking.checkInDate)} - {formatDate(booking.checkOutDate)}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                            {booking.status === 'confirmed' ? 'ยืนยันแล้ว' : booking.status}
                          </span>
                          <p className="text-sm font-semibold text-gray-900 mt-1">
                            ฿{booking.totalPrice?.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">กิจกรรมล่าสุด</h2>
              {recentBookings.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">ไม่มีกิจกรรมล่าสุด</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          การจอง {booking.hotel?.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(booking.createdAt)}
                        </p>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions & Loyalty */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">การดำเนินการด่วน</h2>
              <div className="space-y-3">
                <Link href="/" className="flex items-center p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                  <Calendar className="h-5 w-5 mr-3 text-blue-500" />
                  <span>จองห้องพักใหม่</span>
                </Link>
                <Link href="/bookings" className="flex items-center p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                  <MapPin className="h-5 w-5 mr-3 text-green-500" />
                  <span>จัดการการจอง</span>
                </Link>
                <Link href="/profile" className="flex items-center p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                  <User className="h-5 w-5 mr-3 text-purple-500" />
                  <span>แก้ไขโปรไฟล์</span>
                </Link>
                <Link href="/notifications" className="flex items-center p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                  <Bell className="h-5 w-5 mr-3 text-yellow-500" />
                  <span>การแจ้งเตือน</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
