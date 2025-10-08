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
      // à¸šà¸±à¸™à¸—à¸¶à¸ token à¹à¸¥à¸°à¸‚à¹‰à¸­à¸¡à¸¹à¸¥ user à¹ƒà¸™ localStorage à¹€à¸ªà¸¡à¸­
      localStorage.setItem('auth_token_persistent', token);
      localStorage.setItem('user_data_persistent', JSON.stringify(user));
      localStorage.setItem('auth_expires_at', (Date.now() + (7 * 24 * 60 * 60 * 1000)).toString());
      
      // à¸šà¸±à¸™à¸—à¸¶à¸à¹ƒà¸™ sessionStorage à¸”à¹‰à¸§à¸¢
      sessionStorage.setItem('auth_token', token);
      sessionStorage.setItem('user_data', JSON.stringify(user));
      
      console.log('ðŸ’¾ Token persistence ensured');
      return token;
    }
    console.log('âš ï¸ No token or user data to persist');
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
  const [editingSubRoom, setEditingSubRoom] = useState(null);
  const [showSubRoomModal, setShowSubRoomModal] = useState(false);
  const [subRoomFormData, setSubRoomFormData] = useState({
    room_number: '',
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
    capacity: '',
    price: '',
    description: '',
    amenities: [],
    status: 'available',
    bed_type: '',
    view_type: ''
  });

  const roomStatuses = [
    { value: 'available', label: 'à¸§à¹ˆà¸²à¸‡', color: 'green' },
    { value: 'occupied', label: 'à¸¡à¸µà¸œà¸¹à¹‰à¹€à¸‚à¹‰à¸²à¸žà¸±à¸', color: 'red' },
    { value: 'maintenance', label: 'à¸‹à¹ˆà¸­à¸¡à¸šà¸³à¸£à¸¸à¸‡', color: 'yellow' },
    { value: 'cleaning', label: 'à¸—à¸³à¸„à¸§à¸²à¸¡à¸ªà¸°à¸­à¸²à¸”', color: 'blue' }
  ];

  const bedTypes = [
    { value: 'single', label: 'à¹€à¸•à¸µà¸¢à¸‡à¹€à¸”à¸µà¹ˆà¸¢à¸§' },
    { value: 'double', label: 'à¹€à¸•à¸µà¸¢à¸‡à¸„à¸¹à¹ˆ' }
  ];

  // Helper function to get bed type label
  const getBedTypeLabel = (bedType) => {
    const bedTypeObj = bedTypes.find(bt => bt.value === bedType);
    return bedTypeObj ? bedTypeObj.label : bedType;
  };

  const [amenitiesOptions, setAmenitiesOptions] = useState([
    'WiFi à¸Ÿà¸£à¸µ',
    'à¹€à¸„à¸£à¸·à¹ˆà¸­à¸‡à¸›à¸£à¸±à¸šà¸­à¸²à¸à¸²à¸¨',
    'à¹‚à¸—à¸£à¸—à¸±à¸¨à¸™à¹Œ',
    'à¸•à¸¹à¹‰à¹€à¸¢à¹‡à¸™',
    'à¸•à¸¹à¹‰à¸™à¸´à¸£à¸ à¸±à¸¢',
    'à¹€à¸„à¸£à¸·à¹ˆà¸­à¸‡à¸—à¸³à¸™à¹‰à¸³à¸­à¸¸à¹ˆà¸™',
    'à¸£à¸°à¹€à¸šà¸µà¸¢à¸‡',
    'à¸§à¸´à¸§à¸—à¸°à¹€à¸¥',
    'à¸§à¸´à¸§à¹€à¸¡à¸·à¸­à¸‡',
    'à¸­à¹ˆà¸²à¸‡à¸­à¸²à¸šà¸™à¹‰à¸³',
    'à¸à¸±à¸à¸šà¸±à¸§',
    'à¹€à¸„à¸£à¸·à¹ˆà¸­à¸‡à¹ƒà¸Šà¹‰à¹ƒà¸™à¸«à¹‰à¸­à¸‡à¸™à¹‰à¸³',
    'à¸£à¸¹à¸¡à¹€à¸‹à¸­à¸£à¹Œà¸§à¸´à¸ª',
    'à¸—à¸µà¹ˆà¸™à¸±à¹ˆà¸‡à¸žà¸±à¸à¸œà¹ˆà¸­à¸™'
  ]);

  // States for managing amenities
  const [newAmenity, setNewAmenity] = useState('');
  const [editingAmenity, setEditingAmenity] = useState(null);
  const [editAmenityValue, setEditAmenityValue] = useState('');

  // Add new amenity
  const handleAddAmenity = () => {
    if (newAmenity.trim() && !amenitiesOptions.includes(newAmenity.trim())) {
      setAmenitiesOptions([...amenitiesOptions, newAmenity.trim()]);
      setNewAmenity('');
      toast.success('à¹€à¸žà¸´à¹ˆà¸¡à¸ªà¸´à¹ˆà¸‡à¸­à¸³à¸™à¸§à¸¢à¸„à¸§à¸²à¸¡à¸ªà¸°à¸”à¸§à¸à¹ƒà¸«à¸¡à¹ˆà¸ªà¸³à¹€à¸£à¹‡à¸ˆ');
    } else if (amenitiesOptions.includes(newAmenity.trim())) {
      toast.error('à¸ªà¸´à¹ˆà¸‡à¸­à¸³à¸™à¸§à¸¢à¸„à¸§à¸²à¸¡à¸ªà¸°à¸”à¸§à¸à¸™à¸µà¹‰à¸¡à¸µà¸­à¸¢à¸¹à¹ˆà¹à¸¥à¹‰à¸§');
    }
  };

  // Delete amenity
  const handleDeleteAmenity = (amenityToDelete) => {
    setAmenitiesOptions(amenitiesOptions.filter(amenity => amenity !== amenityToDelete));
    // Remove from form data if selected
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter(amenity => amenity !== amenityToDelete)
    }));
    toast.success('à¸¥à¸šà¸ªà¸´à¹ˆà¸‡à¸­à¸³à¸™à¸§à¸¢à¸„à¸§à¸²à¸¡à¸ªà¸°à¸”à¸§à¸à¸ªà¸³à¹€à¸£à¹‡à¸ˆ');
  };

  // Start editing amenity
  const handleStartEditAmenity = (amenity) => {
    setEditingAmenity(amenity);
    setEditAmenityValue(amenity);
  };

  // Save edited amenity
  const handleSaveEditAmenity = () => {
    if (editAmenityValue.trim() && editAmenityValue.trim() !== editingAmenity) {
      const updatedOptions = amenitiesOptions.map(amenity => 
        amenity === editingAmenity ? editAmenityValue.trim() : amenity
      );
      setAmenitiesOptions(updatedOptions);
      
      // Update form data if the edited amenity was selected
      setFormData(prev => ({
        ...prev,
        amenities: prev.amenities.map(amenity => 
          amenity === editingAmenity ? editAmenityValue.trim() : amenity
        )
      }));
      
      toast.success('à¹à¸à¹‰à¹„à¸‚à¸ªà¸´à¹ˆà¸‡à¸­à¸³à¸™à¸§à¸¢à¸„à¸§à¸²à¸¡à¸ªà¸°à¸”à¸§à¸à¸ªà¸³à¹€à¸£à¹‡à¸ˆ');
    }
    setEditingAmenity(null);
    setEditAmenityValue('');
  };

  // Cancel editing amenity
  const handleCancelEditAmenity = () => {
    setEditingAmenity(null);
    setEditAmenityValue('');
  };

  useEffect(() => {
    setIsVisible(true);
    if (isAuthenticated && user && isStaffOrAdmin(user)) {
      fetchRooms();
    }
  }, [isAuthenticated, user]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      
      // à¸•à¸£à¸§à¸ˆà¸ªà¸­à¸š token à¸à¹ˆà¸­à¸™à¹€à¸£à¸µà¸¢à¸ API
      const token = getAuthToken();
      if (!token) {
        toast.error('à¹€à¸‹à¸ªà¸Šà¸±à¸™à¸«à¸¡à¸”à¸­à¸²à¸¢à¸¸ à¸à¸£à¸¸à¸“à¸²à¸¥à¹‡à¸­à¸à¸­à¸´à¸™à¹ƒà¸«à¸¡à¹ˆ');
        setLoading(false);
        return;
      }
      
      console.log('ðŸ”„ Fetching rooms from database...');
      const response = await roomsAPI.getAllRooms();
      console.log('âœ… Rooms API response:', response);
      
      if (response.data && Array.isArray(response.data)) {
        console.log('ðŸ  Room count:', response.data.length);
        console.log('ðŸ”§ Sample room data from API:', response.data[0]);
        
        // Debug sub_rooms data
        response.data.forEach((room, index) => {
          console.log(`ðŸ  Room ${index + 1}: ${room.name}`);
          console.log(`   - sub_rooms exists: ${!!room.sub_rooms}`);
          console.log(`   - sub_rooms length: ${room.sub_rooms ? room.sub_rooms.length : 0}`);
          if (room.sub_rooms && room.sub_rooms.length > 0) {
            console.log(`   - First sub-room:`, room.sub_rooms[0]);
          }
        });
        
        setRooms(response.data);
        calculateStats(response.data);
        setLastUpdated(new Date());
        console.log('âœ… Rooms loaded successfully');
      } else {
        console.error('âŒ No rooms data in response:', response);
        toast.error('à¹€à¸à¸´à¸”à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸”à¹ƒà¸™à¸à¸²à¸£à¹‚à¸«à¸¥à¸”à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸«à¹‰à¸­à¸‡à¸žà¸±à¸');
      }
    } catch (error) {
      console.error('âŒ Error fetching rooms:', error);
      console.error('âŒ Error code:', error.code);
      
      if (error.code === 'ECONNABORTED') {
        toast.error('à¸à¸²à¸£à¹€à¸Šà¸·à¹ˆà¸­à¸¡à¸•à¹ˆà¸­à¸¥à¹ˆà¸²à¸Šà¹‰à¸² à¸à¸£à¸¸à¸“à¸²à¸£à¸­à¸ªà¸±à¸à¸„à¸£à¸¹à¹ˆ...');
        // Retry after delay
        setTimeout(() => {
          console.log('ðŸ”„ Retrying fetch rooms...');
          fetchRooms();
        }, 3000);
      } else {
        toast.error('à¹€à¸à¸´à¸”à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸”à¹ƒà¸™à¸à¸²à¸£à¹‚à¸«à¸¥à¸”à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸«à¹‰à¸­à¸‡à¸žà¸±à¸');
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
        toast.error('à¹€à¸à¸´à¸”à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸”à¹ƒà¸™à¸à¸²à¸£à¹‚à¸«à¸¥à¸”à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸«à¹‰à¸­à¸‡à¸žà¸±à¸');
      }
    } catch (error) {
      console.error('Error fetching individual rooms:', error);
      toast.error('à¹€à¸à¸´à¸”à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸”à¹ƒà¸™à¸à¸²à¸£à¹€à¸Šà¸·à¹ˆà¸­à¸¡à¸•à¹ˆà¸­');
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
        toast.success('à¹€à¸›à¸¥à¸µà¹ˆà¸¢à¸™à¸ªà¸–à¸²à¸™à¸°à¸«à¹‰à¸­à¸‡à¸žà¸±à¸à¸ªà¸³à¹€à¸£à¹‡à¸ˆ');
        fetchIndividualRooms();
      } else {
        toast.error(data.message || 'à¹€à¸à¸´à¸”à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸”');
      }
    } catch (error) {
      console.error('Error updating room status:', error);
      toast.error('à¹€à¸à¸´à¸”à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸”à¹ƒà¸™à¸à¸²à¸£à¹€à¸›à¸¥à¸µà¹ˆà¸¢à¸™à¸ªà¸–à¸²à¸™à¸°');
    }
  };

  // à¸Ÿà¸±à¸‡à¸à¹Œà¸Šà¸±à¸™à¹€à¸›à¸¥à¸µà¹ˆà¸¢à¸™à¸›à¸£à¸°à¹€à¸ à¸—à¹€à¸•à¸µà¸¢à¸‡
  const handleChangeBedType = async (roomId, newBedType) => {
    try {
      const bedTypeLabels = {
        single: 'à¹€à¸•à¸µà¸¢à¸‡à¹€à¸”à¸µà¹ˆà¸¢à¸§',
        double: 'à¹€à¸•à¸µà¸¢à¸‡à¸„à¸¹à¹ˆ'
      };
      
      const bedTypeLabel = bedTypeLabels[newBedType] || newBedType;
      const confirmMessage = `à¸•à¹‰à¸­à¸‡à¸à¸²à¸£à¹€à¸›à¸¥à¸µà¹ˆà¸¢à¸™à¸›à¸£à¸°à¹€à¸ à¸—à¹€à¸•à¸µà¸¢à¸‡à¹€à¸›à¹‡à¸™ ${bedTypeLabel} à¹ƒà¸Šà¹ˆà¸«à¸£à¸·à¸­à¹„à¸¡à¹ˆ?`;
      
      if (!confirm(confirmMessage)) {
        // à¸–à¹‰à¸²à¸œà¸¹à¹‰à¹ƒà¸Šà¹‰à¸¢à¸à¹€à¸¥à¸´à¸ à¹ƒà¸«à¹‰à¸£à¸µà¹€à¸Ÿà¸£à¸Šà¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¹€à¸žà¸·à¹ˆà¸­à¸„à¸·à¸™à¸„à¹ˆà¸²à¹€à¸”à¸´à¸¡
        fetchIndividualRooms();
        return;
      }

      const response = await fetch(`http://localhost:3001/api/admin/individual-rooms/${roomId}/bed-type`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bed_type: newBedType }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`à¹€à¸›à¸¥à¸µà¹ˆà¸¢à¸™à¸›à¸£à¸°à¹€à¸ à¸—à¹€à¸•à¸µà¸¢à¸‡à¹€à¸›à¹‡à¸™${bedTypeLabel}à¸ªà¸³à¹€à¸£à¹‡à¸ˆ`);
        fetchIndividualRooms();
      } else {
        toast.error(data.message || 'à¹€à¸à¸´à¸”à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸”à¹ƒà¸™à¸à¸²à¸£à¹€à¸›à¸¥à¸µà¹ˆà¸¢à¸™à¸›à¸£à¸°à¹€à¸ à¸—à¹€à¸•à¸µà¸¢à¸‡');
        // à¸£à¸µà¹€à¸Ÿà¸£à¸Šà¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¹€à¸žà¸·à¹ˆà¸­à¸„à¸·à¸™à¸„à¹ˆà¸²à¹€à¸”à¸´à¸¡
        fetchIndividualRooms();
      }
    } catch (error) {
      console.error('Error updating bed type:', error);
      toast.error('à¹€à¸à¸´à¸”à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸”à¹ƒà¸™à¸à¸²à¸£à¹€à¸›à¸¥à¸µà¹ˆà¸¢à¸™à¸›à¸£à¸°à¹€à¸ à¸—à¹€à¸•à¸µà¸¢à¸‡');
      // à¸£à¸µà¹€à¸Ÿà¸£à¸Šà¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¹€à¸žà¸·à¹ˆà¸­à¸„à¸·à¸™à¸„à¹ˆà¸²à¹€à¸”à¸´à¸¡
      fetchIndividualRooms();
    }
  };

  // Individual Room Modal Functions
  const openIndividualRoomModal = (room) => {
    setEditingIndividualRoom(room);
    setIndividualRoomFormData({
      room_number: room.room_number || '',

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
        toast.success('à¸­à¸±à¸›à¹€à¸”à¸•à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸«à¹‰à¸­à¸‡à¸žà¸±à¸à¸ªà¸³à¹€à¸£à¹‡à¸ˆ');
        fetchIndividualRooms();
        closeIndividualRoomModal();
      } else {
        toast.error(data.message || 'à¹€à¸à¸´à¸”à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸”');
      }
    } catch (error) {
      console.error('Error updating individual room:', error);
      toast.error('à¹€à¸à¸´à¸”à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸”à¹ƒà¸™à¸à¸²à¸£à¸­à¸±à¸›à¹€à¸”à¸•');
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
      case 'available': return 'à¸§à¹ˆà¸²à¸‡';
      case 'occupied': return 'à¸¡à¸µà¸œà¸¹à¹‰à¹€à¸‚à¹‰à¸²à¸žà¸±à¸';
      case 'maintenance': return 'à¸‹à¹ˆà¸­à¸¡à¸šà¸³à¸£à¸¸à¸‡';
      case 'reserved': return 'à¸ˆà¸­à¸‡à¹à¸¥à¹‰à¸§';
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
      console.log('ðŸ”§ Opening modal for room:', room);
      console.log('ðŸ”§ Original room data for edit:', room);
      
      // Map database fields to form fields with comprehensive field mapping
      const mappedFormData = {
        name: room.name || '',
        bed_type: room.bed_type || 'single', // Map bed_type field
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
      
      console.log('ðŸ”§ Mapped form data for edit:', mappedFormData);
      console.log('ðŸ·ï¸ Key mappings used:');
      console.log('  - max_guests âžœ capacity:', room.max_guests, 'âžœ', mappedFormData.capacity);
      console.log('  - price_per_night âžœ price:', room.price_per_night, 'âžœ', mappedFormData.price);
      console.log('  - Generated defaults:');

      console.log('    - status:', mappedFormData.status);
      console.log('    - bed_type:', mappedFormData.bed_type);
      console.log('    - view_type:', mappedFormData.view_type);
      console.log('    - images:', mappedFormData.images, '(count:', mappedFormData.images?.length || 0, ')');
      
      setFormData(mappedFormData);
    } else {
      // Reset form for new room
      const emptyFormData = {
        name: '',
        capacity: 2,
        price: 1500,
        description: '',
        amenities: [],
        status: 'available',
        bed_type: 'double',
        view_type: 'city'
      };
      console.log('ðŸ†• Setting empty form data for new room');
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
    
    // à¸•à¸£à¸§à¸ˆà¸ªà¸­à¸šà¹à¸¥à¸°à¸£à¸±à¸à¸©à¸² token à¸à¹ˆà¸­à¸™à¸—à¸³à¸‡à¸²à¸™
    const token = ensureTokenPersistence();
    if (!token) {
      toast.error('à¸à¸£à¸¸à¸“à¸²à¹€à¸‚à¹‰à¸²à¸ªà¸¹à¹ˆà¸£à¸°à¸šà¸šà¹ƒà¸«à¸¡à¹ˆ');
      router.push('/admin/login');
      return;
    }
    
    console.log('ðŸš€ Form submission started');
    console.log('ðŸ“ Modal Type:', modalType);
    console.log('ðŸ“ Selected Room:', selectedRoom);
    console.log('ðŸ“ Form Data:', formData);
    
    if (!formData.name || !formData.bed_type || !formData.price) {
      toast.error('à¸à¸£à¸¸à¸“à¸²à¸à¸£à¸­à¸à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸—à¸µà¹ˆà¸ˆà¸³à¹€à¸›à¹‡à¸™: à¸Šà¸·à¹ˆà¸­à¸«à¹‰à¸­à¸‡, à¸›à¸£à¸°à¹€à¸ à¸—à¹€à¸•à¸µà¸¢à¸‡, à¹à¸¥à¸°à¸£à¸²à¸„à¸²');
      return;
    }

    try {
      setActionLoading(true);
      let response;

      if (modalType === 'add') {
        console.log('âž• Creating new room...');
        response = await roomsAPI.createRoom(formData);
        console.log('âž• Create response:', response);
        if (response.success) {
          const newRoomId = response.data?.id;
          console.log('âœ… Room created with ID:', newRoomId);
          
          // à¸­à¸±à¸›à¹‚à¸«à¸¥à¸”à¸£à¸¹à¸›à¸ à¸²à¸žà¸«à¸¥à¸±à¸‡à¸ªà¸£à¹‰à¸²à¸‡à¸«à¹‰à¸­à¸‡à¸ªà¸³à¹€à¸£à¹‡à¸ˆ
          if (selectedImages.length > 0 && newRoomId) {
            console.log('ðŸ“¸ Uploading images for new room...');
            const uploadResult = await handleUploadImages(newRoomId);
            if (uploadResult?.success) {
              toast.success('à¹€à¸žà¸´à¹ˆà¸¡à¸«à¹‰à¸­à¸‡à¸žà¸±à¸à¹à¸¥à¸°à¸­à¸±à¸›à¹‚à¸«à¸¥à¸”à¸£à¸¹à¸›à¸ à¸²à¸žà¸ªà¸³à¹€à¸£à¹‡à¸ˆ');
            } else {
              toast.success('à¹€à¸žà¸´à¹ˆà¸¡à¸«à¹‰à¸­à¸‡à¸žà¸±à¸à¸ªà¸³à¹€à¸£à¹‡à¸ˆ à¹à¸•à¹ˆà¸­à¸±à¸›à¹‚à¸«à¸¥à¸”à¸£à¸¹à¸›à¸ à¸²à¸žà¹„à¸¡à¹ˆà¸ªà¸³à¹€à¸£à¹‡à¸ˆ');
            }
          } else {
            toast.success('à¹€à¸žà¸´à¹ˆà¸¡à¸«à¹‰à¸­à¸‡à¸žà¸±à¸à¸ªà¸³à¹€à¸£à¹‡à¸ˆ');
          }
          
          closeModal();
          // à¸£à¸µà¹€à¸Ÿà¸£à¸Šà¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸—à¸±à¸™à¸—à¸µà¸«à¸¥à¸±à¸‡à¹€à¸žà¸´à¹ˆà¸¡à¸«à¹‰à¸­à¸‡à¹ƒà¸«à¸¡à¹ˆ
          await fetchRooms();
        } else {
          console.error('âŒ Create failed:', response);
          toast.error(response.message || 'à¹€à¸à¸´à¸”à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸”à¹ƒà¸™à¸à¸²à¸£à¹€à¸žà¸´à¹ˆà¸¡à¸«à¹‰à¸­à¸‡à¸žà¸±à¸');
        }
      } else if (modalType === 'edit') {
        console.log('âœï¸ Updating room with ID:', selectedRoom.id);
        console.log('âœï¸ Update data:', JSON.stringify(formData, null, 2));
        console.log('âœï¸ Form data types:', Object.keys(formData).map(key => `${key}: ${typeof formData[key]} = ${formData[key]}`));
        
        // Create update data without images field to preserve existing images
        const updateData = { ...formData };
        delete updateData.images; // Remove images field to let backend preserve existing images
        console.log('âœï¸ Update data (without images):', JSON.stringify(updateData, null, 2));
        
        // à¸•à¸£à¸§à¸ˆà¸ªà¸­à¸š token à¸à¹ˆà¸­à¸™à¸—à¸³à¸‡à¸²à¸™
        const token = getAuthToken();
        if (!token) {
          toast.error('à¹€à¸‹à¸ªà¸Šà¸±à¸™à¸«à¸¡à¸”à¸­à¸²à¸¢à¸¸ à¸à¸£à¸¸à¸“à¸²à¸¥à¹‡à¸­à¸à¸­à¸´à¸™à¹ƒà¸«à¸¡à¹ˆ');
          return;
        }
        
        response = await roomsAPI.updateRoom(selectedRoom.id, updateData);
        console.log('âœï¸ Update response:', response);
        if (response.success) {
          toast.success('à¹à¸à¹‰à¹„à¸‚à¸«à¹‰à¸­à¸‡à¸žà¸±à¸à¸ªà¸³à¹€à¸£à¹‡à¸ˆ - à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¹„à¸”à¹‰à¸£à¸±à¸šà¸à¸²à¸£à¸­à¸±à¸›à¹€à¸”à¸•');
          
          // à¸šà¸±à¸™à¸—à¸¶à¸ token à¹à¸¥à¸°à¸‚à¹‰à¸­à¸¡à¸¹à¸¥ user à¸­à¸µà¸à¸„à¸£à¸±à¹‰à¸‡à¹€à¸žà¸·à¹ˆà¸­à¸›à¹‰à¸­à¸‡à¸à¸±à¸™à¸à¸²à¸£à¸«à¸²à¸¢
          ensureTokenPersistence();
          
          // à¸›à¸´à¸” Modal à¸à¹ˆà¸­à¸™
          closeModal();
          
          // à¸£à¸µà¹€à¸Ÿà¸£à¸Šà¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸—à¸±à¸™à¸—à¸µà¹€à¸žà¸·à¹ˆà¸­à¹à¸ªà¸”à¸‡à¸à¸²à¸£à¹€à¸›à¸¥à¸µà¹ˆà¸¢à¸™à¹à¸›à¸¥à¸‡
          console.log('ðŸ”„ Refreshing data after successful update...');
          await fetchRooms();
          
        } else {
          console.error('âŒ Update failed:', response);
          toast.error(response.message || 'à¹€à¸à¸´à¸”à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸”à¹ƒà¸™à¸à¸²à¸£à¹à¸à¹‰à¹„à¸‚à¸«à¹‰à¸­à¸‡à¸žà¸±à¸');
        }
      }
    } catch (error) {
      console.error('ðŸ’¥ Error saving room:', error);
      console.error('ðŸ’¥ Error details:', error.response?.data || error.message);
      toast.error('à¹€à¸à¸´à¸”à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸”à¹ƒà¸™à¸à¸²à¸£à¸šà¸±à¸™à¸—à¸¶à¸à¸‚à¹‰à¸­à¸¡à¸¹à¸¥: ' + (error.response?.data?.message || error.message));
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
        toast.success('à¸¥à¸šà¸«à¹‰à¸­à¸‡à¸žà¸±à¸à¸ªà¸³à¹€à¸£à¹‡à¸ˆ - à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¹„à¸”à¹‰à¸£à¸±à¸šà¸à¸²à¸£à¸­à¸±à¸›à¹€à¸”à¸•');
        // à¸£à¸µà¹€à¸Ÿà¸£à¸Šà¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸—à¸±à¸™à¸—à¸µà¸«à¸¥à¸±à¸‡à¸¥à¸š
        await fetchRooms();
      } else {
        // à¹à¸ªà¸”à¸‡à¸‚à¹‰à¸­à¸„à¸§à¸²à¸¡à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸”à¹à¸šà¸šà¸¥à¸°à¹€à¸­à¸µà¸¢à¸”
        const errorMessage = response.message || 'à¹€à¸à¸´à¸”à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸”à¹ƒà¸™à¸à¸²à¸£à¸¥à¸šà¸«à¹‰à¸­à¸‡à¸žà¸±à¸';
        
        // à¹à¸ªà¸”à¸‡ toast à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸”à¹à¸šà¸šà¸¢à¸²à¸§
        toast.error(errorMessage, {
          duration: 8000, // à¹à¸ªà¸”à¸‡à¸™à¸²à¸™ 8 à¸§à¸´à¸™à¸²à¸—à¸µ
          style: {
            maxWidth: '500px',
            fontSize: '14px',
            lineHeight: '1.4'
          }
        });
        
        // Log à¸£à¸²à¸¢à¸¥à¸°à¹€à¸­à¸µà¸¢à¸”à¹€à¸žà¸´à¹ˆà¸¡à¹€à¸•à¸´à¸¡
        if (response.details) {
          console.log('Booking details that prevent deletion:', response.details);
        }
      }
    } catch (error) {
      console.error('Error deleting room:', error);
      
      // à¸•à¸£à¸§à¸ˆà¸ªà¸­à¸šà¸§à¹ˆà¸²à¹€à¸›à¹‡à¸™ error à¸ˆà¸²à¸ API response à¸«à¸£à¸·à¸­à¹„à¸¡à¹ˆ
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
        toast.error('à¹€à¸à¸´à¸”à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸”à¹ƒà¸™à¸à¸²à¸£à¹€à¸Šà¸·à¹ˆà¸­à¸¡à¸•à¹ˆà¸­à¸à¸±à¸šà¹€à¸‹à¸´à¸£à¹Œà¸Ÿà¹€à¸§à¸­à¸£à¹Œ');
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
        toast.error(`à¹„à¸Ÿà¸¥à¹Œ ${file.name} à¹„à¸¡à¹ˆà¹ƒà¸Šà¹ˆà¸£à¸¹à¸›à¸ à¸²à¸ž`);
        return false;
      }
      // Check file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`à¹„à¸Ÿà¸¥à¹Œ ${file.name} à¸¡à¸µà¸‚à¸™à¸²à¸”à¹ƒà¸«à¸à¹ˆà¹€à¸à¸´à¸™ 10MB`);
        return false;
      }
      return true;
    });
    
    if (validFiles.length > 0) {
      setSelectedImages(prev => [...prev, ...validFiles]);
      toast.success(`à¹€à¸¥à¸·à¸­à¸à¹„à¸Ÿà¸¥à¹Œà¸ªà¸³à¹€à¸£à¹‡à¸ˆ: ${validFiles.length} à¹„à¸Ÿà¸¥à¹Œ`);
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
      
      toast.success('à¸­à¸±à¸›à¹€à¸”à¸•à¸ªà¸–à¸²à¸™à¸°à¸«à¹‰à¸­à¸‡à¹€à¸£à¸µà¸¢à¸šà¸£à¹‰à¸­à¸¢à¹à¸¥à¹‰à¸§');
    } catch (error) {
      console.error('Error updating sub room:', error);
      toast.error('à¹€à¸à¸´à¸”à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸”à¹ƒà¸™à¸à¸²à¸£à¸­à¸±à¸›à¹€à¸”à¸•');
      // Revert changes if API call fails
      await fetchRooms();
    }
  };

  // Sub Room Modal Functions
  const openSubRoomModal = (subRoom, roomId) => {
    setEditingSubRoom({ ...subRoom, parentRoomId: roomId });
    setSubRoomFormData({
      room_number: subRoom.room_number || '',
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
      
      toast.success('à¸­à¸±à¸›à¹€à¸”à¸•à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸«à¹‰à¸­à¸‡à¸žà¸±à¸à¸¢à¹ˆà¸­à¸¢à¹€à¸£à¸µà¸¢à¸šà¸£à¹‰à¸­à¸¢à¹à¸¥à¹‰à¸§');
      closeSubRoomModal();
    } catch (error) {
      console.error('Error updating sub room:', error);
      toast.error('à¹€à¸à¸´à¸”à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸”à¹ƒà¸™à¸à¸²à¸£à¸­à¸±à¸›à¹€à¸”à¸•');
      // Revert changes if API call fails
      await fetchRooms();
    } finally {
      setActionLoading(false);
    }
  };

  const formatPrice = (amount) => {
    if (!amount) return 'à¸¿0';
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
      console.error('âŒ Error parsing room images:', error);
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
      toast.error('à¸à¸£à¸¸à¸“à¸²à¸§à¸²à¸‡à¹€à¸‰à¸žà¸²à¸°à¹„à¸Ÿà¸¥à¹Œà¸£à¸¹à¸›à¸ à¸²à¸ž');
      return;
    }
    
    // Validate file sizes
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`à¹„à¸Ÿà¸¥à¹Œ ${file.name} à¸¡à¸µà¸‚à¸™à¸²à¸”à¹ƒà¸«à¸à¹ˆà¹€à¸à¸´à¸™ 10MB`);
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
    console.log('ðŸ” DEBUG: roomId parameter:', roomId);
    console.log('ðŸ” DEBUG: selectedRoom:', selectedRoom);
    console.log('ðŸ” DEBUG: selectedRoom?.id:', selectedRoom?.id);
    console.log('ðŸ” DEBUG: targetRoomId:', targetRoomId);
    console.log('ðŸ” DEBUG: typeof targetRoomId:', typeof targetRoomId);
    
    // Ensure targetRoomId is a number
    const finalRoomId = parseInt(targetRoomId);
    console.log('ðŸ” DEBUG: finalRoomId after parseInt:', finalRoomId);
    
    if (!finalRoomId || isNaN(finalRoomId) || selectedImages.length === 0) {
      if (modalType === 'add') {
        toast.error('à¸à¸£à¸¸à¸“à¸²à¹€à¸žà¸´à¹ˆà¸¡à¸«à¹‰à¸­à¸‡à¸žà¸±à¸à¸à¹ˆà¸­à¸™ à¸ˆà¸²à¸à¸™à¸±à¹‰à¸™à¸ˆà¸¶à¸‡à¸­à¸±à¸›à¹‚à¸«à¸¥à¸”à¸£à¸¹à¸›à¸ à¸²à¸ž');
      } else {
        toast.error('à¸à¸£à¸¸à¸“à¸²à¹€à¸¥à¸·à¸­à¸à¸£à¸¹à¸›à¸ à¸²à¸žà¸à¹ˆà¸­à¸™à¸­à¸±à¸›à¹‚à¸«à¸¥à¸” à¸«à¸£à¸·à¸­ Room ID à¹„à¸¡à¹ˆà¸–à¸¹à¸à¸•à¹‰à¸­à¸‡');
      }
      return null;
    }

    try {
      setUploadingImages(true);
      
      console.log('ðŸ“¸ Uploading images for room ID:', finalRoomId);
      console.log('ï¿½ Files to upload:', selectedImages.map(f => ({ name: f.name, size: f.size, type: f.type })));
      
      const result = await roomsAPI.uploadImages(finalRoomId, selectedImages);
      console.log('ðŸ“¸ Upload result:', result);

      if (result.success) {
        toast.success(result.message);
        setSelectedImages([]);
        
        // Invalidate cache for this room's images
        invalidateRoomImageCache(finalRoomId);
        console.log('ðŸ”„ Cache invalidated for room:', finalRoomId);
        
        // Show additional success message about cache refresh
        setTimeout(() => {
          toast.success('à¸£à¸¹à¸›à¸ à¸²à¸žà¹ƒà¸«à¸¡à¹ˆà¸ˆà¸°à¸›à¸£à¸²à¸à¸à¹ƒà¸™à¸«à¸™à¹‰à¸²à¸«à¸¥à¸±à¸à¸ à¸²à¸¢à¹ƒà¸™à¹„à¸¡à¹ˆà¸à¸µà¹ˆà¸§à¸´à¸™à¸²à¸—à¸µ', {
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
        toast.error(result.message || 'à¹€à¸à¸´à¸”à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸”à¹ƒà¸™à¸à¸²à¸£à¸­à¸±à¸›à¹‚à¸«à¸¥à¸”');
        return null;
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('à¹€à¸à¸´à¸”à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸”à¹ƒà¸™à¸à¸²à¸£à¸­à¸±à¸›à¹‚à¸«à¸¥à¸”à¸£à¸¹à¸›à¸ à¸²à¸ž');
      return null;
    } finally {
      setUploadingImages(false);
    }
  };

  const handleDeleteImage = async (filename) => {
    if (!selectedRoom?.id) return;
    
    if (!confirm(`à¸„à¸¸à¸“à¸•à¹‰à¸­à¸‡à¸à¸²à¸£à¸¥à¸šà¸£à¸¹à¸›à¸ à¸²à¸ž "${filename}" à¸«à¸£à¸·à¸­à¹„à¸¡à¹ˆ?`)) {
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
        toast.error(result.message || 'à¹€à¸à¸´à¸”à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸”à¹ƒà¸™à¸à¸²à¸£à¸¥à¸šà¸£à¸¹à¸›à¸ à¸²à¸ž');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('à¹€à¸à¸´à¸”à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸”à¹ƒà¸™à¸à¸²à¸£à¸¥à¸šà¸£à¸¹à¸›à¸ à¸²à¸ž');
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
            à¸à¸£à¸¸à¸“à¸²à¹€à¸‚à¹‰à¸²à¸ªà¸¹à¹ˆà¸£à¸°à¸šà¸š
          </h1>
          <Link href="/login" className="btn-primary">
            à¹€à¸‚à¹‰à¸²à¸ªà¸¹à¹ˆà¸£à¸°à¸šà¸š
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
            à¹„à¸¡à¹ˆà¸¡à¸µà¸ªà¸´à¸—à¸˜à¸´à¹Œà¹€à¸‚à¹‰à¸²à¸–à¸¶à¸‡
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            à¸„à¸¸à¸“à¹„à¸¡à¹ˆà¸¡à¸µà¸ªà¸´à¸—à¸˜à¸´à¹Œà¹€à¸‚à¹‰à¸²à¸–à¸¶à¸‡à¸«à¸™à¹‰à¸²à¸™à¸µà¹‰
          </p>
          <Link href="/dashboard" className="btn-primary">
            à¸à¸¥à¸±à¸šà¸«à¸™à¹‰à¸²à¸«à¸¥à¸±à¸
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800">
      <div className="container mx-auto px-4 py-8">

        {/* Page Header with Navigation */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">à¸ˆà¸±à¸”à¸à¸²à¸£à¸«à¹‰à¸­à¸‡à¸žà¸±à¸</h1>
              <p className="text-neutral-600 dark:text-neutral-400">à¸ˆà¸±à¸”à¸à¸²à¸£à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸«à¹‰à¸­à¸‡à¸žà¸±à¸à¹à¸¥à¸°à¸›à¸£à¸°à¹€à¸ à¸—à¸«à¹‰à¸­à¸‡à¸žà¸±à¸</p>
            </div>
            
            {/* Navigation buttons */}
            <div className="flex flex-wrap gap-3">
              <Link 
                href="/admin/room-types"
                className="flex items-center px-4 py-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-lg transition-colors"
              >
                <Hotel className="w-4 h-4 mr-2" />
                à¸›à¸£à¸°à¹€à¸ à¸—à¸«à¹‰à¸­à¸‡à¸žà¸±à¸
              </Link>
              
              <Link 
                href="/admin/individual-rooms"
                className="flex items-center px-4 py-2 bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 text-green-700 dark:text-green-300 rounded-lg transition-colors"
              >
                <Bed className="w-4 h-4 mr-2" />
                à¸«à¹‰à¸­à¸‡à¸žà¸±à¸à¸¢à¹ˆà¸­à¸¢
              </Link>
              
              <button
                onClick={() => openModal('add')}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                à¹€à¸žà¸´à¹ˆà¸¡à¸«à¹‰à¸­à¸‡à¸žà¸±à¸
              </button>
            </div>
          </div>
        </div>


        {/* Action Buttons */}
        <div className={`mb-8 transform transition-all duration-700 ease-out ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          <div className="flex items-center justify-between">
            {/* Last Updated Time */}
            {lastUpdated && (
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                à¸­à¸±à¸›à¹€à¸”à¸•à¸¥à¹ˆà¸²à¸ªà¸¸à¸”: {lastUpdated.toLocaleString('th-TH', {
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
                à¸£à¸µà¹€à¸Ÿà¸£à¸Š
              </button>

              <button
                onClick={() => openModal('add')}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                à¹€à¸žà¸´à¹ˆà¸¡à¸«à¹‰à¸­à¸‡à¸žà¸±à¸
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
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">à¸«à¹‰à¸­à¸‡à¸žà¸±à¸à¸—à¸±à¹‰à¸‡à¸«à¸¡à¸”</p>
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
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">à¸«à¹‰à¸­à¸‡à¸§à¹ˆà¸²à¸‡</p>
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
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">à¸¡à¸µà¸œà¸¹à¹‰à¹€à¸‚à¹‰à¸²à¸žà¸±à¸</p>
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
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">à¸‹à¹ˆà¸­à¸¡à¸šà¸³à¸£à¸¸à¸‡</p>
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
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">à¸£à¸²à¸„à¸²à¹€à¸‰à¸¥à¸µà¹ˆà¸¢</p>
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
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">à¸„à¸§à¸²à¸¡à¸ˆà¸¸à¸£à¸§à¸¡</p>
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
              à¸•à¸±à¸§à¸à¸£à¸­à¸‡à¸‚à¹‰à¸­à¸¡à¸¹à¸¥
            </h2>
            <button
              onClick={clearFilters}
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              à¸¥à¹‰à¸²à¸‡à¸•à¸±à¸§à¸à¸£à¸­à¸‡
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                à¸„à¹‰à¸™à¸«à¸²
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="à¸Šà¸·à¹ˆà¸­à¸«à¹‰à¸­à¸‡, à¸«à¸¡à¸²à¸¢à¹€à¸¥à¸‚, à¸›à¸£à¸°à¹€à¸ à¸—..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                à¸ªà¸–à¸²à¸™à¸°
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="input-field"
              >
                <option value="">à¸—à¸¸à¸à¸ªà¸–à¸²à¸™à¸°</option>
                {roomStatuses.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                à¸Šà¹ˆà¸§à¸‡à¸£à¸²à¸„à¸²
              </label>
              <select
                value={filters.priceRange}
                onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                className="input-field"
              >
                <option value="">à¸—à¸¸à¸à¸Šà¹ˆà¸§à¸‡à¸£à¸²à¸„à¸²</option>
                <option value="low">à¸•à¹ˆà¸³à¸à¸§à¹ˆà¸² à¸¿2,000</option>
                <option value="medium">à¸¿2,000 - à¸¿5,000</option>
                <option value="high">à¸ªà¸¹à¸‡à¸à¸§à¹ˆà¸² à¸¿5,000</option>
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
              <p className="text-neutral-600 dark:text-neutral-400">à¸à¸³à¸¥à¸±à¸‡à¹‚à¸«à¸¥à¸”à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸«à¹‰à¸­à¸‡à¸žà¸±à¸...</p>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 p-12 text-center">
              <Hotel className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                à¹„à¸¡à¹ˆà¸¡à¸µà¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸«à¹‰à¸­à¸‡à¸žà¸±à¸
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸¡à¸µà¸«à¹‰à¸­à¸‡à¸žà¸±à¸à¹ƒà¸™à¸£à¸°à¸šà¸š à¸«à¸£à¸·à¸­à¹„à¸¡à¹ˆà¸¡à¸µà¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸—à¸µà¹ˆà¸•à¸£à¸‡à¸à¸±à¸šà¸à¸²à¸£à¸„à¹‰à¸™à¸«à¸²
              </p>
              <button
                onClick={() => openModal('add')}
                className="btn-primary"
              >
                à¹€à¸žà¸´à¹ˆà¸¡à¸«à¹‰à¸­à¸‡à¸žà¸±à¸à¹à¸£à¸
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
                                alt={room.name || 'à¸«à¹‰à¸­à¸‡à¸žà¸±à¸'}
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
                              à¸ªà¸³à¸«à¸£à¸±à¸š {room.max_occupancy} à¸„à¸™
                            </span>
                            <span className="flex items-center gap-1">
                              <Bed className="h-4 w-4" />
                              {getBedTypeLabel(room.bed_type || 'double')}
                              <select
                                value={room.bed_type || 'double'}
                                onChange={(e) => handleChangeBedType(room.id, e.target.value)}
                                disabled={room.total_bookings > 0}
                                className={`ml-2 px-2 py-1 text-xs border rounded transition-colors ${
                                  room.total_bookings > 0
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                                    : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                                }`}
                                title={room.total_bookings > 0 ? 'à¹„à¸¡à¹ˆà¸ªà¸²à¸¡à¸²à¸£à¸–à¹€à¸›à¸¥à¸µà¹ˆà¸¢à¸™à¸›à¸£à¸°à¹€à¸ à¸—à¹€à¸•à¸µà¸¢à¸‡à¹„à¸”à¹‰à¹€à¸™à¸·à¹ˆà¸­à¸‡à¸ˆà¸²à¸à¸¡à¸µà¸à¸²à¸£à¸ˆà¸­à¸‡à¸­à¸¢à¸¹à¹ˆ' : 'à¹€à¸¥à¸·à¸­à¸à¸›à¸£à¸°à¹€à¸ à¸—à¹€à¸•à¸µà¸¢à¸‡'}
                              >
                                <option value="single">à¹€à¸•à¸µà¸¢à¸‡à¹€à¸”à¸µà¹ˆà¸¢à¸§</option>
                                <option value="double">à¹€à¸•à¸µà¸¢à¸‡à¸„à¸¹à¹ˆ</option>
                              </select>
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              {formatPrice(room.price_per_night)}/à¸„à¸·à¸™
                            </span>
                            <span className="flex items-center gap-1">
                              {room.sub_rooms && (
                                <>
                                  <Hotel className="h-4 w-4" />
                                  {room.sub_rooms.filter(sr => sr.status === 'available').length}/{room.sub_rooms.length} à¸«à¹‰à¸­à¸‡à¸žà¸£à¹‰à¸­à¸¡à¹ƒà¸Šà¹‰
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Room Statistics */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm text-neutral-600">
                          <Hotel className="h-4 w-4" />
                          <span>à¸—à¸±à¹‰à¸‡à¸«à¸¡à¸”: {room.total_rooms || 0} à¸«à¹‰à¸­à¸‡</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span>à¸§à¹ˆà¸²à¸‡: {room.available_rooms || 0} à¸«à¹‰à¸­à¸‡</span>
                        </div>
                        {room.occupied_rooms > 0 && (
                          <div className="flex items-center gap-2 text-sm text-red-600">
                            <XCircle className="h-4 w-4" />
                            <span>à¸ˆà¸­à¸‡: {room.occupied_rooms} à¸«à¹‰à¸­à¸‡</span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openModal('edit', room)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                          à¹à¸à¹‰à¹„à¸‚
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
                {modalType === 'add' ? 'à¹€à¸žà¸´à¹ˆà¸¡à¸«à¹‰à¸­à¸‡à¸žà¸±à¸' :
                 modalType === 'edit' ? 'à¹à¸à¹‰à¹„à¸‚à¸«à¹‰à¸­à¸‡à¸žà¸±à¸' : 'à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸«à¹‰à¸­à¸‡à¸žà¸±à¸'}
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
                // View Mode - à¹à¸ªà¸”à¸‡à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸ˆà¸£à¸´à¸‡à¸ˆà¸²à¸à¸à¸²à¸™à¸‚à¹‰à¸­à¸¡à¸¹à¸¥
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        à¸Šà¸·à¹ˆà¸­à¸«à¹‰à¸­à¸‡
                      </label>
                      <p className="text-neutral-900 dark:text-white">
                        {selectedRoom?.name || '-'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        à¸›à¸£à¸°à¹€à¸ à¸—à¹€à¸•à¸µà¸¢à¸‡
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
                        à¸ªà¸–à¸²à¸™à¸°
                      </label>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300`}>
                        {selectedRoom?.status ? getStatusLabel(selectedRoom.status) : 'à¸žà¸£à¹‰à¸­à¸¡à¹ƒà¸Šà¹‰à¸‡à¸²à¸™'}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        à¸„à¸§à¸²à¸¡à¸ˆà¸¸
                      </label>
                      <p className="text-neutral-900 dark:text-white">
                        {selectedRoom?.max_guests || selectedRoom?.capacity || '2'} à¸„à¸™
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        à¸£à¸²à¸„à¸²
                      </label>
                      <p className="text-neutral-900 dark:text-white">
                        {formatPrice(selectedRoom?.price_per_night || selectedRoom?.price || 1500)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        à¹‚à¸£à¸‡à¹à¸£à¸¡
                      </label>
                      <p className="text-neutral-900 dark:text-white">
                        {selectedRoom?.hotel_name || '-'}
                      </p>
                    </div>
                  </div>
                  
                  {selectedRoom?.description && (
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        à¸„à¸³à¸­à¸˜à¸´à¸šà¸²à¸¢
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
                            à¸£à¸¹à¸›à¸ à¸²à¸žà¸«à¹‰à¸­à¸‡à¸žà¸±à¸ ({roomImages.length} à¸£à¸¹à¸›)
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
                        à¸ªà¸´à¹ˆà¸‡à¸­à¸³à¸™à¸§à¸¢à¸„à¸§à¸²à¸¡à¸ªà¸°à¸”à¸§à¸
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          // à¸ˆà¸±à¸”à¸à¸²à¸£à¸à¸±à¸šà¸‚à¹‰à¸­à¸¡à¸¹à¸¥ amenities à¸—à¸µà¹ˆà¸­à¸²à¸ˆà¹€à¸›à¹‡à¸™ array à¸«à¸£à¸·à¸­ string
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
                        à¸Šà¸·à¹ˆà¸­à¸«à¹‰à¸­à¸‡ *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="input-field"
                        placeholder="à¸«à¹‰à¸­à¸‡à¸”à¸µà¸¥à¸±à¸à¸‹à¹Œ à¸§à¸´à¸§à¸—à¸°à¹€à¸¥ 101"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        à¸„à¸§à¸²à¸¡à¸ˆà¸¸ (à¸„à¸™)
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
                        à¸£à¸²à¸„à¸²à¸•à¹ˆà¸­à¸„à¸·à¸™ (à¸šà¸²à¸—)
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
                        à¸ªà¸–à¸²à¸™à¸°
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
                        à¸›à¸£à¸°à¹€à¸ à¸—à¹€à¸•à¸µà¸¢à¸‡
                      </label>
                      <select
                        name="bed_type"
                        value={formData.bed_type}
                        onChange={handleInputChange}
                        className="input-field"
                      >
                        <option value="">à¹€à¸¥à¸·à¸­à¸à¸›à¸£à¸°à¹€à¸ à¸—à¹€à¸•à¸µà¸¢à¸‡</option>
                        {bedTypes.map(bedType => (
                          <option key={bedType.value} value={bedType.value}>{bedType.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      à¸„à¸³à¸­à¸˜à¸´à¸šà¸²à¸¢
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className="input-field"
                      placeholder="à¸­à¸˜à¸´à¸šà¸²à¸¢à¸„à¸¸à¸“à¸ªà¸¡à¸šà¸±à¸•à¸´à¸žà¸´à¹€à¸¨à¸©à¸‚à¸­à¸‡à¸«à¹‰à¸­à¸‡..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      à¸ªà¸´à¹ˆà¸‡à¸­à¸³à¸™à¸§à¸¢à¸„à¸§à¸²à¸¡à¸ªà¸°à¸”à¸§à¸
                    </label>
                    
                    {/* Add New Amenity */}
                    <div className="mb-4 p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="text"
                          value={newAmenity}
                          onChange={(e) => setNewAmenity(e.target.value)}
                          placeholder="à¹€à¸žà¸´à¹ˆà¸¡à¸ªà¸´à¹ˆà¸‡à¸­à¸³à¸™à¸§à¸¢à¸„à¸§à¸²à¸¡à¸ªà¸°à¸”à¸§à¸à¹ƒà¸«à¸¡à¹ˆ..."
                          className="flex-1 input-field text-sm"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddAmenity();
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleAddAmenity}
                          className="px-3 py-1 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm flex items-center gap-1"
                        >
                          <Plus className="h-3 w-3" />
                          à¹€à¸žà¸´à¹ˆà¸¡
                        </button>
                      </div>
                    </div>

                    {/* Amenities List with Edit/Delete */}
                    <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
                      {amenitiesOptions.map((amenity) => (
                        <div key={amenity} className="flex items-center gap-2 p-2 border border-neutral-200 dark:border-neutral-600 rounded-lg">
                          <input
                            type="checkbox"
                            checked={formData.amenities.includes(amenity)}
                            onChange={() => handleAmenityToggle(amenity)}
                            className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                          />
                          
                          {editingAmenity === amenity ? (
                            <div className="flex-1 flex items-center gap-2">
                              <input
                                type="text"
                                value={editAmenityValue}
                                onChange={(e) => setEditAmenityValue(e.target.value)}
                                className="flex-1 input-field text-sm"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSaveEditAmenity();
                                  } else if (e.key === 'Escape') {
                                    handleCancelEditAmenity();
                                  }
                                }}
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={handleSaveEditAmenity}
                                className="p-1 text-green-600 hover:text-green-800"
                                title="à¸šà¸±à¸™à¸—à¸¶à¸"
                              >
                                <Save className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelEditAmenity}
                                className="p-1 text-gray-600 hover:text-gray-800"
                                title="à¸¢à¸à¹€à¸¥à¸´à¸"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex-1 flex items-center justify-between">
                              <span className="text-sm text-neutral-700 dark:text-neutral-300">{amenity}</span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditAmenity(amenity)}
                                  className="p-1 text-blue-600 hover:text-blue-800"
                                  title="à¹à¸à¹‰à¹„à¸‚"
                                >
                                  <Edit className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAmenity(amenity)}
                                  className="p-1 text-red-600 hover:text-red-800"
                                  title="à¸¥à¸š"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Room Images Section */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      à¸£à¸¹à¸›à¸ à¸²à¸žà¸«à¹‰à¸­à¸‡à¸žà¸±à¸
                    </label>
                    
                    {/* Current Images Display */}
                    {modalType === 'edit' && selectedRoom?.images && parseRoomImages(selectedRoom.images).length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">à¸£à¸¹à¸›à¸ à¸²à¸žà¸›à¸±à¸ˆà¸ˆà¸¸à¸šà¸±à¸™:</h4>
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
                                title="à¸¥à¸šà¸£à¸¹à¸›à¸ à¸²à¸ž"
                              >
                                Ã—
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
                            à¸„à¸¥à¸´à¸à¹€à¸žà¸·à¹ˆà¸­à¹€à¸¥à¸·à¸­à¸à¸£à¸¹à¸›à¸ à¸²à¸ž à¸«à¸£à¸·à¸­à¸¥à¸²à¸à¹„à¸Ÿà¸¥à¹Œà¸¡à¸²à¸§à¸²à¸‡
                          </p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            à¸£à¸­à¸‡à¸£à¸±à¸š JPG, PNG, WebP (à¸ªà¸¹à¸‡à¸ªà¸¸à¸” 10MB à¸•à¹ˆà¸­à¸£à¸¹à¸›)
                          </p>
                        </div>
                      </label>
                    </div>
                    
                    {/* Selected Images Preview */}
                    {selectedImages.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                          à¸£à¸¹à¸›à¸ à¸²à¸žà¸—à¸µà¹ˆà¹€à¸¥à¸·à¸­à¸ ({selectedImages.length} à¸£à¸¹à¸›):
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
                                title="à¸¥à¸šà¸£à¸¹à¸›à¸ à¸²à¸ž"
                              >
                                Ã—
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
                            title={modalType === 'add' ? 'à¸£à¸¹à¸›à¸ à¸²à¸žà¸ˆà¸°à¸–à¸¹à¸à¸­à¸±à¸›à¹‚à¸«à¸¥à¸”à¸«à¸¥à¸±à¸‡à¸ˆà¸²à¸à¹€à¸žà¸´à¹ˆà¸¡à¸«à¹‰à¸­à¸‡à¸žà¸±à¸à¸ªà¸³à¹€à¸£à¹‡à¸ˆ' : 'à¸­à¸±à¸›à¹‚à¸«à¸¥à¸”à¸£à¸¹à¸›à¸ à¸²à¸žà¸—à¸±à¸™à¸—à¸µ'}
                          >
                            {uploadingImages ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                            )}
                            {uploadingImages ? 'à¸à¸³à¸¥à¸±à¸‡à¸­à¸±à¸›à¹‚à¸«à¸¥à¸”...' : 
                              modalType === 'add' ? 
                                `à¹€à¸•à¸£à¸µà¸¢à¸¡à¸­à¸±à¸›à¹‚à¸«à¸¥à¸” ${selectedImages.length} à¸£à¸¹à¸› (à¸«à¸¥à¸±à¸‡à¹€à¸žà¸´à¹ˆà¸¡à¸«à¹‰à¸­à¸‡)` : 
                                `à¸­à¸±à¸›à¹‚à¸«à¸¥à¸” ${selectedImages.length} à¸£à¸¹à¸›`
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
                      à¸¢à¸à¹€à¸¥à¸´à¸
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="btn-primary flex items-center gap-2 disabled:opacity-50"
                    >
                      {actionLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          à¸à¸³à¸¥à¸±à¸‡à¸šà¸±à¸™à¸—à¸¶à¸...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          {modalType === 'add' ? 'à¹€à¸žà¸´à¹ˆà¸¡à¸«à¹‰à¸­à¸‡à¸žà¸±à¸' : 'à¸šà¸±à¸™à¸—à¸¶à¸à¸à¸²à¸£à¹à¸à¹‰à¹„à¸‚'}
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
                  à¸¢à¸·à¸™à¸¢à¸±à¸™à¸à¸²à¸£à¸¥à¸šà¸«à¹‰à¸­à¸‡à¸žà¸±à¸
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
                        à¸„à¸³à¹€à¸•à¸·à¸­à¸™: à¸à¸²à¸£à¸”à¸³à¹€à¸™à¸´à¸™à¸à¸²à¸£à¸™à¸µà¹‰à¹„à¸¡à¹ˆà¸ªà¸²à¸¡à¸²à¸£à¸–à¸¢à¹‰à¸­à¸™à¸à¸¥à¸±à¸šà¹„à¸”à¹‰
                      </p>
                      <p className="text-sm text-red-600 dark:text-red-300">
                        à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸«à¹‰à¸­à¸‡à¸žà¸±à¸à¸ˆà¸°à¸–à¸¹à¸à¸¥à¸šà¸­à¸­à¸à¸ˆà¸²à¸à¸£à¸°à¸šà¸šà¸­à¸¢à¹ˆà¸²à¸‡à¸–à¸²à¸§à¸£
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-neutral-700 dark:text-neutral-300">
                    à¸„à¸¸à¸“à¹à¸™à¹ˆà¹ƒà¸ˆà¸«à¸£à¸·à¸­à¹„à¸¡à¹ˆà¸—à¸µà¹ˆà¸ˆà¸°à¸¥à¸šà¸«à¹‰à¸­à¸‡à¸žà¸±à¸:
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
                        <span>{roomToDelete.capacity} à¸—à¹ˆà¸²à¸™</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        <span>{roomToDelete.price?.toLocaleString()} à¸šà¸²à¸—/à¸„à¸·à¸™</span>
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
                  à¸¢à¸à¹€à¸¥à¸´à¸
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
                      à¸à¸³à¸¥à¸±à¸‡à¸¥à¸š...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      à¸¢à¸·à¸™à¸¢à¸±à¸™à¸¥à¸š
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
                à¹à¸à¹‰à¹„à¸‚à¸«à¹‰à¸­à¸‡à¸žà¸±à¸à¸¢à¹ˆà¸­à¸¢ - à¸«à¹‰à¸­à¸‡ {editingSubRoom.room_number}
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
                      à¸«à¸¡à¸²à¸¢à¹€à¸¥à¸‚à¸«à¹‰à¸­à¸‡ *
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
                      à¸ªà¸–à¸²à¸™à¸°
                    </label>
                    <select
                      name="status"
                      value={subRoomFormData.status}
                      onChange={handleSubRoomInputChange}
                      className="input-field"
                    >
                      <option value="available">à¸§à¹ˆà¸²à¸‡</option>
                      <option value="occupied">à¸¡à¸µà¸œà¸¹à¹‰à¹€à¸‚à¹‰à¸²à¸žà¸±à¸</option>
                      <option value="maintenance">à¸‹à¹ˆà¸­à¸¡à¸šà¸³à¸£à¸¸à¸‡</option>
                      <option value="reserved">à¸ˆà¸­à¸‡à¹à¸¥à¹‰à¸§</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      à¸œà¸¹à¹‰à¹€à¸‚à¹‰à¸²à¸žà¸±à¸
                    </label>
                    <input
                      type="text"
                      name="guest_name"
                      value={subRoomFormData.guest_name}
                      onChange={handleSubRoomInputChange}
                      className="input-field"
                      placeholder="à¸Šà¸·à¹ˆà¸­à¸œà¸¹à¹‰à¹€à¸‚à¹‰à¸²à¸žà¸±à¸"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      à¸«à¸¡à¸²à¸¢à¹€à¸¥à¸‚à¸à¸²à¸£à¸ˆà¸­à¸‡
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
                        à¸«à¹‰à¸­à¸‡à¸žà¸£à¹‰à¸­à¸¡à¹ƒà¸Šà¹‰à¸‡à¸²à¸™
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    à¸«à¸¡à¸²à¸¢à¹€à¸«à¸•à¸¸
                  </label>
                  <textarea
                    name="notes"
                    value={subRoomFormData.notes}
                    onChange={handleSubRoomInputChange}
                    rows={3}
                    className="input-field"
                    placeholder="à¸«à¸¡à¸²à¸¢à¹€à¸«à¸•à¸¸à¹€à¸žà¸´à¹ˆà¸¡à¹€à¸•à¸´à¸¡..."
                  />
                </div>

                {/* Submit Button */}
                <div className="flex items-center justify-end gap-4 pt-6 border-t border-neutral-200 dark:border-neutral-700">
                  <button
                    type="button"
                    onClick={closeSubRoomModal}
                    className="btn-outline"
                  >
                    à¸¢à¸à¹€à¸¥à¸´à¸
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        à¸à¸³à¸¥à¸±à¸‡à¸šà¸±à¸™à¸—à¸¶à¸...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        à¸šà¸±à¸™à¸—à¸¶à¸à¸à¸²à¸£à¹à¸à¹‰à¹„à¸‚
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
                à¹à¸à¹‰à¹„à¸‚à¸«à¹‰à¸­à¸‡à¸žà¸±à¸ - à¸«à¹‰à¸­à¸‡ {editingIndividualRoom.room_number}
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
                      à¸«à¸¡à¸²à¸¢à¹€à¸¥à¸‚à¸«à¹‰à¸­à¸‡ *
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
                      à¸ªà¸–à¸²à¸™à¸°à¸«à¹‰à¸­à¸‡
                    </label>
                    <select
                      name="status"
                      value={individualRoomFormData.status}
                      onChange={handleIndividualRoomInputChange}
                      className="input-field"
                    >
                      <option value="available">à¸§à¹ˆà¸²à¸‡</option>
                      <option value="occupied">à¸¡à¸µà¸œà¸¹à¹‰à¹€à¸‚à¹‰à¸²à¸žà¸±à¸</option>
                      <option value="maintenance">à¸‹à¹ˆà¸­à¸¡à¸šà¸³à¸£à¸¸à¸‡</option>
                      <option value="reserved">à¸ˆà¸­à¸‡à¹à¸¥à¹‰à¸§</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      à¸Šà¸·à¹ˆà¸­à¸œà¸¹à¹‰à¹€à¸‚à¹‰à¸²à¸žà¸±à¸
                    </label>
                    <input
                      type="text"
                      name="guest_name"
                      value={individualRoomFormData.guest_name}
                      onChange={handleIndividualRoomInputChange}
                      className="input-field"
                      placeholder="à¸Šà¸·à¹ˆà¸­à¸œà¸¹à¹‰à¹€à¸‚à¹‰à¸²à¸žà¸±à¸"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      à¸«à¸¡à¸²à¸¢à¹€à¸¥à¸‚à¸à¸²à¸£à¸ˆà¸­à¸‡
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
                      à¸ªà¸–à¸²à¸™à¸°à¸à¸²à¸£à¸ˆà¸­à¸‡
                    </label>
                    <select
                      name="booking_status"
                      value={individualRoomFormData.booking_status}
                      onChange={handleIndividualRoomInputChange}
                      className="input-field"
                    >
                      <option value="">à¹„à¸¡à¹ˆà¸¡à¸µà¸à¸²à¸£à¸ˆà¸­à¸‡</option>
                      <option value="confirmed">à¸¢à¸·à¸™à¸¢à¸±à¸™à¹à¸¥à¹‰à¸§</option>
                      <option value="checked_in">à¹€à¸Šà¹‡à¸„à¸­à¸´à¸™à¹à¸¥à¹‰à¸§</option>
                      <option value="checked_out">à¹€à¸Šà¹‡à¸„à¹€à¸­à¸²à¸—à¹Œà¹à¸¥à¹‰à¸§</option>
                      <option value="cancelled">à¸¢à¸à¹€à¸¥à¸´à¸</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      à¸§à¸±à¸™à¸—à¸µà¹ˆà¹€à¸Šà¹‡à¸„à¸­à¸´à¸™
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
                      à¸§à¸±à¸™à¸—à¸µà¹ˆà¹€à¸Šà¹‡à¸„à¹€à¸­à¸²à¸—à¹Œ
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
                    à¸«à¸¡à¸²à¸¢à¹€à¸«à¸•à¸¸
                  </label>
                  <textarea
                    name="notes"
                    value={individualRoomFormData.notes}
                    onChange={handleIndividualRoomInputChange}
                    rows={3}
                    className="input-field"
                    placeholder="à¸«à¸¡à¸²à¸¢à¹€à¸«à¸•à¸¸à¹€à¸žà¸´à¹ˆà¸¡à¹€à¸•à¸´à¸¡..."
                  />
                </div>

                {/* Submit Button */}
                <div className="flex items-center justify-end gap-4 pt-6 border-t border-neutral-200 dark:border-neutral-700">
                  <button
                    type="button"
                    onClick={closeIndividualRoomModal}
                    className="btn-outline"
                  >
                    à¸¢à¸à¹€à¸¥à¸´à¸
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        à¸à¸³à¸¥à¸±à¸‡à¸šà¸±à¸™à¸—à¸¶à¸...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        à¸šà¸±à¸™à¸—à¸¶à¸à¸à¸²à¸£à¹à¸à¹‰à¹„à¸‚
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
