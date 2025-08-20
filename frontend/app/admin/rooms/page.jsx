'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { roomsAPI } from '../../../lib/api';
import { isStaffOrAdmin, canEdit, canDelete, canCreate, isReadOnly } from '../../../lib/roles';
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
  Filter
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function RoomsManagement() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add', 'edit', 'view'
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    available: ''
  });
  const [filteredRooms, setFilteredRooms] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: '', // เพิ่มฟิลด์ประเภทห้องพัก
    capacity: '',
    price: '',
    description: '',
    amenities: [],
    images: [], // เปลี่ยนจาก image เป็น images array
    available: true,
    size_sqm: ''
  });

  // Image upload state - รองรับหลายรูป
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Available amenities
  const availableAmenities = [
    { id: 'wifi', name: 'Wi-Fi ฟรี', icon: Wifi },
    { id: 'parking', name: 'ที่จอดรถ', icon: MapPin },
    { id: 'breakfast', name: 'อาหารเช้า', icon: Star },
    { id: 'tv', name: 'โทรทัศน์', icon: Eye },
    { id: 'aircon', name: 'เครื่องปรับอากาศ', icon: Square },
    { id: 'minibar', name: 'มินิบาร์', icon: Star }
  ];

  // Room types
  const roomTypes = [
    'Standard Room',
    'Deluxe Room',
    'Junior Suite',
    'Executive Suite',
    'Presidential Suite',
    'Family Room'
  ];

  useEffect(() => {
    // Wait for auth to be loaded
    if (authLoading) {
      console.log('Auth loading...');
      return;
    }

    if (isAuthenticated && isStaffOrAdmin(user)) {
      console.log('User authenticated as admin/staff, fetching rooms...');
      fetchRooms();
    } else if (isAuthenticated && !isStaffOrAdmin(user)) {
      console.log('User authenticated but not admin/staff:', user);
      toast.error('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
    } else if (!isAuthenticated) {
      console.log('User not authenticated');
      toast.error('กรุณาเข้าสู่ระบบก่อน');
    }
  }, [isAuthenticated, user, authLoading]);

  useEffect(() => {
    // Filter rooms based on filters
    let filtered = rooms;
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(room => 
        room.name.toLowerCase().includes(searchLower) ||
        room.type.toLowerCase().includes(searchLower) ||
        room.description.toLowerCase().includes(searchLower)
      );
    }
    
    if (filters.type) {
      filtered = filtered.filter(room => room.type === filters.type);
    }
    
    if (filters.available !== '') {
      filtered = filtered.filter(room => room.available === (filters.available === 'true'));
    }
    
    setFilteredRooms(filtered);
  }, [rooms, filters]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      console.log('Fetching rooms...');
      const data = await roomsAPI.getAllRooms();
      console.log('Rooms fetched successfully:', data);
      setRooms(data.rooms || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      console.error('Error response:', error.response);
      
      // Check if it's a 401 error
      if (error.response?.status === 401) {
        toast.error('ไม่มีสิทธิ์เข้าถึง กรุณาเข้าสู่ระบบใหม่');
      } else {
        toast.error('ไม่สามารถโหลดข้อมูลห้องพักได้');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (type, room = null) => {
    setModalType(type);
    setSelectedRoom(room);
    
    if (type === 'add') {
      setFormData({
        name: '',
        type: '', // เพิ่มฟิลด์ประเภทห้องพัก
        capacity: '',
        price: '',
        description: '',
        amenities: [],
        images: [],
        available: true,
        size_sqm: ''
      });
      // Reset image states
      setImageFiles([]);
      setImagePreviews([]);
    } else if (type === 'edit' && room) {
      setFormData({
        name: room.name,
        type: room.type || '', // เพิ่มฟิลด์ประเภทห้องพัก
        capacity: room.capacity.toString(),
        price: room.price.toString(),
        description: room.description,
        amenities: room.amenities || [],
        images: room.images || [],
        available: room.available,
        size_sqm: room.size_sqm ? room.size_sqm.toString() : ''
      });
      // Set existing images as preview
      setImageFiles([]);
      setImagePreviews(room.images || []);
    }
    
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedRoom(null);
    setFormData({
      name: '',
      type: '',
      capacity: '',
      price: '',
      description: '',
      amenities: [],
      images: [],
      available: true,
      size_sqm: ''
    });
    // Reset image states
    setImageFiles([]);
    setImagePreviews([]);
    setUploading(false);
  };

  // Handle multiple image files selection
  const handleImageFilesChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate files
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error('กรุณาเลือกไฟล์รูปภาพ');
        return false;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('ขนาดไฟล์ใหญ่เกินไป (สูงสุด 5MB)');
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) return;

    // Check total images limit
    const totalImages = imagePreviews.length + validFiles.length;
    if (totalImages > 10) {
      toast.error('สามารถอัปโหลดได้สูงสุด 10 รูป');
      return;
    }

    setImageFiles(prev => [...prev, ...validFiles]);

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Convert image to base64 (for simple storage)
  const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Remove selected image by index
  const handleRemoveImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    
    // Update form data
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAmenityChange = (amenityId) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter(id => id !== amenityId)
        : [...prev.amenities, amenityId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.type || !formData.capacity || !formData.price) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    try {
      setUploading(true);
      
      // Handle multiple images upload
      let imageUrls = formData.images || [];
      if (imageFiles.length > 0) {
        // Convert all images to base64 for storage (in real app, upload to cloud storage)
        const imagePromises = imageFiles.map(file => convertImageToBase64(file));
        imageUrls = await Promise.all(imagePromises);
      }

      const roomData = {
        name: formData.name,
        type: formData.type, // เพิ่มฟิลด์ประเภทห้องพัก
        capacity: parseInt(formData.capacity),
        price: parseFloat(formData.price),
        description: formData.description,
        amenities: formData.amenities,
        images: imageUrls, // Changed from image to images array
        available: formData.available,
        size_sqm: formData.size_sqm ? parseInt(formData.size_sqm) : null
      };

      console.log('🏨 Sending room data to API:', JSON.stringify(roomData, null, 2));
      console.log('🏨 Form data before processing:', JSON.stringify(formData, null, 2));

      // Validate data before sending
      if (!roomData.name || !roomData.type || !roomData.capacity || !roomData.price) {
        toast.error('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
        return;
      }

      if (isNaN(roomData.capacity) || roomData.capacity < 1) {
        toast.error('จำนวนผู้พักต้องเป็นตัวเลขและมากกว่า 0');
        return;
      }

      if (isNaN(roomData.price) || roomData.price <= 0) {
        toast.error('ราคาต้องเป็นตัวเลขและมากกว่า 0');
        return;
      }

      if (modalType === 'add') {
        await roomsAPI.createRoom(roomData);
        toast.success('เพิ่มห้องพักสำเร็จ');
      } else {
        await roomsAPI.updateRoom(selectedRoom.id, roomData);
        toast.success('แก้ไขห้องพักสำเร็จ');
      }

      handleCloseModal();
      fetchRooms();
    } catch (error) {
      console.error('❌ Error saving room:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      
      let errorMessage = 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
      
      if (error.response?.status === 422) {
        // Validation error
        const details = error.response.data?.details;
        if (details && Array.isArray(details)) {
          errorMessage = `ข้อมูลไม่ถูกต้อง: ${details.join(', ')}`;
        } else {
          errorMessage = error.response.data?.error || 'ข้อมูลไม่ถูกต้อง';
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (roomId) => {
    if (!confirm('คุณแน่ใจว่าต้องการลบห้องพักนี้?')) {
      return;
    }

    try {
      await roomsAPI.deleteRoom(roomId);
      toast.success('ลบห้องพักสำเร็จ');
      fetchRooms();
    } catch (error) {
      console.error('Error deleting room:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบข้อมูล');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      type: '',
      available: ''
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">กรุณาเข้าสู่ระบบ</h2>
          <p className="text-gray-600">เพื่อเข้าถึงระบบจัดการ</p>
        </div>
      </div>
    );
  }

  if (!isStaffOrAdmin(user)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">ไม่มีสิทธิ์เข้าถึง</h2>
          <p className="text-gray-600">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dark-bg py-8">
      <div className="max-w-7xl mx-auto container-padding">
        {/* Header */}
        <div className="mb-12 animate-slideUp">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold dark-text mb-3 tracking-tight">จัดการห้องพัก</h1>
              <p className="text-lg dark-text-secondary">
                {isReadOnly(user) ? 'ดูข้อมูลห้องพักของโรงแรม' : 'เพิ่ม แก้ไข และจัดการห้องพักของโรงแรม'}
              </p>
            </div>
            {canCreate(user) && (
              <button
                onClick={() => handleOpenModal('add')}
                className="btn-primary flex items-center space-x-2 shadow-lg hover-lift"
              >
                <Plus className="h-5 w-5" />
                <span>เพิ่มห้องพัก</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="card-elevated p-8 mb-8 animate-slideUp">
          <h2 className="text-xl font-semibold dark-text mb-6 flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center mr-3">
              <Filter className="h-4 w-4 text-white" />
            </div>
            ค้นหาและกรองข้อมูล
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium dark-text-secondary mb-2">
                ค้นหา
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="ชื่อห้อง, ประเภท, รายละเอียด..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10 input-field"
                />
              </div>
            </div>
            
            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium dark-text-secondary mb-2">
                ประเภทห้อง
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="input-field"
              >
                <option value="">ทั้งหมด</option>
                {roomTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            {/* Available Filter */}
            <div>
              <label className="block text-sm font-medium dark-text-secondary mb-2">
                สถานะ
              </label>
              <select
                value={filters.available}
                onChange={(e) => handleFilterChange('available', e.target.value)}
                className="input-field"
              >
                <option value="">ทั้งหมด</option>
                <option value="true">พร้อมใช้งาน</option>
                <option value="false">ไม่พร้อมใช้งาน</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex justify-between items-center">
            <span className="text-sm text-gray-600">
              แสดงผล {filteredRooms.length} จาก {rooms.length} ห้อง
            </span>
            <button
              onClick={clearFilters}
              className="btn-secondary text-sm"
            >
              ล้างตัวกรอง
            </button>
          </div>
        </div>

        {/* Rooms Grid */}
        <div className="animate-slideUp stagger-2">
          {loading ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="dark-text-secondary">กำลังโหลดข้อมูล...</p>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="text-center py-16">
              <Hotel className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold dark-text-secondary mb-2">ไม่พบข้อมูลห้องพัก</h3>
              <p className="dark-text-muted mb-6">
                {filters.search || filters.type || filters.available 
                  ? 'ลองปรับเปลี่ยนเงื่อนไขการค้นหา' 
                  : 'เริ่มต้นด้วยการเพิ่มห้องพักแรก'
                }
              </p>
              {canCreate(user) && (
                <button
                  onClick={() => handleOpenModal('add')}
                  className="btn-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  เพิ่มห้องพัก
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredRooms.map((room, index) => (
                <div 
                  key={room.id} 
                  className={`card-elevated group hover-lift transition-all duration-300 animate-slideUp`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Room Image */}
                  <div className="relative h-48 overflow-hidden rounded-t-2xl">
                    {room.image ? (
                      <img
                        src={room.image}
                        alt={room.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                        <Hotel className="h-12 w-12 text-neutral-400" />
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="absolute top-4 right-4">
                      <span className={`px-3 py-1.5 text-xs font-medium rounded-full ${
                        room.available 
                          ? 'status-success'
                          : 'status-error'
                      }`}>
                        {room.available ? 'พร้อมใช้งาน' : 'ไม่พร้อมใช้งาน'}
                      </span>
                    </div>
                  </div>

                  {/* Room Details */}
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-semibold dark-text group-hover:text-primary-600 transition-colors">
                        {room.name}
                      </h3>
                      <span className="text-xl font-bold text-primary-600">
                        ฿{room.price?.toLocaleString()}
                      </span>
                    </div>
                    
                    <p className="text-sm dark-text-secondary mb-3 font-medium">{room.type}</p>
                    
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="flex items-center text-sm dark-text-muted">
                        <Users className="h-4 w-4 mr-1" />
                        <span>{room.capacity} คน</span>
                      </div>
                      <div className="flex items-center text-sm dark-text-muted">
                        <Bed className="h-4 w-4 mr-1" />
                        <span>{room.beds || 1} เตียง</span>
                      </div>
                      {room.size_sqm && (
                        <div className="flex items-center text-sm dark-text-muted">
                          <Square className="h-4 w-4 mr-1" />
                          <span>{room.size_sqm} ตรม.</span>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-sm dark-text-secondary mb-4 line-clamp-2 leading-relaxed">
                      {room.description}
                    </p>

                    {/* Amenities */}
                    {room.amenities && room.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-6">
                        {room.amenities.slice(0, 3).map(amenityId => {
                          const amenity = availableAmenities.find(a => a.id === amenityId);
                          return amenity ? (
                            <span key={amenityId} className="status-info text-xs px-2 py-1 rounded-lg">
                              {amenity.name}
                            </span>
                          ) : null;
                        })}
                        {room.amenities.length > 3 && (
                          <span className="text-xs dark-text-muted px-2 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                            +{room.amenities.length - 3} อื่นๆ
                          </span>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-between items-center pt-4 border-t dark-border">
                      <button
                        onClick={() => handleOpenModal('view', room)}
                        className="btn-ghost text-sm flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        ดูรายละเอียด
                      </button>
                      
                      <div className="flex space-x-2">
                        {canEdit(user) && (
                          <button
                            onClick={() => handleOpenModal('edit', room)}
                            className="p-2 text-warning-600 hover:bg-warning-50 rounded-lg transition-colors"
                            title="แก้ไข"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        {canDelete(user) && (
                          <button
                            onClick={() => handleDelete(room.id)}
                            className="p-2 text-error-600 hover:bg-error-50 rounded-lg transition-colors"
                            title="ลบ"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Empty State */}
        {!loading && filteredRooms.length === 0 && (
          <div className="text-center py-12">
            <Hotel className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่พบห้องพัก</h3>
            <p className="text-gray-600 mb-4">
              {rooms.length === 0 ? 'ยังไม่มีห้องพักในระบบ' : 'ไม่พบห้องพักที่ตรงกับเงื่อนไขการค้นหา'}
            </p>
            {rooms.length === 0 && canCreate(user) && (
              <button
                onClick={() => handleOpenModal('add')}
                className="btn-primary"
              >
                เพิ่มห้องพักแรก
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="card-elevated max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-scaleInBounce">
            <div className="p-8">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-bold dark-text">
                    {modalType === 'add' && 'เพิ่มห้องพัก'}
                    {modalType === 'edit' && 'แก้ไขห้องพัก'}
                    {modalType === 'view' && 'รายละเอียดห้องพัก'}
                  </h2>
                  <p className="text-sm dark-text-muted mt-1">
                    {modalType === 'add' && 'กรอกข้อมูลห้องพักใหม่'}
                    {modalType === 'edit' && 'แก้ไขข้อมูลห้องพัก'}
                    {modalType === 'view' && 'ดูข้อมูลห้องพักโดยละเอียด'}
                  </p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {modalType === 'view' && selectedRoom ? (
                /* View Mode */
                <div className="space-y-8">
                  {/* Room Image */}
                  {selectedRoom.image && (
                    <div className="w-full h-64 bg-neutral-100 dark:bg-neutral-800 rounded-2xl overflow-hidden">
                      <img
                        src={selectedRoom.image}
                        alt={selectedRoom.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="card p-6">
                      <h3 className="text-lg font-semibold dark-text mb-4 flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center mr-3">
                          <Hotel className="h-4 w-4 text-white" />
                        </div>
                        ข้อมูลพื้นฐาน
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm font-medium dark-text-muted">ชื่อห้อง</span>
                          <p className="dark-text font-medium">{selectedRoom.name}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium dark-text-muted">ประเภท</span>
                          <p className="dark-text font-medium">{selectedRoom.type}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium dark-text-muted">ความจุ</span>
                          <p className="dark-text font-medium">{selectedRoom.capacity} คน</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium dark-text-muted">ราคา</span>
                          <p className="text-xl font-bold text-primary-600">฿{selectedRoom.price?.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium dark-text-muted">สถานะ</span>
                          <div className="mt-1">
                            <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${
                              selectedRoom.available 
                                ? 'status-success'
                                : 'status-error'
                            }`}>
                              {selectedRoom.available ? 'พร้อมใช้งาน' : 'ไม่พร้อมใช้งาน'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="card p-6">
                      <h3 className="text-lg font-semibold dark-text mb-4 flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-accent-600 rounded-lg flex items-center justify-center mr-3">
                          <Star className="h-4 w-4 text-white" />
                        </div>
                        สิ่งอำนวยความสะดวก
                      </h3>
                      <div className="space-y-3">
                        {selectedRoom.amenities?.length > 0 ? selectedRoom.amenities.map(amenityId => {
                          const amenity = availableAmenities.find(a => a.id === amenityId);
                          return amenity ? (
                            <div key={amenityId} className="flex items-center">
                              <div className="w-6 h-6 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
                                <amenity.icon className="h-4 w-4 text-primary-600" />
                              </div>
                              <span className="dark-text">{amenity.name}</span>
                            </div>
                          ) : null;
                        }) : (
                          <p className="dark-text-muted">ไม่มีข้อมูลสิ่งอำนวยความสะดวก</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {selectedRoom.description && (
                    <div className="card p-6">
                      <h3 className="text-lg font-semibold dark-text mb-4 flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-lg flex items-center justify-center mr-3">
                          <FileText className="h-4 w-4 text-white" />
                        </div>
                        รายละเอียด
                      </h3>
                      <p className="dark-text-secondary leading-relaxed">{selectedRoom.description}</p>
                    </div>
                  )}
                </div>
              ) : (
                /* Add/Edit Form */
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Basic Information Section */}
                  <div className="card p-6">
                    <h3 className="text-lg font-semibold dark-text mb-6 flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center mr-3">
                        <Hotel className="h-4 w-4 text-white" />
                      </div>
                      ข้อมูลพื้นฐาน
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium dark-text-secondary mb-2">
                          ชื่อห้อง <span className="text-error-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="input-field"
                          placeholder="เช่น Standard Room 101"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium dark-text-secondary mb-2">
                          ประเภทห้องพัก <span className="text-error-500">*</span>
                        </label>
                        <select
                          name="type"
                          value={formData.type}
                          onChange={handleInputChange}
                          className="input-field"
                          required
                        >
                          <option value="">-- เลือกประเภทห้องพัก --</option>
                          {roomTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium dark-text-secondary mb-2">
                          ความจุ (คน) <span className="text-error-500">*</span>
                        </label>
                        <input
                          type="number"
                          name="capacity"
                          value={formData.capacity}
                          onChange={handleInputChange}
                          className="input-field"
                          min="1"
                          max="20"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium dark-text-secondary mb-2">
                          ราคาต่อคืน (บาท) <span className="text-error-500">*</span>
                        </label>
                        <input
                          type="number"
                          name="price"
                          value={formData.price}
                          onChange={handleInputChange}
                          className="input-field"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium dark-text-secondary mb-2">
                          ขนาดห้อง (ตารางเมตร)
                        </label>
                        <input
                          type="number"
                          name="size_sqm"
                          value={formData.size_sqm}
                          onChange={handleInputChange}
                          className="input-field"
                          min="1"
                          placeholder="เช่น 25"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium dark-text-secondary mb-2">
                          สถานะ
                        </label>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="available"
                            checked={formData.available}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                          />
                          <label className="ml-2 text-sm dark-text">
                            พร้อมใช้งาน
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description Section */}
                  <div className="card p-6">
                    <h3 className="text-lg font-semibold dark-text mb-6 flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-lg flex items-center justify-center mr-3">
                        <FileText className="h-4 w-4 text-white" />
                      </div>
                      รายละเอียด
                    </h3>
                    
                    <div>
                      <label className="block text-sm font-medium dark-text-secondary mb-2">
                        คำอธิบายห้องพัก
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={4}
                        className="input-field"
                        placeholder="อธิบายเกี่ยวกับห้องพัก เช่น ทิวทัศน์ สิ่งอำนวยความสะดวกพิเศษ..."
                      />
                    </div>
                  </div>

                  {/* Image Upload Section */}
                  <div className="card p-6">
                    <h3 className="text-lg font-semibold dark-text mb-6 flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-accent-600 rounded-lg flex items-center justify-center mr-3">
                        <Upload className="h-4 w-4 text-white" />
                      </div>
                      รูปภาพห้องพัก
                    </h3>
                    
                    <div className="space-y-4">
                      {/* File Upload Option */}
                      <div className="flex items-center space-x-4">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageFilesChange}
                          className="hidden"
                          id="images-upload"
                        />
                        <label
                          htmlFor="images-upload"
                          className={`cursor-pointer flex items-center space-x-3 px-6 py-3 border-2 border-dashed border-neutral-300 rounded-xl hover:border-primary-400 hover:bg-primary-50 transition-all duration-200 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <Upload className="h-5 w-5 text-neutral-400" />
                          <div>
                            <div className="text-sm font-medium dark-text">
                              {uploading ? 'กำลังอัปโหลด...' : imageFiles.length > 0 ? `เลือกแล้ว ${imageFiles.length} รูป` : 'เลือกไฟล์รูปภาพ'}
                            </div>
                            <div className="text-xs dark-text-muted">สูงสุด 10 รูป, ขนาดไม่เกิน 5MB ต่อรูป</div>
                          </div>
                        </label>
                        
                        {imageFiles.length > 0 && !uploading && (
                          <button
                            type="button"
                            onClick={() => {
                              setImageFiles([]);
                              setImagePreviews([]);
                              setFormData(prev => ({ ...prev, images: [] }));
                            }}
                            className="btn-error"
                          >
                            ลบรูปทั้งหมด
                          </button>
                        )}
                      </div>

                      {/* Image Previews */}
                      {imagePreviews.length > 0 && (
                        <div>
                          <div className="text-sm font-medium dark-text-secondary mb-3">ตัวอย่างรูปภาพ:</div>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {imagePreviews.map((preview, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={preview}
                                  alt={`Preview ${index + 1}`}
                                  className="w-full h-32 object-cover rounded-xl shadow-md border border-neutral-200 group-hover:shadow-lg transition-shadow"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveImage(index)}
                                  className="absolute top-2 right-2 bg-error-600 text-white rounded-full p-1.5 hover:bg-error-700 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                                <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg">
                                  {index + 1}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Amenities Section */}
                  <div className="card p-6">
                    <h3 className="text-lg font-semibold dark-text mb-6 flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-br from-success-500 to-success-600 rounded-lg flex items-center justify-center mr-3">
                        <Star className="h-4 w-4 text-white" />
                      </div>
                      สิ่งอำนวยความสะดวก
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {availableAmenities.map(amenity => (
                        <label key={amenity.id} className="flex items-center space-x-3 p-3 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 cursor-pointer transition-all">
                          <input
                            type="checkbox"
                            checked={formData.amenities.includes(amenity.id)}
                            onChange={() => handleAmenityChange(amenity.id)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                          />
                          <amenity.icon className="h-5 w-5 text-primary-600" />
                          <span className="text-sm dark-text font-medium">{amenity.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end space-x-3 pt-6 border-t dark-border">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="btn-secondary"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={uploading}
                      className={`btn-primary flex items-center space-x-2 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Save className="h-4 w-4" />
                      <span>
                        {uploading 
                          ? 'กำลังบันทึก...' 
                          : modalType === 'add' ? 'เพิ่มห้องพัก' : 'บันทึกการแก้ไข'
                        }
                      </span>
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
