'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, User, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function AdminCancellationRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    fetchCancellationRequests();
  }, []);

  const fetchCancellationRequests = async () => {
    try {
      console.log('🔍 Fetching cancellation requests...');
      const response = await fetch('http://localhost:3001/api/cancellation-requests');
      const result = await response.json();
      
      console.log('📊 Cancellation requests response:', result);
      
      if (result.success && result.data) {
        setRequests(result.data);
      } else {
        setRequests([]);
      }
    } catch (error) {
      console.error('❌ Error fetching cancellation requests:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'รอการพิจารณา';
      case 'approved':
        return 'อนุมัติแล้ว';
      case 'rejected':
        return 'ปฏิเสธแล้ว';
      default:
        return 'ไม่ทราบสถานะ';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openProcessModal = (request, actionType) => {
    setSelectedRequest(request);
    setAction(actionType);
    setAdminNotes('');
    setShowModal(true);
  };

  const handleProcessRequest = async () => {
    if (!selectedRequest || !action) return;

    setProcessing(true);
    try {
      const response = await fetch('http://localhost:3001/api/cancellation-requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          request_id: selectedRequest.id,
          action: action,
          admin_id: user?.id || 1, // Use actual admin ID
          admin_notes: adminNotes
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`${action === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ'}คำขอยกเลิกการจองเรียบร้อยแล้ว`);
        
        // Refresh the list
        fetchCancellationRequests();
        
        // Close modal
        setShowModal(false);
        setSelectedRequest(null);
        setAction('');
        setAdminNotes('');
      } else {
        alert(result.message || 'เกิดข้อผิดพลาดในการประมวลผลคำขอ');
      }
    } catch (error) {
      console.error('Error processing request:', error);
      alert('เกิดข้อผิดพลาดในการประมวลผลคำขอ');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">จัดการคำขอยกเลิกการจอง</h1>
          <p className="text-gray-600">อนุมัติหรือปฏิเสธคำขอยกเลิกการจองจากลูกค้า</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-yellow-600 mb-2">
              {requests.filter(r => r.status === 'pending').length}
            </div>
            <p className="text-gray-600">รอการพิจารณา</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {requests.filter(r => r.status === 'approved').length}
            </div>
            <p className="text-gray-600">อนุมัติแล้ว</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-red-600 mb-2">
              {requests.filter(r => r.status === 'rejected').length}
            </div>
            <p className="text-gray-600">ปฏิเสธแล้ว</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {requests.length}
            </div>
            <p className="text-gray-600">ทั้งหมด</p>
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-gray-400 mb-4">
              <AlertCircle className="w-16 h-16 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">ไม่มีคำขอยกเลิกการจอง</h2>
            <p className="text-gray-500">ยังไม่มีลูกค้าขอยกเลิกการจอง</p>
          </div>
        ) : (
          <div className="space-y-6">
            {requests.map((request) => (
              <div key={request.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4">
                    <div className="flex items-center space-x-3 mb-2 lg:mb-0">
                      <h3 className="text-xl font-semibold text-gray-800">
                        คำขอ #{request.id}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${getStatusBadgeClass(request.status)}`}>
                        {getStatusIcon(request.status)}
                        <span>{getStatusText(request.status)}</span>
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">วันที่ขอยกเลิก</p>
                      <p className="font-semibold">{formatDate(request.requested_at)}</p>
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div className="border rounded-lg p-4 mb-4 bg-gray-50">
                    <h4 className="font-semibold text-gray-800 mb-3">รายละเอียดการจอง</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">การจอง #</p>
                        <p className="font-medium">{request.booking_id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">โรงแรม</p>
                        <p className="font-medium">{request.hotel_name || 'ไม่ระบุ'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">ประเภทห้อง</p>
                        <p className="font-medium">{request.room_type_name || 'ไม่ระบุ'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">ชื่อผู้จอง</p>
                        <p className="font-medium">{request.guest_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">วันเช็คอิน</p>
                        <p className="font-medium">{new Date(request.check_in_date).toLocaleDateString('th-TH')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">วันเช็คเอาท์</p>
                        <p className="font-medium">{new Date(request.check_out_date).toLocaleDateString('th-TH')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">ยอดรวม</p>
                        <p className="font-medium text-green-600">฿{request.total_price?.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Cancellation Reason */}
                  {request.reason && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-800 mb-2">เหตุผลในการขอยกเลิก</h4>
                      <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{request.reason}</p>
                    </div>
                  )}

                  {/* Admin Notes */}
                  {request.admin_notes && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-800 mb-2">หมายเหตุจากเจ้าหน้าที่</h4>
                      <p className="text-gray-600 bg-blue-50 p-3 rounded-lg">{request.admin_notes}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {request.status === 'pending' && (
                    <div className="flex space-x-3">
                      <button
                        onClick={() => openProcessModal(request, 'approved')}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                        disabled={processing}
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>อนุมัติ</span>
                      </button>
                      
                      <button
                        onClick={() => openProcessModal(request, 'rejected')}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                        disabled={processing}
                      >
                        <XCircle className="w-4 h-4" />
                        <span>ปฏิเสธ</span>
                      </button>
                    </div>
                  )}

                  {request.status !== 'pending' && request.processed_at && (
                    <div className="text-sm text-gray-500">
                      ประมวลผลเมื่อ: {formatDate(request.processed_at)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Process Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {action === 'approved' ? 'อนุมัติคำขอยกเลิก' : 'ปฏิเสธคำขอยกเลิก'}
            </h3>
            
            <p className="text-gray-600 mb-4">
              คำขอยกเลิกการจอง #{selectedRequest.booking_id} โดย {selectedRequest.guest_name}
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                หมายเหตุ (ไม่บังคับ)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="ระบุหมายเหตุเพิ่มเติม..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none h-24"
                disabled={processing}
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedRequest(null);
                  setAction('');
                  setAdminNotes('');
                }}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={processing}
              >
                ยกเลิก
              </button>
              <button
                onClick={handleProcessRequest}
                className={`flex-1 ${action === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50`}
                disabled={processing}
              >
                {processing ? 'กำลังประมวลผล...' : (action === 'approved' ? 'ยืนยันอนุมัติ' : 'ยืนยันปฏิเสธ')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}