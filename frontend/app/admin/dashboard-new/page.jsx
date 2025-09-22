'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { dashboardAPI, usersAPI } from '../../../lib/api';
import { isStaffOrAdmin, canEdit, canDelete, canCreate, isReadOnly } from '../../../lib/roles';
import Link from 'next/link';
import { 
  Calendar, 
  Users, 
  CreditCard, 
  TrendingUp, 
  Hotel,
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
  MapPin
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      // การจอง
      totalBookings: 0,
      pendingBookings: 0,
      confirmedBookings: 0,
      completedBookings: 0,
      cancelledBookings: 0,
      
      // ผู้ใช้
      totalUsers: 0,
      newUsersThisMonth: 0,
      activeUsers: 0,
      
      // รายได้
      totalRevenue: 0,
      monthlyRevenue: 0,
      revenueGrowth: 0,
      
      // โรงแรม
      totalHotels: 0,
      totalRooms: 0,
      occupancyRate: 0,
      
      // รีวิว
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

  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({
    dateRange: '30', // 7, 30, 90 days
    status: 'all',
    search: ''
  });

  useEffect(() => {
    if (isAuthenticated && isStaffOrAdmin(user)) {
      fetchDashboardData();
    }
  }, [isAuthenticated, user, filters.dateRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching comprehensive dashboard data...');

      // Use the new dashboard API
      const dashboardResponse = await dashboardAPI.getStats({
        days: filters.dateRange
      });

      console.log('✅ Dashboard API response:', dashboardResponse);

      // Extract data from response
      const stats = dashboardResponse.stats || {};
      const recentBookings = dashboardResponse.recentBookings || [];
      const topHotels = dashboardResponse.topHotels || [];

      // Get recent users separately (if needed)
      let recentUsers = [];
      try {
        const usersResponse = await usersAPI.getUsers({ limit: 5 });
        recentUsers = usersResponse.users || [];
      } catch (error) {
        console.log('Could not fetch recent users:', error.message);
      }

      setDashboardData({
        stats,
        recentBookings,
        recentUsers,
        recentReviews: [], // Placeholder
        topHotels,
        revenueChart: dashboardResponse.bookingTrends || [],
        bookingChart: dashboardResponse.bookingTrends || [],
      });

      console.log('✅ Dashboard data loaded:', stats);

    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      toast.error('ไม่สามารถโหลดข้อมูลแดชบอร์ดได้: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    fetchDashboardData();
    toast.success('ข้อมูลได้รับการอัปเดตแล้ว');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">กรุณาเข้าสู่ระบบ</h2>
          <p className="text-gray-600">เพื่อเข้าถึงแดชบอร์ดแอดมิน</p>
        </div>
      </div>
    );
  }

  if (!isStaffOrAdmin(user)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">ไม่มีสิทธิ์เข้าถึง</h2>
          <p className="text-gray-600">คุณไม่มีสิทธิ์เข้าถึงแดชบอร์ดนี้</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูลแดชบอร์ด...</p>
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
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                รีเฟรช
              </button>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                className="rounded-md border-gray-300 text-sm"
              >
                <option value="7">7 วันล่าสุด</option>
                <option value="30">30 วันล่าสุด</option>
                <option value="90">90 วันล่าสุด</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'ภาพรวม', icon: BarChart3 },
              { id: 'bookings', label: 'การจอง', icon: Calendar },
              { id: 'users', label: 'ผู้ใช้', icon: Users },
              { id: 'hotels', label: 'โรงแรม', icon: Hotel },
              { id: 'reports', label: 'รายงาน', icon: FileText },
              { id: 'settings', label: 'ตั้งค่า', icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <OverviewTab 
            data={dashboardData} 
            user={user}
          />
        )}
        
        {activeTab === 'bookings' && (
          <BookingsTab 
            bookings={dashboardData.recentBookings}
            stats={dashboardData.stats}
            user={user}
          />
        )}
        
        {activeTab === 'users' && (
          <UsersTab 
            users={dashboardData.recentUsers}
            stats={dashboardData.stats}
            user={user}
          />
        )}
        
        {activeTab === 'hotels' && (
          <HotelsTab 
            hotels={dashboardData.topHotels}
            stats={dashboardData.stats}
            user={user}
          />
        )}
        
        {activeTab === 'reports' && (
          <ReportsTab 
            data={dashboardData}
            user={user}
          />
        )}
        
        {activeTab === 'settings' && (
          <SettingsTab user={user} />
        )}
      </div>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ data, user }) {


  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="การจองทั้งหมด"
          value={data.stats.totalBookings}
          icon={Calendar}
          color="blue"
          change="+12%"
        />
        <StatsCard
          title="ผู้ใช้งาน"
          value={data.stats.totalUsers}
          icon={Users}
          color="green"
          change="+8%"
        />
        <StatsCard
          title="รายได้รวม"
          value={`฿${data.stats.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          color="purple"
          change="+15%"
        />
        <StatsCard
          title="อัตราเข้าพัก"
          value={`${data.stats.occupancyRate}%`}
          icon={Hotel}
          color="orange"
          change="+5%"
        />
      </div>



      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Bookings */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">การจองล่าสุด</h3>
            <Link 
              href="/admin/bookings"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              ดูทั้งหมด →
            </Link>
          </div>
          <div className="space-y-3">
            {data.recentBookings.slice(0, 5).map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{booking.guestName}</p>
                  <p className="text-sm text-gray-600">{booking.hotelName}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {booking.status}
                  </span>
                  <p className="text-sm text-gray-600 mt-1">
                    ฿{booking.totalPrice?.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Hotels */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">โรงแรมยอดนิยม</h3>
            <Link 
              href="/admin/hotels"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              ดูทั้งหมด →
            </Link>
          </div>
          <div className="space-y-3">
            {data.topHotels.map((hotel, index) => (
              <div key={hotel.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <span className="w-6 h-6 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center mr-3">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">{hotel.name}</p>
                    <p className="text-sm text-gray-600">{hotel.location}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{hotel.bookingCount} การจอง</p>
                  <p className="text-sm text-gray-600">฿{hotel.revenue?.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
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
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`w-12 h-12 ${colorClasses[color]} rounded-lg flex items-center justify-center`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="flex items-center">
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            {change && (
              <span className="ml-2 text-sm font-medium text-green-600">{change}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}



// Placeholder components for other tabs
function BookingsTab({ bookings, stats, user }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">จัดการการจอง</h2>
        <Link 
          href="/admin/bookings"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          ไปยังหน้าการจอง
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-600">รอดำเนินการ</h3>
          <p className="text-2xl font-bold text-blue-900">{stats.pendingBookings}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-600">ยืนยันแล้ว</h3>
          <p className="text-2xl font-bold text-green-900">{stats.confirmedBookings}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-purple-600">เสร็จสิ้น</h3>
          <p className="text-2xl font-bold text-purple-900">{stats.completedBookings}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-red-600">ยกเลิก</h3>
          <p className="text-2xl font-bold text-red-900">{stats.cancelledBookings}</p>
        </div>
      </div>

      <div className="text-center py-8">
        <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">การจัดการการจองโดยละเอียดอยู่ในหน้าแยก</p>
        <Link 
          href="/admin/bookings"
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          คลิกที่นี่เพื่อจัดการการจอง →
        </Link>
      </div>
    </div>
  );
}

function UsersTab({ users, stats, user }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">จัดการผู้ใช้งาน</h2>
        <Link 
          href="/admin/users"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          ไปยังหน้าผู้ใช้
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-600">ผู้ใช้ทั้งหมด</h3>
          <p className="text-2xl font-bold text-blue-900">{stats.totalUsers}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-600">ใหม่เดือนนี้</h3>
          <p className="text-2xl font-bold text-green-900">{stats.newUsersThisMonth}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-purple-600">ผู้ใช้งานทั่วไป</h3>
          <p className="text-2xl font-bold text-purple-900">{stats.activeUsers}</p>
        </div>
      </div>

      <div className="text-center py-8">
        <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">การจัดการผู้ใช้งานโดยละเอียดอยู่ในหน้าแยก</p>
        <Link 
          href="/admin/users"
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          คลิกที่นี่เพื่อจัดการผู้ใช้ →
        </Link>
      </div>
    </div>
  );
}

function HotelsTab({ hotels, stats, user }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">จัดการโรงแรม</h2>
        <Link 
          href="/admin/hotels"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          ไปยังหน้าโรงแรม
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-600">โรงแรมทั้งหมด</h3>
          <p className="text-2xl font-bold text-blue-900">{stats.totalHotels}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-600">ห้องทั้งหมด</h3>
          <p className="text-2xl font-bold text-green-900">{stats.totalRooms}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-purple-600">อัตราเข้าพัก</h3>
          <p className="text-2xl font-bold text-purple-900">{stats.occupancyRate}%</p>
        </div>
      </div>

      <div className="text-center py-8">
        <Hotel className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">การจัดการโรงแรมโดยละเอียดอยู่ในหน้าแยก</p>
        <Link 
          href="/admin/hotels"
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          คลิกที่นี่เพื่อจัดการโรงแรม →
        </Link>
      </div>
    </div>
  );
}

function ReportsTab({ data, user }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">รายงานและวิเคราะห์</h2>
        <Link 
          href="/admin/reports"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          ไปยังหน้ารายงาน
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">รายงานรายได้</h3>
          <p className="text-gray-600 mb-4">วิเคราะห์รายได้และแนวโน้มการเติบโต</p>
          <Link 
            href="/admin/reports?type=revenue"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ดูรายงาน →
          </Link>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">รายงานการจอง</h3>
          <p className="text-gray-600 mb-4">สถิติการจองและพฤติกรรมลูกค้า</p>
          <Link 
            href="/admin/reports?type=bookings"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ดูรายงาน →
          </Link>
        </div>
      </div>
    </div>
  );
}

function SettingsTab({ user }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">การตั้งค่าระบบ</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">การตั้งค่าทั่วไป</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">ชื่อระบบ</label>
              <input 
                type="text" 
                defaultValue="ระบบจองโรงแรม"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">อีเมลแอดมิน</label>
              <input 
                type="email" 
                defaultValue={user?.email}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              />
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">การแจ้งเตือน</h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <input type="checkbox" defaultChecked className="mr-3" />
              <label className="text-sm text-gray-700">แจ้งเตือนการจองใหม่</label>
            </div>
            <div className="flex items-center">
              <input type="checkbox" defaultChecked className="mr-3" />
              <label className="text-sm text-gray-700">แจ้งเตือนการยกเลิก</label>
            </div>
            <div className="flex items-center">
              <input type="checkbox" className="mr-3" />
              <label className="text-sm text-gray-700">รายงานประจำวัน</label>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
          บันทึกการตั้งค่า
        </button>
      </div>
    </div>
  );
}
