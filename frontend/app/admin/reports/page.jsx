'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { bookingAPI } from '../../../lib/api';
import { isStaffOrAdmin } from '../../../lib/roles';
import toast from 'react-hot-toast';
import AdminNavigation from '../../../components/AdminNavigation';
import {
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  FileText,
  Download,
  BarChart3,
  Bed,
  CreditCard
} from 'lucide-react';

export default function AdminReports() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [reportType, setReportType] = useState('financial');
  const [period, setPeriod] = useState('monthly');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [reportData, setReportData] = useState(null);

  const reportTypes = [
    { value: 'financial', label: 'รายงานการเงิน' },
    { value: 'occupancy', label: 'อัตราการเข้าพัก' }
  ];

  const periods = [
    { value: 'daily', label: 'รายวัน' },
    { value: 'weekly', label: 'รายสัปดาห์' },
    { value: 'monthly', label: 'รายเดือน' },
    { value: 'yearly', label: 'รายปี' },
    { value: 'custom', label: 'กำหนดเอง' }
  ];

  useEffect(() => {
    setIsVisible(true);
    if (isAuthenticated && user && isStaffOrAdmin(user)) {
      fetchReportData();
    }
  }, [isAuthenticated, user, reportType, period, dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
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
      toast.error('เกิดข้อผิดพลาดในการดึงข้อมูลรายงาน');
    } finally {
      setLoading(false);
    }
  };

  const processFinancialData = (bookings) => {
    let revenue = 0;
    let totalBookings = 0;
    const monthlyData = {};
    
    bookings.forEach(booking => {
      if (booking.status === 'completed' || booking.status === 'confirmed') {
        revenue += parseFloat(booking.total_price || 0);
        totalBookings++;
        
        // Group by month for chart
        const month = new Date(booking.created_at).toISOString().substring(0, 7);
        if (!monthlyData[month]) {
          monthlyData[month] = { revenue: 0, bookings: 0 };
        }
        monthlyData[month].revenue += parseFloat(booking.total_price || 0);
        monthlyData[month].bookings++;
      }
    });

    setReportData({
      totalRevenue: revenue,
      totalBookings: totalBookings,
      averageBookingValue: totalBookings > 0 ? revenue / totalBookings : 0,
      chartData: Object.entries(monthlyData).map(([month, data]) => ({
        month,
        revenue: data.revenue,
        bookings: data.bookings
      }))
    });
  };

  const processOccupancyData = (bookings) => {
    const roomOccupancy = {};
    const dailyOccupancy = {};
    
    bookings.forEach(booking => {
      if (booking.status === 'confirmed' || booking.status === 'completed') {
        // Room type occupancy
        const roomType = booking.room_type_name || 'Unknown';
        if (!roomOccupancy[roomType]) {
          roomOccupancy[roomType] = 0;
        }
        roomOccupancy[roomType]++;
        
        // Daily occupancy
        const checkIn = new Date(booking.check_in_date);
        const checkOut = new Date(booking.check_out_date);
        
        for (let d = new Date(checkIn); d < checkOut; d.setDate(d.getDate() + 1)) {
          const dayKey = d.toISOString().substring(0, 10);
          if (!dailyOccupancy[dayKey]) {
            dailyOccupancy[dayKey] = 0;
          }
          dailyOccupancy[dayKey]++;
        }
      }
    });

    setReportData({
      roomOccupancy,
      dailyOccupancy: Object.entries(dailyOccupancy).map(([date, count]) => ({
        date,
        occupancy: count
      })),
      totalRoomsBooked: Object.values(roomOccupancy).reduce((a, b) => a + b, 0)
    });
  };

  const exportToCSV = () => {
    if (!reportData) return;
    
    let csvContent = '';
    
    if (reportType === 'financial') {
      csvContent = 'เดือน,รายได้,จำนวนการจอง\n';
      reportData.chartData?.forEach(item => {
        csvContent += `${item.month},${item.revenue},${item.bookings}\n`;
      });
    } else {
      csvContent = 'ประเภทห้อง,จำนวนการจอง\n';
      Object.entries(reportData.roomOccupancy || {}).forEach(([room, count]) => {
        csvContent += `${room},${count}\n`;
      });
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${reportType}-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            กรุณาเข้าสู่ระบบ
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            คุณต้องเข้าสู่ระบบเพื่อเข้าถึงหน้านี้
          </p>
        </div>
      </div>
    );
  }

  if (!isStaffOrAdmin(user)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            ไม่มีสิทธิ์เข้าถึง
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            คุณไม่มีสิทธิ์เข้าถึงหน้านี้
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <AdminNavigation 
        title="รายงาน" 
        description="ดูและวิเคราะห์ข้อมูลทางธุรกิจ"
      />
      
      <div className="px-4 pb-8">
        <div className={`max-w-7xl mx-auto transform transition-all duration-1000 ease-out ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          
          {/* Controls */}
          <div className="mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Report Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ประเภทรายงาน
                  </label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    {reportTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Period */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ช่วงเวลา
                  </label>
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    {periods.map(p => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Custom Date Range */}
                {period === 'custom' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        วันที่เริ่ม
                      </label>
                      <input
                        type="date"
                        value={dateRange.startDate}
                        onChange={(e) => setDateRange(prev => ({
                          ...prev,
                          startDate: e.target.value
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        วันที่สิ้นสุด
                      </label>
                      <input
                        type="date"
                        value={dateRange.endDate}
                        onChange={(e) => setDateRange(prev => ({
                          ...prev,
                          endDate: e.target.value
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-700 dark:text-gray-300">กำลังโหลดข้อมูล...</span>
            </div>
          )}

          {/* Report Content */}
          {!loading && reportData && (
            <>
              {/* Financial Report */}
              {reportType === 'financial' && (
                <div className="space-y-8">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                          <DollarSign className="h-6 w-6 text-white" />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                            ฿{reportData.totalRevenue?.toLocaleString() || 0}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400">รายได้รวม</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                          <Calendar className="h-6 w-6 text-white" />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {reportData.totalBookings || 0}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400">การจองทั้งหมด</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                          <TrendingUp className="h-6 w-6 text-white" />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                            ฿{Math.round(reportData.averageBookingValue || 0).toLocaleString()}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400">ค่าเฉลี่ยต่อการจอง</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Export Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={exportToCSV}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      ส่งออก CSV
                    </button>
                  </div>

                  {/* Chart */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      แนวโน้มรายได้รายเดือน
                    </h3>
                    {reportData.chartData && reportData.chartData.length > 0 ? (
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">เดือน</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">รายได้</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">การจอง</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.chartData.map((item, index) => (
                            <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                              <td className="py-3 px-4 text-gray-900 dark:text-white">{item.month}</td>
                              <td className="py-3 px-4 text-gray-900 dark:text-white">฿{item.revenue.toLocaleString()}</td>
                              <td className="py-3 px-4 text-gray-900 dark:text-white">{item.bookings}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400">ไม่มีข้อมูลสำหรับช่วงเวลาที่เลือก</p>
                    )}
                  </div>
                </div>
              )}

              {/* Occupancy Report */}
              {reportType === 'occupancy' && (
                <div className="space-y-8">
                  {/* Summary */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                        <Bed className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                          {reportData.totalRoomsBooked || 0}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">ห้องที่ถูกจองทั้งหมด</p>
                      </div>
                    </div>
                  </div>

                  {/* Export Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={exportToCSV}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      ส่งออก CSV
                    </button>
                  </div>

                  {/* Room Occupancy Table */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      อัตราการเข้าพักตามประเภทห้อง
                    </h3>
                    {reportData.roomOccupancy && Object.keys(reportData.roomOccupancy).length > 0 ? (
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">ประเภทห้อง</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">จำนวนการจอง</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(reportData.roomOccupancy).map(([roomType, count]) => (
                            <tr key={roomType} className="border-b border-gray-100 dark:border-gray-800">
                              <td className="py-3 px-4 text-gray-900 dark:text-white">{roomType}</td>
                              <td className="py-3 px-4 text-gray-900 dark:text-white">{count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400">ไม่มีข้อมูลสำหรับช่วงเวลาที่เลือก</p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
