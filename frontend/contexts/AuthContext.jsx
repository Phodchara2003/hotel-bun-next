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
    
    // Fallback to localStorage if cookies are not available
    const fallbackToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const fallbackUserData = typeof window !== 'undefined' ? localStorage.getItem('user_data') : null;
    
    const finalToken = token || fallbackToken;
    const finalUserData = userData || fallbackUserData;
    
    console.log('Checking auth - Token:', finalToken ? 'Present' : 'Missing');
    console.log('Checking auth - User Data:', finalUserData ? 'Present' : 'Missing');
    
    if (finalToken && finalUserData) {
      try {
        const user = JSON.parse(finalUserData);
        console.log('Parsed user data:', user);
        
        // Set user immediately from cached data
        setUser(user);
        
        // Validate token with server in background
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/api/auth/validate`, {
            headers: {
              'Authorization': `Bearer ${finalToken}`
            }
          });
          
          if (!response.ok) {
            console.log('Token validation failed, removing invalid token');
            // Token is invalid, remove it
            Cookies.remove('auth_token', { path: '/' });
            Cookies.remove('user_data', { path: '/' });
            if (typeof window !== 'undefined') {
              localStorage.removeItem('auth_token');
              localStorage.removeItem('user_data');
            }
            setUser(null);
          } else {
            console.log('Token validation successful');
            // Sync data to both storage methods
            if (!token && fallbackToken) {
              Cookies.set('auth_token', fallbackToken, { 
                expires: 7,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                path: '/'
              });
            }
            if (!userData && fallbackUserData) {
              Cookies.set('user_data', fallbackUserData, { 
                expires: 7,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                path: '/'
              });
            }
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
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
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
      
      // Store token and user data with proper settings
      Cookies.set('auth_token', response.token, { 
        expires: 7,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });
      Cookies.set('user_data', JSON.stringify(response.user), { 
        expires: 7,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });
      
      // Also store in localStorage as fallback
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('user_data', JSON.stringify(response.user));
      }
      
      setUser(response.user);
      console.log('Login successful, user set:', response.user);
      toast.success('เข้าสู่ระบบสำเร็จ!');
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
      
      // Store token and user data with proper settings
      Cookies.set('auth_token', response.token, { 
        expires: 7,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });
      Cookies.set('user_data', JSON.stringify(response.user), { 
        expires: 7,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });
      
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
    Cookies.remove('auth_token', { path: '/' });
    Cookies.remove('user_data', { path: '/' });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
    }
    setUser(null);
    toast.success('ออกจากระบบเรียบร้อย');
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
