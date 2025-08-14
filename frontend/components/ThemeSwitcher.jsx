'use client';

import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../translations';
import { Sun, Moon, Monitor } from 'lucide-react';

const ThemeSwitcher = ({ 
  showLabel = true, 
  position = 'relative',
  size = 'default'
}) => {
  const { theme, toggleTheme, setLightTheme, setDarkTheme } = useTheme();
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const [isOpen, setIsOpen] = useState(false);

  const themes = [
    { 
      id: 'light', 
      name: language === 'en' ? 'Light' : 'โหมดสว่าง',
      icon: Sun,
      description: language === 'en' ? 'Light theme' : 'ธีมสว่าง'
    },
    { 
      id: 'dark', 
      name: language === 'en' ? 'Dark' : 'โหมดมืด',
      icon: Moon,
      description: language === 'en' ? 'Dark theme' : 'ธีมมืด'
    }
  ];

  const currentTheme = themes.find(t => t.id === theme);
  const CurrentIcon = currentTheme?.icon || Sun;

  const handleThemeChange = (themeId) => {
    if (themeId === 'light') {
      setLightTheme();
    } else if (themeId === 'dark') {
      setDarkTheme();
    }
    setIsOpen(false);
  };

  const sizeClasses = {
    small: 'px-2 py-1 text-sm',
    default: 'px-3 py-2 text-sm',
    large: 'px-4 py-3 text-base'
  };

  const dropdownSizeClasses = {
    small: 'py-1 text-sm',
    default: 'py-2 text-sm', 
    large: 'py-3 text-base'
  };

  return (
    <div className={position === 'relative' ? 'relative' : 'relative inline-block'}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          ${sizeClasses[size]}
          flex items-center space-x-2 
          bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg
          hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          text-gray-700 dark:text-gray-200
        `}
        type="button"
        title={language === 'en' ? 'Change theme' : 'เปลี่ยนธีม'}
      >
        <CurrentIcon className="w-4 h-4" />
        {showLabel && (
          <span className="font-medium">
            {currentTheme?.name}
          </span>
        )}
        <svg 
          className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M19 9l-7 7-7-7" 
          />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-20">
            <div className="py-1">
              {themes.map((themeOption) => {
                const IconComponent = themeOption.icon;
                return (
                  <button
                    key={themeOption.id}
                    onClick={() => handleThemeChange(themeOption.id)}
                    className={`
                      ${dropdownSizeClasses[size]}
                      w-full px-4 text-left flex items-center space-x-3
                      hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                      ${theme === themeOption.id 
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                        : 'text-gray-700 dark:text-gray-200'
                      }
                    `}
                  >
                    <IconComponent className="w-4 h-4" />
                    <div className="flex-1">
                      <div className="font-medium">{themeOption.name}</div>
                      <div className="text-xs opacity-75">{themeOption.description}</div>
                    </div>
                    {theme === themeOption.id && (
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ThemeSwitcher;
