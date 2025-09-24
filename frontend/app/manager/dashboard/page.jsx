'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { isManager } from '../../../lib/permissions';
import { bookingAPI, roomsAPI, userAPI } from '../../../lib/api';
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
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';

export default function ManagerDashboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('today');
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
  }, [isAuthenticated, user, selectedPeriod]);

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

      // Calculate date ranges
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const weekStart = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const yearStart = new Date(now.getFullYear(), 0, 1);
      
      // Previous periods for comparison
      const lastWeekStart = new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);

      // Helper function to filter bookings by date
      const filterBookingsByDate = (bookings, startDate, endDate = null) => {
        return bookings.filter(b => {
          const bookingDate = new Date(b.created_at);
          if (endDate) {
            return bookingDate >= startDate && bookingDate < endDate;
          }
          return bookingDate >= startDate;
        });
      };

      // Calculate current period statistics
      const getPeriodStats = (period) => {
        let currentBookings, previousBookings, currentRevenue, previousRevenue;
        
        switch (period) {
          case 'today':
            currentBookings = filterBookingsByDate(bookings, today);
            previousBookings = filterBookingsByDate(bookings, yesterday, today);
            break;
          case 'week':
            currentBookings = filterBookingsByDate(bookings, weekStart);
            previousBookings = filterBookingsByDate(bookings, lastWeekStart, weekStart);
            break;
          case 'month':
            currentBookings = filterBookingsByDate(bookings, monthStart);
            previousBookings = filterBookingsByDate(bookings, lastMonthStart, monthStart);
            break;
          case 'year':
            currentBookings = filterBookingsByDate(bookings, yearStart);
            previousBookings = filterBookingsByDate(bookings, lastYearStart, yearStart);
            break;
          default:
            currentBookings = filterBookingsByDate(bookings, today);
            previousBookings = filterBookingsByDate(bookings, yesterday, today);
        }

        currentRevenue = currentBookings
          .filter(b => b.status === 'confirmed')
          .reduce((sum, b) => sum + (parseFloat(b.total_price) || 0), 0);
        
        previousRevenue = previousBookings
          .filter(b => b.status === 'confirmed')
          .reduce((sum, b) => sum + (parseFloat(b.total_price) || 0), 0);

        return {
          currentBookings: currentBookings.length,
          previousBookings: previousBookings.length,
          currentRevenue,
          previousRevenue,
          bookingChange: previousBookings.length > 0 
            ? ((currentBookings.length - previousBookings.length) / previousBookings.length * 100)
            : currentBookings.length > 0 ? 100 : 0,
          revenueChange: previousRevenue > 0 
            ? ((currentRevenue - previousRevenue) / previousRevenue * 100)
            : currentRevenue > 0 ? 100 : 0
        };
      };

      const periodStats = getPeriodStats(selectedPeriod);

      // Calculate occupancy rate
      const totalRooms = rooms.length;
      const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
      const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms * 100) : 0;

      // Calculate statistics
      const stats = {
        // Overview statistics
        totalBookings: bookings.length,
        todayBookings: filterBookingsByDate(bookings, today).length,
        weekBookings: filterBookingsByDate(bookings, weekStart).length,
        monthBookings: filterBookingsByDate(bookings, monthStart).length,
        yearBookings: filterBookingsByDate(bookings, yearStart).length,
        
        // Period-specific stats
        periodBookings: periodStats.currentBookings,
        periodRevenue: periodStats.currentRevenue,
        bookingChange: periodStats.bookingChange,
        revenueChange: periodStats.revenueChange,
        
        // Booking status statistics
        pendingBookings: bookings.filter(b => b.status === 'pending').length,
        confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
        cancelledBookings: bookings.filter(b => b.status === 'cancelled').length,
        
        // Room statistics
        totalRooms: rooms.length,
        availableRooms: rooms.filter(r => r.status === 'available').length,
        occupiedRooms: rooms.filter(r => r.status === 'occupied').length,
        maintenanceRooms: rooms.filter(r => r.status === 'maintenance').length,
        cleaningRooms: rooms.filter(r => r.status === 'cleaning').length,
        occupancyRate,
        
        // Revenue statistics
        totalRevenue: bookings
          .filter(b => b.status === 'confirmed')
          .reduce((sum, b) => sum + (parseFloat(b.total_price) || 0), 0),
        todayRevenue: filterBookingsByDate(bookings, today)
          .filter(b => b.status === 'confirmed')
          .reduce((sum, b) => sum + (parseFloat(b.total_price) || 0), 0),
        monthRevenue: filterBookingsByDate(bookings, monthStart)
          .filter(b => b.status === 'confirmed')
          .reduce((sum, b) => sum + (parseFloat(b.total_price) || 0), 0),
        
        // Customer statistics
        totalCustomers: users.filter(u => u.role === 'customer').length,
        totalStaff: users.filter(u => u.role === 'staff').length,
        totalManagers: users.filter(u => u.role === 'manager').length,
        
        // Recent data
        recentBookings: bookings
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 10),
        
        // Room types breakdown
        roomTypeStats: rooms.reduce((acc, room) => {
          const type = room.room_type || 'ไม่ระบุ';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {}),
        
        // Average booking value
        averageBookingValue: bookings.filter(b => b.status === 'confirmed').length > 0
          ? bookings.filter(b => b.status === 'confirmed')
              .reduce((sum, b) => sum + (parseFloat(b.total_price) || 0), 0) / 
            bookings.filter(b => b.status === 'confirmed').length
          : 0
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

  const getPeriodLabel = (period) => {
    switch (period) {
      case 'today': return 'วันนี้';
      case 'week': return 'สัปดาห์นี้';
      case 'month': return 'เดือนนี้';
      case 'year': return 'ปีนี้';
      default: return 'วันนี้';
    }
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

  const StatCard = ({ title, value, icon: Icon, color, change, link, subtitle }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className={`text-3xl font-bold ${color} mt-1`}>{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
          {change && (
            <div className={`flex items-center mt-2 text-sm ${change.positive ? 'text-green-600' : 'text-red-600'}`}>
              {change.positive ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
              <span>{Math.abs(change.value).toFixed(1)}% จากช่วงก่อน</span>
            </div>
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
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                แดชบอร์ดผู้บริหาร
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                ภาพรวมและรายงานข้อมูลของระบบโรงแรม - {getPeriodLabel(selectedPeriod)}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>รีเฟรช</span>
              </button>
              <select 
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="today">วันนี้</option>
                <option value="week">สัปดาห์นี้</option>
                <option value="month">เดือนนี้</option>
                <option value="year">ปีนี้</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title={`การจอง${getPeriodLabel(selectedPeriod)}`}
            value={dashboardData.periodBookings}
            icon={Calendar}
            color="text-blue-600"
            change={{
              positive: dashboardData.bookingChange >= 0,
              value: dashboardData.bookingChange
            }}
            link="/admin/bookings"
          />
          <StatCard
            title={`รายได้${getPeriodLabel(selectedPeriod)}`}
            value={`฿${dashboardData.periodRevenue.toLocaleString()}`}
            icon={DollarSign}
            color="text-green-600"
            change={{
              positive: dashboardData.revenueChange >= 0,
              value: dashboardData.revenueChange
            }}
            subtitle={`เฉลี่ย ฿${dashboardData.averageBookingValue.toLocaleString()} ต่อการจอง`}
            link="/admin/reports"
          />
          <StatCard
            title="อัตราการเข้าพัก"
            value={`${dashboardData.occupancyRate.toFixed(1)}%`}
            icon={Target}
            color="text-purple-600"
            subtitle={`${dashboardData.occupiedRooms}/${dashboardData.totalRooms} ห้อง`}
            link="/admin/rooms"
          />
          <StatCard
            title="ลูกค้าทั้งหมด"
            value={dashboardData.totalCustomers}
            icon={Users}
            color="text-orange-600"
            link="/admin/user-management"
          />
        </div>

        {/* Booking Status Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Activity className="h-5 w-5 mr-2 text-blue-600" />
              สถานะการจอง
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-yellow-600">{dashboardData.pendingBookings}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">รอการอนุมัติ</p>
                <Link 
                  href="/admin/bookings?status=pending"
                  className="text-yellow-600 hover:text-yellow-700 text-xs mt-2 inline-block"
                >
                  จัดการ →
                </Link>
              </div>
              <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-green-600">{dashboardData.confirmedBookings}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">ยืนยันแล้ว</p>
                <Link 
                  href="/admin/bookings?status=confirmed"
                  className="text-green-600 hover:text-green-700 text-xs mt-2 inline-block"
                >
                  ดูรายการ →
                </Link>
              </div>
              <div className="text-center p-6 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-red-600">{dashboardData.cancelledBookings}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">ยกเลิกแล้ว</p>
                <Link 
                  href="/admin/bookings?status=cancelled"
                  className="text-red-600 hover:text-red-700 text-xs mt-2 inline-block"
                >
                  วิเคราะห์ →
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Room Status Overview */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Bed className="h-5 w-5 mr-2 text-purple-600" />
                สถานะห้องพัก
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-gray-700 dark:text-gray-300">ห้องว่าง</span>
                  </div>
                  <span className="text-xl font-bold text-green-600">{dashboardData.availableRooms}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                    <span className="text-gray-700 dark:text-gray-300">ห้องมีผู้พัก</span>
                  </div>
                  <span className="text-xl font-bold text-blue-600">{dashboardData.occupiedRooms}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                    <span className="text-gray-700 dark:text-gray-300">ห้องปรับปรุง</span>
                  </div>
                  <span className="text-xl font-bold text-orange-600">{dashboardData.maintenanceRooms}</span>
                </div>
                {dashboardData.cleaningRooms > 0 && (
                  <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                      <span className="text-gray-700 dark:text-gray-300">ห้องทำความสะอาด</span>
                    </div>
                    <span className="text-xl font-bold text-yellow-600">{dashboardData.cleaningRooms}</span>
                  </div>
                )}
              </div>
              <Link 
                href="/admin/rooms"
                className="block w-full mt-4 text-center py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                จัดการห้องพัก
              </Link>
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <PieChart className="h-5 w-5 mr-2 text-green-600" />
                รายได้ภาพรวม
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <span className="text-gray-700 dark:text-gray-300">วันนี้</span>
                  <span className="text-xl font-bold text-blue-600">฿{dashboardData.todayRevenue.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <span className="text-gray-700 dark:text-gray-300">เดือนนี้</span>
                  <span className="text-xl font-bold text-purple-600">฿{dashboardData.monthRevenue.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <span className="text-gray-700 dark:text-gray-300">รวมทั้งหมด</span>
                  <span className="text-xl font-bold text-green-600">฿{dashboardData.totalRevenue.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">ค่าเฉลี่ยต่อการจอง</span>
                    <span className="font-medium text-gray-900 dark:text-white">฿{dashboardData.averageBookingValue.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <Link 
                href="/admin/reports"
                className="block w-full mt-4 text-center py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                ดูรายงานรายได้
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
                  <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        การจอง #{booking.id}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {booking.customer_name || 'ไม่ระบุชื่อ'} • ฿{parseFloat(booking.total_price || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      {getStatusBadge(booking.status)}
                      <Link 
                        href={`/admin/bookings`}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">ไม่มีการจองล่าสุด</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">การจัดการด่วน</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link 
              href="/admin/bookings"
              className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <Calendar className="h-6 w-6 text-blue-600 mr-3" />
              <span className="font-medium text-gray-900 dark:text-white">จัดการการจอง</span>
            </Link>
            <Link 
              href="/admin/rooms"
              className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
            >
              <Bed className="h-6 w-6 text-green-600 mr-3" />
              <span className="font-medium text-gray-900 dark:text-white">จัดการห้องพัก</span>
            </Link>
            <Link 
              href="/admin/reports"
              className="flex items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
            >
              <FileText className="h-6 w-6 text-purple-600 mr-3" />
              <span className="font-medium text-gray-900 dark:text-white">รายงาน</span>
            </Link>
            <Link 
              href="/admin/user-management"
              className="flex items-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
            >
              <Users className="h-6 w-6 text-orange-600 mr-3" />
              <span className="font-medium text-gray-900 dark:text-white">จัดการผู้ใช้</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}