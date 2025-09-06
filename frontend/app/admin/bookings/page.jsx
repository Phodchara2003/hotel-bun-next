'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { bookingAPI } from '../../../lib/api';
import { isStaffOrAdmin, canEdit, canDelete, canManageBookings } from '../../../lib/roles';
import ConfirmModal from '../../../components/ConfirmModal';
import AdminNavigation from '../../../components/AdminNavigation';
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
  Edit,
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
      const response = await bookingAPI.getAllBookings();
      if (response.success) {
        setBookings(response.data);
        calculateStats(response.data);
      } else if (response.bookings) {
        // Handle alternative response format
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
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800">
      <div className="container mx-auto px-4 py-8">
        {/* Admin Navigation */}
        <AdminNavigation 
          title="จัดการการจอง"
          description="จัดการและติดตามการจองทั้งหมดในระบบ"
        />

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
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-6 mb-8 transform transition-all duration-700 delay-200 ease-out ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">การจองทั้งหมด</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.totalBookings}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">รอการยืนยัน</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pendingBookings}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">ยืนยันแล้ว</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.confirmedBookings}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">สำเร็จแล้ว</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.completedBookings}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">ยกเลิกแล้ว</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.cancelledBookings}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">วันนี้</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.todayBookings}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">รายได้รวม</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatPrice(stats.totalRevenue)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <Receipt className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className={`bg-white dark:bg-neutral-800 rounded-xl shadow-lg border-2 border-neutral-200 dark:border-neutral-700 p-8 mb-8 transform transition-all duration-700 delay-300 ease-out ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-8 flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
              <Filter className="h-5 w-5 text-white" />
            </div>
            ค้นหาและกรองข้อมูล
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Search */}
            <div>
              <label className="block text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-3">
                ค้นหา
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary-500 dark:text-primary-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="รหัสจอง, อีเมล, ชื่อผู้เข้าพัก..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-16 input-field text-sm"
                />
              </div>
            </div>
            
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-3">
                สถานะ
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="input-field text-sm"
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
                className="w-full px-6 py-3 bg-primary-100 hover:bg-primary-200 dark:bg-primary-900 dark:hover:bg-primary-800 text-primary-700 dark:text-primary-300 font-semibold rounded-lg border border-primary-300 dark:border-primary-600 transition-all duration-200"
              >
                ล้างตัวกรอง
              </button>
            </div>
          </div>
          
          <div className="mt-8 flex justify-between items-center">
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              แสดงผล <span className="font-bold text-primary-600 dark:text-primary-400">{filteredBookings.length}</span> จาก <span className="font-bold text-neutral-900 dark:text-white">{bookings.length}</span> รายการ
            </span>
          </div>
        </div>

        {/* Bookings Table */}
        <div className={`bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden transform transition-all duration-700 delay-400 ease-out ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
              รายการการจอง ({filteredBookings.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="mt-4 text-neutral-600 dark:text-neutral-400">กำลังโหลดข้อมูล...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="mx-auto h-12 w-12 text-neutral-400 dark:text-neutral-600 mb-4" />
              <p className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
                ไม่มีข้อมูลการจอง
              </p>
              <p className="text-neutral-600 dark:text-neutral-400">
                ยังไม่มีการจองในระบบหรือไม่ตรงกับเงื่อนไขการค้นหา
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 dark:bg-neutral-900">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      รหัสจอง
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      ผู้เข้าพัก
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      ห้องพัก
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      วันที่เข้าพัก
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      วันที่ออก
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      จำนวนเงิน
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      สถานะ
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      จัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-neutral-900 dark:text-white">
                          {booking.booking_id || `BK${booking.id}`}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-neutral-900 dark:text-white">
                              {booking.guest_name || 'ไม่ระบุ'}
                            </div>
                            <div className="text-sm text-neutral-500 dark:text-neutral-400">
                              {booking.guest_email || 'ไม่ระบุ'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-900 dark:text-white">
                          {booking.room_number || 'ไม่ระบุ'}
                        </div>
                        <div className="text-sm text-neutral-500 dark:text-neutral-400">
                          {booking.room_type || 'ไม่ระบุ'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-white">
                        {formatDate(booking.check_in_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-white">
                        {formatDate(booking.check_out_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-white">
                        {formatPrice(booking.total_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(booking.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowBookingModal(true);
                            }}
                            className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {canEdit(user.role) && booking.status === 'pending' && (
                            <>
                              <button
                                onClick={() => {
                                  setConfirmAction(() => () => handleStatusUpdate(booking.id, 'confirmed'));
                                  setShowConfirmModal(true);
                                }}
                                className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 transition-colors"
                                title="ยืนยันการจอง"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setConfirmAction(() => () => handleStatusUpdate(booking.id, 'cancelled'));
                                  setShowConfirmModal(true);
                                }}
                                className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors"
                                title="ยกเลิกการจอง"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {canDelete(user.role) && (
                            <button
                              onClick={() => {
                                setConfirmAction(() => () => handleDeleteBooking(booking.id));
                                setShowConfirmModal(true);
                              }}
                              className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors"
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
                      {selectedBooking.room_number || 'ไม่ระบุ'} ({selectedBooking.room_type || 'ไม่ระบุ'})
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
        isLoading={actionLoading}
      />
    </div>
  );
}
