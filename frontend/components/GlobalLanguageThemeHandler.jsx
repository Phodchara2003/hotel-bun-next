'use client';

import { useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

export default function GlobalLanguageThemeHandler() {
  const { language } = useLanguage();
  const { theme } = useTheme();

  useEffect(() => {
    // Update document language
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language === 'en' ? 'en' : 'th';
    }
  }, [language]);

  useEffect(() => {
    // Update document theme class
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [theme]);

  return null; // This component doesn't render anything
}
