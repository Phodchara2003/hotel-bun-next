'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { bookingAPI } from '../../lib/api';
import { Calendar, Users, CreditCard, X, Check, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BookingsPage() {
  const { isAuthenticated } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, confirmed, cancelled

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

  const fetchBookings = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await bookingAPI.getBookings(params);
      setBookings(response.bookings || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('ไม่สามารถโหลดข้อมูลการจองได้');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!confirm('คุณต้องการยกเลิกการจองนี้หรือไม่?')) return;

    try {
      await bookingAPI.cancelBooking(bookingId);
      toast.success('ยกเลิกการจองสำเร็จ');
      fetchBookings(); // Refresh list
    } catch (error) {
      const message = error.response?.data?.error || 'ไม่สามารถยกเลิกการจองได้';
      toast.error(message);
    }
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

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'รอการยืนยัน';
      case 'confirmed':
        return 'ยืนยันแล้ว (รอการชำระเงิน)';
      case 'cancelled':
        return 'ยกเลิกแล้ว';
      case 'completed':
        return 'สำเร็จแล้ว';
      default:
        return status;
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
              {filter === 'all' ? 'ยังไม่มีการจอง' : `ไม่มีการจอง${getStatusText(filter)}`}
            </h3>
            <p className="text-gray-500">เริ่มจองโรงแรมเพื่อเริ่มต้นการเดินทางของคุณ</p>
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
                        <span className="ml-1">{getStatusText(booking.status)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <Calendar className="h-4 w-4 mr-1" />
                        วันที่เข้าพัก
                      </div>
                      <div className="font-semibold text-gray-900">
                        {new Date(booking.checkInDate).toLocaleDateString('th-TH')}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <Calendar className="h-4 w-4 mr-1" />
                        วันที่ออก
                      </div>
                      <div className="font-semibold text-gray-900">
                        {new Date(booking.checkOutDate).toLocaleDateString('th-TH')}
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

                  {/* Room & Price */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">{booking.roomTypeName}</div>
                      <div className="text-sm text-gray-600">รหัสการจอง: {booking.bookingReference}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary-600">
                        ฿{booking.totalPrice.toLocaleString()}
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
                  {booking.status === 'pending' || booking.status === 'confirmed' ? (
                    <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end space-x-3">
                      {booking.status === 'confirmed' && (
                        <button
                          onClick={() => window.open(`/payment/${booking.id}`, '_blank')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          ชำระเงิน
                        </button>
                      )}
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        ยกเลิกการจอง
                      </button>
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
      </div>
    </div>
  );
}
