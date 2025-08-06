'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { authAPI } from '../lib/api';
import toast from 'react-hot-toast';

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
            console.log('User data updated from another tab, syncing');
            setUser(userData);
          } catch (error) {
            console.log('Error parsing user data from storage event');
          }
        }
      };

      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, []);

  const checkAuth = async () => {
    try {
      let token = Cookies.get('auth_token');
      let userData = Cookies.get('user_data');
      
      console.log('Auth check - Token:', token ? 'Present' : 'Missing');
      console.log('Auth check - UserData:', userData ? 'Present' : 'Missing');
      
      if (token && userData) {
        try {
          const user = JSON.parse(userData);
          console.log('User data loaded:', user);
          
          // Validate that the user object has required fields
          if (user && user.id && user.email && user.role) {
            setUser(user);
            console.log('User authenticated:', user.email, user.role);
          } else {
            console.log('Invalid user data, clearing auth');
            clearAuthData();
            setUser(null);
          }
          
        } catch (error) {
          console.error('Error parsing cached user data:', error);
          clearAuthData();
          setUser(null);
        }
      } else {
        console.log('No cached auth data found');
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const clearAuthData = () => {
    Cookies.remove('auth_token', { path: '/' });
    Cookies.remove('user_data', { path: '/' });
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('user_data');
    }
  };

  const updateStoredUserData = (userData, token) => {
    const userDataString = JSON.stringify(userData);
    
    // Store in cookies with longer expiration
    Cookies.set('user_data', userDataString, { 
      expires: 7, // 7 days
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    // Also store in sessionStorage as backup
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('user_data', userDataString);
      sessionStorage.setItem('auth_token', token);
    }
  };

  const login = async (credentials) => {
    try {
      setLoading(true);
      const response = await authAPI.login(credentials);
      
      if (response.token && response.user) {
        const token = response.token;
        const userData = response.user;
        
        // Store auth data
        Cookies.set('auth_token', token, { 
          expires: 7,
          path: '/',
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });
        
        updateStoredUserData(userData, token);
        setUser(userData);
        
        console.log('Login successful:', userData);
        toast.success('เข้าสู่ระบบสำเร็จ!');
        return { success: true, user: userData };
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.error || error.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
      toast.error(message);
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
    clearAuthData();
    setUser(null);
    console.log('User logged out');
    toast.success('ออกจากระบบเรียบร้อย');
  };

  const updateUser = (userData) => {
    setUser(userData);
    const token = Cookies.get('auth_token');
    if (token) {
      updateStoredUserData(userData, token);
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
