import axios from 'axios';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import performanceMonitor from './performanceMonitor';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Create axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000, // 30 second timeout (increased from 10s)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and track performance
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('auth_token');
    
    // Track API call start
    performanceMonitor.startApiCall(config.url, config.method?.toUpperCase());
    
    // Reduce console logging in production
    if (process.env.NODE_ENV === 'development') {
      console.log('API Request:', config.url, 'Token:', token ? 'Present' : 'Missing');
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      
      // Check if token is about to expire (only in development)
      if (process.env.NODE_ENV === 'development') {
        try {
          const tokenPayload = JSON.parse(atob(token.split('.')[1]));
          const currentTime = Math.floor(Date.now() / 1000);
          const timeUntilExpiry = tokenPayload.exp - currentTime;
          
          // If token expires in less than 5 minutes, log warning
          if (timeUntilExpiry < 300) {
            console.warn('Token expires soon:', timeUntilExpiry, 'seconds remaining');
          }
        } catch (error) {
          console.log('Could not parse token payload:', error);
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and track performance
api.interceptors.response.use(
  (response) => {
    // Track API call completion
    performanceMonitor.endApiCall(response.config.url, response.config.method?.toUpperCase(), true);
    
    // Log successful responses only in development
    if (process.env.NODE_ENV === 'development') {
      console.log('API Response:', response.config.url, response.status);
    }
    return response;
  },
  (error) => {
    console.error('API Error:', error.config?.url, error.response?.status, error.message);
    
    // Handle timeout errors
    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      console.log('Request timeout - consider retrying...');
      const isLoginEndpoint = error.config?.url?.includes('/auth/login');
      if (!isLoginEndpoint) {
        toast.error('การเชื่อมต่อใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง');
      }
      return Promise.reject(new Error('การเชื่อมต่อใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง'));
    }
    
    // Handle network errors
    if (!error.response) {
      console.log('Network error - server may be down');
      const isLoginEndpoint = error.config?.url?.includes('/auth/login');
      if (!isLoginEndpoint) {
        toast.error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
      }
      return Promise.reject(new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต'));
    }
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      console.log('401 Unauthorized - Token issue detected');
      console.log('Error details:', error.response.data);
      
      // สำหรับ login endpoint ไม่ต้องแสดง toast error เพราะจะจัดการที่ login function
      const isLoginEndpoint = error.config?.url?.includes('/auth/login');
      
      if (!isLoginEndpoint) {
        const currentToken = Cookies.get('auth_token');
        if (currentToken) {
          try {
            const tokenPayload = JSON.parse(atob(currentToken.split('.')[1]));
            const currentTime = Math.floor(Date.now() / 1000);
            
            if (tokenPayload.exp < currentTime) {
              console.log('Token has expired');
              toast.error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
              
              // Clear expired token and redirect to login
              Cookies.remove('auth_token');
              if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin/')) {
                window.location.href = '/auth/login';
              }
            } else {
              console.log('Token is still valid but server rejected it');
              toast.error('ข้อมูลการยืนยันตัวตนไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่');
            }
          } catch (tokenError) {
            console.log('Could not parse token:', tokenError);
            toast.error('ข้อมูลการยืนยันตัวตนไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่');
            Cookies.remove('auth_token');
          }
        } else {
          console.log('No token found');
          if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin/')) {
            toast.error('กرุณาเข้าสู่ระบบเพื่อใช้งานในส่วนนี้');
            window.location.href = '/auth/login';
          }
        }
      }
    }
    
    // Handle server errors
    if (error.response?.status >= 500) {
      console.log('Server error:', error.response.status);
      
      // Only show toast for specific critical errors, not for quota/database issues
      const isQuotaError = error.message?.includes('quota') || 
                          error.response?.data?.message?.includes('quota');
      const isNotificationError = error.config?.url?.includes('/notifications');
      const isHotelError = error.config?.url?.includes('/hotels');
      const isLoginEndpoint = error.config?.url?.includes('/auth/login');
      
      if (!isQuotaError && !isNotificationError && !isHotelError && !isLoginEndpoint) {
        toast.error('เซิร์ฟเวอร์ขัดข้อง กรุณาลองใหม่ในภายหลัง');
      }
    }
    
    return Promise.reject(error);
  }
);

// Retry wrapper for API calls
const retryRequest = async (requestFn, maxRetries = 2, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      console.log(`API request attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying
      if (error.code === 'ECONNABORTED' || !error.response) {
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      } else {
        // Don't retry for non-timeout errors
        throw error;
      }
    }
  }
};

// Auth API
export const authAPI = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      // แปลง error ให้เป็นข้อความที่เข้าใจง่าย
      if (error.response?.status === 401) {
        throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง');
      } else if (error.response?.status === 404) {
        throw new Error('ไม่พบบัญชีผู้ใช้นี้ในระบบ');
      } else if (error.response?.status === 429) {
        throw new Error('พยายามเข้าสู่ระบบหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่');
      } else if (error.response?.status >= 500) {
        throw new Error('เซิร์ฟเวอร์ขัดข้อง กรุณาลองใหม่ในภายหลัง');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('การเชื่อมต่อใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง');
      } else if (!error.response) {
        throw new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
      } else {
        // ใช้ข้อความจาก server หากมี หรือใช้ข้อความทั่วไป
        const errorMessage = error.response?.data?.message || 
                            error.response?.data?.error || 
                            'เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง';
        throw new Error(errorMessage);
      }
    }
  },

  changePassword: async (passwordData) => {
    const response = await api.post('/profile/password', passwordData);
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

  // Get hotel info และ room types ในครั้งเดียว
  getHotelAndRoomTypes: async () => {
    try {
      console.log('🏨 [API] Fetching hotel and room types from database...');
      
      // ดึงข้อมูลโรงแรมแรก
      console.log('🏨 [API] Calling /hotels endpoint...');
      const hotelsResponse = await api.get('/hotels', { params: { limit: 1 } });
      console.log('🏨 [API] Hotels response received:', hotelsResponse.data);
      
      // ดึงข้อมูล room types พร้อมรูปภาพจาก database โดยตรง
      console.log('🏠 [API] Calling /room-types-with-images endpoint...');
      const roomTypesResponse = await api.get('/room-types-with-images');
      console.log('🏠 [API] Room types response received:', roomTypesResponse.data);
      
      const hotel = hotelsResponse.data?.data?.[0] || null;
      const roomTypes = roomTypesResponse.data?.data || [];
      
      console.log('🏨 [API] Processed hotel:', hotel);
      console.log('🏠 [API] Processed room types:', roomTypes);
      
      return {
        success: true,
        data: {
          hotel: hotel,
          roomTypes: roomTypes
        }
      };
    } catch (error) {
      console.error('❌ [API] Error fetching hotel and room types:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Get hotel info (ใช้ hotel แรก ถ้ามีหลายโรงแรม)
  getHotelInfo: async () => {
    try {
      const response = await api.get('/hotels', { params: { limit: 1 } });
      if (response.data && response.data.hotels && response.data.hotels.length > 0) {
        return {
          success: true,
          data: response.data.hotels[0]
        };
      } else {
        return {
          success: false,
          error: 'No hotel found'
        };
      }
    } catch (error) {
      console.error('Error fetching hotel info:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Get room types (ใช้ hotel ID แรกแล้วดึง room types จาก hotel details)
  getRoomTypes: async () => {
    try {
      // ดึงโรงแรมแรกเพื่อเอา ID
      const hotelsResponse = await api.get('/hotels', { params: { limit: 1 } });
      
      if (hotelsResponse.data && hotelsResponse.data.hotels && hotelsResponse.data.hotels.length > 0) {
        const hotelId = hotelsResponse.data.hotels[0].id;
        
        // ดึงรายละเอียดโรงแรมที่มี room types
        const hotelResponse = await api.get(`/hotels/${hotelId}`);
        
        if (hotelResponse.data && hotelResponse.data.roomTypes) {
          return {
            success: true,
            data: hotelResponse.data.roomTypes
          };
        }
      }
      
      return {
        success: false,
        error: 'No room types found'
      };
    } catch (error) {
      console.error('Error fetching room types:', error);
      return {
        success: false,
        error: error.message
      };
    }
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
  getAdminBookings: async (params = {}) => {
    return retryRequest(async () => {
      console.log('📞 Fetching admin bookings with params:', params);
      const response = await api.get('/admin/bookings/detailed', { params });
      console.log('✅ Get admin bookings response:', response.data);
      
      // Handle backend response format: {success: true, count: number, data: [...]}
      if (response.data.success && response.data.data) {
        return {
          success: true,
          bookings: response.data.data,
          total: response.data.count || response.data.data.length
        };
      } else if (response.data.bookings) {
        return {
          success: true,
          bookings: response.data.bookings,
          pagination: response.data.pagination,
          total: response.data.pagination?.total || response.data.bookings.length
        };
      } else if (Array.isArray(response.data)) {
        return {
          success: true,
          bookings: response.data,
          total: response.data.length
        };
      } else {
        return {
          success: true,
          bookings: response.data.data || [],
          total: response.data.total || 0
        };
      }
    });
  },

  getAllBookings: async (params = {}) => {
    return retryRequest(async () => {
      console.log('📞 Fetching all bookings with params:', params);
      const response = await api.get('/bookings', { params });
      console.log('✅ Get all bookings response:', response.data);
      
      // Handle backend response format: {success: true, count: number, data: [...]}
      if (response.data.success && response.data.data) {
        return {
          success: true,
          bookings: response.data.data,
          total: response.data.count || response.data.data.length
        };
      } else if (response.data.bookings) {
        return {
          success: true,
          bookings: response.data.bookings,
          pagination: response.data.pagination,
          total: response.data.pagination?.total || response.data.bookings.length
        };
      } else if (Array.isArray(response.data)) {
        return {
          success: true,
          bookings: response.data,
          total: response.data.length
        };
      } else {
        return {
          success: true,
          bookings: response.data.data || [],
          total: response.data.total || 0
        };
      }
    });
  },

  // Get detailed bookings for admin (includes payment slips, full room/hotel details)
  getDetailedBookingsForAdmin: async (params = {}) => {
    return retryRequest(async () => {
      console.log('📞 Fetching detailed bookings for admin with params:', params);
      const response = await api.get('/admin/bookings/detailed', { params });
      console.log('✅ Get detailed bookings response:', response.data);
      
      // Handle backend response format: {success: true, count: number, data: bookings[]}
      if (response.data.success && response.data.data) {
        return {
          success: true,
          data: response.data.data,
          total: response.data.count || response.data.data.length
        };
      } else {
        return {
          success: true,
          data: response.data.data || [],
          total: response.data.total || 0
        };
      }
    });
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

  // Update booking status (Admin)
  updateStatus: async (id, status) => {
    console.log('📞 Updating booking status:', { id, status });
    try {
      const response = await api.put(`/bookings/${id}/status`, { status });
      console.log('✅ Update booking status response:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Update booking status error:', error);
      throw error;
    }
  },

  // Delete booking (Admin only)
  delete: async (id) => {
    try {
      console.log('📞 Attempting to delete booking:', id);
      const response = await api.delete(`/bookings/${id}`);
      console.log('✅ Delete booking response:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Delete booking error:', error);
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
    return retryRequest(async () => {
      const response = await api.get('/admin/rooms/');
      return response.data;
    });
  },

  // Get single room (Admin)
  getRoom: async (id) => {
    const response = await api.get(`/admin/rooms/${id}`);
    return response.data;
  },

  // Get single room by ID (Admin) - alias for getRoom
  getRoomById: async (id) => {
    const response = await api.get(`/admin/rooms/${id}`);
    return response.data;
  },

  // Create new room (Admin)
  createRoom: async (roomData) => {
    try {
      // Map frontend data to backend format
      const mappedData = {
        hotel_id: 1, // Default hotel ID - you might want to make this configurable
        name: roomData.name,
        description: roomData.description || '',
        price_per_night: parseFloat(roomData.price) || 1500,
        max_guests: parseInt(roomData.capacity) || 2,
        size_sqm: roomData.size ? parseFloat(roomData.size) : null,
        bed_type: roomData.bed_type || 'double',
        amenities: Array.isArray(roomData.amenities) ? roomData.amenities : (roomData.amenities ? [roomData.amenities] : []),
        images: Array.isArray(roomData.images) ? roomData.images : []
      };
      
      console.log('🏨 API: Creating room with data:', JSON.stringify(mappedData, null, 2));
      const response = await api.post('/admin/rooms/', mappedData);
      console.log('✅ API: Room created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ API: Error creating room:', error.response?.data || error.message);
      console.error('❌ API: Full error response:', error.response);
      console.error('❌ API: Error status:', error.response?.status);
      console.error('❌ API: Error details:', error.response?.data || 'No details');
      
      // Return the actual error from backend
      if (error.response?.data) {
        throw new Error(error.response.data.message || error.response.data.error || error.message);
      }
      throw error;
    }
  },

  // Update room (Admin)
  updateRoom: async (id, roomData) => {
    try {
      // For update, preserve the existing hotel_id from the room data
      // Don't force hotel_id to 1 when updating
      // Only send fields that exist in room_types table
      const mappedData = {
        // Only set hotel_id if it's provided, otherwise let backend handle it
        ...(roomData.hotel_id && { hotel_id: roomData.hotel_id }),
        name: roomData.name,
        description: roomData.description || '',
        price_per_night: parseFloat(roomData.price) || 1500,
        max_guests: parseInt(roomData.capacity) || 2,
        size_sqm: roomData.size ? parseInt(roomData.size) : null, // Changed to int to match schema
        type: roomData.type || 'standard',
        amenities: Array.isArray(roomData.amenities) ? roomData.amenities : (roomData.amenities ? [roomData.amenities] : []),
        // Only include images if explicitly provided AND not empty, otherwise let backend preserve existing images
        ...(roomData.images !== undefined && Array.isArray(roomData.images) && roomData.images.length > 0 && { images: roomData.images })
        // Removed: bed_type (not in schema)
        // Note: status, floor, number, bed_type, view_type are not in room_types table
      };

      console.log('🔧 API: Updating room ID:', id);
      console.log('🔧 API: Original room data:', roomData);
      console.log('🔧 API: Mapped room data:', mappedData);
      console.log('🔧 API: Images field:', roomData.images, '→', mappedData.images);
      const response = await api.put(`/admin/rooms/${id}`, mappedData);
      console.log('🔧 API: Update response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ API: Update room error:', error);
      console.error('❌ API: Error response:', error.response?.data);
      
      // Return the actual error from backend
      if (error.response?.data) {
        throw new Error(error.response.data.message || error.response.data.error || error.message);
      }
      throw error;
    }
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

  // Upload room images (Admin) - ใช้ axios instance แทน fetch
  uploadImages: async (roomId, files) => {
    try {
      console.log('📸 API: Uploading images for room:', roomId);
      console.log('📸 API: Files count:', files.length);
      console.log('📸 API: Files details:', files.map(f => ({ name: f.name, size: f.size, type: f.type })));
      
      const formData = new FormData();
      files.forEach((file, index) => {
        console.log(`📸 API: Appending file ${index + 1}:`, file.name);
        formData.append('roomImages', file);
      });

      console.log('📸 API: Making request with axios...');
      const response = await api.post(`/admin/rooms/${roomId}/upload-images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('📸 API: Upload response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ API: Upload images error:', error);
      console.error('❌ API: Error response:', error.response?.data);
      console.error('❌ API: Error status:', error.response?.status);
      throw error;
    }
  },

  // Delete room image (Admin) - ใช้ axios instance แทน fetch
  deleteImage: async (roomId, filename) => {
    try {
      console.log('🗑️ API: Deleting image:', filename, 'from room:', roomId);
      
      const response = await api.delete(`/admin/rooms/${roomId}/delete-image`, {
        data: { filename }
      });

      console.log('🗑️ API: Delete response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ API: Delete image error:', error);
      console.error('❌ API: Error response:', error.response?.data);
      throw error;
    }
  },

  // Get room images (Admin) - API ใหม่
  getRoomImages: async (roomId) => {
    try {
      console.log('🖼️ API: Getting images for room:', roomId);
      
      const response = await api.get(`/admin/rooms`);

      const result = response.data;
      console.log('�️ API: Get images response:', result);
      // ค้นหาห้องที่ต้องการและคืน images
      const room = result.data?.find(r => r.id === parseInt(roomId));
      return { success: true, images: room?.images || [] };
    } catch (error) {
      console.error('❌ API: Get images error:', error);
      throw error;
    }
  },
};

// Users Management API (Admin)
export const usersAPI = {
  // Get all users (Admin) - Alias for getAllUsers
  getUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

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

  // Update current user's profile
  updateProfile: async (profileData) => {
    const response = await api.put('/users/profile', profileData);
    return response.data;
  },

  // Get current user's profile
  getProfile: async () => {
    const response = await api.get('/users/profile');
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

  // Check room availability
  checkAvailability: async (roomTypeId, checkIn, checkOut) => {
    const response = await api.get(`/rooms/availability?room_type_id=${roomTypeId}&check_in=${checkIn}&check_out=${checkOut}`);
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

// User Management API (Admin)
export const userAPI = {
  // Get all users (Admin)
  getAll: async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  // Get user by ID (Admin)
  getById: async (id) => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },

  // Create new user (Admin)
  create: async (userData) => {
    const response = await api.post('/admin/users', userData);
    return response.data;
  },

  // Update user (Admin)
  update: async (id, userData) => {
    const response = await api.put(`/admin/users/${id}`, userData);
    return response.data;
  },

  // Delete user (Admin)
  delete: async (id) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  // Update user status (Admin)
  updateStatus: async (id, status) => {
    const response = await api.put(`/admin/users/${id}/status`, { status });
    return response.data;
  },

  // Get user statistics (Admin)
  getStats: async () => {
    const response = await api.get('/admin/users/stats');
    return response.data;
  }
};

// Dashboard API with enhanced error handling
export const dashboardAPI = {
  // Get comprehensive dashboard stats with retry logic
  getStats: async (params = {}) => {
    try {
      console.log('🚀 Fetching dashboard stats...', params);
      const response = await retryRequest(() => 
        api.get('/admin/dashboard/stats', { params }), 3, 1000
      );
      console.log('✅ Dashboard stats fetched successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch dashboard stats:', error);
      // Return fallback data if API fails
      if (error.response?.status >= 500 || !error.response) {
        console.log('Returning fallback dashboard data');
        return {
          stats: {
            totalBookings: 0,
            pendingBookings: 0,
            confirmedBookings: 0,
            completedBookings: 0,
            cancelledBookings: 0,
            totalUsers: 0,
            newUsersThisMonth: 0,
            activeUsers: 0,
            staffUsers: 0,
            adminUsers: 0,
            totalRevenue: 0,
            monthlyRevenue: 0,
            revenueGrowth: 0,
            totalHotels: 0,
            totalRooms: 0,
            occupancyRate: 0,
            totalReviews: 0,
            averageRating: 0,
          },
          recentBookings: [],
          topHotels: [],
          bookingTrends: []
        };
      }
      throw error;
    }
  },

  // Get revenue analytics with fallback
  getRevenueAnalytics: async (params = {}) => {
    try {
      console.log('🚀 Fetching revenue analytics...', params);
      const response = await retryRequest(() => 
        api.get('/admin/dashboard/revenue', { params }), 2, 1000
      );
      console.log('✅ Revenue analytics fetched successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch revenue analytics:', error);
      // Return fallback data
      return {
        daily: [],
        monthly: [],
        yearly: []
      };
    }
  },

  // Get user analytics with fallback  
  getUserAnalytics: async (params = {}) => {
    try {
      console.log('🚀 Fetching user analytics...', params);
      const response = await retryRequest(() => 
        api.get('/admin/dashboard/users-analytics', { params }), 2, 1000
      );
      console.log('✅ User analytics fetched successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch user analytics:', error);
      return {
        registrations: [],
        activeUsers: 0,
        totalUsers: 0
      };
    }
  },

  // Get hotel performance with fallback
  getHotelPerformance: async (params = {}) => {
    try {
      console.log('🚀 Fetching hotel performance...', params);
      const response = await retryRequest(() => 
        api.get('/admin/dashboard/hotels-performance', { params }), 2, 1000
      );
      console.log('✅ Hotel performance fetched successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch hotel performance:', error);
      return [];
    }
  }
};

// Reports API
export const reportsAPI = {
  // Get revenue report
  getRevenueReport: async (params = {}) => {
    const response = await api.get('/admin/reports/revenue', { params });
    return response.data;
  },

  // Get booking report
  getBookingReport: async (params = {}) => {
    const response = await api.get('/admin/reports/bookings', { params });
    return response.data;
  },

  // Get user report
  getUserReport: async (params = {}) => {
    const response = await api.get('/admin/reports/users', { params });
    return response.data;
  },

  // Get hotel report
  getHotelReport: async (params = {}) => {
    const response = await api.get('/admin/reports/hotels', { params });
    return response.data;
  }
};

// Hotels API (extended)
export const hotelsAPI = {
  // Get all hotels
  getHotels: async (params = {}) => {
    const response = await api.get('/hotels', { params });
    return response.data;
  },

  // Get hotel by ID
  getHotel: async (id) => {
    const response = await api.get(`/hotels/${id}`);
    return response.data;
  },

  // Create hotel (Admin)
  createHotel: async (hotelData) => {
    const response = await api.post('/admin/hotels', hotelData);
    return response.data;
  },

  // Update hotel (Admin)
  updateHotel: async (id, hotelData) => {
    const response = await api.put(`/admin/hotels/${id}`, hotelData);
    return response.data;
  },

  // Delete hotel (Admin)
  deleteHotel: async (id) => {
    const response = await api.delete(`/admin/hotels/${id}`);
    return response.data;
  },

  // Get hotel statistics (Admin)
  getHotelStats: async (params = {}) => {
    const response = await api.get('/admin/hotels/stats', { params });
    return response.data;
  }
};

export default api;
