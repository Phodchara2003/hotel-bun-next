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

  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    dateRange: '30', // 7, 30, 90 days
    status: 'all',
    search: ''
  });

  // States for booking edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [editFormData, setEditFormData] = useState({
    guestName: '',
    guestPhone: '',
    guestEmail: '',
    checkInDate: '',
    checkOutDate: '',
    guests: 1,
    specialRequests: '',
    status: 'pending'
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Define fetchUsers with useCallback to prevent dependency issues
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching users data...');
      
      const token = Cookies.get('auth_token');
      if (!token) {
        toast.error('ไม่พบ token การเข้าสู่ระบบ');
        return;
      }

      // Store token for usage tracking
      sessionStorage.setItem('last_users_fetch_token', token);
      sessionStorage.setItem('last_users_fetch_time', new Date().toISOString());

      const response = await usersAPI.getUsers();
      console.log('👥 Users API Response:', response);
      
      if (response?.users) {
        // Process users data to add full name
        const processedUsers = response.users.map(user => ({
          ...user,
          name: user.first_name && user.last_name ? 
            `${user.first_name} ${user.last_name}` : 
            user.first_name || user.last_name || user.email || 'ไม่ระบุชื่อ'
        }));
        
        setAllUsers(processedUsers);
        console.log('✅ Users loaded:', processedUsers.length);
        
        // Calculate user statistics
        const totalUsers = processedUsers.length;
        const adminUsers = processedUsers.filter(u => u.role === 'admin').length;
        const staffUsers = processedUsers.filter(u => u.role === 'staff').length;
        const regularUsers = processedUsers.filter(u => u.role === 'user' || !u.role).length;
        const newUsersThisMonth = processedUsers.filter(u => {
          const createdDate = new Date(u.created_at);
          const thisMonth = new Date();
          return createdDate.getMonth() === thisMonth.getMonth() && 
                 createdDate.getFullYear() === thisMonth.getFullYear();
        }).length;

        setUserStats({
          totalUsers,
          newUsersThisMonth,
          activeUsers: totalUsers, // Assuming all users are active for now
          adminUsers,
          staffUsers,
          regularUsers
        });

        console.log('✅ Users data loaded:', totalUsers, 'users');
        toast.success(`โหลดข้อมูลผู้ใช้สำเร็จ (${totalUsers} คน)`);
      }
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      toast.error('ไม่สามารถโหลดข้อมูลผู้ใช้ได้');
      
      // Store error info with token
      sessionStorage.setItem('users_fetch_error', JSON.stringify({
        error: error.message,
        timestamp: new Date().toISOString(),
        token: Cookies.get('auth_token')
      }));
    } finally {
      setLoading(false);
    }
  }, []);

  // Main data fetching effect - only run when necessary
  useEffect(() => {
    if (isAuthenticated && isStaffOrAdmin(user)) {
      fetchDashboardData();
    }
  }, [isAuthenticated, user]); // Remove filters.dateRange to prevent excessive calls

  // Separate effect for date range changes
  useEffect(() => {
    if (isAuthenticated && isStaffOrAdmin(user) && filters.dateRange) {
      // Debounce the API call
      const timeoutId = setTimeout(() => {
        fetchDashboardData();
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  }, [filters.dateRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Fetching comprehensive dashboard data...');

      // Use the enhanced dashboard API with retry logic
      const dashboardResponse = await dashboardAPI.getStats({
        days: filters.dateRange
      });

      console.log('✅ Dashboard API response:', dashboardResponse);

      // Extract data from response with fallbacks
      const stats = dashboardResponse.stats || {
        totalBookings: 0,
        pendingBookings: 0,
        confirmedBookings: 0,
        completedBookings: 0,
        cancelledBookings: 0,
        totalUsers: 0,
        newUsersThisMonth: 0,
        activeUsers: 0,
        staffUsers: 0,
        adminUsers: 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
        revenueGrowth: 0,
        totalHotels: 0,
        totalRooms: 0,
        occupancyRate: 0,
        totalReviews: 0,
        averageRating: 0,
      };
      
      const recentBookings = dashboardResponse.recentBookings || [];
      const topHotels = dashboardResponse.topHotels || [];

      // ใช้ข้อมูลจาก dashboard stats โดยตรง ไม่ต้องเรียก APIs เพิ่ม
      const recentUsers = dashboardResponse.recentBookings || [];
      const revenueData = { 
        daily: [], 
        monthly: [],
        totalRevenue: dashboardResponse.overview?.totalRevenue || 0
      };
      const userAnalytics = { 
        registrations: [], 
        activeUsers: dashboardResponse.overview?.newUsers || 0, 
        totalUsers: dashboardResponse.overview?.totalBookings || 0 
      };

      // Set comprehensive dashboard data
      setDashboardData({
        stats: {
          ...stats,
          // Ensure all numeric fields are properly formatted
          totalBookings: Number(stats.totalBookings) || 0,
          pendingBookings: Number(stats.pendingBookings) || 0,
          confirmedBookings: Number(stats.confirmedBookings) || 0,
          completedBookings: Number(stats.completedBookings) || 0,
          cancelledBookings: Number(stats.cancelledBookings) || 0,
          totalUsers: Number(stats.totalUsers) || 0,
          newUsersThisMonth: Number(stats.newUsersThisMonth) || 0,
          activeUsers: Number(stats.activeUsers) || 0,
          staffUsers: Number(stats.staffUsers) || 0,
          adminUsers: Number(stats.adminUsers) || 0,
          totalRevenue: Number(stats.totalRevenue) || 0,
          monthlyRevenue: Number(stats.monthlyRevenue) || 0,
          revenueGrowth: Number(stats.revenueGrowth) || 0,
          totalHotels: Number(stats.totalHotels) || 0,
          totalRooms: Number(stats.totalRooms) || 0,
          occupancyRate: Math.min(100, Math.max(0, Number(stats.occupancyRate) || 0)),
          totalReviews: Number(stats.totalReviews) || 0,
          averageRating: Number(stats.averageRating) || 0,
        },
        recentBookings: recentBookings.slice(0, 5), // Limit to 5 items
        recentUsers: recentUsers.slice(0, 5), // Limit to 5 items
        recentReviews: [], // Placeholder for future implementation
        topHotels: topHotels.slice(0, 5), // Limit to 5 items
        revenueChart: revenueData.daily || dashboardResponse.bookingTrends || [],
        bookingChart: dashboardResponse.bookingTrends || [],
        userAnalytics: userAnalytics,
        revenueAnalytics: revenueData,
      });

      console.log('✅ Comprehensive dashboard data loaded successfully:', {
        totalBookings: stats.totalBookings,
        totalUsers: stats.totalUsers,
        totalRevenue: stats.totalRevenue,
        recentBookingsCount: recentBookings.length,
        topHotelsCount: topHotels.length
      });

      // Show success toast if this is a manual refresh
      if (window.dashboardRefreshManual) {
        toast.success('Dashboard data refreshed successfully!');
        window.dashboardRefreshManual = false;
      }

    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      
      // Set detailed error information
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred';
      const errorDetails = {
        status: error.response?.status,
        message: errorMessage,
        timestamp: new Date().toISOString()
      };
      
      setError(errorDetails);
      
      // Show user-friendly error messages
      if (error.response?.status === 401) {
        toast.error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
      } else if (error.response?.status === 403) {
        toast.error('ไม่มีสิทธิ์ในการเข้าถึงข้อมูลนี้');
      } else if (error.response?.status >= 500) {
        toast.error('เซิร์ฟเวอร์มีปัญหา กรุณาลองใหม่ในภายหลัง');
      } else if (!error.response) {
        toast.error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
      } else {
        toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      }
      
      // Set fallback data so the dashboard doesn't break
      setDashboardData({
        stats: {
          totalBookings: 0,
          pendingBookings: 0,
          confirmedBookings: 0,
          completedBookings: 0,
          cancelledBookings: 0,
          totalUsers: 0,
          newUsersThisMonth: 0,
          activeUsers: 0,
          staffUsers: 0,
          adminUsers: 0,
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
        userAnalytics: { registrations: [], activeUsers: 0, totalUsers: 0 },
        revenueAnalytics: { daily: [], monthly: [] },
      });
      
    } finally {
      setLoading(false);
    }
  };

  // Manual refresh function with user feedback
  const refreshData = () => {
    window.dashboardRefreshManual = true; // Flag for success toast
    fetchDashboardData();
  };

  // ฟังก์ชันสำหรับเปิด modal แก้ไขการจอง
  const openEditModal = (booking) => {
    setSelectedBooking(booking);
    setEditFormData({
      guestName: booking.guest_name || '',
      guestPhone: booking.guest_phone || '',
      guestEmail: booking.guest_email || '',
      checkInDate: booking.check_in_date || '',
      checkOutDate: booking.check_out_date || '',
      guests: booking.guests || 1,
      specialRequests: booking.special_requests || '',
      status: booking.status || 'pending'
    });
    setEditModalOpen(true);
  };

  // ฟังก์ชันสำหรับปิด modal
  const closeEditModal = () => {
    setEditModalOpen(false);
    setSelectedBooking(null);
    setEditFormData({
      guestName: '',
      guestPhone: '',
      guestEmail: '',
      checkInDate: '',
      checkOutDate: '',
      guests: 1,
      specialRequests: '',
      status: 'pending'
    });
  };

  // ฟังก์ชันสำหรับอัปเดตข้อมูลการจอง
  const handleUpdateBooking = async () => {
    if (!selectedBooking || !selectedBooking.id) {
      toast.error('ไม่พบข้อมูลการจองที่ต้องการแก้ไข');
      return;
    }

    setIsUpdating(true);
    try {
      // ใช้ bookingAPI.updateStatus สำหรับการอัปเดต (เพิ่มเติมในอนาคต)
      const updateData = {
        status: editFormData.status,
        guestName: editFormData.guestName,
        guestPhone: editFormData.guestPhone,
        guestEmail: editFormData.guestEmail,
        checkInDate: editFormData.checkInDate,
        checkOutDate: editFormData.checkOutDate,
        guests: parseInt(editFormData.guests),
        specialRequests: editFormData.specialRequests
      };

      // อัปเดตสถานะการจอง
      await bookingAPI.updateStatus(selectedBooking.id, editFormData.status);
      
      toast.success('อัปเดตข้อมูลการจองเรียบร้อยแล้ว');
      closeEditModal();
      
      // รีเฟรชข้อมูล
      fetchDashboardData();
      
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('เกิดข้อผิดพลาดในการอัปเดตข้อมูล: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsUpdating(false);
    }
  };

  // ฟังก์ชันสำหรับลบการจอง
  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm('คุณแน่ใจว่าต้องการลบการจองนี้?')) {
      return;
    }

    try {
      await bookingAPI.deleteBooking(bookingId);
      toast.success('ลบการจองเรียบร้อยแล้ว');
      
      // รีเฟรชข้อมูล
      fetchDashboardData();
      
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast.error('เกิดข้อผิดพลาดในการลบข้อมูล: ' + (error.response?.data?.error || error.message));
    }
  };

  // Auto-refresh setup
  useEffect(() => {
    if (!isAuthenticated || !isStaffOrAdmin(user)) return;

    // Set up auto-refresh every 5 minutes
    const autoRefreshInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing dashboard data...');
      fetchDashboardData();
    }, 5 * 60 * 1000); // 5 minutes

    // Cleanup interval on unmount
    return () => {
      clearInterval(autoRefreshInterval);
    };
  }, [isAuthenticated, user]);

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Token validation check
  useEffect(() => {
    const checkTokenValidity = () => {
      const token = Cookies.get('auth_token');
      if (token) {
        try {
          const tokenPayload = JSON.parse(atob(token.split('.')[1]));
          const currentTime = Math.floor(Date.now() / 1000);
          const timeUntilExpiry = tokenPayload.exp - currentTime;
          
          // Session warnings disabled to prevent screen blocking
          // Warn if token expires in less than 10 minutes
          if (false && timeUntilExpiry < 600 && timeUntilExpiry > 0) {
            toast.warning('เซสชันจะหมดอายุในอีก ' + Math.floor(timeUntilExpiry / 60) + ' นาที');
          }
        } catch (error) {
          console.log('Could not check token validity:', error);
        }
      }
    };

    // Check token validity every minute
    const tokenCheckInterval = setInterval(checkTokenValidity, 60 * 1000);
    
    return () => clearInterval(tokenCheckInterval);
  }, []);

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
              <Link
                href="/admin/profile"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <User className="h-4 w-4 mr-2" />
                โปรไฟล์
              </Link>
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <OverviewTab 
          data={dashboardData} 
          user={user}
        />








      </div>

      {/* Performance Dashboard Component */}
      <PerformanceDashboard />
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ data, user }) {
  const quickActions = [
    {
      title: 'จัดการการจอง',
      description: 'ดูและจัดการการจองทั้งหมด',
      icon: Calendar,
      href: '/admin/bookings',
      color: 'blue',
      count: data.stats.pendingBookings,
      label: 'รอดำเนินการ'
    },
    {
      title: 'ข้อมูลการจองแบบละเอียด',
      description: 'ดูข้อมูลการจองพร้อมรูปภาพและรายละเอียดครบถ้วน',
      icon: FileText,
      href: '/admin/bookings/detailed',
      color: 'indigo',
      count: data.stats.totalBookings,
      label: 'การจองทั้งหมด'
    },
    {
      title: 'จัดการผู้ใช้',
      description: 'เพิ่ม แก้ไข ลบผู้ใช้งาน',
      icon: Users,
      href: '/admin/users',
      color: 'green',
      count: data.stats.newUsersThisMonth,
      label: 'ใหม่เดือนนี้'
    },
    {
      title: 'จัดการห้องพัก',
      description: 'เพิ่ม แก้ไข ลบห้องพัก และจัดการประเภทห้อง',
      icon: Bed,
      href: '/admin/rooms',
      color: 'emerald',
      count: data.stats.totalRooms,
      label: 'ห้องทั้งหมด'
    },
    {
      title: 'จัดการโรงแรม',
      description: 'เพิ่มและแก้ไขข้อมูลโรงแรม',
      icon: Hotel,
      href: '/admin/hotels',
      color: 'purple',
      count: data.stats.totalHotels,
      label: 'โรงแรมทั้งหมด'
    },
    {
      title: 'รายงานรายได้',
      description: 'ดูรายงานและวิเคราะห์ข้อมูล',
      icon: TrendingUp,
      href: '/admin/reports',
      color: 'orange',
      count: `฿${(data.stats.monthlyRevenue/1000).toFixed(0)}K`,
      label: 'เดือนนี้'
    }
  ];

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

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">การจัดการด่วน</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => (
            <QuickActionCard key={index} action={action} />
          ))}
        </div>
      </div>

      {/* Token Status */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">สถานะระบบ</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <TokenStatus />
          
          {/* System Status */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-green-500" />
                <h3 className="text-sm font-medium text-gray-900">สถานะเซิร์ฟเวอร์</h3>
              </div>
              <div className="flex items-center space-x-2 text-green-500">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">ปกติ</span>
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-500">
              เซิร์ฟเวอร์ทำงานปกติ - อัปเดตล่าสุด: {new Date().toLocaleTimeString('th-TH')}
            </div>
          </div>

          {/* Connection Status */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-blue-500" />
                <h3 className="text-sm font-medium text-gray-900">การเชื่อมต่อ</h3>
              </div>
              <div className="flex items-center space-x-2 text-green-500">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">เชื่อมต่อแล้ว</span>
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-500">
              API เชื่อมต่อสำเร็จ - Ping: &lt;50ms
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Bookings */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">การจองล่าสุด</h3>
            <div className="flex space-x-3">
              <Link 
                href="/admin/bookings/detailed"
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                ดูแบบละเอียด
              </Link>
              <Link 
                href="/admin/bookings"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                ดูทั้งหมด →
              </Link>
            </div>
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

// Quick Action Card Component
function QuickActionCard({ action }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
  };

  return (
    <Link href={action.href}>
      <div className={`p-6 rounded-lg border-2 ${colorClasses[action.color]} hover:shadow-md transition-shadow cursor-pointer`}>
        <div className="flex items-center justify-between mb-4">
          <action.icon className="h-8 w-8" />
          <div className="text-right">
            <p className="text-2xl font-bold">{action.count}</p>
            <p className="text-sm opacity-75">{action.label}</p>
          </div>
        </div>
        <h3 className="font-semibold text-gray-900 mb-2">{action.title}</h3>
        <p className="text-sm text-gray-600">{action.description}</p>
      </div>
    </Link>
  );
}

// Users Tab Component with Full Management
function UsersTab({ users, stats, user }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userStats, setUserStats] = useState({
    totalUsers: stats.totalUsers || 0,
    newUsersThisMonth: stats.newUsersThisMonth || 0,
    activeUsers: stats.activeUsers || 0,
    adminUsers: 0,
    staffUsers: 0,
    regularUsers: 0
  });

  // Handle user actions
  const handleCreateUser = async (userData) => {
    try {
      setLoading(true);
      const response = await usersAPI.createUser(userData);
      if (response?.success) {
        toast.success('เพิ่มผู้ใช้สำเร็จ');
        await fetchUsers(); // Refresh list
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('ไม่สามารถเพิ่มผู้ใช้ได้');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (userData) => {
    setEditingUser(userData);
    setShowEditModal(true);
  };

  const handleUpdateUser = async (updatedData) => {
    try {
      setLoading(true);
      const response = await usersAPI.updateUser(editingUser.id, updatedData);
      if (response?.success) {
        toast.success('อัปเดตผู้ใช้สำเร็จ');
        await fetchUsers(); // Refresh list
        setShowEditModal(false);
        setEditingUser(null);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('ไม่สามารถอัปเดตผู้ใช้ได้');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบผู้ใช้ "${userName}"?`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await usersAPI.deleteUser(userId);
      if (response?.success) {
        toast.success('ลบผู้ใช้สำเร็จ');
        await fetchUsers(); // Refresh list
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('ไม่สามารถลบผู้ใช้ได้');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = (userData) => {
    const subject = encodeURIComponent('ข้อความจากระบบจองโรงแรม');
    const body = encodeURIComponent(`สวัสดี ${userData.name},\n\nข้อความจากระบบจองโรงแรม...\n\nขอบคุณ`);
    window.open(`mailto:${userData.email}?subject=${subject}&body=${body}`);
  };

  // Filter users based on search and role
  const filteredUsers = allUsers.filter(u => {
    const matchesSearch = !searchTerm || 
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const getUserRoleDisplay = (role) => {
    switch (role) {
      case 'admin': return 'ผู้ดูแลระบบ';
      case 'staff': return 'พนักงาน';
      case 'user': return 'ผู้ใช้ทั่วไป';
      default: return 'ผู้ใช้ทั่วไป';
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'staff': return 'bg-blue-100 text-blue-800';
      case 'user': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">ผู้ใช้ทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-900">{userStats.totalUsers}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <UserCheck className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">ใหม่เดือนนี้</p>
              <p className="text-2xl font-bold text-gray-900">{userStats.newUsersThisMonth}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Settings className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">ผู้ดูแลระบบ</p>
              <p className="text-2xl font-bold text-gray-900">{userStats.adminUsers}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">พนักงาน</p>
              <p className="text-2xl font-bold text-gray-900">{userStats.staffUsers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="flex-1">
              <input
                type="text"
                placeholder="ค้นหาผู้ใช้ (ชื่อ, อีเมล)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="all">บทบาททั้งหมด</option>
              <option value="admin">ผู้ดูแลระบบ</option>
              <option value="staff">พนักงาน</option>
              <option value="user">ผู้ใช้ทั่วไป</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fetchUsers()}
              disabled={loading}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 flex items-center disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              รีเฟรช
            </button>
            {canCreate(user) && (
              <button 
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                เพิ่มผู้ใช้
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            ผู้ใช้งานทั้งหมด ({filteredUsers.length} คน)
          </h3>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">กำลังโหลดข้อมูลผู้ใช้...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">ไม่พบข้อมูลผู้ใช้</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ผู้ใช้</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">อีเมล</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">บทบาท</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">วันที่สมัคร</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">สถานะ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">การดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((userData, index) => (
                  <tr key={userData.id || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {userData.name?.charAt(0)?.toUpperCase() || userData.email?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {userData.name || 'ไม่ระบุชื่อ'}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {userData.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{userData.email}</div>
                      <div className="text-sm text-gray-500">
                        {userData.phone && (
                          <span className="flex items-center">
                            <Phone className="h-3 w-3 mr-1" />
                            {userData.phone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(userData.role)}`}>
                        {getUserRoleDisplay(userData.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {userData.created_at ? new Date(userData.created_at).toLocaleDateString('th-TH') : 'ไม่ระบุ'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        ใช้งานได้
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => {
                            // Show user details modal (future implementation)
                            toast.info(`ดูรายละเอียดของ ${userData.name}`);
                          }}
                          className="text-blue-600 hover:text-blue-900" 
                          title="ดูรายละเอียด"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {canEdit(user) && (
                          <button 
                            onClick={() => handleEditUser(userData)}
                            className="text-green-600 hover:text-green-900" 
                            title="แก้ไข"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        {canDelete(user) && userData.id !== user?.id && (
                          <button 
                            onClick={() => handleDeleteUser(userData.id, userData.name)}
                            className="text-red-600 hover:text-red-900" 
                            title="ลบ"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => handleSendEmail(userData)}
                          className="text-purple-600 hover:text-purple-900" 
                          title="ส่งอีเมล"
                        >
                          <Mail className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Token Status Display - Hidden to prevent screen blocking */}
      {false && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">สถานะ Token การจัดการผู้ใช้</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Token ล่าสุด</h4>
              <p className="text-xs text-gray-600 font-mono break-all">
                {sessionStorage.getItem('last_users_fetch_token')?.substring(0, 50) || 'ไม่มี token'}...
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">เวลาดึงข้อมูลล่าสุด</h4>
              <p className="text-xs text-gray-600">
                {sessionStorage.getItem('last_users_fetch_time') ? 
                  new Date(sessionStorage.getItem('last_users_fetch_time')).toLocaleString('th-TH') : 
                  'ยังไม่เคยดึงข้อมูล'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* User Modals */}
      <UserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateUser}
        title="เพิ่มผู้ใช้ใหม่"
      />

      <UserModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingUser(null);
        }}
        user={editingUser}
        onSave={handleUpdateUser}
        title="แก้ไขข้อมูลผู้ใช้"
      />
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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Settings */}
        <div className="border rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            โปรไฟล์ของฉัน
          </h3>
          <p className="text-sm text-gray-600 mb-4">จัดการข้อมูลส่วนตัวและรหัสผ่าน</p>
          <Link 
            href="/admin/profile"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Settings className="h-4 w-4 mr-2" />
            จัดการโปรไฟล์
          </Link>
        </div>

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

// Bookings Tab Component
function BookingsTab({ bookings, stats, user }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const bookingStatusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    completed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  return (
    <div className="space-y-6">
      {/* Booking Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">รอดำเนินการ</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingBookings}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">ยืนยันแล้ว</p>
              <p className="text-2xl font-bold text-gray-900">{stats.confirmedBookings}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">เสร็จสิ้น</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completedBookings}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <XCircle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">ยกเลิก</p>
              <p className="text-2xl font-bold text-gray-900">{stats.cancelledBookings}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="ค้นหาการจอง..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="all">สถานะทั้งหมด</option>
            <option value="pending">รอดำเนินการ</option>
            <option value="confirmed">ยืนยันแล้ว</option>
            <option value="completed">เสร็จสิ้น</option>
            <option value="cancelled">ยกเลิก</option>
          </select>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            การจองใหม่
          </button>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">รหัสจอง</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ผู้จอง</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">โรงแรม</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">วันที่</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">สถานะ</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ราคา</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">การดำเนินการ</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bookings.map((booking, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  #{booking.id || `BK${1000 + index}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {booking.guest_name || 'ไม่ระบุ'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {booking.hotel_name || 'ไม่ระบุ'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {booking.check_in_date ? new Date(booking.check_in_date).toLocaleDateString('th-TH') : 'ไม่ระบุ'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    bookingStatusColors[booking.status] || 'bg-gray-100 text-gray-800'
                  }`}>
                    {booking.status === 'pending' ? 'รอดำเนินการ' :
                     booking.status === 'confirmed' ? 'ยืนยันแล้ว' :
                     booking.status === 'completed' ? 'เสร็จสิ้น' :
                     booking.status === 'cancelled' ? 'ยกเลิก' : booking.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ฿{booking.total_amount?.toLocaleString() || '0'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button 
                      className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                      title="ดูรายละเอียด"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {canEdit(user) && (
                      <button 
                        className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                        onClick={() => openEditModal(booking)}
                        title="แก้ไขการจอง"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                    {canDelete(user) && (
                      <button 
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                        onClick={() => handleDeleteBooking(booking.id)}
                        title="ลบการจอง"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Reviews Tab Component
function ReviewsTab({ reviews, stats, user }) {
  return (
    <div className="space-y-6">
      {/* Review Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Star className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">คะแนนเฉลี่ย</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageRating?.toFixed(1) || '0.0'}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">รีวิวทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalReviews || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">รีวิวใหม่</p>
              <p className="text-2xl font-bold text-gray-900">+12</p>
              <p className="text-xs text-gray-500">เดือนนี้</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">การกระจายคะแนน</h3>
        <div className="space-y-3">
          {[5,4,3,2,1].map(rating => (
            <div key={rating} className="flex items-center">
              <div className="flex items-center w-16">
                <span className="text-sm text-gray-600">{rating}</span>
                <Star className="h-4 w-4 text-yellow-400 ml-1" />
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-400 h-2 rounded-full" 
                    style={{width: `${Math.random() * 80 + 10}%`}}
                  ></div>
                </div>
              </div>
              <span className="text-sm text-gray-600 w-12">{Math.floor(Math.random() * 50 + 10)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Reviews */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">รีวิวล่าสุด</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {reviews.map((review, index) => (
            <div key={index} className="p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700">
                      {review.user_name?.charAt(0) || 'U'}
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900">
                      {review.user_name || 'ผู้ใช้ไม่ระบุชื่อ'}
                    </h4>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < (review.rating || 0) ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                          fill="currentColor"
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {review.hotel_name || 'ไม่ระบุโรงแรม'}
                  </p>
                  <p className="text-sm text-gray-900 mt-2">
                    {review.comment || 'ไม่มีความคิดเห็น'}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {review.created_at ? new Date(review.created_at).toLocaleDateString('th-TH') : 'ไม่ระบุวันที่'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// User Modal Component
function UserModal({ isOpen, onClose, user = null, onSave, title }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: 'user',
    first_name: '',
    last_name: '',
    phone: '',
    password: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        role: user.role || 'user',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        password: ''
      });
    } else {
      setFormData({
        username: '',
        email: '',
        role: 'user',
        first_name: '',
        last_name: '',
        phone: '',
        password: ''
      });
    }
  }, [user, isOpen]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ชื่อผู้ใช้
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              อีเมล
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อจริง
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                นามสกุล
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              เบอร์โทรศัพท์
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              บทบาท
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="user">ผู้ใช้ทั่วไป</option>
              <option value="staff">พนักงาน</option>
              <option value="admin">ผู้ดูแลระบบ</option>
            </select>
          </div>

          {!user && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                รหัสผ่าน
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required={!user}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              {user ? 'อัปเดต' : 'สร้าง'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Payment Settings Tab Component  
function PaymentSettingsTab({ user }) {
  const router = useRouter();

  const handleGoToPaymentSettings = () => {
    router.push('/admin/payment-settings');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">การตั้งค่าการชำระเงิน</h3>
            <p className="text-gray-600">จัดการช่องทางการชำระเงินและการตั้งค่าต่างๆ</p>
          </div>
          <button
            onClick={handleGoToPaymentSettings}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Settings className="h-4 w-4 mr-2" />
            ไปยังหน้าตั้งค่า
          </button>
        </div>
      </div>

      {/* Payment Methods Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center mb-4">
            <CreditCard className="h-8 w-8 text-blue-600 mr-3" />
            <h4 className="text-lg font-medium text-gray-900">โอนเงินผ่านธนาคาร</h4>
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <p><span className="font-medium">สถานะ:</span> <span className="text-green-600">เปิดใช้งาน</span></p>
            <p><span className="font-medium">ธนาคาร:</span> ธนาคารกสิกรไทย</p>
            <p><span className="font-medium">เลขบัญชี:</span> 123-4-56789-0</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center mb-4">
            <QrCode className="h-8 w-8 text-green-600 mr-3" />
            <h4 className="text-lg font-medium text-gray-900">พร้อมเพย์ (PromptPay)</h4>
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <p><span className="font-medium">สถานะ:</span> <span className="text-green-600">เปิดใช้งาน</span></p>
            <p><span className="font-medium">หมายเลข:</span> 081-234-5678</p>
            <p><span className="font-medium">QR Code:</span> <span className="text-blue-600">พร้อมใช้งาน</span></p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">การดำเนินการด่วน</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleGoToPaymentSettings}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Settings className="h-8 w-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">ตั้งค่าทั่วไป</span>
          </button>
          
          <button
            onClick={handleGoToPaymentSettings}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Upload className="h-8 w-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">อัปโหลด QR</span>
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
          <div>
            <h4 className="text-blue-900 font-medium mb-2">คำแนะนำการใช้งาน</h4>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• โอนเงินผ่านธนาคารและพร้อมเพย์สามารถใช้งานได้ทันที</li>
              <li>• อัปโหลด QR Code ใหม่เมื่อมีการเปลี่ยนแปลงข้อมูล</li>
              <li>• ตรวจสอบการตั้งค่าอย่างสม่ำเสมอเพื่อให้มั่นใจว่าระบบทำงานปกติ</li>
              <li>• สามารถเปิด/ปิดการใช้งานช่องทางการชำระเงินได้ตามต้องการ</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Edit Booking Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  แก้ไขการจอง #{selectedBooking?.id}
                </h2>
                <button
                  onClick={closeEditModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleUpdateBooking(); }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* ชื่อผู้จอง */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ชื่อผู้จอง
                    </label>
                    <input
                      type="text"
                      value={editFormData.guestName}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, guestName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="ชื่อผู้จอง"
                    />
                  </div>

                  {/* เบอร์โทรศัพท์ */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      เบอร์โทรศัพท์
                    </label>
                    <input
                      type="tel"
                      value={editFormData.guestPhone}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, guestPhone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="เบอร์โทรศัพท์"
                    />
                  </div>

                  {/* อีเมล */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      อีเมล
                    </label>
                    <input
                      type="email"
                      value={editFormData.guestEmail}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, guestEmail: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="อีเมล"
                    />
                  </div>

                  {/* จำนวนผู้เข้าพัก */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      จำนวนผู้เข้าพัก
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={editFormData.guests}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, guests: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* วันที่เช็คอิน */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      วันที่เช็คอิน
                    </label>
                    <input
                      type="date"
                      value={editFormData.checkInDate}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, checkInDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* วันที่เช็คเอาต์ */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      วันที่เช็คเอาต์
                    </label>
                    <input
                      type="date"
                      value={editFormData.checkOutDate}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, checkOutDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* สถานะการจอง */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      สถานะการจอง
                    </label>
                    <select
                      value={editFormData.status}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pending">รอดำเนินการ</option>
                      <option value="confirmed">ยืนยันแล้ว</option>
                      <option value="completed">เสร็จสิ้น</option>
                      <option value="cancelled">ยกเลิก</option>
                    </select>
                  </div>

                  {/* ข้อมูลพิเศษ */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      คำขอพิเศษ
                    </label>
                    <textarea
                      value={editFormData.specialRequests}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, specialRequests: e.target.value }))}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="คำขอพิเศษหรือหมายเหตุ..."
                    />
                  </div>
                </div>

                {/* ปุ่มควบคุม */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                    disabled={isUpdating}
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isUpdating ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        กำลังอัปเดต...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        บันทึกการแก้ไข
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
