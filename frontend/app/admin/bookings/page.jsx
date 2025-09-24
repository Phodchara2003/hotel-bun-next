'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { bookingAPI } from '../../../lib/api';
import { isStaffOrAdmin, canDeleteBookings, canEditBookings, canManageBookings } from '../../../lib/permissions';
import ConfirmModal from '../../../components/ConfirmModal';
import Link from 'next/link';
import { 
  Calendar, 
  Users, 
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  X,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Receipt,
  Search,
  Filter,
  Trash2,
  Plus,
  Download,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function BookingManagement() {
  const { user, isAuthenticated } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmActionType, setConfirmActionType] = useState('danger'); // danger, success, warning, info
  const [actionLoading, setActionLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    todayBookings: 0,
    totalRevenue: 0
  });
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    roomType: ''
  });

  const [isFilterVisible, setIsFilterVisible] = useState(true);

  // Safe date parsing utility
  const safeParseDate = (dateString) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date;
    } catch (error) {
      console.warn('Invalid date:', dateString);
      return null;
    }
  };



  useEffect(() => {
    setIsVisible(true);
    if (isAuthenticated && user && isStaffOrAdmin(user)) {
      fetchBookings();
    }
  }, [isAuthenticated, user]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingAPI.getDetailedBookingsForAdmin();
      console.log('📊 Full API response:', response);
      if (response.success) {
        setBookings(response.data);
        calculateStats(response.data);
        

      } else if (response.bookings) {
        // Handle alternative response format
        console.log('Alternative booking data:', response.bookings[0]); // Debug log
        setBookings(response.bookings);
        calculateStats(response.bookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลการจอง');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (bookingsData) => {
    const today = new Date().toISOString().split('T')[0];
    
    const stats = {
      totalBookings: bookingsData.length,
      pendingBookings: bookingsData.filter(b => b.status === 'pending').length,
      confirmedBookings: bookingsData.filter(b => b.status === 'confirmed').length,
      completedBookings: bookingsData.filter(b => b.status === 'completed').length,
      cancelledBookings: bookingsData.filter(b => b.status === 'cancelled').length,
      todayBookings: bookingsData.filter(b => {
        const createdDate = b.created_at || b.createdAt;
        const date = safeParseDate(createdDate);
        return date && date.toISOString().split('T')[0] === today;
      }).length,
      totalRevenue: bookingsData
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + (b.total_amount || b.totalAmount || b.total_price || b.totalPrice || 0), 0)
    };
    
    setStats(stats);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      dateFrom: '',
      dateTo: '',
      roomType: ''
    });
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = !filters.search || 
      booking.booking_id?.toLowerCase().includes(filters.search.toLowerCase()) ||
      booking.guest_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      booking.guest_email?.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesStatus = !filters.status || booking.status === filters.status;
    
    const matchesDateFrom = !filters.dateFrom || (() => {
      const checkInDate = booking.check_in_date || booking.checkInDate;
      const date = safeParseDate(checkInDate);
      const filterDate = safeParseDate(filters.dateFrom);
      return date && filterDate && date >= filterDate;
    })();
    
    const matchesDateTo = !filters.dateTo || (() => {
      const checkInDate = booking.check_in_date || booking.checkInDate;
      const date = safeParseDate(checkInDate);
      const filterDate = safeParseDate(filters.dateTo);
      return date && filterDate && date <= filterDate;
    })();

    return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { 
        label: 'รอการยืนยัน', 
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        icon: Clock
      },
      confirmed: { 
        label: 'ยืนยันแล้ว', 
        className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        icon: CheckCircle
      },
      completed: { 
        label: 'สำเร็จแล้ว', 
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        icon: CheckCircle
      },
      cancelled: { 
        label: 'ยกเลิกแล้ว', 
        className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        icon: XCircle
      }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.className}`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      setActionLoading(true);
      const response = await bookingAPI.updateStatus(bookingId, newStatus);
      if (response.success) {
        toast.success(`สถานะการจองถูกเปลี่ยนเป็น ${newStatus} แล้ว`);
        fetchBookings();
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast.error('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    } finally {
      setActionLoading(false);
      setShowConfirmModal(false);
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    try {
      setActionLoading(true);
      const response = await bookingAPI.delete(bookingId);
      if (response.success) {
        toast.success('ลบการจองสำเร็จ');
        fetchBookings();
      }
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast.error('เกิดข้อผิดพลาดในการลบการจอง');
    } finally {
      setActionLoading(false);
      setShowConfirmModal(false);
    }
  };



  const formatDate = (dateString) => {
    const date = safeParseDate(dateString);
    if (!date) return '-';
    
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (amount) => {
    if (!amount) return '฿0';
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0
    }).format(amount);
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


        {/* Action Buttons */}
        <div className={`mb-8 transform transition-all duration-700 ease-out ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          <div className="flex items-center justify-end gap-4">
            <button
              onClick={fetchBookings}
              disabled={loading}
              className="btn-outline flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              รีเฟรช
            </button>
            <button className="btn-primary flex items-center gap-2">
              <Download className="h-4 w-4" />
              ส่งออกข้อมูล
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className={`grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4 lg:gap-6 mb-8 transform transition-all duration-700 delay-200 ease-out ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-3 sm:p-6 shadow-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-neutral-600 dark:text-neutral-400">การจองทั้งหมด</p>
                <p className="text-lg sm:text-2xl font-bold text-neutral-900 dark:text-white">{stats.totalBookings}</p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Calendar className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-xl p-3 sm:p-6 shadow-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-neutral-600 dark:text-neutral-400">รอการยืนยัน</p>
                <p className="text-lg sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pendingBookings}</p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                <Clock className="h-4 w-4 sm:h-6 sm:w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-xl p-3 sm:p-6 shadow-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-neutral-600 dark:text-neutral-400">ยืนยันแล้ว</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">{stats.confirmedBookings}</p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-4 w-4 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-xl p-3 sm:p-6 shadow-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-neutral-600 dark:text-neutral-400">สำเร็จแล้ว</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.completedBookings}</p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-xl p-3 sm:p-6 shadow-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-neutral-600 dark:text-neutral-400">ยกเลิกแล้ว</p>
                <p className="text-lg sm:text-2xl font-bold text-red-600 dark:text-red-400">{stats.cancelledBookings}</p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                <XCircle className="h-4 w-4 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-xl p-3 sm:p-6 shadow-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-neutral-600 dark:text-neutral-400">วันนี้</p>
                <p className="text-lg sm:text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.todayBookings}</p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-xl p-3 sm:p-6 shadow-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-neutral-600 dark:text-neutral-400">รายได้รวม</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">{formatPrice(stats.totalRevenue)}</p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <Receipt className="h-4 w-4 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className={`bg-white dark:bg-neutral-800 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6 transform transition-all duration-700 delay-300 ease-out ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                <Filter className="h-4 w-4 text-white" />
              </div>
              ค้นหาและกรอง
            </h2>
            <div className="text-sm text-neutral-500 dark:text-neutral-400">
              {filteredBookings.length} / {bookings.length} รายการ
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {/* Search */}
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                ค้นหา
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="รหัสจอง, ชื่อ, อีเมล..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10 w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-xl bg-neutral-50 dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                />
              </div>
            </div>
            
            {/* Status Filter */}
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                สถานะ
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-xl bg-neutral-50 dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
              >
                <option value="">ทั้งหมด</option>
                <option value="pending">รอการยืนยัน</option>
                <option value="confirmed">ยืนยันแล้ว</option>
                <option value="completed">สำเร็จแล้ว</option>
                <option value="cancelled">ยกเลิกแล้ว</option>
              </select>
            </div>
            
            {/* Date From */}
            <div>
              <label className="block text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-3">
                วันเข้าพักจาก
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="input-field text-sm"
              />
            </div>
            
            {/* Date To */}
            <div>
              <label className="block text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-3">
                วันเข้าพักถึง
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="input-field text-sm"
              />
            </div>

            {/* Clear Filters Button */}
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="group w-full px-6 py-3 bg-gradient-to-r from-rose-50 to-pink-50 hover:from-rose-100 hover:to-pink-100 dark:from-rose-900/20 dark:to-pink-900/20 dark:hover:from-rose-800/30 dark:hover:to-pink-800/30 text-rose-700 dark:text-rose-300 hover:text-rose-800 dark:hover:text-rose-200 font-semibold rounded-xl border border-rose-200 dark:border-rose-700/50 hover:border-rose-300 dark:hover:border-rose-600 transition-all duration-300 hover:shadow-lg hover:shadow-rose-200/30 dark:hover:shadow-rose-900/20 active:scale-[0.98] relative overflow-hidden"
                title="ล้างตัวกรองทั้งหมด"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-rose-400/0 via-rose-300/0 to-pink-400/0 group-hover:from-rose-400/10 group-hover:via-rose-300/5 group-hover:to-pink-400/10 transition-all duration-300"></div>
                <div className="relative flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 transition-transform duration-200 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  ล้างตัวกรอง
                </div>
              </button>
            </div>
          </div>
          
          <div className="mt-8">
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800/50 dark:to-blue-900/20 rounded-xl p-4 border border-slate-200 dark:border-slate-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">รายการจองทั้งหมด</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-slate-900 dark:text-white">{filteredBookings.length}</span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">จาก</span>
                      <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">{bookings.length}</span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">รายการ</span>
                    </div>
                  </div>
                </div>
                {filteredBookings.length !== bookings.length && (
                  <div className="px-3 py-1 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium rounded-full border border-amber-200 dark:border-amber-700/50">
                    กำลังกรอง
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bookings Table */}
        <div className={`bg-white dark:bg-neutral-800 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden transform transition-all duration-700 delay-400 ease-out ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          <div className="px-6 py-4 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-neutral-800 dark:to-neutral-900 border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                  รายการการจอง
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                  แสดง {filteredBookings.length} จาก {bookings.length} รายการ
                </p>
              </div>
              <button
                onClick={fetchBookings}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                title="รีเฟรชข้อมูล"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="font-medium">รีเฟรช</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-16 text-center">
              <div className="relative inline-block">
                <div className="w-16 h-16 border-4 border-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-800 dark:to-purple-800 rounded-full"></div>
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-blue-500 border-r-purple-500 rounded-full animate-spin"></div>
              </div>
              <div className="mt-6 space-y-2">
                <p className="text-lg font-semibold text-slate-800 dark:text-slate-200">กำลังโหลดข้อมูลการจอง</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">โปรดรอสักครู่...</p>
              </div>
              <div className="mt-8 flex justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
              </div>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="p-16 text-center">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-full flex items-center justify-center mx-auto border-4 border-slate-200 dark:border-slate-600">
                  <Calendar className="h-10 w-10 text-slate-400 dark:text-slate-500" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.084 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                  ไม่พบข้อมูลการจอง
                </h3>
                <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                  {bookings.length === 0 
                    ? "ยังไม่มีการจองในระบบ เริ่มต้นรับจองแรกของคุณเลย!" 
                    : "ไม่มีรายการที่ตรงกับเงื่อนไขการค้นหา ลองปรับเปลี่ยนตัวกรองดู"
                  }
                </p>
                {bookings.length > 0 && (
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-medium rounded-lg transition-all duration-200 hover:shadow-lg transform hover:scale-105"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    รีเซ็ตตัวกรอง
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-900">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase tracking-wide">
                        รหัสจอง
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase tracking-wide">
                        ผู้เข้าพัก
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase tracking-wide">
                        ห้องพัก
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase tracking-wide">
                        วันที่พัก
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase tracking-wide">
                        จำนวนเงิน
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase tracking-wide">
                        สถานะ
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase tracking-wide">
                        จัดการ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700 bg-white dark:bg-neutral-800">
                  {filteredBookings.map((booking, index) => (
                    <tr key={booking.id} className={`hover:bg-gradient-to-r hover:from-primary-25 hover:to-blue-25 dark:hover:from-neutral-700 dark:hover:to-neutral-750 transition-all duration-200 ${index % 2 === 0 ? 'bg-neutral-25 dark:bg-neutral-800' : 'bg-white dark:bg-neutral-800'}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
                            <span className="text-xs font-bold text-white">{booking.id}</span>
                          </div>
                          <div className="text-sm font-semibold text-neutral-900 dark:text-white">
                            {booking.booking_id || `BK${booking.id}`}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="flex-shrink-0 w-8 h-8">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-800 dark:to-blue-900 rounded-full flex items-center justify-center border-2 border-blue-200 dark:border-blue-700">
                              <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                              {booking.guest_name || 'ไม่ระบุ'}
                            </div>
                            <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                              {booking.guest_phone || 'ไม่ระบุเบอร์'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-neutral-900 dark:text-white">
                            {booking.room_number || 'ไม่ระบุ'}
                          </div>
                          <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                            {booking.room_type_name || 
                             (typeof booking.room_type === 'object' ? booking.room_type?.name : booking.room_type) || 
                             'ไม่ระบุประเภทห้อง'}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="text-sm text-neutral-900 dark:text-white">
                            {formatDate(booking.check_in_date)}
                          </div>
                          <div className="text-xs text-neutral-500 dark:text-neutral-400">
                            ถึง {formatDate(booking.check_out_date)}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-bold text-green-600 dark:text-green-400">
                          {formatPrice(booking.total_amount || booking.total_price || booking.totalAmount || booking.totalPrice || 0)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(booking.status)}
                          {booking.payment_slips && booking.payment_slips.length > 0 && (
                            <div className="relative group">
                              <div className="w-6 h-6 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-800 dark:to-green-900 rounded-full flex items-center justify-center border border-green-300 dark:border-green-600">
                                <Receipt className="h-3 w-3 text-green-600 dark:text-green-400" />
                              </div>
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-neutral-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
                                มีสลีปการชำระเงิน ({booking.payment_slips.length})
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowBookingModal(true);
                            }}
                            className="group relative p-2 rounded-xl bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/30 dark:hover:bg-primary-800/40 text-primary-600 dark:text-primary-400 transition-all duration-200 hover:scale-105"
                            title="ดูรายละเอียดการจอง"
                          >
                            <Eye className="h-4 w-4" />
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-neutral-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              ดูรายละเอียด
                            </div>
                          </button>
                          

                          
                          {canManageBookings(user) && booking.status === 'pending' && (
                            <>
                              <button
                                onClick={() => {
                                  setConfirmAction(() => () => handleStatusUpdate(booking.id, 'confirmed'));
                                  setConfirmActionType('success');
                                  setShowConfirmModal(true);
                                }}
                                className="group relative p-2 rounded-xl bg-green-50 hover:bg-green-100 dark:bg-green-900/30 dark:hover:bg-green-800/40 text-green-600 dark:text-green-400 transition-all duration-200 hover:scale-105"
                                title="อนุมัติการจอง"
                              >
                                <CheckCircle className="h-4 w-4" />
                                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-neutral-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                  อนุมัติ
                                </div>
                              </button>
                              <button
                                onClick={() => {
                                  setConfirmAction(() => () => handleStatusUpdate(booking.id, 'cancelled'));
                                  setConfirmActionType('warning');
                                  setShowConfirmModal(true);
                                }}
                                className="group relative p-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-800/40 text-red-600 dark:text-red-400 transition-all duration-200 hover:scale-105"
                                title="ยกเลิกการจอง"
                              >
                                <XCircle className="h-4 w-4" />
                                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-neutral-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                  ยกเลิก
                                </div>
                              </button>
                            </>
                          )}
                          
                          {canDeleteBookings(user).all && (
                            <button
                              onClick={() => {
                                setConfirmAction(() => () => handleDeleteBooking(booking.id));
                                setConfirmActionType('danger');
                                setShowConfirmModal(true);
                              }}
                              className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                              title="ลบการจองถาวร"
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

            {/* Mobile/Tablet Card View */}
            <div className="block lg:hidden space-y-4 p-4">
              {filteredBookings.map((booking, index) => (
                <div key={booking.id} className={`bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-800 dark:to-neutral-900 rounded-2xl p-5 shadow-xl border border-neutral-200 dark:border-neutral-700 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-neutral-900 dark:text-white text-lg">
                          {booking.guest_name || 'ไม่ระบุ'}
                        </h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="px-2 py-1 bg-primary-100 dark:bg-primary-900 rounded-lg">
                            <p className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                              {booking.booking_id || `BK${booking.id}`}
                            </p>
                          </div>
                          {booking.payment_slips && booking.payment_slips.length > 0 && (
                            <div className="px-2 py-1 bg-green-100 dark:bg-green-900 rounded-lg flex items-center space-x-1">
                              <Receipt className="h-3 w-3 text-green-600 dark:text-green-400" />
                              <span className="text-xs font-medium text-green-600 dark:text-green-400">
                                {booking.payment_slips.length}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(booking.status)}
                      <button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowBookingModal(true);
                        }}
                        className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-neutral-500 dark:text-neutral-400">ห้องพัก:</span>
                      <p className="font-medium text-neutral-900 dark:text-white">
                        {booking.room_type_name || 
                         (typeof booking.room_type === 'object' ? booking.room_type?.name : booking.room_type) || 
                         'ไม่ระบุประเภทห้อง'}
                      </p>
                      {booking.hotel_name && (
                        <p className="text-xs text-neutral-400">{booking.hotel_name}</p>
                      )}
                    </div>
                    <div>
                      <span className="text-neutral-500 dark:text-neutral-400">จำนวนเงิน:</span>
                      <p className="font-bold text-green-600 dark:text-green-400">
                        {formatPrice(booking.total_amount || booking.total_price || booking.totalAmount || booking.totalPrice || 0)}
                      </p>
                    </div>
                    <div>
                      <span className="text-neutral-500 dark:text-neutral-400">เข้าพัก:</span>
                      <p className="font-medium text-neutral-900 dark:text-white">
                        {formatDate(booking.check_in_date)}
                      </p>
                    </div>
                    <div>
                      <span className="text-neutral-500 dark:text-neutral-400">ออก:</span>
                      <p className="font-medium text-neutral-900 dark:text-white">
                        {formatDate(booking.check_out_date)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      {booking.guest_email || 'ไม่ระบุอีเมล'}
                    </div>
                    <div className="flex items-center space-x-2">
                      
                      {canManageBookings(user) && booking.status === 'pending' && (
                        <button
                          onClick={() => {
                            setConfirmAction(() => () => handleStatusUpdate(booking.id, 'confirmed'));
                            setConfirmActionType('success');
                            setShowConfirmModal(true);
                          }}
                          className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}

                      {canManageBookings(user) && booking.status !== 'cancelled' && (
                        <button
                          onClick={() => {
                            setConfirmAction(() => () => handleStatusUpdate(booking.id, 'cancelled'));
                            setConfirmActionType('warning');
                            setShowConfirmModal(true);
                          }}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}

                      {canDeleteBookings(user).all && (
                        <button
                          onClick={() => {
                            setConfirmAction(() => () => handleDeleteBooking(booking.id));
                            setConfirmActionType('danger');
                            setShowConfirmModal(true);
                          }}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            </>
          )}
        </div>
      </div>

      {/* Booking Detail Modal */}
      {showBookingModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                รายละเอียดการจอง
              </h3>
              <button
                onClick={() => setShowBookingModal(false)}
                className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                    รหัสการจอง
                  </label>
                  <p className="text-lg font-semibold text-neutral-900 dark:text-white">
                    {selectedBooking.booking_id || `BK${selectedBooking.id}`}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                    สถานะ
                  </label>
                  {getStatusBadge(selectedBooking.status)}
                </div>
              </div>

              {/* Guest Info */}
              <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4">
                <h4 className="font-semibold text-neutral-900 dark:text-white mb-3 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  ข้อมูลผู้เข้าพัก
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      ชื่อ-นามสกุล
                    </label>
                    <p className="text-neutral-900 dark:text-white">{selectedBooking.guest_name || 'ไม่ระบุ'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      อีเมล
                    </label>
                    <p className="text-neutral-900 dark:text-white">{selectedBooking.guest_email || 'ไม่ระบุ'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      เบอร์โทรศัพท์
                    </label>
                    <p className="text-neutral-900 dark:text-white">{selectedBooking.guest_phone || 'ไม่ระบุ'}</p>
                  </div>
                </div>
              </div>

              {/* Booking Details */}
              <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4">
                <h4 className="font-semibold text-neutral-900 dark:text-white mb-3 flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  รายละเอียดการจอง
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      ห้องพัก
                    </label>
                    <p className="text-neutral-900 dark:text-white">
                      {selectedBooking.room_number || 'ไม่ระบุ'} ({
                        selectedBooking.room_type_name || 
                        (typeof selectedBooking.room_type === 'object' ? selectedBooking.room_type?.name : selectedBooking.room_type) || 
                        'ไม่ระบุ'
                      })
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      จำนวนผู้เข้าพัก
                    </label>
                    <p className="text-neutral-900 dark:text-white">{selectedBooking.guest_count || 1} คน</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      วันที่เข้าพัก
                    </label>
                    <p className="text-neutral-900 dark:text-white">{formatDate(selectedBooking.check_in_date)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      วันที่ออก
                    </label>
                    <p className="text-neutral-900 dark:text-white">{formatDate(selectedBooking.check_out_date)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      จำนวนคืน
                    </label>
                    <p className="text-neutral-900 dark:text-white">
                      {(() => {
                        const checkIn = selectedBooking.check_in_date || selectedBooking.checkInDate;
                        const checkOut = selectedBooking.check_out_date || selectedBooking.checkOutDate;
                        
                        const checkInDate = safeParseDate(checkIn);
                        const checkOutDate = safeParseDate(checkOut);
                        
                        if (!checkInDate || !checkOutDate) return 1;
                        
                        const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
                        return nights > 0 ? nights : 1;
                      })()} คืน
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      จำนวนเงินรวม
                    </label>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">
                      {formatPrice(selectedBooking.total_amount || selectedBooking.totalAmount || selectedBooking.total_price || selectedBooking.totalPrice)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              {selectedBooking.special_requests && (
                <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4">
                  <h4 className="font-semibold text-neutral-900 dark:text-white mb-3 flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    คำขอพิเศษ
                  </h4>
                  <p className="text-neutral-900 dark:text-white">{selectedBooking.special_requests}</p>
                </div>
              )}

              {/* Payment Slips */}
              {selectedBooking.payment_slips && selectedBooking.payment_slips.length > 0 && (
                <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4">
                  <h4 className="font-semibold text-neutral-900 dark:text-white mb-3 flex items-center">
                    <Receipt className="h-5 w-5 mr-2" />
                    หลักฐานการชำระเงิน ({selectedBooking.payment_slips.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedBooking.payment_slips.map((slip, index) => (
                      <div key={slip.id || index} className="border border-neutral-200 dark:border-neutral-600 rounded-lg p-3">
                        <div className="mb-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                              สลีป #{slip.id || index + 1}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              slip.status === 'approved' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                : slip.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                : slip.status === 'rejected'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                            }`}>
                              {slip.status === 'approved' ? 'อนุมัติแล้ว' : 
                               slip.status === 'pending' ? 'รอตรวจสอบ' : 
                               slip.status === 'rejected' ? 'ปฏิเสธ' : 'ไม่ระบุ'}
                            </span>
                          </div>
                          {slip.payment_date && (
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                              วันที่: {formatDate(slip.payment_date)}
                            </p>
                          )}
                          {slip.amount && (
                            <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                              จำนวนเงิน: {formatPrice(slip.amount)}
                            </p>
                          )}
                        </div>
                        
                        {slip.file_path && (
                          <div className="relative">
                            {/* Check if file is an image */}
                            {(() => {
                              const fileExt = slip.file_path.split('.').pop()?.toLowerCase();
                              const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt);
                              
                              if (isImage) {
                                return (
                                  <>
                                    <img
                                      src={`http://localhost:3001/uploads/${slip.file_path}`}
                                      alt={`Payment slip ${slip.id || index + 1}`}
                                      className="w-full h-32 object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                                      onClick={() => {
                                        window.open(`http://localhost:3001/uploads/${slip.file_path}`, '_blank');
                                      }}
                                      onError={(e) => {
                                        console.log('Image load error:', slip.file_path);
                                        e.target.style.display = 'none';
                                        e.target.nextElementSibling.style.display = 'flex';
                                      }}
                                    />
                                    <div className="w-full h-32 bg-neutral-200 dark:bg-neutral-600 rounded-md flex items-center justify-center text-neutral-500 dark:text-neutral-400" style={{display: 'none'}}>
                                      <div className="text-center">
                                        <Receipt className="h-8 w-8 mx-auto mb-2" />
                                        <p className="text-xs">ไม่สามารถแสดงรูปภาพได้</p>
                                        <p className="text-xs text-blue-500 cursor-pointer hover:underline" 
                                           onClick={() => window.open(`http://localhost:3001/uploads/${slip.file_path}`, '_blank')}>
                                          คลิกเพื่อดู
                                        </p>
                                      </div>
                                    </div>
                                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 rounded-md flex items-center justify-center cursor-pointer">
                                      <Eye className="h-6 w-6 text-white opacity-0 hover:opacity-100 transition-opacity" />
                                    </div>
                                  </>
                                );
                              } else {
                                // For non-image files, show a download/view link
                                return (
                                  <div className="w-full h-32 bg-neutral-100 dark:bg-neutral-600 rounded-md flex items-center justify-center text-neutral-600 dark:text-neutral-400 border-2 border-dashed border-neutral-300 dark:border-neutral-500">
                                    <div className="text-center">
                                      <Receipt className="h-8 w-8 mx-auto mb-2" />
                                      <p className="text-xs font-medium mb-1">ไฟล์แนบ</p>
                                      <p className="text-xs text-blue-500 cursor-pointer hover:underline" 
                                         onClick={() => window.open(`http://localhost:3001/uploads/${slip.file_path}`, '_blank')}>
                                        คลิกเพื่อดู
                                      </p>
                                    </div>
                                  </div>
                                );
                              }
                            })()}
                          </div>
                        )}
                        
                        {slip.file_name && (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 truncate">
                            {slip.file_name}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4">
                <h4 className="font-semibold text-neutral-900 dark:text-white mb-3">
                  ข้อมูลระบบ
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      วันที่จอง
                    </label>
                    <p className="text-neutral-900 dark:text-white">{formatDate(selectedBooking.created_at)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      อัปเดตล่าสุด
                    </label>
                    <p className="text-neutral-900 dark:text-white">{formatDate(selectedBooking.updated_at)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmAction}
        title="ยืนยันการดำเนินการ"
        message="คุณแน่ใจหรือไม่ที่จะดำเนินการนี้?"
        confirmText="ยืนยัน"
        cancelText="ยกเลิก"
        type={confirmActionType}
        isLoading={actionLoading}
      />


    </div>
  );
}
