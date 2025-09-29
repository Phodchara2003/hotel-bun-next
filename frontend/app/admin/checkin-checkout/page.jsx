'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Calendar, 
  Phone, 
  Mail, 
  IdCard,
  Hotel,
  Bed,
  Users,
  MessageSquare,
  RefreshCw,
  Search,
  Filter,
  LogIn,
  LogOut,
  Timer
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CheckInOutPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    dateRange: 'today'
  });
  
  // Modal states
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      fetchBookings();
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    applyFilters();
  }, [bookings, filters]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/admin/bookings/detailed');
      const result = await response.json();
      
      if (result.success) {
        // Filter for confirmed and checked-in bookings only
        const relevantBookings = result.data.filter(booking => 
          ['confirmed', 'checked_in'].includes(booking.status)
        );
        setBookings(relevantBookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('ไม่สามารถดึงข้อมูลการจองได้');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...bookings];
    
    // Search filter
    if (filters.search) {
      filtered = filtered.filter(booking =>
        booking.guest_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        booking.booking_reference?.toLowerCase().includes(filters.search.toLowerCase()) ||
        booking.guest_phone?.includes(filters.search)
      );
    }
    
    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(booking => booking.status === filters.status);
    }
    
    // Date filter
    const today = new Date().toDateString();
    if (filters.dateRange === 'today') {
      filtered = filtered.filter(booking => {
        const checkInDate = new Date(booking.check_in_date).toDateString();
        return checkInDate === today;
      });
    }
    
    setFilteredBookings(filtered);
  };

  const handleCheckIn = async (bookingId) => {
    setActionLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/bookings/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          booking_id: bookingId,
          staff_id: user?.id,
          notes: notes
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('เช็คอินสำเร็จ!');
        await fetchBookings();
        setShowCheckInModal(false);
        setSelectedBooking(null);
        setNotes('');
      } else {
        toast.error(result.message || 'เกิดข้อผิดพลาดในการเช็คอิน');
      }
    } catch (error) {
      console.error('Check-in error:', error);
      toast.error('ไม่สามารถเช็คอินได้');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async (bookingId) => {
    setActionLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/bookings/check-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          booking_id: bookingId,
          staff_id: user?.id,
          notes: notes
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('เช็คเอ้าสำเร็จ!');
        await fetchBookings();
        setShowCheckOutModal(false);
        setSelectedBooking(null);
        setNotes('');
      } else {
        toast.error(result.message || 'เกิดข้อผิดพลาดในการเช็คเอ้า');
      }
    } catch (error) {
      console.error('Check-out error:', error);
      toast.error('ไม่สามารถเช็คเอ้าได้');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'checked_in':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'checked_out':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'confirmed':
        return 'ยืนยันแล้ว';
      case 'checked_in':
        return 'เช็คอินแล้ว';
      case 'checked_out':
        return 'เช็คเอ้าแล้ว';
      default:
        return status;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
            ไม่ได้รับอนุญาต
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            คุณต้องเข้าสู่ระบบเป็นแอดมินหรือพนักงานเพื่อเข้าถึงหน้านี้
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className={`mb-8 transform transition-all duration-700 ease-out ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
                เช็คอิน / เช็คเอ้า
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400">
                จัดการการเช็คอินและเช็คเอ้าของลูกค้า
              </p>
            </div>
            <button
              onClick={fetchBookings}
              disabled={loading}
              className="btn-primary flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              รีเฟรช
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className={`mb-6 transform transition-all duration-700 delay-200 ease-out ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}>
          <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
              <h3 className="font-semibold text-neutral-900 dark:text-white">ฟิลเตอร์</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  ค้นหา
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    placeholder="ชื่อ, เบอร์โทร, หมายเลขจอง"
                    className="input-field pl-10"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  สถานะ
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="input-field"
                >
                  <option value="all">ทั้งหมด</option>
                  <option value="confirmed">ยืนยันแล้ว (พร้อมเช็คอิน)</option>
                  <option value="checked_in">เช็คอินแล้ว (พร้อมเช็คเอ้า)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  วันที่
                </label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                  className="input-field"
                >
                  <option value="all">ทั้งหมด</option>
                  <option value="today">วันนี้</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        <div className={`transform transition-all duration-700 delay-400 ease-out ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}>
          {filteredBookings.length === 0 ? (
            <div className="bg-white dark:bg-neutral-800 rounded-2xl p-12 text-center shadow-lg border border-neutral-200 dark:border-neutral-700">
              <Hotel className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                ไม่พบการจอง
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400">
                ไม่มีการจองที่ต้องจัดการในขณะนี้
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredBookings.map((booking, index) => (
                <div
                  key={booking.id}
                  className={`bg-white dark:bg-neutral-800 rounded-2xl shadow-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden transform transition-all duration-500 hover:shadow-xl ${
                    isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                  }`}
                  style={{ transitionDelay: `${600 + index * 100}ms` }}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-xl flex items-center justify-center">
                          <Hotel className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                            {booking.guest_name}
                          </h3>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            {booking.booking_reference}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {getStatusLabel(booking.status)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div>
                        <div className="flex items-center text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                          <Calendar className="h-4 w-4 mr-1" />
                          เช็คอิน
                        </div>
                        <p className="text-sm font-medium text-neutral-900 dark:text-white">
                          {formatDate(booking.check_in_date)}
                        </p>
                      </div>
                      
                      <div>
                        <div className="flex items-center text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                          <Calendar className="h-4 w-4 mr-1" />
                          เช็คเอ้า
                        </div>
                        <p className="text-sm font-medium text-neutral-900 dark:text-white">
                          {formatDate(booking.check_out_date)}
                        </p>
                      </div>
                      
                      <div>
                        <div className="flex items-center text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                          <Users className="h-4 w-4 mr-1" />
                          จำนวนแขก
                        </div>
                        <p className="text-sm font-medium text-neutral-900 dark:text-white">
                          {booking.guests || 1} คน
                        </p>
                      </div>
                      
                      <div>
                        <div className="flex items-center text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                          <Bed className="h-4 w-4 mr-1" />
                          ประเภทเตียง
                        </div>
                        <p className="text-sm font-medium text-neutral-900 dark:text-white">
                          {booking.bed_type === 'single' ? 'เตียงเดี่ยว' : 'เตียงคู่'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                      {booking.guest_phone && (
                        <div className="flex items-center text-sm text-neutral-600 dark:text-neutral-400">
                          <Phone className="h-4 w-4 mr-2" />
                          {booking.guest_phone}
                        </div>
                      )}
                      {booking.guest_email && (
                        <div className="flex items-center text-sm text-neutral-600 dark:text-neutral-400">
                          <Mail className="h-4 w-4 mr-2" />
                          {booking.guest_email}
                        </div>
                      )}
                    </div>

                    {/* Check-in/Check-out times */}
                    {(booking.actual_check_in_time || booking.actual_check_out_time) && (
                      <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4 mb-4">
                        <h4 className="font-semibold text-neutral-900 dark:text-white mb-2">
                          ประวัติการเข้าพัก
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {booking.actual_check_in_time && (
                            <div>
                              <div className="flex items-center text-sm text-green-600 dark:text-green-400 mb-1">
                                <LogIn className="h-4 w-4 mr-1" />
                                เช็คอินเมื่อ
                              </div>
                              <p className="text-sm font-medium text-neutral-900 dark:text-white">
                                {formatDateTime(booking.actual_check_in_time)}
                              </p>
                            </div>
                          )}
                          {booking.actual_check_out_time && (
                            <div>
                              <div className="flex items-center text-sm text-red-600 dark:text-red-400 mb-1">
                                <LogOut className="h-4 w-4 mr-1" />
                                เช็คเอ้าเมื่อ
                              </div>
                              <p className="text-sm font-medium text-neutral-900 dark:text-white">
                                {formatDateTime(booking.actual_check_out_time)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                      {booking.status === 'confirmed' && (
                        <button
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowCheckInModal(true);
                            setNotes('');
                          }}
                          className="btn-primary flex items-center gap-2"
                        >
                          <LogIn className="h-4 w-4" />
                          เช็คอิน
                        </button>
                      )}
                      
                      {booking.status === 'checked_in' && (
                        <button
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowCheckOutModal(true);
                            setNotes('');
                          }}
                          className="btn-secondary flex items-center gap-2"
                        >
                          <LogOut className="h-4 w-4" />
                          เช็คเอ้า
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Check-in Modal */}
      {showCheckInModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <LogIn className="h-6 w-6 text-green-600" />
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                เช็คอิน
              </h3>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                ลูกค้า: {selectedBooking?.guest_name}
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                หมายเลขจอง: {selectedBooking?.booking_reference}
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                หมายเหตุ (ไม่บังคับ)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="เช่น ได้รับกุญแจห้อง, ชี้แจงกฎของโรงแรม"
                rows={3}
                className="input-field resize-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleCheckIn(selectedBooking?.id)}
                disabled={actionLoading}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                ยืนยันเช็คอิน
              </button>
              <button
                onClick={() => {
                  setShowCheckInModal(false);
                  setSelectedBooking(null);
                  setNotes('');
                }}
                className="btn-ghost flex-1"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Check-out Modal */}
      {showCheckOutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <LogOut className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                เช็คเอ้า
              </h3>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                ลูกค้า: {selectedBooking?.guest_name}
              </p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                หมายเลขจอง: {selectedBooking?.booking_reference}
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                หมายเหตุ (ไม่บังคับ)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="เช่น ตรวจสอบห้องแล้ว, คืนกุญแจเรียบร้อย"
                rows={3}
                className="input-field resize-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleCheckOut(selectedBooking?.id)}
                disabled={actionLoading}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                ยืนยันเช็คเอ้า
              </button>
              <button
                onClick={() => {
                  setShowCheckOutModal(false);
                  setSelectedBooking(null);
                  setNotes('');
                }}
                className="btn-ghost flex-1"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}