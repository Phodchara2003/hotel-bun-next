'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import AdminNavigation from '@/components/layout/AdminNavigation';
import { 
  Clock, 
  User, 
  Calendar, 
  Phone, 
  Mail,
  Hotel,
  Bed,
  Users,
  RefreshCw,
  Search,
  Filter,
  LogIn,
  LogOut,
  Timer,
  MessageSquare,
  XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CheckInHistoryPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    timeRange: 'today'
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchHistory();
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    applyFilters();
  }, [history, filters]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5680/api/bookings/checkin-history');
      const result = await response.json();
      
      if (result.success) {
        setHistory(result.data);
      }
    } catch (error) {
      console.error('Error fetching check-in history:', error);
      toast.error('ไม่สามารถดึงข้อมูลประวัติได้');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...history];
    
    // Search filter
    if (filters.search) {
      filtered = filtered.filter(booking =>
        booking.guest_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        booking.booking_reference?.toLowerCase().includes(filters.search.toLowerCase()) ||
        booking.guest_phone?.includes(filters.search)
      );
    }
    
    // Time range filter
    const now = new Date();
    if (filters.timeRange === 'today') {
      const today = now.toDateString();
      filtered = filtered.filter(booking => {
        const checkInTime = new Date(booking.actual_check_in_time).toDateString();
        return checkInTime === today;
      });
    } else if (filters.timeRange === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(booking => {
        const checkInTime = new Date(booking.actual_check_in_time);
        return checkInTime >= weekAgo;
      });
    } else if (filters.timeRange === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(booking => {
        const checkInTime = new Date(booking.actual_check_in_time);
        return checkInTime >= monthAgo;
      });
    }
    
    setFilteredHistory(filtered);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (hours) => {
    if (!hours) return '-';
    if (hours < 24) {
      return `${Math.round(hours)} ชั่วโมง`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = Math.round(hours % 24);
      return `${days} วัน ${remainingHours} ชั่วโมง`;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'checked_in':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'checked_out':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'checked_in':
        return 'กำลังเข้าพัก';
      case 'checked_out':
        return 'เช็คเอ้าแล้ว';
      default:
        return status;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
            ไม่ได้รับอนุญาต
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            คุณต้องเข้าสู่ระบบเป็นแอดมินหรือพนักงานเพื่อเข้าถึงหน้านี้
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <AdminNavigation 
        title="ประวัติเช็คอิน/เช็คเอ้า" 
        description="ดูประวัติการเข้าพักของลูกค้าทั้งหมด"
      />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className={`mb-8 transform transition-all duration-700 ease-out ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
                ประวัติเช็คอิน/เช็คเอ้า
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400">
                ดูประวัติการเข้าพักและระยะเวลาที่ใช้ของลูกค้า
              </p>
            </div>
            <button
              onClick={fetchHistory}
              disabled={loading}
              className="btn-primary flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              รีเฟรช
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className={`mb-6 transform transition-all duration-700 delay-200 ease-out ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}>
          <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
              <h3 className="font-semibold text-neutral-900 dark:text-white">ฟิลเตอร์</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  ค้นหา
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    placeholder="ชื่อ, เบอร์โทร, หมายเลขจอง"
                    className="input-field pl-10"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  ช่วงเวลา
                </label>
                <select
                  value={filters.timeRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value }))}
                  className="input-field"
                >
                  <option value="all">ทั้งหมด</option>
                  <option value="today">วันนี้</option>
                  <option value="week">7 วันที่ผ่านมา</option>
                  <option value="month">30 วันที่ผ่านมา</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* History List */}
        <div className={`transform transition-all duration-700 delay-400 ease-out ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}>
          {filteredHistory.length === 0 ? (
            <div className="bg-white dark:bg-neutral-800 rounded-2xl p-12 text-center shadow-lg border border-neutral-200 dark:border-neutral-700">
              <Clock className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                ไม่พบประวัติ
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400">
                ยังไม่มีประวัติการเช็คอิน/เช็คเอ้าในช่วงเวลานี้
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredHistory.map((booking, index) => (
                <div
                  key={booking.id}
                  className={`bg-white dark:bg-neutral-800 rounded-2xl shadow-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden transform transition-all duration-500 hover:shadow-xl ${
                    isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                  }`}
                  style={{ transitionDelay: `${600 + index * 100}ms` }}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900 dark:to-blue-900 rounded-xl flex items-center justify-center">
                          <Hotel className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                            {booking.guest_name}
                          </h3>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            {booking.booking_reference} • {booking.room_type_name}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {getStatusLabel(booking.status)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="flex items-center text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                          <Users className="h-4 w-4 mr-1" />
                          จำนวนแขก
                        </div>
                        <p className="text-sm font-medium text-neutral-900 dark:text-white">
                          {booking.guests || 1} คน
                        </p>
                      </div>
                      
                      <div>
                        <div className="flex items-center text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                          <Bed className="h-4 w-4 mr-1" />
                          ประเภทเตียง
                        </div>
                        <p className="text-sm font-medium text-neutral-900 dark:text-white">
                          {booking.bed_type === 'single' ? 'เตียงเดี่ยว' : 'เตียงคู่'}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                          <Phone className="h-4 w-4 mr-1" />
                          เบอร์โทร
                        </div>
                        <p className="text-sm font-medium text-neutral-900 dark:text-white">
                          {booking.guest_phone || '-'}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                          <Timer className="h-4 w-4 mr-1" />
                          ระยะเวลาพัก
                        </div>
                        <p className="text-sm font-medium text-neutral-900 dark:text-white">
                          {formatDuration(booking.stay_duration_hours)}
                        </p>
                      </div>
                    </div>

                    {/* Check-in/Check-out Timeline */}
                    <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4">
                      <h4 className="font-semibold text-neutral-900 dark:text-white mb-3">
                        ไทม์ไลน์การเข้าพัก
                      </h4>
                      
                      <div className="space-y-3">
                        {booking.actual_check_in_time && (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                              <LogIn className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-neutral-900 dark:text-white">
                                เช็คอิน: {formatDateTime(booking.actual_check_in_time)}
                              </p>
                              {booking.check_in_staff_name && (
                                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                                  โดย: {booking.check_in_staff_name}
                                </p>
                              )}
                              {booking.check_in_notes && (
                                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                                  หมายเหตุ: {booking.check_in_notes}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {booking.actual_check_out_time && (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                              <LogOut className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-neutral-900 dark:text-white">
                                เช็คเอ้า: {formatDateTime(booking.actual_check_out_time)}
                              </p>
                              {booking.check_out_staff_name && (
                                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                                  โดย: {booking.check_out_staff_name}
                                </p>
                              )}
                              {booking.check_out_notes && (
                                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                                  หมายเหตุ: {booking.check_out_notes}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}