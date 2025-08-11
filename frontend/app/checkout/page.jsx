'use client';

import { useState, useEffect } from 'react';
import { checkinAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function CheckOutPage() {
  const [pendingCheckouts, setPendingCheckouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [checkoutForm, setCheckoutForm] = useState({
    lateCheckout: false,
    lateCheckoutFee: 0,
    roomConditionNotes: '',
    damagesReported: '',
    damageCharges: 0,
    minibarCharges: 0,
    extraServicesCharges: 0,
    satisfactionRating: 5,
    feedback: '',
    housekeepingAssigned: true
  });

  useEffect(() => {
    fetchPendingCheckouts();
  }, []);

  const fetchPendingCheckouts = async () => {
    try {
      setLoading(true);
      const response = await checkinAPI.getPendingCheckouts();
      setPendingCheckouts(response.pendingCheckouts || []);
    } catch (error) {
      console.error('Error fetching pending check-outs:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckoutClick = (booking) => {
    setSelectedBooking(booking);
    setCheckoutForm({
      lateCheckout: false,
      lateCheckoutFee: 0,
      roomConditionNotes: '',
      damagesReported: '',
      damageCharges: 0,
      minibarCharges: 0,
      extraServicesCharges: 0,
      satisfactionRating: 5,
      feedback: '',
      housekeepingAssigned: true
    });
    setShowModal(true);
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    
    if (!selectedBooking) return;

    try {
      setLoading(true);
      
      const checkoutData = {
        bookingId: selectedBooking.id,
        checkInId: selectedBooking.check_in_id || selectedBooking.id, // fallback
        ...checkoutForm
      };

      const response = await checkinAPI.checkOut(checkoutData);
      
      if (response.success) {
        toast.success(`✅ Check-out สำเร็จ - ${response.roomName}`);
        
        // แสดงข้อมูลสรุป
        const summary = [];
        if (response.depositReturned > 0) {
          summary.push(`💰 คืนเงินมัดจำ: ${formatPrice(response.depositReturned)}`);
        }
        if (response.finalBillAmount > 0) {
          summary.push(`💳 ค่าใช้จ่ายเพิ่มเติม: ${formatPrice(response.finalBillAmount)}`);
        }
        if (summary.length > 0) {
          toast.success(summary.join(' | '), { duration: 6000 });
        }
        
        setShowModal(false);
        fetchPendingCheckouts();
        setSelectedBooking(null);
      } else {
        toast.error(response.error || 'เกิดข้อผิดพลาดในการ check-out');
      }
    } catch (error) {
      console.error('Error during check-out:', error);
      toast.error('เกิดข้อผิดพลาดในการ check-out');
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

  const calculateTotalCharges = () => {
    return parseFloat(checkoutForm.lateCheckoutFee || 0) +
           parseFloat(checkoutForm.damageCharges || 0) +
           parseFloat(checkoutForm.minibarCharges || 0) +
           parseFloat(checkoutForm.extraServicesCharges || 0);
  };

  const calculateDepositReturn = () => {
    if (!selectedBooking?.deposit_paid) return 0;
    const deposit = parseFloat(selectedBooking.deposit_amount || 0);
    const charges = calculateTotalCharges();
    return Math.max(0, deposit - charges);
  };

  const calculateFinalBill = () => {
    const deposit = selectedBooking?.deposit_paid ? parseFloat(selectedBooking.deposit_amount || 0) : 0;
    const charges = calculateTotalCharges();
    return Math.max(0, charges - deposit);
  };

  if (loading && pendingCheckouts.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">🏨 Check-out Management</h1>
        <p className="text-gray-600">จัดการการ check-out ของแขกวันนี้</p>
      </div>

      {/* Refresh Button */}
      <div className="mb-6">
        <button
          onClick={fetchPendingCheckouts}
          disabled={loading}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {loading ? '🔄 กำลังโหลด...' : '🔄 รีเฟรช'}
        </button>
      </div>

      {/* Pending Check-outs */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4">
          <h2 className="text-xl font-semibold">📋 รายการ Check-out วันนี้ ({pendingCheckouts.length})</h2>
        </div>

        {pendingCheckouts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-xl font-semibold mb-2">ไม่มีการ check-out ที่รอดำเนินการ</h3>
            <p>แขกทุกคนได้ทำการ check-out เรียบร้อยแล้ว</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {pendingCheckouts.map((booking) => (
              <div key={booking.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {booking.guest_name}
                      </h3>
                      <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
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
                        <span className="font-medium">📞 เบอร์โทร:</span> {booking.guest_phone || 'ไม่ระบุ'}
                        <br />
                        <span className="font-medium">✅ Check-in:</span> {formatDate(booking.check_in_time)}
                      </div>
                      <div>
                        <span className="font-medium">📅 Check-out กำหนด:</span> {formatDate(booking.check_out_date)}
                        <br />
                        <span className="font-medium">💰 ราคา:</span> {formatPrice(booking.total_price)}
                      </div>
                      <div>
                        {booking.deposit_paid && (
                          <>
                            <span className="font-medium">🏛️ เงินมัดจำ:</span> {formatPrice(booking.deposit_amount)}
                            <br />
                            <span className="text-green-600 font-medium">✅ จ่ายแล้ว</span>
                          </>
                        )}
                        {!booking.deposit_paid && (
                          <span className="text-gray-500">ไม่มีเงินมัดจำ</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleCheckoutClick(booking)}
                    className="ml-4 bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    🚪 Check-out
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Check-out Modal */}
      {showModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6">
              <h2 className="text-2xl font-bold">🚪 Check-out: {selectedBooking.room_name}</h2>
              <p className="mt-1 text-red-100">
                {selectedBooking.guest_name} | {selectedBooking.booking_reference}
              </p>
            </div>

            <form onSubmit={handleCheckout} className="p-6 space-y-6">
              {/* Late Checkout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="lateCheckout"
                    checked={checkoutForm.lateCheckout}
                    onChange={(e) => setCheckoutForm({...checkoutForm, lateCheckout: e.target.checked})}
                    className="rounded"
                  />
                  <label htmlFor="lateCheckout" className="text-sm font-medium text-gray-700">
                    ⏰ Check-out ช้า
                  </label>
                </div>
                {checkoutForm.lateCheckout && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      💰 ค่าธรรมเนียม Check-out ช้า (บาท)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={checkoutForm.lateCheckoutFee}
                      onChange={(e) => setCheckoutForm({...checkoutForm, lateCheckoutFee: parseFloat(e.target.value) || 0})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>

              {/* Room Condition */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🏠 สภาพห้อง
                </label>
                <textarea
                  value={checkoutForm.roomConditionNotes}
                  onChange={(e) => setCheckoutForm({...checkoutForm, roomConditionNotes: e.target.value})}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="บันทึกสภาพห้องหลัง check-out..."
                />
              </div>

              {/* Damages */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ⚠️ ความเสียหายที่พบ
                  </label>
                  <textarea
                    value={checkoutForm.damagesReported}
                    onChange={(e) => setCheckoutForm({...checkoutForm, damagesReported: e.target.value})}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="รายละเอียดความเสียหาย..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    💰 ค่าเสียหาย (บาท)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={checkoutForm.damageCharges}
                    onChange={(e) => setCheckoutForm({...checkoutForm, damageCharges: parseFloat(e.target.value) || 0})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Additional Charges */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🥤 ค่ามินิบาร์ (บาท)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={checkoutForm.minibarCharges}
                    onChange={(e) => setCheckoutForm({...checkoutForm, minibarCharges: parseFloat(e.target.value) || 0})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🛎️ ค่าบริการเพิ่มเติม (บาท)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={checkoutForm.extraServicesCharges}
                    onChange={(e) => setCheckoutForm({...checkoutForm, extraServicesCharges: parseFloat(e.target.value) || 0})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Customer Satisfaction */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ⭐ คะแนนความพึงพอใจ (1-5)
                  </label>
                  <select
                    value={checkoutForm.satisfactionRating}
                    onChange={(e) => setCheckoutForm({...checkoutForm, satisfactionRating: parseInt(e.target.value)})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ ยอดเยี่ยม (5)</option>
                    <option value={4}>⭐⭐⭐⭐ ดีมาก (4)</option>
                    <option value={3}>⭐⭐⭐ ดี (3)</option>
                    <option value={2}>⭐⭐ พอใช้ (2)</option>
                    <option value={1}>⭐ ต้องปรับปรุง (1)</option>
                  </select>
                </div>
                <div className="flex items-center space-x-3 mt-8">
                  <input
                    type="checkbox"
                    id="housekeepingAssigned"
                    checked={checkoutForm.housekeepingAssigned}
                    onChange={(e) => setCheckoutForm({...checkoutForm, housekeepingAssigned: e.target.checked})}
                    className="rounded"
                  />
                  <label htmlFor="housekeepingAssigned" className="text-sm font-medium text-gray-700">
                    🧹 มอบหมายงานทำความสะอาด
                  </label>
                </div>
              </div>

              {/* Feedback */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  💬 ความคิดเห็นจากแขก
                </label>
                <textarea
                  value={checkoutForm.feedback}
                  onChange={(e) => setCheckoutForm({...checkoutForm, feedback: e.target.value})}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="ความคิดเห็นและข้อเสนอแนะ..."
                />
              </div>

              {/* Billing Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">💰 สรุปการเงิน</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>ค่าธรรมเนียม Check-out ช้า:</span>
                      <span>{formatPrice(checkoutForm.lateCheckoutFee || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ค่าเสียหาย:</span>
                      <span>{formatPrice(checkoutForm.damageCharges || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ค่ามินิบาร์:</span>
                      <span>{formatPrice(checkoutForm.minibarCharges || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ค่าบริการเพิ่มเติม:</span>
                      <span>{formatPrice(checkoutForm.extraServicesCharges || 0)}</span>
                    </div>
                    <div className="flex justify-between font-medium border-t pt-1">
                      <span>รวมค่าใช้จ่ายเพิ่มเติม:</span>
                      <span className="text-red-600">{formatPrice(calculateTotalCharges())}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>เงินมัดจำ:</span>
                      <span>{selectedBooking.deposit_paid ? formatPrice(selectedBooking.deposit_amount) : 'ไม่มี'}</span>
                    </div>
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>คืนเงินมัดจำ:</span>
                      <span>{formatPrice(calculateDepositReturn())}</span>
                    </div>
                    <div className="flex justify-between text-red-600 font-medium border-t pt-1">
                      <span>ค่าใช้จ่ายที่ต้องจ่ายเพิ่ม:</span>
                      <span>{formatPrice(calculateFinalBill())}</span>
                    </div>
                  </div>
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
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
                >
                  {loading ? '⏳ กำลังดำเนินการ...' : '🚪 ยืนยัน Check-out'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
