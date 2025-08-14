'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useTranslation } from '../../../translations';
import { bookingAPI } from '../../../lib/api';
import { isStaffOrAdmin } from '../../../lib/roles';
import toast from 'react-hot-toast';
import {
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  FileText,
  Download,
  RefreshCw,
  BarChart3,
  Activity,
  Clock,
  Loader2
} from 'lucide-react';

export default function AdminReports() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('financial');
  const [period, setPeriod] = useState('monthly');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  
  const [reportData, setReportData] = useState({
    financial: {
      totalRevenue: 0,
      bookingsCount: 0,
      averageBookingValue: 0,
      roomTypeRevenue: [],
      paymentMethods: []
    },
    occupancy: {
      totalBookings: 0,
      occupancyRate: 0,
      averageStayDuration: 0,
      roomTypeOccupancy: []
    }
  });

  useEffect(() => {
    if (authLoading) return;
    
    if (isAuthenticated && isStaffOrAdmin(user)) {
      fetchReportData();
    } else if (isAuthenticated && !isStaffOrAdmin(user)) {
      toast.error('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
    } else if (!isAuthenticated) {
      toast.error('กรุณาเข้าสู่ระบบก่อน');
    }
  }, [isAuthenticated, user, authLoading, reportType, period, dateRange]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const response = await bookingAPI.getAllBookings({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        limit: 1000
      });
      
      const bookings = Array.isArray(response?.bookings) ? response.bookings : [];
      
      if (reportType === 'financial') {
        processFinancialData(bookings);
      } else {
        processOccupancyData(bookings);
      }
      
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('ไม่สามารถโหลดข้อมูลรายงานได้');
    } finally {
      setLoading(false);
    }
  };

  const processFinancialData = (bookings) => {
    const confirmedBookings = bookings.filter(b => 
      b?.status === 'confirmed' || b?.status === 'completed'
    );
    
    const totalRevenue = confirmedBookings.reduce((sum, booking) => 
      sum + (parseFloat(booking?.totalPrice) || 0), 0
    );
    
    const averageBookingValue = confirmedBookings.length > 0 
      ? totalRevenue / confirmedBookings.length 
      : 0;

    // Room type revenue
    const roomTypeRevenue = {};
    confirmedBookings.forEach(booking => {
      const roomType = booking?.roomType || 'ไม่ระบุ';
      const price = parseFloat(booking?.totalPrice) || 0;
      roomTypeRevenue[roomType] = (roomTypeRevenue[roomType] || 0) + price;
    });

    // Payment methods
    const paymentMethods = {};
    confirmedBookings.forEach(booking => {
      const method = booking?.paymentReceipt ? 'โอนเงิน' : 'รอชำระ';
      paymentMethods[method] = (paymentMethods[method] || 0) + 1;
    });

    setReportData(prev => ({
      ...prev,
      financial: {
        totalRevenue,
        bookingsCount: confirmedBookings.length,
        averageBookingValue,
        roomTypeRevenue: Object.entries(roomTypeRevenue).map(([type, revenue]) => ({
          type,
          revenue: revenue || 0,
          count: confirmedBookings.filter(b => (b?.roomType || 'ไม่ระบุ') === type).length
        })),
        paymentMethods: Object.entries(paymentMethods).map(([method, count]) => ({
          method,
          count: count || 0
        }))
      }
    }));
  };

  const processOccupancyData = (bookings) => {
    const totalBookings = bookings.length;
    
    let totalNights = 0;
    const roomTypeOccupancy = {};
    
    bookings.forEach(booking => {
      if (booking?.checkInDate && booking?.checkOutDate) {
        const checkIn = new Date(booking.checkInDate);
        const checkOut = new Date(booking.checkOutDate);
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        totalNights += Math.max(0, nights);
      }
      
      const roomType = booking?.roomType || 'ไม่ระบุ';
      roomTypeOccupancy[roomType] = (roomTypeOccupancy[roomType] || 0) + 1;
    });
    
    const averageStayDuration = totalBookings > 0 ? totalNights / totalBookings : 0;
    const occupancyRate = Math.min((totalBookings / 30) * 100, 100);

    setReportData(prev => ({
      ...prev,
      occupancy: {
        totalBookings,
        occupancyRate,
        averageStayDuration,
        roomTypeOccupancy: Object.entries(roomTypeOccupancy).map(([type, count]) => ({
          type,
          count: count || 0,
          percentage: totalBookings > 0 ? ((count || 0) / totalBookings) * 100 : 0
        }))
      }
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('th-TH').format(num || 0);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400" />
          <p className="text-gray-600 dark:text-gray-400">
            {language === 'en' ? 'Loading report data...' : 'กำลังโหลดข้อมูลรายงาน...'}
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isStaffOrAdmin(user)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {language === 'en' ? 'Access Denied' : 'ไม่มีสิทธิ์เข้าถึง'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {language === 'en' ? 'You do not have permission to access this page' : 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้'}
          </p>
        </div>
      </div>
    );
  }

  const currentData = reportType === 'financial' ? reportData.financial : reportData.occupancy;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {language === 'en' ? 'System Reports' : 'รายงานระบบ'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {language === 'en' ? 'View hotel statistics and reports' : 'ดูข้อมูลสถิติและรายงานของโรงแรม'}
                {user?.role === 'staff' && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-xs rounded-full">
                    {language === 'en' ? 'View Only Mode' : 'โหมดดูอย่างเดียว'}
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={() => fetchReportData()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-lg transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              {language === 'en' ? 'Refresh' : 'รีเฟรช'}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {language === 'en' ? 'Report Type' : 'ประเภทรายงาน'}
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="financial">{language === 'en' ? 'Financial Report' : 'รายงานการเงิน'}</option>
                <option value="occupancy">{language === 'en' ? 'Occupancy Report' : 'รายงานการเข้าพัก'}</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {language === 'en' ? 'Period' : 'ช่วงเวลา'}
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="daily">{language === 'en' ? 'Daily' : 'รายวัน'}</option>
                <option value="monthly">{language === 'en' ? 'Monthly' : 'รายเดือน'}</option>
                <option value="yearly">{language === 'en' ? 'Yearly' : 'รายปี'}</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {language === 'en' ? 'Start Date' : 'วันที่เริ่มต้น'}
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {language === 'en' ? 'End Date' : 'วันที่สิ้นสุด'}
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {reportType === 'financial' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {language === 'en' ? 'Total Revenue' : 'รายได้รวม'}
                  </p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(currentData.totalRevenue)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {language === 'en' ? 'Number of Bookings' : 'จำนวนการจอง'}
                  </p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatNumber(currentData.bookingsCount)}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {language === 'en' ? 'Average per Booking' : 'ค่าเฉลี่ยต่อการจอง'}
                  </p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {formatCurrency(currentData.averageBookingValue)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {language === 'en' ? 'Total Bookings' : 'การจองทั้งหมด'}
                  </p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatNumber(currentData.totalBookings)}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {language === 'en' ? 'Occupancy Rate' : 'อัตราการเข้าพัก'}
                  </p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {(currentData.occupancyRate || 0).toFixed(1)}%
                  </p>
                </div>
                <Activity className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {language === 'en' ? 'Average Stay Duration' : 'ระยะเวลาเข้าพักเฉลี่ย'}
                  </p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {(currentData.averageStayDuration || 0).toFixed(1)} {language === 'en' ? 'nights' : 'คืน'}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        )}

        {/* Data Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Room Type Data */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {reportType === 'financial' 
                ? (language === 'en' ? 'Revenue by Room Type' : 'รายได้ตามประเภทห้อง')
                : (language === 'en' ? 'Occupancy by Room Type' : 'การเข้าพักตามประเภทห้อง')
              }
            </h3>
            <div className="space-y-3">
              {(reportType === 'financial' ? currentData.roomTypeRevenue : currentData.roomTypeOccupancy)?.map((room, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="font-medium text-gray-900 dark:text-gray-100">{room.type}</span>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                      {reportType === 'financial' 
                        ? formatCurrency(room.revenue) 
                        : `${formatNumber(room.count)} ${language === 'en' ? 'bookings' : 'การจอง'}`
                      }
                    </div>
                    {reportType === 'occupancy' && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {(room.percentage || 0).toFixed(1)}%
                      </div>
                    )}
                  </div>
                </div>
              )) || (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  {language === 'en' ? 'No data available' : 'ไม่มีข้อมูล'}
                </div>
              )}
            </div>
          </div>

          {/* Payment Methods (Financial only) */}
          {reportType === 'financial' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                {language === 'en' ? 'Payment Methods' : 'วิธีการชำระเงิน'}
              </h3>
              <div className="space-y-3">
                {currentData.paymentMethods?.map((payment, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{payment.method}</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {formatNumber(payment.count)} {language === 'en' ? 'times' : 'ครั้ง'}
                    </span>
                  </div>
                )) || (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    {language === 'en' ? 'No data available' : 'ไม่มีข้อมูล'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
