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
  const [isClient, setIsClient] = useState(false);

  // Initialize client-side flag to prevent hydration mismatches
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!initialized && isClient) {
      checkAuth();
      setInitialized(true);
    }
  }, [initialized, isClient]);

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
      
      // ตรวจสอบข้อมูลใน localStorage เสมอ (เพื่อเก็บโทเคนไว้ตลอด)
      if ((!token || !userData) && typeof window !== 'undefined') {
        console.log('🔍 Checking localStorage for persistent auth data...');
        
        const localToken = localStorage.getItem('auth_token_persistent');
        const localUserData = localStorage.getItem('user_data_persistent');
        const expiresAt = localStorage.getItem('auth_expires_at');
        
        // ตรวจสอบว่าข้อมูลยังไม่หมดอายุ
        if (localToken && localUserData && expiresAt) {
          const expires = parseInt(expiresAt);
          const now = Date.now();
          
          if (now < expires) {
            console.log('✅ Valid persistent auth data found, restoring session...');
            token = localToken;
            userData = localUserData;
            
            // กู้คืนข้อมูลไปยัง cookies
            updateStoredUserData(JSON.parse(userData), token, true);
          } else {
            console.log('❌ Persistent auth data expired, clearing...');
            localStorage.removeItem('auth_token_persistent');
            localStorage.removeItem('user_data_persistent');
            localStorage.removeItem('auth_expires_at');
          }
        }
        
        // ตรวจสอบ Remember Me backup ถ้ายังไม่มีข้อมูล
        if (!token || !userData) {
          const rememberMe = localStorage.getItem('remember_me') === 'true';
          
          if (rememberMe) {
            console.log('🔍 Checking Remember Me backup data...');
            
            const backupToken = localStorage.getItem('auth_token_backup');
            const backupUserData = localStorage.getItem('user_data_backup');
            const backupExpiresAt = localStorage.getItem('backup_expires_at');
            
            if (backupToken && backupUserData && backupExpiresAt) {
              const expiresAt = parseInt(backupExpiresAt);
              const now = Date.now();
              
              if (now < expiresAt) {
                console.log('✅ Valid Remember Me backup found, restoring session...');
                token = backupToken;
                userData = backupUserData;
                
                // Restore to cookies and persistent storage
                updateStoredUserData(JSON.parse(userData), token, true);
              } else {
                console.log('❌ Remember Me backup expired, clearing...');
                localStorage.removeItem('auth_token_backup');
                localStorage.removeItem('user_data_backup');
                localStorage.removeItem('backup_expires_at');
                localStorage.removeItem('remember_me');
              }
            }
          }
        }
      }
      
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
    
    // Session warnings disabled to prevent screen blocking
    // Warn when 10 minutes remaining
    if (false && timeRemaining > 600) {
      setTimeout(() => {
        toast.warning('เซสชันจะหมดอายุในอีก 10 นาที');
      }, (timeRemaining - 600) * 1000);
    }
    
    // Final warning at 5 minutes
    if (false && timeRemaining > 300) {
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
    
    // Clear localStorage backup data (but keep remember_me preference for next login)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      localStorage.removeItem('auth_token_backup');
      localStorage.removeItem('user_data_backup');
      localStorage.removeItem('backup_expires_at');
      // เพิ่มการล้าง persistent data
      localStorage.removeItem('auth_token_persistent');
      localStorage.removeItem('user_data_persistent');
      localStorage.removeItem('auth_expires_at');
      // Note: We don't remove 'remember_me' so user preference is preserved
    }
    
    console.log('✅ Auth data cleared completely');
  };

  const updateStoredUserData = (userData, token, rememberMe = false) => {
    const userDataString = JSON.stringify(userData);
    
    // Parse token to get expiration
    const tokenPayload = parseJWT(token);
    let expiresInDays = tokenPayload ? 
      Math.min(7, Math.ceil(getTokenTimeRemaining(tokenPayload) / (24 * 60 * 60))) : 7;
    
    // If remember me is enabled, extend the session
    if (rememberMe) {
      expiresInDays = 30; // 30 days for remember me
      console.log('💾 Storing with Remember Me - Extended to 30 days');
    } else {
      console.log('💾 Storing with regular session -', expiresInDays, 'days');
    }
    
    // Store remember me preference
    if (typeof window !== 'undefined') {
      localStorage.setItem('remember_me', rememberMe.toString());
    }
    
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
    
    // เก็บข้อมูลใน localStorage เสมอ (สำหรับการกู้คืนเมื่อกลับมา)
    if (typeof window !== 'undefined') {
      const expirationTime = Date.now() + (expiresInDays * 24 * 60 * 60 * 1000);
      
      // เก็บข้อมูลหลักแบบถาวร
      localStorage.setItem('auth_token_persistent', token);
      localStorage.setItem('user_data_persistent', userDataString);
      localStorage.setItem('auth_expires_at', expirationTime.toString());
      
      // For remember me, also store in backup location
      if (rememberMe) {
        localStorage.setItem('user_data_backup', userDataString);
        localStorage.setItem('auth_token_backup', token);
        localStorage.setItem('backup_expires_at', (Date.now() + (30 * 24 * 60 * 60 * 1000)).toString());
      }
    }
    
    // Store in sessionStorage as usual
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('user_data', userDataString);
      sessionStorage.setItem('auth_token', token);
      sessionStorage.setItem('token_stored_at', Date.now().toString());
      
      // Store token metadata
      if (tokenPayload) {
        sessionStorage.setItem('token_expires_at', (tokenPayload.exp * 1000).toString());
      }
    }
    
    console.log('✅ Auth data stored successfully in all storage locations');
  };

  const login = async (credentials, rememberMe = false) => {
    try {
      setLoading(true);
      console.log('🔐 Attempting login...', rememberMe ? '(Remember Me enabled)' : '');
      
      const response = await authAPI.login(credentials);
      
      // Backend returns {success: true, data: {token, user}}
      if (response.success && response.data && response.data.token && response.data.user) {
        const token = response.data.token;
        const userData = response.data.user;
        
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
        
        // Store auth data with remember me preference
        updateStoredUserData(userData, token, rememberMe);
        setUser(userData);
        
        // Set up token monitoring
        scheduleTokenRefresh(tokenPayload);
        
        console.log('✅ Login successful:', userData.email, userData.role);
        toast.success(`ยินดีต้อนรับ ${userData.first_name || userData.email}!${rememberMe ? ' (จดจำการเข้าสู่ระบบแล้ว)' : ''}`);
        
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
      
      // Backend returns {success: true, data: {token, user}}
      if (response.success && response.data && response.data.token && response.data.user) {
        const token = response.data.token;
        const user = response.data.user;
        
        console.log('✅ Registration API successful');
        
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
      // Check if remember me was enabled
      const rememberMe = typeof window !== 'undefined' ? 
        localStorage.getItem('remember_me') === 'true' : false;
      
      // Update stored data while preserving remember me setting
      updateStoredUserData(userData, token, rememberMe);
      
      console.log('✅ User data updated successfully');
    } else {
      console.warn('⚠️ No token found during user update');
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
    // Remember Me utilities
    getRememberMePreference: () => {
      if (typeof window !== 'undefined') {
        return localStorage.getItem('remember_me') === 'true';
      }
      return false;
    },
    clearRememberMe: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('remember_me');
        localStorage.removeItem('auth_token_backup');
        localStorage.removeItem('user_data_backup');
        localStorage.removeItem('backup_expires_at');
      }
    },
    // Utility functions
    isTokenValid: () => {
      const tokenInfo = getTokenInfo();
      return tokenInfo ? tokenInfo.isValid : false;
    },
    getTimeRemaining: () => {
      const tokenInfo = getTokenInfo();
      return tokenInfo ? tokenInfo.timeRemaining : 0;
    },

    // Role checking functions
    isAdmin: () => user?.role === 'admin',
    isManager: () => user?.role === 'manager',
    isStaff: () => user?.role === 'staff',
    isGuest: () => user?.role === 'guest',
    
    // Permission checking functions
    canManageUsers: () => ['admin', 'manager'].includes(user?.role), // Allow both admin and manager to access user management
    canViewReports: () => ['admin', 'manager'].includes(user?.role),
    canManageRooms: () => ['admin', 'staff'].includes(user?.role),
    canViewDashboard: () => ['admin', 'manager', 'staff'].includes(user?.role),
    hasReadOnlyAccess: () => user?.role === 'manager'
  };

  // Prevent hydration mismatches by showing loading state until client-side
  if (!isClient) {
    return (
      <AuthContext.Provider value={{
        user: null,
        loading: true,
        login: () => Promise.resolve({}),
        register: () => Promise.resolve({}),
        logout: () => {},
        updateUser: () => {},
        isAuthenticated: false,
        getTokenInfo: () => null,
        needsRefresh: () => false,
        refreshToken: () => Promise.resolve(false),
        forceCheckAuth: () => {},
        getRememberMePreference: () => false,
        clearRememberMe: () => {},
        isTokenValid: () => false,
        getTimeRemaining: () => 0,
        isAdmin: () => false,
        isManager: () => false,
        isStaff: () => false,
        isGuest: () => false,
        canManageUsers: () => false,
        canViewReports: () => false,
        canManageRooms: () => false,
        canViewDashboard: () => false,
        hasReadOnlyAccess: () => false
      }}>
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
