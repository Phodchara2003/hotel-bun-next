'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  Plus, Edit, Trash2, Search, Filter, RefreshCw, 
  CheckCircle, XCircle, AlertTriangle, Wrench,
  Bed, MapPin, Users, DollarSign, Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function IndividualRoomsManagement() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [floorFilter, setFloorFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add', 'edit'
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [formData, setFormData] = useState({
    room_number: '',
    floor: '',
    room_type_id: '',
    bed_type: 'single',
    status: 'available'
  });

  // Check if user is admin
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'admin')) {
      router.push('/');
      return;
    }
    if (isAuthenticated && user?.role === 'admin') {
      fetchRooms();
      fetchRoomTypes();
    }
  }, [isAuthenticated, user, authLoading, router]);

  const fetchRooms = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:3001/api/admin/individual-rooms');
      const data = await response.json();
      
      if (data.success) {
        setRooms(data.data);
        setFilteredRooms(data.data);
      } else {
        toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลห้องพัก');
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoomTypes = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/room-types');
      const data = await response.json();
      
      if (data.success) {
        setRoomTypes(data.data);
      }
    } catch (error) {
      console.error('Error fetching room types:', error);
    }
  };

  // Filter function
  useEffect(() => {
    let filtered = rooms;

    if (searchTerm) {
      filtered = filtered.filter(room => 
        room.room_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.room_type_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.guest_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(room => room.status === statusFilter);
    }

    if (floorFilter !== 'all') {
      filtered = filtered.filter(room => room.floor.toString() === floorFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(room => room.room_type_name === typeFilter);
    }

    setFilteredRooms(filtered);
  }, [rooms, searchTerm, statusFilter, floorFilter, typeFilter]);

  const handleAddRoom = () => {
    setModalType('add');
    setFormData({
      room_number: '',
      floor: '',
      room_type_id: '',
      bed_type: 'single',
      status: 'available'
    });
    setSelectedRoom(null);
    setShowModal(true);
  };

  const handleEditRoom = (room) => {
    setModalType('edit');
    setFormData({
      room_number: room.room_number,
      floor: room.floor,
      room_type_id: roomTypes.find(rt => rt.name === room.room_type_name)?.id || '',
      bed_type: room.bed_type,
      status: room.status
    });
    setSelectedRoom(room);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = modalType === 'add' 
        ? 'http://localhost:3001/api/admin/rooms'
        : `http://localhost:3001/api/admin/rooms/${selectedRoom.id}`;
      
      const method = modalType === 'add' ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          hotel_id: 2 // ใช้ hotel_id = 2 เป็นค่าเริ่มต้น
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(modalType === 'add' ? 'เพิ่มห้องพักสำเร็จ' : 'แก้ไขห้องพักสำเร็จ');
        setShowModal(false);
        fetchRooms();
      } else {
        toast.error(data.message || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error saving room:', error);
      toast.error('เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  const handleStatusChange = async (roomId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:3001/api/admin/individual-rooms/${roomId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('เปลี่ยนสถานะห้องพักสำเร็จ');
        fetchRooms();
      } else {
        toast.error(data.message || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error updating room status:', error);
      toast.error('เกิดข้อผิดพลาดในการเปลี่ยนสถานะ');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'occupied':
        return <Users className="w-4 h-4 text-blue-500" />;
      case 'maintenance':
        return <Wrench className="w-4 h-4 text-yellow-500" />;
      case 'reserved':
        return <Calendar className="w-4 h-4 text-purple-500" />;
      default:
        return <XCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'available': return 'ว่าง';
      case 'occupied': return 'มีผู้เข้าพัก';
      case 'maintenance': return 'ซ่อมบำรุง';
      case 'reserved': return 'จองแล้ว';
      default: return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'occupied': return 'bg-blue-100 text-blue-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'reserved': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get unique floors and room types for filters
  const uniqueFloors = [...new Set(rooms.map(room => room.floor))].sort((a, b) => a - b);
  const uniqueRoomTypes = [...new Set(rooms.map(room => room.room_type_name))].filter(Boolean);

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">จัดการห้องพักแต่ละห้อง</h1>
              <p className="text-gray-600">จัดการห้องพักในฐานข้อมูล rooms โดยตรง</p>
            </div>
            <div className="flex items-center space-x-3 mt-4 md:mt-0">
              <button
                onClick={fetchRooms}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                รีเฟรช
              </button>
              <button
                onClick={handleAddRoom}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                เพิ่มห้องใหม่
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ค้นหา</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="เลขห้อง, ประเภท, ผู้เข้าพัก..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">สถานะ</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">ทั้งหมด</option>
                <option value="available">ว่าง</option>
                <option value="occupied">มีผู้เข้าพัก</option>
                <option value="maintenance">ซ่อมบำรุง</option>
                <option value="reserved">จองแล้ว</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ชั้น</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={floorFilter}
                onChange={(e) => setFloorFilter(e.target.value)}
              >
                <option value="all">ทั้งหมด</option>
                {uniqueFloors.map(floor => (
                  <option key={floor} value={floor}>ชั้น {floor}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ประเภทห้อง</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">ทั้งหมด</option>
                {uniqueRoomTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <div className="bg-gray-100 rounded-lg px-3 py-2 text-sm text-gray-600">
                แสดง {filteredRooms.length} จาก {rooms.length} ห้อง
              </div>
            </div>
          </div>
        </div>

        {/* Rooms Table */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ห้อง
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ประเภท
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      สถานะ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ผู้เข้าพัก
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      การจอง
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      จัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRooms.map((room) => (
                    <tr key={room.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Bed className="w-5 h-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              ห้อง {room.room_number}
                            </div>
                            <div className="text-sm text-gray-500">
                              <MapPin className="w-3 h-3 inline mr-1" />
                              ชั้น {room.floor}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{room.room_type_name}</div>
                        <div className="text-sm text-gray-500">
                          {room.bed_type === 'single' ? 'เตียงเดี่ยว' : 'เตียงคู่'} •{' '}
                          <Users className="w-3 h-3 inline mr-1" />
                          {room.max_guests} คน
                        </div>
                        <div className="text-sm text-gray-500">
                          <DollarSign className="w-3 h-3 inline mr-1" />
                          {room.price_per_night?.toLocaleString()} บาท/คืน
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(room.status)}
                          <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(room.status)}`}>
                            {getStatusText(room.status)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {room.guest_name ? (
                          <div className="text-sm text-gray-900">{room.guest_name}</div>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {room.booking_id ? (
                          <div className="text-xs">
                            <div className="text-gray-900">#{room.booking_id}</div>
                            <div className="text-gray-500">
                              {room.check_in_date} - {room.check_out_date}
                            </div>
                            <div className={`inline-block px-2 py-1 rounded-full text-xs ${
                              room.booking_status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                              room.booking_status === 'checked_in' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {room.booking_status === 'confirmed' ? 'ยืนยันแล้ว' :
                               room.booking_status === 'checked_in' ? 'เช็คอินแล้ว' :
                               room.booking_status}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditRoom(room)}
                            className="text-blue-600 hover:text-blue-800"
                            title="แก้ไข"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          
                          {/* Status change dropdown */}
                          <select
                            value={room.status}
                            onChange={(e) => handleStatusChange(room.id, e.target.value)}
                            className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={room.status === 'occupied' && room.booking_id}
                          >
                            <option value="available">ว่าง</option>
                            <option value="maintenance">ซ่อมบำรุง</option>
                            <option value="reserved">จองแล้ว</option>
                            {room.booking_id && <option value="occupied">มีผู้เข้าพัก</option>}
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredRooms.length === 0 && (
                <div className="text-center py-12">
                  <Bed className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">ไม่มีข้อมูลห้องพักที่ตรงกับเงื่อนไข</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">
                {modalType === 'add' ? 'เพิ่มห้องใหม่' : 'แก้ไขห้อง'}
              </h2>
              
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      เลขห้อง
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={formData.room_number}
                      onChange={(e) => setFormData({...formData, room_number: e.target.value})}
                      placeholder="เช่น 101, 201"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ชั้น
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={formData.floor}
                      onChange={(e) => setFormData({...formData, floor: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ประเภทห้อง
                    </label>
                    <select
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={formData.room_type_id}
                      onChange={(e) => setFormData({...formData, room_type_id: e.target.value})}
                    >
                      <option value="">เลือกประเภทห้อง</option>
                      {roomTypes.map(type => (
                        <option key={type.id} value={type.id}>
                          {type.name} ({type.price_per_night?.toLocaleString()} บาท/คืน)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ประเภทเตียง
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={formData.bed_type}
                      onChange={(e) => setFormData({...formData, bed_type: e.target.value})}
                    >
                      <option value="single">เตียงเดี่ยว</option>
                      <option value="double">เตียงคู่</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      สถานะ
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                    >
                      <option value="available">ว่าง</option>
                      <option value="maintenance">ซ่อมบำรุง</option>
                      <option value="reserved">จองแล้ว</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {modalType === 'add' ? 'เพิ่มห้อง' : 'บันทึก'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}