'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { bookingAPI } from '../../lib/api';
import { Bell, Check, X, Calendar, CreditCard, Info, MapPin, Users, Clock, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'booking', 'payment'

  useEffect(() => {
    if (isAuthenticated) {
      fetchBookingsAndNotifications();
    }
  }, [isAuthenticated]);

  const fetchBookingsAndNotifications = async () => {
    try {
      // Fetch user's bookings
      const bookingsResponse = await bookingAPI.getBookings();
      setBookings(bookingsResponse.bookings || []);

      // Generate notifications based on bookings
      const bookingNotifications = generateBookingNotifications(bookingsResponse.bookings || []);
      
      // Add some general notifications
      const generalNotifications = [
        {
          id: 'info-1',
          type: 'info',
          title: 'ข้อมูลการให้บริการ',
          message: 'โรงแรมมีการปรับปรุงสิ่งอำนวยความสะดวกใหม่ พร้อมให้บริการแล้ว',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
          read: true,
          category: 'general'
        }
      ];

      setNotifications([...bookingNotifications, ...generalNotifications]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const generateBookingNotifications = (userBookings) => {
    const notifications = [];
    
    userBookings.forEach(booking => {
      const bookingDate = new Date(booking.createdAt);
      const checkInDate = new Date(booking.checkInDate);
      const now = new Date();
      
      // Notification for confirmed booking
      if (booking.status === 'confirmed') {
        notifications.push({
          id: `booking-confirmed-${booking.id}`,
          type: 'booking_confirmed',
          title: 'การจองได้รับการยืนยันแล้ว',
          message: `การจองห้อง ${booking.roomType?.name} เช็คอิน ${checkInDate.toLocaleDateString('th-TH')} ได้รับการยืนยันแล้ว`,
          createdAt: bookingDate,
          read: false,
          category: 'booking',
          booking: booking
        });
      }
      
      // Notification for pending payment
      if (booking.status === 'pending' && !booking.paymentReceipt) {
        notifications.push({
          id: `payment-reminder-${booking.id}`,
          type: 'payment_reminder',
          title: 'แจ้งเตือนการชำระเงิน',
          message: `กรุณาชำระเงินสำหรับการจองรหัส ${booking.bookingNumber} จำนวน ฿${booking.totalAmount?.toLocaleString()}`,
          createdAt: bookingDate,
          read: false,
          category: 'payment',
          booking: booking
        });
      }
      
      // Notification for upcoming check-in (3 days before)
      const daysUntilCheckIn = Math.ceil((checkInDate - now) / (1000 * 60 * 60 * 24));
      if (daysUntilCheckIn <= 3 && daysUntilCheckIn > 0 && booking.status === 'confirmed') {
        notifications.push({
          id: `checkin-reminder-${booking.id}`,
          type: 'booking_reminder',
          title: 'แจ้งเตือนการเข้าพัก',
          message: `อีก ${daysUntilCheckIn} วันจะถึงวันเข้าพักของคุณที่ ${booking.hotel?.name}`,
          createdAt: new Date(now - 1000 * 60 * 60), // 1 hour ago
          read: false,
          category: 'reminder',
          booking: booking
        });
      }
    });
    
    return notifications;
  };

  const refreshNotifications = async () => {
    setRefreshing(true);
    try {
      await fetchBookingsAndNotifications();
      toast.success('อัปเดตการแจ้งเตือนแล้ว');
    } catch (error) {
      toast.error('ไม่สามารถอัปเดตได้');
    } finally {
      setRefreshing(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'booking_confirmed':
        return <Check className="h-6 w-6 text-green-600" />;
      case 'payment_reminder':
        return <CreditCard className="h-6 w-6 text-yellow-600" />;
      case 'booking_reminder':
        return <Calendar className="h-6 w-6 text-blue-600" />;
      case 'info':
        return <Info className="h-6 w-6 text-blue-600" />;
      default:
        return <Bell className="h-6 w-6 text-gray-600" />;
    }
  };

  const getNotificationColor = (type, read) => {
    if (read) return 'bg-gray-50';
    
    switch (type) {
      case 'booking_confirmed':
        return 'bg-green-50 border-l-4 border-green-400';
      case 'payment_reminder':
        return 'bg-yellow-50 border-l-4 border-yellow-400';
      case 'booking_reminder':
        return 'bg-blue-50 border-l-4 border-blue-400';
      case 'info':
        return 'bg-blue-50 border-l-4 border-blue-400';
      default:
        return 'bg-white';
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 60) {
      return `${diffInMinutes} นาทีที่แล้ว`;
    } else if (diffInHours < 24) {
      return `${diffInHours} ชั่วโมงที่แล้ว`;
    } else {
      return `${diffInDays} วันที่แล้ว`;
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
        return status;
    }
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
    toast.success('ทำเครื่องหมายทั้งหมดแล้ว');
  };

  const deleteNotification = (notificationId) => {
    setNotifications(prev => 
      prev.filter(notif => notif.id !== notificationId)
    );
    toast.success('ลบการแจ้งเตือนแล้ว');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'booking':
        return notification.category === 'booking';
      case 'payment':
        return notification.category === 'payment';
      default:
        return true;
    }
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">กรุณาเข้าสู่ระบบ</h2>
          <p className="text-gray-600">เพื่อดูการแจ้งเตือน</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto container-padding">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">การแจ้งเตือน</h1>
            <p className="text-gray-600">
              {unreadCount > 0 ? `คุณมีการแจ้งเตือนใหม่ ${unreadCount} รายการ` : 'ไม่มีการแจ้งเตือนใหม่'}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={refreshNotifications}
              disabled={refreshing}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-700 transition-colors"
            >
              <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>อัปเดต</span>
            </button>
            
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                ทำเครื่องหมายทั้งหมด
              </button>
            )}
          </div>
        </div>

        {/* Booking Summary */}
        {bookings.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">สรุปการจอง</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-blue-600">
                      {bookings.filter(b => b.status === 'confirmed').length}
                    </p>
                    <p className="text-sm text-gray-600">การจองที่ยืนยันแล้ว</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-yellow-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-yellow-600">
                      {bookings.filter(b => b.status === 'pending').length}
                    </p>
                    <p className="text-sm text-gray-600">รอการยืนยัน</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center">
                  <CreditCard className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {bookings.filter(b => b.paymentReceipt).length}
                    </p>
                    <p className="text-sm text-gray-600">ชำระเงินแล้ว</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              filter === 'all' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ทั้งหมด ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              filter === 'unread' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ยังไม่อ่าน ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('booking')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              filter === 'booking' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            การจอง ({notifications.filter(n => n.category === 'booking').length})
          </button>
          <button
            onClick={() => setFilter('payment')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              filter === 'payment' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            การชำระเงิน ({notifications.filter(n => n.category === 'payment').length})
          </button>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">กำลังโหลดการแจ้งเตือน...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              ไม่มีการแจ้งเตือน
            </h3>
            <p className="text-gray-500">การแจ้งเตือนใหม่จะแสดงที่นี่</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              ไม่มีการแจ้งเตือนในหมวดหมู่นี้
            </h3>
            <p className="text-gray-500">ลองเปลี่ยนตัวกรองหรือสร้างการจองใหม่</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`rounded-lg p-6 ${getNotificationColor(notification.type, notification.read)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-primary-600 rounded-full"></span>
                        )}
                      </div>
                      
                      <p className="text-gray-700 mb-2">
                        {notification.message}
                      </p>
                      
                      {/* Booking Details */}
                      {notification.booking && (
                        <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                          <h4 className="font-semibold text-gray-900 mb-3">รายละเอียดการจอง</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              <span>เช็คอิน: {new Date(notification.booking.checkInDate).toLocaleDateString('th-TH')}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              <span>เช็คเอาต์: {new Date(notification.booking.checkOutDate).toLocaleDateString('th-TH')}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4 text-gray-500" />
                              <span>ผู้เข้าพัก: {notification.booking.guests} คน</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4 text-gray-500" />
                              <span>ห้อง: {notification.booking.roomType?.name}</span>
                            </div>
                            {notification.booking.totalAmount && (
                              <div className="flex items-center space-x-2">
                                <CreditCard className="h-4 w-4 text-gray-500" />
                                <span>ยอดรวม: ฿{notification.booking.totalAmount.toLocaleString()}</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <span>สถานะ: {getStatusText(notification.booking.status)}</span>
                            </div>
                          </div>
                          
                          {/* Action Button */}
                          {notification.category === 'payment' && (
                            <div className="mt-4">
                              <a
                                href={`/payment/${notification.booking.id}`}
                                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                              >
                                <CreditCard className="h-4 w-4 mr-2" />
                                ชำระเงิน
                              </a>
                            </div>
                          )}
                          
                          {notification.category === 'booking' && (
                            <div className="mt-4">
                              <a
                                href={`/bookings`}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                <Calendar className="h-4 w-4 mr-2" />
                                ดูการจอง
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <p className="text-sm text-gray-500 mt-3">
                        {formatTimeAgo(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        ทำเครื่องหมาย
                      </button>
                    )}
                    
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
