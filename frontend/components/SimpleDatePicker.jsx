'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/translations';

const SimpleDatePicker = ({ 
  selectedDate, 
  onDateSelect,
  minDate = new Date(),
  maxDate = null,
  placeholder,
  disabled = false,
  className = ""
}) => {
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Month and day names
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
        isDisabled: true
      });
    }
    
    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isDisabled = (minDate && date < minDate) || (maxDate && date > maxDate);
      
      days.push({
        day,
        date,
        isCurrentMonth: true,
        isDisabled
      });
    }
    
    // Next month's leading days
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        day,
        date,
        isCurrentMonth: false,
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

  const getDayClassName = (dayObj) => {
    const { date, isCurrentMonth, isDisabled } = dayObj;
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
    
    let classes = 'w-10 h-10 flex items-center justify-center text-sm rounded-lg transition-all duration-150 ';
    
    if (!isCurrentMonth || isDisabled) {
      classes += 'text-gray-400 cursor-not-allowed ';
    } else {
      classes += 'text-gray-800 hover:bg-blue-100 cursor-pointer ';
      
      if (isSelected) {
        classes += 'bg-blue-600 text-white font-bold shadow-lg ';
      } else if (isToday) {
        classes += 'bg-orange-500 text-white font-semibold ';
      }
    }
    
    return classes.trim();
  };

  const formatDisplayDate = (date) => {
    if (!date) return placeholder || (language === 'en' ? 'Select date' : 'เลือกวันที่');
    
    const options = {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    };
    
    return date.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', options);
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + direction);
      return newMonth;
    });
  };

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.simple-date-picker-container')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update current month when selected date changes
  useEffect(() => {
    if (selectedDate) {
      setCurrentMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    }
  }, [selectedDate]);

  const calendarDays = generateCalendarDays();

  return (
    <div className={`relative simple-date-picker-container ${className}`}>
      {/* Input Field */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-4 py-3 text-left border-2 rounded-lg transition-all duration-200 flex items-center justify-between
          ${disabled 
            ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed' 
            : 'bg-white border-gray-300 hover:border-blue-500 focus:border-blue-600 focus:ring-4 focus:ring-blue-100'
          }
          ${isOpen ? 'border-blue-600 ring-4 ring-blue-100' : ''}
        `}
      >
        <span className={selectedDate ? 'text-gray-900 font-medium' : 'text-gray-500'}>
          {formatDisplayDate(selectedDate)}
        </span>
        <svg 
          className={`w-5 h-5 text-blue-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
            <button
              type="button"
              onClick={() => navigateMonth(-1)}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <h3 className="text-lg font-bold text-gray-800">
              {monthNames[language][currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            
            <button
              type="button"
              onClick={() => navigateMonth(1)}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Calendar */}
          <div className="p-4">
            {/* Day Names */}
            <div className="grid grid-cols-7 gap-1 mb-3">
              {dayNames[language].map((day, index) => (
                <div key={index} className="p-2 text-center text-xs font-bold text-gray-600 uppercase">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((dayObj, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleDateClick(dayObj)}
                  disabled={dayObj.isDisabled || !dayObj.isCurrentMonth}
                  className={getDayClassName(dayObj)}
                >
                  {dayObj.day}
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-600 rounded"></div>
                <span className="text-gray-600">{language === 'en' ? 'Selected' : 'เลือกแล้ว'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-500 rounded"></div>
                <span className="text-gray-600">{language === 'en' ? 'Today' : 'วันนี้'}</span>
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              {language === 'en' ? 'Close' : 'ปิด'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleDatePicker;
