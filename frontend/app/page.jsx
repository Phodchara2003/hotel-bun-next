'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Users, Wifi, Car, Coffee, Tv, Wind, Phone, Mail, Globe, Facebook, MessageCircle, Bed, Bell } from 'lucide-react';
import { hotelAPI } from '../lib/api';
import { getRoomImageUrl, getFallbackRoomImages, getPlaceholderImageUrl, getRoomImageUrlWithCache } from '../lib/imageUtils';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import ClientOnly from '../components/ClientOnly';

export default function HomePage() {
  return (
    <ClientOnly fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    }>
      <HomePageContent />
    </ClientOnly>
  );
}

function HomePageContent() {
  const { user } = useAuth();
  const [hotel, setHotel] = useState(null);
  const [roomTypes, setRoomTypes] = useState([]);
  const [filteredRoomTypes, setFilteredRoomTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [contactInfo, setContactInfo] = useState(null);
  const [selectedBedType, setSelectedBedType] = useState('');
  const [selectedGuests, setSelectedGuests] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [availabilityMessage, setAvailabilityMessage] = useState('');
  
  // State สำหรับการแจ้งเตือน (แยกระหว่างใหม่และเก่า)
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [newNotificationsCount, setNewNotificationsCount] = useState(0); // เฉพาะการแจ้งเตือนใหม่
  const [lastSeenNotificationTime, setLastSeenNotificationTime] = useState(Date.now().toString());
  
  // Helper function สำหรับการเรียกใช้ localStorage อย่างปลอดภัย
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
  
  // State สำหรับการเลื่อนรูปอัตโนมัติ
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  
  // รายการประเภทเตียงทั้งหมดที่คงที่ (เฉพาะที่มีในระบบ)
  const allBedTypes = ['single', 'double'];

  // ฟังก์ชันกรองห้องพักตามเงื่อนไข
  const applyRoomFilters = (rooms, bedType = '', guestCount = '') => {
    if (!rooms || rooms.length === 0) return [];
    
    let filtered = rooms;
    
    // กรองตามประเภทเตียง
    if (bedType) {
      filtered = filtered.filter(room => room.bed_type === bedType);
    }
    
    // กรองตามจำนวนผู้เข้าพัก - ใช้ max_guests จากฐานข้อมูล
    if (guestCount) {
      const requestedGuests = parseInt(guestCount);
      filtered = filtered.filter(room => {
        const maxGuests = parseInt(room.max_guests) || parseInt(room.maxGuests) || 2;
        return maxGuests >= requestedGuests;
      });
    }
    
    return filtered;
  };

  // ฟังก์ชันจัดการการแจ้งเตือน
  const fetchNotifications = async (unreadOnly = false) => {
    if (!user) return;

    try {
      // ดึง token จาก localStorage หรือ sessionStorage
      const token = getAuthToken();

      if (!token) {
        console.log('No auth token found for notifications');
        return;
      }

      const url = `http://localhost:3001/api/notifications${unreadOnly ? '?unread_only=true' : ''}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.notifications) {
          const previousCount = unreadCount;
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
          const unread = notifications.filter(n => !n.read).length;
          
          // ตรวจสอบว่าเพิ่งล้างการแจ้งเตือนไปหรือไม่
          const clearedAt = safeLocalStorage.getItem('notifications_cleared_at');
          const now = Date.now();
          
          if (clearedAt && (now - parseInt(clearedAt)) < 30000) {
            // เพิ่งล้างไปไม่เกิน 30 วินาที
            console.log('⏰ Recently cleared notifications, forcing 0 count');
            setUnreadCount(0);
          } else {
            setUnreadCount(unread);
            
            // ถ้ามีการแจ้งเตือนใหม่ ให้ลบสถานะการล้าง
            if (unread > 0) {
              safeLocalStorage.removeItem('notifications_cleared_at');
            }
          }
          
          // แสดง toast เมื่อมีการแจ้งเตือนใหม่เข้ามา (เพิ่มขึ้นจากเดิม)
          const displayedUnread = (clearedAt && (now - parseInt(clearedAt)) < 30000) ? 0 : unread;
          if (previousCount > 0 && displayedUnread > previousCount && !unreadOnly) {
            toast.info(`🔔 มีการแจ้งเตือนใหม่ ${displayedUnread - previousCount} รายการ`);
          }
          
          console.log(`📨 Loaded ${notifications.length} notifications, ${unread} unread`);
        } else if (data.success && data.data) {
          // Legacy data format support
          const previousCount = unreadCount;
          setNotifications(data.data);
          const unread = data.data.filter(n => !n.read).length;
          setUnreadCount(unread);
          
          if (previousCount > 0 && unread > previousCount && !unreadOnly) {
            toast.info(`🔔 มีการแจ้งเตือนใหม่ ${unread - previousCount} รายการ`);
          }
        }
      } else if (response.status === 401) {
        console.log('Token expired or invalid for notifications');
      }
    } catch (error) {
      console.log('Could not fetch notifications:', error);
    }
  };

  // ลบ lastNotificationCheck เก่าออก เนื่องจากใช้ lastSeenNotificationTime แทนแล้ว

  const checkForNewNotifications = async () => {
    if (!user || isRefreshing) return;

    try {
      const token = getAuthToken();
      if (!token) return;

      // ดึงการแจ้งเตือนที่สร้างหลังจาก lastSeenNotificationTime
      const response = await fetch(`http://localhost:3001/api/notifications?limit=10&created_after=${lastSeenNotificationTime}`, {
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
            
            toast.info(`🔔 มีการแจ้งเตือนใหม่ ${newCount} รายการ`, {
              position: "top-right",
              autoClose: 5000,
            });
          }
          
          // อัปเดต timestamp ล่าสุด
          const latestNotificationTime = Math.max(
            ...actualNewNotifications.map(n => new Date(n.createdAt || n.created_at).getTime())
          );
          
          const newTimestamp = latestNotificationTime.toString();
          setLastSeenNotificationTime(newTimestamp);
          safeLocalStorage.setItem('last_seen_notification_time', newTimestamp);
          
          console.log(`📨 Found ${actualNewNotifications.length} new notifications, ${newCount} unread`);
        }
      }
    } catch (error) {
      console.log('Could not check for new notifications:', error);
    }
  };

  const fetchUnreadCount = async () => {
    if (!user || isRefreshing) return;

    // ตรวจสอบ cooldown
    const now = Date.now();
    if (now - lastFetchTime < FETCH_COOLDOWN) {
      console.log(`⏳ Skipping fetch, cooldown active (${Math.ceil((FETCH_COOLDOWN - (now - lastFetchTime)) / 1000)}s remaining)`);
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

      const response = await fetch('http://localhost:3001/api/notifications/unread-count', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const actualUnreadCount = data.unreadCount || 0;
        
        // ตรวจสอบว่าเพิ่งล้างการแจ้งเตือนไปหรือไม่
        const clearedAt = safeLocalStorage.getItem('notifications_cleared_at');
        const now = Date.now();
        
        // ถ้าเพิ่งล้างไปไม่เกิน 30 วินาที ให้ใช้ค่า 0
        if (clearedAt && (now - parseInt(clearedAt)) < 30000) {
          console.log('⏰ Recently cleared notifications, showing 0 count');
          setUnreadCount(0);
        } else {
          setUnreadCount(actualUnreadCount);
          
          // ถ้ามีการแจ้งเตือนใหม่ ให้ลบสถานะการล้าง
          if (actualUnreadCount > 0) {
            safeLocalStorage.removeItem('notifications_cleared_at');
          }
        }
        
        console.log(`📊 Unread count refreshed: ${actualUnreadCount} (displayed: ${clearedAt && (now - parseInt(clearedAt)) < 30000 ? 0 : actualUnreadCount})`);
      } else if (response.status === 401) {
        console.log('🔐 Token expired, clearing notification state');
        setUnreadCount(0);
        setNotifications([]);
      }
    } catch (error) {
      console.log('Could not fetch unread count:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      const token = getAuthToken();

      if (!token) return;

      const response = await fetch(`http://localhost:3001/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.log('Could not mark notification as read:', error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const token = getAuthToken();

      if (!token) {
        console.log('❌ No token found for marking notifications as read');
        return false;
      }

      const unreadNotifications = notifications.filter(n => !n.read);
      
      if (unreadNotifications.length === 0) {
        console.log('ℹ️ No unread notifications to mark as read');
        return true;
      }

      console.log(`🔄 Marking ${unreadNotifications.length} notifications as read...`);

      // ใช้ endpoint สำหรับทำเครื่องหมายอ่านทั้งหมด
      const response = await fetch(`http://localhost:3001/api/notifications/read-all`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('🎯 Backend response:', result);
        
        // อัปเดต state
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        
        console.log(`✅ Successfully marked ${result.updatedCount || unreadNotifications.length} notifications as read via bulk endpoint`);
        
        // บันทึกเวลาที่ทำเครื่องหมายอ่าน
        safeLocalStorage.setItem('last_mark_read_time', Date.now().toString());
        
        return true;
      } else {
        console.error('❌ Failed to mark all notifications as read:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error details:', errorText);
        return false;
      }
    } catch (error) {
      console.error('❌ Exception while marking all notifications as read:', error);
      return false;
    }
  };

  const handleNotificationDropdownToggle = async () => {
    if (!showNotifications) {
      // เมื่อเปิด dropdown
      console.log('📂 Opening notification dropdown...');
      
      // โหลดการแจ้งเตือนทั้งหมด (รวมเก่า) เสมอ
      await fetchNotifications();
      setShowNotifications(true);
      
      // ล้างตัวเลขการแจ้งเตือนใหม่เมื่อเปิดดู
      if (newNotificationsCount > 0) {
        const now = Date.now().toString();
        setNewNotificationsCount(0);
        setLastSeenNotificationTime(now);
        safeLocalStorage.setItem('last_seen_notification_time', now);
        console.log('👁️ Marked new notifications as seen');
      }
    } else {
      // เมื่อปิด dropdown
      setShowNotifications(false);
    }
  };

  const clearAllNotifications = async () => {
    try {
      console.log('🗑️ Clearing notification display (keeping notifications in database)...');
      
      // ล้างเฉพาะตัวเลขการแจ้งเตือนใหม่ โดยไม่ลบการแจ้งเตือนออกจากฐานข้อมูล
      setNewNotificationsCount(0);
      setShowNotifications(false);
      
      // อัปเดต timestamp ให้เป็นปัจจุบัน เพื่อไม่แสดงการแจ้งเตือนที่มีอยู่แล้วเป็นใหม่
      const now = Date.now().toString();
      setLastSeenNotificationTime(now);
      safeLocalStorage.setItem('last_seen_notification_time', now);
      
      console.log('✅ Notification counter cleared, but notifications preserved in database');
      
      // แสดง message ให้ผู้ใช้ทราบ
      toast.info('ตัวเลขการแจ้งเตือนถูกล้างแล้ว การแจ้งเตือนยังคงอยู่ในระบบ', {
        position: "top-right",
        autoClose: 3000,
      });
      
    } catch (error) {
      console.log('Could not clear notification display:', error);
    }
  };

  // ปิด notification dropdown เมื่อคลิกข้างนอก
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.notification-dropdown')) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  // ตัวแปรสำหรับควบคุมการเรียก API
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const FETCH_COOLDOWN = 5000; // 5 วินาที cooldown ระหว่างการเรียก API

  // ตรวจสอบการแจ้งเตือนใหม่เป็นระยะ (ปรับปรุงประสิทธิภาพ)
  useEffect(() => {
    if (!user) return;

    // โหลดจำนวนการแจ้งเตือนที่ยังไม่ได้อ่านครั้งแรก
    fetchUnreadCount();

    // ใช้ interval ที่ยาวขึ้นเพื่อประหยัดทรัพยากร (30 วินาที)
    const intervalId = setInterval(() => {
      const now = Date.now();
      // ตรวจสอบ cooldown ก่อนเรียก API
      if (now - lastFetchTime > FETCH_COOLDOWN && !isRefreshing) {
        fetchUnreadCount();
      }
    }, 30000); // เพิ่มจาก 10 วินาที เป็น 30 วินาที

    // ตรวจสอบการแจ้งเตือนใหม่ทุก 60 วินาที (แยกจากการดึงจำนวน)
    const newNotificationCheckId = setInterval(() => {
      checkForNewNotifications();
    }, 60000);

    return () => {
      clearInterval(intervalId);
      clearInterval(newNotificationCheckId);
    };
  }, [user, lastFetchTime, isRefreshing, lastSeenNotificationTime]);

  // เพิ่ม focus event ให้โหลดการแจ้งเตือนเมื่อกลับมาที่หน้าต่าง (ปรับปรุง)
  useEffect(() => {
    if (!user) return;

    const handleFocus = () => {
      const now = Date.now();
      // ตรวจสอบ cooldown ก่อนเรียก API
      if (now - lastFetchTime > FETCH_COOLDOWN && !isRefreshing) {
        fetchUnreadCount();
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        handleFocus();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  // ฟังก์ชันสำหรับการค้นหา/กรองแบบ manual
  const handleSearch = () => {
    const filtered = applyRoomFilters(roomTypes, selectedBedType, selectedGuests);
    setFilteredRoomTypes(filtered);
    
    console.log('🔍 Manual search applied:');
    console.log('  - Bed type:', selectedBedType || 'ทั้งหมด');
    console.log('  - Guests:', selectedGuests || 'ไม่ระบุ');
    console.log('  - Results:', filtered.length, '/', roomTypes.length);
    
    // แสดงข้อความแจ้งผลการค้นหา
    if (filtered.length === 0) {
      setAvailabilityMessage('ไม่พบห้องพักที่ตรงกับเงื่อนไขที่ระบุ');
    } else {
      setAvailabilityMessage(`พบห้องพักที่ตรงกับเงื่อนไข ${filtered.length} ห้อง`);
    }
  };

  // ฟังก์ชันล้างตัวกรอง
  const clearFilters = () => {
    setSelectedBedType('');
    setSelectedGuests('');
    setFilteredRoomTypes(roomTypes);
    setAvailabilityMessage('');
    console.log('🧹 Filters cleared');
  };

  // โหลด lastSeenNotificationTime จาก localStorage หลัง component mount
  useEffect(() => {
    const savedTime = safeLocalStorage.getItem('last_seen_notification_time');
    if (savedTime) {
      setLastSeenNotificationTime(savedTime);
    }
  }, []);

  // แสดงสถานะ authentication ใน console
  useEffect(() => {
    if (user) {
      console.log('🔐 Authentication Status: Logged in as', user.email, '(' + user.role + ')');
      
      // ตรวจสอบข้อมูลโทเคนใน localStorage
      if (typeof window !== 'undefined') {
        const persistentToken = localStorage.getItem('auth_token_persistent');
        const persistentUser = localStorage.getItem('user_data_persistent');
        const authExpires = localStorage.getItem('auth_expires_at');
        const rememberMe = localStorage.getItem('remember_me');
        
        console.log('💾 Token Storage Status:');
        console.log('  - Persistent Token:', persistentToken ? 'Stored ✅' : 'Missing ❌');
        console.log('  - Persistent User Data:', persistentUser ? 'Stored ✅' : 'Missing ❌');
        console.log('  - Remember Me:', rememberMe === 'true' ? 'Enabled ✅' : 'Disabled ❌');
        
        if (authExpires) {
          const expiresDate = new Date(parseInt(authExpires));
          console.log('  - Expires At:', expiresDate.toLocaleString('th-TH'));
        }
      }
    } else {
      console.log('🔐 Authentication Status: Not logged in');
    }
  }, [user]);

  // Fallback data ในกรณีที่ API ไม่ได้
  const fallbackHotel = {
    name: "โรงแรมสวยงาม",
    description: "โรงแรมสุดหรูใจกลางเมือง พร้อมสิ่งอำนวยความสะดวกครบครัน",
    address: "123 ถนนใหญ่ กรุงเทพฯ",
    rating: 4.5
  };

  const fallbackRooms = [
    {
      id: 1,
      name: "ห้องสแตนดาร์ด",
      description: "ห้องพักสำหรับผู้เข้าพักทั่วไปพร้อมสิ่งอำนวยความสะดวกครบครัน",
      pricePerNight: 1200,
      maxGuests: 2,
      sizeSqm: 25,
      amenities: ["Wi-Fi ฟรี", "เครื่องปรับอากาศ", "ทีวี"]
    },
    {
      id: 2,
      name: "ห้องซูพีเรียร์",
      description: "ห้องพักขนาดใหญ่กว่าพร้อมวิวที่สวยงาม",
      pricePerNight: 1800,
      maxGuests: 3,
      sizeSqm: 35,
      amenities: ["Wi-Fi ฟรี", "เครื่องปรับอากาศ", "ทีวี", "ตู้เซฟ"]
    },
    {
      id: 3,
      name: "ห้องดีลักซ์",
      description: "ห้องพักหรูหราพร้อมระเบียงส่วนตัว",
      pricePerNight: 2500,
      maxGuests: 4,
      sizeSqm: 45,
      amenities: ["Wi-Fi ฟรี", "เครื่องปรับอากาศ", "ทีวี", "ตู้เซฟ", "ระเบียง"]
    },
    {
      id: 4,
      name: "ห้องสวีท",
      description: "ห้องพักขนาดใหญ่พร้อมห้องนั่งเล่นแยกต่างหาก",
      pricePerNight: 3500,
      maxGuests: 6,
      sizeSqm: 65,
      amenities: ["Wi-Fi ฟรี", "เครื่องปรับอากาศ", "ทีวี", "ตู้เซฟ", "ระเบียง", "ห้องนั่งเล่น"]
    },
    {
      id: 5,
      name: "ห้องแฟมิลี่",
      description: "ห้องพักขนาดใหญ่สำหรับครอบครัว",
      pricePerNight: 4200,
      maxGuests: 8,
      sizeSqm: 80,
      amenities: ["Wi-Fi ฟรี", "เครื่องปรับอากาศ", "ทีวี", "ตู้เซฟ", "ครัวเล็ก", "ห้องนั่งเล่น"]
    }
  ];

  // Helper function to get price from room object
  const getPrice = (room) => {
    return room.price_per_night || room.pricePerNight || room.price || 1500;
  };

  // Helper function to get bed type label
  const getBedTypeLabel = (bedType) => {
    const bedTypes = {
      'single': 'เตียงเดี่ยว',
      'double': 'เตียงคู่',
      'queen': 'เตียงควีน',
      'king': 'เตียงคิง',
      'twin': 'เตียงแฝด'
    };
    return bedTypes[bedType] || bedType;
  };

  // Auto slide images effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex(prev => {
        const newIndex = { ...prev };
        
        // วนลูปผ่านห้องพักทั้งหมดที่มีรูปมากกว่า 1 รูป
        filteredRoomTypes.forEach(room => {
          if (room.images && Array.isArray(room.images)) {
            // Filter images same as in render
            const imageArray = room.images.filter(img => img && typeof img === 'string' && img.trim());
            
            if (imageArray.length > 1) {
              const currentIndex = newIndex[room.id] || 0;
              newIndex[room.id] = (currentIndex + 1) % imageArray.length;
            }
          }
        });
        
        return newIndex;
      });
    }, 4000); // เปลี่ยนรูปทุก 4 วินาที

    return () => clearInterval(interval);
  }, [filteredRoomTypes]);

  const fetchHotelAndRooms = async (bedTypeFilter = '') => {
    try {
      setIsLoading(true);
      console.log('🚀 Starting to fetch hotel and room data...', bedTypeFilter ? `with bed type filter: ${bedTypeFilter}` : '');
      
      // Get global pricing first
      let uniformPrice = 1500; // Default fallback price
      try {
        console.log('💰 Fetching global pricing...');
        const globalPriceRes = await fetch('http://localhost:3001/api/global-settings');
        const globalPriceData = await globalPriceRes.json();
        uniformPrice = parseFloat(globalPriceData.data?.room_price_per_night || '1500');
        console.log('💰 Global price fetched:', uniformPrice);
      } catch (priceError) {
        console.log('⚠️ Homepage: Could not fetch global price, using default 1500', priceError);
      }
      
      // Try direct API calls instead of hotelAPI
      console.log('🏨 Fetching hotels directly...');
      const hotelsResponse = await fetch('http://localhost:3001/api/hotels');
      const hotelsData = await hotelsResponse.json();
      console.log('🏨 Hotels response:', hotelsData);
      
      // Build URL with bed type filter if provided
      let roomTypesUrl = `http://localhost:3001/api/room-types-with-images?t=${Date.now()}`;
      if (bedTypeFilter) {
        roomTypesUrl += `&bed_type=${encodeURIComponent(bedTypeFilter)}`;
      }
      
      console.log('🏠 Fetching room types with images directly...', roomTypesUrl);
      const roomTypesResponse = await fetch(roomTypesUrl, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      const roomTypesData = await roomTypesResponse.json();
      console.log('🏠 Room types response:', roomTypesData);
      
      if (hotelsData.success && roomTypesData.success) {
        // Use first hotel from database
        setHotel(hotelsData.data[0]);
        
        const roomTypesWithUniformPricing = roomTypesData.data.map(room => ({
          ...room,
          price: uniformPrice
        }));
        
        setRoomTypes(roomTypesWithUniformPricing);
        // ใช้ฟังก์ชันกรองใหม่แทนการตั้งค่าโดยตรง
        const filtered = applyRoomFilters(roomTypesWithUniformPricing, selectedBedType, selectedGuests);
        setFilteredRoomTypes(filtered);
        
        console.log('✅ Homepage: Data loaded successfully from direct API calls');
        console.log('🛏️ Available bed types:', allBedTypes);
        console.log('🔍 Applied filters - Bed type:', selectedBedType, 'Guests:', selectedGuests);
        console.log('📊 Total rooms:', roomTypesWithUniformPricing.length, 'Filtered rooms:', filtered.length);
      } else {
        throw new Error('API response failed');
      }
      
    } catch (error) {
      console.log('⚠️ Homepage: API failed, using fallback data:', error.message);
      setHotel(fallbackHotel);
      
      // Apply uniform pricing to fallback rooms
      const fallbackRoomsWithUniformPricing = fallbackRooms.map(room => ({
        ...room,
        price: 1500 // Fallback uniform price
      }));
      
      setRoomTypes(fallbackRoomsWithUniformPricing);
      // ใช้ฟังก์ชันกรองสำหรับ fallback data ด้วย
      const filteredFallback = applyRoomFilters(fallbackRoomsWithUniformPricing, selectedBedType, selectedGuests);
      setFilteredRoomTypes(filteredFallback);
      // ไม่แสดง toast error เพราะ user ยังได้เห็นข้อมูลอยู่
    } finally {
      setIsLoading(false);
    }
  };

  const fetchContactInfo = async () => {
    try {
      console.log('📞 Fetching hotel contact information...');
      const response = await fetch('http://localhost:3001/api/contact-settings');
      const result = await response.json();
      
      console.log('📞 Contact info response:', result);
      
      if (result.success && result.data) {
        setContactInfo(result.data);
        console.log('✅ Contact info loaded:', result.data);
      } else {
        console.log('⚠️ Using default contact info');
        // Fallback to default contact info
        setContactInfo({
          phone: '02-123-4567',
          email: 'support@hotel.com',
          address: '123 ถนนใหญ่ เขตกลาง กรุงเทพฯ 10100',
          website: 'www.hotel.com',
          facebook: 'facebook.com/hotel',
          line: '@hotel'
        });
      }
    } catch (error) {
      console.error('❌ Error fetching contact info:', error);
      // Fallback to default contact info
      setContactInfo({
        phone: '02-123-4567',
        email: 'support@hotel.com',
        address: '123 ถนนใหญ่ เขตกลาง กรุงเทพฯ 10100',
        website: 'www.hotel.com',
        facebook: 'facebook.com/hotel',
        line: '@hotel'
      });
    }
  };

  useEffect(() => {
    const initialLoad = async () => {
      await fetchHotelAndRooms();
      await fetchContactInfo();
      if (user) {
        await fetchNotifications();
      }
    };
    
    initialLoad();
  }, [user]);

  // ตรวจสอบการแจ้งเตือนใหม่ทุก ๆ 30 วินาที (สำหรับลูกค้า)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user]);

  // ปิด notification dropdown เมื่อคลิกนอกพื้นที่
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !event.target.closest('.notification-dropdown')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  // Refresh data when page gets focus to show latest room images
  useEffect(() => {
    const handleFocus = () => {
      if (!isLoading) {
        console.log('🔄 Refreshing hotel and room data on page focus');  
        fetchHotelAndRooms();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isLoading]);

  // ฟังก์ชันกรองห้องพักตามเงื่อนไขที่เลือก
  const filterRooms = () => {
    let filtered = [...roomTypes];

    // กรองตามประเภทเตียง
    if (selectedBedType) {
      filtered = filtered.filter(room => room.bed_type === selectedBedType);
    }

    // กรองตามจำนวนผู้เข้าพัก
    if (selectedGuests) {
      const guestCount = parseInt(selectedGuests);
      filtered = filtered.filter(room => {
        const maxGuests = room.max_guests || room.maxGuests || 2;
        return maxGuests >= guestCount;
      });
    }

    setFilteredRoomTypes(filtered);
  };

  // อัปเดตการกรองเมื่อมีการเปลี่ยนแปลงตัวเลือก
  useEffect(() => {
    if (roomTypes.length > 0) {
      filterRooms();
    }
  }, [selectedBedType, selectedGuests, roomTypes]);

  // ฟังก์ชันตรวจสอบความพร้อมของห้องพัก
  const checkRoomAvailability = async () => {
    if (!checkInDate || !checkOutDate) {
      // หากไม่มีวันที่ ให้ใช้ฟังก์ชันกรองปกติ
      filterRooms();
      setAvailabilityMessage('');
      return;
    }

    // ตรวจสอบว่าวันที่เช็คอินต้องเป็นก่อนวันที่เช็คเอาท์
    if (new Date(checkInDate) >= new Date(checkOutDate)) {
      setAvailabilityMessage('⚠️ วันที่เช็คอินต้องเป็นก่อนวันที่เช็คเอาท์');
      setFilteredRoomTypes([]);
      return;
    }

    try {
      console.log('🔍 Checking availability for:', { checkInDate, checkOutDate, selectedBedType, selectedGuests });
      
      let apiUrl = `http://localhost:3001/api/check-room-availability?check_in_date=${checkInDate}&check_out_date=${checkOutDate}`;
      if (selectedBedType) {
        apiUrl += `&bed_type=${selectedBedType}`;
      }

      const response = await fetch(apiUrl);
      const result = await response.json();

      if (result.success) {
        if (result.data.length === 0) {
          setAvailabilityMessage('❌ ขออภัย ไม่มีห้องว่างในช่วงวันที่ที่เลือก กรุณาเลือกวันอื่น');
          setFilteredRoomTypes([]);
        } else {
          // Get global pricing for uniform price
          let uniformPrice = 1500; // Default fallback price
          try {
            const globalPriceRes = await fetch('http://localhost:3001/api/global-settings');
            const globalPriceData = await globalPriceRes.json();
            uniformPrice = parseFloat(globalPriceData.data?.room_price_per_night || '1500');
          } catch (priceError) {
            console.log('⚠️ Could not fetch global price for availability check, using default 1500');
          }

          // Apply uniform pricing to available rooms
          let roomsWithUniformPricing = result.data.map(room => ({
            ...room,
            price: uniformPrice
          }));

          // เพิ่มการกรองตามจำนวนผู้เข้าพักสำหรับห้องที่ว่าง
          if (selectedGuests) {
            const guestCount = parseInt(selectedGuests);
            roomsWithUniformPricing = roomsWithUniformPricing.filter(room => {
              const maxGuests = room.max_guests || room.maxGuests || 2;
              return maxGuests >= guestCount;
            });
          }

          if (roomsWithUniformPricing.length === 0) {
            setAvailabilityMessage('❌ ไม่มีห้องที่รองรับจำนวนผู้เข้าพักที่เลือกในช่วงวันที่นี้');
            setFilteredRoomTypes([]);
          } else {
            setAvailabilityMessage(`✅ พบห้องว่าง ${roomsWithUniformPricing.length} ห้อง ในช่วงวันที่ ${checkInDate} ถึง ${checkOutDate}`);
            setFilteredRoomTypes(roomsWithUniformPricing);
            console.log('🖼️ Available rooms with images:', roomsWithUniformPricing);
          }
        }
      } else {
        setAvailabilityMessage('❌ เกิดข้อผิดพลาดในการตรวจสอบความพร้อม');
        setFilteredRoomTypes([]);
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      setAvailabilityMessage('❌ เกิดข้อผิดพลาดในการตรวจสอบความพร้อม');
      setFilteredRoomTypes([]);
    }
  };

  // กรองห้องพักอัตโนมัติเมื่อมีการเปลี่ยนแปลงตัวกรองหรือข้อมูลห้อง
  useEffect(() => {
    if (roomTypes.length > 0) {
      const filtered = applyRoomFilters(roomTypes, selectedBedType, selectedGuests);
      setFilteredRoomTypes(filtered);
      
      // อัปเดตข้อความสถานะ
      if (selectedBedType || selectedGuests) {
        if (filtered.length === 0) {
          setAvailabilityMessage('ไม่พบห้องพักที่ตรงกับเงื่อนไขที่ระบุ');
        } else {
          setAvailabilityMessage(`พบห้องพักที่ตรงกับเงื่อนไข ${filtered.length} ห้อง`);
        }
      } else {
        setAvailabilityMessage('');
      }
    }
  }, [selectedBedType, selectedGuests, roomTypes]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hotel Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {hotel?.name || 'ยินดีต้อนรับ'}
              </h1>
              <p className="text-gray-600 mb-2">
                {hotel?.description || 'โรงแรมสุดหรูใจกลางเมือง'}
              </p>
              <div className="flex items-center text-sm text-gray-500">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{hotel?.address || 'กรุงเทพฯ'}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              {/* Notification Bell - สำหรับลูกค้าที่ล็อกอินแล้ว */}
              {user && (
                <div className="relative notification-dropdown">
                  <button
                    onClick={handleNotificationDropdownToggle}
                    className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  >
                    <Bell className="h-6 w-6" />
                    {newNotificationsCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {newNotificationsCount > 9 ? '9+' : newNotificationsCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900">การแจ้งเตือน</h3>
                          {notifications.length > 0 && (
                            <button
                              onClick={clearAllNotifications}
                              className="text-sm text-red-600 hover:text-red-800"
                            >
                              ล้างทั้งหมด
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.slice(0, 10).map((notification) => (
                            <div
                              key={notification.id}
                              className="p-4 border-b border-gray-100 hover:bg-gray-50"
                            >
                              <div className="flex items-start space-x-3">
                                <div className={`w-2 h-2 rounded-full mt-2 ${
                                  !notification.read ? 'bg-blue-500' : 'bg-transparent'
                                }`}></div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900">
                                    {notification.title}
                                  </p>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {new Date(notification.created_at).toLocaleString('th-TH')}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-gray-500">
                            <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p>ไม่มีการแจ้งเตือนใหม่</p>
                          </div>
                        )}
                      </div>

                      {notifications.length > 10 && (
                        <div className="p-3 border-t border-gray-200 text-center">
                          <Link 
                            href="/notifications"
                            className="text-sm text-blue-600 hover:text-blue-800"
                            onClick={() => setShowNotifications(false)}
                          >
                            ดูการแจ้งเตือนทั้งหมด
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">
                  ห้องพักพร้อม {roomTypes.length} ประเภท
                </p>
                <p className="text-sm text-gray-500">ราคาเริ่มต้น ฿{roomTypes.length > 0 ? Math.min(...roomTypes.map(r => getPrice(r))).toLocaleString() : '1,500'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Booking Form */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">วันที่เช็คอิน</label>
              <input 
                type="date" 
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">วันที่เช็คเอาท์</label>
              <input 
                type="date" 
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนผู้เข้าพัก</label>
              <select 
                value={selectedGuests}
                onChange={(e) => setSelectedGuests(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">ทุกจำนวน</option>
                {(() => {
                  // คำนวณจำนวนผู้เข้าพักสูงสุดจากฐานข้อมูล room_types
                  const maxGuestsFromDB = roomTypes.length > 0 
                    ? Math.max(...roomTypes.map(r => parseInt(r.max_guests) || parseInt(r.maxGuests) || 2))
                    : 8; // fallback เป็น 8 ถ้าไม่มีข้อมูล
                  
                  return Array.from({ length: maxGuestsFromDB }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>{num} คน</option>
                  ));
                })()}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ประเภทเตียง</label>
              <select 
                value={selectedBedType}
                onChange={(e) => setSelectedBedType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">ทุกประเภท</option>
                {allBedTypes.map((bedType) => (
                  <option key={bedType} value={bedType}>
                    {getBedTypeLabel(bedType)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button 
                onClick={handleSearch}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center font-semibold"
              >
                ค้นหาห้องพัก
              </button>
            </div>
          </div>
          
          {/* Filter Status and Clear Button */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">
              {selectedBedType || selectedGuests ? (
                <span>
                  ตัวกรองที่ใช้: {selectedBedType && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs mr-1">{getBedTypeLabel(selectedBedType)}</span>}
                  {selectedGuests && <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs mr-1">{selectedGuests} คน</span>}
                </span>
              ) : (
                <span>แสดงห้องพักทั้งหมด</span>
              )}
            </div>
            {(selectedBedType || selectedGuests) && (
              <button 
                onClick={clearFilters}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                ล้างตัวกรอง
              </button>
            )}
          </div>
        </div>

        {/* Availability Message */}
        {availabilityMessage && (
          <div className={`mb-6 p-4 rounded-lg ${
            availabilityMessage.includes('❌') || availabilityMessage.includes('⚠️') 
              ? 'bg-red-50 border border-red-200 text-red-800' 
              : 'bg-green-50 border border-green-200 text-green-800'
          }`}>
            <p className="font-medium">{availabilityMessage}</p>
          </div>
        )}

        {/* Room Types Section */}
        {filteredRoomTypes.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  ห้องพัก
                  {selectedBedType && (
                    <span className="text-lg font-normal text-blue-600 ml-2">
                      ({getBedTypeLabel(selectedBedType)})
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  พบห้องพัก {filteredRoomTypes.length} ห้อง
                  {selectedGuests && ` ที่รองรับ ${selectedGuests} คน`}
                </p>
              </div>
              <div className="text-sm text-gray-600">
                <p className="text-gray-600 mb-4">
                  ราคาเริ่มต้น ฿{filteredRoomTypes.length > 0 ? Math.min(...filteredRoomTypes.map(r => getPrice(r))).toLocaleString() : '1,500'} - ฿{filteredRoomTypes.length > 0 ? Math.max(...filteredRoomTypes.map(r => getPrice(r))).toLocaleString() : '2,500'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRoomTypes.map((room) => (
                <div key={room.id} className="group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 overflow-hidden">
                  <div className="relative h-48 bg-gradient-to-br from-blue-100 to-blue-200 overflow-hidden">
                    {(() => {
                      // Process images - simplified processing since backend now handles parsing
                      let imageArray = [];
                      
                      if (room.images) {
                        console.log('🖼️ Processing images for room:', room.name, 'Raw images:', room.images);
                        
                        if (Array.isArray(room.images)) {
                          imageArray = room.images.filter(img => img && typeof img === 'string' && img.trim());
                        } else if (typeof room.images === 'string' && room.images.trim()) {
                          // Backend should have parsed it, but handle just in case
                          try {
                            const parsed = JSON.parse(room.images);
                            imageArray = Array.isArray(parsed) ? parsed : [room.images];
                          } catch (e) {
                            imageArray = [room.images];
                          }
                        }
                      }
                      
                      console.log('🖼️ Final processed images for', room.name, ':', imageArray);
                      
                      // Use room images that are uploaded by admin
                      const getRoomImageSrc = (imageName, roomId) => {
                        const imageSrc = getRoomImageUrlWithCache(imageName, roomId);
                        console.log('🖼️ Getting image source:', imageSrc);
                        return imageSrc;
                      };

                      const getFallbackImageSrc = (roomId, roomName) => {
                        // Fallback to predefined room images 
                        const fallbackImages = getFallbackRoomImages();
                        const fallbackSrc = fallbackImages[(roomId - 1) % fallbackImages.length] || getPlaceholderImageUrl();
                        console.log('🔄 Using fallback image:', fallbackSrc);
                        return fallbackSrc;
                      };

                      return imageArray.length > 0 ? (
                        <>
                          {/* Image Slider Container */}
                          <div className="relative w-full h-full overflow-hidden">
                            <div 
                              className="flex transition-transform duration-700 ease-in-out"
                              style={{
                                transform: `translateX(-${(currentImageIndex[room.id] || 0) * (100 / imageArray.length)}%)`,
                                width: `${imageArray.length * 100}%`
                              }}
                            >
                              {imageArray.map((imageName, imageIndex) => (
                                <div 
                                  key={`${room.id}-${imageIndex}`}
                                  className="flex-shrink-0 w-full h-full"
                                  style={{ width: `${100 / imageArray.length}%` }}
                                >
                                  <img 
                                    src={getRoomImageSrc(imageName, room.id)}
                                    alt={`${room.name} - รูปที่ ${imageIndex + 1}`}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                                    onLoad={() => {
                                      console.log('✅ Room image loaded successfully:', getRoomImageSrc(imageName, room.id));
                                    }}
                                    onError={(e) => {
                                      console.log('❌ Room image failed to load:', e.target.src);
                                      console.log('❌ Available images for room:', room.name, ':', imageArray);
                                      // Try fallback image
                                      const fallbackSrc = getFallbackImageSrc(room.id, room.name);
                                      if (e.target.src !== fallbackSrc) {
                                        console.log('🔄 Trying fallback image:', fallbackSrc);
                                        e.target.src = fallbackSrc;
                                      } else {
                                        // Final fallback to placeholder
                                        console.log('❌ All images failed, showing placeholder');
                                        e.target.style.display = 'none';
                                      }
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {/* Image Indicators - แสดงเฉพาะเมื่อมีรูปมากกว่า 1 รูป */}
                          {imageArray.length > 1 && (
                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
                              {imageArray.map((_, index) => (
                                <button
                                  key={index}
                                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                    index === (currentImageIndex[room.id] || 0)
                                      ? 'bg-white shadow-lg scale-125'
                                      : 'bg-white/60 hover:bg-white/80'
                                  }`}
                                  onClick={() => {
                                    setCurrentImageIndex(prev => ({
                                      ...prev,
                                      [room.id]: index
                                    }));
                                  }}
                                />
                              ))}
                            </div>
                          )}
                          
                          {/* Image Counter - แสดงเฉพาะเมื่อมีรูปมากกว่า 1 รูป */}
                          {imageArray.length > 1 && (
                            <div className="absolute bottom-4 right-4 bg-black/50 text-white px-2 py-1 rounded-full text-xs font-medium">
                              {(currentImageIndex[room.id] || 0) + 1}/{imageArray.length}
                            </div>
                          )}
                          
                          <div className="absolute inset-0 hidden items-center justify-center text-blue-600 bg-gradient-to-br from-blue-100 to-blue-200">
                            <div className="text-center">
                              <Calendar className="h-8 w-8 mx-auto mb-1" />
                              <span className="text-xs font-medium">ภาพห้องพัก</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-blue-600">
                          <img 
                            src={getFallbackImageSrc(room.id, room.name)}
                            alt={room.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              console.log('❌ Fallback image failed, showing placeholder icon');
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div className="absolute inset-0 hidden items-center justify-center text-blue-600 bg-gradient-to-br from-blue-100 to-blue-200">
                            <div className="text-center">
                              <Calendar className="h-8 w-8 mx-auto mb-1" />
                              <span className="text-xs font-medium">ภาพห้องพัก</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                    {/* Price Badge - Enhanced */}
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-2 rounded-full text-sm font-bold shadow-lg backdrop-blur-sm">
                      ฿{getPrice(room).toLocaleString()}
                      <span className="text-xs opacity-90 ml-1">/คืน</span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="mb-4">
                      <h4 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-200">
                        {room.name}
                      </h4>
                      {room.bed_type && (
                        <div className="mb-2">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <Bed className="h-3 w-3 mr-1.5" />
                            {getBedTypeLabel(room.bed_type)}
                          </span>
                        </div>
                      )}
                      <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{room.description}</p>
                    </div>
                    
                    {/* Room Details */}
                    <div className="mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-2 text-blue-500" />
                        <span className="font-medium">{room.max_guests || room.maxGuests || 2} คน</span>
                      </div>
                    </div>

                    {/* Amenities - Enhanced */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {(room.amenities || []).slice(0, 3).map((amenity, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-md font-medium border border-blue-200">
                          {amenity}
                        </span>
                      ))}
                      {(room.amenities || []).length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md font-medium border border-gray-200">
                          +{room.amenities.length - 3} อื่นๆ
                        </span>
                      )}
                    </div>

                    {/* Enhanced Action Buttons */}
                    <div className="flex space-x-3 pt-2 border-t border-gray-100">
                      <Link 
                        href={`/booking-step?roomId=${room.id}&hotelId=${room.hotel_id || hotel?.id || 1}`}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-center py-3 px-4 rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                      >
                        จองห้องนี้
                      </Link>
                      <Link 
                        href={`/room-details/${room.id}`}
                        className="px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 text-center"
                      >
                        ดูรายละเอียด
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-gray-400 mb-4">
              <Calendar className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่พบห้องพักที่ตรงกับเงื่อนไข</h3>
            <p className="text-gray-600 mb-4">
              {(selectedBedType || selectedGuests) ? 
                `ไม่มีห้องพัก${selectedBedType ? `ประเภท${getBedTypeLabel(selectedBedType)}` : ''}${selectedGuests ? `ที่รองรับ ${selectedGuests} คน` : ''} ในขณะนี้` : 
                'ขณะนี้ยังไม่มีข้อมูลห้องพักในระบบ'
              }
            </p>
            <div className="space-x-4">
              {(selectedBedType || selectedGuests) && (
                <button
                  onClick={clearFilters}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  แสดงห้องทั้งหมด
                </button>
              )}
              <button
                onClick={() => fetchHotelAndRooms()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                โหลดข้อมูลใหม่
              </button>
            </div>
          </div>
        )}

        {/* Room Statistics */}
        {filteredRoomTypes.length > 0 && (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{filteredRoomTypes.length}</div>
              <div className="text-sm text-gray-600">ห้องพักทั้งหมด</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 text-center">
              <div className="text-2xl font-bold text-green-600">฿{filteredRoomTypes.length > 0 ? Math.min(...filteredRoomTypes.map(r => getPrice(r))).toLocaleString() : '1,500'}</div>
              <div className="text-sm text-gray-600">ราคาเริ่มต้น</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {filteredRoomTypes.length > 0 ? Math.max(...filteredRoomTypes.map(r => r.max_guests || r.maxGuests || 2)) : '2'}
              </div>
              <div className="text-sm text-gray-600">รองรับสูงสุด (คน)</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {filteredRoomTypes.length}
              </div>
              <div className="text-sm text-gray-600">ประเภทห้องทั้งหมด</div>
            </div>
          </div>
        )}

        {/* Room Categories */}
        {filteredRoomTypes.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">หมวดหมู่ห้องพัก</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">
                  {filteredRoomTypes.filter(r => getPrice(r) <= 2000).length}
                </div>
                <div className="text-sm text-blue-800">ห้องราคาประหยัด</div>
                <div className="text-xs text-blue-600">≤ ฿2,000</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">
                  {filteredRoomTypes.filter(r => getPrice(r) > 2000 && getPrice(r) <= 5000).length}
                </div>
                <div className="text-sm text-green-800">ห้องระดับกลาง</div>
                <div className="text-xs text-green-600">฿2,001 - ฿5,000</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-lg font-bold text-purple-600">
                  {filteredRoomTypes.filter(r => getPrice(r) > 5000).length}
                </div>
                <div className="text-sm text-purple-800">ห้องหรูหรา</div>
                <div className="text-xs text-purple-600">&gt; ฿5,000</div>
              </div>
            </div>
          </div>
        )}

        {/* Features Section */}
        <div className="mt-12 bg-white rounded-lg shadow-sm p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">สิ่งอำนวยความสะดวก</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {[
              { icon: Wifi, name: "Wi-Fi ฟรี" },
              { icon: Car, name: "ที่จอดรถ" },
              { icon: Coffee, name: "อาหารเช้า" },
              { icon: Tv, name: "ทีวี" },
              { icon: Wind, name: "เครื่องปรับอากาศ" }
            ].map((feature, index) => (
              <div key={index} className="text-center">
                <feature.icon className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <p className="text-sm text-gray-700 font-medium">{feature.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Hotel Contact Information */}
        {contactInfo && (
          <div className="mt-12 bg-white rounded-lg shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center flex items-center justify-center">
              <Phone className="mr-3 text-blue-600" size={28} />
              ติดต่อเรา
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <Phone className="text-green-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">โทรศัพท์</p>
                    <p className="text-lg font-semibold text-gray-800">{contactInfo.phone}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <Mail className="text-red-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">อีเมล</p>
                    <p className="text-lg font-semibold text-gray-800">{contactInfo.email}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    <MapPin className="text-purple-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">ที่อยู่</p>
                    <p className="text-lg font-semibold text-gray-800 leading-relaxed">{contactInfo.address}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                {contactInfo.website && (
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <Globe className="text-blue-600" size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">เว็บไซต์</p>
                      <a 
                        href={`https://${contactInfo.website}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-lg font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                      >
                        {contactInfo.website}
                      </a>
                    </div>
                  </div>
                )}
                {contactInfo.facebook && (
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <Facebook className="text-blue-700" size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Facebook</p>
                      <a 
                        href={`https://${contactInfo.facebook}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-lg font-semibold text-blue-700 hover:text-blue-900 hover:underline transition-colors"
                      >
                        {contactInfo.facebook}
                      </a>
                    </div>
                  </div>
                )}
                {contactInfo.line && (
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <MessageCircle className="text-green-500" size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">LINE ID</p>
                      <p className="text-lg font-semibold text-gray-800">{contactInfo.line}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
