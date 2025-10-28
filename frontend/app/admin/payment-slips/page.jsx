'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Clock, XCircle, FileText, Search, Eye, Check, X, Download, Filter } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminPaymentSlips() {
  const [slips, setSlips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    fetchPaymentSlips();
    fetchStatistics();
  }, [filter]);

  const fetchPaymentSlips = async () => {
    try {
      setIsLoading(true);
      
      const queryParams = new URLSearchParams();
      if (filter !== 'all') {
        queryParams.append('status', filter);
      }

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

  const fetchStatistics = async () => {
    try {
      const response = await fetch('http://localhost:5680/api/payment-slip-statistics');
      const result = await response.json();

      if (result.success) {
        setStatistics(result.statistics);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const updateSlipStatus = async (slipId, status, notes = '') => {
    try {
      const response = await fetch(`http://localhost:5680/api/payment-slips/${slipId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status,
          verifiedBy: 'admin', // In real app, get from auth context
          notes
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`อัพเดทสถานะเป็น "${getStatusText(status)}" เรียบร้อย`);
        fetchPaymentSlips();
        fetchStatistics();
        
        if (selectedSlip && selectedSlip.id === slipId) {
          setSelectedSlip({ ...selectedSlip, status, notes });
        }
      } else {
        toast.error('ไม่สามารถอัพเดทสถานะได้');
      }
    } catch (error) {
      console.error('Error updating slip status:', error);
      toast.error('เกิดข้อผิดพลาดในการอัพเดทสถานะ');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchPaymentSlips();
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`http://localhost:5680/api/payment-slips/search/${encodeURIComponent(searchQuery)}`);
      const result = await response.json();

      if (result.success) {
        setSlips(result.results || []);
      } else {
        toast.error('ไม่พบผลการค้นหา');
      }
    } catch (error) {
      console.error('Error searching slips:', error);
      toast.error('เกิดข้อผิดพลาดในการค้นหา');
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

  const getStatusText = (status) => {
    const statusMap = {
      'verified': 'ตรวจสอบแล้ว',
      'pending': 'รอตรวจสอบ',
      'rejected': 'ปฏิเสธ'
    };
    return statusMap[status] || 'ไม่ทราบสถานะ';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
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

  const exportSlips = async (format) => {
    try {
      const response = await fetch(`http://localhost:5680/api/payment-slips-export/${format}`);
      
      if (format === 'csv') {
        const csvData = await response.text();
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'payment-slips.csv';
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success('ส่งออกข้อมูล CSV เรียบร้อย');
      } else {
        const jsonData = await response.json();
        const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'payment-slips.json';
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success('ส่งออกข้อมูล JSON เรียบร้อย');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('เกิดข้อผิดพลาดในการส่งออกข้อมูล');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">จัดการสลีปการชำระเงิน</h1>
              <p className="text-gray-600">ตรวจสอบและอนุมัติสลีปการชำระเงินจากลูกค้า</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => exportSlips('csv')}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </button>
              <button
                onClick={() => exportSlips('json')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Export JSON
              </button>
            </div>
          </div>

          {/* Statistics */}
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{statistics.total}</div>
                <div className="text-sm text-blue-600">ทั้งหมด</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{statistics.pending}</div>
                <div className="text-sm text-yellow-600">รอตรวจสอบ</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{statistics.verified}</div>
                <div className="text-sm text-green-600">ตรวจสอบแล้ว</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{statistics.rejected}</div>
                <div className="text-sm text-red-600">ปฏิเสธ</div>
              </div>
            </div>
          )}

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex">
              <input
                type="text"
                placeholder="ค้นหาด้วยหมายเลขสลีป, ชื่อลูกค้า, หมายเลขการจอง..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSearch}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r-lg transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>

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
            <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่พบสลีปการชำระเงิน</h3>
            <p className="text-gray-600">
              {searchQuery ? 'ไม่พบผลการค้นหาที่ตรงกับคำค้นหา' : 'ยังไม่มีสลีปการชำระเงินในระบบ'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      สลีป
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ลูกค้า
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      จำนวนเงิน
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ธนาคาร
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      สถานะ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      วันที่อัพโหลด
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      การจัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {slips.map((slip) => {
                    const statusInfo = getStatusInfo(slip.status);
                    const StatusIcon = statusInfo.icon;

                    return (
                      <tr key={slip.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {slip.filePath && (
                              <img
                                src={`http://localhost:5680/uploads/payment-slips/${slip.fileName}`}
                                alt="Slip"
                                className="h-10 w-10 rounded-lg object-cover mr-3"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {slip.slipReference}
                              </div>
                              {slip.bookingReference && (
                                <div className="text-sm text-gray-500">
                                  จอง: {slip.bookingReference}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {slip.customerName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {slip.customerId}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-green-600">
                            {formatAmount(slip.amount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{slip.bankName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusInfo.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(slip.uploadedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => viewSlipDetails(slip)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {slip.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => updateSlipStatus(slip.id, 'verified')}
                                  className="text-green-600 hover:text-green-900"
                                  title="อนุมัติ"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => updateSlipStatus(slip.id, 'rejected')}
                                  className="text-red-600 hover:text-red-900"
                                  title="ปฏิเสธ"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {isModalOpen && selectedSlip && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Slip Image */}
                  <div>
                    {selectedSlip.filePath && (
                      <div className="mb-4">
                        <img
                          src={`http://localhost:5680/uploads/payment-slips/${selectedSlip.fileName}`}
                          alt="Payment Slip"
                          className="w-full max-h-96 object-contain rounded-lg border"
                        />
                      </div>
                    )}
                  </div>

                  {/* Slip Details */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
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
                          ลูกค้า
                        </label>
                        <p className="text-gray-900">{selectedSlip.customerName}</p>
                        <p className="text-sm text-gray-500">{selectedSlip.customerId}</p>
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
                        <p className="text-gray-900">{selectedSlip.transferDate} {selectedSlip.transferTime}</p>
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
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          หมายเหตุจากลูกค้า
                        </label>
                        <p className="text-gray-900">{selectedSlip.description}</p>
                      </div>
                    )}

                    {selectedSlip.notes && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          หมายเหตุจากเจ้าหน้าที่
                        </label>
                        <p className="text-gray-900">{selectedSlip.notes}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {selectedSlip.status === 'pending' && (
                      <div className="flex space-x-3 pt-4">
                        <button
                          onClick={() => {
                            updateSlipStatus(selectedSlip.id, 'verified');
                            closeModal();
                          }}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          อนุมัติ
                        </button>
                        <button
                          onClick={() => {
                            updateSlipStatus(selectedSlip.id, 'rejected');
                            closeModal();
                          }}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
                        >
                          <X className="w-4 h-4 mr-2" />
                          ปฏิเสธ
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}