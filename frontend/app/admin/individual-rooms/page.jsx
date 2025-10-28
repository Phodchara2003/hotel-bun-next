'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { isStaffOrAdmin } from '../../../lib/permissions';
import { 
  Building, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  DollarSign,
  Hotel,
  ArrowLeft,
  RefreshCw,
  Filter,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function IndividualRoomsPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, getAuthToken } = useAuth();
  
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRoomType, setFilterRoomType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add' or 'edit'
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [formData, setFormData] = useState({
    room_number: '',
    floor: '',
    status: 'available',
    room_type_id: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Room status definitions
  const roomStatuses = [
    { value: 'available', label: 'ว่าง' },
    { value: 'occupied', label: 'มีผู้เข้าพัก' },
    { value: 'reserved', label: 'จองแล้ว' },
    { value: 'maintenance', label: 'ซ่อมบำรุง' },
    { value: 'cleaning', label: 'ทำความสะอาด' }
  ];

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isStaffOrAdmin(user))) {
      router.push('/login');
      return;
    }
    
    if (isAuthenticated && isStaffOrAdmin(user)) {
      fetchIndividualRooms();
    }
  }, [authLoading, isAuthenticated, user, router]);

  const fetchIndividualRooms = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) {
        toast.error('ไม่พบ token การยืนยันตัวตน');
        return;
      }

      console.log('🔄 Fetching individual rooms from API...');
      const response = await fetch('http://localhost:5680/api/admin/individual-rooms', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ API Response:', result);
        
        if (result.success && result.data) {
          // Transform API data to match frontend format
          const transformedRooms = result.data.map(room => ({
            id: room.id,
            room_number: room.room_number,
            floor: room.floor,
            bed_type: room.bed_type || 'N/A',
            status: room.status,
            capacity: room.max_guests || 1,
            price: room.price_per_night || 0,
            guest_name: room.guest_name || '',
            booking_id: room.booking_id || '',
            room_type_name: room.room_type_name || 'N/A',
            room_type_id: room.room_type_id || null, // เพิ่ม room_type_id
            check_in_date: room.check_in_date || null,
            check_out_date: room.check_out_date || null,
            booking_status: room.booking_status || null
          }));
          
          setRooms(transformedRooms);
          // ลบ toast.success เพื่อไม่ให้แจ้งเตือนซ้ำ
          console.log(`✅ Loaded ${transformedRooms.length} rooms successfully`);
        } else {
          console.warn('⚠️ API returned no data');
          setRooms([]);
          toast.info('ไม่พบข้อมูลห้องพัก');
        }
      } else {
        console.error('❌ API Error:', response.status, response.statusText);
        setRooms([]);
        toast.error(`เกิดข้อผิดพลาดในการเชื่อมต่อ API: ${response.status}`);
      }
    } catch (error) {
      console.error('💥 Network Error:', error);
      setRooms([]);
      toast.error('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setLoading(false);
    }
  };

  // Handle functions
  const handleAddRoom = () => {
    setModalType('add');
    setSelectedRoom(null);
    setFormData({
      room_number: '',
      floor: '',
      status: 'available',
      room_type_id: ''
    });
    setShowModal(true);
  };

  const handleEditRoom = (room) => {
    console.log('🔧 Edit Room Data:', room); // Debug log
    setModalType('edit');
    setSelectedRoom(room);
    setFormData({
      room_number: room.room_number || '',
      floor: room.floor || '',
      status: room.status || 'available',
      room_type_id: room.room_type_id || '' // ใช้ room_type_id จากข้อมูลห้อง
    });
    console.log('📝 Form Data Set:', {
      room_number: room.room_number || '',
      floor: room.floor || '',
      status: room.status || 'available',
      room_type_id: room.room_type_id || ''
    }); // Debug log
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.room_number || !formData.floor || !formData.room_type_id) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setSubmitting(true);

    try {
      const token = getAuthToken();
      const url = modalType === 'add' 
        ? 'http://localhost:5680/api/admin/individual-rooms'
        : `http://localhost:5680/api/admin/individual-rooms/${selectedRoom.id}`;
      
      const method = modalType === 'add' ? 'POST' : 'PUT';
      
      console.log('📤 Sending request:', {
        method,
        url,
        data: {
          ...formData,
          floor: parseInt(formData.floor),
          room_type_id: parseInt(formData.room_type_id),
          bed_type: parseInt(formData.room_type_id) === 8 ? 'single' : 'double', // แปลง room_type_id เป็น bed_type
          hotel_id: 1
        }
      });
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          floor: parseInt(formData.floor),
          room_type_id: parseInt(formData.room_type_id),
          bed_type: parseInt(formData.room_type_id) === 8 ? 'single' : 'double', // แปลง room_type_id เป็น bed_type
          hotel_id: 2 // Use existing hotel_id from database
        })
      });

      const result = await response.json();
      console.log('📥 Server response:', result);

      if (response.ok) {
        toast.success(modalType === 'add' ? 'เพิ่มห้องพักสำเร็จ' : 'แก้ไขห้องพักสำเร็จ');
        setShowModal(false);
        setFormData({
          room_number: '',
          floor: '',
          status: 'available',
          room_type_id: ''
        });
        fetchIndividualRooms(); // Refresh data
      } else {
        console.error('❌ Server error:', result);
        toast.error(result.message || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('💥 Network error:', error);
      toast.error('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRoom = async (room) => {
    if (!confirm(`คุณต้องการลบห้อง ${room.room_number} หรือไม่?`)) {
      return;
    }

    try {
      const token = getAuthToken();
      const response = await fetch(`http://localhost:5680/api/admin/individual-rooms/${room.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success(`ลบห้อง ${room.room_number} สำเร็จ`);
        fetchIndividualRooms(); // Refresh data
      } else {
        toast.error('ไม่สามารถลบห้องพักได้');
      }
    } catch (error) {
      console.error('Error deleting room:', error);
      toast.error('เกิดข้อผิดพลาดในการลบห้องพัก');
    }
  };

  // Get unique room types from rooms data
  const roomTypes = [
    { value: 'all', label: 'ทุกประเภท' },
    ...Array.from(new Set(rooms.map(room => room.room_type_name).filter(Boolean)))
      .map(type => ({ value: type, label: type }))
  ];

  // Get unique room statuses from actual data
  const availableStatuses = [
    { value: 'all', label: 'ทุกสถานะ' },
    ...Array.from(new Set(rooms.map(room => room.status).filter(Boolean)))
      .map(status => {
        const statusInfo = roomStatuses.find(s => s.value === status);
        return {
          value: status,
          label: statusInfo ? statusInfo.label : status
        };
      })
  ];

  // Filter rooms based on selected filters
  const filteredRooms = rooms.filter(room => {
    const roomTypeMatch = filterRoomType === 'all' || room.room_type_name === filterRoomType;
    const statusMatch = filterStatus === 'all' || room.status === filterStatus;
    
    // Debug logging
    if (filterStatus !== 'all') {
      console.log(`🔍 Filter Debug - Room ${room.room_number}: status="${room.status}", filterStatus="${filterStatus}", match=${statusMatch}`);
    }
    
    return roomTypeMatch && statusMatch;
  });

  const stats = {
    total: filteredRooms.length,
    available: filteredRooms.filter(r => r.status === 'available').length,
    occupied: filteredRooms.filter(r => r.status === 'occupied').length,
    reserved: filteredRooms.filter(r => r.status === 'reserved').length,
    maintenance: filteredRooms.filter(r => r.status === 'maintenance').length,
    cleaning: filteredRooms.filter(r => r.status === 'cleaning').length
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/admin/rooms" className="text-gray-600 hover:text-gray-800">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">จัดการห้องพัก</h1>
                <p className="text-gray-600">จัดการห้องพักย่อยทั้งหมดในระบบ</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchIndividualRooms}
                disabled={loading}
                className="bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'กำลังโหลด...' : 'รีเฟรช'}
              </button>
              <button 
                onClick={handleAddRoom}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                เพิ่มห้องพัก
              </button>
              <Link href="/admin/room-types" className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                <Building className="h-4 w-4" />
                ประเภทห้องพัก
              </Link>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-600" />
              <span className="text-lg font-semibold text-gray-900">กรองข้อมูล</span>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4">
              {/* Room Type Filter */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">ประเภทห้องพัก</label>
                <select
                  value={filterRoomType}
                  onChange={(e) => setFilterRoomType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[150px]"
                >
                  {roomTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">สถานะห้องพัก</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[150px]"
                >
                  {availableStatuses.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Filters Button */}
              <div className="flex flex-col justify-end">
                <button
                  onClick={() => {
                    setFilterRoomType('all');
                    setFilterStatus('all');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                >
                  ล้างตัวกรอง
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">ห้องทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Hotel className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">ห้องว่าง</p>
                <p className="text-2xl font-bold text-green-600">{stats.available}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Hotel className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">มีผู้เข้าพัก</p>
                <p className="text-2xl font-bold text-red-600">{stats.occupied}</p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">จองแล้ว</p>
                <p className="text-2xl font-bold text-orange-600">{stats.reserved}</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Hotel className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">ซ่อมบำรุง</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.maintenance}</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Hotel className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">ทำความสะอาด</p>
                <p className="text-2xl font-bold text-blue-600">{stats.cleaning}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Hotel className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Room Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredRooms.map(room => (
            <div key={room.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className={`bg-gradient-to-r ${
                room.status === 'available' ? 'from-green-500 to-green-600' :
                room.status === 'occupied' ? 'from-red-500 to-red-600' :
                room.status === 'reserved' ? 'from-orange-500 to-orange-600' :
                room.status === 'maintenance' ? 'from-yellow-500 to-yellow-600' :
                room.status === 'cleaning' ? 'from-blue-500 to-blue-600' :
                'from-gray-500 to-gray-600'
              } text-white p-4`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold">ห้อง {room.room_number}</h3>
                    <p className="text-sm opacity-90">ชั้น {room.floor}</p>
                  </div>
                  <div className="text-sm font-medium">
                    {roomStatuses.find(s => s.value === room.status)?.label}
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-3">
                {room.room_type_name && (
                  <div className="bg-blue-50 rounded-lg px-3 py-2">
                    <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">ประเภทห้องพัก</p>
                    <p className="text-sm font-semibold text-blue-900">{room.room_type_name}</p>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-gray-600">
                  <Hotel className="h-4 w-4" />
                  <span className="text-sm">{room.bed_type}</span>
                  <Users className="h-4 w-4 ml-2" />
                  <span className="text-sm">{room.capacity} คน</span>
                </div>

                <div className="flex items-center gap-2 text-gray-600">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm font-medium">{room.price?.toLocaleString()} บาท/คืน</span>
                </div>

                {room.guest_name && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-700">ผู้เข้าพัก</p>
                    <p className="text-sm text-gray-600">{room.guest_name}</p>
                    {room.booking_id && (
                      <p className="text-xs text-gray-500">จอง: {room.booking_id}</p>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={() => handleEditRoom(room)}
                    className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                  >
                    <Edit className="h-3 w-3" />
                    แก้ไข
                  </button>
                  <button 
                    onClick={() => handleDeleteRoom(room)}
                    className="bg-red-50 hover:bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredRooms.length === 0 && !loading && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Hotel className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {rooms.length === 0 ? 'ไม่พบห้องพัก' : 'ไม่พบห้องพักที่ตรงกับเงื่อนไข'}
            </h3>
            <p className="text-gray-600 mb-6">
              {rooms.length === 0 ? 'ไม่มีห้องพักในระบบ' : 'ลองปรับเปลี่ยนตัวกรองเพื่อดูห้องพักอื่น'}
            </p>
            {rooms.length > 0 && (
              <button
                onClick={() => {
                  setFilterRoomType('all');
                  setFilterStatus('all');
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                แสดงห้องพักทั้งหมด
              </button>
            )}
          </div>
        )}

      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {modalType === 'add' ? 'เพิ่มห้องพักใหม่' : `แก้ไขห้องพัก ${selectedRoom?.room_number}`}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* แสดงข้อมูลปัจจุบันสำหรับการแก้ไข */}
              {modalType === 'edit' && selectedRoom && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="text-sm font-semibold text-blue-800 mb-2">🔍 ข้อมูลปัจจุบัน</h3>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p><span className="font-medium">ประเภทเตียง:</span> {selectedRoom.bed_type === 'single' ? '🛏️ เตียงเดี่ยว' : selectedRoom.bed_type === 'double' ? '🛏️🛏️ เตียงคู่' : selectedRoom.bed_type}</p>
                    <p><span className="font-medium">ประเภทห้อง:</span> {selectedRoom.room_type_name}</p>
                    <p><span className="font-medium">สถานะ:</span> {roomStatuses.find(s => s.value === selectedRoom.status)?.label || selectedRoom.status}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    หมายเลขห้อง *
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="เช่น 101, 102"
                    value={formData.room_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, room_number: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ชั้น *
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="1"
                    value={formData.floor}
                    onChange={(e) => setFormData(prev => ({ ...prev, floor: e.target.value }))}
                    required
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ประเภทห้อง *
                  </label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.room_type_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, room_type_id: parseInt(e.target.value) }))}
                    required
                  >
                    <option value="">-- เลือกประเภทห้อง --</option>
                    <option value={8}>🛏️ ห้องเดี่ยว (Single Room) - เตียงเดี่ยว</option>
                    <option value={10}>🛏️🛏️ ห้องคู่ (Double Room) - เตียงคู่</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    สถานะ
                  </label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="available">ว่าง</option>
                    <option value="occupied">มีผู้เข้าพัก</option>
                    <option value="reserved">จองแล้ว</option>
                    <option value="maintenance">ซ่อมบำรุง</option>
                    <option value="cleaning">ทำความสะอาด</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    {submitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        กำลังบันทึก...
                      </>
                    ) : (
                      modalType === 'add' ? 'เพิ่ม' : 'บันทึก'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}