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

  const checkAuth = async () => {
    const token = Cookies.get('auth_token');
    const userData = Cookies.get('user_data');
    
    console.log('Checking auth - Token:', token ? 'Present' : 'Missing');
    console.log('Checking auth - User Data:', userData ? 'Present' : 'Missing');
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        console.log('Parsed user data:', user);
        
        // Set user immediately from cached data
        setUser(user);
        
        // Validate token with server in background
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/api/auth/validate`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (!response.ok) {
            console.log('Token validation failed, removing invalid token');
            // Token is invalid, remove it
            Cookies.remove('auth_token', { path: '/' });
            Cookies.remove('user_data', { path: '/' });
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem('auth_token');
              sessionStorage.removeItem('user_data');
            }
            setUser(null);
          } else {
            console.log('Token validation successful');
          }
        } catch (error) {
          // Network error or server down, keep using cached user data
          console.log('Cannot validate token (network error), using cached data');
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        Cookies.remove('auth_token', { path: '/' });
        Cookies.remove('user_data', { path: '/' });
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('auth_token');
          sessionStorage.removeItem('user_data');
        }
        setUser(null);
      }
    } else {
      console.log('No token or user data found');
      setUser(null);
    }
    setLoading(false);
  };

  const login = async (credentials) => {
    try {
      setLoading(true);
      const response = await authAPI.login(credentials);
      
      // Store token and user data with shorter expiration - 6 hours only
      Cookies.set('auth_token', response.token, { 
        expires: 0.25, // 6 hours (0.25 days)
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });
      Cookies.set('user_data', JSON.stringify(response.user), { 
        expires: 0.25, // 6 hours (0.25 days)
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });
      
      // Store in sessionStorage for this session only
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('auth_token', response.token);
        sessionStorage.setItem('user_data', JSON.stringify(response.user));
      }
      
      setUser(response.user);
      console.log('Login successful, user set:', response.user);
      toast.success(`ยินดีต้อนรับ ${response.user.first_name || response.user.email}!`);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.error || error.message || 'เข้าสู่ระบบไม่สำเร็จ';
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
      
      // Store token and user data with shorter expiration - 6 hours only
      Cookies.set('auth_token', response.token, { 
        expires: 0.25, // 6 hours (0.25 days)
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });
      Cookies.set('user_data', JSON.stringify(response.user), { 
        expires: 0.25, // 6 hours (0.25 days)
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });
      
      // Store in sessionStorage for this session only
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('auth_token', response.token);
        sessionStorage.setItem('user_data', JSON.stringify(response.user));
      }
      
      setUser(response.user);
      toast.success('สมัครสมาชิกสำเร็จ!');
      return { success: true };
    } catch (error) {
      console.error('Register error:', error);
      const message = error.response?.data?.error || error.message || 'สมัครสมาชิกไม่สำเร็จ';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    console.log('Logging out user');
    
    // Clear all authentication data immediately
    Cookies.remove('auth_token', { path: '/' });
    Cookies.remove('user_data', { path: '/' });
    
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('user_data');
      // Clear any other session data
      sessionStorage.clear();
    }
    
    // Clear user state immediately
    setUser(null);
    
    toast.success('ออกจากระบบสำเร็จ');
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
