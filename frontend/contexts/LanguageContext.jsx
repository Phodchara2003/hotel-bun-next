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

  // Load saved language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred_language');
    if (savedLanguage && ['th', 'en'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    }
  }, []);

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

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
