'use client';

import { useState, useEffect } from 'react';
import { bookingsAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

// Component สำหรับแสดง Payment Slip Image พร้อม error handling
function PaymentSlipImage({ src, alt, fileName }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  return (
    <div className="relative">
      {!imageError ? (
        <>
          {imageLoading && (
            <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          )}
          <Image
            src={src}
            alt={alt}
            width={300}
            height={200}
            className="rounded-lg border border-gray-300 object-cover w-full h-auto max-h-48"
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageError(true);
              setImageLoading(false);
            }}
          />
        </>
      ) : (
        <div className="p-4 bg-gray-100 rounded-lg text-center text-gray-500 border border-gray-300">
          <div className="text-sm">ไม่สามารถแสดงรูปภาพได้</div>
          {fileName && (
            <div className="text-xs text-gray-400 mt-1">ไฟล์: {fileName}</div>
          )}
          <div className="text-xs text-gray-400 mt-1">กรุณาตรวจสอบไฟล์ในเซิร์ฟเวอร์</div>
        </div>
      )}
    </div>
  );
}

export default function DetailedBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchDetailedBookings();
  }, []);

  const fetchDetailedBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingsAPI.getDetailedBookingsForAdmin();
      console.log('📊 Detailed bookings response:', response);
      
      if (response.success) {
        setBookings(response.data || []);
      } else {
        toast.error('ไม่สามารถดึงข้อมูลการจองได้');
      }
    } catch (error) {
      console.error('❌ Error fetching detailed bookings:', error);
      toast.error('เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const openDetailModal = (booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedBooking(null);
    setShowModal(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <a href="/admin/dashboard" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600">
                <svg className="mr-2 w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                </svg>
                Dashboard
              </a>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                </svg>
                <span className="text-sm font-medium text-gray-500 ml-1 md:ml-2">ข้อมูลการจองแบบละเอียด</span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              ข้อมูลการจองแบบละเอียด
            </h1>
            <p className="text-gray-600">
              ดูข้อมูลการจองทั้งหมดพร้อมรายละเอียดครบถ้วน รูปภาพหลักฐานการชำระเงิน และข้อมูลลูกค้า
            </p>
          </div>
          <button
            onClick={fetchDetailedBookings}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'กำลังโหลด...' : 'รีเฟรช'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-blue-600">{bookings.length}</div>
            <div className="text-gray-600">การจองทั้งหมด</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-green-600">
              {bookings.filter(b => b.status === 'confirmed').length}
            </div>
            <div className="text-gray-600">ยืนยันแล้ว</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-yellow-600">
              {bookings.filter(b => b.status === 'pending').length}
            </div>
            <div className="text-gray-600">รอดำเนินการ</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-purple-600">
              {bookings.filter(b => b.payment_slips.length > 0).length}
            </div>
            <div className="text-gray-600">มีหลักฐานการชำระ</div>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
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
                    โรงแรม & ห้อง
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    วันที่เข้าพัก
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ราคา
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    หลักฐาน
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {booking.booking_reference}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(booking.created_at)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {booking.guest_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {booking.guest_email}
                        </div>
                        <div className="text-sm text-gray-500">
                          {booking.guest_phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {booking.hotel?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {booking.room_type?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {booking.guests} ผู้เข้าพัก
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">
                          {formatDate(booking.check_in_date)}
                        </div>
                        <div className="text-sm text-gray-500">
                          ถึง {formatDate(booking.check_out_date)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(booking.total_price)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {booking.payment_slips.length > 0 ? (
                        <div className="flex flex-col space-y-1">
                          {booking.payment_slips.map((slip, index) => (
                            <span key={index} className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(slip.status)}`}>
                              {slip.status}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">ไม่มี</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openDetailModal(booking)}
                        className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md transition-colors"
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

        {bookings.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">ไม่มีข้อมูลการจอง</div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl max-h-[90vh] overflow-y-auto w-full mx-4">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
              {/* Modal Header */}
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  รายละเอียดการจอง: {selectedBooking.booking_reference}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Booking Information */}
                <div className="space-y-6">
                  {/* Guest Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-3 text-gray-900">ข้อมูลลูกค้า</h3>
                    <div className="space-y-2">
                      <div><span className="font-medium">ชื่อ:</span> {selectedBooking.guest_name}</div>
                      <div><span className="font-medium">อีเมล:</span> {selectedBooking.guest_email}</div>
                      <div><span className="font-medium">เบอร์โทร:</span> {selectedBooking.guest_phone}</div>
                      {selectedBooking.user && (
                        <div className="mt-2 pt-2 border-t">
                          <div><span className="font-medium">ผู้ใช้ในระบบ:</span> {selectedBooking.user.first_name} {selectedBooking.user.last_name}</div>
                          <div><span className="font-medium">อีเมลบัญชี:</span> {selectedBooking.user.email}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-3 text-gray-900">รายละเอียดการจอง</h3>
                    <div className="space-y-2">
                      <div><span className="font-medium">เลขที่การจอง:</span> {selectedBooking.booking_reference}</div>
                      <div><span className="font-medium">วันเข้าพัก:</span> {formatDate(selectedBooking.check_in_date)}</div>
                      <div><span className="font-medium">วันออก:</span> {formatDate(selectedBooking.check_out_date)}</div>
                      <div><span className="font-medium">จำนวนผู้เข้าพัก:</span> {selectedBooking.guests} คน</div>
                      <div><span className="font-medium">ราคารวม:</span> <span className="text-lg font-bold text-green-600">{formatCurrency(selectedBooking.total_price)}</span></div>
                      <div><span className="font-medium">สถานะ:</span> 
                        <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedBooking.status)}`}>
                          {selectedBooking.status}
                        </span>
                      </div>
                      <div><span className="font-medium">วันที่จอง:</span> {formatDate(selectedBooking.created_at)}</div>
                    </div>
                  </div>

                  {/* Special Requests */}
                  {selectedBooking.special_requests && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-lg mb-3 text-gray-900">คำขอพิเศษ</h3>
                      <p className="text-gray-700">{selectedBooking.special_requests}</p>
                    </div>
                  )}
                </div>

                {/* Hotel & Room Information */}
                <div className="space-y-6">
                  {/* Hotel Information */}
                  {selectedBooking.hotel && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-lg mb-3 text-gray-900">ข้อมูลโรงแรม</h3>
                      <div className="space-y-2">
                        <div><span className="font-medium">ชื่อ:</span> {selectedBooking.hotel.name}</div>
                        <div><span className="font-medium">ที่อยู่:</span> {selectedBooking.hotel.address}</div>
                        {selectedBooking.hotel.description && (
                          <div><span className="font-medium">รายละเอียด:</span> {selectedBooking.hotel.description}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Room Information */}
                  {selectedBooking.room_type && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-lg mb-3 text-gray-900">ข้อมูลห้องพัก</h3>
                      <div className="space-y-2">
                        <div><span className="font-medium">ประเภทห้อง:</span> {selectedBooking.room_type.name}</div>
                        <div><span className="font-medium">ราคาต่อคืน:</span> {formatCurrency(selectedBooking.room_type.price_per_night)}</div>
                        <div><span className="font-medium">ผู้เข้าพักสูงสุด:</span> {selectedBooking.room_type.max_guests} คน</div>
                        {selectedBooking.room_type.size_sqm && (
                          <div><span className="font-medium">ขนาด:</span> {selectedBooking.room_type.size_sqm} ตร.ม.</div>
                        )}
                        {selectedBooking.room_type.description && (
                          <div><span className="font-medium">รายละเอียด:</span> {selectedBooking.room_type.description}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Payment Slips */}
                  {selectedBooking.payment_slips.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-lg mb-3 text-gray-900">หลักฐานการชำระเงิน</h3>
                      <div className="space-y-4">
                        {selectedBooking.payment_slips.map((slip, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-3 bg-white">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div><span className="font-medium">จำนวนเงิน:</span> {formatCurrency(slip.amount)}</div>
                                <div><span className="font-medium">วันที่ชำระ:</span> {formatDate(slip.payment_date)}</div>
                                <div><span className="font-medium">สถานะ:</span> 
                                  <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(slip.status)}`}>
                                    {slip.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {slip.file_path && (
                              <div className="mt-3">
                                <div className="font-medium mb-2">รูปภาพหลักฐาน:</div>
                                <div className="relative w-full max-w-sm">
                                  <PaymentSlipImage 
                                    src={`http://localhost:3001${slip.file_path}`}
                                    alt="หลักฐานการชำระเงิน"
                                    fileName={slip.file_name}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 mt-8 pt-4 flex justify-end space-x-4">
                <button
                  onClick={closeModal}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  ปิด
                </button>
                <button
                  onClick={() => window.print()}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  พิมพ์
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}