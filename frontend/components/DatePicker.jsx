'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/translations';

const DatePicker = ({ 
  selectedDate, 
  onDateSelect, 
  minDate = new Date(),
  maxDate = null,
  placeholder = "เลือกวันที่",
  label = "วันที่",
  disabled = false,
  className = ""
}) => {
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [highlightedDate, setHighlightedDate] = useState(null);

  // Month and day names in both languages
  const monthNames = {
    th: [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ],
    en: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
  };

  const dayNames = {
    th: ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'],
    en: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Previous month's trailing days
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonth.getDate() - i;
      days.push({
        day,
        date: new Date(year, month - 1, day),
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        isDisabled: true
      });
    }
    
    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const today = new Date();
      const isToday = date.toDateString() === today.toDateString();
      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
      const isDisabled = (minDate && date < minDate) || (maxDate && date > maxDate);
      
      days.push({
        day,
        date,
        isCurrentMonth: true,
        isToday,
        isSelected,
        isDisabled
      });
    }
    
    // Next month's leading days
    const remainingDays = 42 - days.length; // 6 rows × 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        day,
        date,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        isDisabled: true
      });
    }
    
    return days;
  };

  const handleDateClick = (dayObj) => {
    if (dayObj.isDisabled || !dayObj.isCurrentMonth) return;
    
    onDateSelect(dayObj.date);
    setIsOpen(false);
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + direction);
      return newMonth;
    });
  };

  const formatDisplayDate = (date) => {
    if (!date) return placeholder;
    
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    };
    
    return date.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', options);
  };

  const handleKeyPress = (e, dayObj) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleDateClick(dayObj);
    }
  };

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.date-picker-container')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const calendarDays = generateCalendarDays();

  return (
    <div className={`relative date-picker-container ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      {/* Input Field */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-4 py-3 text-left border rounded-lg transition-all duration-200
          ${disabled 
            ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed' 
            : 'bg-white border-gray-300 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
          }
          ${isOpen ? 'border-blue-500 ring-2 ring-blue-200' : ''}
        `}
      >
        <div className="flex items-center justify-between">
          <span className={selectedDate ? 'text-gray-900' : 'text-gray-500'}>
            {formatDisplayDate(selectedDate)}
          </span>
          <svg 
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
          {/* Calendar Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <button
              type="button"
              onClick={() => navigateMonth(-1)}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <h3 className="text-lg font-semibold">
              {monthNames[language][currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            
            <button
              type="button"
              onClick={() => navigateMonth(1)}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day Names Header */}
          <div className="grid grid-cols-7 gap-0 bg-gray-50">
            {dayNames[language].map((day, index) => (
              <div key={index} className="p-3 text-center text-sm font-medium text-gray-600">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-0">
            {calendarDays.map((dayObj, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleDateClick(dayObj)}
                onKeyPress={(e) => handleKeyPress(e, dayObj)}
                onMouseEnter={() => setHighlightedDate(dayObj.date)}
                onMouseLeave={() => setHighlightedDate(null)}
                disabled={dayObj.isDisabled}
                className={`
                  relative p-3 text-sm transition-all duration-150 focus:outline-none focus:z-10
                  ${!dayObj.isCurrentMonth 
                    ? 'text-gray-300 cursor-not-allowed' 
                    : dayObj.isDisabled
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-blue-50'
                  }
                  ${dayObj.isSelected 
                    ? 'bg-blue-500 text-white font-semibold shadow-md' 
                    : ''
                  }
                  ${dayObj.isToday && !dayObj.isSelected 
                    ? 'bg-blue-100 text-blue-700 font-semibold' 
                    : ''
                  }
                  ${highlightedDate && 
                    highlightedDate.toDateString() === dayObj.date.toDateString() && 
                    !dayObj.isSelected && 
                    !dayObj.isDisabled && 
                    dayObj.isCurrentMonth
                    ? 'bg-blue-100 text-blue-700' 
                    : ''
                  }
                `}
              >
                {dayObj.day}
                
                {/* Today indicator */}
                {dayObj.isToday && !dayObj.isSelected && (
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full"></div>
                )}
                
                {/* Selected indicator */}
                {dayObj.isSelected && (
                  <div className="absolute inset-0 border-2 border-blue-300 rounded pointer-events-none"></div>
                )}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-gray-50 border-t">
            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => {
                  onDateSelect(new Date());
                  setIsOpen(false);
                }}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                {language === 'en' ? 'Today' : 'วันนี้'}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-gray-600 hover:text-gray-800"
              >
                {language === 'en' ? 'Close' : 'ปิด'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;
