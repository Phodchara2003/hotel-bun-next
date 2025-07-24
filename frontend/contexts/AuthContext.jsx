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

  // Listen for storage changes (sync between tabs, but don't auto-logout)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleStorageChange = (e) => {
        if (e.key === 'user_data' && e.newValue) {
          // User data updated from another tab, sync it
          try {
            const userData = JSON.parse(e.newValue);
            console.log('User data updated from another tab, syncing');
            setUser(userData);
          } catch (error) {
            console.log('Error parsing user data from storage event');
          }
        }
        // Don't auto-logout on token removal - let user decide
      };

      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, []);

  const checkAuth = async () => {
    try {
      let token = Cookies.get('auth_token');
      let userData = Cookies.get('user_data');
      
      // If cookies are missing, try sessionStorage as fallback
      if ((!token || !userData) && typeof window !== 'undefined') {
        token = token || sessionStorage.getItem('auth_token');
        userData = userData || sessionStorage.getItem('user_data');
        console.log('Using sessionStorage fallback - Token:', token ? 'Present' : 'Missing');
      }
      
      console.log('Checking auth - Token:', token ? 'Present' : 'Missing');
      console.log('Checking auth - User Data:', userData ? 'Present' : 'Missing');
      
      if (token && userData) {
        try {
          const user = JSON.parse(userData);
          console.log('Parsed user data:', user);
          
          // Set user immediately from cached data
          setUser(user);
          
          // Validate token with server in background (but don't auto-logout)
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/api/auth/validate`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (!response.ok) {
              console.log('Token validation failed, but keeping user logged in');
              // Don't auto-logout, just log the issue
              // User should manually logout if needed
            } else {
              console.log('Token validation successful');
              // Optionally refresh user data from server
              const validatedData = await response.json();
              if (validatedData.user) {
                setUser(validatedData.user);
                // Update stored data with fresh data
                updateStoredUserData(validatedData.user, token);
              }
            }
          } catch (error) {
            // Network error or server down, keep using cached user data
            console.log('Cannot validate token (network error), using cached data');
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
          clearAuthData();
          setUser(null);
        }
      } else {
        console.log('No token or user data found');
        setUser(null);
      }
    } catch (error) {
      console.error('Error in checkAuth:', error);
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
    // Update cookies
    Cookies.set('user_data', JSON.stringify(userData), { 
      expires: 7,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    });
    
    // Update sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('user_data', JSON.stringify(userData));
      if (token) {
        sessionStorage.setItem('auth_token', token);
      }
    }
  };

  const login = async (credentials) => {
    try {
      setLoading(true);
      const response = await authAPI.login(credentials);
      
      // Store token and user data with longer expiration for development
      Cookies.set('auth_token', response.token, { 
        expires: 7, // 7 days for better development experience
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });
      
      // Store user data and update session storage
      updateStoredUserData(response.user, response.token);
      
      setUser(response.user);
      console.log('Login successful, user set:', response.user);
      toast.success('เข้าสู่ระบบสำเร็จ!');
      return { success: true, user: response.user };
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
      
      // Store token and user data with longer expiration for development
      Cookies.set('auth_token', response.token, { 
        expires: 7, // 7 days for better development experience
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });
      
      // Store user data and update session storage
      updateStoredUserData(response.user, response.token);
      
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
    clearAuthData();
    
    // Clear user state immediately
    setUser(null);
    
    toast.success('ออกจากระบบเรียบร้อย');
  };

  const updateUser = (userData) => {
    setUser(userData);
    // Get current token to update stored data
    const token = Cookies.get('auth_token') || sessionStorage.getItem('auth_token');
    updateStoredUserData(userData, token);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
