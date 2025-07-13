'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { bookingAPI } from '../../../lib/api';
import toast from 'react-hot-toast';

export default function AdminReports() {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [partialLoading, setPartialLoading] = useState(false);
  const [reportType, setReportType] = useState('financial');
  const [period, setPeriod] = useState('monthly');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  
  // Cache for API responses
  const [dataCache, setDataCache] = useState(new Map());
  const [lastFetch, setLastFetch] = useState(new Map());
  
  const [reportData, setReportData] = useState({
    financial: {
      totalRevenue: 0,
      bookingsCount: 0,
      averageBookingValue: 0,
      dailyRevenue: [],
      monthlyRevenue: [],
      yearlyRevenue: [],
      paymentMethods: [],
      roomTypeRevenue: []
    },
    occupancy: {
      totalBookings: 0,
      occupancyRate: 0,
      averageStayDuration: 0,
      dailyOccupancy: [],
      monthlyOccupancy: [],
      yearlyOccupancy: [],
      roomTypeOccupancy: [],
      guestOrigins: []
    }
  });

  const [autoRefresh, setAutoRefresh] = useState(false);

  // Helper functions
  const formatNumber = useCallback((num) => {
    if (typeof num !== 'number') return '0';
    return num.toLocaleString();
  }, []);

  const formatCurrency = useCallback((num) => {
    if (typeof num !== 'number') return '฿0';
    return `฿${num.toLocaleString()}`;
  }, []);

  const getCacheKey = useCallback((type, period, startDate, endDate) => {
    return `${type}-${period}-${startDate}-${endDate}`;
  }, []);

  const isDataFresh = useCallback((key) => {
    const fetchTime = lastFetch.get(key);
    if (!fetchTime) return false;
    return Date.now() - fetchTime < 5 * 60 * 1000; // 5 minutes
  }, [lastFetch]);

  // Memoized data processing
  const processedData = useMemo(() => {
    if (!reportData) return null;
    
    if (reportType === 'financial') {
      return {
        ...reportData.financial,
        totalRevenueFormatted: formatCurrency(reportData.financial.totalRevenue),
        averageBookingValueFormatted: formatCurrency(reportData.financial.averageBookingValue),
        bookingsCountFormatted: formatNumber(reportData.financial.bookingsCount)
      };
    } else {
      return {
        ...reportData.occupancy,
        totalBookingsFormatted: formatNumber(reportData.occupancy.totalBookings),
        occupancyRateFormatted: `${reportData.occupancy.occupancyRate.toFixed(1)}%`,
        averageStayDurationFormatted: `${reportData.occupancy.averageStayDuration.toFixed(1)} คืน`
      };
    }
  }, [reportData, reportType, formatCurrency, formatNumber]);

  const fetchReportData = useCallback(async (forceRefresh = false) => {
    const cacheKey = getCacheKey(reportType, period, dateRange.startDate, dateRange.endDate);
    
    // Check cache first
    if (!forceRefresh && isDataFresh(cacheKey)) {
      const cachedData = dataCache.get(cacheKey);
      if (cachedData) {
        setReportData(cachedData);
        setLoading(false);
        return;
      }
    }

    setPartialLoading(true);
    if (!dataCache.has(cacheKey)) {
      setLoading(true);
    }
    
    try {
      const response = await bookingAPI.getAllBookings({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        limit: 1000,
        status: reportType === 'financial' ? 'confirmed,completed' : undefined
      });
      
      const bookings = response.bookings || [];
      let processedReportData;
      
      if (reportType === 'financial') {
        processedReportData = await processFinancialData(bookings);
      } else {
        processedReportData = await processOccupancyData(bookings);
      }
      
      setDataCache(prev => new Map(prev).set(cacheKey, processedReportData));
      setLastFetch(prev => new Map(prev).set(cacheKey, Date.now()));
      setReportData(processedReportData);
      
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('ไม่สามารถโหลดข้อมูลรายงานได้');
    } finally {
      setLoading(false);
      setPartialLoading(false);
    }
  }, [reportType, period, dateRange, getCacheKey, isDataFresh, dataCache]);

  const processFinancialData = useCallback(async (bookings) => {
    const revenueBookings = bookings.filter(b => 
      b.status === 'confirmed' || b.status === 'completed'
    );
    
    const { totalRevenue, roomTypeRevenue, paymentMethodCounts } = revenueBookings.reduce((acc, booking) => {
      const price = booking.totalPrice || 0;
      acc.totalRevenue += price;
      
      const roomType = booking.roomType || 'ไม่ระบุ';
      acc.roomTypeRevenue[roomType] = (acc.roomTypeRevenue[roomType] || 0) + price;
      
      const paymentMethod = booking.paymentReceipt ? 'โอนเงิน' : 'รอชำระ';
      acc.paymentMethodCounts[paymentMethod] = (acc.paymentMethodCounts[paymentMethod] || 0) + 1;
      
      return acc;
    }, {
      totalRevenue: 0,
      roomTypeRevenue: {},
      paymentMethodCounts: {}
    });
    
    const averageBookingValue = revenueBookings.length > 0 ? totalRevenue / revenueBookings.length : 0;
    const periodData = groupBookingsByPeriod(revenueBookings, period);
    
    const roomTypeRevenueArray = Object.entries(roomTypeRevenue).map(([type, revenue]) => ({
      type,
      revenue,
      count: revenueBookings.filter(b => (b.roomType || 'ไม่ระบุ') === type).length
    }));
    
    const paymentMethodsArray = Object.entries(paymentMethodCounts).map(([method, count]) => ({
      method,
      count
    }));

    return {
      financial: {
        totalRevenue,
        bookingsCount: revenueBookings.length,
        averageBookingValue,
        dailyRevenue: period === 'daily' ? periodData : [],
        monthlyRevenue: period === 'monthly' ? periodData : [],
        yearlyRevenue: period === 'yearly' ? periodData : [],
        roomTypeRevenue: roomTypeRevenueArray,
        paymentMethods: paymentMethodsArray
      },
      occupancy: {
        totalBookings: 0,
        occupancyRate: 0,
        averageStayDuration: 0,
        dailyOccupancy: [],
        monthlyOccupancy: [],
        yearlyOccupancy: [],
        roomTypeOccupancy: [],
        guestOrigins: []
      }
    };
  }, [period]);

  const processOccupancyData = useCallback(async (bookings) => {
    const totalBookings = bookings.length;
    
    const { totalNights, roomTypeOccupancy } = bookings.reduce((acc, booking) => {
      const checkIn = new Date(booking.checkInDate);
      const checkOut = new Date(booking.checkOutDate);
      const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
      acc.totalNights += nights;
      
      const roomType = booking.roomType || 'ไม่ระบุ';
      acc.roomTypeOccupancy[roomType] = (acc.roomTypeOccupancy[roomType] || 0) + 1;
      
      return acc;
    }, {
      totalNights: 0,
      roomTypeOccupancy: {}
    });
    
    const averageStayDuration = totalBookings > 0 ? totalNights / totalBookings : 0;
    const occupancyRate = Math.min((totalBookings / 30) * 100, 100);
    const periodData = groupBookingsByPeriod(bookings, period);
    
    const roomTypeOccupancyArray = Object.entries(roomTypeOccupancy).map(([type, count]) => ({
      type,
      count,
      percentage: totalBookings > 0 ? (count / totalBookings) * 100 : 0
    }));

    return {
      financial: {
        totalRevenue: 0,
        bookingsCount: 0,
        averageBookingValue: 0,
        dailyRevenue: [],
        monthlyRevenue: [],
        yearlyRevenue: [],
        paymentMethods: [],
        roomTypeRevenue: []
      },
      occupancy: {
        totalBookings,
        occupancyRate,
        averageStayDuration,
        dailyOccupancy: period === 'daily' ? periodData : [],
        monthlyOccupancy: period === 'monthly' ? periodData : [],
        yearlyOccupancy: period === 'yearly' ? periodData : [],
        roomTypeOccupancy: roomTypeOccupancyArray,
        guestOrigins: [
          { origin: 'ในประเทศ', count: Math.floor(totalBookings * 0.8) },
          { origin: 'ต่างประเทศ', count: Math.floor(totalBookings * 0.2) }
        ]
      }
    };
  }, [period]);

  const groupBookingsByPeriod = useCallback((bookings, period) => {
    const groups = new Map();
    
    bookings.forEach(booking => {
      const date = new Date(booking.checkInDate);
      let key;
      
      switch (period) {
        case 'daily':
          key = date.toISOString().split('T')[0];
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'yearly':
          key = date.getFullYear().toString();
          break;
        default:
          key = date.toISOString().split('T')[0];
      }
      
      if (!groups.has(key)) {
        groups.set(key, {
          period: key,
          count: 0,
          revenue: 0,
          bookings: []
        });
      }
      
      const group = groups.get(key);
      group.count++;
      group.revenue += booking.totalPrice || 0;
      group.bookings.push(booking);
    });
    
    return Array.from(groups.values()).sort((a, b) => a.period.localeCompare(b.period));
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchReportData();
    }
  }, [isAuthenticated, user, reportType, period, dateRange.startDate, dateRange.endDate, fetchReportData]);

  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        const cacheKey = getCacheKey(reportType, period, dateRange.startDate, dateRange.endDate);
        if (!isDataFresh(cacheKey)) {
          fetchReportData(true);
        }
      }, 30000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, reportType, period, dateRange, getCacheKey, isDataFresh, fetchReportData]);

  const getPeriodText = () => {
    switch (period) {
      case 'daily': return 'รายวัน';
      case 'monthly': return 'รายเดือน';
      case 'yearly': return 'รายปี';
      default: return 'รายเดือน';
    }
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">ไม่มีสิทธิ์เข้าถึง</h2>
          <p className="text-gray-600">คุณจำเป็นต้องเข้าสู่ระบบในฐานะผู้ดูแลระบบ</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
                <span className="mr-3">📊</span>
                รายงานแอดมิน
              </h1>
              <p className="text-gray-600">
                ดูข้อมูลรายงานการเงินและการเข้าพักของโรงแรม
              </p>
            </div>
            
            <div className="flex items-center space-x-4 mt-4 sm:mt-0">
              <button
                onClick={() => fetchReportData(true)}
                disabled={loading || partialLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center text-sm disabled:opacity-50"
              >
                <span className="mr-2">🔄</span>
                รีเฟรช
              </button>
              
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Auto Refresh</span>
              </label>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">🔍</span>
            ตัวกรอง
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ประเภทรายงาน
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="financial">รายงานการเงิน</option>
                <option value="occupancy">รายงานการเข้าพัก</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ช่วงเวลา
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="daily">รายวัน</option>
                <option value="monthly">รายเดือน</option>
                <option value="yearly">รายปี</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                วันที่เริ่มต้น
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                วันที่สิ้นสุด
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-6">
            {/* Skeleton Loading */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((item) => (
                <div key={item} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-gray-200 rounded-lg animate-pulse">
                      <div className="w-8 h-8 bg-gray-300 rounded"></div>
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="h-8 bg-gray-300 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="h-6 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
            </div>

            <div className="text-center py-8">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">กำลังโหลดข้อมูลรายงาน...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            {reportType === 'financial' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`bg-white rounded-lg shadow-sm p-6 transition-all duration-300 ${partialLoading ? 'opacity-75' : 'opacity-100'}`}>
                  <div className="flex items-center">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <span className="text-2xl">💰</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">รายได้รวม</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {processedData?.totalRevenueFormatted || formatCurrency(reportData.financial.totalRevenue)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`bg-white rounded-lg shadow-sm p-6 transition-all duration-300 ${partialLoading ? 'opacity-75' : 'opacity-100'}`}>
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <span className="text-2xl">📊</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">จำนวนการจอง</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {processedData?.bookingsCountFormatted || reportData.financial.bookingsCount}
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`bg-white rounded-lg shadow-sm p-6 transition-all duration-300 ${partialLoading ? 'opacity-75' : 'opacity-100'}`}>
                  <div className="flex items-center">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <span className="text-2xl">📈</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">มูลค่าเฉลี่ยต่อการจอง</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {processedData?.averageBookingValueFormatted || formatCurrency(Math.round(reportData.financial.averageBookingValue))}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`bg-white rounded-lg shadow-sm p-6 transition-all duration-300 ${partialLoading ? 'opacity-75' : 'opacity-100'}`}>
                  <div className="flex items-center">
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <span className="text-2xl">🏨</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">จำนวนการจอง</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {processedData?.totalBookingsFormatted || reportData.occupancy.totalBookings}
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`bg-white rounded-lg shadow-sm p-6 transition-all duration-300 ${partialLoading ? 'opacity-75' : 'opacity-100'}`}>
                  <div className="flex items-center">
                    <div className="p-3 bg-teal-100 rounded-lg">
                      <span className="text-2xl">📊</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">อัตราการเข้าพัก</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {processedData?.occupancyRateFormatted || `${reportData.occupancy.occupancyRate.toFixed(1)}%`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`bg-white rounded-lg shadow-sm p-6 transition-all duration-300 ${partialLoading ? 'opacity-75' : 'opacity-100'}`}>
                  <div className="flex items-center">
                    <div className="p-3 bg-indigo-100 rounded-lg">
                      <span className="text-2xl">🛏️</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">ระยะเวลาพักเฉลี่ย</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {processedData?.averageStayDurationFormatted || `${reportData.occupancy.averageStayDuration.toFixed(1)} คืน`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Loading overlay for partial updates */}
            {partialLoading && (
              <div className="fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                <span className="text-sm">กำลังอัปเดต...</span>
              </div>
            )}

            {/* Charts and Tables would go here */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {reportType === 'financial' ? 'กราฟรายได้' : 'กราฟการเข้าพัก'} ({getPeriodText()})
              </h3>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">กราฟจะแสดงที่นี่</p>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-sm text-gray-500 mt-8">
              <p>รายงานอัพเดทล่าสุด: {new Date().toLocaleDateString('th-TH')} {new Date().toLocaleTimeString('th-TH')}</p>
              <p>ข้อมูลจาก: {dateRange.startDate} ถึง {dateRange.endDate}</p>
              {autoRefresh && (
                <p className="text-green-600 mt-1">🔄 อัพเดทอัตโนมัติทุก 30 วินาที</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
