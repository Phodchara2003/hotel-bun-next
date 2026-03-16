'use client';

import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../translations';

const LanguageSwitcher = ({ 
  showLabel = true, 
  position = 'relative',
  size = 'default'
}) => {
  const { language, changeLanguage } = useLanguage();
  const { t } = useTranslation(language);
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { 
      code: 'th', 
      name: 'ไทย',
      flag: '🇹🇭'
    },
    { 
      code: 'en', 
      name: 'English',
      flag: '🇺🇸'
    }
  ];

  const currentLanguage = languages.find(lang => lang.code === language);

  const handleLanguageChange = (langCode) => {
    changeLanguage(langCode);
    setIsOpen(false);
  };

  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
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
          bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg
          hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          shadow-sm
        `}
        type="button"
        title={t('language.changeLanguage', 'เปลี่ยนภาษา')}
      >
        <span className="text-lg">{currentLanguage?.flag}</span>
        {showLabel && (
          <>
            <span className="font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
              {currentLanguage?.name}
            </span>
            <span className="text-xs text-green-600 dark:text-green-400 font-semibold">
              ●
            </span>
          </>
        )}
        {!showLabel && (
          <span className="text-xs text-green-600 dark:text-green-400 font-semibold">
            ●
          </span>
        )}
        <svg 
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
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
          <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-20">
            <div className="py-1">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`
                    ${dropdownSizeClasses[size]}
                    w-full px-4 text-left flex items-center space-x-3
                    hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors
                    ${language === lang.code ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}
                  `}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span className="font-medium flex-1">{lang.name}</span>
                  {language === lang.code && (
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-green-600 dark:text-green-400 font-semibold">●</span>
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSwitcher;
