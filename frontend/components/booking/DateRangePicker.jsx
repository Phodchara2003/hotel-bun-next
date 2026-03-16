'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/translations';

const DateRangePicker = ({ 
  checkInDate, 
  checkOutDate, 
  onDateRangeSelect,
  minDate = new Date(),
  maxDate = null,
  className = "",
  disabled = false 
}) => {
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectingCheckOut, setSelectingCheckOut] = useState(false);
  const [hoveredDate, setHoveredDate] = useState(null);

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

  // Generate calendar for two months
  const generateCalendarDays = (monthOffset = 0) => {
    const targetMonth = new Date(currentMonth);
    targetMonth.setMonth(currentMonth.getMonth() + monthOffset);
    
    const year = targetMonth.getFullYear();
    const month = targetMonth.getMonth();
    
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
    
    return { days, month: targetMonth };
  };

  const handleDateClick = (dayObj) => {
    if (dayObj.isDisabled || !dayObj.isCurrentMonth) return;
    
    if (!checkInDate || selectingCheckOut) {
      // Setting check-in date or we're in check-out selection mode
      if (!selectingCheckOut) {
        onDateRangeSelect(dayObj.date, null);
        setSelectingCheckOut(true);
      } else {
        // Setting check-out date
        if (dayObj.date > checkInDate) {
          onDateRangeSelect(checkInDate, dayObj.date);
          setSelectingCheckOut(false);
          setIsOpen(false);
        } else {
          // If selected date is before check-in, start over
          onDateRangeSelect(dayObj.date, null);
        }
      }
    } else {
      // If both dates are set, start over
      onDateRangeSelect(dayObj.date, null);
      setSelectingCheckOut(true);
    }
  };

  const isDateInRange = (date) => {
    if (!checkInDate || !checkOutDate) return false;
    return date >= checkInDate && date <= checkOutDate;
  };

  const isDateInHoverRange = (date) => {
    if (!checkInDate || !hoveredDate || checkOutDate) return false;
    const start = checkInDate;
    const end = hoveredDate;
    return date >= start && date <= end && end > start;
  };

  const getDayClassName = (dayObj) => {
    const { date, isCurrentMonth, isDisabled } = dayObj;
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    const isCheckIn = checkInDate && date.toDateString() === checkInDate.toDateString();
    const isCheckOut = checkOutDate && date.toDateString() === checkOutDate.toDateString();
    const inRange = isDateInRange(date);
    const inHoverRange = isDateInHoverRange(date);
    
    let classes = 'relative p-3 text-sm transition-all duration-150 focus:outline-none ';
    
    if (!isCurrentMonth || isDisabled) {
      classes += 'text-gray-300 cursor-not-allowed ';
    } else {
      classes += 'text-gray-700 hover:bg-blue-50 cursor-pointer ';
    }
    
    if (isCheckIn) {
      classes += 'bg-blue-500 text-white font-semibold ';
    } else if (isCheckOut) {
      classes += 'bg-green-500 text-white font-semibold ';
    } else if (inRange) {
      classes += 'bg-blue-100 text-blue-700 ';
    } else if (inHoverRange) {
      classes += 'bg-blue-50 text-blue-600 ';
    } else if (isToday) {
      classes += 'bg-gray-100 text-gray-900 font-semibold ';
    }
    
    return classes.trim();
  };

  const formatDisplayDate = (date) => {
    if (!date) return language === 'en' ? 'Select date' : 'เลือกวันที่';
    
    const options = {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    };
    
    return date.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', options);
  };

  const calculateNights = () => {
    if (!checkInDate || !checkOutDate) return 0;
    const diffTime = Math.abs(checkOutDate - checkInDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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
      if (!event.target.closest('.date-range-picker-container')) {
        setIsOpen(false);
        setSelectingCheckOut(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const leftCalendar = generateCalendarDays(0);
  const rightCalendar = generateCalendarDays(1);

  return (
    <div className={`relative date-range-picker-container ${className}`}>
      {/* Input Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Check-in Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {language === 'en' ? 'Check-in Date' : 'วันเช็คอิน'} 
            {selectingCheckOut && (
              <span className="text-blue-600 ml-2">✓</span>
            )}
          </label>
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
              ${selectingCheckOut ? 'bg-blue-50 border-blue-300' : ''}
            `}
          >
            <div className="flex items-center justify-between">
              <span className={checkInDate ? 'text-gray-900' : 'text-gray-500'}>
                {formatDisplayDate(checkInDate)}
              </span>
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </button>
        </div>

        {/* Check-out Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {language === 'en' ? 'Check-out Date' : 'วันเช็คเอาท์'}
            {!selectingCheckOut && checkInDate && (
              <span className="text-green-600 ml-2">
                {language === 'en' ? '← Select check-out' : '← เลือกวันเช็คเอาท์'}
              </span>
            )}
          </label>
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled || !checkInDate}
            className={`
              w-full px-4 py-3 text-left border rounded-lg transition-all duration-200
              ${disabled || !checkInDate
                ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-white border-gray-300 hover:border-green-400 focus:border-green-500 focus:ring-2 focus:ring-green-200'
              }
              ${isOpen && selectingCheckOut ? 'border-green-500 ring-2 ring-green-200' : ''}
              ${!selectingCheckOut && checkInDate && !checkOutDate ? 'bg-green-50 border-green-300' : ''}
            `}
          >
            <div className="flex items-center justify-between">
              <span className={checkOutDate ? 'text-gray-900' : 'text-gray-500'}>
                {formatDisplayDate(checkOutDate)}
              </span>
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </button>
        </div>
      </div>

      {/* Nights Counter */}
      {checkInDate && checkOutDate && (
        <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-center space-x-2 text-sm">
            <span className="text-gray-600">
              {language === 'en' ? 'Duration:' : 'ระยะเวลา:'}
            </span>
            <span className="font-semibold text-blue-700">
              {calculateNights()} {language === 'en' ? 'nights' : 'คืน'}
            </span>
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </div>
        </div>
      )}

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-500 to-green-500 text-white">
            <button
              type="button"
              onClick={() => navigateMonth(-1)}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="text-center">
              <h3 className="text-lg font-semibold">
                {language === 'en' ? 'Select Your Stay Dates' : 'เลือกวันที่เข้าพัก'}
              </h3>
              <p className="text-sm text-white/80">
                {selectingCheckOut 
                  ? (language === 'en' ? 'Select check-out date' : 'เลือกวันเช็คเอาท์')
                  : (language === 'en' ? 'Select check-in date' : 'เลือกวันเช็คอิน')
                }
              </p>
            </div>
            
            <button
              type="button"
              onClick={() => navigateMonth(1)}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Two Month Calendar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x">
            {[leftCalendar, rightCalendar].map((calendar, calendarIndex) => (
              <div key={calendarIndex} className="p-4">
                {/* Month Header */}
                <h4 className="text-center font-semibold text-gray-800 mb-4">
                  {monthNames[language][calendar.month.getMonth()]} {calendar.month.getFullYear()}
                </h4>

                {/* Day Names */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {dayNames[language].map((day, index) => (
                    <div key={index} className="p-2 text-center text-xs font-medium text-gray-600">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {calendar.days.map((dayObj, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleDateClick(dayObj)}
                      onMouseEnter={() => setHoveredDate(dayObj.date)}
                      onMouseLeave={() => setHoveredDate(null)}
                      disabled={dayObj.isDisabled || !dayObj.isCurrentMonth}
                      className={getDayClassName(dayObj)}
                    >
                      {dayObj.day}
                      
                      {/* Check-in indicator */}
                      {checkInDate && dayObj.date.toDateString() === checkInDate.toDateString() && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-xs text-white font-bold">→</span>
                        </div>
                      )}
                      
                      {/* Check-out indicator */}
                      {checkOutDate && dayObj.date.toDateString() === checkOutDate.toDateString() && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-600 rounded-full flex items-center justify-center">
                          <span className="text-xs text-white font-bold">✓</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>{language === 'en' ? 'Check-in' : 'เช็คอิน'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>{language === 'en' ? 'Check-out' : 'เช็คเอาท์'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-100 rounded"></div>
                  <span>{language === 'en' ? 'Stay period' : 'ช่วงเข้าพัก'}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    onDateRangeSelect(null, null);
                    setSelectingCheckOut(false);
                  }}
                  className="text-gray-600 hover:text-gray-800 text-sm"
                >
                  {language === 'en' ? 'Clear' : 'ล้าง'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setSelectingCheckOut(false);
                  }}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 text-sm"
                >
                  {language === 'en' ? 'Done' : 'เสร็จสิ้น'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
