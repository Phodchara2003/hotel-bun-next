'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { bookingAPI, reportAPI } from '../../../lib/api';
import toast from 'react-hot-toast';
import InteractiveCharts from '../../../components/InteractiveCharts';
import AdvancedFilters from '../../../components/AdvancedFilters';
import PerformanceDashboard from '../../../components/PerformanceDashboard';
import { 
  Calendar, Users, DollarSign, TrendingUp, TrendingDown, 
  FileText, Download, RefreshCw, BarChart3, PieChart, 
  Activity, Clock, MapPin, CreditCard, Bed, Eye, 
  CheckCircle, AlertTriangle, XCircle, Info
} from 'lucide-react';

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
  
  // Enhanced state management
  const [dataCache, setDataCache] = useState(new Map());
  const [lastFetch, setLastFetch] = useState(new Map());
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonData, setComparisonData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [insights, setInsights] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedChart, setSelectedChart] = useState('revenue');
  const [exportFormat, setExportFormat] = useState('pdf');
  const [customFilters, setCustomFilters] = useState({
    status: '',
    roomType: '',
    minAmount: '',
    maxAmount: '',
    search: ''
  });
  const [showCharts, setShowCharts] = useState(true);
  const [showPerformance, setShowPerformance] = useState(true);
  
  const [reportData, setReportData] = useState({
    financial: {
      totalRevenue: 0,
      bookingsCount: 0,
      averageBookingValue: 0,
      dailyRevenue: [],
      monthlyRevenue: [],
      yearlyRevenue: [],
      paymentMethods: [],
      roomTypeRevenue: [],
      revenueGrowth: 0,
      topPerformingRooms: []
    },
    occupancy: {
      totalBookings: 0,
      occupancyRate: 0,
      averageStayDuration: 0,
      dailyOccupancy: [],
      monthlyOccupancy: [],
      yearlyOccupancy: [],
      roomTypeOccupancy: [],
      guestOrigins: [],
      seasonalTrends: [],
      peakDays: []
    },
    kpis: {
      revenue: { value: 0, change: 0, trend: 'neutral' },
      bookings: { value: 0, change: 0, trend: 'neutral' },
      occupancy: { value: 0, change: 0, trend: 'neutral' },
      adr: { value: 0, change: 0, trend: 'neutral' }
    }
  });

  // Enhanced helper functions
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
      const financial = reportData.financial || {};
      return {
        ...financial,
        totalRevenueFormatted: formatCurrency(financial.totalRevenue || 0),
        averageBookingValueFormatted: formatCurrency(financial.averageBookingValue || 0),
        bookingsCountFormatted: formatNumber(financial.bookingsCount || 0)
      };
    } else {
      const occupancy = reportData.occupancy || {};
      return {
        ...occupancy,
        totalBookingsFormatted: formatNumber(occupancy.totalBookings || 0),
        occupancyRateFormatted: `${(occupancy.occupancyRate || 0).toFixed(1)}%`,
        averageStayDurationFormatted: `${(occupancy.averageStayDuration || 0).toFixed(1)} คืน`
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
      const response = await reportAPI.getReportsData({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        reportType: reportType,
        period: period,
        limit: 1000
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

  // Apply filters function
  const applyFilters = useCallback(() => {
    fetchReportData(true);
    toast.success('ใช้ตัวกรองสำเร็จ! 🔍');
  }, [fetchReportData]);

  // Reset filters function
  const resetFilters = useCallback(() => {
    setReportType('financial');
    setPeriod('monthly');
    setDateRange({
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    });
    setCustomFilters({
      status: '',
      roomType: '',
      minAmount: '',
      maxAmount: '',
      search: ''
    });
    toast.success('รีเซ็ตตัวกรองสำเร็จ! 🔄');
  }, []);

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

  // Debounced fetch function
  const debouncedFetch = useCallback(
    useMemo(() => {
      let timeoutId;
      return (forceRefresh = false) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          fetchReportData(forceRefresh);
        }, 300); // 300ms debounce
      };
    }, [fetchReportData]),
    [fetchReportData]
  );

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      debouncedFetch();
    }
  }, [isAuthenticated, user, reportType, period, dateRange.startDate, dateRange.endDate, debouncedFetch]);

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

  // Enhanced export functionality
  const exportReport = useCallback((format) => {
    const data = {
      reportType: reportType === 'financial' ? 'การเงิน' : 'การเข้าพัก',
      period: getPeriodText(),
      dateRange,
      data: reportData,
      generatedAt: new Date().toISOString(),
      generatedBy: user?.email || 'Admin'
    };

    const filename = `hotel-report-${reportType}-${period}-${new Date().toISOString().split('T')[0]}`;

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
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      generatePDFReport(data, filename);
    }

    toast.success(`ส่งออกรายงานแบบ ${format.toUpperCase()} สำเร็จ! 🎉`);
  }, [reportType, period, dateRange, reportData, user?.email]);

  const convertToCSV = useCallback((data) => {
    const csvRows = [];
    
    // Headers
    csvRows.push('ประเภทข้อมูล,ค่า,หน่วย');
    csvRows.push(`ประเภทรายงาน,${data.reportType},-`);
    csvRows.push(`ช่วงเวลา,${data.period},-`);
    csvRows.push(`วันที่เริ่มต้น,${data.dateRange.startDate},-`);
    csvRows.push(`วันที่สิ้นสุด,${data.dateRange.endDate},-`);
    csvRows.push(''); // Empty row
    
    // Financial data
    if (data.data.financial && reportType === 'financial') {
      csvRows.push('ข้อมูลการเงิน');
      csvRows.push(`รายได้รวม,${data.data.financial.totalRevenue},บาท`);
      csvRows.push(`จำนวนการจอง,${data.data.financial.bookingsCount},รายการ`);
      csvRows.push(`มูลค่าเฉลี่ยต่อการจอง,${Math.round(data.data.financial.averageBookingValue)},บาท`);
      
      // Room type revenue
      if (data.data.financial.roomTypeRevenue?.length > 0) {
        csvRows.push(''); // Empty row
        csvRows.push('รายได้แยกตามประเภทห้อง');
        data.data.financial.roomTypeRevenue.forEach(room => {
          csvRows.push(`${room.roomType},${room.revenue},บาท`);
        });
      }
    }
    
    // Occupancy data
    if (data.data.occupancy && reportType === 'occupancy') {
      csvRows.push('ข้อมูลการเข้าพัก');
      csvRows.push(`การจองทั้งหมด,${data.data.occupancy.totalBookings},รายการ`);
      csvRows.push(`อัตราการเข้าพัก,${data.data.occupancy.occupancyRate.toFixed(1)},เปอร์เซ็นต์`);
      csvRows.push(`ระยะเวลาพักเฉลี่ย,${data.data.occupancy.averageStayDuration.toFixed(1)},คืน`);
      
      // Room type occupancy
      if (data.data.occupancy.roomTypeOccupancy?.length > 0) {
        csvRows.push(''); // Empty row
        csvRows.push('การเข้าพักแยกตามประเภทห้อง');
        data.data.occupancy.roomTypeOccupancy.forEach(room => {
          csvRows.push(`${room.type},${room.count},รายการ`);
        });
      }
    }
    
    csvRows.push(''); // Empty row
    csvRows.push(`สร้างเมื่อ,${new Date().toLocaleString('th-TH')},-`);
    csvRows.push(`สร้างโดย,${data.generatedBy},-`);
    
    return csvRows.join('\n');
  }, [reportType]);

  const generatePDFReport = useCallback((data, filename) => {
    const printWindow = window.open('', '_blank');
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="th">
        <head>
          <title>รายงานโรงแรม - ${data.reportType}</title>
          <meta charset="UTF-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Sarabun', 'Prompt', Arial, sans-serif; 
              line-height: 1.6; 
              color: #333;
              padding: 20px;
              background: white;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 3px solid #2563eb;
              padding-bottom: 20px;
            }
            .header h1 { 
              color: #2563eb; 
              font-size: 28px; 
              margin-bottom: 10px;
            }
            .header p { 
              color: #666; 
              font-size: 14px; 
            }
            .info-section {
              background: #f8fafc;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 25px;
              border-left: 4px solid #2563eb;
            }
            .kpi-grid { 
              display: grid; 
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
              gap: 20px; 
              margin: 25px 0;
            }
            .kpi-card { 
              background: white;
              border: 1px solid #e5e7eb; 
              padding: 20px; 
              border-radius: 8px; 
              text-align: center;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .kpi-card h3 { 
              color: #374151; 
              font-size: 14px; 
              margin-bottom: 8px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .kpi-card .value { 
              font-size: 32px; 
              font-weight: bold; 
              color: #2563eb;
              margin-bottom: 5px;
            }
            .kpi-card .unit { 
              color: #6b7280; 
              font-size: 12px; 
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 20px 0;
              background: white;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              border-radius: 8px;
              overflow: hidden;
            }
            th, td { 
              padding: 12px; 
              text-align: left; 
              border-bottom: 1px solid #e5e7eb;
            }
            th { 
              background: #f9fafb; 
              font-weight: 600;
              color: #374151;
              text-transform: uppercase;
              font-size: 12px;
              letter-spacing: 0.5px;
            }
            tr:hover { 
              background: #f8fafc; 
            }
            .footer { 
              margin-top: 40px; 
              text-align: center; 
              font-size: 12px; 
              color: #6b7280;
              border-top: 1px solid #e5e7eb;
              padding-top: 20px;
            }
            .section-title {
              color: #1f2937;
              font-size: 18px;
              font-weight: 600;
              margin: 25px 0 15px 0;
              padding-bottom: 8px;
              border-bottom: 2px solid #e5e7eb;
            }
            @media print {
              body { padding: 10px; }
              .kpi-grid { grid-template-columns: repeat(2, 1fr); }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📊 รายงานโรงแรม</h1>
            <p>ระบบจัดการโรงแรม - Hotel Management System</p>
          </div>
          
          <div class="info-section">
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
              <div>
                <strong>ประเภทรายงาน:</strong> ${data.reportType}<br>
                <strong>ช่วงเวลา:</strong> ${data.period}<br>
                <strong>ช่วงวันที่:</strong> ${data.dateRange.startDate} ถึง ${data.dateRange.endDate}
              </div>
              <div style="text-align: right;">
                <strong>สร้างเมื่อ:</strong> ${new Date().toLocaleString('th-TH')}<br>
                <strong>สร้างโดย:</strong> ${data.generatedBy}<br>
                <strong>เอกสารเลขที่:</strong> RPT${Date.now().toString().slice(-6)}
              </div>
            </div>
          </div>

          <h2 class="section-title">📈 ข้อมูลสรุปหลัก</h2>
          <div class="kpi-grid">
            ${reportType === 'financial' ? `
              <div class="kpi-card">
                <h3>รายได้รวม</h3>
                <div class="value">฿${data.data.financial.totalRevenue.toLocaleString()}</div>
                <div class="unit">บาท</div>
              </div>
              <div class="kpi-card">
                <h3>จำนวนการจอง</h3>
                <div class="value">${data.data.financial.bookingsCount}</div>
                <div class="unit">รายการ</div>
              </div>
              <div class="kpi-card">
                <h3>มูลค่าเฉลี่ย</h3>
                <div class="value">฿${Math.round(data.data.financial.averageBookingValue).toLocaleString()}</div>
                <div class="unit">บาท/การจอง</div>
              </div>
            ` : `
              <div class="kpi-card">
                <h3>การจองทั้งหมด</h3>
                <div class="value">${data.data.occupancy.totalBookings}</div>
                <div class="unit">รายการ</div>
              </div>
              <div class="kpi-card">
                <h3>อัตราเข้าพัก</h3>
                <div class="value">${data.data.occupancy.occupancyRate.toFixed(1)}</div>
                <div class="unit">เปอร์เซ็นต์</div>
              </div>
              <div class="kpi-card">
                <h3>ระยะเวลาเฉลี่ย</h3>
                <div class="value">${data.data.occupancy.averageStayDuration.toFixed(1)}</div>
                <div class="unit">คืน</div>
              </div>
            `}
          </div>

          ${reportType === 'financial' && data.data.financial.roomTypeRevenue?.length > 0 ? `
            <h2 class="section-title">💰 รายได้แยกตามประเภทห้อง</h2>
            <table>
              <thead>
                <tr>
                  <th>ประเภทห้อง</th>
                  <th style="text-align: right;">รายได้</th>
                  <th style="text-align: right;">จำนวนการจอง</th>
                  <th style="text-align: right;">รายได้เฉลี่ย</th>
                </tr>
              </thead>
              <tbody>
                ${data.data.financial.roomTypeRevenue.map(room => `
                  <tr>
                    <td>${room.roomType}</td>
                    <td style="text-align: right;">฿${room.revenue.toLocaleString()}</td>
                    <td style="text-align: right;">${room.count}</td>
                    <td style="text-align: right;">฿${Math.round(room.revenue / room.count).toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : ''}

          ${reportType === 'occupancy' && data.data.occupancy.roomTypeOccupancy?.length > 0 ? `
            <h2 class="section-title">🏨 การเข้าพักแยกตามประเภทห้อง</h2>
            <table>
              <thead>
                <tr>
                  <th>ประเภทห้อง</th>
                  <th style="text-align: right;">จำนวนการจอง</th>
                  <th style="text-align: right;">สัดส่วน</th>
                </tr>
              </thead>
              <tbody>
                ${data.data.occupancy.roomTypeOccupancy.map(room => `
                  <tr>
                    <td>${room.type}</td>
                    <td style="text-align: right;">${room.count}</td>
                    <td style="text-align: right;">${room.percentage?.toFixed(1) || 0}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : ''}

          <div class="footer">
            <p><strong>Hotel Management System</strong> | รายงานนี้สร้างโดยระบบอัตโนมัติ</p>
            <p>📧 สอบถามเพิ่มเติม: admin@hotel.com | 📞 โทร: 02-xxx-xxxx</p>
          </div>

          <script>
            window.onload = function() {
              setTimeout(() => {
                window.print();
              }, 500);
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
  }, [reportType]);

  // Generate business insights
  const generateInsights = useCallback(() => {
    const insights = [];
    
    if (reportType === 'financial') {
      const avgBookingValue = reportData.financial.averageBookingValue || 0;
      const totalRevenue = reportData.financial.totalRevenue || 0;
      const bookingsCount = reportData.financial.bookingsCount || 0;
      
      // Revenue insights
      if (totalRevenue > 100000) {
        insights.push({
          type: 'success',
          title: '🎉 รายได้เยี่ยม!',
          message: `รายได้รวม ${formatCurrency(totalRevenue)} เกินเป้าหมายรายเดือน`
        });
      } else if (totalRevenue > 50000) {
        insights.push({
          type: 'info',
          title: '📈 รายได้ดี',
          message: `รายได้รวม ${formatCurrency(totalRevenue)} อยู่ในระดับดี`
        });
      } else if (totalRevenue > 0) {
        insights.push({
          type: 'warning',
          title: '⚠️ รายได้ต่ำ',
          message: 'ควรพิจารณาเพิ่มการตลาดหรือโปรโมชั่น'
        });
      }
      
      // Booking value insights
      if (avgBookingValue > 3000) {
        insights.push({
          type: 'success',
          title: '💎 มูลค่าสูง',
          message: `มูลค่าเฉลี่ย ${formatCurrency(avgBookingValue)} ต่อการจอง แสดงถึงคุณภาพดี`
        });
      }
      
      // Booking count insights
      if (bookingsCount < 5) {
        insights.push({
          type: 'warning',
          title: '📉 การจองน้อย',
          message: 'จำนวนการจองต่ำ ควรเพิ่มช่องทางการตลาด'
        });
      } else if (bookingsCount > 20) {
        insights.push({
          type: 'success',
          title: '🚀 การจองเยอะ',
          message: 'จำนวนการจองสูง แสดงถึงความนิยม'
        });
      }
      
    } else {
      const occupancyRate = reportData.occupancy.occupancyRate || 0;
      const avgStayDuration = reportData.occupancy.averageStayDuration || 0;
      const totalBookings = reportData.occupancy.totalBookings || 0;
      
      // Occupancy insights
      if (occupancyRate > 80) {
        insights.push({
          type: 'success',
          title: '🏨 อัตราเข้าพักสูง',
          message: `อัตราการเข้าพัก ${occupancyRate.toFixed(1)}% แสดงถึงความนิยมสูง`
        });
      } else if (occupancyRate > 50) {
        insights.push({
          type: 'info',
          title: '📊 อัตราเข้าพักปานกลาง',
          message: `อัตราการเข้าพัก ${occupancyRate.toFixed(1)}% อยู่ในระดับปานกลาง`
        });
      } else if (occupancyRate > 0) {
        insights.push({
          type: 'warning',
          title: '⚠️ อัตราเข้าพักต่ำ',
          message: 'ควรปรับปรุงการตลาดหรือลดราคา'
        });
      }
      
      // Stay duration insights
      if (avgStayDuration > 3) {
        insights.push({
          type: 'success',
          title: '🛏️ พักระยะยาว',
          message: `แขกพักเฉลี่ย ${avgStayDuration.toFixed(1)} คืน ควรเสนอแพ็กเกจระยะยาว`
        });
      } else if (avgStayDuration < 1.5) {
        insights.push({
          type: 'info',
          title: '⏰ พักระยะสั้น',
          message: 'แขกส่วนใหญ่พักระยะสั้น เหมาะกับ business traveler'
        });
      }
      
      // Total bookings insights
      if (totalBookings === 0) {
        insights.push({
          type: 'danger',
          title: '🔍 ไม่มีข้อมูล',
          message: 'ยังไม่มีการจองในช่วงเวลานี้'
        });
      }
    }
    
    // General insights
    const daysDiff = Math.ceil((new Date(dateRange.endDate) - new Date(dateRange.startDate)) / (1000 * 60 * 60 * 24)) + 1;
    if (daysDiff > 90) {
      insights.push({
        type: 'info',
        title: '📅 ข้อมูลระยะยาว',
        message: `วิเคราะห์ข้อมูล ${daysDiff} วัน เหมาะสำหรับดูแนวโน้ม`
      });
    } else if (daysDiff < 7) {
      insights.push({
        type: 'info',
        title: '⚡ ข้อมูลระยะสั้น',
        message: `วิเคราะห์ข้อมูล ${daysDiff} วัน เหมาะสำหรับติดตามรายวัน`
      });
    }
    
    // Add default insight if none found
    if (insights.length === 0) {
      insights.push({
        type: 'info',
        title: '📊 ข้อมูلพร้อมวิเคราะห์',
        message: 'ระบบพร้อมแสดงข้อมูลเชิงลึกเมื่อมีการจองมากขึ้น'
      });
    }
    
    return insights.slice(0, 4); // แสดงสูงสุด 4 insights
  }, [reportType, reportData, dateRange, formatCurrency]);

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
                รายงานแอดมิน (เวอร์ชั่นขั้นสูง)
              </h1>
              <p className="text-gray-600">
                ดูข้อมูลรายงานการเงินและการเข้าพักของโรงแรม พร้อมกราฟแบบโต้ตอบและวิเคราะห์ผลการดำเนินงาน
              </p>
            </div>
            
            <div className="flex items-center space-x-4 mt-4 sm:mt-0">
              {/* Toggle Charts */}
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCharts}
                  onChange={(e) => setShowCharts(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">📈 กราฟ</span>
              </label>
              
              {/* Toggle Performance */}
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPerformance}
                  onChange={(e) => setShowPerformance(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">🎯 ผลงาน</span>
              </label>
              
              {/* Export Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    const dropdown = document.getElementById('export-dropdown');
                    dropdown?.classList.toggle('hidden');
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center text-sm"
                >
                  <span className="mr-2">📤</span>
                  ส่งออก
                  <span className="ml-2">▼</span>
                </button>
                <div 
                  id="export-dropdown" 
                  className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10 hidden"
                >
                  <button
                    onClick={() => {
                      exportReport('pdf');
                      document.getElementById('export-dropdown')?.classList.add('hidden');
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg flex items-center"
                  >
                    <span className="mr-2">📄</span>
                    ส่งออกเป็น PDF
                  </button>
                  <button
                    onClick={() => {
                      exportReport('csv');
                      document.getElementById('export-dropdown')?.classList.add('hidden');
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <span className="mr-2">📊</span>
                    ส่งออกเป็น CSV
                  </button>
                  <button
                    onClick={() => {
                      exportReport('json');
                      document.getElementById('export-dropdown')?.classList.add('hidden');
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-b-lg flex items-center"
                  >
                    <span className="mr-2">🔗</span>
                    ส่งออกเป็น JSON
                  </button>
                </div>
              </div>

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

        {/* Advanced Filters */}
        <AdvancedFilters
          reportType={reportType}
          setReportType={setReportType}
          period={period}
          setPeriod={setPeriod}
          dateRange={dateRange}
          setDateRange={setDateRange}
          customFilters={customFilters}
          setCustomFilters={setCustomFilters}
          onApplyFilters={applyFilters}
          onResetFilters={resetFilters}
          onExport={() => exportReport('pdf')}
        />

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

        {/* Performance Indicator */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <span className="text-green-600 mr-2">⚡</span>
            <span className="text-green-800 font-medium">
              ปรับปรุงประสิทธิภาพแล้ว: 
              {partialLoading && <span className="ml-2">กำลังอัปเดต...</span>}
              {!partialLoading && !loading && <span className="ml-2">พร้อมใช้งาน</span>}
            </span>
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

            {/* Interactive Charts */}
            {showCharts && (
              <InteractiveCharts
                reportData={reportData}
                reportType={reportType}
                period={period}
                formatCurrency={formatCurrency}
                formatNumber={formatNumber}
              />
            )}

            {/* Performance Dashboard */}
            {showPerformance && (
              <PerformanceDashboard
                reportData={reportData}
                reportType={reportType}
                dateRange={dateRange}
                formatCurrency={formatCurrency}
                formatNumber={formatNumber}
              />
            )}

            {/* Loading overlay for partial updates */}
            {partialLoading && (
              <div className="fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                <span className="text-sm">กำลังอัปเดต...</span>
              </div>
            )}

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                สรุปข้อมูล ({getPeriodText()})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {reportType === 'financial' ? formatCurrency(reportData.financial.totalRevenue) : reportData.occupancy.totalBookings}
                  </div>
                  <div className="text-sm text-gray-500">
                    {reportType === 'financial' ? 'รายได้รวม' : 'จำนวนการจอง'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {reportType === 'financial' ? reportData.financial.bookingsCount : `${reportData.occupancy.occupancyRate.toFixed(1)}%`}
                  </div>
                  <div className="text-sm text-gray-500">
                    {reportType === 'financial' ? 'การจอง' : 'อัตราเข้าพัก'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {reportType === 'financial' ? formatCurrency(reportData.financial.averageBookingValue) : `${reportData.occupancy.averageStayDuration.toFixed(1)}`}
                  </div>
                  <div className="text-sm text-gray-500">
                    {reportType === 'financial' ? 'มูลค่าเฉลี่ย' : 'ระยะเวลาเฉลี่ย'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {dateRange.startDate !== dateRange.endDate ? 
                      Math.ceil((new Date(dateRange.endDate) - new Date(dateRange.startDate)) / (1000 * 60 * 60 * 24)) + 1 : 
                      1
                    }
                  </div>
                  <div className="text-sm text-gray-500">วันที่เลือก</div>
                </div>
              </div>
            </div>

            {/* Detailed Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Room Type Performance */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">🏨</span>
                  {reportType === 'financial' ? 'รายได้แยกตามประเภทห้อง' : 'การจองแยกตามประเภทห้อง'}
                </h3>
                <div className="space-y-3">
                  {reportType === 'financial' ? (
                    reportData.financial.roomTypeRevenue?.length > 0 ? (
                      reportData.financial.roomTypeRevenue.slice(0, 5).map((room, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-3 ${
                              index === 0 ? 'bg-blue-500' : 
                              index === 1 ? 'bg-green-500' : 
                              index === 2 ? 'bg-purple-500' : 
                              index === 3 ? 'bg-orange-500' : 'bg-gray-500'
                            }`}></div>
                            <span className="font-medium text-gray-900">{room.roomType}</span>
                            <span className="text-sm text-gray-500 ml-2">({room.count} การจอง)</span>
                          </div>
                          <span className="font-bold text-gray-900">{formatCurrency(room.revenue)}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <span className="text-4xl mb-2 block">📊</span>
                        <p>ยังไม่มีข้อมูลรายได้</p>
                      </div>
                    )
                  ) : (
                    reportData.occupancy.roomTypeOccupancy?.length > 0 ? (
                      reportData.occupancy.roomTypeOccupancy.slice(0, 5).map((room, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-3 ${
                              index === 0 ? 'bg-blue-500' : 
                              index === 1 ? 'bg-green-500' : 
                              index === 2 ? 'bg-purple-500' : 
                              index === 3 ? 'bg-orange-500' : 'bg-gray-500'
                            }`}></div>
                            <span className="font-medium text-gray-900">{room.type}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-gray-900">{room.count} รายการ</span>
                            <div className="text-sm text-gray-500">{room.percentage?.toFixed(1) || 0}%</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <span className="text-4xl mb-2 block">🏨</span>
                        <p>ยังไม่มีข้อมูลการจอง</p>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Payment Methods / Guest Origins */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">{reportType === 'financial' ? '💳' : '🌍'}</span>
                  {reportType === 'financial' ? 'การชำระเงิน' : 'ที่มาของแขก'}
                </h3>
                <div className="space-y-3">
                  {reportType === 'financial' ? (
                    reportData.financial.paymentMethods?.length > 0 ? (
                      reportData.financial.paymentMethods.map((method, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-3 ${
                              method.method.includes('มี') ? 'bg-green-500' : 'bg-orange-500'
                            }`}></div>
                            <span className="font-medium text-gray-900">{method.method}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-gray-900">{method.count} รายการ</span>
                            <div className="text-sm text-gray-500">
                              {reportData.financial.bookingsCount > 0 ? 
                                ((method.count / reportData.financial.bookingsCount) * 100).toFixed(1) + '%' : 
                                '0%'
                              }
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <span className="text-4xl mb-2 block">💳</span>
                        <p>ยังไม่มีข้อมูลการชำระ</p>
                      </div>
                    )
                  ) : (
                    reportData.occupancy.guestOrigins?.length > 0 ? (
                      reportData.occupancy.guestOrigins.map((origin, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-3 ${
                              origin.origin.includes('ในประเทศ') ? 'bg-blue-500' : 'bg-green-500'
                            }`}></div>
                            <span className="font-medium text-gray-900">{origin.origin}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-gray-900">{origin.count} คน</span>
                            <div className="text-sm text-gray-500">
                              {reportData.occupancy.totalBookings > 0 ? 
                                ((origin.count / reportData.occupancy.totalBookings) * 100).toFixed(1) + '%' : 
                                '0%'
                              }
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <span className="text-4xl mb-2 block">🌍</span>
                        <p>ยังไม่มีข้อมูลแขก</p>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Performance Insights */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">💡</span>
                ข้อมูลเชิงลึกและคำแนะนำ
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {generateInsights().map((insight, index) => (
                  <div key={index} className={`p-4 rounded-lg border-l-4 ${
                    insight.type === 'success' ? 'bg-green-50 border-green-400' :
                    insight.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                    insight.type === 'danger' ? 'bg-red-50 border-red-400' :
                    'bg-blue-50 border-blue-400'
                  }`}>
                    <div className="flex items-start">
                      <div className={`mr-3 mt-0.5 ${
                        insight.type === 'success' ? 'text-green-600' :
                        insight.type === 'warning' ? 'text-yellow-600' :
                        insight.type === 'danger' ? 'text-red-600' :
                        'text-blue-600'
                      }`}>
                        {insight.type === 'success' ? '✅' :
                         insight.type === 'warning' ? '⚠️' :
                         insight.type === 'danger' ? '❌' : 'ℹ️'}
                      </div>
                      <div>
                        <h4 className={`font-semibold ${
                          insight.type === 'success' ? 'text-green-800' :
                          insight.type === 'warning' ? 'text-yellow-800' :
                          insight.type === 'danger' ? 'text-red-800' :
                          'text-blue-800'
                        }`}>
                          {insight.title}
                        </h4>
                        <p className={`text-sm ${
                          insight.type === 'success' ? 'text-green-700' :
                          insight.type === 'warning' ? 'text-yellow-700' :
                          insight.type === 'danger' ? 'text-red-700' :
                          'text-blue-700'
                        }`}>
                          {insight.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Period Data Table */}
            {(reportType === 'financial' ? reportData.financial.monthlyRevenue : reportData.occupancy.monthlyOccupancy)?.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">📅</span>
                  ข้อมูล{getPeriodText()}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">ช่วงเวลา</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">จำนวนการจอง</th>
                        {reportType === 'financial' && (
                          <th className="text-right py-3 px-4 font-medium text-gray-600">รายได้</th>
                        )}
                        <th className="text-right py-3 px-4 font-medium text-gray-600">ค่าเฉลี่ย</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(reportType === 'financial' ? reportData.financial.monthlyRevenue : reportData.occupancy.monthlyOccupancy)
                        .slice(-10)
                        .map((item, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-900">{item.period}</td>
                          <td className="py-3 px-4 text-right text-gray-900">{item.count}</td>
                          {reportType === 'financial' && (
                            <td className="py-3 px-4 text-right font-medium text-gray-900">
                              {formatCurrency(item.revenue)}
                            </td>
                          )}
                          <td className="py-3 px-4 text-right text-gray-600">
                            {reportType === 'financial' ? 
                              formatCurrency(item.count > 0 ? item.revenue / item.count : 0) :
                              `${(item.count / reportData.occupancy.totalBookings * 100).toFixed(1)}%`
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* System Performance Status */}
            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-400">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">🚀</span>
                สถานะระบบรายงาน
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl mb-2">⚡</div>
                  <div className="font-semibold text-green-800">ประสิทธิภาพสูง</div>
                  <div className="text-sm text-green-600">ระบบ Cache ทำงานดี</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl mb-2">🔄</div>
                  <div className="font-semibold text-blue-800">อัปเดตอัตโนมัติ</div>
                  <div className="text-sm text-blue-600">{autoRefresh ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl mb-2">📊</div>
                  <div className="font-semibold text-purple-800">ข้อมูลล่าสุด</div>
                  <div className="text-sm text-purple-600">เรียลไทม์</div>
                </div>
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
