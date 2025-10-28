'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Clock, XCircle, FileText, Calendar, CreditCard, Eye, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function MyPaymentSlips() {
  const router = useRouter();
  const [slips, setSlips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // all, pending, verified, rejected

  // Mock customer ID - in real app, get from auth context
  const customerId = 'CUST001';

  useEffect(() => {
    fetchPaymentSlips();
  }, [filter]);

  const fetchPaymentSlips = async () => {
    try {
      setIsLoading(true);
      
      const queryParams = new URLSearchParams();
      if (filter !== 'all') {
        queryParams.append('status', filter);
      }
      queryParams.append('customerId', customerId);

      const response = await fetch(`http://localhost:5680/api/payment-slips?${queryParams}`);
      const result = await response.json();

      if (result.success) {
        setSlips(result.slips || []);
      } else {
        toast.error('ไม่สามารถโหลดข้อมูลสลีปได้');
      }
    } catch (error) {
      console.error('Error fetching payment slips:', error);
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'verified':
        return {
          icon: CheckCircle,
          text: 'ตรวจสอบแล้ว',
          color: 'text-green-600',
          bgColor: 'bg-green-100'
        };
      case 'pending':
        return {
          icon: Clock,
          text: 'รอตรวจสอบ',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100'
        };
      case 'rejected':
        return {
          icon: XCircle,
          text: 'ปฏิเสธ',
          color: 'text-red-600',
          bgColor: 'bg-red-100'
        };
      default:
        return {
          icon: Clock,
          text: 'ไม่ทราบสถานะ',
          color: 'text-gray-600',
          bgColor: 'bg-gray-100'
        };
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  const viewSlipDetails = (slip) => {
    setSelectedSlip(slip);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedSlip(null);
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">สลีปการชำระเงินของฉัน</h1>
              <p className="text-gray-600">ตรวจสอบสถานะการชำระเงินและสลีปที่อัพโหลด</p>
            </div>
            <button
              onClick={() => router.push('/upload-payment-slip')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              อัพโหลดสลีปใหม่
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-1">
            {[
              { key: 'all', label: 'ทั้งหมด' },
              { key: 'pending', label: 'รอตรวจสอบ' },
              { key: 'verified', label: 'ตรวจสอบแล้ว' },
              { key: 'rejected', label: 'ปฏิเสธ' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === tab.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Payment Slips List */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">กำลังโหลดข้อมูล...</p>
          </div>
        ) : slips.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'all' ? 'ยังไม่มีสลีปการชำระเงิน' : `ไม่มีสลีปที่มีสถานะ "${getStatusInfo(filter).text}"`}
            </h3>
            <p className="text-gray-600 mb-4">
              เริ่มต้นด้วยการอัพโหลดสลีปการโอนเงินของคุณ
            </p>
            <button
              onClick={() => router.push('/upload-payment-slip')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              อัพโหลดสลีปแรก
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {slips.map((slip) => {
              const statusInfo = getStatusInfo(slip.status);
              const StatusIcon = statusInfo.icon;

              return (
                <div key={slip.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                  {/* Slip Image Preview */}
                  {slip.filePath && (
                    <div className="aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
                      <img
                        src={`http://localhost:5680/uploads/payment-slips/${slip.fileName}`}
                        alt="Payment Slip"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  <div className="p-4">
                    {/* Status Badge */}
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color} mb-3`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusInfo.text}
                    </div>

                    {/* Slip Info */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">หมายเลขสลีป</span>
                        <span className="text-sm font-medium">{slip.slipReference}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">จำนวนเงิน</span>
                        <span className="text-lg font-bold text-green-600">
                          {formatAmount(slip.amount)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">ธนาคาร</span>
                        <span className="text-sm font-medium">{slip.bankName}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">วันที่อัพโหลด</span>
                        <span className="text-sm text-gray-600">
                          {formatDate(slip.uploadedAt)}
                        </span>
                      </div>

                      {slip.bookingReference && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">การจอง</span>
                          <span className="text-sm font-medium">{slip.bookingReference}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex space-x-2">
                      <button
                        onClick={() => viewSlipDetails(slip)}
                        className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        ดูรายละเอียด
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Detail Modal */}
        {isModalOpen && selectedSlip && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">รายละเอียดสลีปการชำระเงิน</h3>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                {/* Slip Image */}
                {selectedSlip.filePath && (
                  <div className="mb-6">
                    <img
                      src={`http://localhost:5680/uploads/payment-slips/${selectedSlip.fileName}`}
                      alt="Payment Slip"
                      className="w-full max-h-64 object-contain rounded-lg border"
                    />
                  </div>
                )}

                {/* Slip Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      หมายเลขสลีป
                    </label>
                    <p className="text-gray-900">{selectedSlip.slipReference}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      สถานะ
                    </label>
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusInfo(selectedSlip.status).bgColor} ${getStatusInfo(selectedSlip.status).color}`}>
                      {getStatusInfo(selectedSlip.status).text}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      จำนวนเงิน
                    </label>
                    <p className="text-lg font-bold text-green-600">
                      {formatAmount(selectedSlip.amount)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ธนาคาร
                    </label>
                    <p className="text-gray-900">{selectedSlip.bankName}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      วันที่โอน
                    </label>
                    <p className="text-gray-900">{selectedSlip.transferDate}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      เวลาโอน
                    </label>
                    <p className="text-gray-900">{selectedSlip.transferTime}</p>
                  </div>

                  {selectedSlip.bookingReference && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        หมายเลขการจอง
                      </label>
                      <p className="text-gray-900">{selectedSlip.bookingReference}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      วันที่อัพโหลด
                    </label>
                    <p className="text-gray-900">{formatDate(selectedSlip.uploadedAt)}</p>
                  </div>
                </div>

                {selectedSlip.description && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      หมายเหตุ
                    </label>
                    <p className="text-gray-900">{selectedSlip.description}</p>
                  </div>
                )}

                {selectedSlip.notes && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      หมายเหตุจากเจ้าหน้าที่
                    </label>
                    <p className="text-gray-900">{selectedSlip.notes}</p>
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