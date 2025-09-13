'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { 
  Edit, 
  Plus, 
  Save, 
  X, 
  DollarSign, 
  Bed, 
  Users, 
  Maximize, 
  Star,
  Image as ImageIcon,
  Settings,
  AlertCircle,
  Trash2,
  Upload
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminRoomManagement() {
  const { user } = useAuth();
  const [roomTypes, setRoomTypes] = useState([]);
  const [globalSettings, setGlobalSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [editingRoom, setEditingRoom] = useState(null);
  const [editingPrice, setEditingPrice] = useState(false);
  const [newPrice, setNewPrice] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRoom, setNewRoom] = useState({
    name: '',
    description: '',
    max_guests: 2,
    size_sqm: 25,
    amenities: [],
    images: []
  });

  useEffect(() => {
    fetchRoomData();
  }, []);

  const fetchRoomData = async () => {
    try {
      setIsLoading(true);
      
      // ดึงข้อมูล room types
      const roomTypesRes = await fetch('http://localhost:3003/room-types', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (roomTypesRes.ok) {
        const roomTypesData = await roomTypesRes.json();
        setRoomTypes(roomTypesData);
      }

      // ดึงข้อมูล global settings
      const settingsRes = await fetch('http://localhost:3003/api/admin/global-settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        const settingsObj = {};
        settingsData.forEach(setting => {
          settingsObj[setting.setting_key] = setting.setting_value;
        });
        setGlobalSettings(settingsObj);
        setNewPrice(settingsObj.room_price_per_night || '1500');
      }

    } catch (error) {
      console.error('Error fetching room data:', error);
      toast.error('ไม่สามารถโหลดข้อมูลห้องพักได้');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditRoom = (room) => {
    setEditingRoom({ ...room });
  };

  const handleSaveRoom = async () => {
    try {
      const response = await fetch(`http://localhost:3003/api/admin/room-types/${editingRoom.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(editingRoom)
      });

      if (response.ok) {
        setRoomTypes(roomTypes.map(room => 
          room.id === editingRoom.id ? editingRoom : room
        ));
        setEditingRoom(null);
        toast.success('อัปเดตข้อมูลห้องพักเรียบร้อยแล้ว');
      } else {
        throw new Error('Failed to update room');
      }
    } catch (error) {
      console.error('Error updating room:', error);
      toast.error('ไม่สามารถอัปเดตข้อมูลห้องพักได้');
    }
  };

  const handleAddRoom = async () => {
    try {
      const response = await fetch('http://localhost:3003/api/admin/room-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          ...newRoom,
          hotel_id: 1, // Default hotel ID
          price_per_night: parseFloat(globalSettings.room_price_per_night || 1500)
        })
      });

      if (response.ok) {
        const addedRoom = await response.json();
        setRoomTypes([...roomTypes, addedRoom]);
        setNewRoom({
          name: '',
          description: '',
          max_guests: 2,
          size_sqm: 25,
          amenities: [],
          images: []
        });
        setShowAddForm(false);
        toast.success('เพิ่มห้องพักใหม่เรียบร้อยแล้ว');
      } else {
        throw new Error('Failed to add room');
      }
    } catch (error) {
      console.error('Error adding room:', error);
      toast.error('ไม่สามารถเพิ่มห้องพักได้');
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบห้องพักนี้?')) return;

    try {
      const response = await fetch(`http://localhost:3003/api/admin/room-types/${roomId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        setRoomTypes(roomTypes.filter(room => room.id !== roomId));
        toast.success('ลบห้องพักเรียบร้อยแล้ว');
      } else {
        throw new Error('Failed to delete room');
      }
    } catch (error) {
      console.error('Error deleting room:', error);
      toast.error('ไม่สามารถลบห้องพักได้');
    }
  };

  const handleUpdateGlobalPrice = async () => {
    try {
      const response = await fetch('http://localhost:3003/api/admin/global-settings/room_price_per_night', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ value: newPrice })
      });

      if (response.ok) {
        setGlobalSettings({
          ...globalSettings,
          room_price_per_night: newPrice
        });
        setEditingPrice(false);
        toast.success('อัปเดตราคาห้องพักเรียบร้อยแล้ว');
        
        // รีเฟรชข้อมูลห้องพัก
        fetchRoomData();
      } else {
        throw new Error('Failed to update price');
      }
    } catch (error) {
      console.error('Error updating price:', error);
      toast.error('ไม่สามารถอัปเดตราคาได้');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">จัดการห้องพัก</h1>
                <p className="text-gray-600 mt-1">แก้ไขรายละเอียดห้องพักและราคา</p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>เพิ่มห้องใหม่</span>
                </button>
                <div className="text-right">
                  <p className="text-sm text-gray-500">ราคาห้องพักปัจจุบัน</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatPrice(globalSettings.room_price_per_night || 1500)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Global Price Setting */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <h2 className="text-lg font-semibold text-gray-900">ตั้งค่าราคาห้องพัก</h2>
              </div>
              <button
                onClick={() => setEditingPrice(!editingPrice)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span>{editingPrice ? 'ยกเลิก' : 'แก้ไขราคา'}</span>
              </button>
            </div>

            {editingPrice ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <p className="text-yellow-800 font-medium">แก้ไขราคาห้องพักทั้งหมด</p>
                </div>
                <p className="text-yellow-700 text-sm mb-4">
                  การเปลี่ยนแปลงนี้จะมีผลกับห้องพักทุกประเภท
                </p>
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <input
                      type="number"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="ราคาใหม่"
                      min="0"
                      step="100"
                    />
                  </div>
                  <button
                    onClick={handleUpdateGlobalPrice}
                    className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    <span>บันทึก</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <p className="text-gray-600">
                  ราคาห้องพักเดียวกันสำหรับทุกประเภทห้อง: <span className="font-semibold">{formatPrice(globalSettings.room_price_per_night || 1500)}</span>
                </p>
              </div>
            )}
          </div>

          {/* Add New Room Form */}
          {showAddForm && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <Plus className="h-5 w-5 text-green-600" />
                  <h2 className="text-lg font-semibold text-gray-900">เพิ่มห้องพักใหม่</h2>
                </div>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อห้อง *</label>
                  <input
                    type="text"
                    value={newRoom.name}
                    onChange={(e) => setNewRoom({...newRoom, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="เช่น ห้องสแตนดาร์ด A1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">จำนวนผู้เข้าพักสูงสุด</label>
                  <input
                    type="number"
                    value={newRoom.max_guests}
                    onChange={(e) => setNewRoom({...newRoom, max_guests: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    min="1"
                    max="10"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">คำอธิบาย</label>
                  <textarea
                    value={newRoom.description}
                    onChange={(e) => setNewRoom({...newRoom, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="อธิบายห้องพักและสิ่งอำนวยความสะดวก"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ขนาดห้อง (ตร.ม.)</label>
                  <input
                    type="number"
                    value={newRoom.size_sqm}
                    onChange={(e) => setNewRoom({...newRoom, size_sqm: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    min="10"
                    max="200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ราคาต่อคืน</label>
                  <input
                    type="number"
                    value={globalSettings.room_price_per_night || 1500}
                    disabled
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600"
                  />
                  <p className="text-xs text-gray-500 mt-1">ราคาเดียวกันสำหรับทุกห้อง</p>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleAddRoom}
                  disabled={!newRoom.name.trim()}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  เพิ่มห้องพัก
                </button>
              </div>
            </div>
          )}

          {/* Room Types List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {roomTypes.map((room) => (
              <div key={room.id} className="bg-white rounded-lg shadow-sm p-6">
                {editingRoom && editingRoom.id === room.id ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">แก้ไขห้อง</h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={handleSaveRoom}
                          className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <Save className="h-4 w-4" />
                          <span>บันทึก</span>
                        </button>
                        <button
                          onClick={() => setEditingRoom(null)}
                          className="flex items-center space-x-1 px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                        >
                          <X className="h-4 w-4" />
                          <span>ยกเลิก</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อห้อง</label>
                      <input
                        type="text"
                        value={editingRoom.name}
                        onChange={(e) => setEditingRoom({...editingRoom, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">คำอธิบาย</label>
                      <textarea
                        value={editingRoom.description}
                        onChange={(e) => setEditingRoom({...editingRoom, description: e.target.value})}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">จำนวนผู้เข้าพักสูงสุด</label>
                        <input
                          type="number"
                          value={editingRoom.max_guests}
                          onChange={(e) => setEditingRoom({...editingRoom, max_guests: parseInt(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ขนาดห้อง (ตร.ม.)</label>
                        <input
                          type="number"
                          value={editingRoom.size_sqm}
                          onChange={(e) => setEditingRoom({...editingRoom, size_sqm: parseInt(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="1"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">สิ่งอำนวยความสะดวก</label>
                      <input
                        type="text"
                        value={editingRoom.amenities ? editingRoom.amenities.join(', ') : ''}
                        onChange={(e) => setEditingRoom({...editingRoom, amenities: e.target.value.split(', ').filter(item => item.trim())})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="แยกด้วยจุลภาค เช่น WiFi, แอร์, ทีวี"
                      />
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-gray-900">{room.name}</h3>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditRoom(room)}
                          className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                          <span>แก้ไข</span>
                        </button>
                        <button
                          onClick={() => handleDeleteRoom(room.id)}
                          className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>ลบ</span>
                        </button>
                      </div>
                    </div>

                    <p className="text-gray-600 mb-4">{room.description}</p>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        <span className="text-sm text-gray-600">{room.max_guests} ท่าน</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Maximize className="h-5 w-5 text-green-600" />
                        <span className="text-sm text-gray-600">{room.size_sqm} ตร.ม.</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-5 w-5 text-purple-600" />
                        <span className="text-sm font-semibold text-gray-900">
                          {formatPrice(globalSettings.room_price_per_night || 1500)}
                        </span>
                      </div>
                    </div>

                    {room.amenities && room.amenities.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">สิ่งอำนวยความสะดวก</h4>
                        <div className="flex flex-wrap gap-2">
                          {room.amenities.map((amenity, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                            >
                              {amenity}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>ประเภท: {room.type}</span>
                        <span>•</span>
                        <span>ID: {room.id}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {roomTypes.length === 0 && (
            <div className="text-center py-12">
              <Bed className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">ไม่พบข้อมูลห้องพัก</p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}