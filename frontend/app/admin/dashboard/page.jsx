'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { bookingAPI } from '../../../lib/api';
import Cookies from 'js-cookie';
import ConfirmModal from '../../../components/ConfirmModal';
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
  X,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Receipt,
  Search,
  Filter,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    totalRevenue: 0,
    bookingsWithReceipts: 0
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    dateFrom: '',
    dateTo: ''
  });
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [selectedBookings, setSelectedBookings] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchData();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    // Filter bookings based on filters
    let filtered = bookings;
    
    if (filters.status) {
      filtered = filtered.filter(booking => booking.status === filters.status);
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(booking => 
        booking.bookingReference.toLowerCase().includes(searchLower) ||
        booking.userEmail.toLowerCase().includes(searchLower) ||
        booking.guestName?.toLowerCase().includes(searchLower) ||
        booking.roomTypeName.toLowerCase().includes(searchLower)
      );
    }
    
    if (filters.dateFrom) {
      filtered = filtered.filter(booking => 
        new Date(booking.checkInDate) >= new Date(filters.dateFrom)
      );
    }
    
    if (filters.dateTo) {
      filtered = filtered.filter(booking => 
        new Date(booking.checkOutDate) <= new Date(filters.dateTo)
      );
    }
    
    setFilteredBookings(filtered);
  }, [bookings, filters]);

  const fetchData = async () => {
    try {
      console.log('Fetching admin data...');
      console.log('Current user:', user);
      console.log('Auth token:', Cookies.get('auth_token') ? 'Present' : 'Missing');
      
      // Fetch all bookings (admin should see all)
      const response = await bookingAPI.getAllBookings();
      const allBookings = response.bookings || [];
      setBookings(allBookings);

      // Calculate stats
      const totalBookings = allBookings.length;
      const pendingBookings = allBookings.filter(b => b.status === 'pending').length;
      const confirmedBookings = allBookings.filter(b => b.status === 'confirmed').length;
      const completedBookings = allBookings.filter(b => b.status === 'completed').length;
      const cancelledBookings = allBookings.filter(b => b.status === 'cancelled').length;
      const totalRevenue = allBookings
        .filter(b => b.status === 'confirmed' || b.status === 'completed')
        .reduce((sum, b) => sum + b.totalPrice, 0);
      const bookingsWithReceipts = allBookings.filter(b => b.paymentReceiptUrl).length;

      setStats({
        totalBookings,
        pendingBookings,
        confirmedBookings,
        completedBookings,
        cancelledBookings,
        totalRevenue,
        bookingsWithReceipts
      });
    } catch (error) {
      console.error('Error fetching admin data:', error);
      console.error('Error response:', error.response);
      
      if (error.response?.status === 401) {
        toast.error('กรุณาเข้าสู่ระบบใหม่');
        // Force refresh the page to trigger auth check
        window.location.reload();
      } else {
        toast.error('ไม่สามารถโหลดข้อมูลได้');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBookingAction = async (bookingId, action) => {
    setConfirmAction({ bookingId, action });
    setShowConfirmModal(true);
  };

  const executeBookingAction = async () => {
    if (!confirmAction) return;
    
    try {
      setActionLoading(true);
      
      // Handle bulk delete
      if (confirmAction.action === 'bulk-delete') {
        const deletePromises = confirmAction.bookingIds.map(bookingId => 
          bookingAPI.deleteBooking(bookingId)
        );
        
        await Promise.all(deletePromises);
        
        toast.success(`ลบการจองสำเร็จ ${confirmAction.count} รายการ!`, {
          duration: 3000,
          icon: '🗑️'
        });
        
        setSelectedBookings([]);
        setShowBulkActions(false);
      } else {
        // Handle single booking actions
        const { bookingId, action } = confirmAction;
        
        if (action === 'confirm') {
          await bookingAPI.confirmBooking(bookingId);
          toast.success('ยืนยันการจองสำเร็จ!', {
            duration: 2000,
            icon: '✅'
          });
        } else if (action === 'approve') {
          await bookingAPI.approveBooking(bookingId);
          toast.success('อนุมัติการจองสำเร็จ!', {
            duration: 2000,
            icon: '✅'
          });
        } else if (action === 'delete') {
          await bookingAPI.deleteBooking(bookingId);
          toast.success('ลบการจองสำเร็จ!', {
            duration: 2000,
            icon: '🗑️'
          });
          // Close modal if it's open
          if (showBookingModal) {
            setShowBookingModal(false);
            setSelectedBooking(null);
          }
        } else if (action === 'cancel') {
          await bookingAPI.adminCancelBooking(bookingId);
          toast.success('ยกเลิกการจองสำเร็จ!', {
            duration: 2000,
            icon: '❌'
          });
        }
      }
      
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Booking action error:', error);
      const message = error.response?.data?.error || 'เกิดข้อผิดพลาด';
      const actionText = confirmAction.action === 'confirm' ? 'ยืนยัน' : 
                        confirmAction.action === 'approve' ? 'อนุมัติ' : 
                        confirmAction.action === 'delete' ? 'ลบ' : 
                        confirmAction.action === 'bulk-delete' ? 'ลบ' : 'ยกเลิก';
      toast.error(`ไม่สามารถ${actionText}การจองได้: ${message}`, {
        duration: 4000,
        icon: '❌'
      });
    } finally {
      setActionLoading(false);
      setShowConfirmModal(false);
      setConfirmAction(null);
    }
  };

  const handleGoToPayment = (bookingId) => {
    window.open(`/payment/${bookingId}`, '_blank');
  };

  const handleViewBookingDetails = async (bookingId) => {
    try {
      const response = await bookingAPI.getBookingById(bookingId);
      setSelectedBooking(response);
      setShowBookingModal(true);
    } catch (error) {
      console.error('Error fetching booking details:', error);
      toast.error('ไม่สามารถโหลดรายละเอียดการจองได้');
    }
  };

  const closeBookingModal = () => {
    setShowBookingModal(false);
    setSelectedBooking(null);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'รอการยืนยัน';
      case 'confirmed':
        return 'ยืนยันแล้ว';
      case 'cancelled':
        return 'ยกเลิกแล้ว';
      case 'completed':
        return 'สำเร็จแล้ว';
      default:
        return status;
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      search: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  // Remove old functions - using new modal approach

  const handleSelectBooking = (bookingId) => {
    setSelectedBookings(prev => {
      const newSelected = prev.includes(bookingId)
        ? prev.filter(id => id !== bookingId)
        : [...prev, bookingId];
      
      setShowBulkActions(newSelected.length > 0);
      return newSelected;
    });
  };

  const handleSelectAllBookings = () => {
    if (selectedBookings.length === filteredBookings.length) {
      setSelectedBookings([]);
      setShowBulkActions(false);
    } else {
      const allIds = filteredBookings.map(booking => booking.id);
      setSelectedBookings(allIds);
      setShowBulkActions(true);
    }
  };

  const handleBookingActionNew = async (bookingId, action) => {
    // Use the same logic as handleBookingAction to avoid duplication
    handleBookingAction(bookingId, action);
  };

  const handleBulkDeleteNew = async () => {
    if (selectedBookings.length === 0) {
      toast.error('กรุณาเลือกการจองที่ต้องการลบ');
      return;
    }

    // Handle bulk delete with executeBookingAction
    setConfirmAction({
      bookingIds: selectedBookings,
      action: 'bulk-delete',
      type: 'bulk',
      count: selectedBookings.length
    });
    setShowConfirmModal(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">กรุณาเข้าสู่ระบบ</h2>
          <p className="text-gray-600">เพื่อเข้าถึงระบบจัดการ</p>
        </div>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">ไม่มีสิทธิ์เข้าถึง</h2>
          <p className="text-gray-600">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto container-padding">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">แดชบอร์ดผู้จัดการ</h1>
          <p className="text-gray-600">จัดการการจองและดูสถิติโรงแรม</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    การจองทั้งหมด
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {stats.totalBookings}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    รอการยืนยัน
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {stats.pendingBookings}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    ยืนยันแล้ว
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {stats.confirmedBookings}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    รายได้รวม
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    ฿{stats.totalRevenue.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    สำเร็จแล้ว
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {stats.completedBookings}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Receipt className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    มีใบเสร็จ
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {stats.bookingsWithReceipts}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    ยกเลิกแล้ว
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {stats.cancelledBookings}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    อัตราสำเร็จ
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {stats.totalBookings > 0 ? Math.round((stats.completedBookings / stats.totalBookings) * 100) : 0}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>



        {/* Filters */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            ค้นหาและกรองข้อมูล
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ค้นหา
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="รหัสจอง, อีเมล, ชื่อผู้เข้าพัก..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10 input-field"
                />
              </div>
            </div>
            
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                สถานะ
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="input-field"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                วันเข้าพักจาก
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="input-field"
              />
            </div>
            
            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                วันเข้าพักถึง
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="input-field"
              />
            </div>
          </div>
          
          <div className="mt-4 flex justify-between items-center">
            <span className="text-sm text-gray-600">
              แสดงผล {filteredBookings.length} จาก {bookings.length} รายการ
            </span>
            <button
              onClick={clearFilters}
              className="btn-secondary text-sm"
            >
              ล้างตัวกรอง
            </button>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">การจองล่าสุด</h2>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Bulk Actions Bar */}
              {showBulkActions && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-800 font-medium">
                      เลือกแล้ว {selectedBookings.length} รายการ
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleBulkDeleteNew}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        ลบที่เลือก
                      </button>
                      <button
                        onClick={() => {
                          setSelectedBookings([]);
                          setShowBulkActions(false);
                        }}
                        className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedBookings.length === filteredBookings.length && filteredBookings.length > 0}
                        onChange={handleSelectAllBookings}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      รหัสการจอง
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      ลูกค้า
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      ผู้เข้าพัก
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      ห้องพัก
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      วันที่
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      ราคา
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      ใบเสร็จ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      สถานะ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      จัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBookings.slice(0, 20).map((booking) => (
                    <tr key={booking.id} className={`hover:bg-gray-50 ${selectedBookings.includes(booking.id) ? 'bg-blue-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedBookings.includes(booking.id)}
                          onChange={() => handleSelectBooking(booking.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {booking.bookingReference}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">
                        <div>
                          <div className="font-medium text-gray-900">{booking.userEmail}</div>
                          <div className="text-gray-500 text-xs">
                            {new Date(booking.createdAt).toLocaleDateString('th-TH')} {new Date(booking.createdAt).toLocaleTimeString('th-TH')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        {booking.guestName ? (
                          <div>
                            <div className="font-medium text-gray-900">{booking.guestName}</div>
                            <div className="text-gray-500 text-xs">{booking.guestPhone}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">ยังไม่กรอกข้อมูล</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">
                        <div>
                          <div className="font-medium">{booking.roomTypeName}</div>
                          <div className="text-gray-500 text-xs">{booking.guests} ผู้เข้าพัก</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        <div>
                          <div className="font-medium">
                            {new Date(booking.checkInDate).toLocaleDateString('th-TH')}
                          </div>
                          <div className="text-gray-500 text-xs">
                            ถึง {new Date(booking.checkOutDate).toLocaleDateString('th-TH')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        ฿{booking.totalPrice.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        {booking.paymentReceiptUrl ? (
                          <div className="flex items-center">
                            <Receipt className="h-4 w-4 text-green-600 mr-1" />
                            <span className="text-green-600 font-medium text-xs">มีใบเสร็จ</span>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <XCircle className="h-4 w-4 text-red-400 mr-1" />
                            <span className="text-red-400 text-xs">ไม่มีใบเสร็จ</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {getStatusIcon(booking.status)}
                          <span className="ml-1">{getStatusText(booking.status)}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewBookingDetails(booking.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-semibold transition-colors flex items-center"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            ดูรายละเอียด
                          </button>
                          
                          {booking.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleBookingActionNew(booking.id, 'confirm')}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-semibold transition-colors"
                              >
                                ยืนยัน
                              </button>
                              <button
                                onClick={() => handleBookingActionNew(booking.id, 'cancel')}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-semibold transition-colors"
                              >
                                ยกเลิก
                              </button>
                            </>
                          )}
                          
                          {booking.status === 'confirmed' && (
                            <>
                              <button
                                onClick={() => handleGoToPayment(booking.id)}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs font-semibold transition-colors"
                              >
                                ชำระเงิน
                              </button>
                              {/* Show approve button only if guest info AND payment receipt are available */}
                              {booking.guestName && booking.guestPhone && booking.guestEmail && booking.paymentReceiptUrl && (
                                <button
                                  onClick={() => handleBookingActionNew(booking.id, 'approve')}
                                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-semibold transition-colors"
                                >
                                  อนุมัติ
                                </button>
                              )}
                              <button
                                onClick={() => handleBookingActionNew(booking.id, 'cancel')}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-semibold transition-colors"
                              >
                                ยกเลิก
                              </button>
                            </>
                          )}
                          
                          {(booking.status === 'cancelled' || booking.status === 'completed') && (
                            <span className="text-gray-600 text-xs font-medium">ไม่สามารถแก้ไขได้</span>
                          )}
                          
                          {/* Delete button - Always available for admin */}
                          <button
                            onClick={() => handleBookingActionNew(booking.id, 'delete')}
                            className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs font-semibold transition-colors flex items-center"
                            title="ลบการจอง"
                          >
                            <Trash2 className="h-3 w-3" />
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

        {/* Booking Details Modal */}
        {showBookingModal && selectedBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">
                  รายละเอียดการจอง #{selectedBooking.bookingReference}
                </h2>
                <button
                  onClick={closeBookingModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Booking Status */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">สถานะการจอง</h3>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedBooking.status)}`}>
                    {getStatusIcon(selectedBooking.status)}
                    <span className="ml-2">{getStatusText(selectedBooking.status)}</span>
                  </span>
                </div>

                {/* Customer Information */}
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <h3 className="font-bold text-orange-900 mb-3 flex items-center text-lg">
                    <User className="h-5 w-5 mr-2" />
                    ข้อมูลผู้จอง
                  </h3>
                  <div className="space-y-3 text-sm">
                    <p><span className="font-bold text-orange-900">อีเมล:</span> <span className="text-gray-900 font-semibold">{selectedBooking.userEmail || 'ไม่ระบุ'}</span></p>
                    <p><span className="font-bold text-orange-900">จองเมื่อ:</span> <span className="text-gray-800">{new Date(selectedBooking.createdAt).toLocaleDateString('th-TH')} {new Date(selectedBooking.createdAt).toLocaleTimeString('th-TH')}</span></p>
                    {selectedBooking.updatedAt && (
                      <p><span className="font-bold text-orange-900">อัปเดตล่าสุด:</span> <span className="text-gray-800">{new Date(selectedBooking.updatedAt).toLocaleDateString('th-TH')} {new Date(selectedBooking.updatedAt).toLocaleTimeString('th-TH')}</span></p>
                    )}
                  </div>
                </div>

                {/* Hotel & Room Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h3 className="font-bold text-blue-900 mb-3 flex items-center text-lg">
                      <Hotel className="h-5 w-5 mr-2" />
                      ข้อมูลโรงแรม
                    </h3>
                    <div className="space-y-3 text-sm">
                      <p><span className="font-bold text-blue-900">โรงแรม:</span> <span className="text-gray-900 font-semibold">{selectedBooking.hotel?.name}</span></p>
                      <p><span className="font-bold text-blue-900">ห้อง:</span> <span className="text-gray-900 font-semibold">{selectedBooking.roomType?.name}</span></p>
                      <p><span className="font-bold text-blue-900">รายละเอียด:</span> <span className="text-gray-800">{selectedBooking.roomType?.description}</span></p>
                      {selectedBooking.roomType?.amenities && (
                        <div>
                          <span className="font-bold text-blue-900">สิ่งอำนวยความสะดวก:</span>
                          <ul className="mt-2 ml-4 list-disc text-gray-800">
                            {selectedBooking.roomType.amenities.map((amenity, index) => (
                              <li key={index} className="py-1">{amenity}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <h3 className="font-bold text-green-900 mb-3 flex items-center text-lg">
                      <Calendar className="h-5 w-5 mr-2" />
                      ข้อมูลการจอง
                    </h3>
                    <div className="space-y-3 text-sm">
                      <p><span className="font-bold text-green-900">วันเข้าพัก:</span> <span className="text-gray-900 font-semibold">{new Date(selectedBooking.checkInDate).toLocaleDateString('th-TH')}</span></p>
                      <p><span className="font-bold text-green-900">วันออก:</span> <span className="text-gray-900 font-semibold">{new Date(selectedBooking.checkOutDate).toLocaleDateString('th-TH')}</span></p>
                      <p><span className="font-bold text-green-900">จำนวนผู้เข้าพัก:</span> <span className="text-gray-900 font-semibold">{selectedBooking.guests} คน</span></p>
                      <p><span className="font-bold text-green-900">ราคารวม:</span> <span className="font-bold text-green-700 text-lg">฿{selectedBooking.totalPrice?.toLocaleString()}</span></p>
                      <p><span className="font-bold text-green-900">จองเมื่อ:</span> <span className="text-gray-800">{new Date(selectedBooking.createdAt).toLocaleDateString('th-TH')} {new Date(selectedBooking.createdAt).toLocaleTimeString('th-TH')}</span></p>
                    </div>
                  </div>
                </div>

                {/* Guest Information (if available) */}
                {selectedBooking.guestName && (
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <h3 className="font-bold text-purple-900 mb-3 flex items-center text-lg">
                      <User className="h-5 w-5 mr-2" />
                      ข้อมูลผู้เข้าพัก
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-3">
                        <p className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-purple-600" />
                          <span className="font-bold text-purple-900">ชื่อ:</span> 
                          <span className="ml-2 text-gray-900 font-semibold">{selectedBooking.guestName}</span>
                        </p>
                        <p className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-purple-600" />
                          <span className="font-bold text-purple-900">เบอร์โทร:</span> 
                          <span className="ml-2 text-gray-900 font-semibold">{selectedBooking.guestPhone}</span>
                        </p>
                        <p className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-purple-600" />
                          <span className="font-bold text-purple-900">อีเมล:</span> 
                          <span className="ml-2 text-blue-700 font-semibold">{selectedBooking.guestEmail}</span>
                        </p>
                      </div>
                      <div className="space-y-3">
                        {selectedBooking.guestIdNumber && (
                          <p className="flex items-center">
                            <CreditCard className="h-4 w-4 mr-2 text-purple-600" />
                            <span className="font-bold text-purple-900">เลขบัตรประชาชน:</span> 
                            <span className="ml-2 text-gray-900 font-semibold">{selectedBooking.guestIdNumber}</span>
                          </p>
                        )}
                        {selectedBooking.guestAddress && (
                          <p className="flex items-start">
                            <MapPin className="h-4 w-4 mr-2 text-purple-600 mt-0.5" />
                            <span className="font-bold text-purple-900">ที่อยู่:</span> 
                            <span className="ml-2 text-gray-800">{selectedBooking.guestAddress}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Receipt (if available) */}
                {selectedBooking.paymentReceiptUrl && (
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <h3 className="font-bold text-green-900 mb-3 flex items-center text-lg">
                      <Receipt className="h-5 w-5 mr-2" />
                      ใบเสร็จการชำระเงิน
                    </h3>
                    <div className="space-y-3">
                      <div className="bg-white rounded-lg p-4 border">
                        <div className="flex justify-center">
                          <img
                            src={selectedBooking.paymentReceiptUrl}
                            alt="ใบเสร็จการชำระเงิน"
                            className="max-w-full max-h-96 object-contain border rounded cursor-pointer"
                            onClick={() => window.open(selectedBooking.paymentReceiptUrl, '_blank')}
                          />
                        </div>
                        <p className="text-sm text-green-800 text-center mt-2">
                          คลิกรูปภาพเพื่อดูขนาดใหญ่
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Special Requests */}
                {selectedBooking.specialRequests && (
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <h3 className="font-bold text-yellow-900 mb-3 flex items-center text-lg">
                      <FileText className="h-5 w-5 mr-2" />
                      ความต้องการพิเศษ
                    </h3>
                    <p className="text-sm text-gray-900 bg-white p-3 rounded border font-medium">{selectedBooking.specialRequests}</p>
                  </div>
                )}

                {/* Booking Status Section */}
                <div className="bg-gray-100 rounded-lg p-4 border border-gray-300">
                  <h3 className="font-bold text-gray-900 mb-3 text-lg">สถานะการจอง</h3>
                  <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(selectedBooking.status)}`}>
                    {getStatusIcon(selectedBooking.status)}
                    <span className="ml-2">{getStatusText(selectedBooking.status)}</span>
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="flex space-x-3">
                    {selectedBooking.status === 'pending' && (
                      <>
                        <button
                          onClick={() => {
                            handleBookingActionNew(selectedBooking.id, 'confirm');
                            closeBookingModal();
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold transition-colors"
                        >
                          ยืนยันการจอง
                        </button>
                        <button
                          onClick={() => {
                            handleBookingActionNew(selectedBooking.id, 'cancel');
                            closeBookingModal();
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold transition-colors"
                        >
                          ยกเลิกการจอง
                        </button>
                      </>
                    )}
                    
                    {selectedBooking.status === 'confirmed' && (
                      <>
                        <button
                          onClick={() => handleGoToPayment(selectedBooking.id)}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-semibold transition-colors"
                        >
                          ไปหน้าชำระเงิน
                        </button>
                        {selectedBooking.guestName && selectedBooking.guestPhone && selectedBooking.guestEmail && selectedBooking.paymentReceiptUrl && (
                          <button
                            onClick={() => {
                              handleBookingActionNew(selectedBooking.id, 'approve');
                              closeBookingModal();
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold transition-colors"
                          >
                            อนุมัติการจอง
                          </button>
                        )}
                        <button
                          onClick={() => {
                            handleBookingActionNew(selectedBooking.id, 'cancel');
                            closeBookingModal();
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold transition-colors"
                        >
                          ยกเลิกการจอง
                        </button>
                      </>
                    )}
                    
                    {/* Delete button - Always available for admin */}
                    <button
                      onClick={() => {
                        handleBookingActionNew(selectedBooking.id, 'delete');
                        closeBookingModal();
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold transition-colors flex items-center"
                      title="ลบการจองนี้"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      ลบการจอง
                    </button>
                  </div>
                  
                  <button
                    onClick={closeBookingModal}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded font-semibold transition-colors"
                  >
                    ปิด
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Action Modal */}
        <ConfirmModal
          isOpen={showConfirmModal}
          onClose={() => {
            setShowConfirmModal(false);
            setConfirmAction(null);
          }}
          onConfirm={executeBookingAction}
          title={
            confirmAction?.action === 'delete' 
              ? '⚠️ ลบการจอง' 
              : confirmAction?.action === 'bulk-delete'
                ? '⚠️ ลบการจองหลายรายการ'
                : confirmAction?.action === 'confirm' 
                  ? 'ยืนยันการจอง'
                  : confirmAction?.action === 'approve'
                    ? 'อนุมัติการจอง'
                    : 'ยกเลิกการจอง'
          }
          message={
            confirmAction?.action === 'delete'
              ? 'คำเตือน: การลบจะไม่สามารถกู้คืนได้ และจะลบข้อมูลทั้งหมดรวมถึงข้อมูลการจอง, ข้อมูลผู้เข้าพัก, และใบเสร็จการชำระเงิน'
              : confirmAction?.action === 'bulk-delete'
                ? `คุณกำลังจะลบการจอง ${confirmAction?.count} รายการพร้อมกัน การลบจะไม่สามารถกู้คืนได้`
                : `คุณต้องการ${confirmAction?.action === 'confirm' ? 'ยืนยัน' : confirmAction?.action === 'approve' ? 'อนุมัติ' : 'ยกเลิก'}การจองนี้หรือไม่?`
          }
          confirmText={
            confirmAction?.action === 'delete' 
              ? 'ลบการจอง'
              : confirmAction?.action === 'bulk-delete'
                ? `ลบ ${confirmAction?.count} รายการ` 
                : confirmAction?.action === 'confirm' 
                  ? 'ยืนยันการจอง'
                  : confirmAction?.action === 'approve'
                    ? 'อนุมัติการจอง'
                    : 'ยกเลิกการจอง'
          }
          cancelText="ยกเลิก"
          type={confirmAction?.action === 'delete' || confirmAction?.action === 'bulk-delete' ? 'danger' : confirmAction?.action === 'cancel' ? 'warning' : 'info'}
        />
      </div>
    </div>
  );
}
