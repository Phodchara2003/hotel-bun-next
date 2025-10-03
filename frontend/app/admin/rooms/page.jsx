'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { roomsAPI } from '../../../lib/api';
import { isStaffOrAdmin } from '../../../lib/permissions';
import { invalidateRoomImageCache } from '../../../lib/imageUtils';
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
  DollarSign,
  AlertTriangle,
  Wrench,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function RoomsManagement() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, getAuthToken } = useAuth();
  
  // Helper function to ensure token persistence
  const ensureTokenPersistence = () => {
    const token = getAuthToken();
    if (token && user && typeof window !== 'undefined') {
      // บันทึก token และข้อมูล user ใน localStorage เสมอ
      localStorage.setItem('auth_token_persistent', token);
      localStorage.setItem('user_data_persistent', JSON.stringify(user));
      localStorage.setItem('auth_expires_at', (Date.now() + (7 * 24 * 60 * 60 * 1000)).toString());
      
      // บันทึกใน sessionStorage ด้วย
      sessionStorage.setItem('auth_token', token);
      sessionStorage.setItem('user_data', JSON.stringify(user));
      
      console.log('💾 Token persistence ensured');
      return token;
    }
    console.log('⚠️ No token or user data to persist');
    return null;
  };
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add', 'edit', 'view'
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  
  // Delete confirmation modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);
  
  // Sub rooms management
  const [showSubRooms, setShowSubRooms] = useState({});
  const [editingSubRoom, setEditingSubRoom] = useState(null);
  const [showSubRoomModal, setShowSubRoomModal] = useState(false);
  const [subRoomFormData, setSubRoomFormData] = useState({
    room_number: '',
    floor: '',
    available: true,
    status: 'available',
    guest_name: '',
    booking_id: '',
    notes: ''
  });
  
  // Individual rooms management
  const [showIndividualRooms, setShowIndividualRooms] = useState(false);
  const [individualRooms, setIndividualRooms] = useState([]);
  const [individualRoomsLoading, setIndividualRoomsLoading] = useState(false);
  const [showIndividualRoomModal, setShowIndividualRoomModal] = useState(false);
  const [editingIndividualRoom, setEditingIndividualRoom] = useState(null);
  const [individualRoomFormData, setIndividualRoomFormData] = useState({
    room_number: '',
    floor: '',
    status: 'available',
    guest_name: '',
    booking_id: '',
    check_in_date: '',
    check_out_date: '',
    booking_status: '',
    notes: ''
  });
  
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
    status: '',
    priceRange: ''
  });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    floor: '',
    capacity: '',
    price: '',
    description: '',
    amenities: [],
    status: 'available',
    bed_type: '',
    view_type: ''
  });

  const roomStatuses = [
    { value: 'available', label: 'ว่าง', color: 'green' },
    { value: 'occupied', label: 'มีผู้เข้าพัก', color: 'red' },
    { value: 'maintenance', label: 'ซ่อมบำรุง', color: 'yellow' },
    { value: 'cleaning', label: 'ทำความสะอาด', color: 'blue' }
  ];

  const bedTypes = [
    { value: 'single', label: 'เตียงเดี่ยว' },
    { value: 'double', label: 'เตียงคู่' },
    { value: 'queen', label: 'เตียงควีน' },
    { value: 'king', label: 'เตียงคิง' },
    { value: 'twin', label: 'เตียงแฝด' }
  ];

  // Helper function to get bed type label
  const getBedTypeLabel = (bedType) => {
    const bedTypeObj = bedTypes.find(bt => bt.value === bedType);
    return bedTypeObj ? bedTypeObj.label : bedType;
  };

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
    if (isAuthenticated && user && isStaffOrAdmin(user)) {
      fetchRooms();
    }
  }, [isAuthenticated, user]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      
      // ตรวจสอบ token ก่อนเรียก API
      const token = getAuthToken();
      if (!token) {
        toast.error('เซสชันหมดอายุ กรุณาล็อกอินใหม่');
        setLoading(false);
        return;
      }
      
      console.log('🔄 Fetching rooms from database...');
      const response = await roomsAPI.getAllRooms();
      console.log('✅ Rooms API response:', response);
      
      if (response.data && Array.isArray(response.data)) {
        console.log('� Room count:', response.data.length);
        console.log('�🔧 Sample room data from API:', response.data[0]);
        setRooms(response.data);
        calculateStats(response.data);
        setLastUpdated(new Date());
        console.log('✅ Rooms loaded successfully');
      } else {
        console.error('❌ No rooms data in response:', response);
        toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลห้องพัก');
      }
    } catch (error) {
      console.error('❌ Error fetching rooms:', error);
      console.error('❌ Error code:', error.code);
      
      if (error.code === 'ECONNABORTED') {
        toast.error('การเชื่อมต่อล่าช้า กรุณารอสักครู่...');
        // Retry after delay
        setTimeout(() => {
          console.log('🔄 Retrying fetch rooms...');
          fetchRooms();
        }, 3000);
      } else {
        toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลห้องพัก');
      }
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

  // Individual Rooms Management Functions
  const fetchIndividualRooms = async () => {
    try {
      setIndividualRoomsLoading(true);
      const response = await fetch('http://localhost:3001/api/admin/individual-rooms');
      const data = await response.json();
      
      if (data.success) {
        setIndividualRooms(data.data);
      } else {
        toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลห้องพัก');
      }
    } catch (error) {
      console.error('Error fetching individual rooms:', error);
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIndividualRoomsLoading(false);
    }
  };

  const handleIndividualRoomStatusChange = async (roomId, newStatus) => {
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
        fetchIndividualRooms();
      } else {
        toast.error(data.message || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error updating room status:', error);
      toast.error('เกิดข้อผิดพลาดในการเปลี่ยนสถานะ');
    }
  };

  // Individual Room Modal Functions
  const openIndividualRoomModal = (room) => {
    setEditingIndividualRoom(room);
    setIndividualRoomFormData({
      room_number: room.room_number || '',
      floor: room.floor || '',
      status: room.status || 'available',
      guest_name: room.guest_name || '',
      booking_id: room.booking_id || '',
      check_in_date: room.check_in_date || '',
      check_out_date: room.check_out_date || '',
      booking_status: room.booking_status || '',
      notes: room.notes || ''
    });
    setShowIndividualRoomModal(true);
  };

  const closeIndividualRoomModal = () => {
    setShowIndividualRoomModal(false);
    setEditingIndividualRoom(null);
    setIndividualRoomFormData({
      room_number: '',
      floor: '',
      status: 'available',
      guest_name: '',
      booking_id: '',
      check_in_date: '',
      check_out_date: '',
      booking_status: '',
      notes: ''
    });
  };

  const handleIndividualRoomInputChange = (e) => {
    const { name, value } = e.target;
    setIndividualRoomFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleIndividualRoomSubmit = async (e) => {
    e.preventDefault();
    if (!editingIndividualRoom) return;

    setActionLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/admin/individual-rooms/${editingIndividualRoom.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(individualRoomFormData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('อัปเดตข้อมูลห้องพักสำเร็จ');
        fetchIndividualRooms();
        closeIndividualRoomModal();
      } else {
        toast.error(data.message || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error updating individual room:', error);
      toast.error('เกิดข้อผิดพลาดในการอัปเดต');
    } finally {
      setActionLoading(false);
    }
  };

  const getIndividualRoomStatusIcon = (status) => {
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

  const getIndividualRoomStatusText = (status) => {
    switch (status) {
      case 'available': return 'ว่าง';
      case 'occupied': return 'มีผู้เข้าพัก';
      case 'maintenance': return 'ซ่อมบำรุง';
      case 'reserved': return 'จองแล้ว';
      default: return status;
    }
  };

  const getIndividualRoomStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'occupied': return 'bg-blue-100 text-blue-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'reserved': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Load individual rooms when toggle is opened
  useEffect(() => {
    if (showIndividualRooms) {
      fetchIndividualRooms();
    }
  }, [showIndividualRooms]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      priceRange: ''
    });
  };

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = !filters.search || 
      room.name?.toLowerCase().includes(filters.search.toLowerCase());
    
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

    return matchesSearch && matchesStatus && matchesPriceRange;
  });

  const openModal = (type, room = null) => {
    setModalType(type);
    setSelectedRoom(room);
    if (room) {
      console.log('🔧 Opening modal for room:', room);
      console.log('🔧 Original room data for edit:', room);
      
      // Map database fields to form fields with comprehensive field mapping
      const mappedFormData = {
        name: room.name || '',
        bed_type: room.bed_type || 'single', // Map bed_type field
        floor: room.floor || '1', // Default floor if not available
        capacity: room.max_guests || room.capacity || 2, // Map max_guests to capacity
        price: room.price_per_night || room.price || 1500, // Map price_per_night to price
        description: room.description || '',
        amenities: (() => {
          try {
            if (room.amenities) {
              if (typeof room.amenities === 'string') {
                return JSON.parse(room.amenities);
              } else if (Array.isArray(room.amenities)) {
                return room.amenities;
              }
            }
            return [];
          } catch (e) {
            console.error('Error parsing amenities:', e);
            return [];
          }
        })(), // Safe amenities parsing
        status: room.status || 'available', // Default status
        bed_type: room.bed_type || 'double', // Default bed type
        view_type: room.view_type || 'city', // Default view type
        images: (() => {
          try {
            if (room.images) {
              if (typeof room.images === 'string') {
                return JSON.parse(room.images);
              } else if (Array.isArray(room.images)) {
                return room.images;
              }
            }
            return [];
          } catch (e) {
            console.error('Error parsing images:', e);
            return [];
          }
        })() // Safe images parsing
      };
      
      console.log('🔧 Mapped form data for edit:', mappedFormData);
      console.log('🏷️ Key mappings used:');
      console.log('  - max_guests ➜ capacity:', room.max_guests, '➜', mappedFormData.capacity);
      console.log('  - price_per_night ➜ price:', room.price_per_night, '➜', mappedFormData.price);
      console.log('  - Generated defaults:');
      console.log('    - floor:', mappedFormData.floor);
      console.log('    - status:', mappedFormData.status);
      console.log('    - bed_type:', mappedFormData.bed_type);
      console.log('    - view_type:', mappedFormData.view_type);
      console.log('    - images:', mappedFormData.images, '(count:', mappedFormData.images?.length || 0, ')');
      
      setFormData(mappedFormData);
    } else {
      // Reset form for new room
      const emptyFormData = {
        name: '',
        floor: '1',
        capacity: 2,
        price: 1500,
        description: '',
        amenities: [],
        status: 'available',
        bed_type: 'double',
        view_type: 'city'
      };
      console.log('🆕 Setting empty form data for new room');
      setFormData(emptyFormData);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRoom(null);
    setSelectedImages([]);
    setUploadingImages(false);
    setFormData({
      name: '',
      floor: '',
      capacity: '',
      price: '',
      description: '',
      amenities: [],
      status: 'available',
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
    
    // ตรวจสอบและรักษา token ก่อนทำงาน
    const token = ensureTokenPersistence();
    if (!token) {
      toast.error('กรุณาเข้าสู่ระบบใหม่');
      router.push('/admin/login');
      return;
    }
    
    console.log('🚀 Form submission started');
    console.log('📝 Modal Type:', modalType);
    console.log('📝 Selected Room:', selectedRoom);
    console.log('📝 Form Data:', formData);
    
    if (!formData.name || !formData.bed_type || !formData.price) {
      toast.error('กรุณากรอกข้อมูลที่จำเป็น: ชื่อห้อง, ประเภทเตียง, และราคา');
      return;
    }

    try {
      setActionLoading(true);
      let response;

      if (modalType === 'add') {
        console.log('➕ Creating new room...');
        response = await roomsAPI.createRoom(formData);
        console.log('➕ Create response:', response);
        if (response.success) {
          const newRoomId = response.data?.id;
          console.log('✅ Room created with ID:', newRoomId);
          
          // อัปโหลดรูปภาพหลังสร้างห้องสำเร็จ
          if (selectedImages.length > 0 && newRoomId) {
            console.log('📸 Uploading images for new room...');
            const uploadResult = await handleUploadImages(newRoomId);
            if (uploadResult?.success) {
              toast.success('เพิ่มห้องพักและอัปโหลดรูปภาพสำเร็จ');
            } else {
              toast.success('เพิ่มห้องพักสำเร็จ แต่อัปโหลดรูปภาพไม่สำเร็จ');
            }
          } else {
            toast.success('เพิ่มห้องพักสำเร็จ');
          }
          
          closeModal();
          // รีเฟรชข้อมูลทันทีหลังเพิ่มห้องใหม่
          await fetchRooms();
        } else {
          console.error('❌ Create failed:', response);
          toast.error(response.message || 'เกิดข้อผิดพลาดในการเพิ่มห้องพัก');
        }
      } else if (modalType === 'edit') {
        console.log('✏️ Updating room with ID:', selectedRoom.id);
        console.log('✏️ Update data:', JSON.stringify(formData, null, 2));
        console.log('✏️ Form data types:', Object.keys(formData).map(key => `${key}: ${typeof formData[key]} = ${formData[key]}`));
        
        // Create update data without images field to preserve existing images
        const updateData = { ...formData };
        delete updateData.images; // Remove images field to let backend preserve existing images
        console.log('✏️ Update data (without images):', JSON.stringify(updateData, null, 2));
        
        // ตรวจสอบ token ก่อนทำงาน
        const token = getAuthToken();
        if (!token) {
          toast.error('เซสชันหมดอายุ กรุณาล็อกอินใหม่');
          return;
        }
        
        response = await roomsAPI.updateRoom(selectedRoom.id, updateData);
        console.log('✏️ Update response:', response);
        if (response.success) {
          toast.success('แก้ไขห้องพักสำเร็จ - ข้อมูลได้รับการอัปเดต');
          
          // บันทึก token และข้อมูล user อีกครั้งเพื่อป้องกันการหาย
          ensureTokenPersistence();
          
          // ปิด Modal ก่อน
          closeModal();
          
          // รีเฟรชข้อมูลทันทีเพื่อแสดงการเปลี่ยนแปลง
          console.log('🔄 Refreshing data after successful update...');
          await fetchRooms();
          
        } else {
          console.error('❌ Update failed:', response);
          toast.error(response.message || 'เกิดข้อผิดพลาดในการแก้ไขห้องพัก');
        }
      }
    } catch (error) {
      console.error('💥 Error saving room:', error);
      console.error('💥 Error details:', error.response?.data || error.message);
      toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + (error.response?.data?.message || error.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = (roomId) => {
    // Find room details for confirmation modal
    const room = rooms.find(r => r.id === roomId);
    setRoomToDelete(room);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!roomToDelete) return;

    try {
      setActionLoading(true);
      const response = await roomsAPI.deleteRoom(roomToDelete.id);
      if (response.success) {
        toast.success('ลบห้องพักสำเร็จ - ข้อมูลได้รับการอัปเดต');
        // รีเฟรชข้อมูลทันทีหลังลบ
        await fetchRooms();
      } else {
        // แสดงข้อความข้อผิดพลาดแบบละเอียด
        const errorMessage = response.message || 'เกิดข้อผิดพลาดในการลบห้องพัก';
        
        // แสดง toast ข้อผิดพลาดแบบยาว
        toast.error(errorMessage, {
          duration: 8000, // แสดงนาน 8 วินาที
          style: {
            maxWidth: '500px',
            fontSize: '14px',
            lineHeight: '1.4'
          }
        });
        
        // Log รายละเอียดเพิ่มเติม
        if (response.details) {
          console.log('Booking details that prevent deletion:', response.details);
        }
      }
    } catch (error) {
      console.error('Error deleting room:', error);
      
      // ตรวจสอบว่าเป็น error จาก API response หรือไม่
      if (error.response && error.response.data && error.response.data.message) {
        toast.error(error.response.data.message, {
          duration: 8000,
          style: {
            maxWidth: '500px',
            fontSize: '14px',
            lineHeight: '1.4'
          }
        });
      } else {
        toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      }
    } finally {
      setActionLoading(false);
      setShowDeleteModal(false);
      setRoomToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setRoomToDelete(null);
  };

  // Image handling for room edit form
  const handleImageSelect = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter(file => {
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error(`ไฟล์ ${file.name} ไม่ใช่รูปภาพ`);
        return false;
      }
      // Check file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`ไฟล์ ${file.name} มีขนาดใหญ่เกิน 10MB`);
        return false;
      }
      return true;
    });
    
    if (validFiles.length > 0) {
      setSelectedImages(prev => [...prev, ...validFiles]);
      toast.success(`เลือกไฟล์สำเร็จ: ${validFiles.length} ไฟล์`);
    }
  };

  // Sub Rooms Management Functions
  const toggleSubRooms = (roomId) => {
    setShowSubRooms(prev => ({
      ...prev,
      [roomId]: !prev[roomId]
    }));
  };

  const updateSubRoomStatus = async (roomId, subRoomId, field, value) => {
    try {
      // Update local state first
      setRooms(prev => prev.map(room => {
        if (room.id === roomId) {
          return {
            ...room,
            sub_rooms: room.sub_rooms?.map(subRoom => 
              subRoom.id === subRoomId 
                ? { ...subRoom, [field]: value }
                : subRoom
            )
          };
        }
        return room;
      }));

      // Here you would typically make an API call to update the backend
      // await roomsAPI.updateSubRoom(roomId, subRoomId, { [field]: value });
      
      toast.success('อัปเดตสถานะห้องเรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error updating sub room:', error);
      toast.error('เกิดข้อผิดพลาดในการอัปเดต');
      // Revert changes if API call fails
      await fetchRooms();
    }
  };

  // Sub Room Modal Functions
  const openSubRoomModal = (subRoom, roomId) => {
    setEditingSubRoom({ ...subRoom, parentRoomId: roomId });
    setSubRoomFormData({
      room_number: subRoom.room_number || '',
      floor: subRoom.floor || '',
      available: subRoom.available !== false,
      status: subRoom.status || 'available',
      guest_name: subRoom.guest_name || '',
      booking_id: subRoom.booking_id || '',
      notes: subRoom.notes || ''
    });
    setShowSubRoomModal(true);
  };

  const closeSubRoomModal = () => {
    setShowSubRoomModal(false);
    setEditingSubRoom(null);
    setSubRoomFormData({
      room_number: '',
      floor: '',
      available: true,
      status: 'available',
      guest_name: '',
      booking_id: '',
      notes: ''
    });
  };

  const handleSubRoomInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSubRoomFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubRoomSubmit = async (e) => {
    e.preventDefault();
    if (!editingSubRoom) return;

    setActionLoading(true);
    try {
      // Update local state
      setRooms(prev => prev.map(room => {
        if (room.id === editingSubRoom.parentRoomId) {
          return {
            ...room,
            sub_rooms: room.sub_rooms?.map(subRoom => 
              subRoom.id === editingSubRoom.id 
                ? { 
                    ...subRoom, 
                    ...subRoomFormData,
                    available: subRoomFormData.available
                  }
                : subRoom
            )
          };
        }
        return room;
      }));

      // Here you would make an API call to update the backend
      // await roomsAPI.updateSubRoom(editingSubRoom.parentRoomId, editingSubRoom.id, subRoomFormData);
      
      toast.success('อัปเดตข้อมูลห้องพักย่อยเรียบร้อยแล้ว');
      closeSubRoomModal();
    } catch (error) {
      console.error('Error updating sub room:', error);
      toast.error('เกิดข้อผิดพลาดในการอัปเดต');
      // Revert changes if API call fails
      await fetchRooms();
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

  // Helper function to safely parse room images
  const parseRoomImages = (images) => {
    if (!images) return [];
    
    try {
      let result = [];
      
      if (typeof images === 'string') {
        // First try to parse as JSON array
        try {
          const parsed = JSON.parse(images);
          if (Array.isArray(parsed)) {
            result = parsed;
          }
        } catch {
          // If JSON parsing fails, check if it's a comma-separated string
          if (images.includes(',')) {
            const split = images.split(',').map(img => img.trim()).filter(img => img);
            result = split;
          } else {
            // Single image string
            result = [images];
          }
        }
      } else if (Array.isArray(images)) {
        result = images;
      }
      
      // Recursively flatten all nested arrays and extract strings
      const deepFlatten = (arr) => {
        const flattened = [];
        for (const item of arr) {
          if (Array.isArray(item)) {
            // Recursively flatten nested arrays
            flattened.push(...deepFlatten(item));
          } else if (typeof item === 'string' && item.trim() !== '') {
            flattened.push(item.trim());
          }
        }
        return flattened;
      };
      
      return deepFlatten(result);
    } catch (error) {
      console.error('❌ Error parsing room images:', error);
      return [];
    }
  };

  // Image handling functions (moved to image manager)

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (files.length === 0) {
      toast.error('กรุณาวางเฉพาะไฟล์รูปภาพ');
      return;
    }
    
    // Validate file sizes
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`ไฟล์ ${file.name} มีขนาดใหญ่เกิน 10MB`);
        return false;
      }
      return true;
    });
    
    setSelectedImages(prev => [...prev, ...validFiles]);
  };

  const removeSelectedImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadImages = async (roomId = null) => {
    // Use provided roomId or existing selectedRoom.id
    const targetRoomId = roomId || selectedRoom?.id;
    
    // Debug logging
    console.log('🔍 DEBUG: roomId parameter:', roomId);
    console.log('🔍 DEBUG: selectedRoom:', selectedRoom);
    console.log('🔍 DEBUG: selectedRoom?.id:', selectedRoom?.id);
    console.log('🔍 DEBUG: targetRoomId:', targetRoomId);
    console.log('🔍 DEBUG: typeof targetRoomId:', typeof targetRoomId);
    
    // Ensure targetRoomId is a number
    const finalRoomId = parseInt(targetRoomId);
    console.log('🔍 DEBUG: finalRoomId after parseInt:', finalRoomId);
    
    if (!finalRoomId || isNaN(finalRoomId) || selectedImages.length === 0) {
      if (modalType === 'add') {
        toast.error('กรุณาเพิ่มห้องพักก่อน จากนั้นจึงอัปโหลดรูปภาพ');
      } else {
        toast.error('กรุณาเลือกรูปภาพก่อนอัปโหลด หรือ Room ID ไม่ถูกต้อง');
      }
      return null;
    }

    try {
      setUploadingImages(true);
      
      console.log('📸 Uploading images for room ID:', finalRoomId);
      console.log('� Files to upload:', selectedImages.map(f => ({ name: f.name, size: f.size, type: f.type })));
      
      const result = await roomsAPI.uploadImages(finalRoomId, selectedImages);
      console.log('📸 Upload result:', result);

      if (result.success) {
        toast.success(result.message);
        setSelectedImages([]);
        
        // Invalidate cache for this room's images
        invalidateRoomImageCache(finalRoomId);
        console.log('🔄 Cache invalidated for room:', finalRoomId);
        
        // Show additional success message about cache refresh
        setTimeout(() => {
          toast.success('รูปภาพใหม่จะปรากฏในหน้าหลักภายในไม่กี่วินาที', {
            duration: 3000,
            position: 'top-right'
          });
        }, 1000);
        
        // Refresh room data
        await fetchRooms();
        // Update selected room with new images if in edit mode
        if (modalType === 'edit' && selectedRoom?.id) {
          const updatedRoom = await roomsAPI.getRoomById(selectedRoom.id);
          if (updatedRoom.success) {
            setSelectedRoom(updatedRoom.data);
          }
        }
        return result;
      } else {
        toast.error(result.message || 'เกิดข้อผิดพลาดในการอัปโหลด');
        return null;
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
      return null;
    } finally {
      setUploadingImages(false);
    }
  };

  const handleDeleteImage = async (filename) => {
    if (!selectedRoom?.id) return;
    
    if (!confirm(`คุณต้องการลบรูปภาพ "${filename}" หรือไม่?`)) {
      return;
    }

    try {
      const result = await roomsAPI.deleteImage(selectedRoom.id, filename);

      if (result.success) {
        toast.success(result.message);
        // Refresh room data
        await fetchRooms();
        // Update selected room with remaining images
        const updatedRoom = await roomsAPI.getRoomById(selectedRoom.id);
        if (updatedRoom.success) {
          setSelectedRoom(updatedRoom.data);
        }
      } else {
        toast.error(result.message || 'เกิดข้อผิดพลาดในการลบรูปภาพ');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('เกิดข้อผิดพลาดในการลบรูปภาพ');
    }
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

  if (!isStaffOrAdmin(user)) {
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


        {/* Action Buttons */}
        <div className={`mb-8 transform transition-all duration-700 ease-out ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          <div className="flex items-center justify-between">
            {/* Last Updated Time */}
            {lastUpdated && (
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                อัปเดตล่าสุด: {lastUpdated.toLocaleString('th-TH', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </div>
            )}
            
            <div className="flex items-center gap-4">
              <button
                onClick={fetchRooms}
                disabled={loading}
                className="btn-outline flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                รีเฟรช
              </button>
              <button
                onClick={() => setShowIndividualRooms(!showIndividualRooms)}
                className="btn-secondary flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <MapPin className="h-4 w-4" />
                {showIndividualRooms ? 'ซ่อนจัดการห้องแต่ละห้อง' : 'จัดการห้องแต่ละห้อง'}
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

        {/* Individual Rooms Management */}
        {showIndividualRooms && (
          <div className={`bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 p-6 mb-8 transform transition-all duration-700 delay-300 ease-out ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-500 to-green-600 bg-clip-text text-transparent flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg flex items-center justify-center mr-3">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                จัดการห้องพักแต่ละห้อง
              </h2>
              <button
                onClick={() => fetchIndividualRooms()}
                disabled={individualRoomsLoading}
                className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <RefreshCw className={`h-4 w-4 ${individualRoomsLoading ? 'animate-spin' : ''}`} />
                รีเฟรช
              </button>
            </div>

            {individualRoomsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">กำลังโหลดข้อมูล...</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg shadow-inner">
                <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                  <thead className="bg-gradient-to-r from-emerald-500 to-green-600">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                        ห้อง
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                        ประเภท
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                        สถานะ
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                        ผู้เข้าพัก
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                        การจอง
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                        จัดการ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
                    {individualRooms.map((room, index) => (
                      <tr key={room.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-750 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Bed className="w-5 h-5 text-neutral-400 mr-3" />
                            <div>
                              <div className="text-sm font-medium text-neutral-900 dark:text-white">
                                ห้อง {room.room_number}
                              </div>
                              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                                <MapPin className="w-3 h-3 inline mr-1" />
                                ชั้น {room.floor}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-neutral-900 dark:text-white">{room.room_type_name}</div>
                          <div className="text-sm text-neutral-500 dark:text-neutral-400">
                            {room.bed_type === 'single' ? 'เตียงเดี่ยว' : 'เตียงคู่'} •{' '}
                            <Users className="w-3 h-3 inline mr-1" />
                            {room.max_guests} คน
                          </div>
                          <div className="text-sm text-neutral-500 dark:text-neutral-400">
                            <DollarSign className="w-3 h-3 inline mr-1" />
                            {room.price_per_night?.toLocaleString()} บาท/คืน
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getIndividualRoomStatusIcon(room.status)}
                            <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getIndividualRoomStatusColor(room.status)}`}>
                              {getIndividualRoomStatusText(room.status)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {room.guest_name ? (
                            <div className="text-sm text-neutral-900 dark:text-white">{room.guest_name}</div>
                          ) : (
                            <span className="text-sm text-neutral-500 dark:text-neutral-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {room.booking_id ? (
                            <div className="text-xs">
                              <div className="text-neutral-900 dark:text-white">#{room.booking_id}</div>
                              <div className="text-neutral-500 dark:text-neutral-400">
                                {room.check_in_date} - {room.check_out_date}
                              </div>
                              <div className={`inline-block px-2 py-1 rounded-full text-xs ${
                                room.booking_status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                room.booking_status === 'checked_in' ? 'bg-green-100 text-green-800' :
                                'bg-neutral-100 text-neutral-800'
                              }`}>
                                {room.booking_status === 'confirmed' ? 'ยืนยันแล้ว' :
                                 room.booking_status === 'checked_in' ? 'เช็คอินแล้ว' :
                                 room.booking_status}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-neutral-500 dark:text-neutral-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openIndividualRoomModal(room)}
                              className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-xs font-medium transition-colors"
                              title="แก้ไขข้อมูลห้อง"
                            >
                              <Edit className="h-3 w-3" />
                              แก้ไข
                            </button>
                            <select
                              value={room.status}
                              onChange={(e) => handleIndividualRoomStatusChange(room.id, e.target.value)}
                              className="text-xs border border-neutral-300 dark:border-neutral-600 rounded px-2 py-1 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
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
                
                {individualRooms.length === 0 && (
                  <div className="text-center py-12">
                    <Bed className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                    <p className="text-neutral-500 dark:text-neutral-400">ไม่มีข้อมูลห้องพัก</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

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
            <div className="space-y-6">
              {/* Room Types */}
              {filteredRooms.map((room, index) => (
                <div
                  key={room.id}
                  className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700"
                >
                  {/* Room Type Header */}
                  <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Room Image Thumbnail */}
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-700">
                          {(() => {
                            const roomImages = parseRoomImages(room.images);
                            const firstImage = roomImages.length > 0 ? roomImages[0] : null;
                            
                            return (
                              <img
                                src={firstImage ? `/images/rooms/${firstImage}` : '/images/rooms/placeholder.svg'}
                                alt={room.name || 'ห้องพัก'}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src = '/images/rooms/placeholder.svg';
                                }}
                              />
                            );
                          })()}
                        </div>
                        
                        {/* Room Type Info */}
                        <div>
                          <h3 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                            <Bed className="h-5 w-5 text-emerald-600" />
                            {room.name}
                          </h3>
                          <div className="flex items-center gap-4 mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              สำหรับ {room.max_occupancy} คน
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              {formatPrice(room.price_per_night)}/คืน
                            </span>
                            <span className="flex items-center gap-1">
                              {room.sub_rooms && (
                                <>
                                  <Hotel className="h-4 w-4" />
                                  {room.sub_rooms.filter(sr => sr.available).length}/{room.sub_rooms.length} ห้องพร้อมใช้
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleSubRooms(room.id)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                            showSubRooms[room.id] 
                              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                          }`}
                        >
                          {showSubRooms[room.id] ? 'ซ่อนห้อง' : 'แสดงห้อง'}
                        </button>
                        <button
                          onClick={() => openModal('edit', room)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                          แก้ไข
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Sub Rooms List */}
                  {showSubRooms[room.id] && room.sub_rooms && (
                    <div className="p-6 pt-0">
                      <div className="mt-4">
                        <h4 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-4">
                          ห้องพักย่อย ({room.sub_rooms.length} ห้อง)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {room.sub_rooms.map((subRoom) => (
                            <div
                              key={subRoom.id}
                              className={`p-4 rounded-lg border-2 transition-all ${
                                subRoom.available 
                                  ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
                                  : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="font-semibold text-neutral-800 dark:text-neutral-200">
                                  ห้อง {subRoom.room_number}
                                </h5>
                                {subRoom.has_booking && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">
                                    📅 มีการจอง
                                  </span>
                                )}
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className={`text-sm font-medium ${
                                    subRoom.available ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                                  }`}>
                                    {subRoom.available ? '✓ พร้อมใช้' : '✗ ปิดใช้งาน'}
                                  </span>
                                  
                                  <button
                                    onClick={() => updateSubRoomStatus(room.id, subRoom.id, 'available', !subRoom.available)}
                                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                      subRoom.available
                                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                                    }`}
                                  >
                                    {subRoom.available ? 'ปิดใช้' : 'เปิดใช้'}
                                  </button>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => openSubRoomModal(subRoom, room.id)}
                                    className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-xs font-medium transition-colors"
                                  >
                                    <Edit className="h-3 w-3" />
                                    แก้ไข
                                  </button>
                                  
                                  {subRoom.guest_name && (
                                    <span className="text-xs text-neutral-600 dark:text-neutral-400">
                                      ผู้เข้าพัก: {subRoom.guest_name}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
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
                // View Mode - แสดงข้อมูลจริงจากฐานข้อมูล
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
                        ประเภทเตียง
                      </label>
                      <div className="flex items-center">
                        <Bed className="h-4 w-4 mr-2 text-emerald-600" />
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                          {getBedTypeLabel(selectedRoom?.bed_type || 'single')}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        สถานะ
                      </label>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300`}>
                        {selectedRoom?.status ? getStatusLabel(selectedRoom.status) : 'พร้อมใช้งาน'}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        ความจุ
                      </label>
                      <p className="text-neutral-900 dark:text-white">
                        {selectedRoom?.max_guests || selectedRoom?.capacity || '2'} คน
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        ราคา
                      </label>
                      <p className="text-neutral-900 dark:text-white">
                        {formatPrice(selectedRoom?.price_per_night || selectedRoom?.price || 1500)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        โรงแรม
                      </label>
                      <p className="text-neutral-900 dark:text-white">
                        {selectedRoom?.hotel_name || '-'}
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

                  {/* Image Gallery Section for View Mode */}
                  {selectedRoom && (() => {
                    const roomImages = parseRoomImages(selectedRoom.images);
                    
                    if (roomImages.length > 0) {
                      return (
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            รูปภาพห้องพัก ({roomImages.length} รูป)
                          </label>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {roomImages.map((image, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={`/images/rooms/${image}`}
                                  alt={`Room ${index + 1}`}
                                  className="w-full h-24 object-cover rounded-lg border border-neutral-200 dark:border-neutral-600 cursor-pointer hover:opacity-80 transition-opacity"
                                  onError={(e) => {
                                    e.target.src = '/images/rooms/placeholder.svg';
                                  }}
                                  onClick={() => window.open(`/images/rooms/${image}`, '_blank')}
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all flex items-center justify-center">
                                  <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                  </svg>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {selectedRoom?.amenities && selectedRoom.amenities.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        สิ่งอำนวยความสะดวก
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          // จัดการกับข้อมูล amenities ที่อาจเป็น array หรือ string
                          let amenitiesList = [];
                          try {
                            if (Array.isArray(selectedRoom.amenities)) {
                              amenitiesList = selectedRoom.amenities;
                            } else if (typeof selectedRoom.amenities === 'string') {
                              amenitiesList = JSON.parse(selectedRoom.amenities);
                            }
                          } catch (e) {
                            console.error('Error parsing amenities for view:', e);
                            amenitiesList = [];
                          }
                          
                          return amenitiesList.map((amenity, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300"
                            >
                              {amenity}
                            </span>
                          ));
                        })()}
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
                        placeholder="ห้องดีลักซ์ วิวทะเล 101"
                      />
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
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        ประเภทเตียง
                      </label>
                      <select
                        name="bed_type"
                        value={formData.bed_type}
                        onChange={handleInputChange}
                        className="input-field"
                      >
                        <option value="">เลือกประเภทเตียง</option>
                        {bedTypes.map(bedType => (
                          <option key={bedType.value} value={bedType.value}>{bedType.label}</option>
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

                  {/* Room Images Section */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      รูปภาพห้องพัก
                    </label>
                    
                    {/* Current Images Display */}
                    {modalType === 'edit' && selectedRoom?.images && parseRoomImages(selectedRoom.images).length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">รูปภาพปัจจุบัน:</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {parseRoomImages(selectedRoom.images).map((image, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={`/images/rooms/${image}`}
                                alt={`Room ${index + 1}`}
                                className="w-full h-20 object-cover rounded-lg border border-neutral-200 dark:border-neutral-600"
                                onError={(e) => {
                                  e.target.src = '/images/rooms/placeholder.svg';
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => handleDeleteImage(image)}
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                title="ลบรูปภาพ"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Upload New Images */}
                    <div 
                      className="border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg p-6 text-center hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors"
                      onDragOver={handleDragOver}
                      onDragEnter={handleDragEnter}
                      onDrop={handleDrop}
                    >
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                        id="roomImages"
                      />
                      <label 
                        htmlFor="roomImages" 
                        className="cursor-pointer flex flex-col items-center space-y-2"
                      >
                        <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-700 rounded-full flex items-center justify-center">
                          <Upload className="w-6 h-6 text-neutral-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            คลิกเพื่อเลือกรูปภาพ หรือลากไฟล์มาวาง
                          </p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            รองรับ JPG, PNG, WebP (สูงสุด 10MB ต่อรูป)
                          </p>
                        </div>
                      </label>
                    </div>
                    
                    {/* Selected Images Preview */}
                    {selectedImages.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                          รูปภาพที่เลือก ({selectedImages.length} รูป):
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {selectedImages.map((file, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-20 object-cover rounded-lg border border-neutral-200 dark:border-neutral-600"
                              />
                              <button
                                type="button"
                                onClick={() => removeSelectedImage(index)}
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                title="ลบรูปภาพ"
                              >
                                ×
                              </button>
                              <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                                {(file.size / 1024 / 1024).toFixed(1)}MB
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Upload Button for Selected Images */}
                        {(modalType === 'add' || modalType === 'edit') && selectedImages.length > 0 && (
                          <button
                            type="button"
                            onClick={modalType === 'edit' ? () => handleUploadImages(selectedRoom?.id) : undefined}
                            disabled={uploadingImages || modalType === 'add'}
                            className={`mt-3 flex items-center gap-2 text-sm ${
                              modalType === 'add' ? 'btn-secondary cursor-not-allowed' : 'btn-outline'
                            }`}
                            title={modalType === 'add' ? 'รูปภาพจะถูกอัปโหลดหลังจากเพิ่มห้องพักสำเร็จ' : 'อัปโหลดรูปภาพทันที'}
                          >
                            {uploadingImages ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                            )}
                            {uploadingImages ? 'กำลังอัปโหลด...' : 
                              modalType === 'add' ? 
                                `เตรียมอัปโหลด ${selectedImages.length} รูป (หลังเพิ่มห้อง)` : 
                                `อัปโหลด ${selectedImages.length} รูป`
                            }
                          </button>
                        )}
                      </div>
                    )}
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && roomToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                  <AlertCircle className="h-6 w-6 text-red-500" />
                  ยืนยันการลบห้องพัก
                </h2>
                <button
                  onClick={cancelDelete}
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-neutral-400" />
                </button>
              </div>

              {/* Content */}
              <div className="mb-6">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                        คำเตือน: การดำเนินการนี้ไม่สามารถย้อนกลับได้
                      </p>
                      <p className="text-sm text-red-600 dark:text-red-300">
                        ข้อมูลห้องพักจะถูกลบออกจากระบบอย่างถาวร
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-neutral-700 dark:text-neutral-300">
                    คุณแน่ใจหรือไม่ที่จะลบห้องพัก:
                  </p>
                  
                  <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4 border border-neutral-200 dark:border-neutral-600">
                    <div className="flex items-center gap-3 mb-2">
                      <Hotel className="h-5 w-5 text-primary-500" />
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                        {roomToDelete.name}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{roomToDelete.capacity} ท่าน</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        <span>{roomToDelete.price?.toLocaleString()} บาท/คืน</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={cancelDelete}
                  disabled={actionLoading}
                  className="px-4 py-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      กำลังลบ...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      ยืนยันลบ
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub Room Edit Modal */}
      {showSubRoomModal && editingSubRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Bed className="h-5 w-5 text-emerald-600" />
                แก้ไขห้องพักย่อย - ห้อง {editingSubRoom.room_number}
              </h2>
              <button
                onClick={closeSubRoomModal}
                className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <form onSubmit={handleSubRoomSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      หมายเลขห้อง *
                    </label>
                    <input
                      type="text"
                      name="room_number"
                      value={subRoomFormData.room_number}
                      onChange={handleSubRoomInputChange}
                      required
                      className="input-field"
                      placeholder="101"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      ชั้น
                    </label>
                    <input
                      type="number"
                      name="floor"
                      value={subRoomFormData.floor}
                      onChange={handleSubRoomInputChange}
                      className="input-field"
                      placeholder="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      สถานะ
                    </label>
                    <select
                      name="status"
                      value={subRoomFormData.status}
                      onChange={handleSubRoomInputChange}
                      className="input-field"
                    >
                      <option value="available">ว่าง</option>
                      <option value="occupied">มีผู้เข้าพัก</option>
                      <option value="maintenance">ซ่อมบำรุง</option>
                      <option value="reserved">จองแล้ว</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      ผู้เข้าพัก
                    </label>
                    <input
                      type="text"
                      name="guest_name"
                      value={subRoomFormData.guest_name}
                      onChange={handleSubRoomInputChange}
                      className="input-field"
                      placeholder="ชื่อผู้เข้าพัก"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      หมายเลขการจอง
                    </label>
                    <input
                      type="text"
                      name="booking_id"
                      value={subRoomFormData.booking_id}
                      onChange={handleSubRoomInputChange}
                      className="input-field"
                      placeholder="BK001"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="available"
                        checked={subRoomFormData.available}
                        onChange={handleSubRoomInputChange}
                        className="rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">
                        ห้องพร้อมใช้งาน
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    หมายเหตุ
                  </label>
                  <textarea
                    name="notes"
                    value={subRoomFormData.notes}
                    onChange={handleSubRoomInputChange}
                    rows={3}
                    className="input-field"
                    placeholder="หมายเหตุเพิ่มเติม..."
                  />
                </div>

                {/* Submit Button */}
                <div className="flex items-center justify-end gap-4 pt-6 border-t border-neutral-200 dark:border-neutral-700">
                  <button
                    type="button"
                    onClick={closeSubRoomModal}
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
                        บันทึกการแก้ไข
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Individual Room Edit Modal */}
      {showIndividualRoomModal && editingIndividualRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Edit className="h-5 w-5 text-blue-600" />
                แก้ไขห้องพัก - ห้อง {editingIndividualRoom.room_number}
              </h2>
              <button
                onClick={closeIndividualRoomModal}
                className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <form onSubmit={handleIndividualRoomSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      หมายเลขห้อง *
                    </label>
                    <input
                      type="text"
                      name="room_number"
                      value={individualRoomFormData.room_number}
                      onChange={handleIndividualRoomInputChange}
                      required
                      className="input-field"
                      placeholder="501"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      ชั้น
                    </label>
                    <input
                      type="number"
                      name="floor"
                      value={individualRoomFormData.floor}
                      onChange={handleIndividualRoomInputChange}
                      className="input-field"
                      placeholder="5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      สถานะห้อง
                    </label>
                    <select
                      name="status"
                      value={individualRoomFormData.status}
                      onChange={handleIndividualRoomInputChange}
                      className="input-field"
                    >
                      <option value="available">ว่าง</option>
                      <option value="occupied">มีผู้เข้าพัก</option>
                      <option value="maintenance">ซ่อมบำรุง</option>
                      <option value="reserved">จองแล้ว</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      ชื่อผู้เข้าพัก
                    </label>
                    <input
                      type="text"
                      name="guest_name"
                      value={individualRoomFormData.guest_name}
                      onChange={handleIndividualRoomInputChange}
                      className="input-field"
                      placeholder="ชื่อผู้เข้าพัก"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      หมายเลขการจอง
                    </label>
                    <input
                      type="text"
                      name="booking_id"
                      value={individualRoomFormData.booking_id}
                      onChange={handleIndividualRoomInputChange}
                      className="input-field"
                      placeholder="BK001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      สถานะการจอง
                    </label>
                    <select
                      name="booking_status"
                      value={individualRoomFormData.booking_status}
                      onChange={handleIndividualRoomInputChange}
                      className="input-field"
                    >
                      <option value="">ไม่มีการจอง</option>
                      <option value="confirmed">ยืนยันแล้ว</option>
                      <option value="checked_in">เช็คอินแล้ว</option>
                      <option value="checked_out">เช็คเอาท์แล้ว</option>
                      <option value="cancelled">ยกเลิก</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      วันที่เช็คอิน
                    </label>
                    <input
                      type="date"
                      name="check_in_date"
                      value={individualRoomFormData.check_in_date}
                      onChange={handleIndividualRoomInputChange}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      วันที่เช็คเอาท์
                    </label>
                    <input
                      type="date"
                      name="check_out_date"
                      value={individualRoomFormData.check_out_date}
                      onChange={handleIndividualRoomInputChange}
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    หมายเหตุ
                  </label>
                  <textarea
                    name="notes"
                    value={individualRoomFormData.notes}
                    onChange={handleIndividualRoomInputChange}
                    rows={3}
                    className="input-field"
                    placeholder="หมายเหตุเพิ่มเติม..."
                  />
                </div>

                {/* Submit Button */}
                <div className="flex items-center justify-end gap-4 pt-6 border-t border-neutral-200 dark:border-neutral-700">
                  <button
                    type="button"
                    onClick={closeIndividualRoomModal}
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
                        บันทึกการแก้ไข
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
