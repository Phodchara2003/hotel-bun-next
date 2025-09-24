'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { isManager } from '../../lib/permissions';
import { bookingAPI, roomsAPI, userAPI } from '../../lib/api';
import { 
  BarChart3, 
  Users, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Eye,
  FileText,
  Bed,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Hotel,
  UserCheck,
  Star,
  Download,
  Filter,
  Search,
  PieChart,
  Activity,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Settings,
  Bell,
  Shield,
  Zap
} from 'lucide-react';
import Link from 'next/link';

export default function ManagerHomePage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Redirect if not manager
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isManager(user))) {
      window.location.href = '/';
    }
  }, [user, isAuthenticated, authLoading]);

  // Fetch dashboard data
  useEffect(() => {
    if (isAuthenticated && isManager(user)) {
      fetchDashboardData();
    }
  }, [isAuthenticated, user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Initialize with fallback data
      let bookings = [];
      let rooms = [];
      let users = [];
      
      // Fetch data with individual error handling
      try {
        const bookingsRes = await bookingAPI.getBookings();
        bookings = bookingsRes.data || bookingsRes || [];
      } catch (error) {
        console.log('Warning: Could not fetch bookings:', error.message);
      }
      
      try {
        const roomsRes = await roomsAPI.getAllRooms();
        rooms = roomsRes.data || roomsRes || [];
      } catch (error) {
        console.log('Warning: Could not fetch rooms:', error.message);
      }

      try {
        const usersRes = await userAPI.getAllUsers();
        users = usersRes.data || usersRes || [];
      } catch (error) {
        console.log('Warning: Could not fetch users:', error.message);
      }

      // Calculate today's statistics
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      const todayBookings = bookings.filter(b => {
        const bookingDate = new Date(b.created_at);
        return bookingDate >= todayStart;
      });

      // Calculate occupancy rate
      const totalRooms = rooms.length;
      const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
      const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms * 100) : 0;

      // Calculate statistics
      const stats = {
        // Today's statistics
        todayBookings: todayBookings.length,
        todayRevenue: todayBookings
          .filter(b => b.status === 'confirmed')
          .reduce((sum, b) => sum + (parseFloat(b.total_price) || 0), 0),
        
        // Overall statistics
        totalBookings: bookings.length,
        pendingBookings: bookings.filter(b => b.status === 'pending').length,
        confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
        
        // Room statistics
        totalRooms: rooms.length,
        availableRooms: rooms.filter(r => r.status === 'available').length,
        occupiedRooms: rooms.filter(r => r.status === 'occupied').length,
        occupancyRate,
        
        // Customer statistics
        totalCustomers: users.filter(u => u.role === 'customer').length,
        totalStaff: users.filter(u => u.role === 'staff').length,
        
        // Recent bookings
        recentBookings: bookings
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5)
      };

      setDashboardData(stats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
  };

  if (authLoading || !isAuthenticated || !isManager(user)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (loading || !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-300 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-300 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const QuickStatCard = ({ title, value, icon: Icon, color, link, subtitle }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className={`text-3xl font-bold ${color} mt-1`}>{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color.replace('text-', 'bg-').replace('600', '100')} dark:bg-opacity-20`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
      </div>
      {link && (
        <Link 
          href={link}
          className="mt-4 inline-flex items-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors"
        >
          ดูรายละเอียด <Eye className="ml-1 h-4 w-4" />
        </Link>
      )}
    </div>
  );

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      confirmed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    };
    
    const labels = {
      pending: 'รอการอนุมัติ',
      confirmed: 'ยืนยันแล้ว',
      cancelled: 'ยกเลิก'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status] || badges.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-4">
                ยินดีต้อนรับ, {user?.name || 'ผู้บริหาร'}
              </h1>
              <p className="text-xl text-blue-100 mb-6">
                ระบบจัดการโรงแรมสำหรับผู้บริหาร - ควบคุมและติดตามการดำเนินงานได้ทุกที่ทุกเวลา
              </p>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  <span>วันนี้: {new Date().toLocaleDateString('th-TH')}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  <span>{new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm flex items-center space-x-2 transition-all"
              >
                <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>รีเฟรชข้อมูล</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Today's Key Metrics */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">สถิติวันนี้</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <QuickStatCard
              title="การจองวันนี้"
              value={dashboardData.todayBookings}
              icon={Calendar}
              color="text-blue-600"
              link="/manager/dashboard"
              subtitle="การจองใหม่"
            />
            <QuickStatCard
              title="รายได้วันนี้"
              value={`฿${dashboardData.todayRevenue.toLocaleString()}`}
              icon={DollarSign}
              color="text-green-600"
              link="/manager/dashboard"
              subtitle="จากการจองที่ยืนยัน"
            />
            <QuickStatCard
              title="อัตราการเข้าพัก"
              value={`${dashboardData.occupancyRate.toFixed(1)}%`}
              icon={Target}
              color="text-purple-600"
              link="/admin/rooms"
              subtitle={`${dashboardData.occupiedRooms}/${dashboardData.totalRooms} ห้อง`}
            />
            <QuickStatCard
              title="รอการอนุมัติ"
              value={dashboardData.pendingBookings}
              icon={AlertTriangle}
              color="text-orange-600"
              link="/admin/bookings?status=pending"
              subtitle="ต้องการดำเนินการ"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Management Quick Access */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Zap className="h-5 w-5 mr-2 text-yellow-600" />
                การจัดการด่วน
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-4">
                <Link 
                  href="/admin/bookings"
                  className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors group"
                >
                  <div className="flex items-center">
                    <Calendar className="h-6 w-6 text-blue-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">จัดการการจอง</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {dashboardData.pendingBookings} รายการรอการอนุมัติ
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-blue-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </Link>

                <Link 
                  href="/admin/rooms"
                  className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors group"
                >
                  <div className="flex items-center">
                    <Bed className="h-6 w-6 text-green-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">จัดการห้องพัก</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {dashboardData.availableRooms} ห้องว่าง จาก {dashboardData.totalRooms} ห้อง
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-green-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </Link>

                <Link 
                  href="/manager/dashboard"
                  className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors group"
                >
                  <div className="flex items-center">
                    <BarChart3 className="h-6 w-6 text-purple-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">แดชบอร์ดเต็ม</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        วิเคราะห์ข้อมูลแบบละเอียด
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-purple-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </Link>

                <Link 
                  href="/admin/user-management"
                  className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors group"
                >
                  <div className="flex items-center">
                    <Users className="h-6 w-6 text-orange-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">จัดการผู้ใช้</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {dashboardData.totalCustomers} ลูกค้า, {dashboardData.totalStaff} พนักงาน
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-orange-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">การจองล่าสุด</h3>
                <Link 
                  href="/admin/bookings"
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm font-medium"
                >
                  ดูทั้งหมด
                </Link>
              </div>
            </div>
            <div className="p-6">
              {dashboardData.recentBookings.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.recentBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          การจอง #{booking.id}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {booking.customer_name || 'ไม่ระบุชื่อ'} • ฿{parseFloat(booking.total_price || 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(booking.status)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">ไม่มีการจองล่าสุด</p>
              )}
            </div>
          </div>
        </div>

        {/* System Status & Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Settings className="h-5 w-5 mr-2 text-gray-600" />
            ระบบและการตั้งค่า
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">ระบบพร้อมใช้งาน</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">ทุกฟีเจอร์ทำงานปกติ</p>
              </div>
            </div>
            <div className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Shield className="h-6 w-6 text-blue-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">ความปลอดภัย</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">ข้อมูลได้รับการรักษา</p>
              </div>
            </div>
            <div className="flex items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <Bell className="h-6 w-6 text-purple-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">การแจ้งเตือน</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">เปิดใช้งานแล้ว</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}