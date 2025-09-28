'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { isStaffOrAdmin } from '../../../lib/permissions';
import Link from 'next/link';
import { 
  Users, 
  Calendar,
  Bed,
  TrendingUp,
  Home,
  UserPlus,
  Activity,
  BarChart3,
  PieChart,
  RefreshCw,
  Download,
  Filter,
  Clock,
  MapPin,
  Mail,
  Phone,
  Star,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminReportsPage() {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  
  // States for different report data
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    recentUsers: [],
    usersWithBookings: []
  });
  
  const [roomStats, setRoomStats] = useState({
    totalRooms: 0,
    availableRooms: 0,
    bookedRooms: 0,
    mostBookedRooms: [],
    bedTypeStats: []
  });
  
  const [bookingStats, setBookingStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    bedTypeStats: [],
    recentBookings: []
  });

  // User detail modal state
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);

  // Stay reports state
  const [stayReports, setStayReports] = useState([]);
  const [filteredStayReports, setFilteredStayReports] = useState([]);
  const [loadingStayReports, setLoadingStayReports] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'confirmed', 'checked_in', 'checked_out', 'all'
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setIsVisible(true);
    if (isAuthenticated && user && isStaffOrAdmin(user)) {
      fetchAllReportsData();
    }
  }, [isAuthenticated, user]);

  const fetchAllReportsData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchUserStats(),
        fetchRoomStats(),
        fetchBookingStats(),
        fetchStayReports()
      ]);
    } catch (error) {
      console.error('Error fetching reports data:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลรายงาน');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      console.log('🔍 Fetching user statistics...');
      
      // Fetch all users with registration dates
      const usersResponse = await fetch('http://localhost:3001/api/admin/users');
      const usersResult = await usersResponse.json();
      
      if (usersResult.success) {
        console.log('👥 Users data:', usersResult.users);
        
        // Get users with bookings
        const bookingsResponse = await fetch('http://localhost:3001/api/admin/bookings/detailed');
        const bookingsResult = await bookingsResponse.json();
        
        let usersWithBookings = [];
        if (bookingsResult.success) {
          // Count bookings per user
          const bookingCounts = {};
          bookingsResult.data.forEach(booking => {
            const userId = booking.user_id;
            const userName = booking.guest_name || `${booking.user?.first_name} ${booking.user?.last_name}` || 'ไม่ระบุ';
            
            if (!bookingCounts[userId]) {
              bookingCounts[userId] = {
                user_id: userId,
                name: userName,
                email: booking.guest_email || booking.user?.email,
                booking_count: 0,
                last_booking_date: null
              };
            }
            
            bookingCounts[userId].booking_count++;
            
            const bookingDate = new Date(booking.created_at || booking.check_in_date);
            if (!bookingCounts[userId].last_booking_date || bookingDate > new Date(bookingCounts[userId].last_booking_date)) {
              bookingCounts[userId].last_booking_date = booking.created_at || booking.check_in_date;
            }
          });
          
          usersWithBookings = Object.values(bookingCounts)
            .sort((a, b) => b.booking_count - a.booking_count)
            .slice(0, 10);
        }
        
        setUserStats({
          totalUsers: usersResult.users.length,
          recentUsers: usersResult.users
            .sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt))
            .slice(0, 10),
          usersWithBookings: usersWithBookings
        });
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const fetchRoomStats = async () => {
    try {
      console.log('🏠 Fetching room statistics...');
      
      // Fetch room types and room data
      const roomTypesResponse = await fetch('http://localhost:3001/api/room-types');
      const roomTypesResult = await roomTypesResponse.json();
      
      const bookingsResponse = await fetch('http://localhost:3001/api/admin/bookings/detailed');
      const bookingsResult = await bookingsResponse.json();
      
      if (roomTypesResult.success) {
        console.log('🏨 Room types data:', roomTypesResult.data);
        
        // Create a map of room_type_id to room_type data
        const roomTypeMap = {};
        roomTypesResult.data.forEach(roomType => {
          roomTypeMap[roomType.id] = roomType;
        });
        
        let mostBookedRooms = [];
        let bedTypeStats = {};
        let totalRooms = roomTypesResult.data.length;
        let bookedRooms = 0;
        
        if (bookingsResult.success) {
          // Count bookings per room type and bed type
          const roomBookingCounts = {};
          const currentBookings = bookingsResult.data.filter(booking => 
            booking.status === 'confirmed' || booking.status === 'checked_in'
          );
          
          bookingsResult.data.forEach(booking => {
            // Get room type data from map
            const roomType = roomTypeMap[booking.room_type_id];
            const roomTypeName = roomType?.name || booking.room_type_name || 'ไม่ระบุประเภทห้อง';
            const bedType = roomType?.bed_type || 'ไม่ระบุ';
            
            // Count by room type
            if (!roomBookingCounts[roomTypeName]) {
              roomBookingCounts[roomTypeName] = {
                room_type: roomTypeName,
                bed_type: bedType,
                total_bookings: 0,
                current_bookings: 0
              };
            }
            
            roomBookingCounts[roomTypeName].total_bookings++;
            
            if (booking.status === 'confirmed' || booking.status === 'checked_in') {
              roomBookingCounts[roomTypeName].current_bookings++;
            }
            
            // Count by bed type
            if (!bedTypeStats[bedType]) {
              bedTypeStats[bedType] = {
                bed_type: bedType,
                total_bookings: 0,
                display_name: bedType === 'single' ? 'เตียงเดี่ยว' : 
                             bedType === 'double' ? 'เตียงคู่' : 
                             bedType === 'queen' ? 'เตียงควีน' : 
                             bedType === 'king' ? 'เตียงคิง' : bedType
              };
            }
            bedTypeStats[bedType].total_bookings++;
          });
          
          mostBookedRooms = Object.values(roomBookingCounts)
            .sort((a, b) => b.total_bookings - a.total_bookings)
            .slice(0, 5);
            
          bookedRooms = currentBookings.length;
        }
        
        setRoomStats({
          totalRooms: totalRooms,
          availableRooms: totalRooms - bookedRooms,
          bookedRooms: bookedRooms,
          mostBookedRooms: mostBookedRooms,
          bedTypeStats: Object.values(bedTypeStats)
            .sort((a, b) => b.total_bookings - a.total_bookings)
        });
      }
    } catch (error) {
      console.error('Error fetching room stats:', error);
    }
  };

  const fetchBookingStats = async () => {
    try {
      console.log('📊 Fetching booking statistics...');
      
      const bookingsResponse = await fetch('http://localhost:3001/api/admin/bookings/detailed');
      const bookingsResult = await bookingsResponse.json();
      
      if (bookingsResult.success) {
        console.log('📋 Bookings data:', bookingsResult.data);
        
        // Count bed types only (remove room type counting)
        const bedTypeCounts = { single: 0, double: 0 };
        bookingsResult.data.forEach(booking => {
          const bedType = booking.bed_type?.toLowerCase();
          if (bedType === 'single' || bedType === 'เตียงเดี่ยว') {
            bedTypeCounts.single++;
          } else if (bedType === 'double' || bedType === 'เตียงคู่') {
            bedTypeCounts.double++;
          }
        });
        
        const bedTypeStats = [
          { name: 'เตียงเดี่ยว', count: bedTypeCounts.single },
          { name: 'เตียงคู่', count: bedTypeCounts.double }
        ];

        // Calculate total revenue
        const totalRevenue = bookingsResult.data.reduce((sum, booking) => 
          sum + parseFloat(booking.total_price || 0), 0
        );
        
        setBookingStats({
          totalBookings: bookingsResult.data.length,
          totalRevenue,
          bedTypeStats,
          recentBookings: bookingsResult.data
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 10)
        });
      }
    } catch (error) {
      console.error('Error fetching booking stats:', error);
    }
  };

  const fetchUserDetails = async (userId) => {
    setLoadingUserDetails(true);
    try {
      const response = await fetch(`http://localhost:3001/api/admin/users/${userId}`);
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ User data fetched:', result.data);
        
        // Get user's bookings
        const bookingsResponse = await fetch('http://localhost:3001/api/admin/bookings/detailed');
        const bookingsResult = await bookingsResponse.json();
        
        let userBookings = [];
        if (bookingsResult.success) {
          userBookings = bookingsResult.data.filter(booking => booking.user_id === userId);
          console.log('📋 User bookings:', userBookings);
        }
        
        const userDetailsData = {
          ...result.data,
          bookings: userBookings
        };
        
        console.log('🎯 Final user details:', userDetailsData);
        setUserDetails(userDetailsData);
      } else {
        console.error('❌ Failed to fetch user data:', result);
        toast.error('ไม่สามารถดึงข้อมูลผู้ใช้ได้');
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้');
    } finally {
      setLoadingUserDetails(false);
    }
  };

  const openUserModal = async (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
    await fetchUserDetails(user.id);
  };

  const closeUserModal = () => {
    setShowUserModal(false);
    setSelectedUser(null);
    setUserDetails(null);
  };

  const fetchStayReports = async () => {
    setLoadingStayReports(true);
    try {
      console.log('🏨 Fetching stay reports...');
      
      const bookingsResponse = await fetch('http://localhost:3001/api/admin/bookings/detailed');
      const bookingsResult = await bookingsResponse.json();
      
      if (bookingsResult.success) {
        console.log('📋 Stay reports data:', bookingsResult.data);
        
        // Get room types for mapping
        const roomTypesResponse = await fetch('http://localhost:3001/api/room-types');
        const roomTypesResult = await roomTypesResponse.json();
        
        let roomTypeMap = {};
        if (roomTypesResult.success) {
          roomTypesResult.data.forEach(roomType => {
            roomTypeMap[roomType.id] = roomType;
          });
        }
        
        // Enrich booking data with room type information
        const enrichedData = bookingsResult.data.map(booking => ({
          ...booking,
          room_type_name: booking.room_type_name || roomTypeMap[booking.room_type_id]?.name || 'ไม่ระบุ',
          bed_type: roomTypeMap[booking.room_type_id]?.bed_type || 'ไม่ระบุ',
          max_guests: roomTypeMap[booking.room_type_id]?.max_guests || 0
        }));
        
        setStayReports(enrichedData);
        setFilteredStayReports(enrichedData);
      }
    } catch (error) {
      console.error('Error fetching stay reports:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดรายงานการเข้าพัก');
    } finally {
      setLoadingStayReports(false);
    }
  };

  const filterStayReports = () => {
    let filtered = [...stayReports];
    
    // Date range filter
    if (startDate || endDate) {
      filtered = filtered.filter(booking => {
        const checkInDate = new Date(booking.check_in_date);
        const checkOutDate = new Date(booking.check_out_date);
        const createdDate = new Date(booking.created_at);
        
        let dateMatch = true;
        
        // Check if booking dates overlap with selected date range
        if (startDate) {
          const filterStartDate = new Date(startDate);
          // Include if check-out date is after filter start date or created after start date
          dateMatch = dateMatch && (
            checkInDate >= filterStartDate || 
            checkOutDate >= filterStartDate ||
            createdDate >= filterStartDate ||
            (checkInDate <= filterStartDate && checkOutDate >= filterStartDate)
          );
        }
        
        if (endDate) {
          const filterEndDate = new Date(endDate + 'T23:59:59'); // End of selected day
          // Include if check-in date is before filter end date or created before end date
          dateMatch = dateMatch && (
            checkInDate <= filterEndDate || 
            checkOutDate <= filterEndDate ||
            createdDate <= filterEndDate ||
            (checkInDate <= filterEndDate && checkOutDate >= filterEndDate)
          );
        }
        
        return dateMatch;
      });
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }
    
    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(booking => 
        booking.guest_name?.toLowerCase().includes(term) ||
        booking.guest_email?.toLowerCase().includes(term) ||
        booking.guest_phone?.includes(term) ||
        booking.room_type_name?.toLowerCase().includes(term) ||
        booking.id?.toString().includes(term)
      );
    }
    
    // Sort by check-in date (newest first)
    filtered.sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date));
    
    setFilteredStayReports(filtered);
  };

  // Effect to filter when filters change
  useEffect(() => {
    if (stayReports.length > 0) {
      filterStayReports();
    }
  }, [startDate, endDate, statusFilter, searchTerm, stayReports]);

  const getStatusBadge = (status) => {
    const badges = {
      confirmed: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', text: 'ยืนยันแล้ว' },
      pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', text: 'รอยืนยัน' },
      cancelled: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', text: 'ยกเลิกแล้ว' },
      checked_in: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', text: 'เช็คอินแล้ว' },
      checked_out: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200', text: 'เช็คเอาท์แล้ว' }
    };
    
    return badges[status] || badges.pending;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'ไม่ระบุ';
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (amount) => {
    const numAmount = parseFloat(amount);
    if (!numAmount || isNaN(numAmount)) return '฿0';
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0
    }).format(numAmount);
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
            กรุณาเข้าสู่ระบบ
          </h1>
          <Link href="/login" className="btn-primary">
            เข้าสู่ระบบ
          </Link>
        </div>
      </div>
    );
  }

  if (!isStaffOrAdmin(user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
            ไม่มีสิทธิ์เข้าถึง
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            คุณไม่มีสิทธิ์เข้าถึงหน้านี้
          </p>
          <Link href="/dashboard" className="btn-primary">
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-neutral-50 to-indigo-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Header */}
        <div className={`mb-8 transform transition-all duration-700 ease-out ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
                  รายงานสถิติระบบ
                </h1>
                <p className="text-neutral-600 dark:text-neutral-400">
                  ข้อมูลสรุปการใช้งานและสถิติของระบบ
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4">
            <button
              onClick={fetchAllReportsData}
              disabled={loading}
              className="btn-outline flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              รีเฟรชข้อมูล
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">กำลังโหลดข้อมูล...</p>
          </div>
        ) : (
          <div className="space-y-8">

            {/* Overview Stats */}
            <div className={`grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 transform transition-all duration-700 delay-200 ease-out ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}>
              <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 shadow-lg border border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">ผู้ใช้ทั้งหมด</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{userStats.totalUsers}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 shadow-lg border border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">การจองทั้งหมด</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{bookingStats.totalBookings}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 shadow-lg border border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">ห้องว่าง</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{roomStats.availableRooms}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                    <Home className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 shadow-lg border border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">ห้องที่จองแล้ว</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{roomStats.bookedRooms}</p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                    <Bed className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Users Section */}
            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 transform transition-all duration-700 delay-300 ease-out ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}>
              
              {/* Recent Users */}
              <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-neutral-800 dark:to-neutral-900 border-b border-neutral-200 dark:border-neutral-700">
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    ผู้ใช้ที่สมัครล่าสุด
                  </h2>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                    คลิกที่รายชื่อเพื่อดูรายละเอียด
                  </p>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {userStats.recentUsers.length === 0 ? (
                    <div className="p-8 text-center">
                      <Users className="h-12 w-12 text-neutral-400 mx-auto mb-2" />
                      <p className="text-neutral-500 dark:text-neutral-400">ไม่มีข้อมูลผู้ใช้</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-neutral-100 dark:divide-neutral-700">
                      {userStats.recentUsers.map((user, index) => (
                        <div 
                          key={user.id} 
                          className="p-4 hover:bg-blue-50 dark:hover:bg-neutral-700/50 transition-colors cursor-pointer group"
                          onClick={() => openUserModal(user)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-800 dark:to-indigo-900 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                  {(user.first_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                  {user.first_name && user.last_name 
                                    ? `${user.first_name} ${user.last_name}` 
                                    : user.email || 'ไม่ระบุ'}
                                </p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                            <div className="text-right flex items-center gap-2">
                              <div>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                  {formatDate(user.created_at || user.createdAt)}
                                </p>
                              </div>
                              <Eye className="h-4 w-4 text-neutral-400 group-hover:text-blue-500 transition-colors" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Users with Bookings */}
              <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-neutral-800 dark:to-neutral-900 border-b border-neutral-200 dark:border-neutral-700">
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    ผู้ใช้ที่เคยจองห้อง
                  </h2>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                    เรียงตามจำนวนการจอง • คลิกที่รายชื่อเพื่อดูรายละเอียด
                  </p>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {userStats.usersWithBookings.length === 0 ? (
                    <div className="p-8 text-center">
                      <Calendar className="h-12 w-12 text-neutral-400 mx-auto mb-2" />
                      <p className="text-neutral-500 dark:text-neutral-400">ยังไม่มีผู้ใช้จองห้อง</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-neutral-100 dark:divide-neutral-700">
                      {userStats.usersWithBookings.map((user, index) => (
                        <div 
                          key={user.user_id} 
                          className="p-4 hover:bg-green-50 dark:hover:bg-neutral-700/50 transition-colors cursor-pointer group"
                          onClick={() => openUserModal({id: user.user_id, first_name: user.name.split(' ')[0], last_name: user.name.split(' ')[1], email: user.email})}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-green-100 to-emerald-200 dark:from-green-800 dark:to-emerald-900 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                <span className="text-xs font-bold text-green-600 dark:text-green-400">
                                  #{index + 1}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-neutral-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                                  {user.name}
                                </p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                            <div className="text-right flex items-center gap-2">
                              <div>
                                <p className="text-sm font-bold text-green-600 dark:text-green-400">
                                  {user.booking_count} ครั้ง
                                </p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                  ล่าสุด: {formatDate(user.last_booking_date)}
                                </p>
                              </div>
                              <Eye className="h-4 w-4 text-neutral-400 group-hover:text-green-500 transition-colors" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Room Stats Section */}
            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 transform transition-all duration-700 delay-400 ease-out ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}>
              
              {/* Most Booked Rooms */}
              <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-neutral-800 dark:to-neutral-900 border-b border-neutral-200 dark:border-neutral-700">
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    ห้องที่ถูกจองบ่อยสุด
                  </h2>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                    จำนวนการจองทั้งหมด
                  </p>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {roomStats.mostBookedRooms.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bed className="h-12 w-12 text-neutral-400 mx-auto mb-2" />
                      <p className="text-neutral-500 dark:text-neutral-400">ไม่มีข้อมูลการจองห้อง</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-neutral-100 dark:divide-neutral-700">
                      {roomStats.mostBookedRooms.map((room, index) => (
                        <div key={room.room_type} className="p-4 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-orange-100 to-red-200 dark:from-orange-800 dark:to-red-900 rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                                  #{index + 1}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-neutral-900 dark:text-white">
                                  {room.room_type}
                                </p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                  {room.bed_type === 'single' ? '🛏️ เตียงเดี่ยว' : 
                                   room.bed_type === 'double' ? '🛏️🛏️ เตียงคู่' : 
                                   room.bed_type === 'queen' ? '👑 เตียงควีน' : 
                                   room.bed_type === 'king' ? '👑 เตียงคิง' : 
                                   '🛏️ ' + room.bed_type} • กำลังถูกจอง: {room.current_bookings} ห้อง
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-orange-600 dark:text-orange-400">
                                {room.total_bookings} ครั้ง
                              </p>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                ทั้งหมด
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Bed Type Stats Section */}
            <div className={`transform transition-all duration-700 delay-450 ease-out ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}>
              <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-neutral-800 dark:to-neutral-900 border-b border-neutral-200 dark:border-neutral-700">
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    <Bed className="h-5 w-5" />
                    สถิติประเภทเตียง
                  </h2>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                    เปรียบเทียบความนิยมระหว่างเตียงเดี่ยวและเตียงคู่
                  </p>
                </div>
                <div className="p-6">
                  {!roomStats.bedTypeStats || roomStats.bedTypeStats.length === 0 ? (
                    <div className="text-center py-8">
                      <Bed className="h-12 w-12 text-neutral-400 mx-auto mb-2" />
                      <p className="text-neutral-500 dark:text-neutral-400">ไม่มีข้อมูลประเภทเตียง</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {roomStats.bedTypeStats.map((bedType, index) => {
                        const totalBookings = roomStats.bedTypeStats.reduce((sum, bt) => sum + bt.total_bookings, 0);
                        const percentage = totalBookings > 0 ? (bedType.total_bookings / totalBookings * 100).toFixed(1) : 0;
                        const isPopular = index === 0;
                        
                        return (
                          <div 
                            key={bedType.bed_type} 
                            className={`relative p-6 rounded-xl border-2 transition-all hover:scale-105 ${
                              isPopular 
                                ? 'bg-gradient-to-br from-amber-50 to-yellow-100 border-amber-200 dark:from-amber-900/20 dark:to-yellow-900/20 dark:border-amber-700' 
                                : 'bg-gradient-to-br from-neutral-50 to-gray-100 border-neutral-200 dark:from-neutral-700 dark:to-neutral-800 dark:border-neutral-600'
                            }`}
                          >
                            {isPopular && (
                              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center">
                                <Star className="h-4 w-4 text-white" />
                              </div>
                            )}
                            
                            <div className="text-center">
                              <div className="text-3xl mb-3">
                                {bedType.bed_type === 'single' ? '🛏️' : 
                                 bedType.bed_type === 'double' ? '🛏️🛏️' : 
                                 bedType.bed_type === 'queen' ? '👑' : 
                                 bedType.bed_type === 'king' ? '👑' : '🛏️'}
                              </div>
                              <h3 className={`text-lg font-bold mb-2 ${
                                isPopular 
                                  ? 'text-amber-700 dark:text-amber-300' 
                                  : 'text-neutral-700 dark:text-neutral-300'
                              }`}>
                                {bedType.display_name}
                              </h3>
                              <div className={`text-3xl font-bold mb-1 ${
                                isPopular 
                                  ? 'text-amber-600 dark:text-amber-400' 
                                  : 'text-neutral-600 dark:text-neutral-400'
                              }`}>
                                {bedType.total_bookings}
                              </div>
                              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
                                การจองทั้งหมด
                              </p>
                              
                              {/* Progress Bar */}
                              <div className="w-full h-3 bg-neutral-200 dark:bg-neutral-600 rounded-full overflow-hidden">
                                <div 
                                  className={`h-3 rounded-full transition-all duration-1000 ease-out ${
                                    isPopular 
                                      ? 'bg-gradient-to-r from-amber-400 to-yellow-500' 
                                      : 'bg-gradient-to-r from-neutral-400 to-gray-500'
                                  }`}
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <p className={`text-sm font-medium mt-2 ${
                                isPopular 
                                  ? 'text-amber-600 dark:text-amber-400' 
                                  : 'text-neutral-600 dark:text-neutral-400'
                              }`}>
                                {percentage}% ของการจองทั้งหมด
                              </p>
                              
                              {isPopular && (
                                <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-full text-xs font-medium">
                                  <Star className="h-3 w-3" />
                                  ยอดนิยมสุด
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stay Reports Section */}
            <div className={`transform transition-all duration-700 delay-475 ease-out ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}>
              <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-neutral-800 dark:to-neutral-900 border-b border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        รายงานการเข้าพัก
                      </h2>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                        ข้อมูลการจองและการเข้าพักของลูกค้า พร้อมระบบกรองข้อมูล
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                        ทั้งหมด: {stayReports.length} รายการ
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        กรองแล้ว: {filteredStayReports.length} รายการ
                      </p>
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="mt-4 space-y-4">
                    {/* Date Range Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                          📅 วันที่เริ่มต้น
                        </label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                          � วันที่สิ้นสุด
                        </label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Other Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Status Filter */}
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                          📊 สถานะการจอง
                        </label>
                        <select 
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                          <option value="all">📊 ทุกสถานะ</option>
                          <option value="confirmed">✅ ยืนยันแล้ว</option>
                          <option value="checked_in">🏨 เช็คอินแล้ว</option>
                          <option value="checked_out">🚪 เช็คเอาท์แล้ว</option>
                          <option value="pending">⏳ รอยืนยัน</option>
                          <option value="cancelled">❌ ยกเลิกแล้ว</option>
                        </select>
                      </div>

                      {/* Search */}
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                          🔍 ค้นหา
                        </label>
                        <input
                          type="text"
                          placeholder="ชื่อ, อีเมล, เบอร์โทร, ห้อง..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Quick Date Filters */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          const today = new Date().toISOString().split('T')[0];
                          setStartDate(today);
                          setEndDate(today);
                        }}
                        className="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700 text-blue-800 dark:text-blue-200 rounded-full transition-colors"
                      >
                        🔥 วันนี้
                      </button>
                      <button
                        onClick={() => {
                          const today = new Date();
                          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                          setStartDate(weekAgo.toISOString().split('T')[0]);
                          setEndDate(today.toISOString().split('T')[0]);
                        }}
                        className="px-3 py-1 text-xs bg-green-100 hover:bg-green-200 dark:bg-green-800 dark:hover:bg-green-700 text-green-800 dark:text-green-200 rounded-full transition-colors"
                      >
                        📆 7 วันที่ผ่านมา
                      </button>
                      <button
                        onClick={() => {
                          const today = new Date();
                          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                          setStartDate(monthAgo.toISOString().split('T')[0]);
                          setEndDate(today.toISOString().split('T')[0]);
                        }}
                        className="px-3 py-1 text-xs bg-purple-100 hover:bg-purple-200 dark:bg-purple-800 dark:hover:bg-purple-700 text-purple-800 dark:text-purple-200 rounded-full transition-colors"
                      >
                        🗓️ 30 วันที่ผ่านมา
                      </button>
                      <button
                        onClick={() => {
                          setStartDate('');
                          setEndDate('');
                        }}
                        className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full transition-colors"
                      >
                        🔄 ล้างการกรอง
                      </button>
                    </div>
                  </div>
                </div>

                {/* Stay Reports Content */}
                <div className="max-h-[600px] overflow-y-auto">
                  {loadingStayReports ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                      <p className="text-neutral-600 dark:text-neutral-400">กำลังโหลดรายงานการเข้าพัก...</p>
                    </div>
                  ) : filteredStayReports.length === 0 ? (
                    <div className="p-8 text-center">
                      <Calendar className="h-12 w-12 text-neutral-400 mx-auto mb-2" />
                      <p className="text-neutral-500 dark:text-neutral-400">
                        {searchTerm || startDate || endDate || statusFilter !== 'all' 
                          ? 'ไม่พบข้อมูลตามเงื่อนไขที่กำหนด' 
                          : 'ไม่มีข้อมูลการเข้าพัก'
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-neutral-100 dark:divide-neutral-700">
                      {filteredStayReports.map((booking) => (
                        <div key={booking.id} className="p-4 hover:bg-indigo-50 dark:hover:bg-neutral-700/50 transition-colors">
                          <div className="flex items-center justify-between">
                            {/* Guest Info */}
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-200 dark:from-indigo-800 dark:to-purple-900 rounded-full flex items-center justify-center">
                                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                                  #{booking.id}
                                </span>
                              </div>
                              <div 
                                className="cursor-pointer group"
                                onClick={() => {
                                  if (booking.user_id) {
                                    // สร้าง user object จากข้อมูลการจอง
                                    const userData = {
                                      id: booking.user_id,
                                      first_name: booking.guest_name ? booking.guest_name.split(' ')[0] : '',
                                      last_name: booking.guest_name ? booking.guest_name.split(' ')[1] || '' : '',
                                      email: booking.guest_email
                                    };
                                    openUserModal(userData);
                                  }
                                }}
                              >
                                <p className="text-sm font-semibold text-neutral-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-1">
                                  {booking.guest_name || 'ไม่ระบุชื่อ'}
                                  {booking.user_id && <Eye className="h-3 w-3 text-neutral-400 group-hover:text-indigo-500 transition-colors" />}
                                </p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                  📧 {booking.guest_email} • 📞 {booking.guest_phone}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(booking.status).color}`}>
                                    {getStatusBadge(booking.status).text}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Room & Date Info */}
                            <div className="text-center hidden md:block">
                              <p className="text-sm font-medium text-neutral-900 dark:text-white">
                                {booking.room_type_name}
                              </p>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                {booking.bed_type === 'single' ? '🛏️ เตียงเดี่ยว' : 
                                 booking.bed_type === 'double' ? '🛏️🛏️ เตียงคู่' : 
                                 '🛏️ ' + booking.bed_type} • 👥 {booking.max_guests} คน
                              </p>
                            </div>

                            {/* Check-in/out Dates */}
                            <div className="text-right">
                              <div className="text-sm font-medium text-neutral-900 dark:text-white mb-1">
                                🏨 {formatDate(booking.check_in_date)}
                              </div>
                              <div className="text-sm font-medium text-neutral-900 dark:text-white mb-1">
                                🚪 {formatDate(booking.check_out_date)}
                              </div>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                📅 จอง: {formatDate(booking.created_at)}
                              </p>
                            </div>

                            {/* Price */}
                            <div className="text-right">
                              <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                                {formatPrice(parseFloat(booking.total_amount) || parseFloat(booking.total_price) || 0)}
                              </p>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                💰 ราคารวม
                              </p>
                            </div>
                          </div>

                          {/* Mobile view for room info */}
                          <div className="mt-3 md:hidden">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                                🏠 {booking.room_type_name} • 
                                {booking.bed_type === 'single' ? ' 🛏️ เตียงเดี่ยว' : 
                                 booking.bed_type === 'double' ? ' 🛏️🛏️ เตียงคู่' : 
                                 ' 🛏️ ' + booking.bed_type} • 
                                👥 {booking.max_guests} คน
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Summary Footer */}
                {filteredStayReports.length > 0 && (
                  <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-neutral-700 dark:to-neutral-800 border-t border-neutral-200 dark:border-neutral-600">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                          {filteredStayReports.filter(b => b.status === 'confirmed').length}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">ยืนยันแล้ว</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {filteredStayReports.filter(b => b.status === 'checked_in').length}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">เช็คอินแล้ว</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-gray-600 dark:text-gray-400">
                          {filteredStayReports.filter(b => b.status === 'checked_out').length}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">เช็คเอาท์แล้ว</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">
                          {formatPrice(filteredStayReports.reduce((sum, b) => {
                            const amount = parseFloat(b.total_amount) || parseFloat(b.total_price) || 0;
                            return sum + amount;
                          }, 0))}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">รายได้รวม</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Bookings */}
            <div className={`transform transition-all duration-700 delay-500 ease-out ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}>
              <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-neutral-800 dark:to-neutral-900 border-b border-neutral-200 dark:border-neutral-700">
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    การจองล่าสุด
                  </h2>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                    แสดง 10 รายการล่าสุด
                  </p>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {bookingStats.recentBookings.length === 0 ? (
                    <div className="p-8 text-center">
                      <Calendar className="h-12 w-12 text-neutral-400 mx-auto mb-2" />
                      <p className="text-neutral-500 dark:text-neutral-400">ไม่มีข้อมูลการจอง</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-neutral-100 dark:divide-neutral-700">
                      {bookingStats.recentBookings.map((booking) => (
                        <div key={booking.id} className="p-4 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-teal-200 dark:from-emerald-800 dark:to-teal-900 rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                  {booking.id}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-neutral-900 dark:text-white">
                                  {booking.guest_name || 'ไม่ระบุ'}
                                </p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                  {booking.guest_email} • {booking.guest_phone}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-center">
                                <p className="text-sm font-medium text-neutral-900 dark:text-white">
                                  {booking.room_type_name || 
                                   (typeof booking.room_type === 'object' ? booking.room_type?.name : booking.room_type) || 
                                   'ไม่ระบุ'}
                                </p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                  {formatDate(booking.check_in_date)} - {formatDate(booking.check_out_date)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                  {formatPrice(booking.total_amount || booking.total_price)}
                                </p>
                                <div className="flex items-center gap-1">
                                  {booking.status === 'confirmed' && (
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                  )}
                                  {booking.status === 'pending' && (
                                    <AlertCircle className="h-3 w-3 text-yellow-500" />
                                  )}
                                  {booking.status === 'cancelled' && (
                                    <XCircle className="h-3 w-3 text-red-500" />
                                  )}
                                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                    {booking.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* User Detail Modal */}
        {showUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
              
              {/* Modal Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-neutral-800 dark:to-neutral-900 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                      รายละเอียดผู้ใช้
                    </h2>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      ข้อมูลและประวัติการจองของผู้ใช้
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeUserModal}
                  className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 flex items-center justify-center transition-colors"
                >
                  <XCircle className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto">
                {loadingUserDetails ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-3 text-neutral-600 dark:text-neutral-400">กำลังโหลดข้อมูล...</span>
                  </div>
                ) : userDetails ? (
                  <div className="space-y-6">
                    
                    {/* User Info */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-neutral-700 dark:to-neutral-800 rounded-xl p-4">
                      <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        ข้อมูลส่วนตัว
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">ชื่อ-นามสกุล</label>
                          <p className="text-base font-medium text-neutral-900 dark:text-white">
                            {userDetails.first_name && userDetails.last_name 
                              ? `${userDetails.first_name} ${userDetails.last_name}` 
                              : 'ไม่ระบุ'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">อีเมล</label>
                          <p className="text-base font-medium text-neutral-900 dark:text-white">
                            {userDetails.email || 'ไม่ระบุ'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">เบอร์โทร</label>
                          <p className="text-base font-medium text-neutral-900 dark:text-white">
                            {userDetails.phone || 'ไม่ระบุ'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">สถานะ</label>
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            userDetails.role === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                            userDetails.role === 'manager' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                            userDetails.role === 'staff' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                            'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          }`}>
                            {userDetails.role === 'admin' ? 'ผู้ดูแลระบบ' :
                             userDetails.role === 'manager' ? 'ผู้จัดการ' :
                             userDetails.role === 'staff' ? 'พนักงาน' : 'ลูกค้า'}
                          </span>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">วันที่สมัคร</label>
                          <p className="text-base font-medium text-neutral-900 dark:text-white">
                            {formatDate(userDetails.created_at)}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">อัพเดทล่าสุด</label>
                          <p className="text-base font-medium text-neutral-900 dark:text-white">
                            {formatDate(userDetails.updated_at)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Booking History */}
                    <div>
                      <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        ประวัติการจอง ({userDetails.bookings?.length || 0} ครั้ง)
                      </h3>
                      
                      {!userDetails.bookings || userDetails.bookings.length === 0 ? (
                        <div className="text-center py-8 bg-neutral-50 dark:bg-neutral-700 rounded-xl">
                          <Calendar className="h-12 w-12 text-neutral-400 mx-auto mb-2" />
                          <p className="text-neutral-500 dark:text-neutral-400">ยังไม่มีประวัติการจอง</p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {userDetails.bookings.map((booking) => (
                            <div key={booking.id} className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-medium text-neutral-900 dark:text-white">
                                      การจอง #{booking.id}
                                    </span>
                                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                      booking.status === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                      booking.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                      'bg-neutral-100 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200'
                                    }`}>
                                      {booking.status === 'confirmed' ? 'ยืนยันแล้ว' :
                                       booking.status === 'pending' ? 'รอยืนยัน' :
                                       booking.status === 'cancelled' ? 'ยกเลิกแล้ว' : booking.status}
                                    </span>
                                  </div>
                                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                    {booking.room_type_name || 'ไม่ระบุประเภทห้อง'}
                                  </p>
                                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                    {formatDate(booking.check_in_date)} - {formatDate(booking.check_out_date)}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                    {formatPrice(booking.total_amount || booking.total_price)}
                                  </p>
                                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                    จองเมื่อ {formatDate(booking.created_at)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <AlertCircle className="h-12 w-12 text-neutral-400 mx-auto mb-2" />
                    <p className="text-neutral-500 dark:text-neutral-400">ไม่สามารถโหลดข้อมูลได้</p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-700 border-t border-neutral-200 dark:border-neutral-600 flex justify-end">
                <button
                  onClick={closeUserModal}
                  className="px-4 py-2 bg-neutral-600 hover:bg-neutral-700 text-white rounded-lg transition-colors"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}