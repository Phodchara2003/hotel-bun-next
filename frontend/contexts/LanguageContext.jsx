'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('th'); // default to Thai
  const [isClient, setIsClient] = useState(false);

  // Initialize client-side flag to prevent hydration mismatches
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load saved language from localStorage on mount
  useEffect(() => {
    if (isClient && typeof localStorage !== 'undefined') {
      const savedLanguage = localStorage.getItem('preferred_language');
      if (savedLanguage && ['th', 'en'].includes(savedLanguage)) {
        setLanguage(savedLanguage);
      }
    }
  }, [isClient]);

  // Save language preference
  const changeLanguage = (newLanguage) => {
    if (['th', 'en'].includes(newLanguage)) {
      setLanguage(newLanguage);
      localStorage.setItem('preferred_language', newLanguage);
    }
  };

  const value = {
    language,
    changeLanguage,
    isThailand: language === 'th',
    isEnglish: language === 'en'
  };

  // Prevent hydration mismatches by showing loading state until client-side
  if (!isClient) {
    return (
      <LanguageContext.Provider value={{
        language: 'th',
        changeLanguage: () => {},
        isThailand: true,
        isEnglish: false
      }}>
        {children}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
