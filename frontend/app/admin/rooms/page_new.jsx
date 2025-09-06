'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { roomsAPI } from '../../../lib/api';
import { isStaffOrAdmin } from '../../../lib/roles';
import Link from 'next/link';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  X, 
  Save,
  Upload,
  Hotel,
  Users,
  Bed,
  Square,
  MapPin,
  Wifi,
  Star,
  FileText,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  AlertCircle,
  DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function RoomsManagement() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add', 'edit', 'view'
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [stats, setStats] = useState({
    totalRooms: 0,
    availableRooms: 0,
    occupiedRooms: 0,
    maintenanceRooms: 0,
    avgPrice: 0,
    totalCapacity: 0
  });

  const [filters, setFilters] = useState({
    search: '',
    type: '',
    status: '',
    priceRange: ''
  });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    number: '',
    floor: '',
    capacity: '',
    price: '',
    description: '',
    amenities: [],
    status: 'available',
    size: '',
    bed_type: '',
    view_type: ''
  });

  const roomTypes = [
    { value: 'standard', label: 'ห้องมาตรฐาน' },
    { value: 'deluxe', label: 'ห้องดีลักซ์' },
    { value: 'suite', label: 'ห้องสวีท' },
    { value: 'family', label: 'ห้องครอบครัว' },
    { value: 'executive', label: 'ห้องเอกซ์เซกคิวทีฟ' }
  ];

  const roomStatuses = [
    { value: 'available', label: 'ว่าง', color: 'green' },
    { value: 'occupied', label: 'มีผู้เข้าพัก', color: 'red' },
    { value: 'maintenance', label: 'ซ่อมบำรุง', color: 'yellow' },
    { value: 'cleaning', label: 'ทำความสะอาด', color: 'blue' }
  ];

  const amenitiesOptions = [
    'WiFi ฟรี',
    'เครื่องปรับอากาศ',
    'โทรทัศน์',
    'ตู้เย็น',
    'ตู้นิรภัย',
    'เครื่องทำน้ำอุ่น',
    'ระเบียง',
    'วิวทะเล',
    'วิวเมือง',
    'อ่างอาบน้ำ',
    'ฝักบัว',
    'เครื่องใช้ในห้องน้ำ',
    'รูมเซอร์วิส',
    'ที่นั่งพักผ่อน'
  ];

  useEffect(() => {
    setIsVisible(true);
    if (isAuthenticated && user && isStaffOrAdmin(user.role)) {
      fetchRooms();
    }
  }, [isAuthenticated, user]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await roomsAPI.getAll();
      if (response.success) {
        setRooms(response.data);
        calculateStats(response.data);
      } else {
        toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลห้องพัก');
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลห้องพัก');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (roomsData) => {
    const totalRooms = roomsData.length;
    const availableRooms = roomsData.filter(room => room.status === 'available').length;
    const occupiedRooms = roomsData.filter(room => room.status === 'occupied').length;
    const maintenanceRooms = roomsData.filter(room => room.status === 'maintenance').length;
    const totalPrice = roomsData.reduce((sum, room) => sum + (room.price || 0), 0);
    const avgPrice = totalRooms > 0 ? Math.round(totalPrice / totalRooms) : 0;
    const totalCapacity = roomsData.reduce((sum, room) => sum + (room.capacity || 0), 0);

    setStats({
      totalRooms,
      availableRooms,
      occupiedRooms,
      maintenanceRooms,
      avgPrice,
      totalCapacity
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      type: '',
      status: '',
      priceRange: ''
    });
  };

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = !filters.search || 
      room.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      room.number?.toLowerCase().includes(filters.search.toLowerCase()) ||
      room.type?.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesType = !filters.type || room.type === filters.type;
    const matchesStatus = !filters.status || room.status === filters.status;
    
    let matchesPriceRange = true;
    if (filters.priceRange) {
      const price = room.price || 0;
      switch (filters.priceRange) {
        case 'low':
          matchesPriceRange = price < 2000;
          break;
        case 'medium':
          matchesPriceRange = price >= 2000 && price < 5000;
          break;
        case 'high':
          matchesPriceRange = price >= 5000;
          break;
      }
    }

    return matchesSearch && matchesType && matchesStatus && matchesPriceRange;
  });

  const openModal = (type, room = null) => {
    setModalType(type);
    setSelectedRoom(room);
    if (room) {
      setFormData({
        name: room.name || '',
        type: room.type || '',
        number: room.number || '',
        floor: room.floor || '',
        capacity: room.capacity || '',
        price: room.price || '',
        description: room.description || '',
        amenities: room.amenities || [],
        status: room.status || 'available',
        size: room.size || '',
        bed_type: room.bed_type || '',
        view_type: room.view_type || ''
      });
    } else {
      setFormData({
        name: '',
        type: '',
        number: '',
        floor: '',
        capacity: '',
        price: '',
        description: '',
        amenities: [],
        status: 'available',
        size: '',
        bed_type: '',
        view_type: ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRoom(null);
    setFormData({
      name: '',
      type: '',
      number: '',
      floor: '',
      capacity: '',
      price: '',
      description: '',
      amenities: [],
      status: 'available',
      size: '',
      bed_type: '',
      view_type: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAmenityToggle = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.type || !formData.number) {
      toast.error('กรุณากรอกข้อมูลที่จำเป็น');
      return;
    }

    try {
      setActionLoading(true);
      let response;

      if (modalType === 'add') {
        response = await roomsAPI.create(formData);
        if (response.success) {
          toast.success('เพิ่มห้องพักสำเร็จ');
          fetchRooms();
          closeModal();
        } else {
          toast.error(response.message || 'เกิดข้อผิดพลาดในการเพิ่มห้องพัก');
        }
      } else if (modalType === 'edit') {
        response = await roomsAPI.update(selectedRoom.id, formData);
        if (response.success) {
          toast.success('แก้ไขห้องพักสำเร็จ');
          fetchRooms();
          closeModal();
        } else {
          toast.error(response.message || 'เกิดข้อผิดพลาดในการแก้ไขห้องพัก');
        }
      }
    } catch (error) {
      console.error('Error saving room:', error);
      toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (roomId) => {
    if (!confirm('คุณต้องการลบห้องพักนี้หรือไม่?')) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await roomsAPI.delete(roomId);
      if (response.success) {
        toast.success('ลบห้องพักสำเร็จ');
        fetchRooms();
      } else {
        toast.error(response.message || 'เกิดข้อผิดพลาดในการลบห้องพัก');
      }
    } catch (error) {
      console.error('Error deleting room:', error);
      toast.error('เกิดข้อผิดพลาดในการลบห้องพัก');
    } finally {
      setActionLoading(false);
    }
  };

  const formatPrice = (amount) => {
    if (!amount) return '฿0';
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status) => {
    const statusObj = roomStatuses.find(s => s.value === status);
    return statusObj ? statusObj.color : 'gray';
  };

  const getStatusLabel = (status) => {
    const statusObj = roomStatuses.find(s => s.value === status);
    return statusObj ? statusObj.label : status;
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
            กรุณาเข้าสู่ระบบ
          </h1>
          <Link href="/login" className="btn-primary">
            เข้าสู่ระบบ
          </Link>
        </div>
      </div>
    );
  }

  if (!isStaffOrAdmin(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
            ไม่มีสิทธิ์เข้าถึง
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            คุณไม่มีสิทธิ์เข้าถึงหน้านี้
          </p>
          <Link href="/dashboard" className="btn-primary">
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className={`mb-8 transform transition-all duration-700 ease-out ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
                จัดการห้องพัก
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400">
                จัดการข้อมูลห้องพัก สถานะ และสิ่งอำนวยความสะดวก
              </p>
            </div>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <button
                onClick={fetchRooms}
                disabled={loading}
                className="btn-outline flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                รีเฟรช
              </button>
              <button
                onClick={() => openModal('add')}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                เพิ่มห้องพัก
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8 transform transition-all duration-700 delay-200 ease-out ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg border border-neutral-200 dark:border-neutral-700 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">ห้องพักทั้งหมด</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.totalRooms}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Hotel className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg border border-neutral-200 dark:border-neutral-700 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">ห้องว่าง</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.availableRooms}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg border border-neutral-200 dark:border-neutral-700 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">มีผู้เข้าพัก</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.occupiedRooms}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg border border-neutral-200 dark:border-neutral-700 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">ซ่อมบำรุง</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.maintenanceRooms}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg border border-neutral-200 dark:border-neutral-700 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">ราคาเฉลี่ย</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{formatPrice(stats.avgPrice)}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-lg border border-neutral-200 dark:border-neutral-700 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">ความจุรวม</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.totalCapacity}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className={`bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 p-6 mb-8 transform transition-all duration-700 delay-300 ease-out ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              ตัวกรองข้อมูล
            </h2>
            <button
              onClick={clearFilters}
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              ล้างตัวกรอง
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                ค้นหา
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="ชื่อห้อง, หมายเลข, ประเภท..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                ประเภทห้อง
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="input-field"
              >
                <option value="">ทุกประเภท</option>
                {roomTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                สถานะ
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="input-field"
              >
                <option value="">ทุกสถานะ</option>
                {roomStatuses.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                ช่วงราคา
              </label>
              <select
                value={filters.priceRange}
                onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                className="input-field"
              >
                <option value="">ทุกช่วงราคา</option>
                <option value="low">ต่ำกว่า ฿2,000</option>
                <option value="medium">฿2,000 - ฿5,000</option>
                <option value="high">สูงกว่า ฿5,000</option>
              </select>
            </div>
          </div>
        </div>

        {/* Rooms Grid */}
        <div className={`transform transition-all duration-700 delay-400 ease-out ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          {loading ? (
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
              <p className="text-neutral-600 dark:text-neutral-400">กำลังโหลดข้อมูลห้องพัก...</p>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 p-12 text-center">
              <Hotel className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                ไม่มีข้อมูลห้องพัก
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                ยังไม่มีห้องพักในระบบ หรือไม่มีข้อมูลที่ตรงกับการค้นหา
              </p>
              <button
                onClick={() => openModal('add')}
                className="btn-primary"
              >
                เพิ่มห้องพักแรก
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRooms.map((room, index) => (
                <div
                  key={room.id}
                  className={`bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
                >
                  {/* Room Image */}
                  <div className="h-48 bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-700 dark:to-neutral-800 flex items-center justify-center relative">
                    {room.image ? (
                      <img
                        src={room.image}
                        alt={room.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center">
                        <Bed className="h-16 w-16 text-neutral-400 mx-auto mb-2" />
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">ไม่มีรูปภาพ</p>
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="absolute top-4 left-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        getStatusColor(room.status) === 'green' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                        getStatusColor(room.status) === 'red' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                        getStatusColor(room.status) === 'yellow' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                      }`}>
                        {getStatusLabel(room.status)}
                      </span>
                    </div>

                    {/* Room Number */}
                    <div className="absolute top-4 right-4 bg-white dark:bg-neutral-800 rounded-lg px-3 py-1 shadow-lg">
                      <span className="text-sm font-bold text-neutral-900 dark:text-white">
                        {room.number || room.id}
                      </span>
                    </div>
                  </div>

                  {/* Room Details */}
                  <div className="p-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">
                        {room.name || `ห้อง ${room.number || room.id}`}
                      </h3>
                      <div className="flex items-center text-sm text-neutral-600 dark:text-neutral-400">
                        <MapPin className="h-4 w-4 mr-1" />
                        {roomTypes.find(t => t.value === room.type)?.label || room.type || 'ไม่ระบุประเภท'}
                      </div>
                    </div>

                    {/* Room Info */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center text-sm text-neutral-600 dark:text-neutral-400">
                        <Users className="h-4 w-4 mr-2" />
                        <span>{room.capacity || '-'} คน</span>
                      </div>
                      <div className="flex items-center text-sm text-neutral-600 dark:text-neutral-400">
                        <Square className="h-4 w-4 mr-2" />
                        <span>{room.size || '-'} ตร.ม.</span>
                      </div>
                    </div>

                    {/* Amenities */}
                    {room.amenities && room.amenities.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1">
                          {room.amenities.slice(0, 3).map((amenity, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300"
                            >
                              {amenity}
                            </span>
                          ))}
                          {room.amenities.length > 3 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400">
                              +{room.amenities.length - 3} อื่นๆ
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Price */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                          {formatPrice(room.price)}
                        </span>
                        <span className="text-sm text-neutral-500 dark:text-neutral-400 ml-1">
                          /คืน
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-700">
                      <button
                        onClick={() => openModal('view', room)}
                        className="btn-outline text-sm py-2 px-4 flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        ดูรายละเอียด
                      </button>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openModal('edit', room)}
                          className="btn-secondary text-sm py-2 px-4 flex items-center gap-1"
                        >
                          <Edit className="h-4 w-4" />
                          แก้ไข
                        </button>
                        <button
                          onClick={() => handleDelete(room.id)}
                          disabled={actionLoading}
                          className="bg-red-500 hover:bg-red-600 text-white text-sm py-2 px-4 rounded-lg flex items-center gap-1 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          ลบ
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                {modalType === 'add' ? 'เพิ่มห้องพัก' :
                 modalType === 'edit' ? 'แก้ไขห้องพัก' : 'ข้อมูลห้องพัก'}
              </h2>
              <button
                onClick={closeModal}
                className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {modalType === 'view' ? (
                // View Mode
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        ชื่อห้อง
                      </label>
                      <p className="text-neutral-900 dark:text-white">
                        {selectedRoom?.name || '-'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        หมายเลขห้อง
                      </label>
                      <p className="text-neutral-900 dark:text-white">
                        {selectedRoom?.number || '-'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        ประเภทห้อง
                      </label>
                      <p className="text-neutral-900 dark:text-white">
                        {roomTypes.find(t => t.value === selectedRoom?.type)?.label || selectedRoom?.type || '-'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        สถานะ
                      </label>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        getStatusColor(selectedRoom?.status) === 'green' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                        getStatusColor(selectedRoom?.status) === 'red' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                        getStatusColor(selectedRoom?.status) === 'yellow' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                      }`}>
                        {getStatusLabel(selectedRoom?.status)}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        ความจุ
                      </label>
                      <p className="text-neutral-900 dark:text-white">
                        {selectedRoom?.capacity || '-'} คน
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        ราคา
                      </label>
                      <p className="text-neutral-900 dark:text-white">
                        {formatPrice(selectedRoom?.price)}
                      </p>
                    </div>
                  </div>
                  
                  {selectedRoom?.description && (
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        คำอธิบาย
                      </label>
                      <p className="text-neutral-900 dark:text-white">
                        {selectedRoom.description}
                      </p>
                    </div>
                  )}

                  {selectedRoom?.amenities && selectedRoom.amenities.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        สิ่งอำนวยความสะดวก
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {selectedRoom.amenities.map((amenity, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Add/Edit Mode
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        ชื่อห้อง *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="input-field"
                        placeholder="ห้องดีลักซ์ วิวทะเล"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        หมายเลขห้อง *
                      </label>
                      <input
                        type="text"
                        name="number"
                        value={formData.number}
                        onChange={handleInputChange}
                        required
                        className="input-field"
                        placeholder="101"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        ประเภทห้อง *
                      </label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        required
                        className="input-field"
                      >
                        <option value="">เลือกประเภทห้อง</option>
                        {roomTypes.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        ชั้น
                      </label>
                      <input
                        type="number"
                        name="floor"
                        value={formData.floor}
                        onChange={handleInputChange}
                        className="input-field"
                        placeholder="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        ความจุ (คน)
                      </label>
                      <input
                        type="number"
                        name="capacity"
                        value={formData.capacity}
                        onChange={handleInputChange}
                        className="input-field"
                        placeholder="2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        ราคาต่อคืน (บาท)
                      </label>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        className="input-field"
                        placeholder="2500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        ขนาดห้อง (ตร.ม.)
                      </label>
                      <input
                        type="number"
                        name="size"
                        value={formData.size}
                        onChange={handleInputChange}
                        className="input-field"
                        placeholder="35"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        สถานะ
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="input-field"
                      >
                        {roomStatuses.map(status => (
                          <option key={status.value} value={status.value}>{status.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      คำอธิบาย
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className="input-field"
                      placeholder="อธิบายคุณสมบัติพิเศษของห้อง..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      สิ่งอำนวยความสะดวก
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {amenitiesOptions.map((amenity) => (
                        <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.amenities.includes(amenity)}
                            onChange={() => handleAmenityToggle(amenity)}
                            className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-sm text-neutral-700 dark:text-neutral-300">{amenity}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-center justify-end gap-4 pt-6 border-t border-neutral-200 dark:border-neutral-700">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="btn-outline"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="btn-primary flex items-center gap-2 disabled:opacity-50"
                    >
                      {actionLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          กำลังบันทึก...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          {modalType === 'add' ? 'เพิ่มห้องพัก' : 'บันทึกการแก้ไข'}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
