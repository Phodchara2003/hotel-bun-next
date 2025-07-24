'use client';

import { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Target, 
  Award, 
  AlertTriangle,
  CheckCircle,
  Calendar,
  Users,
  DollarSign
} from 'lucide-react';

export default function PerformanceDashboard({ 
  reportData, 
  reportType, 
  dateRange,
  formatCurrency,
  formatNumber 
}) {
  const [selectedKPI, setSelectedKPI] = useState('revenue');

  // Calculate KPIs and performance metrics
  const performanceMetrics = useMemo(() => {
    if (!reportData) return null;

    const currentData = reportType === 'financial' ? reportData.financial : reportData.occupancy;
    
    // Calculate growth rates and trends
    const calculateGrowth = (data) => {
      if (!data || data.length < 2) return 0;
      const recent = data.slice(-2);
      const [previous, current] = recent;
      if (!previous || !current || previous.revenue === 0) return 0;
      return ((current.revenue - previous.revenue) / previous.revenue) * 100;
    };

    // Performance targets (these could be configurable)
    const targets = {
      financial: {
        monthlyRevenue: 100000,
        bookingsCount: 50,
        averageBookingValue: 2000,
        growth: 10 // 10% growth target
      },
      occupancy: {
        occupancyRate: 70,
        averageStayDuration: 2.5,
        totalBookings: 30,
        customerSatisfaction: 85
      }
    };

    if (reportType === 'financial') {
      const monthlyData = currentData.monthlyRevenue || [];
      const revenueGrowth = calculateGrowth(monthlyData);
      
      return {
        kpis: [
          {
            id: 'revenue',
            title: 'รายได้รวม',
            value: currentData.totalRevenue || 0,
            format: 'currency',
            target: targets.financial.monthlyRevenue,
            trend: revenueGrowth,
            icon: DollarSign,
            color: 'green'
          },
          {
            id: 'bookings',
            title: 'จำนวนการจอง',
            value: currentData.bookingsCount || 0,
            format: 'number',
            target: targets.financial.bookingsCount,
            trend: 5.2, // Mock trend
            icon: Calendar,
            color: 'blue'
          },
          {
            id: 'average',
            title: 'มูลค่าเฉลี่ย',
            value: currentData.averageBookingValue || 0,
            format: 'currency',
            target: targets.financial.averageBookingValue,
            trend: -2.1, // Mock trend
            icon: TrendingUp,
            color: 'purple'
          }
        ],
        growth: revenueGrowth,
        performance: (currentData.totalRevenue / targets.financial.monthlyRevenue) * 100
      };
    } else {
      return {
        kpis: [
          {
            id: 'occupancy',
            title: 'อัตราเข้าพัก',
            value: currentData.occupancyRate || 0,
            format: 'percentage',
            target: targets.occupancy.occupancyRate,
            trend: 3.5, // Mock trend
            icon: Users,
            color: 'orange'
          },
          {
            id: 'duration',
            title: 'ระยะเวลาพักเฉลี่ย',
            value: currentData.averageStayDuration || 0,
            format: 'decimal',
            suffix: ' คืน',
            target: targets.occupancy.averageStayDuration,
            trend: 1.8, // Mock trend
            icon: Activity,
            color: 'teal'
          },
          {
            id: 'total',
            title: 'การจองทั้งหมด',
            value: currentData.totalBookings || 0,
            format: 'number',
            target: targets.occupancy.totalBookings,
            trend: 8.3, // Mock trend
            icon: Calendar,
            color: 'indigo'
          }
        ],
        growth: 6.2, // Mock overall growth
        performance: (currentData.occupancyRate / targets.occupancy.occupancyRate) * 100
      };
    }
  }, [reportData, reportType, formatCurrency, formatNumber]);

  // Format value based on type
  const formatValue = (value, format, suffix = '') => {
    switch (format) {
      case 'currency':
        return formatCurrency(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'decimal':
        return `${value.toFixed(1)}${suffix}`;
      default:
        return formatNumber(value) + suffix;
    }
  };

  // Get performance color
  const getPerformanceColor = (current, target, trend) => {
    const percentage = (current / target) * 100;
    if (percentage >= 90 && trend >= 0) return 'text-green-600';
    if (percentage >= 70 && trend >= -5) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get trend icon
  const getTrendIcon = (trend) => {
    if (trend > 0) return TrendingUp;
    if (trend < 0) return TrendingDown;
    return Activity;
  };

  if (!performanceMetrics) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center py-8">
          <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">ไม่มีข้อมูลสำหรับวิเคราะห์ผลการดำเนินงาน</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Target className="h-5 w-5 mr-2" />
            🎯 ผลการดำเนินงาน
          </h3>
          
          {/* Overall Performance Score */}
          <div className="text-right">
            <div className={`text-2xl font-bold ${performanceMetrics.performance >= 90 ? 'text-green-600' : performanceMetrics.performance >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
              {performanceMetrics.performance.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500">คะแนนรวม</div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {performanceMetrics.kpis.map((kpi) => {
            const IconComponent = kpi.icon;
            const TrendIcon = getTrendIcon(kpi.trend);
            const performancePercent = (kpi.value / kpi.target) * 100;
            
            return (
              <div
                key={kpi.id}
                onClick={() => setSelectedKPI(kpi.id)}
                className={`cursor-pointer transition-all duration-200 border-2 rounded-lg p-6 ${
                  selectedKPI === kpi.id
                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-${kpi.color}-100`}>
                    <IconComponent className={`h-6 w-6 text-${kpi.color}-600`} />
                  </div>
                  <div className={`flex items-center text-sm ${kpi.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <TrendIcon className="h-4 w-4 mr-1" />
                    {Math.abs(kpi.trend).toFixed(1)}%
                  </div>
                </div>
                
                <div className="mb-3">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatValue(kpi.value, kpi.format, kpi.suffix)}
                  </div>
                  <div className="text-sm font-medium text-gray-600">{kpi.title}</div>
                </div>
                
                {/* Progress Bar */}
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>เป้าหมาย: {formatValue(kpi.target, kpi.format, kpi.suffix)}</span>
                    <span>{performancePercent.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        performancePercent >= 90 ? 'bg-green-500' :
                        performancePercent >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(performancePercent, 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* Status */}
                <div className="flex items-center text-xs">
                  {performancePercent >= 90 ? (
                    <CheckCircle className="h-3 w-3 text-green-600 mr-1" />
                  ) : performancePercent >= 70 ? (
                    <AlertTriangle className="h-3 w-3 text-yellow-600 mr-1" />
                  ) : (
                    <AlertTriangle className="h-3 w-3 text-red-600 mr-1" />
                  )}
                  <span className={getPerformanceColor(kpi.value, kpi.target, kpi.trend)}>
                    {performancePercent >= 90 ? 'เป้าหมายบรรลุ' :
                     performancePercent >= 70 ? 'ใกล้เป้าหมาย' : 'ต่ำกว่าเป้าหมาย'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trends */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            📈 แนวโน้มผลการดำเนินงาน
          </h4>
          
          <div className="space-y-4">
            {performanceMetrics.kpis.map((kpi, index) => (
              <div key={kpi.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 bg-${kpi.color}-500`}></div>
                  <span className="font-medium text-gray-900">{kpi.title}</span>
                </div>
                <div className={`flex items-center text-sm font-semibold ${
                  kpi.trend >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {kpi.trend >= 0 ? (
                    <TrendingUp className="h-4 w-4 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 mr-1" />
                  )}
                  {kpi.trend >= 0 ? '+' : ''}{kpi.trend.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Insights */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Award className="h-5 w-5 mr-2" />
            💡 ข้อเสนอแนะ
          </h4>
          
          <div className="space-y-3">
            {performanceMetrics.performance >= 90 ? (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <span className="font-semibold text-green-800">ผลการดำเนินงานดีเยี่ยม!</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  ทุกเป้าหมายบรรลุแล้ว ควรรักษาระดับการให้บริการและพิจารณาขยายธุรกิจ
                </p>
              </div>
            ) : performanceMetrics.performance >= 70 ? (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                  <span className="font-semibold text-yellow-800">ผลการดำเนินงานดี</span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  อยู่ในระดับดี แต่ยังมีพื้นที่ปรับปรุง ควรเพิ่มกลยุทธ์การตลาด
                </p>
              </div>
            ) : (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                  <span className="font-semibold text-red-800">ต้องปรับปรุง</span>
                </div>
                <p className="text-sm text-red-700 mt-1">
                  ผลการดำเนินงานต่ำกว่าเป้าหมาย ควรทบทวนกลยุทธ์และปรับปรุงบริการ
                </p>
              </div>
            )}

            {/* Specific recommendations */}
            {reportType === 'financial' ? (
              <div className="space-y-2">
                {performanceMetrics.kpis[0].value < performanceMetrics.kpis[0].target * 0.7 && (
                  <div className="text-sm text-gray-700 p-2 bg-blue-50 rounded">
                    • เพิ่มโปรโมชั่นพิเศษเพื่อกระตุ้นยอดขาย
                  </div>
                )}
                {performanceMetrics.kpis[1].value < performanceMetrics.kpis[1].target * 0.8 && (
                  <div className="text-sm text-gray-700 p-2 bg-blue-50 rounded">
                    • เพิ่มช่องทางการตลาดออนไลน์
                  </div>
                )}
                {performanceMetrics.kpis[2].trend < 0 && (
                  <div className="text-sm text-gray-700 p-2 bg-blue-50 rounded">
                    • ปรับปรุงแพ็กเกจบริการเพื่อเพิ่มมูลค่าการจอง
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {performanceMetrics.kpis[0].value < performanceMetrics.kpis[0].target * 0.7 && (
                  <div className="text-sm text-gray-700 p-2 bg-blue-50 rounded">
                    • ปรับปรุงคุณภาพห้องพักและสิ่งอำนวยความสะดวก
                  </div>
                )}
                {performanceMetrics.kpis[1].value < performanceMetrics.kpis[1].target && (
                  <div className="text-sm text-gray-700 p-2 bg-blue-50 rounded">
                    • เพิ่มกิจกรรมและบริการเสริมเพื่อยืดระยะเวลาพัก
                  </div>
                )}
                {performanceMetrics.kpis[2].trend < 0 && (
                  <div className="text-sm text-gray-700 p-2 bg-blue-50 rounded">
                    • เสริมสร้างความพึงพอใจของลูกค้าเพื่อเพิ่มการจอง
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Performance History */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          📊 ประวัติผลการดำเนินงาน
        </h4>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">ตัวชี้วัด</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">ค่าปัจจุบัน</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">เป้าหมาย</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">ผลการดำเนินงาน</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">แนวโน้ม</th>
              </tr>
            </thead>
            <tbody>
              {performanceMetrics.kpis.map((kpi) => {
                const performancePercent = (kpi.value / kpi.target) * 100;
                return (
                  <tr key={kpi.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{kpi.title}</td>
                    <td className="py-3 px-4 text-right font-semibold">
                      {formatValue(kpi.value, kpi.format, kpi.suffix)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      {formatValue(kpi.target, kpi.format, kpi.suffix)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-semibold ${
                        performancePercent >= 90 ? 'text-green-600' :
                        performancePercent >= 70 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {performancePercent.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`flex items-center justify-end font-semibold ${
                        kpi.trend >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {kpi.trend >= 0 ? (
                          <TrendingUp className="h-4 w-4 mr-1" />
                        ) : (
                          <TrendingDown className="h-4 w-4 mr-1" />
                        )}
                        {kpi.trend >= 0 ? '+' : ''}{kpi.trend.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
