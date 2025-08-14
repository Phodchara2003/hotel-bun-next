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
          bg-white dark:bg-gray-800 border-2 rounded-lg
          hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400
          ${language === 'th' 
            ? 'border-blue-300 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-600'
          }
        `}
        type="button"
        title={`${t('language.changeLanguage')} - ${t('language.current')}: ${currentLanguage?.name}`}
      >
        <span className="text-lg">{currentLanguage?.flag}</span>
        {showLabel && (
          <span className="font-medium text-gray-700 dark:text-gray-200">
            {currentLanguage?.name}
          </span>
        )}
        {!showLabel && (
          <span className="text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-1 rounded">
            {currentLanguage?.code.toUpperCase()}
          </span>
        )}
        <svg 
          className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
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
          <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-20">
            <div className="py-2">
              <div className="px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-gray-100 dark:border-gray-700 mb-1">
                {t('language.changeLanguage')}
              </div>
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`
                    ${dropdownSizeClasses[size]}
                    w-full px-4 text-left flex items-center space-x-3
                    hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200
                    ${language === lang.code 
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-l-4 border-blue-500 dark:border-blue-400' 
                      : 'text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100'
                    }
                  `}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <div className="flex-1">
                    <span className="font-medium">{lang.name}</span>
                    {language === lang.code && (
                      <span className="block text-xs text-blue-600 dark:text-blue-400 font-medium">
                        {t('language.current')}
                      </span>
                    )}
                  </div>
                  {language === lang.code && (
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
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
