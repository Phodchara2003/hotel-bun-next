'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { authAPI } from '../lib      // Store token and user data with shorter expiration
      Cookies.set('auth_token', response.token, { 
        expires: 1, // Only 1 day
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });
      Cookies.set('user_data', JSON.stringify(response.user), { 
        expires: 1, // Only 1 day
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });
      
      // Store in sessionStorage for this session only
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('auth_token', response.token);
        sessionStorage.setItem('user_data', JSON.stringify(response.user));
      }ast from 'react-hot-toast';

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
    
    // Only use sessionStorage for temporary storage, not localStorage
    // This ensures logout when browser is closed
    const sessionToken = typeof window !== 'undefined' ? sessionStorage.getItem('auth_token') : null;
    const sessionUserData = typeof window !== 'undefined' ? sessionStorage.getItem('user_data') : null;
    
    const finalToken = token || sessionToken;
    const finalUserData = userData || sessionUserData;
    
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
              sessionStorage.removeItem('auth_token');
              sessionStorage.removeItem('user_data');
            }
            setUser(null);
          } else {
            console.log('Token validation successful');
            // Sync data to session storage only
            if (!token && sessionToken) {
              Cookies.set('auth_token', sessionToken, { 
                expires: 1, // Only 1 day instead of 7
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                path: '/'
              });
            }
            if (!userData && sessionUserData) {
              Cookies.set('user_data', sessionUserData, { 
                expires: 1, // Only 1 day instead of 7
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
      
      // Store token and user data with shorter expiration
      Cookies.set('auth_token', response.token, { 
        expires: 1, // Only 1 day
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });
      Cookies.set('user_data', JSON.stringify(response.user), { 
        expires: 1, // Only 1 day
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
    
    // Clear all authentication data immediately
    Cookies.remove('auth_token', { path: '/' });
    Cookies.remove('user_data', { path: '/' });
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
    }
    
    // Clear user state immediately
    setUser(null);
    
    // Clear any other session data
    if (typeof window !== 'undefined') {
      // Clear any other storage that might persist user state
      sessionStorage.clear();
    }
    
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
