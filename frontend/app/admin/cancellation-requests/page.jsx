'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { isStaffOrAdmin } from '../../../lib/permissions';
import Link from 'next/link';
import { 
  Calendar, 
  Users, 
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  X,
  User,
  AlertTriangle,
  FileText,
  Search,
  Filter,
  RefreshCw,
  MessageSquare,
  Ban,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CancellationRequestsPage() {
  const { user, isAuthenticated } = useAuth();
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    dateFrom: '',
    dateTo: ''
  });

  useEffect(() => {
    setIsVisible(true);
    if (isAuthenticated && user && isStaffOrAdmin(user)) {
      fetchCancellationRequests();
    }
  }, [isAuthenticated, user]);

  const fetchCancellationRequests = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching cancellation requests...');
      const response = await fetch('http://localhost:5680/api/cancellation-requests');
      const result = await response.json();
      
      console.log('📊 Cancellation requests response:', result);
      
      if (result.success && result.data) {
        setRequests(result.data);
        toast.success(`โหลดคำขอยกเลิก ${result.data.length} รายการ`);
      } else {
        setRequests([]);
        if (result.data && result.data.length === 0) {
          toast.info('ไม่มีคำขอยกเลิกในขณะนี้');
        } else {
          toast.error('ไม่พบข้อมูลคำขอยกเลิก');
        }
      }
    } catch (error) {
      console.error('❌ Error fetching cancellation requests:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const processRequest = async (requestId, action) => {
    try {
      setProcessing(true);
      console.log(`⚖️ Processing request ${requestId} with action: ${action}`);
      
      const response = await fetch('http://localhost:5680/api/cancellation-requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          request_id: requestId,
          action: action,
          admin_id: user.id,
          admin_notes: adminNotes.trim() || null
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(
          action === 'approved' 
            ? '🎉 อนุมัติคำขอยกเลิกการจองสำเร็จ' 
            : '🚫 ปฏิเสธคำขอยกเลิกการจองสำเร็จ'
        );
        
        // Refresh data
        fetchCancellationRequests();
        setShowRequestModal(false);
        setAdminNotes('');
        setSelectedRequest(null);
      } else {
        toast.error(result.message || 'เกิดข้อผิดพลาดในการดำเนินการ');
      }
    } catch (error) {
      console.error('Error processing request:', error);
      toast.error('ไม่สามารถดำเนินการได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { 
        label: 'รอการพิจารณา', 
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        icon: Clock
      },
      approved: { 
        label: 'อนุมัติแล้ว', 
        className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        icon: CheckCircle
      },
      rejected: { 
        label: 'ปฏิเสธแล้ว', 
        className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        icon: XCircle
      }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.className}`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </span>
    );
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

  const formatPrice = (amount) => {
    if (!amount) return '฿0';
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0
    }).format(amount);
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
      dateFrom: '',
      dateTo: ''
    });
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = !filters.search || 
      request.booking_id?.toString().includes(filters.search) ||
      request.guest_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      request.guest_email?.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesStatus = !filters.status || request.status === filters.status;
    
    const matchesDateFrom = !filters.dateFrom || 
      new Date(request.requested_at) >= new Date(filters.dateFrom);
    
    const matchesDateTo = !filters.dateTo || 
      new Date(request.requested_at) <= new Date(filters.dateTo);

    return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-neutral-50 to-red-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Header */}
        <div className={`mb-8 transform transition-all duration-700 ease-out ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Ban className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
                  จัดการคำขอยกเลิกการจอง
                </h1>
                <p className="text-neutral-600 dark:text-neutral-400">
                  อนุมัติหรือปฏิเสธคำขอยกเลิกการจองจากลูกค้า
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4">
            <button
              onClick={fetchCancellationRequests}
              disabled={loading}
              className="btn-outline flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              รีเฟรช
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 transform transition-all duration-700 delay-200 ease-out ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 shadow-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">คำขอทั้งหมด</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 shadow-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">รอการพิจารณา</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 shadow-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">อนุมัติแล้ว</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.approved}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 shadow-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">ปฏิเสธแล้ว</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.rejected}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Simple Requests List */}
        <div className={`bg-white dark:bg-neutral-800 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden transform transition-all duration-700 delay-300 ease-out ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          <div className="px-6 py-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-neutral-800 dark:to-neutral-900 border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  คำขอยกเลิกการจอง
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                  แสดง {requests.length} รายการ
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-16 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">กำลังโหลดข้อมูล...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="p-16 text-center">
              <Ban className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-neutral-800 dark:text-neutral-200 mb-2">
                ไม่พบคำขอยกเลิกการจอง
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400">
                ยังไม่มีลูกค้าขอยกเลิกการจองในระบบ
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-700">
              {requests.map((request) => (
                <div key={request.id} className="p-6 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                          คำขอยกเลิก #{request.id}
                        </h3>
                        {getStatusBadge(request.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                        <div>
                          <span className="font-medium">การจอง:</span> #{request.booking_id}
                        </div>
                        <div>
                          <span className="font-medium">ผู้จอง:</span> {request.guest_name}
                        </div>
                        <div>
                          <span className="font-medium">วันที่ขอ:</span> {formatDate(request.requested_at)}
                        </div>
                      </div>
                      
                      {request.reason && (
                        <div className="mt-3">
                          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">เหตุผล: </span>
                          <span className="text-sm text-neutral-600 dark:text-neutral-400">{request.reason}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowRequestModal(true);
                          setAdminNotes('');
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        ดูรายละเอียด
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Request Detail Modal */}
        {showRequestModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                  คำขอยกเลิกการจอง #{selectedRequest.id}
                </h3>
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-neutral-900 dark:text-white">สถานะ</h4>
                  {getStatusBadge(selectedRequest.status)}
                </div>

                {/* Booking Details */}
                <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4">
                  <h4 className="font-semibold text-neutral-900 dark:text-white mb-3 flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    รายละเอียดการจอง
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="block font-medium text-neutral-600 dark:text-neutral-400 mb-1">การจอง #</label>
                      <p className="text-neutral-900 dark:text-white">{selectedRequest.booking_id}</p>
                    </div>
                    <div>
                      <label className="block font-medium text-neutral-600 dark:text-neutral-400 mb-1">ผู้จอง</label>
                      <p className="text-neutral-900 dark:text-white">{selectedRequest.guest_name}</p>
                    </div>
                    <div>
                      <label className="block font-medium text-neutral-600 dark:text-neutral-400 mb-1">วันเข้าพัก</label>
                      <p className="text-neutral-900 dark:text-white">{formatDate(selectedRequest.check_in_date)}</p>
                    </div>
                    <div>
                      <label className="block font-medium text-neutral-600 dark:text-neutral-400 mb-1">วันออก</label>
                      <p className="text-neutral-900 dark:text-white">{formatDate(selectedRequest.check_out_date)}</p>
                    </div>
                    <div>
                      <label className="block font-medium text-neutral-600 dark:text-neutral-400 mb-1">ห้องพัก</label>
                      <p className="text-neutral-900 dark:text-white">{selectedRequest.room_type_name || 'ไม่ระบุ'}</p>
                    </div>
                    <div>
                      <label className="block font-medium text-neutral-600 dark:text-neutral-400 mb-1">ยอดรวม</label>
                      <p className="text-neutral-900 dark:text-white">{formatPrice(selectedRequest.total_amount || selectedRequest.total_price)}</p>
                    </div>
                  </div>
                </div>

                {/* Cancellation Details */}
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                  <h4 className="font-semibold text-neutral-900 dark:text-white mb-3 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    รายละเอียดการยกเลิก
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <label className="block font-medium text-neutral-600 dark:text-neutral-400 mb-1">วันที่ขอยกเลิก</label>
                      <p className="text-neutral-900 dark:text-white">{formatDate(selectedRequest.requested_at)}</p>
                    </div>
                    <div>
                      <label className="block font-medium text-neutral-600 dark:text-neutral-400 mb-1">เหตุผล</label>
                      <p className="text-neutral-900 dark:text-white bg-white dark:bg-neutral-800 p-3 rounded border">
                        {selectedRequest.reason || 'ไม่ระบุเหตุผล'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Admin Notes (if processed) */}
                {selectedRequest.status !== 'pending' && selectedRequest.admin_notes && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <h4 className="font-semibold text-neutral-900 dark:text-white mb-3 flex items-center">
                      <MessageSquare className="h-5 w-5 mr-2" />
                      หมายเหตุจากแอดมิน
                    </h4>
                    <p className="text-sm text-neutral-900 dark:text-white bg-white dark:bg-neutral-800 p-3 rounded border">
                      {selectedRequest.admin_notes}
                    </p>
                  </div>
                )}

                {/* Admin Action Section (only for pending requests) */}
                {selectedRequest.status === 'pending' && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                    <h4 className="font-semibold text-neutral-900 dark:text-white mb-3">
                      ดำเนินการ
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                          หมายเหตุ (ไม่บังคับ)
                        </label>
                        <textarea
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          placeholder="เพิ่มหมายเหตุเกี่ยวกับการตัดสินใจ (ถ้ามี)"
                        />
                      </div>
                      
                      <div className="flex space-x-3">
                        <button
                          onClick={() => processRequest(selectedRequest.id, 'approved')}
                          disabled={processing}
                          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          {processing ? 'กำลังดำเนินการ...' : 'อนุมัติการยกเลิก'}
                        </button>
                        <button
                          onClick={() => processRequest(selectedRequest.id, 'rejected')}
                          disabled={processing}
                          className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <XCircle className="h-4 w-4" />
                          {processing ? 'กำลังดำเนินการ...' : 'ปฏิเสธการยกเลิก'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}