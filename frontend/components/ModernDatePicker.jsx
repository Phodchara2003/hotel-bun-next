'use client';

import { useState, forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import { Calendar } from 'lucide-react';
import { th } from 'date-fns/locale';
import "react-datepicker/dist/react-datepicker.css";
import "../styles/modern-datepicker.css";

// Custom Input Component
const CustomInput = forwardRef(({ value, onClick, placeholder, label, className }, ref) => (
  <div className={`relative ${className}`}>
    {label && (
      <label className="block text-sm font-bold mb-4 text-white uppercase tracking-wider font-thai">
        {label}
      </label>
    )}
    
    <button
      type="button"
      onClick={onClick}
      ref={ref}
      className="w-full px-8 py-5 text-left border-2 rounded-xl transition-all duration-300 font-semibold shadow-lg bg-gradient-to-r from-white to-emerald-50 border-emerald-400 hover:border-emerald-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-300 hover:shadow-xl transform hover:scale-105 text-lg"
    >
      <div className="flex items-center justify-between">
        <span className={value ? 'text-emerald-900' : 'text-emerald-700'}>
          {value || placeholder}
        </span>
        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-emerald-600" />
          <svg 
            className="w-5 h-5 text-emerald-600 transition-transform duration-300"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </button>
  </div>
));

CustomInput.displayName = 'CustomInput';

const ModernDatePicker = ({ 
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

  const formatDisplayDate = (date) => {
    if (!date) return placeholder;
    
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    
    return date.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', options);
  };

  return (
    <div className={`modern-datepicker relative ${className}`}>
        <DatePicker
          selected={selectedDate}
          onChange={(date) => {
            onDateSelect(date);
            setIsOpen(false);
          }}
          onCalendarOpen={() => setIsOpen(true)}
          onCalendarClose={() => setIsOpen(false)}
          minDate={minDate}
          maxDate={maxDate}
          disabled={disabled}
          locale={language === 'th' ? th : undefined}
          dateFormat="dd/MM/yyyy"
          placeholderText={placeholder}
          customInput={
            <CustomInput 
              placeholder={placeholder}
              label={label}
              className={className}
            />
          }
          popperClassName="modern-datepicker-popper"
          calendarClassName="modern-datepicker-calendar"
          popperProps={{
            positionFixed: true,
            strategy: 'fixed'
          }}
          renderCustomHeader={({
            date,
            decreaseMonth,
            increaseMonth,
            prevMonthButtonDisabled,
            nextMonthButtonDisabled
          }) => (
            <div className="flex items-center justify-between px-4 py-2">
              <button
                type="button"
                onClick={decreaseMonth}
                disabled={prevMonthButtonDisabled}
                className="p-2 hover:bg-white/10 rounded-full transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="text-white font-bold text-lg">
                {date.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {
                  month: 'long',
                  year: 'numeric'
                })}
              </div>
              
              <button
                type="button"
                onClick={increaseMonth}
                disabled={nextMonthButtonDisabled}
                className="p-2 hover:bg-white/10 rounded-full transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        />
      </div>
  );
};

export default ModernDatePicker;