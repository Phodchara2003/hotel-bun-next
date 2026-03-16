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
                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 cursor-pointer bg-white hover:border-gray-400 transition-colors" style={{ '--focus-color': '#082220' }}
      />
      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
    </div>
  </div>
));

CustomInput.displayName = 'CustomInput';

// Custom header component
const CustomHeader = ({ date, decreaseMonth, increaseMonth, prevMonthButtonDisabled, nextMonthButtonDisabled }) => (
  <div className="flex items-center justify-between px-4 py-3 text-white rounded-t-lg" style={{ background: '#082220' }}>
    <button
      onClick={decreaseMonth}
      disabled={prevMonthButtonDisabled}
      className="p-1 hover:bg-white hover:bg-opacity-10 rounded-full transition-colors disabled:opacity-50"
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
      className="p-1 hover:bg-white hover:bg-opacity-10 rounded-full transition-colors disabled:opacity-50"
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
          
          let className = "text-sm rounded-lg transition-all duration-200 transform hover:scale-105 ";
          
          if (isSelected || isStartDate || isEndDate) {
            className += "text-white font-semibold shadow-md ";
          } else if (isInRange) {
            className += "font-medium ";
          } else if (isToday) {
            className += "font-semibold border-2 ";
          } else {
            className += "text-gray-700 ";
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
        
        .react-datepicker__day--selected,
        .react-datepicker__day--in-selecting-range,
        .react-datepicker__day--in-range,
        .react-datepicker__day--keyboard-selected {
          background-color: #082220 !important;
          color: white !important;
        }
        
        .react-datepicker__day--today {
          background-color: rgba(8, 34, 32, 0.1) !important;
          color: #082220 !important;
          border: 2px solid #082220 !important;
        }
        
        .react-datepicker__day--disabled {
          color: #cbd5e1 !important;
          cursor: not-allowed !important;
        }
        
        .react-datepicker__day--outside-month {
          color: #cbd5e1 !important;
        }
        
        .react-datepicker__day:hover:not(.react-datepicker__day--disabled) {
          background-color: rgba(8, 34, 32, 0.1) !important;
          color: #082220 !important;
        }
        
        .react-datepicker__triangle {
          display: none !important;
        }
        
        input:focus {
          border-color: #082220 !important;
          box-shadow: 0 0 0 2px rgba(8, 34, 32, 0.2) !important;
        }
      `}</style>
    </div>
  );
};

export default CustomDatePicker;