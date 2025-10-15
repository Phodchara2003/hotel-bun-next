'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslation } from '../../translations';
import { useRouter } from 'next/navigation';
import api, { bookingAPI } from '../../lib/api';
import { Calendar, Users, CreditCard, X, Check, Clock, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal';


// Helper function สำหรับแก้ไข timezone issue และรองรับทั้ง ISO string และ YYYY-MM-DD
const formatDateSafe = (dateString) => {
  if (!dateString) return '';
  let date;
  // ถ้าเป็น ISO string (มี T)
  if (typeof dateString === 'string' && dateString.includes('T')) {
    date = new Date(dateString);
    if (isNaN(date.getTime())) return 'วันที่ไม่ถูกต้อง';
  } else if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    // ถ้าเป็น YYYY-MM-DD
    const [year, month, day] = dateString.split('-').map(Number);
    date = new Date(year, month - 1, day);
    if (isNaN(date.getTime())) return 'วันที่ไม่ถูกต้อง';
  } else {
    // fallback
    date = new Date(dateString);
    if (isNaN(date.getTime())) return 'วันที่ไม่ถูกต้อง';
  }
  return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
};

const formatDateInputSafe = (dateString) => {
  if (!dateString) return '';
  
  try {
    let date;
    // ถ้าเป็น ISO string (มี T)
    if (typeof dateString === 'string' && dateString.includes('T')) {
      date = new Date(dateString);
    } else if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      // ถ้าเป็น YYYY-MM-DD แล้ว return เลย
      return dateString;
    } else {
      // fallback
      date = new Date(dateString);
    }
    
    if (isNaN(date.getTime())) return '';
    
    // แปลงเป็น YYYY-MM-DD format
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error formatting date for input:', error);
    return '';
  }
};

export default function BookingsPage() {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, confirmed, cancelled
  const [cancellationRequests, setCancellationRequests] = useState([]); // เก็บข้อมูล cancellation requests
  const [cancelModal, setCancelModal] = useState({ 
    isOpen: false, 
    bookingId: null, 
    bookingRef: '', 
    roomName: '', 
    hotelName: '',
    checkInDate: '',
    checkOutDate: '',
    totalPrice: 0,
    nights: 0
  });
  const [editDateModal, setEditDateModal] = useState({
    isOpen: false,
    bookingId: null,
    currentCheckIn: '',
    currentCheckOut: '',
    newCheckIn: '',
    newCheckOut: '',
    roomPrice: 0,
    currentNights: 0,
    currentTotalPrice: 0
  });

  const fetchBookings = async () => {
    setLoading(true); // เริ่ม loading
    try {
      console.log('🔍 Fetching user bookings for user ID:', user?.id);
      
      // Use api directly to send user_id parameter
      const response = await api.get('/bookings', {
        params: {
          user_id: user?.id
        }
      });
      
      console.log('📊 Raw response:', response.data);
      
      // Handle the backend response format: {success: true, count: number, data: [...]}
      let bookingsData = [];
      if (response.data.success && response.data.data) {
        bookingsData = response.data.data;
      } else if (response.data.bookings) {
        bookingsData = response.data.bookings;
      } else if (Array.isArray(response.data)) {
        bookingsData = response.data;
      }
      
      console.log('✅ Processed bookings data:', bookingsData);
      
      // Fix price calculation for each booking
      const fixedBookingsData = bookingsData.map(booking => {
        // Check if we need to recalculate price
        const checkIn = booking.check_in_date || booking.checkInDate || booking.checkin_date;
        const checkOut = booking.check_out_date || booking.checkOutDate || booking.checkout_date;
        
        if (checkIn && checkOut) {
          const checkInDate = new Date(checkIn);
          const checkOutDate = new Date(checkOut);
          const calculatedNights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
          const roomPrice = parseFloat(booking.room_price || 600); // Default to 600 if not set
          const calculatedTotalPrice = calculatedNights * roomPrice;
          
          // Update booking with correct calculations
          return {
            ...booking,
            nights: calculatedNights,
            room_price: roomPrice,
            total_price: calculatedTotalPrice,
            // Keep existing totalPrice as fallback
            totalPrice: calculatedTotalPrice
          };
        }
        
        return booking;
      });
      
      // Filter out bookings where check-in date has passed
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0); // Set to start of day for comparison
      
      const activeBookings = fixedBookingsData.filter(booking => {
        // Only filter if booking is not completed or cancelled
        if (booking.status === 'completed' || booking.status === 'cancelled') {
          return true; // Show completed/cancelled bookings for history
        }
        
        // Try different possible field names for check-in date
        const checkInDateValue = booking.check_in_date || booking.checkInDate || booking.checkin_date;
        if (!checkInDateValue) {
          return true; // Keep booking if no check-in date found
        }
        
        const checkInDate = new Date(checkInDateValue);
        checkInDate.setHours(0, 0, 0, 0);
        
        // Show all bookings for now - don't filter by date
        console.log('📋 Setting bookings data:', fixedBookingsData);
        return true;
      });
      
      console.log('📋 Setting fixed bookings data:', fixedBookingsData);
      setBookings(fixedBookingsData);
      
      // Fetch cancellation requests
      await fetchCancellationRequests();
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('ไม่สามารถโหลดข้อมูลการจองได้');
      setBookings([]); // ตั้งค่าเป็น array ว่างในกรณี error
    } finally {
      setLoading(false); // หยุด loading ในทุกกรณี
    }
  };

  const fetchCancellationRequests = async () => {
    try {
      console.log('📋 Fetching cancellation requests...');
      const response = await bookingAPI.getCancellationRequests();
      
      let cancellationData = [];
      if (response.success && response.data) {
        cancellationData = response.data;
      } else if (response.cancellationRequests) {
        cancellationData = response.cancellationRequests;
      } else if (Array.isArray(response)) {
        cancellationData = response;
      }
      
      console.log('📋 Cancellation requests data:', cancellationData);
      setCancellationRequests(cancellationData);
    } catch (error) {
      console.error('Error fetching cancellation requests:', error);
      // Don't show error toast for this as it's not critical
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchBookings();
      
      // Auto refresh every 30 seconds to check for status updates
      const interval = setInterval(() => {
        fetchBookings();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, filter]);

  const handleCancelBooking = async (bookingId) => {
    try {
      await bookingAPI.cancelBooking(bookingId);
      toast.success('ส่งคำขอยกเลิกการจองเรียบร้อยแล้ว รอการอนุมัติจากแอดมิน', {
        duration: 5000
      });
      await fetchBookings(); // Refresh list
      await fetchCancellationRequests(); // Refresh cancellation requests
      setCancelModal({ 
        isOpen: false, 
        bookingId: null, 
        bookingRef: '', 
        roomName: '', 
        hotelName: '',
        checkInDate: '',
        checkOutDate: '',
        totalPrice: 0,
        nights: 0
      });
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || 'ไม่สามารถส่งคำขอยกเลิกการจองได้';
      toast.error(message);
    }
  };

  const openCancelModal = async (booking) => {
    try {
      console.log('🔍 Fetching fresh booking data for ID:', booking.id);
      
      // Fetch fresh booking data from database by ID
      const response = await bookingAPI.getBookingById(booking.id);
      let freshBookingData = null;
      
      if (response.success && response.data) {
        freshBookingData = response.data;
      } else if (response.booking) {
        freshBookingData = response.booking;
      } else {
        freshBookingData = response;
      }
      
      if (!freshBookingData) {
        console.log('❌ Could not find fresh booking data, using existing data');
        freshBookingData = booking;
      }
      
      console.log('🔍 Fresh booking data from database:', freshBookingData);
      console.log('🔍 Fresh booking keys:', Object.keys(freshBookingData));
      
      // Format dates properly
      const formatDate = (dateString) => {
        if (!dateString) return 'ไม่ระบุ';
        try {
          const date = new Date(dateString);
          return date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        } catch (error) {
          console.log('❌ Date format error:', error);
          return dateString;
        }
      };
      
      const modalData = { 
        isOpen: true, 
        bookingId: freshBookingData.id,
        bookingRef: freshBookingData.bookingReference || freshBookingData.booking_reference || freshBookingData.bookingRef || `#${freshBookingData.id}`,
        roomName: freshBookingData.roomTypeName || freshBookingData.room_type_name || freshBookingData.roomName || freshBookingData.room_name || 'ไม่ระบุ',
        hotelName: freshBookingData.hotelName || freshBookingData.hotel_name || freshBookingData.hotelname || 'โรงแรมวรุณภัฏ',
        checkInDate: formatDate(freshBookingData.checkInDate || freshBookingData.check_in_date || freshBookingData.checkin_date || freshBookingData.checkIn),
        checkOutDate: formatDate(freshBookingData.checkOutDate || freshBookingData.check_out_date || freshBookingData.checkout_date || freshBookingData.checkOut),
        totalPrice: freshBookingData.totalPrice || freshBookingData.total_price || freshBookingData.price || freshBookingData.totalAmount || 0,
        nights: freshBookingData.nights || freshBookingData.total_nights || freshBookingData.totalNights || 1
      };
      
      console.log('🔍 Modal data being set from fresh data:', modalData);
      setCancelModal(modalData);
      
    } catch (error) {
      console.error('❌ Error fetching fresh booking data:', error);
      toast.error('ไม่สามารถโหลดข้อมูลการจองได้');
      
      // Fallback to existing data if API call fails
      console.log('🔄 Falling back to existing booking data:', booking);
      const formatDate = (dateString) => {
        if (!dateString) return 'ไม่ระบุ';
        try {
          const date = new Date(dateString);
          return date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        } catch (error) {
          return dateString;
        }
      };
      
      const modalData = { 
        isOpen: true, 
        bookingId: booking.id,
        bookingRef: booking.bookingReference || booking.booking_reference || `#${booking.id}`,
        roomName: booking.roomTypeName || booking.room_type_name || booking.roomName || 'ไม่ระบุ',
        hotelName: booking.hotelName || booking.hotel_name || 'โรงแรมวรุณภัฏ',
        checkInDate: formatDate(booking.checkInDate || booking.check_in_date || booking.checkin_date),
        checkOutDate: formatDate(booking.checkOutDate || booking.check_out_date || booking.checkout_date),
        totalPrice: booking.totalPrice || booking.total_price || booking.price || 0,
        nights: booking.nights || booking.total_nights || 1
      };
      
      setCancelModal(modalData);
    }
  };

  const openEditDateModal = (booking) => {
    const checkIn = booking.check_in_date || booking.checkInDate || booking.checkin_date;
    const checkOut = booking.check_out_date || booking.checkOutDate || booking.checkout_date;
    
    console.log('📝 Opening edit modal for booking:', booking);
    console.log('📊 Booking price fields:', {
      room_price: booking.room_price,
      roomPrice: booking.roomPrice,
      price_per_night: booking.price_per_night,
      total_price: booking.total_price,
      totalPrice: booking.totalPrice,
      nights: booking.nights
    });
    
    // Try to get room price from multiple fields
    const roomPrice = parseFloat(
      booking.room_price || 
      booking.roomPrice || 
      booking.price_per_night ||
      (booking.total_price && booking.nights ? booking.total_price / booking.nights : 0) ||
      (booking.totalPrice && booking.nights ? booking.totalPrice / booking.nights : 0) ||
      300 // Default fallback price
    );
    
    const currentNights = parseInt(booking.nights || 0);
    const currentTotalPrice = parseFloat(booking.total_price || booking.totalPrice || 0);
    
    console.log('💰 Calculated room price:', roomPrice);
    console.log('🏨 Current nights:', currentNights);
    console.log('💵 Current total price:', currentTotalPrice);
    
    setEditDateModal({
      isOpen: true,
      bookingId: booking.id,
      currentCheckIn: checkIn ? formatDateInputSafe(checkIn) : '',
      currentCheckOut: checkOut ? formatDateInputSafe(checkOut) : '',
      newCheckIn: checkIn ? formatDateInputSafe(checkIn) : '',
      newCheckOut: checkOut ? formatDateInputSafe(checkOut) : '',
      roomPrice: roomPrice,
      currentNights: currentNights,
      currentTotalPrice: currentTotalPrice
    });
  };

  const closeEditDateModal = () => {
    setEditDateModal({
      isOpen: false,
      bookingId: null,
      currentCheckIn: '',
      currentCheckOut: '',
      newCheckIn: '',
      newCheckOut: '',
      roomPrice: 0,
      currentNights: 0,
      currentTotalPrice: 0
    });
  };

  // Calculate new price based on new dates
  const calculateNewPrice = () => {
    if (!editDateModal.newCheckIn || !editDateModal.newCheckOut || editDateModal.roomPrice <= 0) {
      return { nights: 0, totalPrice: 0 };
    }
    
    const checkInDate = new Date(editDateModal.newCheckIn);
    const checkOutDate = new Date(editDateModal.newCheckOut);
    
    if (checkOutDate <= checkInDate) {
      return { nights: 0, totalPrice: 0 };
    }
    
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const totalPrice = nights * editDateModal.roomPrice;
    
    return { nights, totalPrice };
  };

  const newPriceCalculation = calculateNewPrice();
  const hasDateChanged = editDateModal.newCheckIn !== editDateModal.currentCheckIn || 
                        editDateModal.newCheckOut !== editDateModal.currentCheckOut;
  const priceDifference = newPriceCalculation.totalPrice - editDateModal.currentTotalPrice;

  const handleUpdateDates = async () => {
    // ตรวจสอบข้อมูลเบื้องต้น
    if (!editDateModal.newCheckIn || !editDateModal.newCheckOut) {
      toast.error('กรุณาเลือกวันที่เข้าพักและออกให้ครบถ้วน');
      return;
    }

    const checkInDate = new Date(editDateModal.newCheckIn);
    const checkOutDate = new Date(editDateModal.newCheckOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ตรวจสอบความถูกต้องของวันที่
    if (checkInDate < today) {
      toast.error('วันที่เข้าพักต้องเป็นวันนี้หรือหลังจากนี้');
      return;
    }

    if (checkOutDate <= checkInDate) {
      toast.error('วันที่ออกต้องหลังจากวันที่เข้าพัก');
      return;
    }

    // ตรวจสอบว่ามีการเปลี่ยนแปลงหรือไม่
    if (editDateModal.newCheckIn === editDateModal.currentCheckIn && 
        editDateModal.newCheckOut === editDateModal.currentCheckOut) {
      toast.error('ไม่มีการเปลี่ยนแปลงวันที่');
      return;
    }

    try {
      // แสดง loading state
      const loadingToast = toast.loading('กำลังตรวจสอบและอัพเดทวันที่...');
      
      console.log('🔄 Updating booking dates:', {
        bookingId: editDateModal.bookingId,
        newCheckIn: editDateModal.newCheckIn,
        newCheckOut: editDateModal.newCheckOut
      });

      const response = await api.put(`/bookings/${editDateModal.bookingId}`, {
        check_in_date: editDateModal.newCheckIn,
        check_out_date: editDateModal.newCheckOut,
        action: 'update_dates' // เพิ่ม action เพื่อระบุประเภทการอัพเดท
      });

      toast.dismiss(loadingToast);

      console.log('📊 Update dates response:', response.data);

      if (response.data.success) {
        const updatedData = response.data.data;
        
        // Update the booking in local state immediately
        setBookings(prevBookings => 
          prevBookings.map(booking => 
            booking.id === editDateModal.bookingId 
              ? {
                  ...booking,
                  check_in_date: updatedData.check_in_date,
                  check_out_date: updatedData.check_out_date,
                  nights: updatedData.nights,
                  total_price: updatedData.total_price,
                  updated_at: updatedData.updated_at
                }
              : booking
          )
        );
        
        toast.success(
          `แก้ไขวันที่เข้าพักสำเร็จ!\n• จำนวนคืน: ${updatedData.nights} คืน\n• ราคารวมใหม่: ฿${updatedData.total_price.toLocaleString()}\n${priceDifference !== 0 ? `• ${priceDifference > 0 ? 'เพิ่มขึ้น' : 'ลดลง'}: ฿${Math.abs(priceDifference).toLocaleString()}` : ''}`,
          {
            duration: 4000,
            icon: '✅',
            style: {
              background: '#f0fdf4',
              color: '#15803d',
              border: '1px solid #bbf7d0'
            }
          }
        );
        
        // Refresh bookings data
        await fetchBookings();
        
        // Close modal
        closeEditDateModal();
      } else {
        throw new Error(response.data.message || 'ไม่สามารถแก้ไขวันที่ได้');
      }
    } catch (error) {
      console.error('❌ Error updating dates:', error);
      
      let errorMessage = 'เกิดข้อผิดพลาดในการแก้ไขวันที่';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 409) {
        errorMessage = 'ไม่มีห้องว่างในวันที่ที่เลือก กรุณาเลือกวันที่อื่น';
      } else if (error.response?.status === 403) {
        errorMessage = 'ไม่สามารถแก้ไขการจองนี้ได้ (อาจได้รับการยืนยันแล้ว)';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, {
        duration: 4000,
        icon: '❌'
      });
    }
  };

  const closeCancelModal = () => {
    setCancelModal({ 
      isOpen: false, 
      bookingId: null, 
      bookingRef: '', 
      roomName: '', 
      hotelName: '',
      checkInDate: '',
      checkOutDate: '',
      totalPrice: 0,
      nights: 0
    });
  };

  // Check if booking has pending cancellation request
  const hasPendingCancellationRequest = (bookingId) => {
    return cancellationRequests.some(
      request => request.booking_id === bookingId && request.status === 'pending'
    );
  };

  // Check if booking can be cancelled (check-in date hasn't passed)
  const canCancelBooking = (booking) => {
    if (booking.status === 'cancelled' || booking.status === 'completed') {
      return false;
    }
    
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    // Try different possible field names for check-in date
    const checkInDateValue = booking.check_in_date || booking.checkInDate || booking.checkin_date;
    if (!checkInDateValue) {
      console.warn('No check-in date found for booking:', booking);
      return false;
    }
    
    const checkInDate = new Date(checkInDateValue);
    checkInDate.setHours(0, 0, 0, 0);
    
    // Debug log
    console.log('Booking ID:', booking.id, 'Check-in date:', checkInDate, 'Current date:', currentDate, 'Can cancel:', checkInDate >= currentDate);
    
    return checkInDate >= currentDate;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'confirmed':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status, paymentStatus) => {
    switch (status) {
      case 'pending':
        if (paymentStatus === 'slip_uploaded') {
          return 'รอการอนุมัติ (ส่งสลิปแล้ว)';
        }
        return 'รอการยืนยัน';
      case 'confirmed':
        return 'จองสำเร็จ'; // เมื่อแอดมินอนุมัติแล้ว = การจองสำเร็จ
      case 'cancelled':
        return 'ยกเลิกแล้ว';
      case 'completed':
        return 'เสร็จสิ้น';
      default:
        return status;
    }
  };

  // Show loading while auth is checking
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">กรุณาเข้าสู่ระบบเพื่อดูการจองของคุณ</p>
          <a href="/login" className="mt-4 inline-block btn-primary">เข้าสู่ระบบ</a>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">กรุณาเข้าสู่ระบบ</h2>
          <p className="text-gray-600">เพื่อดูการจองของคุณ</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto container-padding">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">การจองของฉัน</h1>
          <p className="text-gray-600">จัดการและติดตามการจองโรงแรมของคุณ</p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'all', label: 'ทั้งหมด' },
                { key: 'pending', label: 'รอยืนยัน' },
                { key: 'confirmed', label: 'ยืนยันแล้ว' },
                { key: 'cancelled', label: 'ยกเลิกแล้ว' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    filter === tab.key
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {filter === 'all' ? 'ไม่มีการจองที่แสดงได้' : `ไม่มีการจอง${getStatusText(filter)}`}
            </h3>
            <p className="text-gray-500">
              {filter === 'all' 
                ? 'การจองที่เลยวันที่เช็คอินแล้วจะไม่แสดงในรายการ' 
                : 'เริ่มจองโรงแรมเพื่อเริ่มต้นการเดินทางของคุณ'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {booking.hotel_name || booking.hotelName || 'โรงแรม'}
                      </h3>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                        <span className="ml-1">{getStatusText(booking.status, booking.payment_status || booking.paymentStatus)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-4 relative group">
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <Calendar className="h-4 w-4 mr-1" />
                        วันที่เข้าพัก
                      </div>
                      <div className="font-semibold text-gray-900">
                        {formatDateSafe(booking.check_in_date || booking.checkInDate || booking.checkin_date)}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <Calendar className="h-4 w-4 mr-1" />
                        วันที่ออก
                      </div>
                      <div className="font-semibold text-gray-900">
                        {formatDateSafe(booking.check_out_date || booking.checkOutDate || booking.checkout_date)}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <Users className="h-4 w-4 mr-1" />
                        จำนวนผู้เข้าพัก
                      </div>
                      <div className="font-semibold text-gray-900">
                        {booking.guests} คน
                      </div>
                    </div>
                  </div>

                  {/* Room Details & Assignment */}
                  <div className="bg-blue-50 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-900">{booking.room_type_name || booking.roomTypeName}</div>
                        <div className="text-sm text-gray-600">รหัสการจอง: {booking.booking_reference || booking.bookingReference}</div>
                      </div>
                      {(booking.room_number || booking.floor) && (
                        <div className="bg-white rounded-lg p-3">
                          <div className="flex items-center space-x-4">
                            <div className="text-center">
                              <div className="text-sm text-gray-600">หมายเลขห้อง</div>
                              <div className="text-lg font-bold text-blue-600">
                                {booking.room_number || 'กำลังจัดสรร'}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm text-gray-600">ชั้น</div>
                              <div className="text-lg font-bold text-blue-600">
                                {booking.floor ? `${booking.floor}` : 'กำลังจัดสรร'}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-600">ราคารวม</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary-600">
                        ฿{(booking.total_price || booking.totalPrice || 0).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">รวมทั้งหมด</div>
                    </div>
                  </div>

                  {/* Status Info */}
                  {hasPendingCancellationRequest(booking.id) && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                        <p className="text-orange-800 text-sm font-medium">⏳ คำขอยกเลิกการจองรอการอนุมัติ</p>
                        <p className="text-orange-600 text-xs mt-1">ส่งคำขอยกเลิกแล้ว กรุณารอการตอบกลับจากแอดมิน</p>
                      </div>
                    </div>
                  )}
                  {booking.status === 'pending' && !hasPendingCancellationRequest(booking.id) && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="bg-yellow-50 p-3 rounded-lg">
                        <p className="text-yellow-800 text-sm font-medium">⏳ รอการยืนยันจากผู้ดูแลระบบ</p>
                        <p className="text-yellow-600 text-xs mt-1">การจองจะได้รับการตอบกลับภายใน 24 ชั่วโมง</p>
                      </div>
                    </div>
                  )}
                  {/* Removed confirmation message as requested */}

                  {/* Actions */}
                  {(booking.status === 'pending' || booking.status === 'confirmed') ? (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      {booking.status === 'pending' && (
                        <div className="flex justify-end space-x-3 mb-3">
                          {/* แสดงปุ่มชำระเงินและอัพโหลดสลิปสำหรับ pending bookings */}
                          {!booking.paymentStatus || booking.paymentStatus === 'pending' ? (
                            <>
                              <button
                                onClick={() => window.open(`/payment/${booking.id}`, '_blank')}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                              >
                                <CreditCard className="h-4 w-4 mr-2" />
                                ดู QR Code
                              </button>
                              <button
                                onClick={() => window.open(`/payment/${booking.id}/slip`, '_blank')}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                              >
                                📸 อัพโหลดสลิป
                              </button>
                            </>
                          ) : booking.paymentStatus === 'slip_uploaded' ? (
                            <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm">
                              ✅ ส่งสลิปแล้ว รอการอนุมัติ
                            </span>
                          ) : (
                            <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm">
                              ⏳ รอการอนุมัติจากแอดมิน
                            </span>
                          )}
                        </div>
                      )}
                      {booking.status === 'confirmed' && (
                        <div className="flex justify-end space-x-3 mb-3">
                          {/* การจองสำเร็จแล้ว - แสดงข้อความยืนยัน */}
                          <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm">
                            🎉 การจองสำเร็จแล้ว
                          </span>
                        </div>
                      )}
                      
                      {/* Show cancel button only if booking can be cancelled */}
                      {(() => {
                        const canCancel = canCancelBooking(booking);
                        console.log(`Booking ${booking.id}: canCancel = ${canCancel}, status = ${booking.status}`);
                        return canCancel;
                      })() ? (
                        <div className="flex justify-end gap-3">
                          {/* Edit Date Button */}
                          {booking.status === 'pending' && (
                            <button
                              onClick={() => openEditDateModal(booking)}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all duration-200"
                              title="แก้ไขวันที่เข้าพัก"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              แก้ไขวันที่
                            </button>
                          )}
                          
                          {/* Cancel Booking Button */}
                          {hasPendingCancellationRequest(booking.id) ? (
                            <button
                              disabled
                              className="flex items-center gap-2 px-4 py-2 border border-orange-300 text-orange-700 bg-orange-50 rounded-lg cursor-not-allowed opacity-75"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              รอการอนุมัติ
                            </button>
                          ) : (
                            <button
                              onClick={() => openCancelModal(booking)}
                              className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 hover:border-red-400 transition-all duration-200"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              ยกเลิกการจอง
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="bg-orange-50 p-3 rounded-lg">
                          <p className="text-orange-800 text-sm font-medium">🏨 ถึงวันเช็คอินแล้ว</p>
                          <p className="text-orange-600 text-xs mt-1">หากต้องการยกเลิกการจอง กรุณาติดต่อโรงแรมโดยตรง</p>
                        </div>
                      )}
                    </div>
                  ) : booking.status === 'completed' ? (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="bg-green-50 p-3 rounded-lg mb-3">
                        <p className="text-green-800 text-sm font-medium">✅ การจองสำเร็จแล้ว</p>
                        <p className="text-green-600 text-xs mt-1">การจองได้รับการอนุมัติจากผู้ดูแลระบบแล้ว</p>
                      </div>
                      
                      {/* Review Button - Show only if check-out date has passed */}
                      {(() => {
                        const checkOutDate = new Date(booking.check_out_date || booking.checkOutDate);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0); // Reset time to start of day
                        checkOutDate.setHours(23, 59, 59, 999); // Set to end of check-out day
                        
                        return checkOutDate < today;
                      })() && (
                        <div className="flex justify-end">
                          <button
                            onClick={() => router.push(`/bookings/${booking.id}/review`)}
                            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                          >
                            <Star className="h-4 w-4" />
                            เขียนรีวิว
                          </button>
                        </div>
                      )}
                    </div>
                  ) : null}

                  {/* Review Button for Confirmed Bookings */}
                  {booking.status === 'confirmed' && (() => {
                    const checkInDate = new Date(booking.check_in_date || booking.checkInDate);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    checkInDate.setHours(0, 0, 0, 0);
                    
                    // Allow review from check-in date onwards
                    return today >= checkInDate;
                  })() && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="bg-amber-50 p-3 rounded-lg mb-3">
                        <p className="text-amber-800 text-sm font-medium">⭐ สามารถเขียนรีวิวได้แล้ว</p>
                        <p className="text-amber-600 text-xs mt-1">แบ่งปันประสบการณ์การเข้าพักของคุณ</p>
                      </div>
                      
                      <div className="flex justify-end">
                        <button
                          onClick={() => router.push(`/bookings/${booking.id}/review`)}
                          className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                        >
                          <Star className="h-4 w-4" />
                          เขียนรีวิว
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cancel Booking Modal */}
        <ConfirmModal
          isOpen={cancelModal.isOpen}
          onClose={closeCancelModal}
          onConfirm={() => handleCancelBooking(cancelModal.bookingId)}
          title="ยกเลิกการจอง"
          message={
            <div className="space-y-4">
              <p className="text-gray-800 text-base font-medium">คุณต้องการส่งคำขอยกเลิกการจองนี้หรือไม่?</p>
              
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h4 className="text-blue-800 font-semibold mb-3">รายละเอียดการจอง</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">โรงแรม:</span>
                    <span className="text-gray-800 font-semibold">{cancelModal.hotelName || 'ไม่ระบุ'}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">ห้องพัก:</span>
                    <span className="text-gray-800 font-semibold">{cancelModal.roomName || 'ไม่ระบุ'}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">รหัสการจอง:</span>
                    <span className="text-blue-700 font-bold">{cancelModal.bookingRef || 'ไม่ระบุ'}</span>
                  </div>
                  
                  <hr className="border-blue-200"/>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">วันเช็คอิน:</span>
                    <span className="text-gray-800 font-semibold">{cancelModal.checkInDate || 'ไม่ระบุ'}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">วันเช็คเอาท์:</span>
                    <span className="text-gray-800 font-semibold">{cancelModal.checkOutDate || 'ไม่ระบุ'}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">จำนวนคืน:</span>
                    <span className="text-gray-800 font-semibold">{cancelModal.nights || 0} คืน</span>
                  </div>
                  
                  <hr className="border-blue-200"/>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">ราคารวม:</span>
                    <span className="text-green-600 font-bold text-lg">
                      {cancelModal.totalPrice ? `${cancelModal.totalPrice.toLocaleString()} บาท` : 'ไม่ระบุ'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-300 p-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-yellow-600 text-lg">📋</span>
                  <div>
                    <p className="text-yellow-800 font-semibold text-sm">หมายเหตุ:</p>
                    <p className="text-yellow-700 text-sm mt-1">
                      คำขอยกเลิกจะถูกส่งไปยังแอดมินเพื่อพิจารณาอนุมัติ<br/>
                      ท่านจะได้รับการแจ้งเตือนเมื่อมีการตอบกลับ
                    </p>
                  </div>
                </div>
              </div>
            </div>
          }
          confirmText="ส่งคำขอยกเลิก"
          cancelText="กลับ"
          type="danger"
        />

        {/* Edit Date Modal */}
        {editDateModal.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-auto">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    แก้ไขวันที่เข้าพัก
                  </h3>
                  <button
                    onClick={closeEditDateModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6">
                <div className="space-y-6">
                  {/* Current Dates Display */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-sm font-medium text-blue-800 mb-2">📅 วันที่ปัจจุบัน</div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-blue-600">เข้าพัก:</span>
                        <div className="font-semibold text-blue-900">{formatDateSafe(editDateModal.currentCheckIn)}</div>
                      </div>
                      <div>
                        <span className="text-blue-600">ออก:</span>
                        <div className="font-semibold text-blue-900">{formatDateSafe(editDateModal.currentCheckOut)}</div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <div className="flex justify-between items-center">
                        <span className="text-blue-600 text-sm">ราคาปัจจุบัน:</span>
                        <div className="text-right">
                          <div className="text-blue-900 font-bold text-lg">฿{editDateModal.currentTotalPrice.toLocaleString()}</div>
                          <div className="text-blue-600 text-xs">{editDateModal.currentNights} คืน × ฿{editDateModal.roomPrice.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* New Dates Input */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        🗓️ วันที่เข้าพักใหม่
                      </label>
                      <input
                        type="date"
                        value={editDateModal.newCheckIn}
                        onChange={(e) => setEditDateModal(prev => ({ ...prev, newCheckIn: e.target.value }))}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        🏨 วันที่ออกใหม่
                      </label>
                      <input
                        type="date"
                        value={editDateModal.newCheckOut}
                        onChange={(e) => setEditDateModal(prev => ({ ...prev, newCheckOut: e.target.value }))}
                        min={editDateModal.newCheckIn || new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base"
                      />
                    </div>
                  </div>

                  {/* New Price Calculation */}
                  {hasDateChanged && newPriceCalculation.nights > 0 && (
                    <div className={`border rounded-lg p-4 ${
                      priceDifference > 0 ? 'bg-orange-50 border-orange-200' : 
                      priceDifference < 0 ? 'bg-green-50 border-green-200' : 
                      'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="text-sm font-medium mb-2 flex items-center gap-2">
                        {priceDifference > 0 ? (
                          <>
                            <span className="text-orange-600">📈</span>
                            <span className="text-orange-800">ราคาใหม่ (เพิ่มขึ้น)</span>
                          </>
                        ) : priceDifference < 0 ? (
                          <>
                            <span className="text-green-600">📉</span>
                            <span className="text-green-800">ราคาใหม่ (ลดลง)</span>
                          </>
                        ) : (
                          <>
                            <span className="text-gray-600">📊</span>
                            <span className="text-gray-800">ราคาใหม่ (ไม่เปลี่ยนแปลง)</span>
                          </>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="text-sm">
                          <div className="text-gray-600">{newPriceCalculation.nights} คืน × ฿{editDateModal.roomPrice.toLocaleString()}</div>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold text-lg ${
                            priceDifference > 0 ? 'text-orange-700' : 
                            priceDifference < 0 ? 'text-green-700' : 
                            'text-gray-700'
                          }`}>
                            ฿{newPriceCalculation.totalPrice.toLocaleString()}
                          </div>
                          {priceDifference !== 0 && (
                            <div className={`text-sm font-medium ${
                              priceDifference > 0 ? 'text-orange-600' : 'text-green-600'
                            }`}>
                              {priceDifference > 0 ? '+' : ''}฿{priceDifference.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                <div className="flex gap-3">
                  <button
                    onClick={closeEditDateModal}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleUpdateDates}
                    disabled={!editDateModal.newCheckIn || !editDateModal.newCheckOut || 
                             (editDateModal.newCheckIn === editDateModal.currentCheckIn && 
                              editDateModal.newCheckOut === editDateModal.currentCheckOut)}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center justify-center gap-2"
                  >
                    {editDateModal.newCheckIn === editDateModal.currentCheckIn && 
                     editDateModal.newCheckOut === editDateModal.currentCheckOut ? 
                     'ไม่มีการเปลี่ยนแปลง' : 
                     <>
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                       </svg>
                       บันทึกการเปลี่ยนแปลง
                     </>
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
