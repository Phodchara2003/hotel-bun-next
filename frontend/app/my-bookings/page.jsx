'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, MapPin, Users, Clock, User, Mail, Phone, Edit, X } from 'lucide-react';
import { formatDateThai, formatDateForInput as formatDateForInputUtil, calculateNights as calculateNightsUtil, getCurrentDateString } from '../../lib/dateUtils';

export default function MyBookings() {
  const { user } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingBookingId, setCancellingBookingId] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  
  // Date modification states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState(null);
  const [newCheckIn, setNewCheckIn] = useState('');
  const [newCheckOut, setNewCheckOut] = useState('');
  const [modifying, setModifying] = useState(false);


  useEffect(() => {
    if (user) {
      fetchMyBookings();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchMyBookings = async () => {
    try {
      console.log('🔍 Fetching bookings for user:', user.id);
      
      // ใช้ API endpoint ที่ถูกต้องพร้อม headers สำหรับ authentication
      const response = await fetch('http://localhost:5680/api/bookings', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      console.log('📊 Bookings API response:', result);
      
      if (result.success && result.data) {
        console.log('✅ Successfully loaded bookings:', result.data.length);
        
        // Debug: แสดงโครงสร้างข้อมูลแต่ละการจอง
        result.data.forEach((booking, index) => {
          console.log(`📋 Booking ${index + 1}:`, {
            id: booking.id,
            check_in_date: booking.check_in_date,
            check_out_date: booking.check_out_date,
            hotel_name: booking.hotel_name,
            room_type_name: booking.room_type_name,
            allFields: Object.keys(booking)
          });
        });
        
        // ข้อมูลจาก mysql-server.cjs มาเป็น snake_case อยู่แล้ว
        console.log('🔄 Using bookings data as-is (mysql-server format)');
        setBookings(result.data);
      } else if (result.bookings && result.bookings.length >= 0) {
        // Fallback สำหรับ response format ใหม่ (จาก bookings.js)
        console.log('✅ Successfully loaded bookings (new format):', result.bookings.length);
        setBookings(result.bookings);
      } else {
        console.log('❌ No bookings found or error:', result.message || 'Unknown error');
        setBookings([]);
      }
    } catch (error) {
      console.error('❌ Error fetching bookings:', error);
      setBookings([]);
    } finally {
      setLoading(false);
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
        return 'เสร็จสิ้น';
      default:
        return 'ไม่ทราบสถานะ';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateNights = (checkIn, checkOut) => {
    return calculateNightsUtil(checkIn, checkOut);
  };

  const canCancelBooking = (booking) => {
    if (booking.status === 'cancelled' || booking.status === 'completed') {
      return false;
    }
    
    // Check if check-in date has passed using timezone-safe comparison
    const currentDateStr = getCurrentDateString();
    
    const checkInDateValue = booking.check_in_date || booking.checkInDate || booking.checkin_date;
    if (!checkInDateValue) {
      console.warn('No check-in date found for booking:', booking);
      return false;
    }
    
    // Extract date part from string for comparison (YYYY-MM-DD format)
    const checkInDateStr = typeof checkInDateValue === 'string' 
      ? checkInDateValue.split('T')[0] 
      : checkInDateValue;
    
    // Debug log
    console.log('Booking ID:', booking.id, 'Check-in date:', checkInDateStr, 'Current date:', currentDateStr, 'Can cancel:', checkInDateStr >= currentDateStr);
    
    // Only allow cancellation if check-in date hasn't passed
    return checkInDateStr >= currentDateStr;
  };

  const canModifyBooking = (booking) => {
    if (booking.status === 'cancelled' || booking.status === 'completed') {
      return false;
    }
    
    // Check if check-in date has passed using timezone-safe comparison
    const currentDateStr = getCurrentDateString();
    
    const checkInDateValue = booking.check_in_date || booking.checkInDate || booking.checkin_date;
    if (!checkInDateValue) {
      return false;
    }
    
    // Extract date part from string for comparison (YYYY-MM-DD format)
    const checkInDateStr = typeof checkInDateValue === 'string' 
      ? checkInDateValue.split('T')[0] 
      : checkInDateValue;
    
    // Only allow modification if check-in date hasn't passed
    return checkInDateStr >= currentDateStr;
  };

  const handleCancelBooking = async (bookingId) => {
    setCancelling(true);
    try {
      const response = await fetch(`http://localhost:5680/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'cancel',
          user_id: user.id,
          reason: cancelReason
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert('ส่งคำขอยกเลิกการจองเรียบร้อยแล้ว รอการพิจารณาจากเจ้าหน้าที่');
        
        // Refresh bookings to show updated status
        fetchMyBookings();
      } else {
        alert(result.message || 'เกิดข้อผิดพลาดในการส่งคำขอยกเลิกการจอง');
      }
    } catch (error) {
      console.error('Error creating cancellation request:', error);
      alert('เกิดข้อผิดพลาดในการส่งคำขอยกเลิกการจอง');
    } finally {
      setCancelling(false);
      setShowCancelModal(false);
      setCancellingBookingId(null);
      setCancelReason('');
    }
  };

  const handleModifyBooking = async (bookingId) => {
    if (!newCheckIn || !newCheckOut) {
      alert('กรุณาเลือกวันเข้าพักและวันออก');
      return;
    }

    const checkIn = new Date(newCheckIn);
    const checkOut = new Date(newCheckOut);

    if (checkIn >= checkOut) {
      alert('วันเข้าพักต้องก่อนวันออก');
      return;
    }

    // Allow modification to current date or future dates
    // Remove restriction on past dates since backend handles the validation based on original booking

    setModifying(true);
    try {
      const response = await fetch(`http://localhost:5680/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'modify_dates',
          user_id: user.id,
          check_in_date: checkIn.toISOString().split('T')[0], // Format as YYYY-MM-DD
          check_out_date: checkOut.toISOString().split('T')[0]  // Format as YYYY-MM-DD
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert('แก้ไขการจองเรียบร้อยแล้ว');
        
        // Refresh bookings to show updated data
        fetchMyBookings();
        
        // Close modal
        setShowEditModal(false);
        setEditingBookingId(null);
        setNewCheckIn('');
        setNewCheckOut('');
      } else {
        alert(result.message || 'เกิดข้อผิดพลาดในการแก้ไขการจอง');
      }
    } catch (error) {
      console.error('Error modifying booking:', error);
      alert('เกิดข้อผิดพลาดในการแก้ไขการจอง');
    } finally {
      setModifying(false);
    }
  };

  const openCancelModal = (bookingId) => {
    setCancellingBookingId(bookingId);
    setShowCancelModal(true);
  };

  const openEditModal = (booking) => {
    setEditingBookingId(booking.id);
    
    // Set current dates as defaults using safe date formatting
    const checkInDate = booking.check_in_date;
    const checkOutDate = booking.check_out_date;
    
    // Use utility function for safe date formatting
    setNewCheckIn(formatDateForInputUtil(checkInDate));
    setNewCheckOut(formatDateForInputUtil(checkOutDate));
    setShowEditModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'ไม่ระบุวันที่';
    return formatDateThai(dateString);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">เข้าสู่ระบบเพื่อดูการจอง</h1>
          <p className="text-gray-600 mb-6">กรุณาเข้าสู่ระบบเพื่อดูประวัติการจองของคุณ</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
          >
            เข้าสู่ระบบ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">การจองของฉัน</h1>
          <p className="text-gray-600">ดูและจัดการการจองห้องพักของคุณ</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-gray-400 mb-4">
              <Calendar className="w-16 h-16 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">ยังไม่มีการจอง</h2>
            <p className="text-gray-500 mb-6">คุณยังไม่ได้ทำการจองห้องพักกับเรา</p>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              เริ่มจองห้องพัก
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4">
                    <div className="flex items-center space-x-3 mb-2 lg:mb-0">
                      <h3 className="text-xl font-semibold text-gray-800">
                        {booking.hotel_name || 'โรงแรม'}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(booking.status)}`}>
                        {getStatusText(booking.status)}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">รหัสการจอง</p>
                      <p className="font-mono text-lg font-semibold">#{booking.id}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">เช็คอิน</p>
                        <p className="text-sm font-medium">{formatDate(booking.check_in_date)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">เช็คเอาท์</p>
                        <p className="text-sm font-medium">{formatDate(booking.check_out_date)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">จำนวนผู้เข้าพัก</p>
                        <p className="text-sm font-medium">{booking.guests} คน</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">จำนวนคืน</p>
                        <p className="text-sm font-medium">
                          {calculateNights(booking.check_in_date, booking.check_out_date)} คืน
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                      <div className="mb-2 sm:mb-0">
                        <p className="text-sm text-gray-600">ห้องพัก</p>
                        <p className="font-medium">{booking.room_type_name || 'ห้องพัก'}</p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm text-gray-600">ยอดรวม</p>
                        <p className="text-2xl font-bold text-green-600">
                          ฿{booking.total_price?.toLocaleString() || '0'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Guest Information */}
                  <div className="mt-4 pt-4 border-t bg-gray-50 -mx-6 px-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">ชื่อผู้เข้าพัก:</span>
                        <p className="mt-1">{booking.guest_name}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">อีเมล:</span>
                        <p className="mt-1">{booking.guest_email}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">เบอร์โทร:</span>
                        <p className="mt-1">{booking.guest_phone}</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      onClick={() => router.push(`/booking-details/${booking.id}`)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      ดูรายละเอียด
                    </button>
                    
                    {booking.status === 'pending' && (
                      <button
                        onClick={() => router.push(`/payment-step?bookingId=${booking.id}&amount=${booking.total_price}`)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        ชำระเงิน
                      </button>
                    )}
                    
                    {canModifyBooking(booking) && (
                      <button
                        onClick={() => openEditModal(booking)}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                        disabled={modifying}
                      >
                        <Edit className="w-4 h-4" />
                        แก้ไขวันที่
                      </button>
                    )}
                    
                    {canCancelBooking(booking) && (
                      <button
                        onClick={() => openCancelModal(booking.id)}
                        className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                        disabled={cancelling}
                      >
                        ขอยกเลิกการจอง
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Statistics */}
        {bookings.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {bookings.length}
              </div>
              <p className="text-gray-600">การจองทั้งหมด</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {bookings.filter(b => b.status === 'confirmed').length}
              </div>
              <p className="text-gray-600">ยืนยันแล้ว</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-2">
                {bookings.filter(b => b.status === 'pending').length}
              </div>
              <p className="text-gray-600">รอการยืนยัน</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">
                {bookings.filter(b => b.status === 'cancelled').length}
              </div>
              <p className="text-gray-600">ยกเลิกแล้ว</p>
            </div>
          </div>
        )}
      </div>

      {/* Edit Booking Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">แก้ไขวันที่จอง</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingBookingId(null);
                  setNewCheckIn('');
                  setNewCheckOut('');
                }}
                className="text-gray-400 hover:text-gray-600"
                disabled={modifying}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                วันเข้าพัก
              </label>
              <input
                type="date"
                value={newCheckIn}
                onChange={(e) => setNewCheckIn(e.target.value)}
                min={(() => {
                  const today = new Date();
                  const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000);
                  return localDate.toISOString().split('T')[0];
                })()}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={modifying}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                วันออก
              </label>
              <input
                type="date"
                value={newCheckOut}
                onChange={(e) => setNewCheckOut(e.target.value)}
                min={newCheckIn || (() => {
                  const today = new Date();
                  const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000);
                  return localDate.toISOString().split('T')[0];
                })()}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={modifying}
              />
            </div>
            
            <p className="text-sm text-gray-500 mb-6">
              หมายเหตุ: การแก้ไขวันที่จะมีการคำนวณราคาใหม่ตามจำนวนคืนที่เข้าพัก
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingBookingId(null);
                  setNewCheckIn('');
                  setNewCheckOut('');
                }}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={modifying}
              >
                ยกเลิก
              </button>
              <button
                onClick={() => handleModifyBooking(editingBookingId)}
                className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                disabled={modifying || !newCheckIn || !newCheckOut}
              >
                {modifying ? 'กำลังแก้ไข...' : 'บันทึกการแก้ไข'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">ขอยกเลิกการจอง</h3>
            <p className="text-gray-600 mb-4">
              กรุณาระบุเหตุผลในการขอยกเลิกการจอง (ไม่บังคับ)
            </p>
            
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="ระบุเหตุผลในการยกเลิก..."
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 resize-none h-24"
              disabled={cancelling}
            />
            
            <p className="text-sm text-gray-500 mb-6">
              คำขอยกเลิกของคุณจะส่งไปยังเจ้าหน้าที่เพื่อพิจารณา
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancellingBookingId(null);
                  setCancelReason('');
                }}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={cancelling}
              >
                ยกเลิก
              </button>
              <button
                onClick={() => handleCancelBooking(cancellingBookingId)}
                className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                disabled={cancelling}
              >
                {cancelling ? 'กำลังส่งคำขอ...' : 'ส่งคำขอยกเลิก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}