'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { paymentAPI, bookingAPI } from '../../../lib/api';
import { isStaffOrAdmin, canEdit, canDelete } from '../../../lib/roles';
import ConfirmModal from '../../../components/ConfirmModal';
import AdminNavigation from '../../../components/AdminNavigation';
import Link from 'next/link';
import { 
  CreditCard, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  X,
  Search,
  Filter,
  RefreshCw,
  Download,
  AlertCircle,
  Calendar,
  Receipt,
  Wallet,
  Building,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PaymentManagement() {
  const { user, isAuthenticated } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [stats, setStats] = useState({
    totalPayments: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    completedPayments: 0,
    failedPayments: 0,
    refundedPayments: 0,
    todayRevenue: 0,
    monthlyRevenue: 0
  });

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    method: '',
    dateFrom: '',
    dateTo: '',
    amountRange: ''
  });

  const paymentStatuses = [
    { value: 'pending', label: 'รอดำเนินการ', color: 'yellow', icon: Clock },
    { value: 'completed', label: 'สำเร็จ', color: 'green', icon: CheckCircle },
    { value: 'failed', label: 'ล้มเหลว', color: 'red', icon: XCircle },
    { value: 'refunded', label: 'คืนเงิน', color: 'blue', icon: TrendingDown }
  ];

  const paymentMethods = [
    { value: 'credit_card', label: 'บัตรเครดิต', icon: CreditCard },
    { value: 'bank_transfer', label: 'โอนเงิน', icon: Building },
    { value: 'cash', label: 'เงินสด', icon: Wallet },
    { value: 'promptpay', label: 'พร้อมเพย์', icon: DollarSign }
  ];

  useEffect(() => {
    setIsVisible(true);
    if (isAuthenticated && user && isStaffOrAdmin(user)) {
      fetchPayments();
    }
  }, [isAuthenticated, user]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await paymentAPI.getAll();
      if (response.success) {
        setPayments(response.data);
        calculateStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลการชำระเงิน');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (paymentsData) => {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date();
    thisMonth.setDate(1);
    
    const stats = {
      totalPayments: paymentsData.length,
      totalRevenue: paymentsData
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + (p.amount || 0), 0),
      pendingPayments: paymentsData.filter(p => p.status === 'pending').length,
      completedPayments: paymentsData.filter(p => p.status === 'completed').length,
      failedPayments: paymentsData.filter(p => p.status === 'failed').length,
      refundedPayments: paymentsData.filter(p => p.status === 'refunded').length,
      todayRevenue: paymentsData
        .filter(p => p.status === 'completed' && 
          new Date(p.created_at).toISOString().split('T')[0] === today)
        .reduce((sum, p) => sum + (p.amount || 0), 0),
      monthlyRevenue: paymentsData
        .filter(p => p.status === 'completed' && 
          new Date(p.created_at) >= thisMonth)
        .reduce((sum, p) => sum + (p.amount || 0), 0)
    };
    
    setStats(stats);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      method: '',
      dateFrom: '',
      dateTo: '',
      amountRange: ''
    });
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = !filters.search || 
      payment.transaction_id?.toLowerCase().includes(filters.search.toLowerCase()) ||
      payment.booking_id?.toLowerCase().includes(filters.search.toLowerCase()) ||
      payment.customer_name?.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesStatus = !filters.status || payment.status === filters.status;
    const matchesMethod = !filters.method || payment.payment_method === filters.method;
    
    const matchesDateFrom = !filters.dateFrom || 
      new Date(payment.created_at) >= new Date(filters.dateFrom);
    
    const matchesDateTo = !filters.dateTo || 
      new Date(payment.created_at) <= new Date(filters.dateTo);

    let matchesAmountRange = true;
    if (filters.amountRange) {
      const amount = payment.amount || 0;
      switch (filters.amountRange) {
        case 'low':
          matchesAmountRange = amount < 5000;
          break;
        case 'medium':
          matchesAmountRange = amount >= 5000 && amount < 20000;
          break;
        case 'high':
          matchesAmountRange = amount >= 20000;
          break;
      }
    }

    return matchesSearch && matchesStatus && matchesMethod && 
           matchesDateFrom && matchesDateTo && matchesAmountRange;
  });

  const getStatusBadge = (status) => {
    const statusConfig = paymentStatuses.find(s => s.value === status) || paymentStatuses[0];
    const Icon = statusConfig.icon;

    const colorClasses = {
      yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${colorClasses[statusConfig.color]}`}>
        <Icon className="h-3 w-3 mr-1" />
        {statusConfig.label}
      </span>
    );
  };

  const getMethodBadge = (method) => {
    const methodConfig = paymentMethods.find(m => m.value === method) || paymentMethods[0];
    const Icon = methodConfig.icon;

    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300">
        <Icon className="h-3 w-3 mr-1" />
        {methodConfig.label}
      </span>
    );
  };

  const handleStatusUpdate = async (paymentId, newStatus) => {
    try {
      setActionLoading(true);
      const response = await paymentAPI.updateStatus(paymentId, newStatus);
      if (response.success) {
        toast.success(`สถานะการชำระเงินถูกเปลี่ยนเป็น ${newStatus} แล้ว`);
        fetchPayments();
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    } finally {
      setActionLoading(false);
      setShowConfirmModal(false);
    }
  };

  const formatPrice = (amount) => {
    if (!amount) return '฿0';
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
            กรุณาเข้าสู่ระบบ
          </h1>
          <Link href="/login" className="btn-primary">
            เข้าสู่ระบบ
          </Link>
        </div>
      </div>
    );
  }

  if (!isStaffOrAdmin(user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
            ไม่มีสิทธิ์เข้าถึง
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            คุณไม่มีสิทธิ์เข้าถึงหน้านี้
          </p>
          <Link href="/dashboard" className="btn-primary">
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800">
      <div className="container mx-auto px-4 py-8">
        {/* Admin Navigation */}
        <AdminNavigation 
          title="จัดการการชำระเงิน"
          description="ติดตามและจัดการธุรกรรมการชำระเงินทั้งหมด"
        />

        {/* Action Buttons */}
        <div className={`mb-8 transform transition-all duration-700 ease-out ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          <div className="flex items-center justify-end gap-4">
            <button
              onClick={fetchPayments}
              disabled={loading}
              className="btn-outline flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              รีเฟรช
            </button>
            <button className="btn-outline flex items-center gap-2">
              <Download className="h-4 w-4" />
              ส่งออกข้อมูล
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-6 mb-8 transform transition-all duration-700 delay-200 ease-out ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">ธุรกรรมทั้งหมด</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.totalPayments}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Receipt className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">รายได้รวม</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatPrice(stats.totalRevenue)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">รอดำเนินการ</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pendingPayments}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">สำเร็จแล้ว</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completedPayments}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">ล้มเหลว</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.failedPayments}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">คืนเงิน</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.refundedPayments}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">รายได้วันนี้</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{formatPrice(stats.todayRevenue)}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">รายได้เดือนนี้</p>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{formatPrice(stats.monthlyRevenue)}</p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className={`bg-white dark:bg-neutral-800 rounded-xl shadow-lg border-2 border-neutral-200 dark:border-neutral-700 p-8 mb-8 transform transition-all duration-700 delay-300 ease-out ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-8 flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
              <Filter className="h-5 w-5 text-white" />
            </div>
            ค้นหาและกรองข้อมูล
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-6">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-3">
                ค้นหา
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary-500 dark:text-primary-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="รหัสธุรกรรม, รหัสจอง, ชื่อลูกค้า..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-16 input-field text-sm"
                />
              </div>
            </div>
            
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-3">
                สถานะ
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="input-field text-sm"
              >
                <option value="">ทั้งหมด</option>
                {paymentStatuses.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>
            
            {/* Method Filter */}
            <div>
              <label className="block text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-3">
                วิธีชำระเงิน
              </label>
              <select
                value={filters.method}
                onChange={(e) => handleFilterChange('method', e.target.value)}
                className="input-field text-sm"
              >
                <option value="">ทั้งหมด</option>
                {paymentMethods.map(method => (
                  <option key={method.value} value={method.value}>{method.label}</option>
                ))}
              </select>
            </div>

            {/* Amount Range */}
            <div>
              <label className="block text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-3">
                ช่วงราคา
              </label>
              <select
                value={filters.amountRange}
                onChange={(e) => handleFilterChange('amountRange', e.target.value)}
                className="input-field text-sm"
              >
                <option value="">ทั้งหมด</option>
                <option value="low">ต่ำกว่า ฿5,000</option>
                <option value="medium">฿5,000 - ฿20,000</option>
                <option value="high">มากกว่า ฿20,000</option>
              </select>
            </div>
            
            {/* Date From */}
            <div>
              <label className="block text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-3">
                ตั้งแต่วันที่
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="input-field text-sm"
              />
            </div>
            
            {/* Clear Filters Button */}
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-6 py-3 bg-primary-100 hover:bg-primary-200 dark:bg-primary-900 dark:hover:bg-primary-800 text-primary-700 dark:text-primary-300 font-semibold rounded-lg border border-primary-300 dark:border-primary-600 transition-all duration-200"
              >
                ล้างตัวกรอง
              </button>
            </div>
          </div>
          
          <div className="mt-8 flex justify-between items-center">
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              แสดงผล <span className="font-bold text-primary-600 dark:text-primary-400">{filteredPayments.length}</span> จาก <span className="font-bold text-neutral-900 dark:text-white">{payments.length}</span> รายการ
            </span>
          </div>
        </div>

        {/* Payments Table */}
        <div className={`bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden transform transition-all duration-700 delay-400 ease-out ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
              รายการธุรกรรม ({filteredPayments.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="mt-4 text-neutral-600 dark:text-neutral-400">กำลังโหลดข้อมูล...</p>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="p-12 text-center">
              <CreditCard className="mx-auto h-12 w-12 text-neutral-400 dark:text-neutral-600 mb-4" />
              <p className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
                ไม่มีข้อมูลการชำระเงิน
              </p>
              <p className="text-neutral-600 dark:text-neutral-400">
                ยังไม่มีธุรกรรมในระบบหรือไม่ตรงกับเงื่อนไขการค้นหา
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 dark:bg-neutral-900">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      รหัสธุรกรรม
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      รหัสจอง
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      ลูกค้า
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      จำนวนเงิน
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      วิธีชำระเงิน
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      สถานะ
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      วันที่ชำระ
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      จัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-neutral-900 dark:text-white">
                          {payment.transaction_id || `TX${payment.id}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-900 dark:text-white">
                          {payment.booking_id || 'ไม่ระบุ'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-neutral-900 dark:text-white">
                          {payment.customer_name || 'ไม่ระบุ'}
                        </div>
                        <div className="text-sm text-neutral-500 dark:text-neutral-400">
                          {payment.customer_email || 'ไม่ระบุ'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-lg font-bold text-green-600 dark:text-green-400">
                          {formatPrice(payment.amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getMethodBadge(payment.payment_method)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(payment.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-white">
                        {formatDate(payment.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedPayment(payment);
                              setShowModal(true);
                            }}
                            className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 transition-colors"
                            title="ดูรายละเอียด"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {canEdit(user.role) && payment.status === 'pending' && (
                            <>
                              <button
                                onClick={() => {
                                  setConfirmAction(() => () => handleStatusUpdate(payment.id, 'completed'));
                                  setShowConfirmModal(true);
                                }}
                                className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 transition-colors"
                                title="อนุมัติการชำระเงิน"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setConfirmAction(() => () => handleStatusUpdate(payment.id, 'failed'));
                                  setShowConfirmModal(true);
                                }}
                                className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors"
                                title="ปฏิเสธการชำระเงิน"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Payment Detail Modal */}
      {showModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                รายละเอียดการชำระเงิน
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Transaction Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                    รหัสธุรกรรม
                  </label>
                  <p className="text-lg font-semibold text-neutral-900 dark:text-white">
                    {selectedPayment.transaction_id || `TX${selectedPayment.id}`}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                    สถานะ
                  </label>
                  {getStatusBadge(selectedPayment.status)}
                </div>
              </div>

              {/* Amount */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                  จำนวนเงิน
                </label>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {formatPrice(selectedPayment.amount)}
                </p>
              </div>

              {/* Payment Details */}
              <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4">
                <h4 className="font-semibold text-neutral-900 dark:text-white mb-3 flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  รายละเอียดการชำระเงิน
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      วิธีชำระเงิน
                    </label>
                    {getMethodBadge(selectedPayment.payment_method)}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      รหัสการจอง
                    </label>
                    <p className="text-neutral-900 dark:text-white">{selectedPayment.booking_id || 'ไม่ระบุ'}</p>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4">
                <h4 className="font-semibold text-neutral-900 dark:text-white mb-3">
                  ข้อมูลลูกค้า
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      ชื่อลูกค้า
                    </label>
                    <p className="text-neutral-900 dark:text-white">{selectedPayment.customer_name || 'ไม่ระบุ'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      อีเมล
                    </label>
                    <p className="text-neutral-900 dark:text-white">{selectedPayment.customer_email || 'ไม่ระบุ'}</p>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4">
                <h4 className="font-semibold text-neutral-900 dark:text-white mb-3">
                  ข้อมูลเวลา
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      วันที่ชำระเงิน
                    </label>
                    <p className="text-neutral-900 dark:text-white">{formatDate(selectedPayment.created_at)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      อัปเดตล่าสุด
                    </label>
                    <p className="text-neutral-900 dark:text-white">{formatDate(selectedPayment.updated_at)}</p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedPayment.notes && (
                <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4">
                  <h4 className="font-semibold text-neutral-900 dark:text-white mb-3 flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    หมายเหตุ
                  </h4>
                  <p className="text-neutral-900 dark:text-white">{selectedPayment.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmAction}
        title="ยืนยันการดำเนินการ"
        message="คุณแน่ใจหรือไม่ที่จะดำเนินการนี้?"
        confirmText="ยืนยัน"
        cancelText="ยกเลิก"
        isLoading={actionLoading}
      />
    </div>
  );
}
