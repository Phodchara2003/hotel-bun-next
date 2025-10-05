'use client';

import { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Users } from 'lucide-react';

const NewDatePicker = ({ 
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
        <label className="block text-sm font-bold mb-4 text-white uppercase tracking-wider font-thai">
          {label}
        </label>
      )}
      
      {/* Input Field */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-6 py-4 text-left border-2 rounded-xl transition-all duration-300 font-semibold shadow-lg
          ${disabled 
            ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed' 
            : 'bg-gradient-to-r from-white to-emerald-50 border-emerald-400 hover:border-emerald-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-300 hover:shadow-xl transform hover:scale-105'
          }
          ${isOpen ? 'border-emerald-600 ring-2 ring-emerald-300 shadow-xl scale-105' : ''}
        `}
      >
        <div className="flex items-center justify-between">
          <span className={selectedDate ? 'text-emerald-900' : 'text-emerald-700'}>
            {formatDisplayDate(selectedDate)}
          </span>
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <svg 
              className={`w-5 h-5 text-emerald-600 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div 
          className="absolute top-full left-0 right-0 mt-3 rounded-3xl shadow-2xl z-50 overflow-hidden border-2 backdrop-blur-xl"
          style={{ 
            background: 'linear-gradient(135deg, rgba(18, 43, 41, 0.98) 0%, rgba(15, 38, 35, 0.95) 30%, rgba(13, 31, 29, 0.98) 70%, rgba(11, 25, 23, 0.99) 100%)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          }}
        >
          {/* Calendar Header */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 via-emerald-700/10 to-emerald-800/20"></div>
            <div className="relative flex items-center justify-between px-8 py-8">
              <button
                type="button"
                onClick={() => navigateMonth(-1)}
                className="group relative p-4 bg-white/5 hover:bg-white/15 rounded-2xl transition-all duration-300 hover:scale-110 hover:shadow-xl border border-white/10 hover:border-white/30"
              >
                <ChevronLeft className="w-7 h-7 text-white group-hover:text-emerald-100 transition-colors" strokeWidth={2.5} />
                <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
              
              <div className="relative">
                <div className="absolute inset-0 bg-white/5 rounded-3xl blur-xl"></div>
                <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl px-10 py-4 rounded-3xl border border-white/20 shadow-2xl">
                  <h3 className="text-2xl font-bold text-center text-white drop-shadow-2xl tracking-wide">
                    {monthNames[language][currentMonth.getMonth()]}
                  </h3>
                  <p className="text-lg text-center text-emerald-100 font-semibold mt-1">
                    {currentMonth.getFullYear()}
                  </p>
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => navigateMonth(1)}
                className="group relative p-4 bg-white/5 hover:bg-white/15 rounded-2xl transition-all duration-300 hover:scale-110 hover:shadow-xl border border-white/10 hover:border-white/30"
              >
                <ChevronRight className="w-7 h-7 text-white group-hover:text-emerald-100 transition-colors" strokeWidth={2.5} />
                <div className="absolute inset-0 bg-gradient-to-l from-white/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
            </div>
          </div>

          {/* Day Names Header */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-700/30 to-emerald-800/20"></div>
            <div className="relative grid grid-cols-7 gap-1 p-4 bg-white/5">
              {dayNames[language].map((day, index) => (
                <div key={index} className="text-center py-3">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/10 border border-white/20">
                    <span className="text-sm font-bold text-emerald-100 tracking-wider">
                      {day}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="relative p-4">
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((dayObj, index) => (
                <div key={index} className="aspect-square">
                  <button
                    type="button"
                    onClick={() => handleDateClick(dayObj)}
                    onKeyPress={(e) => handleKeyPress(e, dayObj)}
                    onMouseEnter={() => setHighlightedDate(dayObj.date)}
                    onMouseLeave={() => setHighlightedDate(null)}
                    disabled={dayObj.isDisabled}
                    className={`
                      group relative w-full h-full rounded-2xl font-bold text-base transition-all duration-300 focus:outline-none focus:z-20 border-2
                      ${!dayObj.isCurrentMonth 
                        ? 'text-gray-500 cursor-not-allowed bg-black/10 border-transparent' 
                        : dayObj.isDisabled
                          ? 'text-gray-500 cursor-not-allowed bg-black/10 border-transparent'
                          : 'text-white bg-white/5 border-white/10 hover:bg-white/15 hover:border-white/30 hover:scale-105 hover:shadow-xl hover:z-10'
                      }
                      ${dayObj.isSelected 
                        ? 'bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 text-white shadow-2xl ring-4 ring-emerald-300/50 ring-offset-2 ring-offset-emerald-800 scale-105 z-20 border-emerald-300' 
                        : ''
                      }
                      ${dayObj.isToday && !dayObj.isSelected 
                        ? 'bg-gradient-to-br from-white to-emerald-50 text-emerald-900 shadow-xl border-emerald-300 ring-2 ring-emerald-200' 
                        : ''
                      }
                      ${highlightedDate && 
                        highlightedDate.toDateString() === dayObj.date.toDateString() && 
                        !dayObj.isSelected && 
                        !dayObj.isDisabled && 
                        dayObj.isCurrentMonth
                        ? 'bg-white/25 text-white scale-105 shadow-lg z-10 border-white/40' 
                        : ''
                      }
                    `}
                  >
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <span className="relative z-10">{dayObj.day}</span>
                    
                    {/* Today indicator */}
                    {dayObj.isToday && !dayObj.isSelected && (
                      <div className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-lg"></div>
                    )}
                
                    {/* Selected indicator */}
                    {dayObj.isSelected && (
                      <div className="absolute inset-1 border-2 border-white/50 rounded-xl pointer-events-none"></div>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="relative px-8 py-6">
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-800/20 to-transparent"></div>
            <div className="relative flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  onDateSelect(new Date());
                  setIsOpen(false);
                }}
                className="group relative px-8 py-4 bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 text-white rounded-2xl font-bold text-base transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-2xl border border-emerald-400"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="relative flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>{language === 'en' ? 'Today' : 'วันนี้'}</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="group px-6 py-3 text-emerald-100 hover:text-white bg-white/5 hover:bg-white/15 rounded-xl transition-all duration-300 font-semibold border border-white/10 hover:border-white/30"
              >
                <span className="flex items-center space-x-2">
                  <span>{language === 'en' ? 'Close' : 'ปิด'}</span>
                  <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewDatePicker;