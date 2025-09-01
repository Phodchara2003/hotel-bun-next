import axios from 'axios';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Create axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('auth_token');
    console.log('API Request:', config.url, 'Token:', token ? 'Present' : 'Missing');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      console.log('401 Unauthorized - Token expired or invalid');
      console.log('Error details:', error.response.data);
      
      // Don't auto-remove tokens - let user decide to logout manually
      // Only log the error for debugging
      console.log('Token may be expired, but keeping user logged in');
      
      // Show error message for admin routes only
      if (typeof window !== 'undefined') {
        console.log('Current path:', window.location.pathname);
        if (window.location.pathname.startsWith('/admin/')) {
          toast.error('Some operations may require re-authentication');
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  changePassword: async (passwordData) => {
    const response = await api.put('/auth/change-password', passwordData);
    return response.data;
  },
};

// Hotels API
export const hotelAPI = {
  getHotels: async (params = {}) => {
    const response = await api.get('/hotels', { params });
    return response.data;
  },
  
  getHotelById: async (id) => {
    const response = await api.get(`/hotels/${id}`);
    return response.data;
  },
  
  searchAvailability: async (searchParams) => {
    const response = await api.get('/hotels/search/availability', { params: searchParams });
    return response.data;
  },
};

// Bookings API
export const bookingAPI = {
  createBooking: async (bookingData) => {
    console.log('🔄 bookingAPI.createBooking called with:', bookingData);
    try {
      const response = await api.post('/bookings', bookingData);
      console.log('✅ bookingAPI.createBooking success:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ bookingAPI.createBooking error:', error);
      throw error;
    }
  },
  
  getBookings: async (params = {}) => {
    const response = await api.get('/bookings', { params });
    return response.data;
  },
  
  getBookingById: async (id) => {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  },
  
  // Admin get booking details with full access
  getAdminBookingById: async (id) => {
    const response = await api.get(`/bookings/admin/${id}`);
    return response.data;
  },
  
  cancelBooking: async (id) => {
    const response = await api.put(`/bookings/${id}/cancel`);
    return response.data;
  },

  // Admin APIs
  getAllBookings: async (params = {}) => {
    const response = await api.get('/bookings/admin/all', { params });
    return response.data;
  },

  confirmBooking: async (id) => {
    const response = await api.put(`/bookings/${id}/confirm`);
    return response.data;
  },

  adminCancelBooking: async (id) => {
    const response = await api.put(`/bookings/admin/${id}/cancel`);
    return response.data;
  },

  saveCustomerInfo: async (bookingId, customerInfo) => {
    const response = await api.put(`/bookings/${bookingId}/customer-info`, customerInfo);
    return response.data;
  },

  approveBooking: async (id) => {
    const response = await api.put(`/bookings/${id}/approve`);
    return response.data;
  },

  uploadPaymentReceipt: async (bookingId, receiptUrl) => {
    const response = await api.post(`/bookings/${bookingId}/payment-receipt`, {
      receiptUrl
    });
    return response.data;
  },

  // Delete booking (Admin only)
  deleteBooking: async (id) => {
    try {
      console.log('Attempting to delete booking:', id);
      const response = await api.delete(`/bookings/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete booking error:', error);
      throw error;
    }
  },

  // Check room availability
  getRoomAvailability: async (roomTypeId, startDate, endDate) => {
    const response = await api.get(`/bookings/availability/${roomTypeId}`, {
      params: { startDate, endDate }
    });
    return response.data;
  },
};

// Rooms Management API (Admin)
export const roomsAPI = {
  // Get all rooms (Admin)
  getAllRooms: async () => {
    const response = await api.get('/admin/rooms/');
    return response.data;
  },

  // Get single room (Admin)
  getRoom: async (id) => {
    const response = await api.get(`/admin/rooms/${id}`);
    return response.data;
  },

  // Create new room (Admin)
  createRoom: async (roomData) => {
    try {
      console.log('🏨 API: Creating room with data:', JSON.stringify(roomData, null, 2));
      const response = await api.post('/admin/rooms/', roomData);
      console.log('✅ API: Room created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ API: Error creating room:', error.response?.data || error.message);
      console.error('❌ API: Error status:', error.response?.status);
      console.error('❌ API: Error details:', error.response?.data?.details || 'No details');
      throw error;
    }
  },

  // Update room (Admin)
  updateRoom: async (id, roomData) => {
    const response = await api.put(`/admin/rooms/${id}`, roomData);
    return response.data;
  },

  // Delete room (Admin)
  deleteRoom: async (id) => {
    const response = await api.delete(`/admin/rooms/${id}`);
    return response.data;
  },

  // Toggle room availability (Admin)
  toggleAvailability: async (id) => {
    const response = await api.patch(`/admin/rooms/${id}/toggle-availability`);
    return response.data;
  },
};

// Users Management API (Admin)
export const usersAPI = {
  // Get all users (Admin)
  getAllUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  // Get single user (Admin)
  getUser: async (id) => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },

  // Create new user (Admin)
  createUser: async (userData) => {
    const response = await api.post('/admin/users', userData);
    return response.data;
  },

  // Update user (Admin)
  updateUser: async (id, userData) => {
    const response = await api.put(`/admin/users/${id}`, userData);
    return response.data;
  },

  // Delete user (Admin)
  deleteUser: async (id) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  // Toggle user role (Admin)
  toggleUserRole: async (id) => {
    const response = await api.patch(`/admin/users/${id}/toggle-role`);
    return response.data;
  },

  // Update user role (Admin)
  updateUserRole: async (id, role) => {
    const response = await api.put(`/admin/users/${id}/role`, { role });
    return response.data;
  },

  // Get user's bookings (Admin)
  getUserBookings: async (id, params = {}) => {
    const response = await api.get(`/admin/users/${id}/bookings`, { params });
    return response.data;
  },
};

// Notifications API
export const notificationAPI = {
  // Get user notifications
  getNotifications: async (params = {}) => {
    const response = await api.get('/notifications', { params });
    return response.data;
  },

  // Get unread count
  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  // Mark notification as read
  markAsRead: async (id) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },

  // Delete notification
  deleteNotification: async (id) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },

  // Admin: Send notification
  sendNotification: async (notificationData) => {
    const response = await api.post('/notifications/send', notificationData);
    return response.data;
  }
};

// Optimized API for reports
export const reportAPI = {
  // Get optimized reports data
  getReportsData: async (params = {}) => {
    try {
      console.log('Getting reports data with params:', params);
      const response = await api.get('/bookings/admin/reports', { params });
      console.log('Reports API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Reports API error:', error);
      throw error;
    }
  },

  // Get basic metrics only (fastest)
  getMetrics: async (params = {}) => {
    try {
      console.log('Getting metrics with params:', params);
      const response = await api.get('/bookings/admin/reports', { 
        params: { 
          ...params, 
          limit: 100 // Reduced limit for metrics
        }
      });
      console.log('Metrics API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Metrics API error:', error);
      throw error;
    }
  }
};

// Permission Management API
export const permissionsAPI = {
  // ดูสิทธิ์ทั้งหมด
  getAllPermissions: async () => {
    const response = await api.get('/admin/permissions/permissions');
    return response.data;
  },

  // ดูรายชื่อผู้ใช้พร้อมจำนวนสิทธิ์
  getUsersWithPermissions: async () => {
    const response = await api.get('/admin/permissions/users-with-permissions');
    return response.data;
  },

  // ดูสิทธิ์ของผู้ใช้คนหนึ่ง
  getUserPermissions: async (userId) => {
    const response = await api.get(`/admin/permissions/users/${userId}/permissions`);
    return response.data;
  },

  // อัปเดตสิทธิ์ของผู้ใช้
  updateUserPermissions: async (userId, permissionIds) => {
    const response = await api.put(`/admin/permissions/users/${userId}/permissions`, {
      permissionIds
    });
    return response.data;
  }
};

// ========================================
// 🏨 CHECK-IN/CHECK-OUT API
// ========================================
export const checkinAPI = {
  // ดูสถานะห้องทั้งหมด
  getRoomsStatus: async () => {
    const response = await api.get('/checkin/rooms/status');
    return response.data;
  },

  // ดูการจองที่พร้อม check-in วันนี้
  getPendingCheckins: async () => {
    const response = await api.get('/checkin/check-ins/pending');
    return response.data;
  },

  // ทำการ check-in
  checkIn: async (checkinData) => {
    const response = await api.post('/checkin/check-in', checkinData);
    return response.data;
  },

  // ดูการจองที่พร้อม check-out วันนี้
  getPendingCheckouts: async () => {
    const response = await api.get('/checkin/check-outs/pending');
    return response.data;
  },

  // ทำการ check-out
  checkOut: async (checkoutData) => {
    const response = await api.post('/checkin/check-out', checkoutData);
    return response.data;
  },

  // อัปเดตสถานะห้อง
  updateRoomStatus: async (roomId, statusData) => {
    const response = await api.put(`/checkin/rooms/${roomId}/status`, statusData);
    return response.data;
  }
};

// ========================================
// 🧹 HOUSEKEEPING API
// ========================================
export const housekeepingAPI = {
  // ดู housekeeping tasks
  getTasks: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/housekeeping/tasks?${params}`);
    return response.data;
  },

  // สร้าง housekeeping task ใหม่
  createTask: async (taskData) => {
    const response = await api.post('/housekeeping/tasks', taskData);
    return response.data;
  },

  // อัปเดต housekeeping task
  updateTask: async (taskId, taskData) => {
    const response = await api.put(`/housekeeping/tasks/${taskId}`, taskData);
    return response.data;
  },

  // ลบ housekeeping task
  deleteTask: async (taskId) => {
    const response = await api.delete(`/housekeeping/tasks/${taskId}`);
    return response.data;
  },

  // ดู room inspections
  getInspections: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/housekeeping/inspections?${params}`);
    return response.data;
  },

  // สร้าง room inspection ใหม่
  createInspection: async (inspectionData) => {
    const response = await api.post('/housekeeping/inspections', inspectionData);
    return response.data;
  },

  // อัปเดต room inspection
  updateInspection: async (inspectionId, inspectionData) => {
    const response = await api.put(`/housekeeping/inspections/${inspectionId}`, inspectionData);
    return response.data;
  },

  // ดูสถิติ housekeeping
  getStats: async (period = '7') => {
    const response = await api.get(`/housekeeping/stats?period=${period}`);
    return response.data;
  }
};

export default api;
