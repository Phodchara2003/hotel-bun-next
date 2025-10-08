'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { bookingAPI } from '../../../lib/api';
import { isStaffOrAdmin, canDeleteBookings, canEditBookings, canManageBookings } from '../../../lib/permissions';
import ConfirmModal from '../../../components/ConfirmModal';
import ClientOnly from '../../../components/ClientOnly';
import Link from 'next/link';
import { 
  Calendar, 
  Users, 
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  X,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Receipt,
  Search,
  Filter,
  Trash2,
  Plus,
  Download,
  RefreshCw,
  AlertTriangle,
  Ban,
  MessageSquare,
  LogIn,
  Edit
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function BookingManagement() {
  return (
    <ClientOnly fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูลการจอง...</p>
        </div>
      </div>
    }>
      <BookingManagementContent />
    </ClientOnly>
  );
}

function BookingManagementContent() {
  const { user, isAuthenticated } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Edit booking states
  const [showEditBookingModal, setShowEditBookingModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    guest_id_number: '',
    check_in_date: '',
    check_out_date: '',
    guests: 1,
    special_requests: ''
  });
  const [editLoading, setEditLoading] = useState(false);

  // Check-in/Check-out modal states
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [selectedBookingForCheckin, setSelectedBookingForCheckin] = useState(null);
  const [checkinFormData, setCheckinFormData] = useState({
    staff_id: user?.id || 1,
    notes: '',
    checkin_time: '',
    checkout_time: ''
  });
  const [checkinLoading, setCheckinLoading] = useState(false);

  // Cancellation request states
  const [cancellationRequests, setCancellationRequests] = useState([]);
  const [selectedCancellation, setSelectedCancellation] = useState(null);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [processingCancellation, setProcessingCancellation] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmActionType, setConfirmActionType] = useState('danger'); // danger, success, warning, info
  const [actionLoading, setActionLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    todayBookings: 0,
    totalRevenue: 0
  });
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    roomType: ''
  });

  const [isFilterVisible, setIsFilterVisible] = useState(true);
  
  // Image zoom modal states
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [currentImageAlt, setCurrentImageAlt] = useState('');

  // Safe date parsing utility
  const safeParseDate = (dateString) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date;
    } catch (error) {
      console.warn('Invalid date:', dateString);
      return null;
    }
  };



  useEffect(() => {
    setIsVisible(true);
    if (isAuthenticated && user && isStaffOrAdmin(user)) {
      fetchBookings();
      fetchCancellationRequests();
    }
  }, [isAuthenticated, user]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching bookings data...');
      const response = await bookingAPI.getDetailedBookingsForAdmin();
      console.log('📊 Full API response:', response);
      
      if (response.success) {
        console.log('📋 Bookings data:', response.data);
        console.log('📊 Status distribution:', response.data.reduce((acc, booking) => {
          acc[booking.status] = (acc[booking.status] || 0) + 1;
          return acc;
        }, {}));
        
        setBookings(response.data);
        calculateStats(response.data);
        

      } else if (response.bookings) {
        // Handle alternative response format
        console.log('Alternative booking data:', response.bookings[0]); // Debug log
        setBookings(response.bookings);
        calculateStats(response.bookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลการจอง');
    } finally {
      setLoading(false);
    }
  };

  const fetchCancellationRequests = async () => {
    try {
      console.log('🔍 Fetching cancellation requests for bookings...');
      const response = await fetch('http://localhost:3001/api/cancellation-requests');
      const result = await response.json();
      
      if (result.success && result.data) {
        setCancellationRequests(result.data);
        console.log('📋 Loaded cancellation requests:', result.data);
      } else {
        setCancellationRequests([]);
      }
    } catch (error) {
      console.error('❌ Error fetching cancellation requests:', error);
      setCancellationRequests([]);
    }
  };

  const processCancellationRequest = async (requestId, action) => {
    try {
      setProcessingCancellation(true);
      console.log(`⚖️ Processing request ${requestId} with action: ${action}`);
      
      const response = await fetch('http://localhost:3001/api/cancellation-requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          request_id: requestId,
          action: action,
          admin_id: user.id,
          admin_notes: adminNotes.trim() || null
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(
          action === 'approved' 
            ? '🎉 อนุมัติคำขอยกเลิกการจองสำเร็จ' 
            : '🚫 ปฏิเสธคำขอยกเลิกการจองสำเร็จ'
        );
        
        // Refresh data
        fetchCancellationRequests();
        fetchBookings();
        setShowCancellationModal(false);
        setAdminNotes('');
        setSelectedCancellation(null);
      } else {
        toast.error(result.message || 'เกิดข้อผิดพลาดในการดำเนินการ');
      }
    } catch (error) {
      console.error('Error processing cancellation request:', error);
      toast.error('ไม่สามารถดำเนินการได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setProcessingCancellation(false);
    }
  };

  const calculateStats = (bookingsData) => {
    const today = new Date().toISOString().split('T')[0];
    
    const stats = {
      totalBookings: bookingsData.length,
      pendingBookings: bookingsData.filter(b => b.status === 'pending').length,
      confirmedBookings: bookingsData.filter(b => b.status === 'confirmed').length,
      completedBookings: bookingsData.filter(b => b.status === 'completed').length,
      cancelledBookings: bookingsData.filter(b => b.status === 'cancelled').length,
      todayBookings: bookingsData.filter(b => {
        const createdDate = b.created_at || b.createdAt;
        const date = safeParseDate(createdDate);
        return date && date.toISOString().split('T')[0] === today;
      }).length,
      totalRevenue: bookingsData
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + (b.total_amount || b.totalAmount || b.total_price || b.totalPrice || 0), 0)
    };
    
    setStats(stats);
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
      status: '',
      dateFrom: '',
      dateTo: '',
      roomType: ''
    });
  };

  // Helper function to check if a booking has a pending cancellation request
  const getCancellationRequest = (bookingId) => {
    return cancellationRequests.find(req => 
      req.booking_id === bookingId && req.status === 'pending'
    );
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = !filters.search || 
      booking.booking_id?.toLowerCase().includes(filters.search.toLowerCase()) ||
      booking.guest_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      booking.guest_email?.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesStatus = !filters.status || booking.status === filters.status;
    
    const matchesDateFrom = !filters.dateFrom || (() => {
      const checkInDate = booking.check_in_date || booking.checkInDate;
      const date = safeParseDate(checkInDate);
      const filterDate = safeParseDate(filters.dateFrom);
      return date && filterDate && date >= filterDate;
    })();
    
    const matchesDateTo = !filters.dateTo || (() => {
      const checkInDate = booking.check_in_date || booking.checkInDate;
      const date = safeParseDate(checkInDate);
      const filterDate = safeParseDate(filters.dateTo);
      return date && filterDate && date <= filterDate;
    })();

    return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { 
        label: 'รอการยืนยัน', 
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        icon: Clock
      },
      confirmed: { 
        label: 'ยืนยันแล้ว', 
        className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        icon: CheckCircle
      },
      checked_in: { 
        label: 'เช็คอินแล้ว', 
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        icon: LogIn
      },
      checked_out: { 
        label: 'เช็คเอาท์แล้ว', 
        className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
        icon: CheckCircle
      },
      completed: { 
        label: 'สำเร็จแล้ว', 
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        icon: CheckCircle
      },
      cancelled: { 
        label: 'ยกเลิกแล้ว', 
        className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        icon: XCircle
      }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.className}`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </span>
    );
  };

  // Helper function to validate and convert base64 to blob URL
  const createBlobUrl = (base64Data) => {
    try {
      if (!base64Data || !base64Data.startsWith('data:')) return base64Data;
      
      const [header, data] = base64Data.split(',');
      if (!data || data.length === 0) {
        console.warn('Base64 data is empty or invalid');
        return null; // Return null for invalid data
      }
      
      // Validate base64 data by checking if it can be decoded
      try {
        const testDecode = atob(data.substring(0, Math.min(100, data.length))); // Test decode first 100 chars
      } catch (decodeError) {
        console.warn('Invalid base64 encoding:', decodeError);
        return null; // Return null for invalid encoding
      }
      
      const mimeMatch = header.match(/data:([^;]+)/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      
      const byteCharacters = atob(data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mime });
      
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error creating blob URL:', error);
      return null; // Return null instead of fallback to prevent further errors
    }
  };

  // Image modal functions
  const openImageModal = (imageUrl, altText = 'Payment slip') => {
    console.log('🖼️ Opening image modal with:', { imageUrl: imageUrl?.substring(0, 100), altText });
    const processedUrl = createBlobUrl(imageUrl);
    setCurrentImageUrl(processedUrl);
    setCurrentImageAlt(altText);
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    console.log('❌ Closing image modal');
    setShowImageModal(false);
    setCurrentImageUrl('');
    setCurrentImageAlt('');
  };

  // Handle keyboard navigation for image modal
  const handleImageModalKeyPress = (e) => {
    if (!showImageModal) return;
    
    if (e.key === 'Escape') {
      closeImageModal();
    }
  };

  // Add keyboard event listener for image modal
  useEffect(() => {
    document.addEventListener('keydown', handleImageModalKeyPress);
    return () => {
      document.removeEventListener('keydown', handleImageModalKeyPress);
    };
  }, [showImageModal]);

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      setActionLoading(true);
      console.log('🔄 Updating booking status:', { bookingId, newStatus });
      
      const response = await bookingAPI.updateStatus(bookingId, newStatus);
      console.log('📝 Status update response:', response);
      
      if (response.success) {
        toast.success(`สถานะการจองถูกเปลี่ยนเป็น ${newStatus} แล้ว`);
        
        // Force refresh the bookings data
        console.log('🔄 Refreshing bookings data...');
        await fetchBookings();
        
        // Also refresh cancellation requests if relevant
        if (newStatus === 'cancelled') {
          await fetchCancellationRequests();
        }
        
        console.log('✅ Data refresh completed');
      } else {
        throw new Error(response.message || 'Update failed');
      }
    } catch (error) {
      console.error('❌ Error updating booking status:', error);
      toast.error('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    } finally {
      setActionLoading(false);
      setShowConfirmModal(false);
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    try {
      setActionLoading(true);
      const response = await bookingAPI.delete(bookingId);
      if (response.success) {
        toast.success('ลบการจองสำเร็จ');
        fetchBookings();
      }
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast.error('เกิดข้อผิดพลาดในการลบการจอง');
    } finally {
      setActionLoading(false);
      setShowConfirmModal(false);
    }
  };

  const handleEditBooking = (booking) => {
    setSelectedBooking(booking);
    setEditFormData({
      guest_name: booking.guest_name || '',
      guest_email: booking.guest_email || '',
      guest_phone: booking.guest_phone || '',
      guest_id_number: booking.guest_id_number || '',
      check_in_date: booking.check_in_date ? new Date(booking.check_in_date).toISOString().split('T')[0] : '',
      check_out_date: booking.check_out_date ? new Date(booking.check_out_date).toISOString().split('T')[0] : '',
      guests: booking.guests || 1,
      special_requests: booking.special_requests || ''
    });
    setShowEditBookingModal(true);
  };

  const handleUpdateBooking = async () => {
    if (!selectedBooking) return;
    
    // Validation
    if (!editFormData.guest_name.trim()) {
      toast.error('กรุณากรอกชื่อผู้จอง');
      return;
    }
    
    if (!editFormData.guest_email.trim()) {
      toast.error('กรุณากรอกอีเมล');
      return;
    }
    
    if (!editFormData.check_in_date || !editFormData.check_out_date) {
      toast.error('กรุณาเลือกวันที่เข้าและออก');
      return;
    }
    
    const checkIn = new Date(editFormData.check_in_date);
    const checkOut = new Date(editFormData.check_out_date);
    
    if (checkOut <= checkIn) {
      toast.error('วันที่ออกต้องหลังจากวันที่เข้า');
      return;
    }

    try {
      setEditLoading(true);
      
      const updateData = {
        guest_name: editFormData.guest_name.trim(),
        guest_email: editFormData.guest_email.trim(),
        guest_phone: editFormData.guest_phone.trim(),
        guest_id_number: editFormData.guest_id_number.trim(),
        check_in_date: editFormData.check_in_date,
        check_out_date: editFormData.check_out_date,
        guests: parseInt(editFormData.guests),
        special_requests: editFormData.special_requests.trim()
      };
      
      const response = await fetch(`http://localhost:3001/api/admin/bookings/${selectedBooking.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updateData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('อัปเดตการจองสำเร็จ');
        setShowEditBookingModal(false);
        fetchBookings();
      } else {
        throw new Error(result.message || 'เกิดข้อผิดพลาดในการอัปเดต');
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error(error.message || 'เกิดข้อผิดพลาดในการอัปเดตการจอง');
    } finally {
      setEditLoading(false);
    }
  };

  const closeEditModal = () => {
    setShowEditBookingModal(false);
    setSelectedBooking(null);
    setEditFormData({
      guest_name: '',
      guest_email: '',
      guest_phone: '',
      guest_id_number: '',
      check_in_date: '',
      check_out_date: '',
      guests: 1,
      special_requests: ''
    });
  };

  const handleCheckinModal = (booking) => {
    // สร้างวันที่เช็คอินในเขตเวลาท้องถิ่น เวลา 14:00
    const checkinDateStr = booking.check_in_date.split('T')[0]; // เอาแค่วันที่
    const defaultCheckinTime = `${checkinDateStr}T14:00`;
    
    // สร้างวันที่เช็คเอ้าในเขตเวลาท้องถิ่น เวลา 12:00
    const checkoutDateStr = booking.check_out_date.split('T')[0]; // เอาแค่วันที่
    const defaultCheckoutTime = `${checkoutDateStr}T12:00`;
    
    console.log('🔍 Check-in modal data:', {
      check_in_date: booking.check_in_date,
      check_out_date: booking.check_out_date,
      defaultCheckinTime,
      defaultCheckoutTime
    });
    
    setSelectedBookingForCheckin(booking);
    setCheckinFormData({
      staff_id: user?.id || 1,
      notes: '',
      checkin_time: booking.actual_check_in_time 
        ? new Date(booking.actual_check_in_time).toISOString().slice(0, 16)
        : defaultCheckinTime,
      checkout_time: booking.actual_check_out_time 
        ? new Date(booking.actual_check_out_time).toISOString().slice(0, 16)
        : defaultCheckoutTime
    });
    setShowCheckinModal(true);
  };

  const closeCheckinModal = () => {
    setShowCheckinModal(false);
    setSelectedBookingForCheckin(null);
    setCheckinFormData({
      staff_id: user?.id || 1,
      notes: '',
      checkin_time: '',
      checkout_time: ''
    });
  };

  const handleCheckin = async () => {
    if (!selectedBookingForCheckin) return;
    
    try {
      setCheckinLoading(true);
      
      const response = await fetch('http://localhost:3001/api/bookings/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          booking_id: selectedBookingForCheckin.id,
          staff_id: checkinFormData.staff_id,
          notes: checkinFormData.notes,
          check_in_time: checkinFormData.checkin_time
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('เช็คอินสำเร็จ!');
        // Don't close modal, just refresh the booking data
        fetchBookings(); // Refresh the bookings list
        
        // Update the selected booking data in modal
        const updatedBooking = { ...selectedBookingForCheckin };
        updatedBooking.actual_check_in_time = new Date(checkinFormData.checkin_time).toISOString();
        updatedBooking.status = 'checked_in';
        setSelectedBookingForCheckin(updatedBooking);
        
        // Enable checkout time field by setting current time
        const now = new Date().toISOString().slice(0, 16);
        setCheckinFormData(prev => ({ 
          ...prev, 
          checkout_time: now 
        }));
        
      } else {
        throw new Error(result.message || 'เกิดข้อผิดพลาดในการเช็คอิน');
      }
    } catch (error) {
      console.error('Check-in error:', error);
      toast.error(error.message || 'เกิดข้อผิดพลาดในการเช็คอิน');
    } finally {
      setCheckinLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!selectedBookingForCheckin) return;
    
    try {
      setCheckinLoading(true);
      
      const response = await fetch('http://localhost:3001/api/bookings/check-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          booking_id: selectedBookingForCheckin.id,
          staff_id: checkinFormData.staff_id,
          notes: checkinFormData.notes,
          check_out_time: checkinFormData.checkout_time
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('เช็คเอ้าสำเร็จ!');
        fetchBookings(); // Refresh the bookings list
        closeCheckinModal(); // Close modal after checkout
      } else {
        throw new Error(result.message || 'เกิดข้อผิดพลาดในการเช็คเอ้า');
      }
    } catch (error) {
      console.error('Check-out error:', error);
      toast.error(error.message || 'เกิดข้อผิดพลาดในการเช็คเอ้า');
    } finally {
      setCheckinLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = safeParseDate(dateString);
    if (!date) return '-';
    
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (amount) => {
    if (!amount) return '฿0';
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getCheckinStatusIcon = (booking) => {
    const hasActualCheckin = booking.actual_check_in_time;
    const hasActualCheckout = booking.actual_check_out_time;
    
    if (booking.status === 'confirmed' && !hasActualCheckin) {
      // จองแล้ว แต่ยังไม่ได้เช็คอินจริงที่โรงแรม
      return (
        <div className="relative group">
          <div className="w-6 h-6 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-800 dark:to-blue-900 rounded-full flex items-center justify-center border border-blue-300 dark:border-blue-600">
            <Clock className="h-3 w-3 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-neutral-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg z-20">
            รอเช็คอินที่โรงแรม
          </div>
        </div>
      );
    }
    
    if (hasActualCheckin && !hasActualCheckout) {
      // เช็คอินแล้ว แต่ยังไม่เช็คเอ้า
      return (
        <div className="relative group">
          <div className="w-6 h-6 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-800 dark:to-green-900 rounded-full flex items-center justify-center border border-green-300 dark:border-green-600">
            <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
          </div>
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-neutral-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg z-20">
            เช็คอินแล้ว: {new Date(hasActualCheckin).toLocaleString('th-TH')}
          </div>
        </div>
      );
    }
    
    if (hasActualCheckin && hasActualCheckout) {
      // เช็คอินและเช็คเอ้าครบแล้ว
      return (
        <div className="relative group">
          <div className="w-6 h-6 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-800 dark:to-purple-900 rounded-full flex items-center justify-center border border-purple-300 dark:border-purple-600">
            <svg className="h-3 w-3 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-neutral-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg z-20">
            <div className="text-center">
              <div>เช็คอิน: {new Date(hasActualCheckin).toLocaleString('th-TH')}</div>
              <div>เช็คเอ้า: {new Date(hasActualCheckout).toLocaleString('th-TH')}</div>
            </div>
          </div>
        </div>
      );
    }
    
    return null;
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-neutral-50 to-indigo-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      
      {/* Image Zoom Modal */}
      {showImageModal && currentImageUrl && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-[100] flex items-center justify-center p-4"
          onClick={closeImageModal}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999
          }}
        >
          {console.log('🎭 Image modal is rendering:', { showImageModal, currentImageUrl, currentImageAlt })}
          <div className="relative max-w-4xl max-h-full z-[101]">
            {/* Close Button */}
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Main Image */}
            <img
              src={currentImageUrl}
              alt={currentImageAlt}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              onError={(e) => {
                console.log('Modal image failed to load:', currentImageUrl);
                // Try alternative URLs
                const alternativeUrls = [
                  currentImageUrl.replace('/uploads/', '/uploads/payment-slips/'),
                  currentImageUrl.replace('http://localhost:3001', ''),
                  currentImageUrl.replace('/uploads/payment-slips/', '/uploads/')
                ];
                
                let urlIndex = 0;
                const tryNextUrl = () => {
                  if (urlIndex < alternativeUrls.length) {
                    console.log('Trying alternative URL:', alternativeUrls[urlIndex]);
                    e.target.src = alternativeUrls[urlIndex];
                    urlIndex++;
                  } else {
                    console.log('All modal URLs failed');
                    // Show fallback content
                    e.target.style.display = 'none';
                    const fallback = e.target.nextElementSibling;
                    if (fallback) fallback.style.display = 'flex';
                  }
                };
                
                e.target.onerror = tryNextUrl;
                tryNextUrl();
              }}
            />

            {/* Fallback content when image fails to load */}
            <div 
              className="max-w-full max-h-[80vh] bg-neutral-800 rounded-lg shadow-2xl flex items-center justify-center p-8 text-white min-h-[300px] min-w-[400px]" 
              style={{display: 'none'}}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <Receipt className="h-16 w-16 mx-auto mb-4 text-neutral-400" />
                <h3 className="text-lg font-semibold mb-2">ไม่สามารถแสดงรูปภาพได้</h3>
                <p className="text-sm text-neutral-300 mb-4">{currentImageAlt}</p>
                <div className="space-y-2">
                  <p className="text-xs text-neutral-400">URL: {currentImageUrl}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(currentImageUrl, '_blank');
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm transition-colors"
                  >
                    ลองเปิดในหน้าต่างใหม่
                  </button>
                </div>
              </div>
            </div>

            {/* Download/Open Button - Hidden to not obstruct the image */}
            <div className="absolute bottom-4 right-4 opacity-0 hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(currentImageUrl, '_blank');
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-full text-xs flex items-center gap-1 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">


        {/* Action Buttons */}
        <div className={`mb-8 transform transition-all duration-700 ease-out ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          <div className="flex items-center justify-end gap-4">
            <button
              onClick={fetchBookings}
              disabled={loading}
              className="btn-outline flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              รีเฟรช
            </button>
            <button className="btn-primary flex items-center gap-2">
              <Download className="h-4 w-4" />
              ส่งออกข้อมูล
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className={`grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4 lg:gap-6 mb-8 transform transition-all duration-700 delay-200 ease-out ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-3 sm:p-6 shadow-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-neutral-600 dark:text-neutral-400">การจองทั้งหมด</p>
                <p className="text-lg sm:text-2xl font-bold text-neutral-900 dark:text-white">{stats.totalBookings}</p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Calendar className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-xl p-3 sm:p-6 shadow-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-neutral-600 dark:text-neutral-400">รอการยืนยัน</p>
                <p className="text-lg sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pendingBookings}</p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                <Clock className="h-4 w-4 sm:h-6 sm:w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-xl p-3 sm:p-6 shadow-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-neutral-600 dark:text-neutral-400">ยืนยันแล้ว</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">{stats.confirmedBookings}</p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-4 w-4 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-xl p-3 sm:p-6 shadow-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-neutral-600 dark:text-neutral-400">สำเร็จแล้ว</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.completedBookings}</p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-xl p-3 sm:p-6 shadow-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-neutral-600 dark:text-neutral-400">ยกเลิกแล้ว</p>
                <p className="text-lg sm:text-2xl font-bold text-red-600 dark:text-red-400">{stats.cancelledBookings}</p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                <XCircle className="h-4 w-4 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-xl p-3 sm:p-6 shadow-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-neutral-600 dark:text-neutral-400">วันนี้</p>
                <p className="text-lg sm:text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.todayBookings}</p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-xl p-3 sm:p-6 shadow-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-neutral-600 dark:text-neutral-400">รายได้รวม</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">{formatPrice(stats.totalRevenue)}</p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <Receipt className="h-4 w-4 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className={`bg-white dark:bg-neutral-800 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6 transform transition-all duration-700 delay-300 ease-out ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                <Filter className="h-4 w-4 text-white" />
              </div>
              ค้นหาและกรอง
            </h2>
            <div className="text-sm text-neutral-500 dark:text-neutral-400">
              {filteredBookings.length} / {bookings.length} รายการ
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {/* Search */}
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                ค้นหา
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="รหัสจอง, ชื่อ, อีเมล..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10 w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-xl bg-neutral-50 dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                />
              </div>
            </div>
            
            {/* Status Filter */}
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                สถานะ
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-xl bg-neutral-50 dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
              >
                <option value="">ทั้งหมด</option>
                <option value="pending">รอการยืนยัน</option>
                <option value="confirmed">ยืนยันแล้ว</option>
                <option value="completed">สำเร็จแล้ว</option>
                <option value="cancelled">ยกเลิกแล้ว</option>
              </select>
            </div>
            
            {/* Date From */}
            <div>
              <label className="block text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-3">
                วันเข้าพักจาก
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="input-field text-sm"
              />
            </div>
            
            {/* Date To */}
            <div>
              <label className="block text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-3">
                วันเข้าพักถึง
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="input-field text-sm"
              />
            </div>

            {/* Clear Filters Button */}
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="group w-full px-6 py-3 bg-gradient-to-r from-rose-50 to-pink-50 hover:from-rose-100 hover:to-pink-100 dark:from-rose-900/20 dark:to-pink-900/20 dark:hover:from-rose-800/30 dark:hover:to-pink-800/30 text-rose-700 dark:text-rose-300 hover:text-rose-800 dark:hover:text-rose-200 font-semibold rounded-xl border border-rose-200 dark:border-rose-700/50 hover:border-rose-300 dark:hover:border-rose-600 transition-all duration-300 hover:shadow-lg hover:shadow-rose-200/30 dark:hover:shadow-rose-900/20 active:scale-[0.98] relative overflow-hidden"
                title="ล้างตัวกรองทั้งหมด"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-rose-400/0 via-rose-300/0 to-pink-400/0 group-hover:from-rose-400/10 group-hover:via-rose-300/5 group-hover:to-pink-400/10 transition-all duration-300"></div>
                <div className="relative flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 transition-transform duration-200 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  ล้างตัวกรอง
                </div>
              </button>
            </div>
          </div>
          
          <div className="mt-8">
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800/50 dark:to-blue-900/20 rounded-xl p-4 border border-slate-200 dark:border-slate-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">รายการจองทั้งหมด</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-slate-900 dark:text-white">{filteredBookings.length}</span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">จาก</span>
                      <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">{bookings.length}</span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">รายการ</span>
                    </div>
                  </div>
                </div>
                {filteredBookings.length !== bookings.length && (
                  <div className="px-3 py-1 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium rounded-full border border-amber-200 dark:border-amber-700/50">
                    กำลังกรอง
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bookings Table */}
        <div className={`bg-white dark:bg-neutral-800 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden transform transition-all duration-700 delay-400 ease-out ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          <div className="px-6 py-4 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-neutral-800 dark:to-neutral-900 border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                  รายการการจอง
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                  แสดง {filteredBookings.length} จาก {bookings.length} รายการ
                </p>
              </div>
              <button
                onClick={fetchBookings}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                title="รีเฟรชข้อมูล"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="font-medium">รีเฟรช</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-16 text-center">
              <div className="relative inline-block">
                <div className="w-16 h-16 border-4 border-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-800 dark:to-purple-800 rounded-full"></div>
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-blue-500 border-r-purple-500 rounded-full animate-spin"></div>
              </div>
              <div className="mt-6 space-y-2">
                <p className="text-lg font-semibold text-slate-800 dark:text-slate-200">กำลังโหลดข้อมูลการจอง</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">โปรดรอสักครู่...</p>
              </div>
              <div className="mt-8 flex justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
              </div>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="p-16 text-center">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-full flex items-center justify-center mx-auto border-4 border-slate-200 dark:border-slate-600">
                  <Calendar className="h-10 w-10 text-slate-400 dark:text-slate-500" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.084 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                  ไม่พบข้อมูลการจอง
                </h3>
                <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                  {bookings.length === 0 
                    ? "ยังไม่มีการจองในระบบ เริ่มต้นรับจองแรกของคุณเลย!" 
                    : "ไม่มีรายการที่ตรงกับเงื่อนไขการค้นหา ลองปรับเปลี่ยนตัวกรองดู"
                  }
                </p>
                {bookings.length > 0 && (
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-medium rounded-lg transition-all duration-200 hover:shadow-lg transform hover:scale-105"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    รีเซ็ตตัวกรอง
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-900">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase tracking-wide">
                        รหัสจอง
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase tracking-wide">
                        ผู้เข้าพัก
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase tracking-wide">
                        ห้องพัก
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase tracking-wide">
                        วันที่พัก (จอง)
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase tracking-wide">
                        เวลาจริงที่โรงแรม
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase tracking-wide">
                        จำนวนเงิน
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase tracking-wide">
                        สถานะ
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase tracking-wide">
                        จัดการ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700 bg-white dark:bg-neutral-800">
                  {filteredBookings.map((booking, index) => (
                    <tr key={booking.id} className={`hover:bg-gradient-to-r hover:from-primary-25 hover:to-blue-25 dark:hover:from-neutral-700 dark:hover:to-neutral-750 transition-all duration-200 ${index % 2 === 0 ? 'bg-neutral-25 dark:bg-neutral-800' : 'bg-white dark:bg-neutral-800'}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
                            <span className="text-xs font-bold text-white">{booking.id}</span>
                          </div>
                          <div className="text-sm font-semibold text-neutral-900 dark:text-white">
                            {booking.booking_id || `BK${booking.id}`}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="flex-shrink-0 w-8 h-8">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-800 dark:to-blue-900 rounded-full flex items-center justify-center border-2 border-blue-200 dark:border-blue-700">
                              <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                              {booking.guest_name || 'ไม่ระบุ'}
                            </div>
                            <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                              {booking.guest_phone || 'ไม่ระบุเบอร์'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-neutral-900 dark:text-white">
                            {booking.room_number || ''}
                          </div>
                          <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                            {booking.room_type_name || 
                             (typeof booking.room_type === 'object' ? booking.room_type?.name : booking.room_type) || 
                             ''}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="text-sm text-neutral-900 dark:text-white">
                            {formatDate(booking.check_in_date)}
                          </div>
                          <div className="text-xs text-neutral-500 dark:text-neutral-400">
                            ถึง {formatDate(booking.check_out_date)}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {booking.actual_check_in_time ? (
                            <>
                              <div className="text-sm text-green-700 dark:text-green-400 font-medium">
                                เช็คอิน: {new Date(booking.actual_check_in_time).toLocaleDateString('th-TH', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </div>
                              <div className="text-xs text-green-600 dark:text-green-500">
                                {new Date(booking.actual_check_in_time).toLocaleTimeString('th-TH', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </>
                          ) : (
                            <div className="text-sm text-neutral-400 dark:text-neutral-500">
                              -
                            </div>
                          )}
                          {booking.actual_check_out_time && (
                            <>
                              <div className="text-sm text-purple-700 dark:text-purple-400 font-medium">
                                เช็คเอ้า: {new Date(booking.actual_check_out_time).toLocaleDateString('th-TH', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </div>
                              <div className="text-xs text-purple-600 dark:text-purple-500">
                                {new Date(booking.actual_check_out_time).toLocaleTimeString('th-TH', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-bold text-green-600 dark:text-green-400">
                          {formatPrice(booking.total_amount || booking.total_price || booking.totalAmount || booking.totalPrice || 0)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(booking.status)}
                          
                          {/* Check-in Status Icon */}
                          {getCheckinStatusIcon(booking)}
                          
                          {/* Cancellation Request Badge */}
                          {getCancellationRequest(booking.id) && (
                            <div className="relative group">
                              <div className="w-7 h-7 bg-gradient-to-br from-orange-100 to-red-200 dark:from-orange-800 dark:to-red-900 rounded-full flex items-center justify-center border-2 border-orange-300 dark:border-orange-600 cursor-pointer animate-pulse"
                                onClick={() => {
                                  const request = getCancellationRequest(booking.id);
                                  setSelectedCancellation(request);
                                  setShowCancellationModal(true);
                                  setAdminNotes('');
                                }}
                              >
                                <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                              </div>
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                ลูกค้าขอยกเลิกการจอง
                              </div>
                            </div>
                          )}
                          
                          {booking.payment_slips && booking.payment_slips.length > 0 && (
                            <div className="relative group">
                              <div className="w-6 h-6 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-800 dark:to-green-900 rounded-full flex items-center justify-center border border-green-300 dark:border-green-600">
                                <Receipt className="h-3 w-3 text-green-600 dark:text-green-400" />
                              </div>
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-neutral-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
                                มีสลีปการชำระเงิน ({booking.payment_slips.length})
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowBookingModal(true);
                            }}
                            className="group relative p-2 rounded-xl bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/30 dark:hover:bg-primary-800/40 text-primary-600 dark:text-primary-400 transition-all duration-200 hover:scale-105"
                            title="ดูรายละเอียดการจอง"
                          >
                            <Eye className="h-4 w-4" />
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-neutral-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              ดูรายละเอียด
                            </div>
                          </button>
                          
                          {canEditBookings(user) && (
                            <button
                              onClick={() => handleEditBooking(booking)}
                              className="group relative p-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-800/40 text-blue-600 dark:text-blue-400 transition-all duration-200 hover:scale-105"
                              title="แก้ไขการจอง"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-neutral-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                แก้ไข
                              </div>
                            </button>
                          )}

                          {/* Check-in/Check-out Button */}
                          {(booking.status === 'confirmed' || booking.status === 'checked_in') && (
                            <button
                              onClick={() => handleCheckinModal(booking)}
                              className="group relative p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-800/40 text-emerald-600 dark:text-emerald-400 transition-all duration-200 hover:scale-105"
                              title="จัดการเช็คอิน/เช็คเอ้า"
                            >
                              <LogIn className="h-4 w-4" />
                              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-neutral-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                เช็คอิน/เช็คเอ้า
                              </div>
                            </button>
                          )}
                          

                          
                          {canManageBookings(user) && booking.status === 'pending' && (
                            <>
                              <button
                                onClick={() => {
                                  setConfirmAction(() => () => handleStatusUpdate(booking.id, 'confirmed'));
                                  setConfirmActionType('success');
                                  setShowConfirmModal(true);
                                }}
                                className="group relative p-2 rounded-xl bg-green-50 hover:bg-green-100 dark:bg-green-900/30 dark:hover:bg-green-800/40 text-green-600 dark:text-green-400 transition-all duration-200 hover:scale-105"
                                title="อนุมัติการจอง"
                              >
                                <CheckCircle className="h-4 w-4" />
                                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-neutral-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                  อนุมัติ
                                </div>
                              </button>
                              <button
                                onClick={() => {
                                  setConfirmAction(() => () => handleStatusUpdate(booking.id, 'cancelled'));
                                  setConfirmActionType('warning');
                                  setShowConfirmModal(true);
                                }}
                                className="group relative p-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-800/40 text-red-600 dark:text-red-400 transition-all duration-200 hover:scale-105"
                                title="ยกเลิกการจอง"
                              >
                                <XCircle className="h-4 w-4" />
                                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-neutral-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                  ยกเลิก
                                </div>
                              </button>
                            </>
                          )}
                          
                          {canDeleteBookings(user).all && (
                            <button
                              onClick={() => {
                                setConfirmAction(() => () => handleDeleteBooking(booking.id));
                                setConfirmActionType('danger');
                                setShowConfirmModal(true);
                              }}
                              className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                              title="ลบการจองถาวร"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile/Tablet Card View */}
            <div className="block lg:hidden space-y-4 p-4">
              {filteredBookings.map((booking, index) => (
                <div key={booking.id} className={`bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-800 dark:to-neutral-900 rounded-2xl p-5 shadow-xl border border-neutral-200 dark:border-neutral-700 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-neutral-900 dark:text-white text-lg">
                          {booking.guest_name || 'ไม่ระบุ'}
                        </h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="px-2 py-1 bg-primary-100 dark:bg-primary-900 rounded-lg">
                            <p className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                              {booking.booking_id || `BK${booking.id}`}
                            </p>
                          </div>
                          {booking.payment_slips && booking.payment_slips.length > 0 && (
                            <div className="px-2 py-1 bg-green-100 dark:bg-green-900 rounded-lg flex items-center space-x-1">
                              <Receipt className="h-3 w-3 text-green-600 dark:text-green-400" />
                              <span className="text-xs font-medium text-green-600 dark:text-green-400">
                                {booking.payment_slips.length}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(booking.status)}
                      
                      {/* Check-in Status Icon for Mobile */}
                      {getCheckinStatusIcon(booking)}
                      
                      {/* Cancellation Request Badge for Mobile */}
                      {getCancellationRequest(booking.id) && (
                        <div className="relative">
                          <button
                            onClick={() => {
                              const request = getCancellationRequest(booking.id);
                              setSelectedCancellation(request);
                              setShowCancellationModal(true);
                              setAdminNotes('');
                            }}
                            className="w-8 h-8 bg-gradient-to-br from-orange-100 to-red-200 dark:from-orange-800 dark:to-red-900 rounded-full flex items-center justify-center border-2 border-orange-300 dark:border-orange-600 animate-pulse"
                          >
                            <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                          </button>
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-black text-white text-xs rounded opacity-100 whitespace-nowrap">
                            ขอยกเลิก
                          </div>
                        </div>
                      )}
                      
                      <button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowBookingModal(true);
                        }}
                        className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                        title="ดูรายละเอียด"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      {canEditBookings(user) && (
                        <button
                          onClick={() => handleEditBooking(booking)}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="แก้ไข"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}

                      {/* Check-in/Check-out Button for Mobile */}
                      {(booking.status === 'confirmed' || booking.status === 'checked_in') && (
                        <button
                          onClick={() => handleCheckinModal(booking)}
                          className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                          title="จัดการเช็คอิน/เช็คเอ้า"
                        >
                          <LogIn className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-neutral-500 dark:text-neutral-400">ห้องพัก:</span>
                      <p className="font-medium text-neutral-900 dark:text-white">
                        {booking.room_type_name || 
                         (typeof booking.room_type === 'object' ? booking.room_type?.name : booking.room_type) || 
                         ''}
                      </p>
                      {booking.hotel_name && (
                        <p className="text-xs text-neutral-400">{booking.hotel_name}</p>
                      )}
                    </div>
                    <div>
                      <span className="text-neutral-500 dark:text-neutral-400">จำนวนเงิน:</span>
                      <p className="font-bold text-green-600 dark:text-green-400">
                        {formatPrice(booking.total_amount || booking.total_price || booking.totalAmount || booking.totalPrice || 0)}
                      </p>
                    </div>
                    <div>
                      <span className="text-neutral-500 dark:text-neutral-400">วันที่จอง:</span>
                      <p className="font-medium text-neutral-900 dark:text-white">
                        {formatDate(booking.check_in_date)} - {formatDate(booking.check_out_date)}
                      </p>
                    </div>
                    <div>
                      <span className="text-neutral-500 dark:text-neutral-400">เวลาจริงที่โรงแรม:</span>
                      {booking.actual_check_in_time ? (
                        <div className="space-y-1">
                          <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                            เช็คอิน: {new Date(booking.actual_check_in_time).toLocaleString('th-TH', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          {booking.actual_check_out_time && (
                            <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                              เช็คเอ้า: {new Date(booking.actual_check_out_time).toLocaleString('th-TH', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-neutral-400 dark:text-neutral-500">
                          ยังไม่ได้เช็คอินที่โรงแรม
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      {booking.guest_email || 'ไม่ระบุอีเมล'}
                    </div>
                    <div className="flex items-center space-x-2">
                      
                      {canManageBookings(user) && booking.status === 'pending' && (
                        <button
                          onClick={() => {
                            setConfirmAction(() => () => handleStatusUpdate(booking.id, 'confirmed'));
                            setConfirmActionType('success');
                            setShowConfirmModal(true);
                          }}
                          className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}

                      {canManageBookings(user) && booking.status !== 'cancelled' && (
                        <button
                          onClick={() => {
                            setConfirmAction(() => () => handleStatusUpdate(booking.id, 'cancelled'));
                            setConfirmActionType('warning');
                            setShowConfirmModal(true);
                          }}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}

                      {canDeleteBookings(user).all && (
                        <button
                          onClick={() => {
                            setConfirmAction(() => () => handleDeleteBooking(booking.id));
                            setConfirmActionType('danger');
                            setShowConfirmModal(true);
                          }}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            </>
          )}
        </div>
      </div>

      {/* Booking Detail Modal */}
      {showBookingModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                รายละเอียดการจอง
              </h3>
              <button
                onClick={() => setShowBookingModal(false)}
                className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                    รหัสการจอง
                  </label>
                  <p className="text-lg font-semibold text-neutral-900 dark:text-white">
                    {selectedBooking.booking_id || `BK${selectedBooking.id}`}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                    สถานะ
                  </label>
                  {getStatusBadge(selectedBooking.status)}
                </div>
              </div>

              {/* Guest Info */}
              <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4">
                <h4 className="font-semibold text-neutral-900 dark:text-white mb-3 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  ข้อมูลผู้เข้าพัก
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      ชื่อ-นามสกุล
                    </label>
                    <p className="text-neutral-900 dark:text-white">{selectedBooking.guest_name || 'ไม่ระบุ'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      อีเมล
                    </label>
                    <p className="text-neutral-900 dark:text-white">{selectedBooking.guest_email || 'ไม่ระบุ'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      เบอร์โทรศัพท์
                    </label>
                    <p className="text-neutral-900 dark:text-white">{selectedBooking.guest_phone || 'ไม่ระบุ'}</p>
                  </div>
                </div>
              </div>

              {/* Booking Details */}
              <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4">
                <h4 className="font-semibold text-neutral-900 dark:text-white mb-3 flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  รายละเอียดการจอง
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      ห้องพัก
                    </label>
                    <p className="text-neutral-900 dark:text-white">
                      {selectedBooking.room_number || ''} {
                        selectedBooking.room_type_name || 
                        (typeof selectedBooking.room_type === 'object' ? selectedBooking.room_type?.name : selectedBooking.room_type) || 
                        ''
                      }
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      จำนวนผู้เข้าพัก
                    </label>
                    <p className="text-neutral-900 dark:text-white">{selectedBooking.guest_count || 1} คน</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      วันที่เข้าพัก
                    </label>
                    <p className="text-neutral-900 dark:text-white">{formatDate(selectedBooking.check_in_date)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      วันที่ออก
                    </label>
                    <p className="text-neutral-900 dark:text-white">{formatDate(selectedBooking.check_out_date)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      จำนวนคืน
                    </label>
                    <p className="text-neutral-900 dark:text-white">
                      {(() => {
                        const checkIn = selectedBooking.check_in_date || selectedBooking.checkInDate;
                        const checkOut = selectedBooking.check_out_date || selectedBooking.checkOutDate;
                        
                        const checkInDate = safeParseDate(checkIn);
                        const checkOutDate = safeParseDate(checkOut);
                        
                        if (!checkInDate || !checkOutDate) return 1;
                        
                        const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
                        return nights > 0 ? nights : 1;
                      })()} คืน
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      จำนวนเงินรวม
                    </label>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">
                      {formatPrice(selectedBooking.total_amount || selectedBooking.totalAmount || selectedBooking.total_price || selectedBooking.totalPrice)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              {selectedBooking.special_requests && (
                <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4">
                  <h4 className="font-semibold text-neutral-900 dark:text-white mb-3 flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    คำขอพิเศษ
                  </h4>
                  <p className="text-neutral-900 dark:text-white">{selectedBooking.special_requests}</p>
                </div>
              )}

              {/* Payment Slips */}
              {selectedBooking.payment_slips && selectedBooking.payment_slips.length > 0 && (
                <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4">
                  <h4 className="font-semibold text-neutral-900 dark:text-white mb-3 flex items-center">
                    <Receipt className="h-5 w-5 mr-2" />
                    หลักฐานการชำระเงิน ({selectedBooking.payment_slips.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedBooking.payment_slips.map((slip, index) => (
                      <div key={slip.id || index} className="border border-neutral-200 dark:border-neutral-600 rounded-lg p-3">
                        <div className="mb-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                              สลีป #{slip.id || index + 1}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              slip.status === 'approved' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                : slip.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                : slip.status === 'rejected'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                            }`}>
                              {slip.status === 'approved' ? 'อนุมัติแล้ว' : 
                               slip.status === 'pending' ? 'รอตรวจสอบ' : 
                               slip.status === 'rejected' ? 'ปฏิเสธ' : 'ไม่ระบุ'}
                            </span>
                          </div>
                          {slip.payment_date && (
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                              วันที่: {formatDate(slip.payment_date)}
                            </p>
                          )}
                          {slip.amount && (
                            <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                              จำนวนเงิน: {formatPrice(slip.amount)}
                            </p>
                          )}
                        </div>
                        
                        {slip.file_path && (
                          <div className="relative group">
                            {/* Check if file is an image */}
                            {(() => {
                              const fileExt = slip.file_path.split('.').pop()?.toLowerCase();
                              const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt);
                              
                              // Create multiple possible image URLs
                              const imageUrls = [
                                `http://localhost:3001/uploads/${slip.file_path}`,
                                `http://localhost:3001/uploads/payment-slips/${slip.file_path}`,
                                `/uploads/${slip.file_path}`,
                                `/uploads/payment-slips/${slip.file_path}`
                              ];
                              
                              if (isImage) {
                                return (
                                  <>
                                    <img
                                      src={imageUrls[0]}
                                      alt={`Payment slip ${slip.id || index + 1}`}
                                      className="w-full h-32 object-cover rounded-md cursor-pointer hover:opacity-80 transition-all duration-200 hover:scale-105 border border-neutral-300 dark:border-neutral-600"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        console.log('🔍 Image clicked, opening modal...');
                                        // Try multiple URLs for the modal
                                        openImageModal(
                                          imageUrls[0],
                                          `หลักฐานการชำระเงิน #${slip.id || index + 1}`
                                        );
                                      }}
                                      onError={(e) => {
                                        console.log('Primary image load error:', slip.file_path, 'trying alternative paths...');
                                        
                                        // Try alternative URLs
                                        let currentUrlIndex = 0;
                                        const tryNextUrl = () => {
                                          currentUrlIndex++;
                                          if (currentUrlIndex < imageUrls.length) {
                                            console.log('Trying URL:', imageUrls[currentUrlIndex]);
                                            e.target.src = imageUrls[currentUrlIndex];
                                          } else {
                                            console.log('All URLs failed, showing fallback');
                                            e.target.style.display = 'none';
                                            e.target.nextElementSibling.style.display = 'flex';
                                          }
                                        };
                                        
                                        e.target.onerror = tryNextUrl;
                                        tryNextUrl();
                                      }}
                                    />
                                    <div className="w-full h-32 bg-neutral-200 dark:bg-neutral-600 rounded-md flex items-center justify-center text-neutral-500 dark:text-neutral-400 border border-neutral-300 dark:border-neutral-600" style={{display: 'none'}}>
                                      <div className="text-center">
                                        <Receipt className="h-8 w-8 mx-auto mb-2" />
                                        <p className="text-xs mb-2">ไม่สามารถแสดงรูปภาพได้</p>
                                        <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-2">
                                          {slip.file_name || slip.file_path}
                                        </p>
                                        <div className="space-y-1">
                                          <button 
                                            className="text-xs text-blue-500 hover:text-blue-700 cursor-pointer hover:underline block"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              // Try opening different URLs
                                              imageUrls.forEach(url => {
                                                window.open(url, '_blank');
                                              });
                                            }}
                                          >
                                            เปิดในหน้าต่างใหม่
                                          </button>
                                          <button 
                                            className="text-xs text-green-500 hover:text-green-700 cursor-pointer hover:underline block"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              // Force zoom modal with different URLs
                                              imageUrls.forEach(url => {
                                                openImageModal(url, `หลักฐานการชำระเงิน #${slip.id || index + 1}`);
                                              });
                                            }}
                                          >
                                            ลองซูมดู
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                    <div 
                                      className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-md flex items-center justify-center cursor-pointer"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        console.log('🔍 Overlay clicked, opening modal...');
                                        openImageModal(
                                          imageUrls[0],
                                          `หลักฐานการชำระเงิน #${slip.id || index + 1}`
                                        );
                                      }}
                                    >
                                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black bg-opacity-50 rounded-full p-2 pointer-events-none">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                        </svg>
                                      </div>
                                      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                        คลิกเพื่อซูม
                                      </div>
                                    </div>
                                  </>
                                );
                              } else {
                                // For non-image files, show a download/view link
                                return (
                                  <div className="w-full h-32 bg-neutral-100 dark:bg-neutral-600 rounded-md flex items-center justify-center text-neutral-600 dark:text-neutral-400 border-2 border-dashed border-neutral-300 dark:border-neutral-500 cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-500 transition-colors">
                                    <div className="text-center" onClick={() => {
                                      // Try multiple URLs for non-image files too
                                      imageUrls.forEach(url => {
                                        window.open(url, '_blank');
                                      });
                                    }}>
                                      <Receipt className="h-8 w-8 mx-auto mb-2" />
                                      <p className="text-xs font-medium mb-1">ไฟล์แนบ</p>
                                      <p className="text-xs text-blue-500 hover:underline">
                                        คลิกเพื่อดู
                                      </p>
                                      <p className="text-xs text-neutral-400 mt-1 truncate max-w-24">
                                        {slip.file_name || slip.file_path}
                                      </p>
                                    </div>
                                  </div>
                                );
                              }
                            })()}
                          </div>
                        )}
                        
                        {slip.file_name && (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 truncate">
                            {slip.file_name}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Receipt (from payment receipt endpoint) */}
              {selectedBooking.payment_receipt_url && (
                <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4">
                  <h4 className="font-semibold text-neutral-900 dark:text-white mb-3 flex items-center">
                    <Receipt className="h-5 w-5 mr-2" />
                    หลักฐานการชำระเงิน (อัปโหลดใหม่)
                  </h4>
                  <div className="border border-neutral-200 dark:border-neutral-600 rounded-lg p-3">
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                          ไฟล์หลักฐาน
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          selectedBooking.payment_status === 'approved' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : selectedBooking.payment_status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                            : selectedBooking.payment_status === 'rejected'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                        }`}>
                          {selectedBooking.payment_status === 'approved' ? 'อนุมัติแล้ว' : 
                           selectedBooking.payment_status === 'pending' ? 'รอตรวจสอบ' : 
                           selectedBooking.payment_status === 'rejected' ? 'ปฏิเสธ' : 'ไม่ระบุ'}
                        </span>
                      </div>
                      
                      {selectedBooking.receipt_uploaded_at && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          อัปโหลดเมื่อ: {formatDate(selectedBooking.receipt_uploaded_at)}
                        </p>
                      )}
                      
                      {selectedBooking.receipt_file_size && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          ขนาดไฟล์: {(selectedBooking.receipt_file_size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      )}
                    </div>
                    
                    <div className="relative group">
                      {(() => {
                        const receiptUrl = selectedBooking.payment_receipt_url;
                        const fileName = selectedBooking.receipt_filename || 'payment-receipt';
                        const fileExt = fileName?.split('.').pop()?.toLowerCase();
                        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt) || receiptUrl.startsWith('data:image/');
                        
                        console.log('🖼️ Receipt URL type:', receiptUrl?.substring(0, 50), 'Is base64:', receiptUrl?.startsWith('data:'));
                        
                        // Check if data seems truncated (base64 should be much longer for real images)
                        const isTruncated = receiptUrl.startsWith('data:') && receiptUrl.length < 10000; // Real images are usually much longer
                        
                        // Create blob URL for base64 data to avoid URL length issues
                        const displayUrl = createBlobUrl(receiptUrl);
                        const canShowImage = displayUrl !== null && isImage && !isTruncated;
                        
                        console.log('🔍 Display URL created:', displayUrl ? 'Success' : 'Failed', 'Can show image:', canShowImage, 'Is truncated:', isTruncated);
                        
                        if (canShowImage) {
                          return (
                            <>
                              <img
                                src={displayUrl}
                                alt="Payment Receipt"
                                className="w-full h-48 object-cover rounded-md cursor-pointer hover:opacity-80 transition-all duration-200 hover:scale-105 border border-neutral-300 dark:border-neutral-600"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('🔍 Payment receipt clicked, opening modal...');
                                  openImageModal(
                                    receiptUrl, // Use original for modal
                                    `หลักฐานการชำระเงิน - ${fileName}`
                                  );
                                }}
                                onError={(e) => {
                                  console.log('❌ Receipt image load error - showing fallback');
                                  e.target.style.display = 'none';
                                  if (e.target.nextElementSibling) {
                                    e.target.nextElementSibling.style.display = 'flex';
                                  }
                                }}
                                onLoad={(e) => {
                                  console.log('✅ Receipt image loaded successfully');
                                }}
                              />
                              <div className="w-full h-48 bg-neutral-200 dark:bg-neutral-600 rounded-md flex items-center justify-center text-neutral-500 dark:text-neutral-400 border border-neutral-300 dark:border-neutral-600" style={{display: 'none'}}>
                                <div className="text-center">
                                  <Receipt className="h-12 w-12 mx-auto mb-2" />
                                  <p className="text-sm mb-2">ไม่สามารถแสดงรูปภาพได้</p>
                                  <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 mb-2">
                                    {fileName}
                                  </p>
                                  <div className="space-y-1">
                                    <button 
                                      className="text-sm text-blue-500 hover:text-blue-700 cursor-pointer hover:underline block"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // For base64 data URLs, create a blob and open it
                                        if (receiptUrl.startsWith('data:')) {
                                          const blobUrl = createBlobUrl(receiptUrl);
                                          window.open(blobUrl, '_blank');
                                        } else {
                                          window.open(receiptUrl, '_blank');
                                        }
                                      }}
                                    >
                                      เปิดในหน้าต่างใหม่
                                    </button>
                                  </div>
                                </div>
                              </div>
                              <div 
                                className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-md flex items-center justify-center cursor-pointer"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('🔍 Receipt overlay clicked, opening modal...');
                                  openImageModal(
                                    receiptUrl,
                                    `หลักฐานการชำระเงิน - ${fileName}`
                                  );
                                }}
                              >
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black bg-opacity-50 rounded-full p-2 pointer-events-none">
                                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                  </svg>
                                </div>
                                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                  คลิกเพื่อซูม
                                </div>
                              </div>
                            </>
                          );
                        } else {
                          // For non-image files, invalid data, truncated data, or fallback
                          return (
                            <div className="w-full h-48 bg-neutral-200 dark:bg-neutral-600 rounded-md flex items-center justify-center text-neutral-500 dark:text-neutral-400 border border-neutral-300 dark:border-neutral-600">
                              <div className="text-center">
                                <Receipt className="h-12 w-12 mx-auto mb-2" />
                                <p className="text-sm mb-2">
                                  {isTruncated ? 'ข้อมูลรูปภาพไม่สมบูรณ์' : !isImage ? 'ไฟล์หลักฐาน' : 'ไม่สามารถแสดงรูปภาพได้'}
                                </p>
                                {isTruncated && (
                                  <p className="text-xs text-red-500 dark:text-red-400 mb-2">
                                    ⚠️ ข้อมูลถูกตัดทอน ต้องอัปโหลดใหม่
                                  </p>
                                )}
                                <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 mb-2">
                                  {fileName}
                                </p>
                                {receiptUrl && (
                                  <div className="space-y-1">
                                    <button 
                                      className="text-sm text-blue-500 hover:text-blue-700 cursor-pointer hover:underline block"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Try to show raw data in new window
                                        const newWindow = window.open();
                                        if (receiptUrl.startsWith('data:')) {
                                          newWindow.document.write(`
                                            <div style="padding: 20px; font-family: Arial, sans-serif;">
                                              <h3>Payment Receipt Data</h3>
                                              <p><strong>File:</strong> ${fileName}</p>
                                              <p><strong>Type:</strong> ${receiptUrl.split(',')[0]}</p>
                                              <hr>
                                              <p>Raw data preview:</p>
                                              <textarea style="width: 100%; height: 200px; font-family: monospace; font-size: 10px;">${receiptUrl.substring(0, 1000)}${receiptUrl.length > 1000 ? '...[truncated]' : ''}</textarea>
                                              <br><br>
                                              <button onclick="navigator.clipboard.writeText('${receiptUrl}')">Copy Full Data</button>
                                            </div>
                                          `);
                                        } else {
                                          newWindow.location.href = receiptUrl;
                                        }
                                      }}
                                    >
                                      เปิดในหน้าต่างใหม่
                                    </button>
                                    <p className="text-xs text-neutral-400">
                                      {receiptUrl.startsWith('data:') ? 'Base64 Data' : 'External URL'}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        }
                      })()}
                    </div>
                    
                    {selectedBooking.receipt_filename && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 truncate">
                        ชื่อไฟล์: {selectedBooking.receipt_filename}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4">
                <h4 className="font-semibold text-neutral-900 dark:text-white mb-3">
                  ข้อมูลระบบ
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      วันที่จอง
                    </label>
                    <p className="text-neutral-900 dark:text-white">{formatDate(selectedBooking.created_at)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      อัปเดตล่าสุด
                    </label>
                    <p className="text-neutral-900 dark:text-white">{formatDate(selectedBooking.updated_at)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Check-in/Check-out Modal */}
      {showCheckinModal && selectedBookingForCheckin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl max-w-lg w-full">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                  จัดการเช็คอิน/เช็คเอ้า
                </h3>
                <button
                  onClick={closeCheckinModal}
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-neutral-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Booking Info */}
              <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4">
                <h4 className="font-semibold text-neutral-900 dark:text-white mb-2">
                  ข้อมูลการจอง #{selectedBookingForCheckin.booking_reference || selectedBookingForCheckin.id}
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">ผู้เข้าพัก:</span>
                    <span className="font-medium text-neutral-900 dark:text-white">
                      {selectedBookingForCheckin.guest_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">วันที่เข้าพัก (กำหนด):</span>
                    <span className="font-medium text-neutral-900 dark:text-white">
                      {formatDate(selectedBookingForCheckin.check_in_date)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">วันที่ออก (กำหนด):</span>
                    <span className="font-medium text-neutral-900 dark:text-white">
                      {formatDate(selectedBookingForCheckin.check_out_date)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">สถานะปัจจุบัน:</span>
                    <span className="font-medium">
                      {getStatusBadge(selectedBookingForCheckin.status)}
                    </span>
                  </div>
                  {selectedBookingForCheckin.actual_check_in_time && (
                    <div className="flex justify-between">
                      <span className="text-neutral-600 dark:text-neutral-400">เช็คอินแล้วเมื่อ:</span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        {new Date(selectedBookingForCheckin.actual_check_in_time).toLocaleString('th-TH')}
                      </span>
                    </div>
                  )}
                  {selectedBookingForCheckin.actual_check_out_time && (
                    <div className="flex justify-between">
                      <span className="text-neutral-600 dark:text-neutral-400">เช็คเอ้าแล้วเมื่อ:</span>
                      <span className="font-medium text-purple-600 dark:text-purple-400">
                        {new Date(selectedBookingForCheckin.actual_check_out_time).toLocaleString('th-TH')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Staff ID (Hidden - auto-filled) */}
              <input type="hidden" value={checkinFormData.staff_id} />

              {/* Check-in Time */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  เวลาเช็คอิน
                </label>
                <input
                  type="datetime-local"
                  value={checkinFormData.checkin_time}
                  onChange={(e) => setCheckinFormData(prev => ({ ...prev, checkin_time: e.target.value }))}
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  disabled={selectedBookingForCheckin?.actual_check_in_time}
                />
                {selectedBookingForCheckin?.actual_check_in_time && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    ✅ เช็คอินแล้วเมื่อ: {new Date(selectedBookingForCheckin.actual_check_in_time).toLocaleString('th-TH')}
                  </p>
                )}
              </div>

              {/* Check-out Time */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  เวลาเช็คเอ้า
                </label>
                <input
                  type="datetime-local"
                  value={checkinFormData.checkout_time}
                  onChange={(e) => setCheckinFormData(prev => ({ ...prev, checkout_time: e.target.value }))}
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  disabled={selectedBookingForCheckin?.actual_check_out_time || !selectedBookingForCheckin?.actual_check_in_time}
                />
                {selectedBookingForCheckin?.actual_check_out_time && (
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                    ✅ เช็คเอ้าแล้วเมื่อ: {new Date(selectedBookingForCheckin.actual_check_out_time).toLocaleString('th-TH')}
                  </p>
                )}
                {!selectedBookingForCheckin?.actual_check_in_time && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    ต้องเช็คอินก่อนจึงจะสามารถกำหนดเวลาเช็คเอ้าได้
                  </p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  หมายเหตุ
                </label>
                <textarea
                  value={checkinFormData.notes}
                  onChange={(e) => setCheckinFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                  placeholder="เพิ่มหมายเหตุ (ถ้ามี)"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-700 rounded-b-2xl">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeCheckinModal}
                  disabled={checkinLoading}
                  className="px-6 py-2 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors disabled:opacity-50"
                >
                  ยกเลิก
                </button>
                
                {/* Check-in Button - only show if not checked in yet */}
                {!selectedBookingForCheckin.actual_check_in_time && (
                  <button
                    onClick={handleCheckin}
                    disabled={checkinLoading}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    {checkinLoading && (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    )}
                    <LogIn className="h-4 w-4" />
                    <span>เช็คอิน</span>
                  </button>
                )}
                
                {/* Check-out Button - only show if checked in but not checked out */}
                {selectedBookingForCheckin.actual_check_in_time && !selectedBookingForCheckin.actual_check_out_time && (
                  <button
                    onClick={handleCheckout}
                    disabled={checkinLoading}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    {checkinLoading && (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    )}
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>เช็คเอ้า</span>
                  </button>
                )}
                
                {/* Already completed message */}
                {selectedBookingForCheckin.actual_check_in_time && selectedBookingForCheckin.actual_check_out_time && (
                  <div className="px-6 py-2 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-lg flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>เช็คอิน/เช็คเอ้าเสร็จสิ้นแล้ว</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Booking Modal */}
      {showEditBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                  แก้ไขการจอง #{selectedBooking?.booking_reference || selectedBooking?.id}
                </h3>
                <button
                  onClick={closeEditModal}
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-neutral-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Guest Information Section */}
              <div>
                <h4 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                  ข้อมูลผู้จอง
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      ชื่อผู้จอง *
                    </label>
                    <input
                      type="text"
                      value={editFormData.guest_name}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, guest_name: e.target.value }))}
                      className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="กรอกชื่อผู้จอง"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      อีเมล *
                    </label>
                    <input
                      type="email"
                      value={editFormData.guest_email}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, guest_email: e.target.value }))}
                      className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="กรอกอีเมล"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      เบอร์โทรศัพท์
                    </label>
                    <input
                      type="tel"
                      value={editFormData.guest_phone}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, guest_phone: e.target.value }))}
                      className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="กรอกเบอร์โทรศัพท์"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      เลขประจำตัวประชาชน
                    </label>
                    <input
                      type="text"
                      value={editFormData.guest_id_number}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, guest_id_number: e.target.value }))}
                      className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="กรอกเลขประจำตัวประชาชน"
                      maxLength="13"
                    />
                  </div>
                </div>
              </div>

              {/* Booking Details Section */}
              <div>
                <h4 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                  รายละเอียดการจอง
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      วันที่เข้าพัก *
                    </label>
                    <input
                      type="date"
                      value={editFormData.check_in_date}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, check_in_date: e.target.value }))}
                      className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      วันที่ออก *
                    </label>
                    <input
                      type="date"
                      value={editFormData.check_out_date}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, check_out_date: e.target.value }))}
                      className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      จำนวนผู้เข้าพัก
                    </label>
                    <select
                      value={editFormData.guests}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, guests: parseInt(e.target.value) }))}
                      className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      {[1,2,3,4,5,6,7,8].map(num => (
                        <option key={num} value={num}>{num} คน</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  ความต้องการพิเศษ
                </label>
                <textarea
                  value={editFormData.special_requests}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, special_requests: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                  placeholder="กรอกความต้องการพิเศษ (ถ้ามี)"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-700 rounded-b-2xl">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeEditModal}
                  disabled={editLoading}
                  className="px-6 py-2 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors disabled:opacity-50"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleUpdateBooking}
                  disabled={editLoading}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {editLoading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  )}
                  <span>{editLoading ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmAction}
        title="ยืนยันการดำเนินการ"
        message="คุณแน่ใจหรือไม่ที่จะดำเนินการนี้?"
        confirmText="ยืนยัน"
        cancelText="ยกเลิก"
        type={confirmActionType}
        isLoading={actionLoading}
      />

      {/* Cancellation Request Management Modal */}
      {showCancellationModal && selectedCancellation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-orange-500" />
                คำขอยกเลิกการจอง #{selectedCancellation.id}
              </h3>
              <button
                onClick={() => setShowCancellationModal(false)}
                className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-neutral-900 dark:text-white">สถานะคำขอ</h4>
                <span className="px-4 py-2 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 rounded-full text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  รอการพิจารณา
                </span>
              </div>

              {/* Booking Details */}
              <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4">
                <h4 className="font-semibold text-neutral-900 dark:text-white mb-3 flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  รายละเอียดการจอง
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="block font-medium text-neutral-600 dark:text-neutral-400 mb-1">การจอง #</label>
                    <p className="text-neutral-900 dark:text-white">{selectedCancellation.booking_id}</p>
                  </div>
                  <div>
                    <label className="block font-medium text-neutral-600 dark:text-neutral-400 mb-1">ผู้จอง</label>
                    <p className="text-neutral-900 dark:text-white">{selectedCancellation.guest_name}</p>
                  </div>
                  <div>
                    <label className="block font-medium text-neutral-600 dark:text-neutral-400 mb-1">อีเมล</label>
                    <p className="text-neutral-900 dark:text-white">{selectedCancellation.guest_email}</p>
                  </div>
                  <div>
                    <label className="block font-medium text-neutral-600 dark:text-neutral-400 mb-1">เบอร์โทร</label>
                    <p className="text-neutral-900 dark:text-white">{selectedCancellation.guest_phone}</p>
                  </div>
                  <div>
                    <label className="block font-medium text-neutral-600 dark:text-neutral-400 mb-1">วันเข้าพัก</label>
                    <p className="text-neutral-900 dark:text-white">{formatDate(selectedCancellation.check_in_date)}</p>
                  </div>
                  <div>
                    <label className="block font-medium text-neutral-600 dark:text-neutral-400 mb-1">วันออก</label>
                    <p className="text-neutral-900 dark:text-white">{formatDate(selectedCancellation.check_out_date)}</p>
                  </div>
                  <div>
                    <label className="block font-medium text-neutral-600 dark:text-neutral-400 mb-1">ห้องพัก</label>
                    <p className="text-neutral-900 dark:text-white">{selectedCancellation.room_type_name || ''}</p>
                  </div>
                  <div>
                    <label className="block font-medium text-neutral-600 dark:text-neutral-400 mb-1">ยอดรวม</label>
                    <p className="text-neutral-900 dark:text-white">{formatPrice(selectedCancellation.total_amount || selectedCancellation.total_price)}</p>
                  </div>
                </div>
              </div>

              {/* Cancellation Details */}
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                <h4 className="font-semibold text-neutral-900 dark:text-white mb-3 flex items-center">
                  <Ban className="h-5 w-5 mr-2" />
                  รายละเอียดการยกเลิก
                </h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <label className="block font-medium text-neutral-600 dark:text-neutral-400 mb-1">วันที่ขอยกเลิก</label>
                    <p className="text-neutral-900 dark:text-white">{formatDate(selectedCancellation.requested_at)}</p>
                  </div>
                  <div>
                    <label className="block font-medium text-neutral-600 dark:text-neutral-400 mb-1">เหตุผลจากลูกค้า</label>
                    <p className="text-neutral-900 dark:text-white bg-white dark:bg-neutral-800 p-3 rounded border">
                      {selectedCancellation.reason || 'ไม่ระบุเหตุผล'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Admin Action Section */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h4 className="font-semibold text-neutral-900 dark:text-white mb-3">
                  ดำเนินการ
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                      หมายเหตุจากแอดมิน (ไม่บังคับ)
                    </label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="เพิ่มหมายเหตุเกี่ยวกับการตัดสินใจ (ถ้ามี)"
                    />
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => processCancellationRequest(selectedCancellation.id, 'approved')}
                      disabled={processingCancellation}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      {processingCancellation ? 'กำลังดำเนินการ...' : 'อนุมัติการยกเลิก'}
                    </button>
                    <button
                      onClick={() => processCancellationRequest(selectedCancellation.id, 'rejected')}
                      disabled={processingCancellation}
                      className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      {processingCancellation ? 'กำลังดำเนินการ...' : 'ปฏิเสธการยกเลิก'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
