'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import AdminNavigation from '@/components/AdminNavigation';
import axios from 'axios';
import Cookies from 'js-cookie';

// Create API instance
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5680';
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = Cookies.get('auth_token') || localStorage.getItem('auth_token_persistent');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const ReceiptModal = ({ booking, isOpen, onClose, onApprove, onReject, onApprovePaymentSlip, onRejectPaymentSlip }) => {
  if (!isOpen || !booking) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'ไม่ทราบ';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB';
    return Math.round(bytes / 1048576) + ' MB';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            ตรวจสอบใบเสร็จการชำระเงิน
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {/* รายละเอียดการจอง */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">รายละเอียดการจอง</h3>
            
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">รหัสการจอง</h4>
              <p className="text-gray-700">{booking.booking_reference}</p>
            </div>

            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">สถานะ</h4>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                booking.status === 'checked_in' ? 'bg-green-100 text-green-800' :
                booking.status === 'checked_out' ? 'bg-gray-100 text-gray-800' :
                booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {booking.status === 'pending' ? 'รอการยืนยัน' :
                 booking.status === 'confirmed' ? 'ยืนยันแล้ว' :
                 booking.status === 'checked_in' ? 'เช็คอินแล้ว' :
                 booking.status === 'checked_out' ? 'เช็คเอาท์แล้ว' :
                 booking.status === 'cancelled' ? 'ยกเลิกแล้ว' :
                 booking.status}
              </span>
            </div>

            <h4 className="font-medium text-gray-900 mb-3">ข้อมูลผู้เข้าพัก</h4>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm"><span className="font-medium">ชื่อ-นามสกุล</span></p>
                <p className="text-gray-700">{booking.guest_name}</p>
              </div>
              <div>
                <p className="text-sm"><span className="font-medium">อีเมล</span></p>
                <p className="text-gray-700">{booking.guest_email}</p>
              </div>
              <div>
                <p className="text-sm"><span className="font-medium">เบอร์โทรศัพท์</span></p>
                <p className="text-gray-700">{booking.guest_phone}</p>
              </div>
              {booking.guest_id_number && (
                <div>
                  <p className="text-sm"><span className="font-medium">เลขบัตรประชาชน</span></p>
                  <p className="text-gray-700">{booking.guest_id_number}</p>
                </div>
              )}
            </div>

            <h4 className="font-medium text-gray-900 mb-3">รายละเอียดการจอง</h4>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm"><span className="font-medium">ห้องพัก</span></p>
                <p className="text-gray-700">{booking.room_type_name}</p>
              </div>
              <div>
                <p className="text-sm"><span className="font-medium">จำนวนผู้เข้าพัก</span></p>
                <p className="text-gray-700">{booking.guests} คน</p>
              </div>
              <div>
                <p className="text-sm"><span className="font-medium">วันที่เข้าพัก</span></p>
                <p className="text-gray-700">{new Date(booking.check_in_date).toLocaleDateString('th-TH', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}</p>
              </div>
              <div>
                <p className="text-sm"><span className="font-medium">วันที่ออก</span></p>
                <p className="text-gray-700">{new Date(booking.check_out_date).toLocaleDateString('th-TH', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}</p>
              </div>
              <div>
                <p className="text-sm"><span className="font-medium">จำนวนคืน</span></p>
                <p className="text-gray-700">{Math.ceil((new Date(booking.check_out_date) - new Date(booking.check_in_date)) / (1000 * 60 * 60 * 24))} คืน</p>
              </div>
              <div>
                <p className="text-sm"><span className="font-medium">จำนวนเงินรวม</span></p>
                <p className="text-green-600 font-semibold">฿{booking.total_price?.toLocaleString()}</p>
              </div>
            </div>

            {booking.special_requests && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">คำขอพิเศษ</h4>
                <p className="text-gray-700 bg-white p-3 rounded border">{booking.special_requests}</p>
              </div>
            )}

            <h4 className="font-medium text-gray-900 mb-3">ข้อมูลระบบ</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm"><span className="font-medium">วันที่จอง</span></p>
                <p className="text-gray-700">{new Date(booking.created_at).toLocaleDateString('th-TH', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}</p>
              </div>
              <div>
                <p className="text-sm"><span className="font-medium">อัปเดตล่าสุด</span></p>
                <p className="text-gray-700">{new Date(booking.updated_at).toLocaleDateString('th-TH', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}</p>
              </div>
            </div>
          </div>

          {/* Receipt Info */}
          {booking.payment_receipt_url && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">ข้อมูลใบเสร็จ</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><span className="font-medium">อัพโหลดเมื่อ:</span> {booking.receipt_uploaded_at ? formatDate(booking.receipt_uploaded_at) : 'ไม่ทราบ'}</p>
                  <p><span className="font-medium">ชื่อไฟล์:</span> {booking.receipt_filename || 'ไม่ทราบ'}</p>
                </div>
                <div>
                  <p><span className="font-medium">ขนาดไฟล์:</span> {formatFileSize(booking.receipt_file_size)}</p>
                  <p><span className="font-medium">สถานะชำระเงิน:</span> 
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      booking.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {booking.payment_status === 'paid' ? 'ชำระแล้ว' : 'รอตรวจสอบ'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Debug Info */}
          <div className="mb-4 p-3 bg-yellow-50 rounded text-xs">
            <strong>Debug Info:</strong><br/>
            payment_receipt_url: {booking.payment_receipt_url || 'null'}<br/>
            payment_status: {booking.payment_status || 'null'}
          </div>

          {/* Receipt Image */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">ใบเสร็จการชำระเงิน</h3>
            
            {/* Show payment_receipt_url (new system) */}
            {booking.payment_receipt_url ? (
              <div className="mb-4">
                <h4 className="text-md font-medium text-gray-900 mb-2">ใบเสร็จจากระบบใหม่:</h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={booking.payment_receipt_url}
                    alt="ใบเสร็จการชำระเงิน"
                    className="w-full max-h-96 object-contain bg-gray-100"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <div style={{display: 'none'}} className="p-8 text-center bg-gray-100">
                    <p className="text-gray-500">ไม่สามารถแสดงภาพได้</p>
                    <a
                      href={booking.payment_receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      เปิดใบเสร็จในหน้าใหม่
                    </a>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Show payment slip (legacy system) */}
            {booking.payment_file_path ? (
              <div className="mb-4">
                <h4 className="text-md font-medium text-gray-900 mb-2">ใบเสร็จจากระบบเดิม:</h4>
                <div className="bg-blue-50 rounded-lg p-3 mb-2">
                  <div className="text-sm">
                    <p><span className="font-medium">ชื่อไฟล์:</span> {booking.payment_file_name}</p>
                    <p><span className="font-medium">จำนวนเงิน:</span> ฿{booking.payment_amount?.toLocaleString()}</p>
                    <p><span className="font-medium">วันที่อัปโหลด:</span> {booking.payment_date ? formatDate(booking.payment_date) : 'ไม่ทราบ'}</p>
                    <p><span className="font-medium">สถานะ:</span> 
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${
                        booking.payment_slip_status === 'approved' ? 'bg-green-100 text-green-800' : 
                        booking.payment_slip_status === 'rejected' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {booking.payment_slip_status === 'approved' ? 'อนุมัติแล้ว' : 
                         booking.payment_slip_status === 'rejected' ? 'ถูกปฏิเสธ' : 'รอตรวจสอบ'}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={`http://localhost:5680/uploads/payment-slips/${booking.payment_file_path}`}
                    alt="ใบเสร็จการชำระเงิน"
                    className="w-full max-h-96 object-contain bg-gray-100"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <div style={{display: 'none'}} className="p-8 text-center bg-gray-100">
                    <p className="text-gray-500">ไม่สามารถแสดงภาพได้</p>
                    <a
                      href={`http://localhost:5680/uploads/payment-slips/${booking.payment_file_path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      เปิดใบเสร็จในหน้าใหม่
                    </a>
                  </div>
                </div>
              </div>
            ) : null}

            {/* No receipt found */}
            {!booking.payment_receipt_url && !booking.payment_file_path && (
              <div className="p-8 text-center bg-gray-100 rounded-lg">
                <p className="text-gray-500">ยังไม่มีใบเสร็จ</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end">
            {/* Payment Slip Actions */}
            {booking.payment_slip_id && booking.payment_slip_status === 'pending' && (
              <>
                <button
                  onClick={() => onRejectPaymentSlip(booking.payment_slip_id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  ปฏิเสธใบเสร็จ
                </button>
                <button
                  onClick={() => onApprovePaymentSlip(booking.payment_slip_id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  อนุมัติใบเสร็จ
                </button>
              </>
            )}

            {/* Booking Status Actions */}
            {booking.status === 'pending' && (
              <>
                <button
                  onClick={() => onReject(booking.id)}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  ปฏิเสธการจอง
                </button>
                <button
                  onClick={() => onApprove(booking.id)}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  อนุมัติการจอง
                </button>
              </>
            )}

            {/* Show status if already processed */}
            {booking.payment_slip_status === 'approved' && (
              <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm">
                ✅ ใบเสร็จได้รับการอนุมัติแล้ว
              </span>
            )}
            {booking.payment_slip_status === 'rejected' && (
              <span className="px-4 py-2 bg-red-100 text-red-800 rounded-lg text-sm">
                ❌ ใบเสร็จถูกปฏิเสธ
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AdminReceiptsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchBookings();
  }, [filter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching bookings for admin review...');
      
      const response = await api.get('/admin/bookings/detailed', {
        params: {
          status: filter === 'all' ? undefined : filter
        }
      });
      
      if (response.data.success) {
        console.log('✅ Admin bookings loaded:', response.data.data);
        setBookings(response.data.data || []);
      } else {
        throw new Error(response.data.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล');
      }
    } catch (error) {
      console.error('❌ Error fetching bookings:', error);
      toast.error('เกิดข้อผิดพลาดในการดึงข้อมูลการจอง');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveBooking = async (bookingId) => {
    try {
      await api.put(`/bookings/${bookingId}/status`, {
        status: 'confirmed'
      });
      toast.success('อนุมัติการจองเรียบร้อยแล้ว');
      setShowModal(false);
      fetchBookings();
    } catch (error) {
      console.error('❌ Error approving booking:', error);
      toast.error('เกิดข้อผิดพลาดในการอนุมัติการจอง');
    }
  };

  const handleRejectBooking = async (bookingId) => {
    try {
      await api.put(`/bookings/${bookingId}/status`, {
        status: 'cancelled'
      });
      toast.success('ปฏิเสธการจองเรียบร้อยแล้ว');
      setShowModal(false);
      fetchBookings();
    } catch (error) {
      console.error('❌ Error rejecting booking:', error);
      toast.error('เกิดข้อผิดพลาดในการปฏิเสธการจอง');
    }
  };

  const handleApprovePaymentSlip = async (paymentSlipId) => {
    try {
      await api.put(`/admin/payment-slips/${paymentSlipId}/status`, {
        status: 'approved'
      });
      toast.success('อนุมัติใบเสร็จเรียบร้อยแล้ว');
      setShowModal(false);
      fetchBookings();
    } catch (error) {
      console.error('❌ Error approving payment slip:', error);
      toast.error('เกิดข้อผิดพลาดในการอนุมัติใบเสร็จ');
    }
  };

  const handleRejectPaymentSlip = async (paymentSlipId) => {
    try {
      await api.put(`/admin/payment-slips/${paymentSlipId}/status`, {
        status: 'rejected'
      });
      toast.success('ปฏิเสธใบเสร็จเรียบร้อยแล้ว');
      setShowModal(false);
      fetchBookings();
    } catch (error) {
      console.error('❌ Error rejecting payment slip:', error);
      toast.error('เกิดข้อผิดพลาดในการปฏิเสธใบเสร็จ');
    }
  };

  const openReceiptModal = (booking) => {
    console.log('🔍 Opening receipt modal for booking:', booking);
    console.log('📸 Payment receipt URL:', booking.payment_receipt_url);
    console.log('📊 Receipt data:', {
      url: booking.payment_receipt_url,
      filename: booking.receipt_filename,
      uploadedAt: booking.receipt_uploaded_at,
      fileSize: booking.receipt_file_size,
      paymentStatus: booking.payment_status
    });
    setSelectedBooking(booking);
    setShowModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'checked_in': return 'bg-green-100 text-green-800';
      case 'checked_out': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'รอดำเนินการ';
      case 'confirmed': return 'ยืนยันแล้ว';
      case 'checked_in': return 'เช็คอินแล้ว';
      case 'checked_out': return 'เช็คเอาท์แล้ว';
      case 'cancelled': return 'ยกเลิกแล้ว';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Admin Navigation */}
        <AdminNavigation 
          title="ตรวจสอบใบเสร็จและอนุมัติการจอง"
          description="ดูใบเสร็จการชำระเงินและอนุมัติการจองของลูกค้า"
        />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ตรวจสอบใบเสร็จและอนุมัติการจอง</h1>
          <p className="text-gray-600">
            ดูใบเสร็จการชำระเงินและอนุมัติการจองของลูกค้า
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 bg-white p-2 rounded-lg shadow-sm border border-gray-200">
            {[
              { key: 'pending', label: 'รอดำเนินการ' },
              { key: 'confirmed', label: 'อนุมัติแล้ว' },
              { key: 'all', label: 'ทั้งหมด' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === key
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings Table */}
        {bookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              ไม่มีการจองที่ต้องตรวจสอบ
            </h3>
            <p className="text-gray-600">
              ไม่มีการจองที่ต้องดูใบเสร็จในขณะนี้
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      การจอง
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ลูกค้า
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ห้องพัก
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ราคา
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      สถานะ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ใบเสร็จ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      การดำเนินการ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            #{booking.booking_reference}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(booking.created_at).toLocaleDateString('th-TH')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {booking.guest_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.guest_phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {booking.room_type_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {booking.hotel_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ฿{booking.total_price?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                          {getStatusText(booking.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {booking.payment_receipt_url ? (
                          <div className="flex items-center">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 mr-2">
                              มีใบเสร็จ
                            </span>
                            {booking.receipt_uploaded_at && (
                              <div className="text-xs text-gray-500">
                                {new Date(booking.receipt_uploaded_at).toLocaleDateString('th-TH')}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                            ไม่มีใบเสร็จ
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => openReceiptModal(booking)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          ดูรายละเอียด
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Receipt Modal */}
        <ReceiptModal
          booking={selectedBooking}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onApprove={handleApproveBooking}
          onReject={handleRejectBooking}
          onApprovePaymentSlip={handleApprovePaymentSlip}
          onRejectPaymentSlip={handleRejectPaymentSlip}
        />
      </div>
    </div>
  );
}