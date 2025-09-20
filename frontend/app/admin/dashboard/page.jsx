'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { dashboardAPI, usersAPI, bookingAPI } from '../../../lib/api';
import { isStaffOrAdmin, canEdit, canDelete, canCreate, isReadOnly } from '../../../lib/roles';
import Cookies from 'js-cookie';
import Link from 'next/link';
import TokenStatus from '../../../components/admin/TokenStatus';
import PerformanceDashboard from '../../../components/admin/PerformanceDashboard';
import { 
  Calendar, 
  Users, 
  User,
  CreditCard, 
  TrendingUp, 
  Hotel,
  Bed,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Edit,
  Trash2,
  Plus,
  Settings,
  FileText,
  BarChart3,
  UserCheck,
  Building,
  DollarSign,
  Activity,
  Search,
  Filter,
  Download,
  RefreshCw,
  AlertCircle,
  Star,
  Mail,
  Phone,
  MapPin,
  QrCode,
  Upload,
  Smartphone
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalBookings: 0,
      pendingBookings: 0,
      confirmedBookings: 0,
      completedBookings: 0,
      cancelledBookings: 0,
      totalUsers: 0,
      newUsersThisMonth: 0,
      activeUsers: 0,
      totalRevenue: 0,
      monthlyRevenue: 0,
      revenueGrowth: 0,
      totalHotels: 0,
      totalRooms: 0,
      occupancyRate: 0,
      totalReviews: 0,
      averageRating: 0,
    },
    recentBookings: [],
    recentUsers: [],
    recentReviews: [],
    topHotels: [],
    revenueChart: [],
    bookingChart: [],
  });

  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    dateRange: '30',
    status: 'all',
    search: ''
  });

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated || !isStaffOrAdmin(user)) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, user, router]);

  // Fetch dashboard data
  useEffect(() => {
    if (isAuthenticated && isStaffOrAdmin(user)) {
      fetchDashboardData();
    }
  }, [isAuthenticated, user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Fetching dashboard data...');

      const dashboardResponse = await dashboardAPI.getStats({
        days: filters.dateRange
      });

      console.log('✅ Dashboard API response:', dashboardResponse);

      const stats = dashboardResponse.stats || {
        totalBookings: 0,
        pendingBookings: 0,
        confirmedBookings: 0,
        completedBookings: 0,
        cancelledBookings: 0,
        totalUsers: 0,
        newUsersThisMonth: 0,
        activeUsers: 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
        revenueGrowth: 0,
        totalHotels: 0,
        totalRooms: 0,
        occupancyRate: 0,
        totalReviews: 0,
        averageRating: 0,
      };
      
      setDashboardData({
        stats: {
          ...stats,
          totalBookings: Number(stats.totalBookings) || 0,
          pendingBookings: Number(stats.pendingBookings) || 0,
          confirmedBookings: Number(stats.confirmedBookings) || 0,
          completedBookings: Number(stats.completedBookings) || 0,
          cancelledBookings: Number(stats.cancelledBookings) || 0,
          totalUsers: Number(stats.totalUsers) || 0,
          newUsersThisMonth: Number(stats.newUsersThisMonth) || 0,
          activeUsers: Number(stats.activeUsers) || 0,
          totalRevenue: Number(stats.totalRevenue) || 0,
          monthlyRevenue: Number(stats.monthlyRevenue) || 0,
          revenueGrowth: Number(stats.revenueGrowth) || 0,
          totalHotels: Number(stats.totalHotels) || 0,
          totalRooms: Number(stats.totalRooms) || 0,
          occupancyRate: Math.min(100, Math.max(0, Number(stats.occupancyRate) || 0)),
          totalReviews: Number(stats.totalReviews) || 0,
          averageRating: Number(stats.averageRating) || 0,
        },
        recentBookings: dashboardResponse.recentBookings || [],
        recentUsers: dashboardResponse.recentUsers || [],
        recentReviews: [],
        topHotels: dashboardResponse.topHotels || [],
        revenueChart: dashboardResponse.bookingTrends || [],
        bookingChart: dashboardResponse.bookingTrends || [],
      });

      console.log('✅ Dashboard data loaded successfully');

    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      setError({
        status: error.response?.status,
        message: error.response?.data?.error || error.message || 'Unknown error occurred',
        timestamp: new Date().toISOString()
      });
      
      if (error.response?.status === 401) {
        toast.error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
      } else {
        toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      }
      
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    fetchDashboardData();
  };

  // Don't render if not authenticated
  if (!isAuthenticated || !isStaffOrAdmin(user)) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">กำลังโหลดข้อมูล Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">เกิดข้อผิดพลาด</h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button
            onClick={refreshData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">แดชบอร์ดแอดมิน</h1>
              <p className="text-gray-600 mt-1">จัดการระบบโรงแรมครบวงจร</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={refreshData}
                className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                รีเฟรช
              </button>
              
              <TokenStatus />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="การจองทั้งหมด"
            value={dashboardData.stats.totalBookings}
            icon={Calendar}
            color="blue"
            change={`+${dashboardData.stats.newUsersThisMonth}`}
          />
          <StatsCard
            title="ผู้ใช้ทั้งหมด"
            value={dashboardData.stats.totalUsers}
            icon={Users}
            color="green"
            change={`+${dashboardData.stats.newUsersThisMonth}`}
          />
          <StatsCard
            title="รายได้รวม"
            value={`฿${dashboardData.stats.totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            color="yellow"
            change={`+${dashboardData.stats.revenueGrowth}%`}
          />
          <StatsCard
            title="อัตราการเข้าพัก"
            value={`${dashboardData.stats.occupancyRate}%`}
            icon={Hotel}
            color="purple"
            change={`${dashboardData.stats.totalRooms} ห้อง`}
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <QuickActionCard
            title="จัดการการจอง"
            description="ดู แก้ไข และจัดการการจองทั้งหมด"
            icon={Calendar}
            href="/admin/bookings"
            color="blue"
          />
          <QuickActionCard
            title="จัดการผู้ใช้"
            description="จัดการบัญชีผู้ใช้และสิทธิ์การเข้าถึง"
            icon={Users}
            href="/admin/users"
            color="green"
          />
          <QuickActionCard
            title="จัดการห้องพัก"
            description="จัดการห้องพัก ราคา และความพร้อมใช้งาน"
            icon={Bed}
            href="/admin/rooms"
            color="purple"
          />
          <QuickActionCard
            title="รายงานรายได้"
            description="ดูสถิติและรายงานรายได้"
            icon={BarChart3}
            href="/admin/reports"
            color="yellow"
          />
          <QuickActionCard
            title="การตั้งค่า"
            description="จัดการการตั้งค่าระบบและการแจ้งเตือน"
            icon={Settings}
            href="/admin/settings"
            color="gray"
          />
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Recent Bookings */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">การจองล่าสุด</h3>
                <Link
                  href="/admin/bookings"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  ดูทั้งหมด →
                </Link>
              </div>
            </div>
            <div className="p-6">
              {dashboardData.recentBookings.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.recentBookings.slice(0, 5).map((booking, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">
                          {booking.guest_name || 'ไม่ระบุชื่อ'}
                        </p>
                        <p className="text-sm text-gray-600">
                          ห้อง: {booking.room_type_id || 'N/A'} | 
                          วันที่: {booking.check_in_date ? new Date(booking.check_in_date).toLocaleDateString('th-TH') : 'N/A'}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {booking.status === 'confirmed' ? 'ยืนยันแล้ว' :
                         booking.status === 'pending' ? 'รอดำเนินการ' :
                         booking.status === 'cancelled' ? 'ยกเลิก' :
                         booking.status || 'ไม่ระบุ'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>ไม่มีการจองล่าสุด</p>
                </div>
              )}
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">สถานะระบบ</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-gray-900">ฐานข้อมูล</span>
                  </div>
                  <span className="text-green-600 text-sm font-medium">ออนไลน์</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-gray-900">API Server</span>
                  </div>
                  <span className="text-green-600 text-sm font-medium">ทำงานปกติ</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                    <span className="text-gray-900">การชำระเงิน</span>
                  </div>
                  <span className="text-yellow-600 text-sm font-medium">รอตรวจสอบ</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-gray-900">การแจ้งเตือน</span>
                  </div>
                  <span className="text-green-600 text-sm font-medium">เปิดใช้งาน</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Dashboard */}
        <div className="mt-8">
          <PerformanceDashboard />
        </div>
      </div>
    </div>
  );
}

// Stats Card Component
function StatsCard({ title, value, icon: Icon, color, change }) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500',
    gray: 'bg-gray-500'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`flex-shrink-0 ${colorClasses[color]} rounded-md p-3`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">
              {title}
            </dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">
                {value}
              </div>
              {change && (
                <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                  {change}
                </div>
              )}
            </dd>
          </dl>
        </div>
      </div>
    </div>
  );
}

// Quick Action Card Component
function QuickActionCard({ title, description, icon: Icon, href, color }) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    yellow: 'text-yellow-600 bg-yellow-100',
    purple: 'text-purple-600 bg-purple-100',
    red: 'text-red-600 bg-red-100',
    gray: 'text-gray-600 bg-gray-100'
  };

  return (
    <Link href={href} className="block">
      <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${colorClasses[color]} rounded-md p-3`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}