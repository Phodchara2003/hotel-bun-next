'use client';

import { useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

export default function GlobalLanguageThemeHandler() {
  const { language } = useLanguage();
  const { theme } = useTheme();

  useEffect(() => {
    // Update document language - avoid hydration conflicts
    if (typeof document !== 'undefined' && typeof window !== 'undefined') {
      // Only update if it's different from server-rendered value
      const currentLang = document.documentElement.lang;
      const targetLang = language === 'en' ? 'en' : 'th';
      if (currentLang !== targetLang) {
        document.documentElement.lang = targetLang;
      }
    }
  }, [language]);

  useEffect(() => {
    // Update document theme class - avoid hydration conflicts
    if (typeof document !== 'undefined' && typeof window !== 'undefined') {
      const root = document.documentElement;
      // Check current state to avoid unnecessary changes
      const isDarkCurrently = root.classList.contains('dark');
      const shouldBeDark = theme === 'dark';
      
      if (isDarkCurrently !== shouldBeDark) {
        if (shouldBeDark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    }
  }, [theme]);

  return null; // This component doesn't render anything
}