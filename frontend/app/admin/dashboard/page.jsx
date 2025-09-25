'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { isStaffOrAdmin, canAccessAdminDashboard } from '../../../lib/permissions';
import { bookingAPI, roomAPI, roomsAPI } from '../../../lib/api';

export default function AdminDashboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [recentBookings, setRecentBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  
  // Calendar states
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateBookings, setDateBookings] = useState([]);
  const [dateBookingsLoading, setDateBookingsLoading] = useState(false);
  
  // Chart filter state
  const [chartPeriod, setChartPeriod] = useState('7days'); // 7days, 1month, 3months, 6months, 8months, year
  
  // Customer stats filter
  const [customerStatsPeriod, setCustomerStatsPeriod] = useState('all'); // all, week, month
  
  // Weekly bookings filter
  const [weeklyBookingsFilter, setWeeklyBookingsFilter] = useState('7days'); // 7days, 30days, 3months
  
  // Weekly revenue filter
  const [weeklyRevenueFilter, setWeeklyRevenueFilter] = useState('7days'); // 7days, 30days, 3months
  
  // Helper functions for localStorage (SSR safe)
  const safeLocalStorage = {
    getItem: (key) => {
      if (typeof window !== 'undefined') {
        return localStorage.getItem(key);
      }
      return null;
    },
    setItem: (key, value) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, value);
      }
    },
    removeItem: (key) => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
      }
    }
  };

  const safeSessionStorage = {
    getItem: (key) => {
      if (typeof window !== 'undefined') {
        return sessionStorage.getItem(key);
      }
      return null;
    }
  };

  // Helper function สำหรับดึง auth token
  const getAuthToken = () => {
    return safeLocalStorage.getItem('auth_token') || 
           safeLocalStorage.getItem('auth_token_persistent') ||
           safeSessionStorage.getItem('auth_token');
  };
  
  // Notifications state (แยกระหว่างใหม่และเก่า) - เหมือนในหน้าหลัก
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [lastBookingCount, setLastBookingCount] = useState(0);
  const [newNotificationsCount, setNewNotificationsCount] = useState(0); // เฉพาะการแจ้งเตือนใหม่
  const [lastSeenNotificationTime, setLastSeenNotificationTime] = useState(Date.now().toString());
  
  // ตัวแปรสำหรับควบคุมการเรียก API
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const FETCH_COOLDOWN = 5000; // 5 วินาที cooldown
  
  // Room statistics states
  const [roomStats, setRoomStats] = useState(null);
  const [roomStatsLoading, setRoomStatsLoading] = useState(true);
  const [selectedStatsDate, setSelectedStatsDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0);
  });
  
  // Room status calculation
  const [roomStatusStats, setRoomStatusStats] = useState({
    available: 0,
    occupied: 0,
    maintenance: 0,
    total: 0
  });
  const [roomStatusLoading, setRoomStatusLoading] = useState(true);

  // โหลด lastSeenNotificationTime จาก localStorage หลัง component mount
  useEffect(() => {
    const savedTime = safeLocalStorage.getItem('admin_last_seen_notification_time');
    if (savedTime) {
      setLastSeenNotificationTime(savedTime);
    }
  }, []);

  // ฟังก์ชันสำหรับตรวจสอบการแจ้งเตือนใหม่ (เฉพาะแอดมิน)
  const checkForNewNotifications = async () => {
    if (!user || isRefreshing || !canAccessAdminDashboard(user)) return;

    try {
      const token = getAuthToken();
      if (!token) return;

      // ดึงการแจ้งเตือนสำหรับแอดมินที่สร้างหลังจาก lastSeenNotificationTime
      const response = await fetch(`http://localhost:3001/api/notifications?limit=10&admin_only=true&created_after=${lastSeenNotificationTime}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const newNotifications = data.data || data.notifications || [];
        
        // กรองเฉพาะการแจ้งเตือนใหม่จริงๆ (หลังจาก lastSeenNotificationTime)
        const actualNewNotifications = newNotifications.filter(n => {
          const notificationTime = new Date(n.createdAt || n.created_at).getTime();
          return notificationTime > parseInt(lastSeenNotificationTime);
        });

        if (actualNewNotifications.length > 0) {
          // มีการแจ้งเตือนใหม่จริงๆ
          const newCount = actualNewNotifications.filter(n => !n.read && !n.isRead).length;
          
          if (newCount > 0) {
            setNewNotificationsCount(newCount);
            console.log(`🔔 Admin: ${newCount} new notifications`);
          }
          
          // อัปเดต timestamp ล่าสุด
          const latestNotificationTime = Math.max(
            ...actualNewNotifications.map(n => new Date(n.createdAt || n.created_at).getTime())
          );
          
          const newTimestamp = latestNotificationTime.toString();
          setLastSeenNotificationTime(newTimestamp);
          safeLocalStorage.setItem('admin_last_seen_notification_time', newTimestamp);
          
          console.log(`📨 Admin found ${actualNewNotifications.length} new notifications, ${newCount} unread`);
        }
      }
    } catch (error) {
      console.log('Admin: Could not check for new notifications:', error);
    }
  };

  const fetchUnreadCount = async () => {
    if (!user || isRefreshing || !canAccessAdminDashboard(user)) return;

    // ตรวจสอบ cooldown
    const now = Date.now();
    if (now - lastFetchTime < FETCH_COOLDOWN) {
      return;
    }

    setIsRefreshing(true);
    setLastFetchTime(now);

    try {
      const token = getAuthToken();
      if (!token) {
        setIsRefreshing(false);
        return;
      }

      const response = await fetch('http://localhost:3001/api/notifications/unread-count?admin_only=true', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const actualUnreadCount = data.unreadCount || 0;
        console.log(`📊 Admin unread count: ${actualUnreadCount} (displayed: ${newNotificationsCount})`);
      } else if (response.status === 401) {
        console.log('🔐 Admin token expired');
        setNewNotificationsCount(0);
        setNotifications([]);
      }
    } catch (error) {
      console.log('Admin: Could not fetch unread count:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchNotifications = async (unreadOnly = false) => {
    if (!user || !canAccessAdminDashboard(user)) return;

    try {
      const token = getAuthToken();
      if (!token) return;

      const url = `http://localhost:3001/api/notifications?admin_only=true${unreadOnly ? '&unread_only=true' : ''}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.notifications) {
          const notifications = data.notifications.map(n => ({
            id: n.id,
            type: n.type,
            title: n.title,
            message: n.message,
            read: n.isRead,
            createdAt: n.createdAt,
            updatedAt: n.updatedAt,
            booking: n.booking
          }));
          
          setNotifications(notifications);
          console.log(`📨 Admin loaded ${notifications.length} notifications`);
        }
      }
    } catch (error) {
      console.log('Admin: Could not fetch notifications:', error);
    }
  };

  const handleNotificationDropdownToggle = async () => {
    if (!showNotifications) {
      // เมื่อเปิด dropdown
      console.log('📂 Admin: Opening notification dropdown...');
      
      // โหลดการแจ้งเตือนทั้งหมด (รวมเก่า) เสมอ
      await fetchNotifications();
      setShowNotifications(true);
      
      // ล้างตัวเลขการแจ้งเตือนใหม่เมื่อเปิดดู
      if (newNotificationsCount > 0) {
        const now = Date.now().toString();
        setNewNotificationsCount(0);
        setLastSeenNotificationTime(now);
        safeLocalStorage.setItem('admin_last_seen_notification_time', now);
        console.log('👁️ Admin: Marked new notifications as seen');
      }
    } else {
      // เมื่อปิด dropdown
      setShowNotifications(false);
    }
  };

  const clearAllNotifications = async () => {
    try {
      console.log('🗑️ Admin: Clearing notification display...');
      
      // ล้างเฉพาะตัวเลขการแจ้งเตือนใหม่
      setNewNotificationsCount(0);
      setShowNotifications(false);
      
      // อัปเดต timestamp ให้เป็นปัจจุบัน
      const now = Date.now().toString();
      setLastSeenNotificationTime(now);
      safeLocalStorage.setItem('admin_last_seen_notification_time', now);
      
      console.log('✅ Admin: Notification counter cleared');
    } catch (error) {
      console.log('Admin: Could not clear notification display:', error);
    }
  };

  // ตรวจสอบการแจ้งเตือนใหม่เป็นระยะ (สำหรับแอดมิน)
  useEffect(() => {
    if (!user || !canAccessAdminDashboard(user)) return;

    // โหลดจำนวนการแจ้งเตือนที่ยังไม่ได้อ่านครั้งแรก
    fetchUnreadCount();

    // ใช้ interval ที่ยาวขึ้นเพื่อประหยัดทรัพยากร (30 วินาที)
    const intervalId = setInterval(() => {
      const now = Date.now();
      // ตรวจสอบ cooldown ก่อนเรียก API
      if (now - lastFetchTime > FETCH_COOLDOWN && !isRefreshing) {
        fetchUnreadCount();
      }
    }, 30000);

    // ตรวจสอบการแจ้งเตือนใหม่ทุก 45 วินาที (แยกจากการดึงจำนวน)
    const newNotificationCheckId = setInterval(() => {
      checkForNewNotifications();
    }, 45000);

    return () => {
      clearInterval(intervalId);
      clearInterval(newNotificationCheckId);
    };
  }, [user, lastFetchTime, isRefreshing, lastSeenNotificationTime]);

  // Redirect if not authorized
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !canAccessAdminDashboard(user))) {
      window.location.href = '/login';
    }
  }, [user, isAuthenticated, authLoading]);

  // Fetch recent bookings
  useEffect(() => {
    const fetchRecentBookings = async () => {
      try {
        setBookingsLoading(true);
        console.log('🔄 Fetching recent bookings...');
        
        // Fetch more bookings for calendar visualization
        const response = await bookingAPI.getAdminBookings({ 
          page: 1, 
          limit: 50, // Increase limit for calendar visualization
          sortBy: 'created_at',
          sortOrder: 'DESC'
        });
        
        console.log('📥 Bookings API response:', response);
        
        // Handle different response formats
        let bookings = [];
        if (response.success && response.bookings) {
          bookings = response.bookings;
        } else if (response.bookings) {
          bookings = response.bookings;
        } else if (response.data) {
          bookings = response.data;
        } else if (Array.isArray(response)) {
          bookings = response;
        }
        
        console.log('📋 Processed bookings:', bookings);
        setRecentBookings(bookings);
        
      } catch (error) {
        console.error('❌ Error fetching recent bookings:', error);
        setRecentBookings([]);
      } finally {
        setBookingsLoading(false);
      }
    };

    if (isAuthenticated && isStaffOrAdmin(user)) {
      fetchRecentBookings();
    }
  }, [isAuthenticated, user]);

  // Fetch room status data
  useEffect(() => {
    const fetchRoomStatus = async () => {
      setRoomStatusLoading(true);
      try {
        console.log('🏨 Fetching room status data...');
        const roomsResponse = await roomsAPI.getAllRooms();
        const rooms = roomsResponse.data || roomsResponse || [];
        console.log('🏨 Rooms data received:', rooms);
        
        // Get today's date for checking current occupancy
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        console.log('📅 Today date:', todayStr);
        
        // Calculate room status
        let available = 0;
        let occupied = 0;
        let maintenance = 0;
        
        // Check each room against current bookings
        rooms.forEach(room => {
          console.log(`🏠 Checking room ${room.id} (${room.name}):`, {
            roomStatus: room.status,
            bookings: recentBookings.filter(b => b.room_id === room.id)
          });
          
          // Check if room is currently occupied (has active booking for today)
          const currentBooking = recentBookings.find(booking => 
            booking.room_id === room.id && 
            booking.status === 'confirmed' &&
            new Date(booking.checkin_date) <= today &&
            new Date(booking.checkout_date) > today
          );
          
          if (currentBooking) {
            console.log(`🔴 Room ${room.id} is occupied by booking:`, currentBooking);
            occupied++;
          } else if (room.status === 'maintenance' || room.status === 'out_of_order') {
            console.log(`🛠️ Room ${room.id} is under maintenance`);
            maintenance++;
          } else {
            console.log(`🟢 Room ${room.id} is available`);
            available++;
          }
        });
        
        const roomStats = {
          available,
          occupied,
          maintenance,
          total: rooms.length
        };
        
        console.log('📊 Final room statistics:', roomStats);
        setRoomStatusStats(roomStats);
        
      } catch (error) {
        console.error('❌ Error fetching room status:', error);
        // Set default values on error
        setRoomStatusStats({
          available: 0,
          occupied: 0,
          maintenance: 0,
          total: 0
        });
      } finally {
        setRoomStatusLoading(false);
      }
    };

    if (isAuthenticated && isStaffOrAdmin(user)) {
      fetchRoomStatus();
    }
  }, [isAuthenticated, user, recentBookings]);

  // Check for new bookings and create notifications
  useEffect(() => {
    if (recentBookings.length > 0) {
      // Initialize last booking count on first load
      if (lastBookingCount === 0) {
        setLastBookingCount(recentBookings.length);
        return;
      }

      // Check if there are new bookings
      if (recentBookings.length > lastBookingCount) {
        const newBookingsCount = recentBookings.length - lastBookingCount;
        const latestBookings = recentBookings.slice(0, newBookingsCount);
        
        // Create notifications for new bookings
        const newNotifications = latestBookings.map((booking, index) => ({
          id: Date.now() + index,
          type: 'booking',
          title: 'การจองใหม่',
          message: `มีการจองใหม่จาก ${booking.customer_name || booking.guest_name || 'ลูกค้า'}`,
          time: new Date().toLocaleTimeString('th-TH'),
          read: false,
          booking: booking
        }));

        setNotifications(prev => [...newNotifications, ...prev].slice(0, 10)); // Keep only 10 latest
        setUnreadCount(prev => prev + newNotifications.length);
        setLastBookingCount(recentBookings.length);

        // Show browser notification if permission granted
        if (Notification.permission === 'granted') {
          new Notification('การจองใหม่', {
            body: `มีการจอง ${newBookingsCount} รายการใหม่`,
            icon: '/favicon.ico'
          });
        }
      }
    }
  }, [recentBookings, lastBookingCount]);

  // Request notification permission on component mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !event.target.closest('.notification-dropdown')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  // Calculate monthly statistics from bookings
  // Calculate statistics based on selected period
  const calculatePeriodStats = () => {
    const today = new Date();
    const stats = [];
    
    if (chartPeriod === '7days') {
      // Show last 7 days
      for (let i = 6; i >= 0; i--) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() - i);
        currentDate.setHours(0, 0, 0, 0);
        const nextDate = new Date(currentDate);
        nextDate.setDate(currentDate.getDate() + 1);
        
        const dayBookings = recentBookings.filter(booking => {
          const bookingDate = new Date(booking.created_at || booking.checkin_date);
          return bookingDate >= currentDate && bookingDate < nextDate;
        });
        
        const confirmedBookings = dayBookings.filter(b => b.status === 'confirmed');
        const revenue = confirmedBookings.reduce((sum, booking) => {
          return sum + (parseFloat(booking.total_price) || 0);
        }, 0);
        
        stats.push({
          month: currentDate.toLocaleDateString('th-TH', { day: '2-digit', month: 'short' }),
          bookings: dayBookings.length,
          revenue: revenue
        });
      }
    } else {
      // Monthly periods
      const periodsMap = {
        '1month': 1,
        '3months': 3,
        '6months': 6,
        '8months': 8,
        'year': 12
      };
      
      const periods = periodsMap[chartPeriod] || 1;
      
      for (let i = periods - 1; i >= 0; i--) {
        const currentDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        
        const monthBookings = recentBookings.filter(booking => {
          const bookingDate = new Date(booking.created_at || booking.checkin_date);
          return bookingDate >= startOfMonth && bookingDate <= endOfMonth;
        });
        
        const confirmedBookings = monthBookings.filter(b => b.status === 'confirmed');
        const revenue = confirmedBookings.reduce((sum, booking) => {
          return sum + (parseFloat(booking.total_price) || 0);
        }, 0);
        
        stats.push({
          month: currentDate.toLocaleDateString('th-TH', { year: 'numeric', month: 'short' }),
          bookings: monthBookings.length,
          revenue: revenue
        });
      }
    }
    
    return stats;
  };

  const periodStats = calculatePeriodStats();
  const maxBookings = Math.max(...periodStats.map(m => m.bookings)) || 1;
  const maxRevenue = Math.max(...periodStats.map(m => m.revenue)) || 1;

  // Calculate customer statistics based on filter
  const calculateCustomerStats = () => {
    const today = new Date();
    let filteredBookings = recentBookings;
    
    if (customerStatsPeriod === 'week') {
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredBookings = recentBookings.filter(booking => 
        new Date(booking.created_at || booking.checkin_date) >= weekAgo
      );
    } else if (customerStatsPeriod === 'month') {
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      filteredBookings = recentBookings.filter(booking => 
        new Date(booking.created_at || booking.checkin_date) >= monthAgo
      );
    }
    
    // Count unique customers
    const uniqueCustomers = new Set();
    filteredBookings.forEach(booking => {
      const customerKey = booking.customer_email || booking.guest_email || booking.customer_name || booking.guest_name || booking.id;
      if (customerKey) uniqueCustomers.add(customerKey);
    });
    
    // Weekly bookings and revenue
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weeklyBookings = recentBookings.filter(booking => 
      new Date(booking.created_at || booking.checkin_date) >= weekAgo
    );
    const weeklyRevenue = weeklyBookings
      .filter(b => b.status === 'confirmed')
      .reduce((sum, booking) => sum + (parseFloat(booking.total_price) || 0), 0);
    
    return {
      totalCustomers: uniqueCustomers.size,
      weeklyBookings: weeklyBookings.length,
      weeklyRevenue: weeklyRevenue
    };
  };

  const customerStats = calculateCustomerStats();

  // Notification functions
  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    setUnreadCount(0);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  // Loading state
  if (authLoading || !isAuthenticated || !canAccessAdminDashboard(user)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Main Container with Border */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg overflow-hidden">
          <div className="p-8 space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">แดชบอร์ดแอดมิน</h1>
                  <p className="text-gray-600 mt-1">ภาพรวมระบบจัดการโรงแรม</p>
                </div>
                <div className="flex items-center space-x-4">
                  {/* Notification Bell */}
                  <div className="relative">
                    <button
                      onClick={handleNotificationDropdownToggle}
                      className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors duration-200"
                      title="การแจ้งเตือน"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3.001 3.001 0 11-6 0m6 0H9"
                        />
                      </svg>
                      {newNotificationsCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {newNotificationsCount > 9 ? '9+' : newNotificationsCount}
                        </span>
                      )}
                    </button>

                    {/* Notification Dropdown */}
                    {showNotifications && (
                      <div className="notification-dropdown absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                        <div className="p-4 border-b border-gray-100">
                          <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-800">การแจ้งเตือน</h3>
                            {notifications.length > 0 && (
                              <button
                                onClick={clearAllNotifications}
                                className="text-sm text-blue-600 hover:text-blue-800"
                              >
                                ล้างตัวเลข
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                              ไม่มีการแจ้งเตือน
                            </div>
                          ) : (
                            notifications.map((notification) => (
                              <div
                                key={notification.id}
                                className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                                  notification.read ? 'opacity-75' : 'bg-blue-50'
                                }`}
                                onClick={() => markAsRead(notification.id)}
                              >
                                <div className="flex items-start space-x-3">
                                  <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                      <svg
                                        className="w-4 h-4 text-green-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        />
                                      </svg>
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800">
                                      {notification.title}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {notification.message}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                      {notification.time}
                                    </p>
                                  </div>
                                  {!notification.read && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    อัปเดตล่าสุด: {new Date().toLocaleTimeString('th-TH')}
                  </div>
                </div>
              </div>
            </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Weekly Bookings */}
          <div className="bg-gradient-to-br from-pink-400 via-red-400 to-yellow-400 rounded-xl p-6 text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white/90 font-medium">การจอง</h3>
                <div className="flex items-center space-x-2">
                  <select
                    value={weeklyBookingsFilter}
                    onChange={(e) => setWeeklyBookingsFilter(e.target.value)}
                    className="text-xs bg-white/20 border border-white/30 rounded px-2 py-1 text-white backdrop-blur-sm focus:outline-none focus:ring-1 focus:ring-white/50"
                  >
                    <option value="all" className="text-gray-900">ทั้งหมด</option>
                    <option value="7days" className="text-gray-900">7 วัน</option>
                    <option value="30days" className="text-gray-900">30 วัน</option>
                    <option value="3months" className="text-gray-900">3 เดือน</option>
                  </select>
                  <svg className="w-6 h-6 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div className="mb-2">
                <span className="text-3xl font-bold">
                  {(() => {
                    if (weeklyBookingsFilter === 'all') {
                      return recentBookings.length;
                    }
                    const today = new Date();
                    let daysBack;
                    switch(weeklyBookingsFilter) {
                      case '30days': daysBack = 30; break;
                      case '3months': daysBack = 90; break;
                      default: daysBack = 7;
                    }
                    const filterDate = new Date(today.getTime() - daysBack * 24 * 60 * 60 * 1000);
                    return recentBookings.filter(b => {
                      const bookingDate = new Date(b.created_at);
                      return bookingDate >= filterDate;
                    }).length;
                  })()}
                </span>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full"></div>
            <div className="absolute -top-4 -left-4 w-16 h-16 bg-white/5 rounded-full"></div>
          </div>

          {/* Weekly Revenue */}
          <div className="bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 rounded-xl p-6 text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white/90 font-medium">รายได้</h3>
                <div className="flex items-center space-x-2">
                  <select
                    value={weeklyRevenueFilter}
                    onChange={(e) => setWeeklyRevenueFilter(e.target.value)}
                    className="text-xs bg-white/20 border border-white/30 rounded px-2 py-1 text-white backdrop-blur-sm focus:outline-none focus:ring-1 focus:ring-white/50"
                  >
                    <option value="all" className="text-gray-900">ทั้งหมด</option>
                    <option value="7days" className="text-gray-900">7 วัน</option>
                    <option value="30days" className="text-gray-900">30 วัน</option>
                    <option value="3months" className="text-gray-900">3 เดือน</option>
                  </select>
                  <svg className="w-6 h-6 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="mb-2">
                <span className="text-2xl font-bold">
                  ฿{(() => {
                    if (weeklyRevenueFilter === 'all') {
                      return recentBookings.filter(b => b.status === 'confirmed')
                        .reduce((sum, b) => sum + (parseFloat(b.total_price) || 0), 0).toLocaleString();
                    }
                    const today = new Date();
                    let daysBack;
                    switch(weeklyRevenueFilter) {
                      case '30days': daysBack = 30; break;
                      case '3months': daysBack = 90; break;
                      default: daysBack = 7;
                    }
                    const filterDate = new Date(today.getTime() - daysBack * 24 * 60 * 60 * 1000);
                    return recentBookings.filter(b => {
                      const bookingDate = new Date(b.created_at);
                      return bookingDate >= filterDate && b.status === 'confirmed';
                    }).reduce((sum, b) => sum + (parseFloat(b.total_price) || 0), 0).toLocaleString();
                  })()}
                </span>
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 w-28 h-28 bg-white/10 rounded-full"></div>
            <div className="absolute -top-2 -left-2 w-12 h-12 bg-white/5 rounded-full"></div>
          </div>

          {/* Customer Statistics */}
          <div className="bg-gradient-to-br from-green-400 via-teal-400 to-blue-500 rounded-xl p-6 text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white/90 font-medium">ลูกค้าในระบบ</h3>
                <div className="flex items-center space-x-2">
                  <select
                    value={customerStatsPeriod}
                    onChange={(e) => setCustomerStatsPeriod(e.target.value)}
                    className="text-xs bg-white/20 border border-white/30 rounded px-2 py-1 text-white backdrop-blur-sm focus:outline-none focus:ring-1 focus:ring-white/50"
                  >
                    <option value="all" className="text-gray-900">ทั้งหมด</option>
                    <option value="week" className="text-gray-900">7 วัน</option>
                    <option value="month" className="text-gray-900">30 วัน</option>
                  </select>
                  <svg className="w-6 h-6 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
              <div className="mb-2">
                <span className="text-3xl font-bold">
                  {customerStats.totalCustomers}
                </span>
              </div>
              <div className="text-white/80 text-sm">
                การจอง: {customerStats.weeklyBookings} | รายได้: ฿{customerStats.weeklyRevenue.toLocaleString()}
              </div>
            </div>
            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full"></div>
            <div className="absolute top-0 left-0 w-20 h-20 bg-white/5 rounded-full"></div>
          </div>
        </div>

        {/* Visit and Sales Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bar Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {chartPeriod === '7days' ? 'สถิติการเข้าพักและรายได้' :
                 'สถิติการเข้าพักและรายได้ (รายเดือน)'}
              </h3>
              <div className="flex items-center space-x-4">
                {/* Period selector dropdown */}
                <select 
                  value={chartPeriod} 
                  onChange={(e) => setChartPeriod(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="7days">7 วันล่าสุด</option>
                  <option value="1month">1 เดือนล่าสุด</option>
                  <option value="3months">3 เดือนล่าสุด</option>
                  <option value="6months">6 เดือนล่าสุด</option>
                  <option value="8months">8 เดือนล่าสุด</option>
                  <option value="year">ปีล่าสุด</option>
                </select>
                
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                  <span className="text-sm text-gray-600">การเข้าพัก</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                  <span className="text-sm text-gray-600">รายได้</span>
                </div>
              </div>
            </div>
            
            <div className="h-64">
              <div className="flex items-end justify-between h-full space-x-2 pb-4">
                {periodStats.map((monthData, index) => {
                  // Scale heights for visualization (max height is 48 = 192px)
                  const bookingHeight = maxBookings > 0 ? Math.max((monthData.bookings / maxBookings) * 48, 8) : 8;
                  const revenueHeight = maxRevenue > 0 ? Math.max((monthData.revenue / maxRevenue) * 48, 8) : 8;
                  
                  return (
                    <div key={monthData.month + index} className="flex flex-col items-center space-y-2 flex-1">
                      <div className="flex items-end space-x-1 h-48">
                        {/* Booking bar */}
                        <div 
                          className="w-6 bg-gradient-to-t from-purple-400 to-purple-300 rounded-t-sm relative group"
                          style={{ height: `${bookingHeight}px` }}
                        >
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            {monthData.bookings} การจอง
                          </div>
                        </div>
                        {/* Revenue bar */}
                        <div 
                          className="w-6 bg-gradient-to-t from-blue-400 to-blue-300 rounded-t-sm relative group"
                          style={{ height: `${revenueHeight}px` }}
                        >
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            ฿{monthData.revenue.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-gray-600 font-medium">{monthData.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Room Status Chart */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">สถานะห้องพัก</h3>
              {roomStatusLoading && (
                <div className="text-sm text-gray-500">กำลังโหลด...</div>
              )}
            </div>
            
            {roomStatusLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center mb-6">
                  <div className="relative w-32 h-32">
                    <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                      {(() => {
                        const { available, occupied, maintenance, total } = roomStatusStats;
                        if (total === 0) return null;
                        
                        const availablePercent = available / total;
                        const occupiedPercent = occupied / total;
                        const maintenancePercent = maintenance / total;
                        
                        const circumference = 2 * Math.PI * 40;
                        let offset = 0;
                        
                        return (
                          <>
                            {/* Available - Green */}
                            <circle
                              cx="60"
                              cy="60"
                              r="40"
                              stroke="#10B981"
                              strokeWidth="20"
                              fill="transparent"
                              strokeDasharray={`${circumference * availablePercent} ${circumference}`}
                              strokeDashoffset={offset}
                              className="opacity-80"
                            />
                            {/* Occupied - Blue */}
                            <circle
                              cx="60"
                              cy="60"
                              r="40"
                              stroke="#3B82F6"
                              strokeWidth="20"
                              fill="transparent"
                              strokeDasharray={`${circumference * occupiedPercent} ${circumference}`}
                              strokeDashoffset={offset - circumference * availablePercent}
                              className="opacity-80"
                            />
                            {/* Maintenance - Red */}
                            <circle
                              cx="60"
                              cy="60"
                              r="40"
                              stroke="#EF4444"
                              strokeWidth="20"
                              fill="transparent"
                              strokeDasharray={`${circumference * maintenancePercent} ${circumference}`}
                              strokeDashoffset={offset - circumference * (availablePercent + occupiedPercent)}
                              className="opacity-80"
                            />
                          </>
                        );
                      })()}
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{roomStatusStats.total}</div>
                        <div className="text-xs text-gray-500">ห้องทั้งหมด</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">ห้องว่าง</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">{roomStatusStats.available}</span>
                      <span className="text-xs text-gray-500">
                        ({roomStatusStats.total > 0 ? Math.round((roomStatusStats.available / roomStatusStats.total) * 100) : 0}%)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">กำลังเข้าพัก</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">{roomStatusStats.occupied}</span>
                      <span className="text-xs text-gray-500">
                        ({roomStatusStats.total > 0 ? Math.round((roomStatusStats.occupied / roomStatusStats.total) * 100) : 0}%)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">ไม่พร้อมใช้งาน</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">{roomStatusStats.maintenance}</span>
                      <span className="text-xs text-gray-500">
                        ({roomStatusStats.total > 0 ? Math.round((roomStatusStats.maintenance / roomStatusStats.total) * 100) : 0}%)
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Enhanced Calendar Section - Full Width */}
        <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <button 
              onClick={() => {
                const prevMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1);
                setSelectedDate(prevMonth);
              }}
              className="text-gray-600 hover:text-gray-900 transition-colors p-3 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold text-gray-900">
              ปฏิทินการเข้าพัก - {selectedDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
            </h2>
            <button 
              onClick={() => {
                const nextMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1);
                setSelectedDate(nextMonth);
              }}
              className="text-gray-600 hover:text-gray-900 transition-colors p-3 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          {/* Calendar Grid with Booking Visualization - Large Size */}
          <div className="grid grid-cols-7 gap-3 text-center mb-6">
            {['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'].map(day => (
              <div key={day} className="text-gray-700 font-semibold p-4 bg-gray-50 rounded-lg">{day}</div>
            ))}
          </div>
          
          {/* Calendar Days with Booking Overlays - Larger Size */}
          <div className="grid grid-cols-7 gap-3">
            {(() => {
              const year = selectedDate.getFullYear();
              const month = selectedDate.getMonth();
              const firstDay = new Date(year, month, 1);
              const lastDay = new Date(year, month + 1, 0);
              const startDate = new Date(firstDay);
              startDate.setDate(startDate.getDate() - firstDay.getDay());
              
              const days = [];
              for (let i = 0; i < 42; i++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + i);
                days.push(currentDate);
              }
              
              return days.map((day, i) => {
                const isCurrentMonth = day.getMonth() === month;
                const today = new Date();
                const isToday = day.toDateString() === today.toDateString();
                const isSelected = day.toDateString() === selectedDate.toDateString();
                
                // Find bookings for this day
                const dayBookings = recentBookings.filter(booking => {
                  // Handle different date field names
                  const checkinDate = new Date(
                    booking.checkin_date || 
                    booking.check_in_date || 
                    booking.check_in || 
                    booking.start_date
                  );
                  const checkoutDate = new Date(
                    booking.checkout_date || 
                    booking.check_out_date || 
                    booking.check_out || 
                    booking.end_date
                  );
                  const currentDay = new Date(day);
                  
                  // Handle invalid dates
                  if (isNaN(checkinDate.getTime()) || isNaN(checkoutDate.getTime())) {
                    return false;
                  }
                  
                  // Remove time part for accurate comparison
                  checkinDate.setHours(0, 0, 0, 0);
                  checkoutDate.setHours(0, 0, 0, 0);
                  currentDay.setHours(0, 0, 0, 0);
                  
                  return currentDay >= checkinDate && currentDay < checkoutDate;
                });
                
                // Check if this day is a check-in or check-out day
                const isCheckinDay = recentBookings.some(booking => {
                  const checkinDate = new Date(
                    booking.checkin_date || 
                    booking.check_in_date || 
                    booking.check_in || 
                    booking.start_date
                  );
                  if (isNaN(checkinDate.getTime())) return false;
                  
                  checkinDate.setHours(0, 0, 0, 0);
                  const currentDay = new Date(day);
                  currentDay.setHours(0, 0, 0, 0);
                  return checkinDate.getTime() === currentDay.getTime();
                });
                
                const isCheckoutDay = recentBookings.some(booking => {
                  const checkoutDate = new Date(
                    booking.checkout_date || 
                    booking.check_out_date || 
                    booking.check_out || 
                    booking.end_date
                  );
                  if (isNaN(checkoutDate.getTime())) return false;
                  
                  checkoutDate.setHours(0, 0, 0, 0);
                  const currentDay = new Date(day);
                  currentDay.setHours(0, 0, 0, 0);
                  return checkoutDate.getTime() === currentDay.getTime();
                });
                
                const handleDateClick = () => {
                  if (isCurrentMonth) {
                    setSelectedDate(new Date(day));
                  }
                };
                
                return (
                  <div
                    key={i}
                    onClick={handleDateClick}
                    className={`relative p-4 h-28 rounded-lg transition-all duration-200 cursor-pointer border-2 ${
                      isSelected
                        ? 'bg-blue-600 text-white font-bold border-blue-700 shadow-lg transform scale-105'
                        : isToday
                        ? 'bg-blue-100 text-blue-700 font-bold border-blue-300 shadow-md'
                        : isCurrentMonth
                        ? 'text-gray-700 hover:bg-gray-50 border-gray-200 hover:shadow-md hover:border-gray-300'
                        : 'text-gray-400 cursor-not-allowed border-gray-100 bg-gray-50'
                    }`}
                  >
                    {/* Day Number */}
                    <div className="text-lg font-semibold mb-2">
                      {day.getDate()}
                    </div>
                    
                    {/* Booking Indicators */}
                    <div className="absolute inset-x-2 bottom-2 space-y-1">
                      {/* Check-in indicator */}
                      {isCheckinDay && (
                        <div className="h-2 bg-green-500 rounded-full" title="เช็คอิน"></div>
                      )}
                      
                      {/* Stay period indicator */}
                      {dayBookings.length > 0 && (
                        <div className="h-2 bg-blue-400 rounded-full" title={`มีผู้พัก ${dayBookings.length} ห้อง`}></div>
                      )}
                      
                      {/* Check-out indicator */}
                      {isCheckoutDay && (
                        <div className="h-2 bg-red-500 rounded-full" title="เช็คเอาท์"></div>
                      )}
                      
                      {/* Guest names for hovering */}
                      {dayBookings.length > 0 && (
                        <div className="opacity-0 hover:opacity-100 absolute z-10 bg-black text-white text-xs p-2 rounded -top-12 left-0 whitespace-nowrap transition-opacity shadow-lg">
                          {dayBookings.slice(0, 3).map(booking => 
                            booking.customer_name || booking.guest_name || 'ไม่ระบุชื่อ'
                          ).join(', ')}
                          {dayBookings.length > 3 && ` +${dayBookings.length - 3} คน`}
                        </div>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">เช็คอิน</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-gray-600">ระหว่างพัก</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-2 bg-red-500 rounded-full"></div>
              <span className="text-gray-600">เช็คเอาท์</span>
            </div>
          </div>

          {/* Selected Date Bookings */}
          <div className="mt-8 border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">
                การจองวันที่ {selectedDate.toLocaleDateString('th-TH')}
              </h4>
              {dateBookingsLoading && (
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-60 overflow-y-auto">
              {(() => {
                // Filter bookings for selected date
                const selectedDayBookings = recentBookings.filter(booking => {
                  const checkinDate = new Date(
                    booking.checkin_date || 
                    booking.check_in_date || 
                    booking.check_in || 
                    booking.start_date
                  );
                  const checkoutDate = new Date(
                    booking.checkout_date || 
                    booking.check_out_date || 
                    booking.check_out || 
                    booking.end_date
                  );
                  const selectedDay = new Date(selectedDate);
                  
                  // Handle invalid dates
                  if (isNaN(checkinDate.getTime()) || isNaN(checkoutDate.getTime())) {
                    return false;
                  }
                  
                  checkinDate.setHours(0, 0, 0, 0);
                  checkoutDate.setHours(0, 0, 0, 0);
                  selectedDay.setHours(0, 0, 0, 0);
                  
                  return selectedDay >= checkinDate && selectedDay < checkoutDate;
                });
                
                return selectedDayBookings.length > 0 ? (
                  selectedDayBookings.map((booking) => {
                    const checkinDate = new Date(
                      booking.checkin_date || 
                      booking.check_in_date || 
                      booking.check_in || 
                      booking.start_date
                    );
                    const checkoutDate = new Date(
                      booking.checkout_date || 
                      booking.check_out_date || 
                      booking.check_out || 
                      booking.end_date
                    );
                    const selectedDay = new Date(selectedDate);
                    
                    // Handle invalid dates
                    if (isNaN(checkinDate.getTime()) || isNaN(checkoutDate.getTime())) {
                      return null;
                    }
                    
                    checkinDate.setHours(0, 0, 0, 0);
                    checkoutDate.setHours(0, 0, 0, 0);
                    selectedDay.setHours(0, 0, 0, 0);
                    
                    const isCheckinDay = selectedDay.getTime() === checkinDate.getTime();
                    const isCheckoutDay = selectedDay.getTime() === checkoutDate.getTime();
                    
                    return (
                      <div key={booking.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <h5 className="font-medium text-gray-900">
                            {booking.customer_name || booking.guest_name || booking.name || 'ไม่ระบุชื่อ'}
                          </h5>
                          {isCheckinDay && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">เช็คอิน</span>
                          )}
                          {isCheckoutDay && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">เช็คเอาท์</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          ห้อง {booking.room_number || booking.room_name || 'TBD'} • {booking.guests || booking.guest_count || 1} คน
                        </p>
                        <p className="text-xs text-gray-500 mb-2">
                          {checkinDate.toLocaleDateString('th-TH')} - {checkoutDate.toLocaleDateString('th-TH')}
                          <span className="ml-2">({Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24))} คืน)</span>
                        </p>
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            booking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                            booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {booking.status === 'confirmed' ? 'ยืนยัน' :
                             booking.status === 'pending' ? 'รอดำเนินการ' :
                             booking.status === 'completed' ? 'เสร็จสิ้น' :
                             booking.status === 'cancelled' ? 'ยกเลิก' :
                             booking.status}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            ฿{parseFloat(booking.total_price || booking.price || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  }).filter(Boolean)
                ) : (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    ไม่มีการจองในวันนี้
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Recent Bookings Section - Full Width */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">การจองล่าสุด</h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors">ดูทั้งหมด</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {bookingsLoading ? (
              // Loading state
              Array.from({ length: 8 }, (_, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 animate-pulse">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
              ))
            ) : recentBookings.length > 0 ? (
              recentBookings.slice(0, 8).map((booking) => (
                <div key={booking.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-semibold">
                        {(booking.customer_name || booking.guest_name || 'G').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">
                        {booking.customer_name || booking.guest_name || 'ไม่ระบุชื่อ'}
                      </h4>
                      <p className="text-sm text-gray-600 truncate">
                        ห้อง {booking.room_number || 'TBD'} • {booking.guests || 1} คน
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    {new Date(booking.checkin_date || booking.created_at).toLocaleDateString('th-TH', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      booking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                      booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {booking.status === 'confirmed' ? 'ยืนยัน' :
                       booking.status === 'pending' ? 'รอดำเนินการ' :
                       booking.status === 'completed' ? 'เสร็จสิ้น' :
                       booking.status === 'cancelled' ? 'ยกเลิก' :
                       booking.status}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      ฿{parseFloat(booking.total_price || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-gray-500">
                ไม่มีการจองล่าสุด
              </div>
            )}
          </div>
        </div>

        {/* Customer Reviews Section */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">รีวิวลูกค้าล่าสุด</h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors">ดูทั้งหมด</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Sample Reviews */}
            {[
              {
                id: 1,
                name: 'อัญชลี วงศ์ประเสริฐ',
                initials: 'อว',
                rating: 5,
                date: '2 วันที่แล้ว',
                review: 'บริการดีมาก ห้องพักสะอาด พนักงานดูแลดี อาหารอร่อย จะกลับมาพักอีกแน่นอน แนะนำให้เพื่อนๆ'
              },
              {
                id: 2,
                name: 'วิชาย ชัยสุข',
                initials: 'วช',
                rating: 4,
                date: '5 วันที่แล้ว',
                review: 'โรงแรมสวยมาก ทำเลดี ใกล้แหล่งท่องเที่ยว ห้องพักกว้างขวาง แต่อาหารเช้าอาจจะปรับปรุงได้อีก'
              },
              {
                id: 3,
                name: 'สุภาพร เกตุแก้ว',
                initials: 'สก',
                rating: 5,
                date: '1 สัปดาห์ที่แล้ว',
                review: 'ประทับใจมากค่ะ พนักงานใส่ใจดูแลดี สระว่ายน้ำสวย วิวดี คุ้มค่ากับราคาเลยค่ะ'
              }
            ].map((review) => (
              <div key={review.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">
                      {review.initials}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{review.name}</h4>
                    <div className="flex items-center gap-1 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 text-sm mb-3 leading-relaxed">
                  {review.review}
                </p>
                <p className="text-gray-500 text-xs">
                  {review.date}
                </p>
              </div>
            ))}
          </div>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
}