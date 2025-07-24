'use client';

import { useState } from 'react';
import { Calendar, Filter, RefreshCw, Download, Eye, Settings } from 'lucide-react';

export default function AdvancedFilters({
  reportType,
  setReportType,
  period,
  setPeriod,
  dateRange,
  setDateRange,
  customFilters,
  setCustomFilters,
  onApplyFilters,
  onResetFilters,
  onExport
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [quickPreset, setQuickPreset] = useState('');

  // Quick date presets
  const datePresets = [
    { 
      key: 'today', 
      label: 'วันนี้',
      getRange: () => {
        const today = new Date().toISOString().split('T')[0];
        return { startDate: today, endDate: today };
      }
    },
    { 
      key: 'thisWeek', 
      label: 'สัปดาห์นี้',
      getRange: () => {
        const today = new Date();
        const monday = new Date(today);
        monday.setDate(today.getDate() - today.getDay() + 1);
        return {
          startDate: monday.toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0]
        };
      }
    },
    { 
      key: 'thisMonth', 
      label: 'เดือนนี้',
      getRange: () => {
        const now = new Date();
        return {
          startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
          endDate: now.toISOString().split('T')[0]
        };
      }
    },
    { 
      key: 'lastMonth', 
      label: 'เดือนที่แล้ว',
      getRange: () => {
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        return {
          startDate: lastMonth.toISOString().split('T')[0],
          endDate: endOfLastMonth.toISOString().split('T')[0]
        };
      }
    },
    { 
      key: 'last3Months', 
      label: '3 เดือนที่แล้ว',
      getRange: () => {
        const now = new Date();
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        return {
          startDate: threeMonthsAgo.toISOString().split('T')[0],
          endDate: now.toISOString().split('T')[0]
        };
      }
    },
    { 
      key: 'thisYear', 
      label: 'ปีนี้',
      getRange: () => {
        const now = new Date();
        return {
          startDate: new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0],
          endDate: now.toISOString().split('T')[0]
        };
      }
    }
  ];

  // Handle preset selection
  const handlePresetChange = (presetKey) => {
    setQuickPreset(presetKey);
    const preset = datePresets.find(p => p.key === presetKey);
    if (preset) {
      setDateRange(preset.getRange());
    }
  };

  // Advanced filter options
  const statusOptions = [
    { value: '', label: 'ทั้งหมด' },
    { value: 'pending', label: 'รอการยืนยัน' },
    { value: 'confirmed', label: 'ยืนยันแล้ว' },
    { value: 'completed', label: 'สำเร็จแล้ว' },
    { value: 'cancelled', label: 'ยกเลิกแล้ว' }
  ];

  const roomTypeOptions = [
    { value: '', label: 'ทุกประเภท' },
    { value: 'standard', label: 'Standard Room' },
    { value: 'deluxe', label: 'Deluxe Room' },
    { value: 'suite', label: 'Suite Room' },
    { value: 'family', label: 'Family Room' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 lg:mb-0 flex items-center">
          <Filter className="h-5 w-5 mr-2" />
          🔍 ตัวกรองขั้นสูง
        </h3>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              showAdvanced ? 
              'bg-blue-600 text-white' : 
              'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Settings className="h-4 w-4 inline mr-2" />
            ตัวกรองเพิ่มเติม
          </button>
          
          <button
            onClick={onApplyFilters}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <RefreshCw className="h-4 w-4 inline mr-2" />
            ใช้ตัวกรอง
          </button>
          
          <button
            onClick={onResetFilters}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            รีเซ็ต
          </button>
        </div>
      </div>

      {/* Basic Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Report Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📊 ประเภทรายงาน
          </label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="financial">💰 รายงานการเงิน</option>
            <option value="occupancy">🏨 รายงานการเข้าพัก</option>
          </select>
        </div>

        {/* Period */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ⏱️ ช่วงเวลา
          </label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="daily">📅 รายวัน</option>
            <option value="monthly">📊 รายเดือน</option>
            <option value="yearly">📈 รายปี</option>
          </select>
        </div>

        {/* Quick Presets */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ⚡ ช่วงวันที่แบบเร็ว
          </label>
          <select
            value={quickPreset}
            onChange={(e) => handlePresetChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">เลือกช่วงวันที่...</option>
            {datePresets.map(preset => (
              <option key={preset.key} value={preset.key}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>

        {/* Export Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📤 ส่งออกข้อมูล
          </label>
          <button
            onClick={onExport}
            className="w-full p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Download className="h-4 w-4 inline mr-2" />
            ส่งออก PDF
          </button>
        </div>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📅 วันที่เริ่มต้น
          </label>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => {
              setDateRange(prev => ({ ...prev, startDate: e.target.value }));
              setQuickPreset(''); // Clear preset when manually changing
            }}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📅 วันที่สิ้นสุด
          </label>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => {
              setDateRange(prev => ({ ...prev, endDate: e.target.value }));
              setQuickPreset(''); // Clear preset when manually changing
            }}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            🔧 ตัวกรองขั้นสูง
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Booking Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📋 สถานะการจอง
              </label>
              <select
                value={customFilters?.status || ''}
                onChange={(e) => setCustomFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Room Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🏨 ประเภทห้อง
              </label>
              <select
                value={customFilters?.roomType || ''}
                onChange={(e) => setCustomFilters(prev => ({ ...prev, roomType: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {roomTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Minimum Amount Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                💰 จำนวนเงินขั้นต่ำ
              </label>
              <input
                type="number"
                value={customFilters?.minAmount || ''}
                onChange={(e) => setCustomFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                placeholder="เช่น 1000"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Maximum Amount Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                💰 จำนวนเงินสูงสุด
              </label>
              <input
                type="number"
                value={customFilters?.maxAmount || ''}
                onChange={(e) => setCustomFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                placeholder="เช่น 50000"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Search Filter */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🔍 ค้นหาข้อมูลเพิ่มเติม
              </label>
              <input
                type="text"
                value={customFilters?.search || ''}
                onChange={(e) => setCustomFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="ค้นหาชื่อลูกค้า, อีเมล, หมายเลขการจอง..."
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Filter Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
        <h5 className="font-semibold text-blue-900 mb-2 flex items-center">
          <Eye className="h-4 w-4 mr-2" />
          📋 สรุปตัวกรองปัจจุบัน
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
          <div>
            <span className="font-medium text-blue-800">ประเภท:</span>
            <span className="text-blue-700 ml-1">
              {reportType === 'financial' ? 'การเงิน' : 'การเข้าพัก'}
            </span>
          </div>
          <div>
            <span className="font-medium text-blue-800">ช่วงเวลา:</span>
            <span className="text-blue-700 ml-1">
              {period === 'daily' ? 'รายวัน' : period === 'monthly' ? 'รายเดือน' : 'รายปี'}
            </span>
          </div>
          <div>
            <span className="font-medium text-blue-800">วันที่:</span>
            <span className="text-blue-700 ml-1">
              {dateRange.startDate} ถึง {dateRange.endDate}
            </span>
          </div>
          {customFilters?.status && (
            <div>
              <span className="font-medium text-blue-800">สถานะ:</span>
              <span className="text-blue-700 ml-1">
                {statusOptions.find(s => s.value === customFilters.status)?.label}
              </span>
            </div>
          )}
          {customFilters?.roomType && (
            <div>
              <span className="font-medium text-blue-800">ประเภทห้อง:</span>
              <span className="text-blue-700 ml-1">
                {roomTypeOptions.find(r => r.value === customFilters.roomType)?.label}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
