'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { bookingAPI } from '../../../lib/api';
import { isStaffOrAdmin } from '../../../lib/roles';
import AdminNavigation from '../../../components/AdminNavigation';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Filter,
  MapPin,
  User,
  Bed
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function BookingCalendar() {
  const { user, isAuthenticated } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    roomType: '',
    month: new Date().getMonth(),
    year: new Date().getFullYear()
  });

  // Calendar view modes
  const [viewMode, setViewMode] = useState('month'); // month, week, day

  useEffect(() => {
    setIsVisible(true);
    if (isAuthenticated && user && isStaffOrAdmin(user)) {
      fetchBookings();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    filterBookings();
  }, [bookings, filters, currentDate]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingAPI.getAllBookings();
      if (response.success) {
        setBookings(response.data || []);
      } else if (response.bookings) {
        setBookings(response.bookings || []);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลการจอง');
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = bookings;

    // Filter by status
    if (filters.status) {
      filtered = filtered.filter(booking => booking.status === filters.status);
    }

    // Filter by search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(booking => 
        booking.booking_reference?.toLowerCase().includes(searchLower) ||
        booking.guest_name?.toLowerCase().includes(searchLower) ||
        booking.guest_email?.toLowerCase().includes(searchLower) ||
        booking.room_type_name?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by room type
    if (filters.roomType) {
      filtered = filtered.filter(booking => 
        booking.room_type_name?.toLowerCase().includes(filters.roomType.toLowerCase())
      );
    }

    setFilteredBookings(filtered);
  };

  // Calendar helper functions
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const getBookingsForDate = (date) => {
    if (!date) return [];
    
    const dateStr = date.toISOString().split('T')[0];
    
    return filteredBookings.filter(booking => {
      const checkInDate = booking.check_in_date || booking.checkInDate;
      const checkOutDate = booking.check_out_date || booking.checkOutDate;
      
      if (!checkInDate || !checkOutDate) return false;
      
      const checkIn = new Date(checkInDate).toISOString().split('T')[0];
      const checkOut = new Date(checkOutDate).toISOString().split('T')[0];
      
      return dateStr >= checkIn && dateStr <= checkOut;
    });
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const formatMonth = (date) => {
    return date.toLocaleDateString('th-TH', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'confirmed':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'รอยืนยัน';
      case 'confirmed':
        return 'ยืนยันแล้ว';
      case 'completed':
        return 'สำเร็จ';
      case 'cancelled':
        return 'ยกเลิก';
      default:
        return 'ไม่ทราบ';
    }
  };

  const handleBookingClick = (booking) => {
    setSelectedBooking(booking);
    setShowBookingModal(true);
  };

  const closeBookingModal = () => {
    setShowBookingModal(false);
    setSelectedBooking(null);
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">กรุณาเข้าสู่ระบบ</h2>
          <p className="text-neutral-600 dark:text-neutral-400">เพื่อเข้าถึงหน้าปฏิทินการจอง</p>
        </div>
      </div>
    );
  }

  if (!isStaffOrAdmin(user)) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">ไม่มีสิทธิ์เข้าถึง</h2>
          <p className="text-neutral-600 dark:text-neutral-400">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800">
      <div className="container mx-auto px-4 py-8">
        {/* Admin Navigation */}
        <AdminNavigation 
          title="ปฏิทินการจอง"
          description="ดูภาพรวมการจองในรูปแบบปฏิทิน"
        />

        {/* Quick Stats */}
        <div className={`grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 transform transition-all duration-700 ease-out ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">การจองวันนี้</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {getBookingsForDate(new Date()).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">รอยืนยัน</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {filteredBookings.filter(b => b.status === 'pending').length}
                </p>
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
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {filteredBookings.filter(b => b.status === 'confirmed').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">ทั้งหมด</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {filteredBookings.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-700 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-neutral-600 dark:text-neutral-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Controls */}
        <div className={`bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 p-6 mb-8 transform transition-all duration-700 ease-out ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <Filter className="h-5 w-5 text-neutral-500" />
              
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
              >
                <option value="">ทุกสถานะ</option>
                <option value="pending">รอยืนยัน</option>
                <option value="confirmed">ยืนยันแล้ว</option>
                <option value="completed">สำเร็จ</option>
                <option value="cancelled">ยกเลิก</option>
              </select>
              
              <input
                type="text"
                placeholder="ค้นหาการจอง..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
              />

              <input
                type="text"
                placeholder="ประเภทห้องพัก..."
                value={filters.roomType}
                onChange={(e) => setFilters(prev => ({ ...prev, roomType: e.target.value }))}
                className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
              />
              
              <button
                onClick={() => setFilters({ status: '', search: '', roomType: '', month: new Date().getMonth(), year: new Date().getFullYear() })}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-300 rounded-lg transition-colors"
              >
                ล้างตัวกรอง
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                แสดง {filteredBookings.length} จาก {bookings.length} รายการ
              </span>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className={`bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden transform transition-all duration-700 delay-200 ease-out ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          {/* Calendar Header */}
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Calendar className="h-6 w-6" />
                <h2 className="text-xl font-bold">{formatMonth(currentDate)}</h2>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateMonth(-1)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
                >
                  วันนี้
                </button>
                <button
                  onClick={() => navigateMonth(1)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
          ) : (
            <>
              {/* Calendar Grid */}
              <div className="p-6">
                {/* Days of Week Header */}
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((day, index) => (
                    <div key={index} className="p-3 text-center font-semibold text-neutral-600 dark:text-neutral-400 text-sm">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {getDaysInMonth(currentDate).map((date, index) => {
                    const dayBookings = date ? getBookingsForDate(date) : [];
                    const isToday = date && date.toDateString() === new Date().toDateString();
                    
                    return (
                      <div
                        key={index}
                        className={`min-h-[120px] p-2 border border-neutral-200 dark:border-neutral-700 rounded-lg transition-all duration-200 ${
                          date 
                            ? 'bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer' 
                            : 'bg-neutral-50 dark:bg-neutral-900'
                        } ${
                          isToday ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20' : ''
                        }`}
                      >
                        {date && (
                          <>
                            <div className={`text-sm font-medium mb-2 ${
                              isToday 
                                ? 'text-primary-600 dark:text-primary-400' 
                                : 'text-neutral-900 dark:text-white'
                            }`}>
                              {date.getDate()}
                            </div>
                            
                            <div className="space-y-1">
                              {dayBookings.slice(0, 2).map((booking, bookingIndex) => (
                                <div
                                  key={bookingIndex}
                                  onClick={() => handleBookingClick(booking)}
                                  className={`text-xs p-1 rounded text-white cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(booking.status)}`}
                                  title={`${booking.guest_name || booking.guest_email} - ${booking.room_type_name}`}
                                >
                                  <div className="truncate font-medium">
                                    {booking.guest_name || booking.guest_email?.split('@')[0]}
                                  </div>
                                  <div className="truncate text-xs opacity-90">
                                    {booking.room_type_name}
                                  </div>
                                </div>
                              ))}
                              
                              {dayBookings.length > 2 && (
                                <div className="text-xs text-neutral-500 dark:text-neutral-400 p-1 text-center bg-neutral-100 dark:bg-neutral-800 rounded">
                                  +{dayBookings.length - 2} รายการ
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Legend */}
              <div className="bg-neutral-50 dark:bg-neutral-900 p-4 border-t border-neutral-200 dark:border-neutral-700">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">สถานะ:</span>
                  
                  {[
                    { status: 'pending', label: 'รอยืนยัน' },
                    { status: 'confirmed', label: 'ยืนยันแล้ว' },
                    { status: 'completed', label: 'สำเร็จ' },
                    { status: 'cancelled', label: 'ยกเลิก' }
                  ].map(({ status, label }) => (
                    <div key={status} className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded ${getStatusColor(status)}`}></div>
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Booking Details Modal */}
        {showBookingModal && selectedBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-neutral-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                  รายละเอียดการจอง
                </h3>
                <button
                  onClick={closeBookingModal}
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                >
                  <XCircle className="h-5 w-5 text-neutral-500" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Booking Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">สถานะ</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium text-white ${getStatusColor(selectedBooking.status)}`}>
                    {getStatusText(selectedBooking.status)}
                  </span>
                </div>

                {/* Guest Information */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                    <User className="h-4 w-4" />
                    ข้อมูลผู้เข้าพัก
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">ชื่อ:</span>
                      <p className="font-medium text-neutral-900 dark:text-white">
                        {selectedBooking.guest_name || 'ไม่ระบุ'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">อีเมล:</span>
                      <p className="font-medium text-neutral-900 dark:text-white">
                        {selectedBooking.guest_email || 'ไม่ระบุ'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Room Information */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                    <Bed className="h-4 w-4" />
                    ข้อมูลห้องพัก
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">ประเภทห้อง:</span>
                      <p className="font-medium text-neutral-900 dark:text-white">
                        {selectedBooking.room_type_name || 'ไม่ระบุ'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">จำนวนผู้เข้าพัก:</span>
                      <p className="font-medium text-neutral-900 dark:text-white">
                        {selectedBooking.guest_count || 1} คน
                      </p>
                    </div>
                  </div>
                </div>

                {/* Booking Details */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    รายละเอียดการจอง
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">วันเข้าพัก:</span>
                      <p className="font-medium text-neutral-900 dark:text-white">
                        {selectedBooking.check_in_date 
                          ? new Date(selectedBooking.check_in_date).toLocaleDateString('th-TH')
                          : 'ไม่ระบุ'
                        }
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">วันออก:</span>
                      <p className="font-medium text-neutral-900 dark:text-white">
                        {selectedBooking.check_out_date 
                          ? new Date(selectedBooking.check_out_date).toLocaleDateString('th-TH')
                          : 'ไม่ระบุ'
                        }
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">รหัสการจอง:</span>
                      <p className="font-medium text-neutral-900 dark:text-white">
                        {selectedBooking.booking_reference || 'ไม่ระบุ'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">ราคารวม:</span>
                      <p className="font-medium text-green-600 dark:text-green-400">
                        ฿{(selectedBooking.total_amount || selectedBooking.totalAmount || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
