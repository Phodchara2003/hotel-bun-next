'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { authAPI } from '../lib/api';
import toast from 'react-hot-toast';
import { useLanguage } from './LanguageContext';
import { useTranslation } from '../translations';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) {
      checkAuth();
      setInitialized(true);
    }
  }, [initialized]);

  // Listen for storage changes (sync between tabs)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleStorageChange = (e) => {
        if (e.key === 'user_data' && e.newValue) {
          try {
            const userData = JSON.parse(e.newValue);
            console.log('👥 User data updated from another tab, syncing');
            setUser(userData);
          } catch (error) {
            console.log('❌ Error parsing user data from storage event');
          }
        }
        
        // Handle token changes
        if (e.key === 'auth_token') {
          if (!e.newValue) {
            console.log('👥 Token removed in another tab, logging out');
            setUser(null);
          }
        }
      };

      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, []);

  // Optimized token monitoring - reduce frequency
  useEffect(() => {
    if (!user) return;

    const tokenMonitorInterval = setInterval(() => {
      const token = Cookies.get('auth_token');
      
      if (!token) {
        console.log('🚨 Token missing, logging out');
        logout();
        return;
      }

      const tokenPayload = parseJWT(token);
      if (!tokenPayload) {
        console.log('🚨 Invalid token detected, logging out');
        logout();
        return;
      }

      if (isTokenExpired(tokenPayload)) {
        console.log('🚨 Token expired, logging out');
        toast.error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
        logout();
        return;
      }

      const timeRemaining = getTokenTimeRemaining(tokenPayload);
      
      // Log token status less frequently
      if (timeRemaining % 600 === 0) { // Every 10 minutes
        console.log('🕒 Token status:', Math.floor(timeRemaining / 60), 'minutes remaining');
      }
      
    }, 300000); // Check every 5 minutes instead of 1 minute

    return () => clearInterval(tokenMonitorInterval);
  }, [user]);

  const checkAuth = async () => {
    try {
      let token = Cookies.get('auth_token');
      let userData = Cookies.get('user_data');
      
      // Reduce console logging for production
      if (process.env.NODE_ENV === 'development') {
        console.log('🔐 Auth check - Token:', token ? 'Present' : 'Missing');
        console.log('🔐 Auth check - UserData:', userData ? 'Present' : 'Missing');
      }
      
      if (token && userData) {
        try {
          // Validate token format
          if (!isValidJWT(token)) {
            console.log('❌ Invalid token format, clearing auth');
            clearAuthData();
            setUser(null);
            setLoading(false);
            return;
          }

          // Check token expiration
          const tokenPayload = parseJWT(token);
          if (tokenPayload && isTokenExpired(tokenPayload)) {
            console.log('❌ Token expired, clearing auth');
            toast.warning('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
            clearAuthData();
            setUser(null);
            setLoading(false);
            return;
          }

          const user = JSON.parse(userData);
          console.log('✅ User data loaded:', user);
          
          // Validate that the user object has required fields
          if (user && user.id && user.email && user.role) {
            setUser(user);
            console.log('✅ User authenticated:', user.email, user.role);
            
            // Set up token refresh if needed
            scheduleTokenRefresh(tokenPayload);
          } else {
            console.log('❌ Invalid user data, clearing auth');
            clearAuthData();
            setUser(null);
          }
          
        } catch (error) {
          console.error('❌ Error parsing cached user data:', error);
          clearAuthData();
          setUser(null);
        }
      } else {
        console.log('ℹ️ No cached auth data found');
        setUser(null);
      }
    } catch (error) {
      console.error('❌ Auth check error:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // JWT validation functions
  const isValidJWT = (token) => {
    if (!token || typeof token !== 'string') return false;
    const parts = token.split('.');
    return parts.length === 3;
  };

  const parseJWT = (token) => {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch (error) {
      console.error('Error parsing JWT:', error);
      return null;
    }
  };

  const isTokenExpired = (payload) => {
    if (!payload.exp) return true;
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  };

  const getTokenTimeRemaining = (payload) => {
    if (!payload.exp) return 0;
    const currentTime = Math.floor(Date.now() / 1000);
    return Math.max(0, payload.exp - currentTime);
  };

  const scheduleTokenRefresh = (payload) => {
    const timeRemaining = getTokenTimeRemaining(payload);
    
    // Warn when 10 minutes remaining
    if (timeRemaining > 600) {
      setTimeout(() => {
        toast.warning('เซสชันจะหมดอายุในอีก 10 นาที');
      }, (timeRemaining - 600) * 1000);
    }
    
    // Final warning at 5 minutes
    if (timeRemaining > 300) {
      setTimeout(() => {
        toast.error('เซสชันจะหมดอายุในอีก 5 นาที กรุณาเซฟงานของคุณ');
      }, (timeRemaining - 300) * 1000);
    }
  };

  const clearAuthData = () => {
    console.log('🧹 Clearing all auth data...');
    
    // Clear cookies
    Cookies.remove('auth_token', { path: '/' });
    Cookies.remove('user_data', { path: '/' });
    
    // Clear sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('user_data');
      sessionStorage.removeItem('token_stored_at');
      sessionStorage.removeItem('token_expires_at');
    }
    
    // Clear localStorage if any auth data is stored there
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      localStorage.removeItem('remember_me');
    }
    
    console.log('✅ Auth data cleared completely');
  };

  const updateStoredUserData = (userData, token) => {
    const userDataString = JSON.stringify(userData);
    
    // Parse token to get expiration
    const tokenPayload = parseJWT(token);
    const expiresInDays = tokenPayload ? 
      Math.min(7, Math.ceil(getTokenTimeRemaining(tokenPayload) / (24 * 60 * 60))) : 7;
    
    console.log('💾 Storing user data with expiration:', expiresInDays, 'days');
    
    // Store in cookies with appropriate expiration
    Cookies.set('user_data', userDataString, { 
      expires: expiresInDays,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    // Store token with same expiration
    Cookies.set('auth_token', token, { 
      expires: expiresInDays,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      httpOnly: false // Must be false for client-side access
    });
    
    // Also store in sessionStorage as backup
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('user_data', userDataString);
      sessionStorage.setItem('auth_token', token);
      sessionStorage.setItem('token_stored_at', Date.now().toString());
      
      // Store token metadata
      if (tokenPayload) {
        sessionStorage.setItem('token_expires_at', (tokenPayload.exp * 1000).toString());
      }
    }
    
    console.log('✅ Auth data stored successfully');
  };

  const login = async (credentials) => {
    try {
      setLoading(true);
      console.log('🔐 Attempting login...');
      
      const response = await authAPI.login(credentials);
      
      if (response.token && response.user) {
        const token = response.token;
        const userData = response.user;
        
        console.log('✅ Login API successful');
        
        // Validate token before storing
        if (!isValidJWT(token)) {
          throw new Error('Received invalid token format');
        }
        
        const tokenPayload = parseJWT(token);
        if (!tokenPayload) {
          throw new Error('Cannot parse token payload');
        }
        
        if (isTokenExpired(tokenPayload)) {
          throw new Error('Received expired token');
        }
        
        console.log('✅ Token validation passed');
        console.log('🕒 Token expires at:', new Date(tokenPayload.exp * 1000));
        
        // Store auth data with enhanced metadata
        updateStoredUserData(userData, token);
        setUser(userData);
        
        // Set up token monitoring
        scheduleTokenRefresh(tokenPayload);
        
        console.log('✅ Login successful:', userData.email, userData.role);
        toast.success(`ยินดีต้อนรับ ${userData.first_name || userData.email}!`);
        
        return { success: true, user: userData, token };
      } else {
        throw new Error('Invalid response format - missing token or user data');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      const message = error.response?.data?.error || error.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
      toast.error(message);
      
      // Clear any partial auth data
      clearAuthData();
      
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await authAPI.register(userData);
      
      if (response.token && response.user) {
        const token = response.token;
        const user = response.user;
        
        // Store auth data
        Cookies.set('auth_token', token, { 
          expires: 7,
          path: '/',
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });
        
        updateStoredUserData(user, token);
        setUser(user);
        
        console.log('Registration successful:', user);
        toast.success('สมัครสมาชิกสำเร็จ!');
        return { success: true, user };
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Registration error:', error);
      const message = error.response?.data?.error || error.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    console.log('🚪 Logging out user...');
    clearAuthData();
    setUser(null);
    console.log('✅ User logged out successfully');
    toast.success('ออกจากระบบเรียบร้อย');
  };

  const updateUser = (userData) => {
    setUser(userData);
    const token = Cookies.get('auth_token');
    if (token) {
      updateStoredUserData(userData, token);
    }
  };

  // Get current token info
  const getTokenInfo = () => {
    const token = Cookies.get('auth_token');
    if (!token) return null;
    
    const payload = parseJWT(token);
    if (!payload) return null;
    
    return {
      token,
      payload,
      isValid: !isTokenExpired(payload),
      timeRemaining: getTokenTimeRemaining(payload),
      expiresAt: new Date(payload.exp * 1000),
      user: user
    };
  };

  // Check if user needs to refresh session
  const needsRefresh = () => {
    const tokenInfo = getTokenInfo();
    if (!tokenInfo) return true;
    
    // Suggest refresh if less than 30 minutes remaining
    return tokenInfo.timeRemaining < 1800;
  };

  // Manual token refresh (for future implementation)
  const refreshToken = async () => {
    try {
      const currentToken = Cookies.get('auth_token');
      if (!currentToken) {
        throw new Error('No token to refresh');
      }

      // This would call a refresh endpoint when implemented
      console.log('🔄 Token refresh would be called here');
      toast.info('การต่ออายุเซสชันจะถูกพัฒนาในอนาคต');
      
      return false; // Not implemented yet
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      return false;
    }
  };

  // Force check authentication status
  const forceCheckAuth = () => {
    console.log('🔄 Force checking authentication...');
    checkAuth();
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
    // Enhanced token management functions
    getTokenInfo,
    needsRefresh,
    refreshToken,
    forceCheckAuth,
    // Utility functions
    isTokenValid: () => {
      const tokenInfo = getTokenInfo();
      return tokenInfo ? tokenInfo.isValid : false;
    },
    getTimeRemaining: () => {
      const tokenInfo = getTokenInfo();
      return tokenInfo ? tokenInfo.timeRemaining : 0;
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
