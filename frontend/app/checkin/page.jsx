'use client';

import { useState, useEffect } from 'react';
import { checkinAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function CheckInPage() {
  const [pendingCheckins, setPendingCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [checkinForm, setCheckinForm] = useState({
    guestName: '',
    guestPhone: '',
    guestIdNumber: '',
    guestIdType: 'passport',
    additionalGuests: 0,
    specialRequests: '',
    arrivalTransport: '',
    depositAmount: 0,
    depositPaid: false,
    roomKeyIssued: false,
    welcomePackageGiven: false
  });

  useEffect(() => {
    fetchPendingCheckins();
  }, []);

  const fetchPendingCheckins = async () => {
    try {
      setLoading(true);
      const response = await checkinAPI.getPendingCheckins();
      setPendingCheckins(response.pendingCheckins || []);
    } catch (error) {
      console.error('Error fetching pending check-ins:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckinClick = (booking) => {
    setSelectedBooking(booking);
    setCheckinForm({
      ...checkinForm,
      guestName: `${booking.first_name} ${booking.last_name}`,
      guestPhone: booking.phone || ''
    });
    setShowModal(true);
  };

  const handleCheckin = async (e) => {
    e.preventDefault();
    
    if (!selectedBooking) return;

    try {
      setLoading(true);
      
      const checkinData = {
        bookingId: selectedBooking.id,
        ...checkinForm
      };

      const response = await checkinAPI.checkIn(checkinData);
      
      if (response.success) {
        toast.success(`✅ Check-in สำเร็จ - ${response.roomName}`);
        setShowModal(false);
        fetchPendingCheckins();
        setSelectedBooking(null);
        setCheckinForm({
          guestName: '',
          guestPhone: '',
          guestIdNumber: '',
          guestIdType: 'passport',
          additionalGuests: 0,
          specialRequests: '',
          arrivalTransport: '',
          depositAmount: 0,
          depositPaid: false,
          roomKeyIssued: false,
          welcomePackageGiven: false
        });
      } else {
        toast.error(response.error || 'เกิดข้อผิดพลาดในการ check-in');
      }
    } catch (error) {
      console.error('Error during check-in:', error);
      toast.error('เกิดข้อผิดพลาดในการ check-in');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && pendingCheckins.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">🏨 Check-in Management</h1>
        <p className="text-gray-600">จัดการการ check-in ของแขกวันนี้</p>
      </div>

      {/* Refresh Button */}
      <div className="mb-6">
        <button
          onClick={fetchPendingCheckins}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {loading ? '🔄 กำลังโหลด...' : '🔄 รีเฟรช'}
        </button>
      </div>

      {/* Pending Check-ins */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
          <h2 className="text-xl font-semibold">📋 รายการ Check-in วันนี้ ({pendingCheckins.length})</h2>
        </div>

        {pendingCheckins.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-xl font-semibold mb-2">ไม่มีการ check-in ที่รอดำเนินการ</h3>
            <p>แขกทุกคนได้ทำการ check-in เรียบร้อยแล้ว</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {pendingCheckins.map((booking) => (
              <div key={booking.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {booking.first_name} {booking.last_name}
                      </h3>
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        {booking.booking_reference}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">🏠 ห้อง:</span> {booking.room_name}
                        <br />
                        <span className="text-gray-500">({booking.room_type})</span>
                      </div>
                      <div>
                        <span className="font-medium">📞 เบอร์โทร:</span> {booking.phone || 'ไม่ระบุ'}
                        <br />
                        <span className="font-medium">📧 อีเมล:</span> {booking.email}
                      </div>
                      <div>
                        <span className="font-medium">📅 Check-in:</span> {formatDate(booking.check_in_date)}
                        <br />
                        <span className="font-medium">📅 Check-out:</span> {formatDate(booking.check_out_date)}
                      </div>
                      <div>
                        <span className="font-medium">💰 ราคา:</span> {formatPrice(booking.total_price)}
                        {booking.special_requests && (
                          <>
                            <br />
                            <span className="font-medium">📝 คำขอพิเศษ:</span> {booking.special_requests}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleCheckinClick(booking)}
                    className="ml-4 bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    ✅ Check-in
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Check-in Modal */}
      {showModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6">
              <h2 className="text-2xl font-bold">✅ Check-in: {selectedBooking.room_name}</h2>
              <p className="mt-1 text-green-100">
                {selectedBooking.first_name} {selectedBooking.last_name} | {selectedBooking.booking_reference}
              </p>
            </div>

            <form onSubmit={handleCheckin} className="p-6 space-y-6">
              {/* Guest Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    👤 ชื่อแขก *
                  </label>
                  <input
                    type="text"
                    value={checkinForm.guestName}
                    onChange={(e) => setCheckinForm({...checkinForm, guestName: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📞 เบอร์โทรศัพท์
                  </label>
                  <input
                    type="tel"
                    value={checkinForm.guestPhone}
                    onChange={(e) => setCheckinForm({...checkinForm, guestPhone: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* ID Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📋 ประเภทบัตรประชาชน
                  </label>
                  <select
                    value={checkinForm.guestIdType}
                    onChange={(e) => setCheckinForm({...checkinForm, guestIdType: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="passport">พาสปอร์ต</option>
                    <option value="national_id">บัตรประชาชน</option>
                    <option value="driving_license">ใบขับขี่</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🆔 หมายเลขบัตร *
                  </label>
                  <input
                    type="text"
                    value={checkinForm.guestIdNumber}
                    onChange={(e) => setCheckinForm({...checkinForm, guestIdNumber: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Additional Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    👥 จำนวนแขกเพิ่มเติม
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={checkinForm.additionalGuests}
                    onChange={(e) => setCheckinForm({...checkinForm, additionalGuests: parseInt(e.target.value) || 0})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🚗 ยานพาหนะ
                  </label>
                  <input
                    type="text"
                    value={checkinForm.arrivalTransport}
                    onChange={(e) => setCheckinForm({...checkinForm, arrivalTransport: e.target.value})}
                    placeholder="เช่น รถยนต์, มอเตอร์ไซค์, ไม่มี"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Special Requests */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📝 คำขอพิเศษ
                </label>
                <textarea
                  value={checkinForm.specialRequests}
                  onChange={(e) => setCheckinForm({...checkinForm, specialRequests: e.target.value})}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="คำขอพิเศษ..."
                />
              </div>

              {/* Deposit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    💰 จำนวนเงินมัดจำ (บาท)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={checkinForm.depositAmount}
                    onChange={(e) => setCheckinForm({...checkinForm, depositAmount: parseFloat(e.target.value) || 0})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center space-x-4 mt-8">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={checkinForm.depositPaid}
                      onChange={(e) => setCheckinForm({...checkinForm, depositPaid: e.target.checked})}
                      className="mr-2"
                    />
                    ✅ จ่ายเงินมัดจำแล้ว
                  </label>
                </div>
              </div>

              {/* Check items */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700">📋 รายการตรวจสอบ:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={checkinForm.roomKeyIssued}
                      onChange={(e) => setCheckinForm({...checkinForm, roomKeyIssued: e.target.checked})}
                      className="mr-2"
                    />
                    🗝️ มอบกุญแจห้องแล้ว
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={checkinForm.welcomePackageGiven}
                      onChange={(e) => setCheckinForm({...checkinForm, welcomePackageGiven: e.target.checked})}
                      className="mr-2"
                    />
                    🎁 มอบของต้อนรับแล้ว
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  disabled={loading}
                >
                  ❌ ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
                >
                  {loading ? '⏳ กำลังดำเนินการ...' : '✅ ยืนยัน Check-in'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
