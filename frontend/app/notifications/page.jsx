'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslation } from '../../translations';
import { useNotifications } from '../../contexts/NotificationContext';
import { Bell, BellRing, Check, CheckCheck, Trash2, X, Filter, RefreshCw, Archive, Calendar, Hotel, CreditCard, User, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function NotificationsPage() {
  const { isAuthenticated, user } = useAuth();
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getNotificationIcon,
    getNotificationColor,
    formatTimeAgo,
    hasUnread,
    isEmpty
  } = useNotifications();

  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications();
    }
  }, [isAuthenticated, user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchNotifications();
      toast.success('รีเฟรชแจ้งเตือนสำเร็จ');
    } catch (error) {
      toast.error('ไม่สามารถรีเฟรชได้');
    } finally {
      setRefreshing(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(notificationId);
      toast.success('อ่านแจ้งเตือนแล้ว');
    } catch (error) {
      toast.error('ไม่สามารถอัปเดตสถานะได้');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      toast.success('อ่านแจ้งเตือนทั้งหมดแล้ว');
    } catch (error) {
      toast.error('ไม่สามารถอัปเดตสถานะได้');
    }
  };

  const handleDelete = async (notificationId) => {
    if (!confirm('คุณต้องการลบการแจ้งเตือนนี้หรือไม่?')) return;
    
    try {
      await deleteNotification(notificationId);
      toast.success('ลบแจ้งเตือนแล้ว');
    } catch (error) {
      toast.error('ไม่สามารถลบแจ้งเตือนได้');
    }
  };

  const handleSelectNotification = (notificationId) => {
    setSelectedNotifications(prev => {
      const newSelected = prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId];
      
      setShowBulkActions(newSelected.length > 0);
      return newSelected;
    });
  };

  const handleSelectAll = () => {
    const allIds = filteredNotifications.map(n => n.id);
    if (selectedNotifications.length === allIds.length) {
      setSelectedNotifications([]);
      setShowBulkActions(false);
    } else {
      setSelectedNotifications(allIds);
      setShowBulkActions(true);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`คุณต้องการลบการแจ้งเตือน ${selectedNotifications.length} รายการหรือไม่?`)) return;
    
    try {
      await Promise.all(selectedNotifications.map(id => deleteNotification(id)));
      setSelectedNotifications([]);
      setShowBulkActions(false);
      toast.success('ลบแจ้งเตือนที่เลือกแล้ว');
    } catch (error) {
      toast.error('ไม่สามารถลบแจ้งเตือนได้');
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.isRead;
    return notification.type === filter;
  });

  const filterOptions = [
    { value: 'all', label: 'ทั้งหมด', count: notifications.length },
    { value: 'unread', label: 'ยังไม่อ่าน', count: unreadCount },
    { value: 'booking_confirmed', label: 'การจองยืนยัน', count: notifications.filter(n => n.type === 'booking_confirmed').length },
    { value: 'booking_cancelled', label: 'การจองยกเลิก', count: notifications.filter(n => n.type === 'booking_cancelled').length },
    { value: 'booking_approved', label: 'การจองอนุมัติ', count: notifications.filter(n => n.type === 'booking_approved').length },
    { value: 'payment_reminder', label: 'แจ้งเตือนชำระเงิน', count: notifications.filter(n => n.type === 'payment_reminder').length },
    { value: 'check_in_reminder', label: 'แจ้งเตือนเข้าพัก', count: notifications.filter(n => n.type === 'check_in_reminder').length }
  ];

  const getNotificationTypeIcon = (type) => {
    switch (type) {
      case 'booking_confirmed':
        return <Check className="h-5 w-5" />;
      case 'booking_cancelled':
        return <X className="h-5 w-5" />;
      case 'booking_approved':
        return <CheckCheck className="h-5 w-5" />;
      case 'payment_reminder':
        return <CreditCard className="h-5 w-5" />;
      case 'check_in_reminder':
        return <Hotel className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">กรุณาเข้าสู่ระบบ</h2>
          <p className="text-gray-600">เพื่อดูการแจ้งเตือนของคุณ</p>
          <Link
            href="/login"
            className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            เข้าสู่ระบบ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <BellRing className="h-8 w-8 mr-3 text-blue-600" />
                การแจ้งเตือน
              </h1>
              <p className="text-gray-600 mt-2">
                จัดการและดูการแจ้งเตือนทั้งหมดของคุณ
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              {hasUnread && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                >
                  <CheckCheck className="h-4 w-4 mr-2" />
                  อ่านทั้งหมด
                </button>
              )}
              
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                รีเฟรช
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Bell className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">แจ้งเตือนทั้งหมด</p>
                  <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">ยังไม่ได้อ่าน</p>
                  <p className="text-2xl font-bold text-gray-900">{unreadCount}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Check className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">อ่านแล้ว</p>
                  <p className="text-2xl font-bold text-gray-900">{notifications.length - unreadCount}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              กรองการแจ้งเตือน
            </h2>
            
            {showBulkActions && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  เลือกแล้ว {selectedNotifications.length} รายการ
                </span>
                <button
                  onClick={handleBulkDelete}
                  className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                >
                  ลบที่เลือก
                </button>
                <button
                  onClick={() => {
                    setSelectedNotifications([]);
                    setShowBulkActions(false);
                  }}
                  className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 transition-colors"
                >
                  ยกเลิก
                </button>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {filterOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                  filter === option.value
                    ? 'bg-blue-100 text-blue-800 border-2 border-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                }`}
              >
                <div>{option.label}</div>
                <div className="text-xs mt-1">({option.count})</div>
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center">
              <RefreshCw className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">กำลังโหลดการแจ้งเตือน...</p>
            </div>
          ) : isEmpty ? (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่มีการแจ้งเตือน</h3>
              <p className="text-gray-500">คุณจะได้รับการแจ้งเตือนเมื่อมีกิจกรรมใหม่</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {/* Select All Header */}
              {filteredNotifications.length > 0 && (
                <div className="p-4 bg-gray-50 border-b">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedNotifications.length === filteredNotifications.length}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                      />
                      <span className="text-sm text-gray-600">เลือกทั้งหมด</span>
                    </label>
                    <span className="text-sm text-gray-500">
                      แสดง {filteredNotifications.length} รายการ
                    </span>
                  </div>
                </div>
              )}

              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-6 hover:bg-gray-50 transition-colors ${
                    !notification.isRead ? 'bg-blue-50 border-l-4 border-blue-400' : ''
                  } ${
                    selectedNotifications.includes(notification.id) ? 'bg-blue-100' : ''
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedNotifications.includes(notification.id)}
                      onChange={() => handleSelectNotification(notification.id)}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${getNotificationColor(notification.type)}`}>
                      {getNotificationTypeIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                          {!notification.isRead && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              ใหม่
                            </span>
                          )}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(notification.createdAt, language)}
                        </span>
                      </div>
                      
                      <p className="mt-1 text-sm text-gray-600">
                        {notification.message}
                      </p>
                      
                      {notification.booking && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center text-xs text-gray-500 space-x-4">
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {notification.booking.reference}
                            </span>
                            <span className="flex items-center">
                              <Hotel className="h-3 w-3 mr-1" />
                              {notification.booking.hotelName}
                            </span>
                            {notification.booking.checkInDate && (
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {new Date(notification.booking.checkInDate).toLocaleDateString('th-TH')}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-3 flex items-center space-x-2">
                        {!notification.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                          >
                            ทำเครื่องหมายว่าอ่านแล้ว
                          </button>
                        )}
                        
                        {notification.booking && (
                          <Link
                            href={`/bookings/${notification.booking.id}`}
                            className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors"
                          >
                            ดูรายละเอียดการจอง
                          </Link>
                        )}
                        
                        <button
                          onClick={() => handleDelete(notification.id)}
                          className="text-xs text-red-600 hover:text-red-800 flex items-center"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          ลบ
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Load More Button */}
        {filteredNotifications.length > 0 && !loading && (
          <div className="mt-6 text-center">
            <button
              onClick={() => fetchNotifications({ page: Math.floor(filteredNotifications.length / 20) + 1 })}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              โหลดเพิ่มเติม
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
