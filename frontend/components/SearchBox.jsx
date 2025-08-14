'use client';

import { useState } from 'react';
import { Calendar, Users } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../translations';

const SearchBox = ({ className = "" }) => {
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const [searchData, setSearchData] = useState({
    checkIn: '',
    checkOut: '',
    guests: 1
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 ${className}`}>
      <div className="text-center">
        <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {t('hero.search')}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {language === 'en' 
            ? 'View all rooms and special prices below'
            : 'ดูห้องพักทั้งหมดและราคาพิเศษด้านล่าง'
          }
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
          {/* Check-in Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-center">
              <Calendar className="h-4 w-4 mr-1" />
              {t('hero.checkIn')}
            </label>
            <input
              type="date"
              name="checkIn"
              value={searchData.checkIn}
              onChange={handleInputChange}
              min={new Date().toISOString().split('T')[0]}
              className="input-field text-center"
            />
          </div>

          {/* Check-out Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-center">
              <Calendar className="h-4 w-4 mr-1" />
              {t('hero.checkOut')}
            </label>
            <input
              type="date"
              name="checkOut"
              value={searchData.checkOut}
              onChange={handleInputChange}
              min={searchData.checkIn || new Date().toISOString().split('T')[0]}
              className="input-field text-center"
            />
          </div>

          {/* Guests */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-center">
              <Users className="h-4 w-4 mr-1" />
              {t('hero.guests')}
            </label>
            <select
              name="guests"
              value={searchData.guests}
              onChange={handleInputChange}
              className="input-field text-center"
            >
              {[...Array(8)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1} {language === 'en' ? 'Guest' + (i > 0 ? 's' : '') : 'คน'}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          💡 {language === 'en' 
            ? 'Select dates and number of guests, then scroll down to see available rooms'
            : 'เลือกวันที่และจำนวนผู้เข้าพักแล้วเลื่อนลงไปดูห้องพักที่พร้อมให้บริการ'
          }
        </div>
      </div>
    </div>
  );
};

export default SearchBox;
