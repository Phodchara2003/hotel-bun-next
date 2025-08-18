'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';

const SimpleDatePicker = ({ 
  checkInDate, 
  checkOutDate, 
  onDateRangeSelect,
  unavailableDates = [],
  className = "",
  disabled = false 
}) => {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');

  // Format date for input type="date" (YYYY-MM-DD)
  const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  // Update local state when props change
  useEffect(() => {
    setCheckIn(formatDateForInput(checkInDate));
    setCheckOut(formatDateForInput(checkOutDate));
  }, [checkInDate, checkOutDate]);

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Get minimum checkout date (day after checkin)
  const getMinCheckOutDate = () => {
    if (!checkIn) return getMinDate();
    const checkInDate = new Date(checkIn);
    checkInDate.setDate(checkInDate.getDate() + 1);
    return checkInDate.toISOString().split('T')[0];
  };

  // Check if date is unavailable
  const isDateUnavailable = (dateString) => {
    return unavailableDates.includes(dateString);
  };

  // Handle check-in date change
  const handleCheckInChange = (e) => {
    const selectedDate = e.target.value;
    setCheckIn(selectedDate);

    if (isDateUnavailable(selectedDate)) {
      alert('วันที่เลือกไม่ว่าง กรุณาเลือกวันที่อื่น');
      return;
    }

    // If checkout is before or same as new checkin, clear checkout
    if (checkOut && selectedDate >= checkOut) {
      setCheckOut('');
      onDateRangeSelect(new Date(selectedDate), null);
    } else {
      onDateRangeSelect(
        new Date(selectedDate), 
        checkOut ? new Date(checkOut) : null
      );
    }
  };

  // Handle check-out date change
  const handleCheckOutChange = (e) => {
    const selectedDate = e.target.value;
    setCheckOut(selectedDate);

    if (isDateUnavailable(selectedDate)) {
      alert('วันที่เลือกไม่ว่าง กรุณาเลือกวันที่อื่น');
      return;
    }

    onDateRangeSelect(
      checkIn ? new Date(checkIn) : null,
      new Date(selectedDate)
    );
  };

  // Calculate nights
  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = end - start;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const nights = calculateNights();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Date Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Check-in Date */}
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-2">
            <Calendar className="inline h-4 w-4 mr-1" />
            วันเข้าพัก
          </label>
          <input
            type="date"
            value={checkIn}
            onChange={handleCheckInChange}
            min={getMinDate()}
            disabled={disabled}
            className={`
              w-full px-4 py-3 border rounded-lg transition-all duration-200
              focus:border-blue-500 focus:ring-2 focus:ring-blue-200
              ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-900'}
              ${isDateUnavailable(checkIn) ? 'border-red-300 bg-red-50' : 'border-gray-300'}
            `}
          />
          {isDateUnavailable(checkIn) && (
            <p className="text-sm text-red-600 mt-1">วันที่นี้ไม่ว่าง</p>
          )}
        </div>

        {/* Check-out Date */}
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-2">
            <Calendar className="inline h-4 w-4 mr-1" />
            วันออก
          </label>
          <input
            type="date"
            value={checkOut}
            onChange={handleCheckOutChange}
            min={getMinCheckOutDate()}
            disabled={disabled || !checkIn}
            className={`
              w-full px-4 py-3 border rounded-lg transition-all duration-200
              focus:border-blue-500 focus:ring-2 focus:ring-blue-200
              ${disabled || !checkIn ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-900'}
              ${isDateUnavailable(checkOut) ? 'border-red-300 bg-red-50' : 'border-gray-300'}
            `}
          />
          {isDateUnavailable(checkOut) && (
            <p className="text-sm text-red-600 mt-1">วันที่นี้ไม่ว่าง</p>
          )}
        </div>
      </div>

      {/* Summary */}
      {checkIn && checkOut && nights > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <p className="text-sm font-medium text-gray-800">วันเข้าพัก</p>
                <p className="text-lg text-gray-900 font-semibold">
                  {new Date(checkIn).toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">วันออก</p>
                <p className="text-lg text-gray-900 font-semibold">
                  {new Date(checkOut).toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">จำนวนคืน</p>
                <p className="text-lg font-bold text-gray-900">{nights} คืน</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unavailable Dates Info */}
      {unavailableDates.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-2">ข้อมูลวันที่ไม่ว่าง</h4>
          <div className="text-sm text-gray-700">
            <p className="mb-2">วันที่ต่อไปนี้มีการจองแล้ว:</p>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2 max-h-20 overflow-y-auto">
              {unavailableDates.slice(0, 15).map((date, index) => (
                <span key={index} className="px-2 py-1 bg-yellow-100 rounded text-xs">
                  {new Date(date).toLocaleDateString('th-TH', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              ))}
              {unavailableDates.length > 15 && (
                <span className="text-xs text-gray-600">และอีก {unavailableDates.length - 15} วัน...</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Select Buttons */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-800">เลือกช่วงเวลาด่วน:</p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'คืนนี้', nights: 1 },
            { label: 'สุดสัปดาห์นี้', nights: 2 },
            { label: '1 สัปดาห์', nights: 7 },
            { label: '2 สัปดาห์', nights: 14 }
          ].map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => {
                const today = new Date();
                const checkInDate = today.toISOString().split('T')[0];
                const checkOutDate = new Date(today);
                checkOutDate.setDate(today.getDate() + option.nights);
                const checkOutStr = checkOutDate.toISOString().split('T')[0];
                
                // Check if any dates in range are unavailable
                const hasUnavailable = unavailableDates.some(unavailableDate => {
                  return unavailableDate >= checkInDate && unavailableDate < checkOutStr;
                });
                
                if (!hasUnavailable) {
                  setCheckIn(checkInDate);
                  setCheckOut(checkOutStr);
                  onDateRangeSelect(new Date(checkInDate), new Date(checkOutStr));
                } else {
                  alert('ช่วงเวลาที่เลือกมีวันที่ไม่ว่าง กรุณาเลือกวันที่อื่น');
                }
              }}
              disabled={disabled}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-50 text-gray-800"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SimpleDatePicker;
