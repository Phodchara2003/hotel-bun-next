'use client';

import { useState, forwardRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const CustomDatePicker = ({
  selectedDate, 
  onDateSelect, 
  minDate = new Date(),
  maxDate = null,
  placeholder = "เลือกวันที่",
  label = "วันที่",
  disabled = false,
  className = "",
  language = "th"
}) => {
  
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
          w-full px-6 py-4 text-left border-2 rounded-xl transition-all duration-200 font-semibold shadow-lg
          ${disabled 
            ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed' 
            : 'bg-gradient-to-r from-white to-emerald-50 border-emerald-400 hover:border-emerald-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-300 hover:shadow-xl'
          }
          ${isOpen ? 'border-emerald-600 ring-2 ring-emerald-300 shadow-xl' : ''}
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
        <div className="absolute top-full left-0 right-0 mt-2 bg-gradient-to-b from-emerald-50 to-white border-2 border-emerald-300 rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Calendar Header */}
          <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-emerald-700 via-emerald-800 to-emerald-900 text-white shadow-xl border-b-2 border-emerald-600">
            <button
              type="button"
              onClick={() => navigateMonth(-1)}
              className="p-2 hover:bg-white/20 rounded-full transition-all duration-200 hover:scale-110 hover:shadow-md"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="bg-emerald-800/90 backdrop-blur-sm px-6 py-3 rounded-full border-2 border-emerald-600 shadow-lg">
              <h3 className="text-xl font-bold text-center text-white drop-shadow-lg">
                {monthNames[language][currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
            </div>
            
            <button
              type="button"
              onClick={() => navigateMonth(1)}
              className="p-2 hover:bg-white/20 rounded-full transition-all duration-200 hover:scale-110 hover:shadow-md"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day Names Header */}
          <div className="grid grid-cols-7 gap-0 bg-gradient-to-r from-emerald-50 to-emerald-100 border-b border-emerald-200">
            {dayNames[language].map((day, index) => (
              <div key={index} className="p-4 text-center text-sm font-bold text-emerald-800 bg-white/50">
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
                  relative p-4 text-sm font-medium transition-all duration-200 focus:outline-none focus:z-10 border-r border-b border-gray-100
                  ${!dayObj.isCurrentMonth 
                    ? 'text-gray-300 cursor-not-allowed bg-gray-50/50' 
                    : dayObj.isDisabled
                      ? 'text-gray-300 cursor-not-allowed bg-gray-50/50'
                      : 'text-gray-800 hover:bg-emerald-50 hover:text-emerald-800 hover:scale-105 hover:shadow-sm'
                  }
                  ${dayObj.isSelected 
                    ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 text-white font-bold shadow-lg ring-2 ring-emerald-300 ring-offset-1' 
                    : ''
                  }
                  ${dayObj.isToday && !dayObj.isSelected 
                    ? 'bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-900 font-bold border-2 border-emerald-400' 
                    : ''
                  }
                  ${highlightedDate && 
                    highlightedDate.toDateString() === dayObj.date.toDateString() && 
                    !dayObj.isSelected && 
                    !dayObj.isDisabled && 
                    dayObj.isCurrentMonth
                    ? 'bg-emerald-100 text-emerald-800 scale-105' 
                    : ''
                  }
                `}
              >
                {dayObj.day}
                
                {/* Today indicator */}
                {dayObj.isToday && !dayObj.isSelected && (
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-emerald-600 rounded-full animate-pulse"></div>
                )}
                
                {/* Selected indicator */}
                {dayObj.isSelected && (
                  <div className="absolute inset-0 border-2 border-white rounded-lg pointer-events-none shadow-inner"></div>
                )}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-emerald-100 border-t border-emerald-200">
            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => {
                  onDateSelect(new Date());
                  setIsOpen(false);
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 font-medium transition-all duration-200 hover:scale-105 hover:shadow-md"
              >
                {language === 'en' ? 'Today' : 'วันนี้'}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-gray-600 hover:text-emerald-800 hover:bg-white/80 rounded-full transition-all duration-200"
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

export default CustomDatePicker;
