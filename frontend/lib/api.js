import axios from 'axios';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

// Create axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
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
      
      // Only remove tokens if the error specifically indicates invalid token
      if (error.response.data?.error?.includes('Invalid') || 
          error.response.data?.error?.includes('expired')) {
        console.log('Removing invalid/expired tokens');
        Cookies.remove('auth_token', { path: '/' });
        Cookies.remove('user_data', { path: '/' });
        
        // Show error message
        if (typeof window !== 'undefined') {
          console.log('Current path:', window.location.pathname);
          // Only show error for admin routes
          if (window.location.pathname.startsWith('/admin/')) {
            toast.error('Session expired. Please login again.');
          }
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
    const response = await api.post('/bookings', bookingData);
    return response.data;
  },
  
  getBookings: async (params = {}) => {
    const response = await api.get('/bookings', { params });
    return response.data;
  },
  
  getBookingById: async (id) => {
    const response = await api.get(`/bookings/${id}`);
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
    const response = await api.get('/admin/rooms');
    return response.data;
  },

  // Get single room (Admin)
  getRoom: async (id) => {
    const response = await api.get(`/admin/rooms/${id}`);
    return response.data;
  },

  // Create new room (Admin)
  createRoom: async (roomData) => {
    const response = await api.post('/admin/rooms', roomData);
    return response.data;
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

  // Get user's bookings (Admin)
  getUserBookings: async (id, params = {}) => {
    const response = await api.get(`/admin/users/${id}/bookings`, { params });
    return response.data;
  },
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

export default api;
