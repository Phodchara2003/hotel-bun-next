'use client';

import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const ThemeSwitcher = ({ showLabel = false, size = 'default' }) => {
  const { theme, toggleTheme } = useTheme();

  const sizeClasses = {
    small: 'p-1.5 text-sm',
    default: 'p-2 text-base',
    large: 'p-3 text-lg'
  };

  const iconSizes = {
    small: 'h-4 w-4',
    default: 'h-5 w-5',
    large: 'h-6 w-6'
  };

  return (
    <div className="flex items-center space-x-2">
      {showLabel && (
        <span className="text-gray-700 dark:text-gray-300 text-sm">
          {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
        </span>
      )}
      <button
        onClick={toggleTheme}
        className={`
          ${sizeClasses[size]}
          bg-gray-100 dark:bg-gray-700 
          hover:bg-gray-200 dark:hover:bg-gray-600
          text-gray-700 dark:text-gray-300
          rounded-lg transition-all duration-200
          border border-gray-300 dark:border-gray-600
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          dark:focus:ring-offset-gray-800
        `}
        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {theme === 'dark' ? (
          <Sun className={`${iconSizes[size]} text-yellow-500`} />
        ) : (
          <Moon className={`${iconSizes[size]} text-blue-600`} />
        )}
      </button>
    </div>
  );
};

export default ThemeSwitcher;
