'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslation } from '../../translations';
import { bookingAPI } from '../../lib/api';
import { Calendar, Users, CreditCard, X, Check, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal';

export default function BookingsPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, confirmed, cancelled
  const [cancelModal, setCancelModal] = useState({ 
    isOpen: false, 
    bookingId: null, 
    bookingRef: '', 
    roomName: '', 
    hotelName: '' 
  });
  const [editDateModal, setEditDateModal] = useState({
    isOpen: false,
    bookingId: null,
    currentCheckIn: '',
    currentCheckOut: '',
    newCheckIn: '',
    newCheckOut: ''
  });

  const fetchBookings = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await bookingAPI.getBookings(params);
      
      // Filter out bookings where check-in date has passed
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0); // Set to start of day for comparison
      
      const activeBookings = (response.bookings || []).filter(booking => {
        // Only filter if booking is not completed or cancelled
        if (booking.status === 'completed' || booking.status === 'cancelled') {
          return true; // Show completed/cancelled bookings for history
        }
        
        // Try different possible field names for check-in date
        const checkInDateValue = booking.check_in_date || booking.checkInDate || booking.checkin_date;
        if (!checkInDateValue) {
          return true; // Keep booking if no check-in date found
        }
        
        const checkInDate = new Date(checkInDateValue);
        checkInDate.setHours(0, 0, 0, 0);
        
        // Hide active bookings that have passed check-in date
        return checkInDate >= currentDate;
      });
      
      setBookings(activeBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('ไม่สามารถโหลดข้อมูลการจองได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchBookings();
      
      // Auto refresh every 30 seconds to check for status updates
      const interval = setInterval(() => {
        fetchBookings();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, filter]);

  const handleCancelBooking = async (bookingId) => {
    try {
      await bookingAPI.cancelBooking(bookingId);
      toast.success('ยกเลิกการจองสำเร็จ');
      fetchBookings(); // Refresh list
      setCancelModal({ isOpen: false, bookingId: null, bookingRef: '', roomName: '', hotelName: '' });
    } catch (error) {
      const message = error.response?.data?.error || 'ไม่สามารถยกเลิกการจองได้';
      toast.error(message);
    }
  };

  const openCancelModal = (bookingId, bookingRef, roomName, hotelName) => {
    setCancelModal({ isOpen: true, bookingId, bookingRef, roomName, hotelName });
  };

  const openEditDateModal = (booking) => {
    const checkIn = booking.check_in_date || booking.checkInDate || booking.checkin_date;
    const checkOut = booking.check_out_date || booking.checkOutDate || booking.checkout_date;
    
    setEditDateModal({
      isOpen: true,
      bookingId: booking.id,
      currentCheckIn: checkIn ? new Date(checkIn).toISOString().split('T')[0] : '',
      currentCheckOut: checkOut ? new Date(checkOut).toISOString().split('T')[0] : '',
      newCheckIn: checkIn ? new Date(checkIn).toISOString().split('T')[0] : '',
      newCheckOut: checkOut ? new Date(checkOut).toISOString().split('T')[0] : ''
    });
  };

  const closeEditDateModal = () => {
    setEditDateModal({
      isOpen: false,
      bookingId: null,
      currentCheckIn: '',
      currentCheckOut: '',
      newCheckIn: '',
      newCheckOut: ''
    });
  };

  const handleUpdateDates = async () => {
    try {
      const response = await api.put(`/bookings/${editDateModal.bookingId}`, {
        check_in_date: editDateModal.newCheckIn,
        check_out_date: editDateModal.newCheckOut
      });

      if (response.data.success) {
        toast.success('แก้ไขวันที่เข้าพักสำเร็จ');
        fetchBookings(); // Refresh list
        closeEditDateModal();
      } else {
        throw new Error(response.data.message || 'ไม่สามารถแก้ไขวันที่ได้');
      }
    } catch (error) {
      console.error('Error updating dates:', error);
      const message = error.response?.data?.message || error.message || 'ไม่สามารถแก้ไขวันที่ได้';
      toast.error(message);
    }
  };

  const closeCancelModal = () => {
    setCancelModal({ isOpen: false, bookingId: null, bookingRef: '', roomName: '', hotelName: '' });
  };

  // Check if booking can be cancelled (check-in date hasn't passed)
  const canCancelBooking = (booking) => {
    if (booking.status === 'cancelled' || booking.status === 'completed') {
      return false;
    }
    
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    // Try different possible field names for check-in date
    const checkInDateValue = booking.check_in_date || booking.checkInDate || booking.checkin_date;
    if (!checkInDateValue) {
      console.warn('No check-in date found for booking:', booking);
      return false;
    }
    
    const checkInDate = new Date(checkInDateValue);
    checkInDate.setHours(0, 0, 0, 0);
    
    // Debug log
    console.log('Booking ID:', booking.id, 'Check-in date:', checkInDate, 'Current date:', currentDate, 'Can cancel:', checkInDate >= currentDate);
    
    return checkInDate >= currentDate;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'confirmed':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status, paymentStatus) => {
    switch (status) {
      case 'pending':
        return 'รอการยืนยัน';
      case 'confirmed':
        if (paymentStatus === 'slip_uploaded') {
          return 'ยืนยันแล้ว (ส่งสลิปแล้ว รอตรวจสอบ)';
        } else if (paymentStatus === 'verified') {
          return 'ชำระเงินแล้ว';
        }
        return 'ยืนยันแล้ว (รอการชำระเงิน)';
      case 'cancelled':
        return 'ยกเลิกแล้ว';
      case 'completed':
        return 'สำเร็จแล้ว';
      default:
        return status;
    }
  };

  // Show loading while auth is checking
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">กรุณาเข้าสู่ระบบเพื่อดูการจองของคุณ</p>
          <a href="/login" className="mt-4 inline-block btn-primary">เข้าสู่ระบบ</a>
        </div>
      </div>
    );
  }

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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">กรุณาเข้าสู่ระบบ</h2>
          <p className="text-gray-600">เพื่อดูการจองของคุณ</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto container-padding">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">การจองของฉัน</h1>
          <p className="text-gray-600">จัดการและติดตามการจองโรงแรมของคุณ</p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'all', label: 'ทั้งหมด' },
                { key: 'pending', label: 'รอยืนยัน' },
                { key: 'confirmed', label: 'ยืนยันแล้ว' },
                { key: 'cancelled', label: 'ยกเลิกแล้ว' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    filter === tab.key
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {filter === 'all' ? 'ไม่มีการจองที่แสดงได้' : `ไม่มีการจอง${getStatusText(filter)}`}
            </h3>
            <p className="text-gray-500">
              {filter === 'all' 
                ? 'การจองที่เลยวันที่เช็คอินแล้วจะไม่แสดงในรายการ' 
                : 'เริ่มจองโรงแรมเพื่อเริ่มต้นการเดินทางของคุณ'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {booking.hotelName}
                      </h3>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                        <span className="ml-1">{getStatusText(booking.status, booking.paymentStatus)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          วันที่เข้าพัก
                        </div>
                        {canCancelBooking(booking) && booking.status === 'pending' && (
                          <button
                            onClick={() => openEditDateModal(booking)}
                            className="text-blue-600 hover:text-blue-800 text-xs underline"
                          >
                            แก้ไข
                          </button>
                        )}
                      </div>
                      <div className="font-semibold text-gray-900">
                        {new Date(booking.check_in_date || booking.checkInDate || booking.checkin_date).toLocaleDateString('th-TH')}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <Calendar className="h-4 w-4 mr-1" />
                        วันที่ออก
                      </div>
                      <div className="font-semibold text-gray-900">
                        {new Date(booking.check_out_date || booking.checkOutDate || booking.checkout_date).toLocaleDateString('th-TH')}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <Users className="h-4 w-4 mr-1" />
                        จำนวนผู้เข้าพัก
                      </div>
                      <div className="font-semibold text-gray-900">
                        {booking.guests} คน
                      </div>
                    </div>
                  </div>

                  {/* Room Details & Assignment */}
                  <div className="bg-blue-50 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-900">{booking.room_type_name || booking.roomTypeName}</div>
                        <div className="text-sm text-gray-600">รหัสการจอง: {booking.booking_reference || booking.bookingReference}</div>
                      </div>
                      {(booking.room_number || booking.floor) && (
                        <div className="bg-white rounded-lg p-3">
                          <div className="flex items-center space-x-4">
                            <div className="text-center">
                              <div className="text-sm text-gray-600">หมายเลขห้อง</div>
                              <div className="text-lg font-bold text-blue-600">
                                {booking.room_number || 'กำลังจัดสรร'}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm text-gray-600">ชั้น</div>
                              <div className="text-lg font-bold text-blue-600">
                                {booking.floor ? `${booking.floor}` : 'กำลังจัดสรร'}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-600">ราคารวม</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary-600">
                        ฿{(booking.total_price || booking.totalPrice || 0).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">รวมทั้งหมด</div>
                    </div>
                  </div>

                  {/* Status Info */}
                  {booking.status === 'pending' && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="bg-yellow-50 p-3 rounded-lg">
                        <p className="text-yellow-800 text-sm font-medium">⏳ รอการยืนยันจากผู้ดูแลระบบ</p>
                        <p className="text-yellow-600 text-xs mt-1">การจองจะได้รับการตอบกลับภายใน 24 ชั่วโมง</p>
                      </div>
                    </div>
                  )}
                  {booking.status === 'confirmed' && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-blue-800 text-sm font-medium">📋 ยืนยันแล้ว กรุณาชำระเงิน</p>
                        <p className="text-blue-600 text-xs mt-1">หลังจากชำระเงินและกรอกข้อมูลผู้เข้าพัก ต้องรอการอนุมัติจากผู้ดูแลระบบ</p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {(booking.status === 'pending' || booking.status === 'confirmed') ? (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      {booking.status === 'confirmed' && (
                        <div className="flex justify-end space-x-3 mb-3">
                          <button
                            onClick={() => window.open(`/payment/${booking.id}`, '_blank')}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                          >
                            <CreditCard className="h-4 w-4 mr-2" />
                            ดู QR Code
                          </button>
                          {booking.paymentStatus !== 'slip_uploaded' && booking.paymentStatus !== 'verified' && (
                            <button
                              onClick={() => window.open(`/payment/${booking.id}/slip`, '_blank')}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                            >
                              📸 อัพโหลดสลิป
                            </button>
                          )}
                          {booking.paymentStatus === 'slip_uploaded' && (
                            <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm">
                              ✅ ส่งสลิปแล้ว รอตรวจสอบ
                            </span>
                          )}
                          {booking.paymentStatus === 'verified' && (
                            <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm">
                              ✅ ชำระเงินแล้ว
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Show cancel button only if booking can be cancelled */}
                      {(() => {
                        const canCancel = canCancelBooking(booking);
                        console.log(`Booking ${booking.id}: canCancel = ${canCancel}, status = ${booking.status}`);
                        return canCancel;
                      })() ? (
                        <div className="flex justify-end">
                          <button
                            onClick={() => openCancelModal(
                              booking.id, 
                              booking.bookingReference, 
                              booking.roomTypeName, 
                              booking.hotelName
                            )}
                            className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            ยกเลิกการจอง
                          </button>
                        </div>
                      ) : (
                        <div className="bg-orange-50 p-3 rounded-lg">
                          <p className="text-orange-800 text-sm font-medium">🏨 ถึงวันเช็คอินแล้ว</p>
                          <p className="text-orange-600 text-xs mt-1">หากต้องการยกเลิกการจอง กรุณาติดต่อโรงแรมโดยตรง</p>
                        </div>
                      )}
                    </div>
                  ) : booking.status === 'completed' ? (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-green-800 text-sm font-medium">✅ การจองสำเร็จแล้ว</p>
                        <p className="text-green-600 text-xs mt-1">การจองได้รับการอนุมัติจากผู้ดูแลระบบแล้ว</p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cancel Booking Modal */}
        <ConfirmModal
          isOpen={cancelModal.isOpen}
          onClose={closeCancelModal}
          onConfirm={() => handleCancelBooking(cancelModal.bookingId)}
          title="ยกเลิกการจอง"
          message={
            <div className="space-y-2">
              <p>คุณต้องการยกเลิกการจองนี้หรือไม่?</p>
              <div className="bg-gray-50 p-3 rounded-lg text-sm">
                <div><strong>โรงแรม:</strong> {cancelModal.hotelName}</div>
                <div><strong>ห้องพัก:</strong> {cancelModal.roomName}</div>
                <div><strong>รหัสการจอง:</strong> {cancelModal.bookingRef}</div>
              </div>
              <p className="text-red-600 text-sm font-medium">⚠️ การยกเลิกนี้ไม่สามารถย้อนกลับได้</p>
            </div>
          }
          confirmText="ยกเลิกการจอง"
          cancelText="กลับ"
          type="danger"
        />

        {/* Edit Date Modal */}
        {editDateModal.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">แก้ไขวันที่เข้าพัก</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    วันที่เข้าพัก
                  </label>
                  <input
                    type="date"
                    value={editDateModal.newCheckIn}
                    onChange={(e) => setEditDateModal(prev => ({ ...prev, newCheckIn: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    วันที่ออก
                  </label>
                  <input
                    type="date"
                    value={editDateModal.newCheckOut}
                    onChange={(e) => setEditDateModal(prev => ({ ...prev, newCheckOut: e.target.value }))}
                    min={editDateModal.newCheckIn || new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="bg-gray-50 p-3 rounded-lg text-sm">
                  <div className="font-medium text-gray-700 mb-1">วันที่เดิม:</div>
                  <div>เข้าพัก: {new Date(editDateModal.currentCheckIn).toLocaleDateString('th-TH')}</div>
                  <div>ออก: {new Date(editDateModal.currentCheckOut).toLocaleDateString('th-TH')}</div>
                </div>

                <div className="bg-yellow-50 p-3 rounded-lg text-sm">
                  <p className="text-yellow-800 font-medium">⚠️ หมายเหตุ:</p>
                  <p className="text-yellow-700">สามารถแก้ไขวันที่ได้เฉพาะการจองที่ยังไม่ได้รับการยืนยันเท่านั้น</p>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={closeEditDateModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleUpdateDates}
                  disabled={!editDateModal.newCheckIn || !editDateModal.newCheckOut}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  บันทึก
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
