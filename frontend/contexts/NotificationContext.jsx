'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { notificationAPI } from '../lib/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const NotificationContext = createContext({});

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();

  // Fetch notifications (delayed for better initial load performance)
  const fetchNotifications = async (params = {}) => {
    if (!isAuthenticated || !user) return;
    
    try {
      setLoading(true);
      const response = await notificationAPI.getNotifications(params);
      setNotifications(response.notifications || []);
      setUnreadCount(response.summary?.unreadCount || 0);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      if (error.response?.status !== 401) {
        toast.error('ไม่สามารถโหลดการแจ้งเตือนได้');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch unread count only
  const fetchUnreadCount = async () => {
    if (!isAuthenticated || !user) return;
    
    try {
      const response = await notificationAPI.getUnreadCount();
      setUnreadCount(response.unreadCount || 0);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast.error('ไม่สามารถอัปเดตการแจ้งเตือนได้');
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      setUnreadCount(0);
      
      toast.success('อ่านการแจ้งเตือนทั้งหมดแล้ว');
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      toast.error('ไม่สามารถอัปเดตการแจ้งเตือนได้');
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      await notificationAPI.deleteNotification(notificationId);
      
      // Update local state
      const notification = notifications.find(notif => notif.id === notificationId);
      setNotifications(prev => 
        prev.filter(notif => notif.id !== notificationId)
      );
      
      // Update unread count if deleted notification was unread
      if (notification && !notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      toast.success('ลบการแจ้งเตือนแล้ว');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('ไม่สามารถลบการแจ้งเตือนได้');
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'booking_confirmed':
        return '✅';
      case 'booking_cancelled':
        return '❌';
      case 'booking_approved':
        return '🎉';
      case 'payment_reminder':
        return '💰';
      case 'check_in_reminder':
        return '🏨';
      default:
        return '📱';
    }
  };

  // Get notification color based on type
  const getNotificationColor = (type) => {
    switch (type) {
      case 'booking_confirmed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'booking_cancelled':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'booking_approved':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'payment_reminder':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'check_in_reminder':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Format time ago function
  const formatTimeAgo = (dateString, language = 'th') => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (language === 'en') {
      if (diffInSeconds < 60) {
        return 'Just now';
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
      } else if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} day${days > 1 ? 's' : ''} ago`;
      } else {
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
    } else {
      if (diffInSeconds < 60) {
        return 'เมื่อสักครู่';
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} นาทีที่แล้ว`;
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} ชั่วโมงที่แล้ว`;
      } else if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} วันที่แล้ว`;
      } else {
        return date.toLocaleDateString('th-TH', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
    }
  };

  // Auto fetch when user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications();
      
      // Set up polling for unread count every 30 seconds
      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 30000);
      
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const value = {
    // State
    notifications,
    unreadCount,
    loading,
    
    // Actions
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    
    // Helpers
    getNotificationIcon,
    getNotificationColor,
    formatTimeAgo,
    
    // Computed
    hasUnread: unreadCount > 0,
    isEmpty: notifications.length === 0
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
