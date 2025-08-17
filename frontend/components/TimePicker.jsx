'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/translations';

const TimePicker = ({ 
  label,
  value, 
  onChange, 
  minTime = "06:00",
  maxTime = "23:59",
  step = 30, // 30 minutes intervals
  className = "",
  disabled = false,
  required = false 
}) => {
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  
  const [isOpen, setIsOpen] = useState(false);

  // Generate time slots
  const generateTimeSlots = () => {
    const slots = [];
    const start = parseInt(minTime.split(':')[0]) * 60 + parseInt(minTime.split(':')[1]);
    const end = parseInt(maxTime.split(':')[0]) * 60 + parseInt(maxTime.split(':')[1]);
    
    for (let minutes = start; minutes <= end; minutes += step) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      const timeString = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
      
      // Format for display
      const displayTime = language === 'th' 
        ? `${hours.toString().padStart(2, '0')}.${mins.toString().padStart(2, '0')} น.`
        : timeString;
        
      slots.push({
        value: timeString,
        display: displayTime,
        period: hours < 12 ? (language === 'th' ? 'เช้า' : 'AM') : (language === 'th' ? 'บ่าย/เย็น' : 'PM')
      });
    }
    
    return slots;
  };

  const timeSlots = generateTimeSlots();
  
  const selectedSlot = timeSlots.find(slot => slot.value === value);

  const handleTimeSelect = (timeValue) => {
    onChange(timeValue);
    setIsOpen(false);
  };

  const formatDisplayValue = () => {
    if (!value) {
      return language === 'en' ? 'Select time' : 'เลือกเวลา';
    }
    return selectedSlot ? selectedSlot.display : value;
  };

  const getTimePeriodColor = (period) => {
    if (language === 'th') {
      return period === 'เช้า' ? 'text-blue-600' : 'text-orange-600';
    } else {
      return period === 'AM' ? 'text-blue-600' : 'text-orange-600';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {/* Time Input Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-4 py-3 text-left border rounded-lg transition-all duration-200 flex items-center justify-between
          ${disabled 
            ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed' 
            : 'bg-white border-gray-300 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 cursor-pointer'
          }
          ${isOpen ? 'border-blue-500 ring-2 ring-blue-200' : ''}
        `}
      >
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className={value ? 'text-gray-900' : 'text-gray-500'}>
            {formatDisplayValue()}
          </span>
        </div>
        
        <svg 
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Time Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white">
            <h4 className="font-medium text-center">
              {language === 'en' ? 'Select Time' : 'เลือกเวลา'}
            </h4>
          </div>

          {/* Time Slots */}
          <div className="p-2">
            {timeSlots.map((slot, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleTimeSelect(slot.value)}
                className={`
                  w-full px-3 py-2 text-left rounded-md transition-all duration-150 flex items-center justify-between
                  ${slot.value === value 
                    ? 'bg-blue-500 text-white' 
                    : 'hover:bg-blue-50 text-gray-700'
                  }
                `}
              >
                <span className="font-medium">{slot.display}</span>
                <span className={`text-xs ${slot.value === value ? 'text-blue-200' : getTimePeriodColor(slot.period)}`}>
                  {slot.period}
                </span>
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-gray-50 border-t flex justify-between items-center">
            <span className="text-xs text-gray-500">
              {language === 'en' ? `${timeSlots.length} available times` : `${timeSlots.length} เวลาที่เลือกได้`}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {language === 'en' ? 'Close' : 'ปิด'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimePicker;
