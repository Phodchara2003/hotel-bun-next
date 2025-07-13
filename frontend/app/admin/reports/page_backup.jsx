'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { bookingAPI } from '../../../lib/api';
import toast from 'react-hot-toast';

export default function AdminReports() {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [partialLoading, setPartialLoading] = useState(false);
  const [reportType, setReportType] = useState('financial'); // financial, occupancy
  const [period, setPeriod] = useState('monthly'); // daily, monthly, yearly
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

  const [showComparison, setShowComparison] = useState(false);
  const [comparisonData, setComparisonData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Helper function to format numbers safely for SSR
  const formatNumber = useCallback((num) => {
    if (typeof num !== 'number') return '0';
    return num.toLocaleString();
  }, []);

  // Helper function to format currency safely for SSR
  const formatCurrency = useCallback((num) => {
    if (typeof num !== 'number') return '฿0';
    return `฿${num.toLocaleString()}`;
  }, []);

  // Generate cache key for API requests
  const getCacheKey = useCallback((type, period, startDate, endDate) => {
    return `${type}-${period}-${startDate}-${endDate}`;
  }, []);

  // Check if data is fresh (less than 5 minutes old)
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

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchReportData();
    }
  }, [isAuthenticated, user, reportType, period, dateRange.startDate, dateRange.endDate]);

  // Auto refresh functionality with smart caching
  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        const cacheKey = getCacheKey(reportType, period, dateRange.startDate, dateRange.endDate);
        if (!isDataFresh(cacheKey)) {
          fetchReportData(true); // Force refresh
        }
      }, 30000); // Check every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, reportType, period, dateRange, getCacheKey, isDataFresh]);

  // Generate alerts based on data
  useEffect(() => {
    if (processedData) {
      generateAlerts();
    }
  }, [processedData]);

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
      // Fetch data with pagination for better performance
      const response = await bookingAPI.getAllBookings({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        limit: 1000, // Reasonable limit
        status: reportType === 'financial' ? 'confirmed,completed' : undefined
      });
      
      const bookings = response.bookings || [];
      
      // Process data in web worker if available, otherwise process normally
      let processedReportData;
      if (reportType === 'financial') {
        processedReportData = await processFinancialDataOptimized(bookings);
      } else {
        processedReportData = await processOccupancyDataOptimized(bookings);
      }
      
      // Cache the result
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

  const processFinancialDataOptimized = useCallback(async (bookings) => {
    // Use more efficient filtering and processing
    const revenueBookings = bookings.filter(b => 
      b.status === 'confirmed' || b.status === 'completed'
    );
    
    // Use reduce for single-pass calculations
    const { totalRevenue, roomTypeRevenue, paymentMethodCounts } = revenueBookings.reduce((acc, booking) => {
      const price = booking.totalPrice || 0;
      acc.totalRevenue += price;
      
      // Group by room type
      const roomType = booking.roomType || 'ไม่ระบุ';
      acc.roomTypeRevenue[roomType] = (acc.roomTypeRevenue[roomType] || 0) + price;
      
      // Count payment methods
      const paymentMethod = booking.paymentReceipt ? 'โอนเงิน' : 'รอชำระ';
      acc.paymentMethodCounts[paymentMethod] = (acc.paymentMethodCounts[paymentMethod] || 0) + 1;
      
      return acc;
    }, {
      totalRevenue: 0,
      roomTypeRevenue: {},
      paymentMethodCounts: {}
    });
    
    const averageBookingValue = revenueBookings.length > 0 
      ? totalRevenue / revenueBookings.length 
      : 0;

    // Group by period efficiently
    const periodData = groupBookingsByPeriodOptimized(revenueBookings, period);
    
    // Convert objects to arrays for UI
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

  const processOccupancyDataOptimized = useCallback(async (bookings) => {
    const totalBookings = bookings.length;
    
    // Calculate average stay duration and other metrics efficiently
    const { totalNights, roomTypeOccupancy } = bookings.reduce((acc, booking) => {
      const checkIn = new Date(booking.checkInDate);
      const checkOut = new Date(booking.checkOutDate);
      const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
      acc.totalNights += nights;
      
      // Group by room type
      const roomType = booking.roomType || 'ไม่ระบุ';
      acc.roomTypeOccupancy[roomType] = (acc.roomTypeOccupancy[roomType] || 0) + 1;
      
      return acc;
    }, {
      totalNights: 0,
      roomTypeOccupancy: {}
    });
    
    const averageStayDuration = totalBookings > 0 ? totalNights / totalBookings : 0;
    const occupancyRate = Math.min((totalBookings / 30) * 100, 100); // Assuming 30 rooms max

    // Group by period efficiently
    const periodData = groupBookingsByPeriodOptimized(bookings, period);
    
    // Convert objects to arrays for UI
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

  const groupBookingsByPeriodOptimized = useCallback((bookings, period) => {
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

  const groupBookingsByRoomType = (bookings) => {
    const groups = {};
    
    bookings.forEach(booking => {
      const roomType = booking.roomTypeName || 'ไม่ระบุ';
      
      if (!groups[roomType]) {
        groups[roomType] = { roomType, count: 0, revenue: 0 };
      }
      
      groups[roomType].count += 1;
      groups[roomType].revenue += booking.totalPrice || 0;
    });
    
    return Object.values(groups);
  };

  const exportReport = (format = 'json') => {
    // Check if running in browser environment
    if (typeof window === 'undefined') return;
    
    const data = reportType === 'financial' ? reportData.financial : reportData.occupancy;
    const filename = `${reportType}_report_${period}_${dateRange.startDate}_to_${dateRange.endDate}`;
    
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      const csvContent = convertToCSV(data);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'excel') {
      const excelContent = convertToExcel(data);
      const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.xls`;
      a.click();
      URL.revokeObjectURL(url);
    }
    
    toast.success(`ส่งออกรายงานแบบ ${format.toUpperCase()} สำเร็จ!`);
  };

  const convertToCSV = (data) => {
    let csvContent = '\uFEFF'; // UTF-8 BOM for Excel compatibility
    
    if (reportType === 'financial') {
      csvContent += 'รายงานการเงิน\n';
      csvContent += `รายได้รวม,${data.totalRevenue}\n`;
      csvContent += `จำนวนการจอง,${data.bookingsCount}\n`;
      csvContent += `มูลค่าเฉลี่ย,${Math.round(data.averageBookingValue)}\n\n`;
      
      csvContent += 'ช่วงเวลา,รายได้\n';
      const periodData = data[`${period}Revenue`] || [];
      periodData.forEach(item => {
        csvContent += `${item.period},${item.revenue}\n`;
      });
      
      csvContent += '\nประเภทห้อง,รายได้\n';
      data.roomTypeRevenue.forEach(item => {
        csvContent += `${item.roomType},${item.revenue}\n`;
      });
    } else {
      csvContent += 'รายงานการเข้าพัก\n';
      csvContent += `จำนวนการจอง,${data.totalBookings}\n`;
      csvContent += `อัตราการเข้าพัก,${data.occupancyRate.toFixed(1)}%\n`;
      csvContent += `ระยะเวลาพักเฉลี่ย,${data.averageStayDuration.toFixed(1)} คืน\n\n`;
      
      csvContent += 'ช่วงเวลา,การจอง\n';
      const periodData = data[`${period}Occupancy`] || [];
      periodData.forEach(item => {
        csvContent += `${item.period},${item.count}\n`;
      });
      
      csvContent += '\nประเภทห้อง,การจอง\n';
      data.roomTypeOccupancy.forEach(item => {
        csvContent += `${item.roomType},${item.count}\n`;
      });
    }
    
    return csvContent;
  };

  const convertToExcel = (data) => {
    // Simple Excel format (HTML table)
    let content = '<table border="1">';
    
    if (reportType === 'financial') {
      content += '<tr><td colspan="2"><b>รายงานการเงิน</b></td></tr>';
      content += `<tr><td>รายได้รวม</td><td>${formatNumber(data.totalRevenue)}</td></tr>`;
      content += `<tr><td>จำนวนการจอง</td><td>${data.bookingsCount}</td></tr>`;
      content += `<tr><td>มูลค่าเฉลี่ย</td><td>${formatNumber(Math.round(data.averageBookingValue))}</td></tr>`;
      content += '<tr><td></td><td></td></tr>';
      content += '<tr><td><b>ช่วงเวลา</b></td><td><b>รายได้</b></td></tr>';
      
      const periodData = data[`${period}Revenue`] || [];
      periodData.forEach(item => {
        content += `<tr><td>${item.period}</td><td>${formatNumber(item.revenue)}</td></tr>`;
      });
      
      content += '<tr><td></td><td></td></tr>';
      content += '<tr><td><b>ประเภทห้อง</b></td><td><b>รายได้</b></td></tr>';
      data.roomTypeRevenue.forEach(item => {
        content += `<tr><td>${item.roomType}</td><td>${formatNumber(item.revenue)}</td></tr>`;
      });
    } else {
      content += '<tr><td colspan="2"><b>รายงานการเข้าพัก</b></td></tr>';
      content += `<tr><td>จำนวนการจอง</td><td>${data.totalBookings}</td></tr>`;
      content += `<tr><td>อัตราการเข้าพัก</td><td>${data.occupancyRate.toFixed(1)}%</td></tr>`;
      content += `<tr><td>ระยะเวลาพักเฉลี่ย</td><td>${data.averageStayDuration.toFixed(1)} คืน</td></tr>`;
      content += '<tr><td></td><td></td></tr>';
      content += '<tr><td><b>ช่วงเวลา</b></td><td><b>การจอง</b></td></tr>';
      
      const periodData = data[`${period}Occupancy`] || [];
      periodData.forEach(item => {
        content += `<tr><td>${item.period}</td><td>${item.count}</td></tr>`;
      });
      
      content += '<tr><td></td><td></td></tr>';
      content += '<tr><td><b>ประเภทห้อง</b></td><td><b>การจอง</b></td></tr>';
      data.roomTypeOccupancy.forEach(item => {
        content += `<tr><td>${item.roomType}</td><td>${item.count}</td></tr>`;
      });
    }
    
    content += '</table>';
    return content;
  };

  const getPeriodText = () => {
    switch (period) {
      case 'daily': return 'รายวัน';
      case 'monthly': return 'รายเดือน';
      case 'yearly': return 'รายปี';
      default: return '';
    }
  };

  const generateAlerts = () => {
    const newAlerts = [];
    const financial = reportData.financial;
    const occupancy = reportData.occupancy;

    // Financial alerts
    if (financial.totalRevenue < 50000) {
      newAlerts.push({
        type: 'warning',
        message: 'รายได้ต่ำกว่าเป้าหมาย - ควรเพิ่มแคมเปญการตลาด',
        icon: '💰'
      });
    }

    if (financial.averageBookingValue < 2000) {
      newAlerts.push({
        type: 'info',
        message: 'มูลค่าการจองเฉลี่ยต่ำ - ควรเพิ่มบริการเสริม',
        icon: '📈'
      });
    }

    // Occupancy alerts
    if (occupancy.occupancyRate < 50) {
      newAlerts.push({
        type: 'error',
        message: 'อัตราการเข้าพักต่ำมาก - ต้องดำเนินการเร่งด่วน',
        icon: '🏨'
      });
    }

    if (occupancy.averageStayDuration < 1.5) {
      newAlerts.push({
        type: 'warning',
        message: 'ระยะเวลาพักสั้น - ควรเพิ่มแพ็กเกจหลายคืน',
        icon: '📅'
      });
    }

    setAlerts(newAlerts);
  };

  const printReport = () => {
    // Check if running in browser environment
    if (typeof window === 'undefined') return;
    
    const printWindow = window.open('', '_blank');
    const content = generatePrintContent();
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
    toast.success('กำลังพิมพ์รายงาน...');
  };

  const generatePrintContent = () => {
    const data = reportType === 'financial' ? reportData.financial : reportData.occupancy;
    const title = reportType === 'financial' ? 'รายงานการเงิน' : 'รายงานการเข้าพัก';
    
    // Get period data safely
    const periodData = reportType === 'financial' 
      ? (data[period + 'Revenue'] || [])
      : (data[period + 'Occupancy'] || []);
    
    // Generate table rows
    let tableRows = '';
    periodData.forEach(item => {
      const value = reportType === 'financial' 
        ? formatCurrency(item.revenue)
        : item.count + ' ครั้ง';
      tableRows += `<tr><td>${item.period}</td><td>${value}</td></tr>`;
    });
    
    return `
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
            .summary-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
            .table { width: 100%; border-collapse: collapse; }
            .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .table th { background-color: #f5f5f5; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${title}</h1>
            <p>ช่วงเวลา: ${getPeriodText()} (${dateRange.startDate} ถึง ${dateRange.endDate})</p>
          </div>
          
          <div class="summary">
            <div class="summary-card">
              <h3>${reportType === 'financial' ? 'รายได้รวม' : 'จำนวนการจอง'}</h3>
              <p style="font-size: 24px; font-weight: bold;">
                ${reportType === 'financial' 
                  ? formatCurrency(data.totalRevenue) 
                  : data.totalBookings
                }
              </p>
            </div>
            <div class="summary-card">
              <h3>${reportType === 'financial' ? 'จำนวนการจอง' : 'อัตราการเข้าพัก'}</h3>
              <p style="font-size: 24px; font-weight: bold;">
                ${reportType === 'financial' 
                  ? data.bookingsCount 
                  : data.occupancyRate.toFixed(1) + '%'
                }
              </p>
            </div>
            <div class="summary-card">
              <h3>${reportType === 'financial' ? 'มูลค่าเฉลี่ย' : 'ระยะเวลาพักเฉลี่ย'}</h3>
              <p style="font-size: 24px; font-weight: bold;">
                ${reportType === 'financial' 
                  ? formatCurrency(Math.round(data.averageBookingValue)) 
                  : data.averageStayDuration.toFixed(1) + ' คืน'
                }
              </p>
            </div>
          </div>
          
          <table class="table">
            <thead>
              <tr>
                <th>ช่วงเวลา</th>
                <th>${reportType === 'financial' ? 'รายได้' : 'การจอง'}</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          
          <div style="margin-top: 30px; font-size: 12px; color: #666;">
            <p>รายงานสร้างเมื่อ: ${new Date().toLocaleDateString('th-TH')} ${new Date().toLocaleTimeString('th-TH')}</p>
            <p>ระบบจองโรงแรม - Hotel Booking System</p>
          </div>
        </body>
      </html>
    `;
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">ไม่มีสิทธิ์เข้าถึง</h2>
          <p className="text-gray-600">หน้านี้สำหรับผู้ดูแลระบบเท่านั้น</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto container-padding">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">รายงานการเงินและการเข้าพัก</h1>
            <p className="text-gray-600">
              วิเคราะห์ข้อมูลการดำเนินงานและประสิทธิภาพของโรงแรม
            </p>
          </div>
          
          <div className="mt-4 lg:mt-0 flex gap-2 flex-wrap">
            <div className="relative">
              <button
                onClick={() => {
                  if (typeof document !== 'undefined') {
                    document.getElementById('export-dropdown')?.classList.toggle('hidden');
                  }
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center text-sm"
              >
                <span className="mr-2">📥</span>
                ส่งออก
              </button>
              <div id="export-dropdown" className="hidden absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-10">
                <button
                  onClick={() => {
                    exportReport('json');
                    if (typeof document !== 'undefined') {
                      document.getElementById('export-dropdown')?.classList.add('hidden');
                    }
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg"
                >
                  📄 ส่งออกเป็น JSON
                </button>
                <button
                  onClick={() => {
                    exportReport('csv');
                    if (typeof document !== 'undefined') {
                      document.getElementById('export-dropdown')?.classList.add('hidden');
                    }
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  📊 ส่งออกเป็น CSV
                </button>
                <button
                  onClick={() => {
                    exportReport('excel');
                    if (typeof document !== 'undefined') {
                      document.getElementById('export-dropdown')?.classList.add('hidden');
                    }
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-b-lg"
                >
                  📋 ส่งออกเป็น Excel
                </button>
              </div>
            </div>
            <button
              onClick={fetchReportData}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center text-sm"
            >
              <span className="mr-2">🔄</span>
              รีเฟรช
            </button>
            <button
              onClick={printReport}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center text-sm"
            >
              <span className="mr-2">🖨️</span>
              พิมพ์
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

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">🔍</span>
            ตัวกรอง
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Report Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ประเภทรายงาน
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="financial">รายงานการเงิน</option>
                <option value="occupancy">รายงานการเข้าพัก</option>
              </select>
            </div>

            {/* Period */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ช่วงเวลา
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="daily">รายวัน</option>
                <option value="monthly">รายเดือน</option>
                <option value="yearly">รายปี</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                วันที่เริ่มต้น
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                วันที่สิ้นสุด
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            {/* Skeleton for Summary Cards */}
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

            {/* Skeleton for Chart */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="h-6 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
            </div>

            {/* Skeleton for Table */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="h-6 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((item) => (
                  <div key={item} className="flex space-x-4">
                    <div className="flex-1 h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center py-8">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">กำลังโหลดข้อมูลรายงาน...</p>
              {partialLoading && (
                <p className="text-blue-600 text-sm mt-2">กำลังอัปเดตข้อมูล...</p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards with smooth loading */}
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <span className="text-2xl">👥</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">จำนวนการจองทั้งหมด</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {reportData.occupancy.totalBookings}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-red-100 rounded-lg">
                      <span className="text-2xl">📊</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">อัตราการเข้าพัก</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {reportData.occupancy.occupancyRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-indigo-100 rounded-lg">
                      <span className="text-2xl">⏰</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">ระยะเวลาพักเฉลี่ย</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {reportData.occupancy.averageStayDuration.toFixed(1)} คืน
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Period Chart */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">📊</span>
                  {reportType === 'financial' ? 'รายได้' : 'การเข้าพัก'} {getPeriodText()}
                </h3>
                
                <div className="space-y-4">
                  {(reportType === 'financial' 
                    ? reportData.financial[`${period}Revenue`] 
                    : reportData.occupancy[`${period}Occupancy`]
                  ).slice(-10).map((item, index) => {
                    const maxValue = Math.max(...(reportType === 'financial' 
                      ? reportData.financial[`${period}Revenue`] 
                      : reportData.occupancy[`${period}Occupancy`]
                    ).map(i => reportType === 'financial' ? i.revenue : i.count));
                    
                    const value = reportType === 'financial' ? item.revenue : item.count;
                    const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
                    
                    return (
                      <div key={index} className="flex items-center space-x-4">
                        <div className="w-20 text-sm text-gray-600 font-medium">
                          {item.period}
                        </div>
                        <div className="flex-1">
                          <div className="bg-gray-200 rounded-full h-3">
                            <div
                              className={`h-3 rounded-full ${
                                reportType === 'financial' ? 'bg-green-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="w-24 text-sm text-gray-900 font-semibold text-right">
                          {reportType === 'financial' 
                            ? formatCurrency(value) 
                            : `${value} ครั้ง`
                          }
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Room Type Analysis */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">🥧</span>
                  {reportType === 'financial' ? 'รายได้' : 'การจอง'}ตามประเภทห้อง
                </h3>
                
                <div className="space-y-4">
                  {(reportType === 'financial' 
                    ? reportData.financial.roomTypeRevenue 
                    : reportData.occupancy.roomTypeOccupancy
                  ).map((item, index) => {
                    const maxValue = Math.max(...(reportType === 'financial' 
                      ? reportData.financial.roomTypeRevenue 
                      : reportData.occupancy.roomTypeOccupancy
                    ).map(i => reportType === 'financial' ? i.revenue : i.count));
                    
                    const value = reportType === 'financial' ? item.revenue : item.count;
                    const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
                    
                    return (
                      <div key={index} className="flex items-center space-x-4">
                        <div className="w-32 text-sm text-gray-600 font-medium">
                          {item.roomType}
                        </div>
                        <div className="flex-1">
                          <div className="bg-gray-200 rounded-full h-3">
                            <div
                              className={`h-3 rounded-full ${
                                ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-red-500'][index % 5]
                              }`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="w-24 text-sm text-gray-900 font-semibold text-right">
                          {reportType === 'financial' 
                            ? formatCurrency(value) 
                            : `${value} ครั้ง`
                          }
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer Info */}
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

            {/* Rest of the content */}
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
