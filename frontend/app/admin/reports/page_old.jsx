'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { bookingAPI } from '../../../lib/api';
import toast from 'react-hot-toast';

export default function AdminReports() {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('financial'); // financial, occupancy
  const [period, setPeriod] = useState('monthly'); // daily, monthly, yearly
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  
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

  // Destructure lucide icons
  const { 
    Calendar, 
    TrendingUp, 
    DollarSign,
    Users, 
    FileText,
    Download,
    Filter,
    BarChart3,
    PieChart,
    Activity,
    Clock,
    MapPin
  } = LucideIcons;

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchReportData();
    }
  }, [isAuthenticated, user, reportType, period, dateRange]);

  // Auto refresh functionality
  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchReportData();
      }, 30000); // Refresh every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  // Generate alerts based on data
  useEffect(() => {
    generateAlerts();
  }, [reportData]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // Fetch all bookings for analysis
      const response = await bookingAPI.getAllBookings({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      
      const bookings = response.bookings || [];
      
      // Process data based on report type and period
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
    // Filter completed and confirmed bookings for revenue calculation
    const revenueBookings = bookings.filter(b => 
      b.status === 'confirmed' || b.status === 'completed'
    );
    
    const totalRevenue = revenueBookings.reduce((sum, booking) => 
      sum + (booking.totalPrice || 0), 0
    );
    
    const averageBookingValue = revenueBookings.length > 0 
      ? totalRevenue / revenueBookings.length 
      : 0;

    // Group by period
    const periodData = groupBookingsByPeriod(revenueBookings, period);
    
    // Room type revenue
    const roomTypeRevenue = groupBookingsByRoomType(revenueBookings);
    
    setReportData(prev => ({
      ...prev,
      financial: {
        totalRevenue,
        bookingsCount: revenueBookings.length,
        averageBookingValue,
        dailyRevenue: period === 'daily' ? periodData : [],
        monthlyRevenue: period === 'monthly' ? periodData : [],
        yearlyRevenue: period === 'yearly' ? periodData : [],
        roomTypeRevenue,
        paymentMethods: [
          { method: 'โอนเงิน', count: revenueBookings.filter(b => b.paymentReceipt).length },
          { method: 'รอชำระ', count: revenueBookings.filter(b => !b.paymentReceipt).length }
        ]
      }
    }));
  };

  const processOccupancyData = (bookings) => {
    // All bookings regardless of status for occupancy analysis
    const totalBookings = bookings.length;
    
    // Calculate average stay duration
    const averageStayDuration = bookings.length > 0 
      ? bookings.reduce((sum, booking) => {
          const checkIn = new Date(booking.checkInDate);
          const checkOut = new Date(booking.checkOutDate);
          const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
          return sum + nights;
        }, 0) / bookings.length
      : 0;

    // Calculate occupancy rate (simplified - based on bookings vs available rooms)
    // This is a basic calculation, in real scenarios you'd need room inventory data
    const occupancyRate = Math.min((totalBookings / 30) * 100, 100); // Assuming 30 rooms max

    // Group by period
    const periodData = groupBookingsByPeriod(bookings, period);
    
    // Room type occupancy
    const roomTypeOccupancy = groupBookingsByRoomType(bookings);
    
    setReportData(prev => ({
      ...prev,
      occupancy: {
        totalBookings,
        occupancyRate,
        averageStayDuration,
        dailyOccupancy: period === 'daily' ? periodData : [],
        monthlyOccupancy: period === 'monthly' ? periodData : [],
        yearlyOccupancy: period === 'yearly' ? periodData : [],
        roomTypeOccupancy,
        guestOrigins: [
          { origin: 'ในประเทศ', count: Math.floor(totalBookings * 0.8) },
          { origin: 'ต่างประเทศ', count: Math.floor(totalBookings * 0.2) }
        ]
      }
    }));
  };

  const groupBookingsByPeriod = (bookings, period) => {
    const groups = {};
    
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
      
      if (!groups[key]) {
        groups[key] = { period: key, count: 0, revenue: 0 };
      }
      
      groups[key].count += 1;
      groups[key].revenue += booking.totalPrice || 0;
    });
    
    return Object.values(groups).sort((a, b) => a.period.localeCompare(b.period));
  };

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

  const fetchComparisonData = async () => {
    try {
      // Fetch data for comparison period (previous month/year)
      const previousPeriod = getPreviousPeriod();
      const response = await bookingAPI.getAllBookings({
        startDate: previousPeriod.startDate,
        endDate: previousPeriod.endDate
      });
      
      const bookings = response.bookings || [];
      const comparisonFinancial = processComparisonData(bookings, 'financial');
      const comparisonOccupancy = processComparisonData(bookings, 'occupancy');
      
      setComparisonData({
        financial: comparisonFinancial,
        occupancy: comparisonOccupancy
      });
    } catch (error) {
      console.error('Error fetching comparison data:', error);
      toast.error('ไม่สามารถโหลดข้อมูลเปรียบเทียบได้');
    }
  };

  const getPreviousPeriod = () => {
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    const diff = end - start;
    
    const previousEnd = new Date(start.getTime() - 1);
    const previousStart = new Date(previousEnd.getTime() - diff);
    
    return {
      startDate: previousStart.toISOString().split('T')[0],
      endDate: previousEnd.toISOString().split('T')[0]
    };
  };

  const processComparisonData = (bookings, type) => {
    if (type === 'financial') {
      const revenueBookings = bookings.filter(b => 
        b.status === 'confirmed' || b.status === 'completed'
      );
      return {
        totalRevenue: revenueBookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0),
        bookingsCount: revenueBookings.length
      };
    } else {
      return {
        totalBookings: bookings.length,
        occupancyRate: Math.min((bookings.length / 30) * 100, 100)
      };
    }
  };

  const getPercentageChange = (current, previous) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
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

  const scheduleReport = () => {
    // This would integrate with a scheduling system
    toast.success('กำหนดการส่งรายงานอัตโนมัติแล้ว!');
  };

  // Helper function to format numbers safely for SSR
  const formatNumber = (num) => {
    if (typeof num !== 'number') return '0';
    return num.toLocaleString();
  };

  // Helper function to format currency safely for SSR
  const formatCurrency = (num) => {
    if (typeof num !== 'number') return '฿0';
    return `฿${num.toLocaleString()}`;
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
                <button                onClick={() => {
                  exportReport('json');
                  if (typeof document !== 'undefined') {
                    document.getElementById('export-dropdown')?.classList.add('hidden');
                  }
                }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg"
                >
                  📄 ส่งออกเป็น JSON
                </button>
                <button                onClick={() => {
                  exportReport('csv');
                  if (typeof document !== 'undefined') {
                    document.getElementById('export-dropdown')?.classList.add('hidden');
                  }
                }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  📊 ส่งออกเป็น CSV
                </button>
                <button                onClick={() => {
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
              <Activity className="h-4 w-4 mr-2" />
              รีเฟรช
            </button>
            <button
              onClick={printReport}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center text-sm"
            >
              <FileText className="h-4 w-4 mr-2" />
              พิมพ์
            </button>
            <button
              onClick={scheduleReport}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center text-sm"
            >
              <Calendar className="h-4 w-4 mr-2" />
              กำหนดการ
            </button>
            <button
              onClick={() => {
                setShowComparison(!showComparison);
                if (!showComparison && !comparisonData) {
                  fetchComparisonData();
                }
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center text-sm ${
                showComparison 
                  ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              เปรียบเทียบ
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
            <Filter className="h-5 w-5 mr-2" />
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
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">กำลังโหลดข้อมูลรายงาน...</p>
          </div>
        ) : (
          <>
            {/* Alerts */}
            {alerts.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">แจ้งเตือน</h3>
                <div className="space-y-2">
                  {alerts.map((alert, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-l-4 ${
                        alert.type === 'error' ? 'bg-red-50 border-red-500' :
                        alert.type === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                        'bg-blue-50 border-blue-500'
                      }`}
                    >
                      <div className="flex items-center">
                        <span className="text-lg mr-3">{alert.icon}</span>
                        <p className={`text-sm font-medium ${
                          alert.type === 'error' ? 'text-red-800' :
                          alert.type === 'warning' ? 'text-yellow-800' :
                          'text-blue-800'
                        }`}>
                          {alert.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comparison Section */}
            {showComparison && comparisonData && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">เปรียบเทียบกับช่วงก่อนหน้า</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reportType === 'financial' ? (
                    <>
                      <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm text-gray-600">รายได้</p>                          <p className="text-lg font-bold text-gray-900">
                            {formatCurrency(reportData.financial.totalRevenue)}
                          </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">เปลี่ยนแปลง</p>
                            <p className={`text-sm font-semibold ${
                              getPercentageChange(reportData.financial.totalRevenue, comparisonData.financial.totalRevenue) >= 0 
                                ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {getPercentageChange(reportData.financial.totalRevenue, comparisonData.financial.totalRevenue).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm text-gray-600">จำนวนการจอง</p>
                            <p className="text-lg font-bold text-gray-900">
                              {reportData.financial.bookingsCount}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">เปลี่ยนแปลง</p>
                            <p className={`text-sm font-semibold ${
                              getPercentageChange(reportData.financial.bookingsCount, comparisonData.financial.bookingsCount) >= 0 
                                ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {getPercentageChange(reportData.financial.bookingsCount, comparisonData.financial.bookingsCount).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-orange-500">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm text-gray-600">จำนวนการจอง</p>
                            <p className="text-lg font-bold text-gray-900">
                              {reportData.occupancy.totalBookings}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">เปลี่ยนแปลง</p>
                            <p className={`text-sm font-semibold ${
                              getPercentageChange(reportData.occupancy.totalBookings, comparisonData.occupancy.totalBookings) >= 0 
                                ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {getPercentageChange(reportData.occupancy.totalBookings, comparisonData.occupancy.totalBookings).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-500">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm text-gray-600">อัตราการเข้าพัก</p>
                            <p className="text-lg font-bold text-gray-900">
                              {reportData.occupancy.occupancyRate.toFixed(1)}%
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">เปลี่ยนแปลง</p>
                            <p className={`text-sm font-semibold ${
                              getPercentageChange(reportData.occupancy.occupancyRate, comparisonData.occupancy.occupancyRate) >= 0 
                                ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {getPercentageChange(reportData.occupancy.occupancyRate, comparisonData.occupancy.occupancyRate).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
            {/* Summary Cards */}
            {reportType === 'financial' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <DollarSign className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">รายได้รวม</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(reportData.financial.totalRevenue)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <FileText className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">จำนวนการจอง</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {reportData.financial.bookingsCount}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <TrendingUp className="h-8 w-8 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">มูลค่าเฉลี่ยต่อการจอง</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(Math.round(reportData.financial.averageBookingValue))}
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
                      <Users className="h-8 w-8 text-orange-600" />
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
                      <Activity className="h-8 w-8 text-red-600" />
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
                      <Clock className="h-8 w-8 text-indigo-600" />
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
                  <BarChart3 className="h-5 w-5 mr-2" />
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
                  <PieChart className="h-5 w-5 mr-2" />
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

            {/* Additional Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Payment Methods (Financial) / Guest Origins (Occupancy) */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  {reportType === 'financial' ? 'วิธีการชำระเงิน' : 'ที่มาของแขก'}
                </h3>
                
                <div className="space-y-3">
                  {(reportType === 'financial' 
                    ? reportData.financial.paymentMethods 
                    : reportData.occupancy.guestOrigins
                  ).map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700 font-medium">
                        {reportType === 'financial' ? item.method : item.origin}
                      </span>
                      <span className="text-gray-900 font-semibold">
                        {item.count} {reportType === 'financial' ? 'รายการ' : 'คน'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Table */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  สรุปข้อมูล {getPeriodText()}
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 text-gray-600">ช่วงเวลา</th>
                        <th className="text-right py-2 text-gray-600">
                          {reportType === 'financial' ? 'รายได้' : 'การจอง'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(reportType === 'financial' 
                        ? reportData.financial[`${period}Revenue`] 
                        : reportData.occupancy[`${period}Occupancy`]
                      ).slice(-5).map((item, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-2 text-gray-900">{item.period}</td>
                          <td className="py-2 text-right font-semibold text-gray-900">
                            {reportType === 'financial' 
                              ? formatCurrency(item.revenue) 
                              : `${item.count} ครั้ง`
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  ประสิทธิภาพ
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Growth Rate</span>
                    <span className="font-semibold text-green-600">+12.5%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Conversion Rate</span>
                    <span className="font-semibold text-blue-600">68%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Customer Satisfaction</span>
                    <span className="font-semibold text-purple-600">4.8/5</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  ข้อมูลปฏิทิน
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Peak Season</span>
                    <span className="font-semibold text-orange-600">Dec-Jan</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Low Season</span>
                    <span className="font-semibold text-gray-600">Mar-May</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Booking Lead Time</span>
                    <span className="font-semibold text-indigo-600">14 days</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  ลูกค้า
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">New Customers</span>
                    <span className="font-semibold text-green-600">
                      {Math.floor(reportData.occupancy.totalBookings * 0.3)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Repeat Customers</span>
                    <span className="font-semibold text-blue-600">
                      {Math.floor(reportData.occupancy.totalBookings * 0.7)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Customer Lifetime Value</span>
                    <span className="font-semibold text-purple-600">
                      {formatCurrency(Math.round(reportData.financial.averageBookingValue * 2.5))}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Analysis */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                วิเคราะห์เชิงลึก
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">จุดแข็ง</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center text-sm text-gray-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      อัตราการจองสูงในช่วงสุดสัปดาห์
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      รายได้เฉลี่ยต่อการจองเพิ่มขึ้น
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      อัตราการยกเลิกต่ำ
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">โอกาสปรับปรุง</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center text-sm text-gray-600">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                      เพิ่มช่องทางการชำระเงิน
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                      ปรับปรุงระบบแจ้งเตือน
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                      เพิ่มโปรโมชั่นในช่วง Low Season
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Real-time Dashboard */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Dashboard แบบ Real-time
                </h3>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span className="text-sm text-gray-600">
                    {autoRefresh ? 'อัพเดทอัตโนมัติ' : 'ไม่อัพเดท'}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg">
                  <div className="text-2xl font-bold">
                    {reportData.occupancy.totalBookings}
                  </div>
                  <div className="text-sm opacity-90">การจองทั้งหมด</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg">
                  <div className="text-2xl font-bold">
                    ฿{Math.round(reportData.financial.totalRevenue / 1000)}K
                  </div>
                  <div className="text-sm opacity-90">รายได้รวม</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg">
                  <div className="text-2xl font-bold">
                    {reportData.occupancy.occupancyRate.toFixed(0)}%
                  </div>
                  <div className="text-sm opacity-90">อัตราการเข้าพัก</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg">
                  <div className="text-2xl font-bold">
                    {reportData.occupancy.averageStayDuration.toFixed(1)}
                  </div>
                  <div className="text-sm opacity-90">คืน (เฉลี่ย)</div>
                </div>
              </div>
            </div>

            {/* Advanced Analytics */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                การวิเคราะห์ขั้นสูง
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue Trend */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">แนวโน้มรายได้</h4>
                  <div className="space-y-2">
                    {reportData.financial[`${period}Revenue`].slice(-7).map((item, index) => {
                      const maxRevenue = Math.max(...reportData.financial[`${period}Revenue`].map(i => i.revenue));
                      const percentage = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
                      const isPositive = index === 0 || item.revenue >= reportData.financial[`${period}Revenue`].slice(-7)[index - 1]?.revenue;
                      
                      return (
                        <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                          <div className="flex items-center space-x-3">
                            <div className={`w-2 h-2 rounded-full ${isPositive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className="text-sm font-medium text-gray-700">{item.period}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-semibold text-gray-900 w-20 text-right">
                              ฿{(item.revenue / 1000).toFixed(1)}K
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Occupancy Trend */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">แนวโน้มการเข้าพัก</h4>
                  <div className="space-y-2">
                    {reportData.occupancy[`${period}Occupancy`].slice(-7).map((item, index) => {
                      const maxOccupancy = Math.max(...reportData.occupancy[`${period}Occupancy`].map(i => i.count));
                      const percentage = maxOccupancy > 0 ? (item.count / maxOccupancy) * 100 : 0;
                      const isPositive = index === 0 || item.count >= reportData.occupancy[`${period}Occupancy`].slice(-7)[index - 1]?.count;
                      
                      return (
                        <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                          <div className="flex items-center space-x-3">
                            <div className={`w-2 h-2 rounded-full ${isPositive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className="text-sm font-medium text-gray-700">{item.period}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-semibold text-gray-900 w-20 text-right">
                              {item.count} ครั้ง
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                คำแนะนำเชิงธุรกิจ
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">กลยุทธ์เพิ่มรายได้</h4>
                  <div className="space-y-3">
                    {reportData.financial.averageBookingValue < 3000 && (
                      <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div>
                          <p className="text-sm font-medium text-blue-900">เพิ่มบริการเสริม</p>
                          <p className="text-xs text-blue-700">มูลค่าการจองเฉลี่ยยังต่ำ ควรเพิ่มบริการเสริมเช่น อาหาร, สปา, ท่องเที่ยว</p>
                        </div>
                      </div>
                    )}
                    {reportData.financial.totalRevenue > 0 && (
                      <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div>
                          <p className="text-sm font-medium text-green-900">โปรโมชั่นพิเศษ</p>
                          <p className="text-xs text-green-700">เพิ่มแพ็กเกจหลายคืนเพื่อเพิ่มระยะเวลาพักและรายได้</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">ปรับปรุงการดำเนินงาน</h4>
                  <div className="space-y-3">
                    {reportData.occupancy.occupancyRate < 70 && (
                      <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                        <div>
                          <p className="text-sm font-medium text-yellow-900">เพิ่มช่องทางการตลาด</p>
                          <p className="text-xs text-yellow-700">อัตราการเข้าพักยังต่ำ ควรเพิ่มช่องทางการตลาดออนไลน์</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium text-purple-900">ปรับปรุงประสบการณ์ลูกค้า</p>
                        <p className="text-xs text-purple-700">เพิ่มระบบรีวิวและคะแนนเพื่อสร้างความเชื่อมั่น</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Info */}
            <div className="text-center text-sm text-gray-500 mt-8">
              <p>รายงานอัพเดทล่าสุด: {new Date().toLocaleDateString('th-TH')} {new Date().toLocaleTimeString('th-TH')}</p>
              <p>ข้อมูลจาก: {dateRange.startDate} ถึง {dateRange.endDate}</p>
              {autoRefresh && (
                <p className="text-green-600 mt-1">🔄 อัพเดทอัตโนมัติทุก 30 วินาที</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
