'use client';

import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { useState } from 'react';
import { BarChart3, PieChart as PieIcon, TrendingUp, Activity } from 'lucide-react';

const CHART_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
];

export default function InteractiveCharts({ 
  reportData, 
  reportType, 
  period, 
  formatCurrency,
  formatNumber 
}) {
  const [activeChart, setActiveChart] = useState('line');

  // Prepare data for charts
  const prepareTimeSeriesData = () => {
    if (reportType === 'financial') {
      const data = reportData.financial[`${period}Revenue`] || [];
      return data.map(item => ({
        period: item.period,
        value: item.revenue || 0,
        count: item.count || 0,
        average: item.count > 0 ? (item.revenue / item.count) : 0
      }));
    } else {
      const data = reportData.occupancy[`${period}Occupancy`] || [];
      return data.map(item => ({
        period: item.period,
        value: item.count || 0,
        occupancyRate: reportData.occupancy.occupancyRate || 0
      }));
    }
  };

  const prepareRoomTypeData = () => {
    if (reportType === 'financial') {
      return (reportData.financial.roomTypeRevenue || []).map((item, index) => ({
        name: item.roomType || item.type || 'ไม่ระบุ',
        value: item.revenue || 0,
        count: item.count || 0,
        fill: CHART_COLORS[index % CHART_COLORS.length]
      }));
    } else {
      return (reportData.occupancy.roomTypeOccupancy || []).map((item, index) => ({
        name: item.type || 'ไม่ระบุ',
        value: item.count || 0,
        percentage: item.percentage || 0,
        fill: CHART_COLORS[index % CHART_COLORS.length]
      }));
    }
  };

  const timeSeriesData = prepareTimeSeriesData();
  const roomTypeData = prepareRoomTypeData();

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900">{`ช่วงเวลา: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {
                reportType === 'financial' && entry.dataKey === 'value' ? 
                formatCurrency(entry.value) : 
                formatNumber(entry.value)
              }
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900">{data.payload.name}</p>
          <p style={{ color: data.payload.fill }} className="text-sm">
            {reportType === 'financial' ? 
              `รายได้: ${formatCurrency(data.value)}` :
              `จำนวนการจอง: ${formatNumber(data.value)}`
            }
          </p>
          {data.payload.count && (
            <p className="text-xs text-gray-600">
              การจอง: {formatNumber(data.payload.count)} รายการ
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Chart Type Selector */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 sm:mb-0 flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            📈 กราฟแสดงข้อมูล {reportType === 'financial' ? 'การเงิน' : 'การเข้าพัก'}
          </h3>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveChart('line')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeChart === 'line' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <TrendingUp className="h-4 w-4 inline mr-2" />
              เส้นกราฟ
            </button>
            <button
              onClick={() => setActiveChart('bar')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeChart === 'bar' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <BarChart3 className="h-4 w-4 inline mr-2" />
              แท่งกราฟ
            </button>
            <button
              onClick={() => setActiveChart('area')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeChart === 'area' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Activity className="h-4 w-4 inline mr-2" />
              พื้นที่กราฟ
            </button>
          </div>
        </div>

        {/* Time Series Chart */}
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {activeChart === 'line' && (
              <LineChart data={timeSeriesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="period" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', strokeWidth: 2 }}
                  name={reportType === 'financial' ? 'รายได้ (บาท)' : 'จำนวนการจอง'}
                />
                {reportType === 'financial' && (
                  <Line 
                    type="monotone" 
                    dataKey="average" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: '#10B981', strokeWidth: 2 }}
                    name="มูลค่าเฉลี่ย (บาท)"
                  />
                )}
              </LineChart>
            )}

            {activeChart === 'bar' && (
              <BarChart data={timeSeriesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="period" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="value" 
                  fill="#3B82F6"
                  name={reportType === 'financial' ? 'รายได้ (บาท)' : 'จำนวนการจอง'}
                />
              </BarChart>
            )}

            {activeChart === 'area' && (
              <AreaChart data={timeSeriesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="period" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3B82F6" 
                  fillOpacity={1}
                  fill="url(#colorValue)"
                  name={reportType === 'financial' ? 'รายได้ (บาท)' : 'จำนวนการจอง'}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Room Type Distribution Chart */}
      {roomTypeData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <PieIcon className="h-5 w-5 mr-2" />
              🥧 สัดส่วนตามประเภทห้อง
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roomTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {roomTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar Chart for Room Types */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              📊 เปรียบเทียบประเภทห้อง
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roomTypeData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomPieTooltip />} />
                  <Bar dataKey="value" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Chart Statistics */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Activity className="h-5 w-5 mr-2" />
          📈 สถิติจากกราฟ
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">จุดข้อมูลทั้งหมด</h4>
            <p className="text-2xl font-bold text-blue-600">{timeSeriesData.length}</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">
              {reportType === 'financial' ? 'รายได้สูงสุด' : 'การจองสูงสุด'}
            </h4>
            <p className="text-2xl font-bold text-green-600">
              {timeSeriesData.length > 0 ? 
                (reportType === 'financial' ? 
                  formatCurrency(Math.max(...timeSeriesData.map(d => d.value))) :
                  formatNumber(Math.max(...timeSeriesData.map(d => d.value)))
                ) : '0'
              }
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">
              {reportType === 'financial' ? 'รายได้เฉลี่ย' : 'การจองเฉลี่ย'}
            </h4>
            <p className="text-2xl font-bold text-purple-600">
              {timeSeriesData.length > 0 ? 
                (reportType === 'financial' ? 
                  formatCurrency(timeSeriesData.reduce((sum, d) => sum + d.value, 0) / timeSeriesData.length) :
                  formatNumber(Math.round(timeSeriesData.reduce((sum, d) => sum + d.value, 0) / timeSeriesData.length))
                ) : '0'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
