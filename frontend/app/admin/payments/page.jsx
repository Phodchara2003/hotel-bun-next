'use client';

import { useState, useEffect } from 'react';
import { Search, Eye, Check, X, AlertCircle, CreditCard, TrendingUp, DollarSign, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import AdminNavigation from '../../../components/AdminNavigation';

// API functions
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const paymentsAPI = {
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE}/api/admin/payments?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch payments');
    return response.json();
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE}/api/admin/payments/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch payment');
    return response.json();
  },

  updateStatus: async (id, status) => {
    const response = await fetch(`${API_BASE}/api/admin/payments/${id}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });
    if (!response.ok) throw new Error('Failed to update payment status');
    return response.json();
  },

  getStats: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE}/api/admin/payments/stats/overview?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch payment stats');
    return response.json();
  }
};

export default function PaymentManagement() {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({
    totalPayments: 0,
    pendingPayments: 0,
    confirmedPayments: 0,
    totalRevenue: 0,
    pendingRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Load payments and stats
  const loadData = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(statusFilter && { status: statusFilter })
      };
      
      const [paymentsData, statsData] = await Promise.all([
        paymentsAPI.getAll(params),
        paymentsAPI.getStats()
      ]);
      
      setPayments(paymentsData.payments || []);
      setPagination(paymentsData.pagination || pagination);
      setStats(statsData.stats || stats);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('ไม่สามารถโหลดข้อมูลการชำระเงินได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [pagination.page, statusFilter]);

  // Filter payments
  const filteredPayments = payments.filter(payment =>
    payment.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.bookingId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle payment status update
  const handleStatusUpdate = async (paymentId, newStatus) => {
    try {
      await paymentsAPI.updateStatus(paymentId, newStatus);
      toast.success('อัปเดตสถานะการชำระเงินเรียบร้อยแล้ว');
      loadData();
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('ไม่สามารถอัปเดตสถานะได้');
    }
  };

  // View payment details
  const viewPaymentDetails = async (payment) => {
    try {
      const response = await paymentsAPI.getById(payment.id);
      setSelectedPayment(response.payment);
      setShowPaymentModal(true);
    } catch (error) {
      console.error('Error fetching payment details:', error);
      toast.error('ไม่สามารถโหลดรายละเอียดการชำระเงินได้');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
      case 'confirmed': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
      case 'completed': return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20';
      case 'cancelled': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'รอดำเนินการ';
      case 'confirmed': return 'ยืนยันแล้ว';
      case 'completed': return 'เสร็จสิ้น';
      case 'cancelled': return 'ยกเลิก';
      default: return status;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <AdminNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">จัดการการชำระเงิน</h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-2">
              ติดตามและจัดการการชำระเงินของลูกค้า
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">การชำระเงินทั้งหมด</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.totalPayments}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">รอดำเนินการ</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pendingPayments}</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">ยืนยันแล้ว</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.confirmedPayments}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">รายได้รวม</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-5 w-5" />
            <input
              type="text"
              placeholder="ค้นหาด้วยอีเมล, ชื่อ, หรือ Booking ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
          >
            <option value="">ทุกสถานะ</option>
            <option value="pending">รอดำเนินการ</option>
            <option value="confirmed">ยืนยันแล้ว</option>
            <option value="completed">เสร็จสิ้น</option>
            <option value="cancelled">ยกเลิก</option>
          </select>
        </div>

        {/* Payments Table */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <p className="text-neutral-600 dark:text-neutral-400">
                {searchTerm ? 'ไม่พบการชำระเงินที่ค้นหา' : 'ยังไม่มีการชำระเงินในระบบ'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 dark:bg-neutral-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                      ลูกค้า
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                      Booking ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                      จำนวนเงิน
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                      สถานะ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                      วันที่สร้าง
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                      จัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-neutral-900 dark:text-white">
                            {payment.customerName || 'ไม่ระบุชื่อ'}
                          </div>
                          <div className="text-sm text-neutral-500 dark:text-neutral-400">
                            {payment.customerEmail}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-white">
                        {payment.bookingId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-white">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                          {getStatusText(payment.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                        {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString('th-TH') : 'ไม่ระบุ'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => viewPaymentDetails(payment)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 transition-colors"
                            title="ดูรายละเอียด"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {payment.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(payment.id, 'confirmed')}
                                className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 transition-colors"
                                title="ยืนยันการชำระเงิน"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(payment.id, 'cancelled')}
                                className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors"
                                title="ยกเลิกการชำระเงิน"
                              >
                                <X className="h-4 w-4" />
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

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center mt-6 gap-2">
            <button
              onClick={() => setPagination({...pagination, page: Math.max(1, pagination.page - 1)})}
              disabled={pagination.page === 1}
              className="px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 dark:hover:bg-neutral-700"
            >
              ก่อนหน้า
            </button>
            <span className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400">
              หน้า {pagination.page} จาก {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination({...pagination, page: Math.min(pagination.totalPages, pagination.page + 1)})}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 dark:hover:bg-neutral-700"
            >
              ถัดไป
            </button>
          </div>
        )}
      </div>

      {/* Payment Details Modal */}
      {showPaymentModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                รายละเอียดการชำระเงิน
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Booking ID
                  </label>
                  <p className="text-neutral-900 dark:text-white">{selectedPayment.bookingId}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    จำนวนเงิน
                  </label>
                  <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(selectedPayment.amount)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    ลูกค้า
                  </label>
                  <p className="text-neutral-900 dark:text-white">{selectedPayment.customerName}</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">{selectedPayment.customerEmail}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    เบอร์โทร
                  </label>
                  <p className="text-neutral-900 dark:text-white">{selectedPayment.customerPhone || 'ไม่ระบุ'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    ห้องพัก
                  </label>
                  <p className="text-neutral-900 dark:text-white">
                    {selectedPayment.roomNumber} - {selectedPayment.roomType}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    สถานะ
                  </label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedPayment.status)}`}>
                    {getStatusText(selectedPayment.status)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    วันที่เช็คอิน
                  </label>
                  <p className="text-neutral-900 dark:text-white">
                    {selectedPayment.checkInDate ? new Date(selectedPayment.checkInDate).toLocaleDateString('th-TH') : 'ไม่ระบุ'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    วันที่เช็คเอาท์
                  </label>
                  <p className="text-neutral-900 dark:text-white">
                    {selectedPayment.checkOutDate ? new Date(selectedPayment.checkOutDate).toLocaleDateString('th-TH') : 'ไม่ระบุ'}
                  </p>
                </div>
              </div>

              {/* Payment Receipt */}
              {(selectedPayment.paymentReceiptUrl || selectedPayment.paymentSlipUrl) && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    หลักฐานการชำระเงิน
                  </label>
                  <div className="border border-neutral-200 dark:border-neutral-600 rounded-lg p-4">
                    <img 
                      src={selectedPayment.paymentReceiptUrl || selectedPayment.paymentSlipUrl} 
                      alt="หลักฐานการชำระเงิน"
                      className="max-w-full h-auto rounded-lg"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <div style={{display: 'none'}} className="text-center text-neutral-500 dark:text-neutral-400">
                      ไม่สามารถแสดงรูปภาพได้
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {selectedPayment.status === 'pending' && (
              <div className="p-6 border-t border-neutral-200 dark:border-neutral-700 flex justify-end gap-3">
                <button
                  onClick={() => {
                    handleStatusUpdate(selectedPayment.id, 'cancelled');
                    setShowPaymentModal(false);
                  }}
                  className="px-4 py-2 text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/40 rounded-lg transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => {
                    handleStatusUpdate(selectedPayment.id, 'confirmed');
                    setShowPaymentModal(false);
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  ยืนยันการชำระเงิน
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
