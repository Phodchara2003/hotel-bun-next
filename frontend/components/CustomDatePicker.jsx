'use client';

import { useState, forwardRef } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { th } from 'date-fns/locale';
import "react-datepicker/dist/react-datepicker.css";

registerLocale('th', th);

// Custom input component
const CustomInput = forwardRef(({ value, onClick, placeholder, label, required }, ref) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      <input
        ref={ref}
        value={value}
        onClick={onClick}
        placeholder={placeholder}
        readOnly
        required={required}
        className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer bg-white hover:border-blue-400 transition-colors"
      />
      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
    </div>
  </div>
));

CustomInput.displayName = 'CustomInput';

// Custom header component
const CustomHeader = ({ date, decreaseMonth, increaseMonth, prevMonthButtonDisabled, nextMonthButtonDisabled }) => (
  <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
    <button
      onClick={decreaseMonth}
      disabled={prevMonthButtonDisabled}
      className="p-1 hover:bg-blue-800 rounded-full transition-colors disabled:opacity-50"
      type="button"
    >
      <ChevronLeft className="h-5 w-5" />
    </button>
    
    <div className="text-lg font-semibold">
      {date.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
    </div>
    
    <button
      onClick={increaseMonth}
      disabled={nextMonthButtonDisabled}
      className="p-1 hover:bg-blue-800 rounded-full transition-colors disabled:opacity-50"
      type="button"
    >
      <ChevronRight className="h-5 w-5" />
    </button>
  </div>
);

const CustomDatePicker = ({ 
  selected, 
  onChange, 
  label, 
  placeholder, 
  minDate, 
  maxDate, 
  excludeDates,
  required = false,
  name,
  selectsStart,
  selectsEnd,
  startDate,
  endDate
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <DatePicker
        selected={selected}
        onChange={onChange}
        minDate={minDate}
        maxDate={maxDate}
        excludeDates={excludeDates}
        selectsStart={selectsStart}
        selectsEnd={selectsEnd}
        startDate={startDate}
        endDate={endDate}
        customInput={
          <CustomInput 
            label={label} 
            placeholder={placeholder} 
            required={required}
          />
        }
        renderCustomHeader={CustomHeader}
        dateFormat="dd/MM/yyyy"
        locale="th"
        showPopperArrow={false}
        popperClassName="custom-datepicker-popper"
        calendarClassName="custom-datepicker-calendar"
        dayClassName={(date) => {
          const today = new Date();
          const isToday = date.toDateString() === today.toDateString();
          const isSelected = selected && date.toDateString() === selected.toDateString();
          const isStartDate = startDate && date.toDateString() === startDate.toDateString();
          const isEndDate = endDate && date.toDateString() === endDate.toDateString();
          const isInRange = startDate && endDate && date > startDate && date < endDate;
          
          let className = "text-sm rounded-lg hover:bg-blue-100 transition-all duration-200 transform hover:scale-105 ";
          
          if (isSelected || isStartDate || isEndDate) {
            className += "bg-gradient-to-br from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 font-semibold shadow-md ";
          } else if (isInRange) {
            className += "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-900 font-medium ";
          } else if (isToday) {
            className += "bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-800 font-semibold border-2 border-emerald-300 ";
          } else {
            className += "text-gray-700 hover:text-blue-600 ";
          }
          
          return className;
        }}
        onCalendarOpen={() => setIsOpen(true)}
        onCalendarClose={() => setIsOpen(false)}
        placeholderText={placeholder}
        autoComplete="off"
      />
      
      <style jsx global>{`
        .custom-datepicker-popper {
          z-index: 9999 !important;
        }
        
        .custom-datepicker-calendar {
          border: none !important;
          border-radius: 12px !important;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
          font-family: inherit !important;
        }
        
        .react-datepicker__header {
          background: none !important;
          border: none !important;
          padding: 0 !important;
        }
        
        .react-datepicker__current-month {
          display: none !important;
        }
        
        .react-datepicker__navigation {
          display: none !important;
        }
        
        .react-datepicker__day-names {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%) !important;
          padding: 12px 0 !important;
          margin: 0 !important;
          border-bottom: 1px solid #e2e8f0 !important;
        }
        
        .react-datepicker__day-name {
          color: #475569 !important;
          font-weight: 700 !important;
          font-size: 0.75rem !important;
          width: 2.5rem !important;
          line-height: 2rem !important;
          text-transform: uppercase !important;
        }
        
        .react-datepicker__month {
          margin: 0 !important;
          padding: 16px !important;
        }
        
        .react-datepicker__week {
          display: flex !important;
          justify-content: space-between !important;
        }
        
        .react-datepicker__day {
          width: 2.5rem !important;
          height: 2.5rem !important;
          line-height: 2.5rem !important;
          margin: 2px !important;
          border-radius: 8px !important;
          font-size: 0.875rem !important;
          font-weight: 500 !important;
        }
        
        .react-datepicker__day--disabled {
          color: #cbd5e1 !important;
          cursor: not-allowed !important;
        }
        
        .react-datepicker__day--outside-month {
          color: #cbd5e1 !important;
        }
        
        .react-datepicker__day:hover:not(.react-datepicker__day--disabled) {
          background-color: #dbeafe !important;
          color: #1e40af !important;
        }
        
        .react-datepicker__triangle {
          display: none !important;
        }
      `}</style>
    </div>
  );
};

export default CustomDatePicker;