'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light'); // Force light theme as default
  const [isClient, setIsClient] = useState(false);

  // Initialize client-side flag to prevent hydration mismatches
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load saved theme from localStorage on mount
  useEffect(() => {
    if (isClient) {
      // Force light theme always
      setTheme('light');
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('preferred_theme', 'light');
      }
    }
  }, [isClient]);

  // Apply theme to document - only on client side
  useEffect(() => {
    if (isClient && typeof document !== 'undefined' && typeof window !== 'undefined') {
      // Always remove dark class to ensure light theme
      document.documentElement.classList.remove('dark');
      // Don't set inline styles to avoid hydration mismatches
      // Styles should be handled by CSS classes instead
    }
  }, [theme, isClient]);

  // Save theme preference and apply
  const changeTheme = (newTheme) => {
    if (['light', 'dark'].includes(newTheme)) {
      setTheme(newTheme);
      localStorage.setItem('preferred_theme', newTheme);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    changeTheme(newTheme);
  };

  const value = {
    theme,
    changeTheme,
    toggleTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light'
  };

  // Prevent hydration mismatches by showing loading state until client-side
  if (!isClient) {
    return (
      <ThemeContext.Provider value={{
        theme: 'light',
        changeTheme: () => {},
        toggleTheme: () => {},
        isDark: false,
        isLight: true
      }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
