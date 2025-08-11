'use client';

import { useState, useEffect } from 'react';
import { checkinAPI } from '@/lib/api';
import toast from 'react-hot-toast';

const RoomStatusBadge = ({ status }) => {
  const statusConfig = {
    available: { color: 'bg-green-100 text-green-800', text: '✅ ว่าง', icon: '🟢' },
    occupied: { color: 'bg-blue-100 text-blue-800', text: '👥 มีผู้พัก', icon: '🔵' },
    cleaning: { color: 'bg-yellow-100 text-yellow-800', text: '🧹 ทำความสะอาด', icon: '🟡' },
    maintenance: { color: 'bg-orange-100 text-orange-800', text: '🔧 ซ่อมแซม', icon: '🟠' },
    out_of_order: { color: 'bg-red-100 text-red-800', text: '❌ ไม่พร้อมใช้', icon: '🔴' }
  };

  const config = statusConfig[status] || statusConfig.available;

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
      <span className="mr-2">{config.icon}</span>
      {config.text}
    </span>
  );
};

export default function RoomStatusPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusForm, setStatusForm] = useState({
    status: '',
    notes: ''
  });

  useEffect(() => {
    fetchRoomsStatus();
  }, []);

  const fetchRoomsStatus = async () => {
    try {
      setLoading(true);
      const response = await checkinAPI.getRoomsStatus();
      setRooms(response.rooms || []);
    } catch (error) {
      console.error('Error fetching rooms status:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (room) => {
    setSelectedRoom(room);
    setStatusForm({
      status: room.status || 'available',
      notes: room.notes || ''
    });
    setShowStatusModal(true);
  };

  const updateRoomStatus = async (e) => {
    e.preventDefault();
    
    if (!selectedRoom) return;

    try {
      setLoading(true);
      
      const response = await checkinAPI.updateRoomStatus(selectedRoom.id, statusForm);
      
      if (response.success) {
        toast.success(response.message);
        setShowStatusModal(false);
        fetchRoomsStatus();
        setSelectedRoom(null);
      } else {
        toast.error(response.error || 'เกิดข้อผิดพลาดในการอัปเดตสถานะ');
      }
    } catch (error) {
      console.error('Error updating room status:', error);
      toast.error('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
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
    if (!dateString) return 'ไม่มีข้อมูล';
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // สรุปสถิติ
  const statusStats = rooms.reduce((acc, room) => {
    const status = room.status || 'available';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const totalRooms = rooms.length;
  const occupancyRate = totalRooms > 0 ? ((statusStats.occupied || 0) / totalRooms * 100).toFixed(1) : 0;

  if (loading && rooms.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">🏠 Room Status Dashboard</h1>
        <p className="text-gray-600">ติดตามสถานะห้องพักทั้งหมด</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-md p-4 text-center">
          <div className="text-2xl font-bold text-gray-800">{totalRooms}</div>
          <div className="text-sm text-gray-600">🏠 ห้องทั้งหมด</div>
        </div>
        <div className="bg-green-50 rounded-lg shadow-md p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{statusStats.available || 0}</div>
          <div className="text-sm text-green-700">✅ ห้องว่าง</div>
        </div>
        <div className="bg-blue-50 rounded-lg shadow-md p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{statusStats.occupied || 0}</div>
          <div className="text-sm text-blue-700">👥 มีผู้พัก</div>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow-md p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{statusStats.cleaning || 0}</div>
          <div className="text-sm text-yellow-700">🧹 ทำความสะอาด</div>
        </div>
        <div className="bg-orange-50 rounded-lg shadow-md p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{statusStats.maintenance || 0}</div>
          <div className="text-sm text-orange-700">🔧 ซ่อมแซม</div>
        </div>
        <div className="bg-gray-50 rounded-lg shadow-md p-4 text-center">
          <div className="text-2xl font-bold text-gray-800">{occupancyRate}%</div>
          <div className="text-sm text-gray-600">📊 อัตราเข้าพัก</div>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="mb-6">
        <button
          onClick={fetchRoomsStatus}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {loading ? '🔄 กำลังโหลด...' : '🔄 รีเฟรช'}
        </button>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {rooms.map((room) => (
          <div key={room.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            {/* Room Header */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">{room.name}</h3>
                <RoomStatusBadge status={room.status} />
              </div>
              <p className="text-sm text-gray-600 mt-1">{room.type}</p>
            </div>

            {/* Room Info */}
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">👥 จำนวนแขก:</span>
                  <div className="font-medium">{room.max_guests} คน</div>
                </div>
                <div>
                  <span className="text-gray-500">💰 ราคา/คืน:</span>
                  <div className="font-medium">{formatPrice(room.price_per_night)}</div>
                </div>
              </div>

              {/* Current Guest Info */}
              {room.status === 'occupied' && room.guest_name && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-sm text-blue-800">
                    <div className="font-medium">👤 แขกปัจจุบัน: {room.guest_name}</div>
                    {room.check_in_date && (
                      <div>📅 Check-in: {formatDate(room.check_in_date)}</div>
                    )}
                    {room.check_out_date && (
                      <div>📅 Check-out: {formatDate(room.check_out_date)}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Last Activities */}
              <div className="space-y-1 text-xs text-gray-500">
                {room.last_checkout && (
                  <div>🚪 Check-out ล่าสุด: {formatDate(room.last_checkout)}</div>
                )}
                {room.last_cleaning && (
                  <div>🧹 ทำความสะอาดล่าสุด: {formatDate(room.last_cleaning)}</div>
                )}
                {room.notes && (
                  <div className="bg-yellow-50 p-2 rounded mt-2">
                    <div className="text-yellow-800">📝 หมายเหตุ: {room.notes}</div>
                  </div>
                )}
              </div>

              {/* Update Status Button */}
              <button
                onClick={() => handleStatusChange(room)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors"
              >
                🔄 เปลี่ยนสถานะ
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* No Rooms Message */}
      {rooms.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏠</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">ไม่พบข้อมูลห้องพัก</h3>
          <p className="text-gray-500">กรุณาเพิ่มข้อมูลห้องพักในระบบ</p>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6">
              <h2 className="text-xl font-bold">🔄 เปลี่ยนสถานะห้อง</h2>
              <p className="mt-1 text-blue-100">{selectedRoom.name}</p>
            </div>

            <form onSubmit={updateRoomStatus} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  สถานะห้อง *
                </label>
                <select
                  value={statusForm.status}
                  onChange={(e) => setStatusForm({...statusForm, status: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="available">✅ ว่าง - พร้อมให้บริการ</option>
                  <option value="occupied">👥 มีผู้พัก - ไม่ว่าง</option>
                  <option value="cleaning">🧹 ทำความสะอาด - ยังไม่พร้อม</option>
                  <option value="maintenance">🔧 ซ่อมแซม - ไม่พร้อมใช้งาน</option>
                  <option value="out_of_order">❌ ไม่พร้อมใช้ - มีปัญหา</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  หมายเหตุ
                </label>
                <textarea
                  value={statusForm.notes}
                  onChange={(e) => setStatusForm({...statusForm, notes: e.target.value})}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="หมายเหตุเพิ่มเติม..."
                />
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  disabled={loading}
                >
                  ❌ ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  {loading ? '⏳ กำลังอัปเดต...' : '✅ บันทึก'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
