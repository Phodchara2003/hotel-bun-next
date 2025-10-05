'use client';

import { forwardRef } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { CalendarIcon } from '@heroicons/react/24/outline';
import th from 'date-fns/locale/th';
import "react-datepicker/dist/react-datepicker.css";
import "../styles/datepicker.css";

// Register Thai locale
registerLocale('th', th);

// Custom Input Component
const CustomInput = forwardRef(({ value, onClick, placeholder, className, style, label }, ref) => (
  <div className="relative">
    {label && (
      <label className="block text-sm font-semibold mb-3 text-white uppercase tracking-wider font-thai">
        {label}
      </label>
    )}
    <div className={`relative ${className || ''}`} style={style}>
      <input
        ref={ref}
        value={value}
        onClick={onClick}
        placeholder={placeholder}
        readOnly
        className="w-full px-4 py-4 pr-12 border-2 border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-400 font-thai cursor-pointer transition-all duration-300 hover:border-emerald-500"
        style={{
          position: 'relative',
          zIndex: 101,
          pointerEvents: 'auto',
          borderColor: '#122b29'
        }}
      />
      <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-emerald-700 pointer-events-none" style={{ color: '#122b29' }} />
    </div>
  </div>
));

CustomInput.displayName = 'CustomInput';

const BeautifulDatePicker = ({ 
  selected, 
  onChange, 
  minDate, 
  maxDate, 
  placeholder = "เลือกวันที่",
  label = "",
  className = "",
  style = {},
  excludeDates = [],
  dateFormat = "dd/MM/yyyy"
}) => {
  return (
    <div className="beautiful-datepicker">
      <DatePicker
        selected={selected}
        onChange={onChange}
        minDate={minDate}
        maxDate={maxDate}
        excludeDates={excludeDates}
        dateFormat={dateFormat}
        locale="th"
        customInput={
          <CustomInput 
            placeholder={placeholder}
            label={label}
            className={className}
            style={style}
          />
        }
        calendarClassName="beautiful-calendar"
        popperClassName="beautiful-popper"
        showMonthDropdown
        showYearDropdown
        dropdownMode="select"
        placeholderText={placeholder}
        autoComplete="off"
        popperPlacement="bottom-start"
        popperModifiers={[
          {
            name: "offset",
            options: {
              offset: [0, 10]
            }
          }
        ]}
        weekDayClassName={(date) => "beautiful-weekday"}
        dayClassName={(date) => "beautiful-day"}
      />
    </div>
  );
};

export default BeautifulDatePicker;