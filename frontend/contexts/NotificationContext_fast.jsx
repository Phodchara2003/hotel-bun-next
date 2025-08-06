'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Initialize with cached data immediately
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const cachedNotifications = localStorage.getItem('notifications');
        const cachedUnreadCount = localStorage.getItem('unreadCount');
        
        if (cachedNotifications) {
          const parsed = JSON.parse(cachedNotifications);
          setNotifications(parsed);
        }
        
        if (cachedUnreadCount) {
          setUnreadCount(parseInt(cachedUnreadCount, 10));
        }
      } catch (error) {
        console.warn('Error loading cached notifications:', error);
      }
    }
    setInitialized(true);
  }, []);

  // Delayed background loading
  useEffect(() => {
    if (!initialized || !isAuthenticated || !user) {
      if (!isAuthenticated) {
        // Clear data if not authenticated
        setNotifications([]);
        setUnreadCount(0);
        setLoading(false);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('notifications');
          localStorage.removeItem('unreadCount');
        }
      }
      return;
    }

    // Delay the initial fetch to not block page load
    const delayedInit = setTimeout(() => {
      fetchUnreadCount();
      // Only fetch full notifications if user is likely to need them
      const shouldFetchNotifications = window.location.pathname.includes('/notifications') ||
                                     window.location.pathname.includes('/admin');
      
      if (shouldFetchNotifications) {
        fetchNotifications();
      }
    }, 1000); // 1 second delay

    // Set up polling interval for updates
    const interval = setInterval(() => {
      fetchUnreadCount();
      // Only refresh full notifications if user is on relevant pages
      if (window.location.pathname.includes('/notifications') ||
          window.location.pathname.includes('/admin')) {
        fetchNotifications();
      }
    }, 30000); // 30 seconds

    return () => {
      clearTimeout(delayedInit);
      clearInterval(interval);
    };
  }, [initialized, isAuthenticated, user]);

  const fetchNotifications = async () => {
    if (!isAuthenticated || !user?.id) return;
    
    try {
      setLoading(true);
      const response = await api.get('/api/notifications');
      if (response.data) {
        setNotifications(response.data);
        // Cache the data
        if (typeof window !== 'undefined') {
          localStorage.setItem('notifications', JSON.stringify(response.data));
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // On error, keep cached data if available
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    if (!isAuthenticated || !user?.id) return;
    
    try {
      const response = await api.get('/api/notifications/unread-count');
      if (response.data !== undefined) {
        const count = response.data.count || response.data;
        setUnreadCount(count);
        // Cache the count
        if (typeof window !== 'undefined') {
          localStorage.setItem('unreadCount', count.toString());
        }
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
      // On error, keep cached count if available
    }
  };

  const markAsRead = async (notificationId) => {
    if (!isAuthenticated) return;
    
    try {
      await api.put(`/api/notifications/${notificationId}/read`);
      
      // Update local state immediately for better UX
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Update cache
      if (typeof window !== 'undefined') {
        const updatedNotifications = notifications.map(notif => 
          notif.id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        );
        localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
        localStorage.setItem('unreadCount', Math.max(0, unreadCount - 1).toString());
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!isAuthenticated) return;
    
    try {
      await api.put('/api/notifications/mark-all-read');
      
      // Update local state immediately
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      setUnreadCount(0);
      
      // Update cache
      if (typeof window !== 'undefined') {
        const updatedNotifications = notifications.map(notif => ({ ...notif, isRead: true }));
        localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
        localStorage.setItem('unreadCount', '0');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    if (!isAuthenticated) return;
    
    try {
      await api.delete(`/api/notifications/${notificationId}`);
      
      // Update local state immediately
      const deletedNotification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => 
        prev.filter(notif => notif.id !== notificationId)
      );
      
      // Update unread count if the deleted notification was unread
      if (deletedNotification && !deletedNotification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      // Update cache
      if (typeof window !== 'undefined') {
        const updatedNotifications = notifications.filter(notif => notif.id !== notificationId);
        localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
        const newUnreadCount = deletedNotification && !deletedNotification.isRead 
          ? Math.max(0, unreadCount - 1) 
          : unreadCount;
        localStorage.setItem('unreadCount', newUnreadCount.toString());
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'booking':
        return '📅';
      case 'payment':
        return '💰';
      case 'system':
        return '⚙️';
      case 'promotion':
        return '🎉';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'booking':
        return 'text-blue-600';
      case 'payment':
        return 'text-green-600';
      case 'system':
        return 'text-gray-600';
      case 'promotion':
        return 'text-purple-600';
      default:
        return 'text-blue-600';
    }
  };

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
    getNotificationColor
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
