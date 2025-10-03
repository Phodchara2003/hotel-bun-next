'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Users, MapPin, Star, User, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { notificationAPI } from '@/lib/api';
import ClientOnly from '../../components/ClientOnly';

export default function BookingStepPage() {
  return (
    <ClientOnly fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูลการจอง...</p>
        </div>
      </div>
    }>
      <BookingStepContent />
    </ClientOnly>
  );
}

function BookingStepContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [selectedRoom, setSelectedRoom] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityData, setAvailabilityData] = useState(null);
  const [errors, setErrors] = useState({});
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [bookingForm, setBookingForm] = useState({
    checkIn: '',
    checkOut: '',
    guests: 1,
    guestName: user?.name || '',
    guestEmail: user?.email || '',
    guestPhone: '',
    guestNationalId: ''
  });

  // รับ roomId จาก URL
  const roomId = searchParams.get('roomId');

  useEffect(() => {
    fetchHotelsAndRooms();
  }, []);

  // Auto-fill profile data when user is authenticated and page loaded
  useEffect(() => {
    if (user && isAuthenticated && !loading) {
      // Small delay to ensure all data is loaded
      const timer = setTimeout(() => {
        loadUserProfile();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [user, isAuthenticated, loading]);

  useEffect(() => {
    if (roomId && roomTypes.length > 0) {
      const room = roomTypes.find(r => r.id === parseInt(roomId));
      console.log('🏠 Selected room in booking-step:', room);
      console.log('🖼️ Room images:', room?.images);
      console.log('🔍 Room bed_type:', room?.bed_type);
      console.log('📋 All room fields:', Object.keys(room || {}));
      setSelectedRoom(room);
    }
  }, [roomId, roomTypes]);

  const fetchHotelsAndRooms = async () => {
    try {
      setLoading(true);
      
      const hotelsRes = await fetch('http://localhost:3001/api/hotels');
      const hotelsData = await hotelsRes.json();
      
      const roomsRes = await fetch(`http://localhost:3001/api/room-types-with-images?t=${Date.now()}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      const roomsData = await roomsRes.json();
      
      if (hotelsData.success) {
        setHotels(hotelsData.data);
      }
      
      if (roomsData.success) {
        setRoomTypes(roomsData.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load profile data for autofill
  const loadUserProfile = async () => {
    if (!isAuthenticated) return;
    
    setProfileLoading(true);
    try {
      // ตรวจสอบ token จากหลายแหล่ง
      let token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];
      
      // ถ้าไม่มี token ใน cookie ให้ลองหาใน localStorage
      if (!token && typeof window !== 'undefined') {
        token = localStorage.getItem('auth_token_persistent') || 
                localStorage.getItem('auth_token_backup');
      }

      if (!token) {
        console.warn('No token found for profile loading');
        toast.error('ไม่พบข้อมูลการยืนยันตัวตน กรุณาเข้าสู่ระบบใหม่');
        return;
      }

      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const profile = data?.profile || {};
        
        console.log('📝 Loading profile data for booking-step form:', profile);
        
        // อัปเดตข้อมูลฟอร์มจากโปรไฟล์
        const updatedFormData = {
          ...bookingForm,
          guestName: `${profile?.firstName || profile?.first_name || ''} ${profile?.lastName || profile?.last_name || ''}`.trim() || user?.name || '',
          guestEmail: profile?.email || user?.email || '',
          guestPhone: profile?.phone || user?.phone || '',
          guestNationalId: profile?.nationalId || profile?.national_id || ''
        };
        
        setBookingForm(updatedFormData);
        
        console.log('✅ Booking-step auto-fill completed with data:', updatedFormData);

        toast.success('ดึงข้อมูลจากโปรไฟล์เรียบร้อย', {
          duration: 2000,
          icon: '👤'
        });
      } else if (response.status === 401) {
        // Token หมดอายุ
        toast.error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
        router.push('/login');
      } else {
        // Fallback to user context data
        console.log('📝 Using user context data for booking-step form');
        const fallbackData = {
          ...bookingForm,
          guestName: user?.name || '',
          guestEmail: user?.email || '',
          guestPhone: user?.phone || ''
        };
        
        setBookingForm(fallbackData);
        toast.success('ใช้ข้อมูลผู้ใช้พื้นฐาน', {
          duration: 2000,
          icon: '👤'
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      // Fallback to user context data
      const fallbackData = {
        ...bookingForm,
        guestName: user?.name || '',
        guestEmail: user?.email || '',
        guestPhone: user?.phone || ''
      };
      
      setBookingForm(fallbackData);
      toast.error('เกิดข้อผิดพลาดในการดึงข้อมูลโปรไฟล์');
    } finally {
      setProfileLoading(false);
    }
  };

  const getPrice = (room) => {
    return room.price_per_night || room.pricePerNight || room.price || 1500;
  };

  // Image modal functions
  const openImageModal = (imageIndex = 0) => {
    setCurrentImageIndex(imageIndex);
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setCurrentImageIndex(0);
  };

  const nextImage = () => {
    if (selectedRoom?.images?.length > 0) {
      setCurrentImageIndex((prev) => 
        prev >= selectedRoom.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const previousImage = () => {
    if (selectedRoom?.images?.length > 0) {
      setCurrentImageIndex((prev) => 
        prev <= 0 ? selectedRoom.images.length - 1 : prev - 1
      );
    }
  };

  // Handle keyboard navigation
  const handleKeyPress = (e) => {
    if (!showImageModal) return;
    
    if (e.key === 'Escape') {
      closeImageModal();
    } else if (e.key === 'ArrowRight') {
      nextImage();
    } else if (e.key === 'ArrowLeft') {
      previousImage();
    }
  };

  // Add keyboard event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [showImageModal, selectedRoom?.images?.length]);

  const calculateTotal = () => {
    if (!selectedRoom || !bookingForm.checkIn || !bookingForm.checkOut) return 0;
    
    const checkIn = new Date(bookingForm.checkIn);
    const checkOut = new Date(bookingForm.checkOut);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    
    return Math.max(1, nights) * getPrice(selectedRoom);
  };

  // Check room availability
  const checkRoomAvailability = async (roomTypeId, checkIn, checkOut) => {
    if (!roomTypeId || !checkIn || !checkOut) return;
    
    try {
      console.log('🔍 Checking availability for:', { roomTypeId, checkIn, checkOut });
      setAvailabilityLoading(true);
      const response = await notificationAPI.checkAvailability(roomTypeId, checkIn, checkOut);
      console.log('📋 Availability response:', response);
      
      if (response.success) {
        console.log('✅ Setting availability data:', response.data);
        setAvailabilityData(response.data);
        
        if (!response.data.isAvailable) {
          console.log('❌ Room not available');
          toast.error('ช่วงเวลาที่เลือกไม่ว่าง กรุณาเลือกวันที่อื่น');
          setErrors(prev => ({
            ...prev,
            availability: 'ช่วงเวลาที่เลือกไม่ว่าง กรุณาเลือกวันที่อื่น'
          }));
        } else {
          console.log('✅ Room available');
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.availability;
            return newErrors;
          });
          toast.success('ช่วงเวลาที่เลือกว่าง สามารถจองได้');
        }
      } else {
        console.log('❌ API response not successful:', response);
      }
    } catch (error) {
      console.error('❌ Error checking availability:', error);
      toast.error('เกิดข้อผิดพลาดในการตรวจสอบห้องว่าง');
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const handleFormChange = (field, value) => {
    setBookingForm(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }

    // Check availability when dates change
    if ((field === 'checkIn' || field === 'checkOut') && selectedRoom) {
      console.log('📅 Date changed:', field, value, 'selectedRoom:', selectedRoom?.id);
      const newForm = { ...bookingForm, [field]: value };
      if (newForm.checkIn && newForm.checkOut && new Date(newForm.checkOut) > new Date(newForm.checkIn)) {
        console.log('⏱️ Will check availability in 500ms');
        // Debounce availability check
        setTimeout(() => {
          console.log('🚀 Starting availability check');
          checkRoomAvailability(selectedRoom.id, newForm.checkIn, newForm.checkOut);
        }, 500);
      } else {
        console.log('❌ Date validation failed:', { checkIn: newForm.checkIn, checkOut: newForm.checkOut });
      }
    } else {
      console.log('❌ Date change conditions not met:', { field, selectedRoom: selectedRoom?.id });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Check if room is selected
    if (!selectedRoom) {
      newErrors.room = 'กรุณาเลือกห้องพัก';
    }

    // Check dates
    if (!bookingForm.checkIn) {
      newErrors.checkIn = 'กรุณาเลือกวันที่เข้าพัก';
    }
    
    if (!bookingForm.checkOut) {
      newErrors.checkOut = 'กรุณาเลือกวันที่ออก';
    }
    
    if (bookingForm.checkIn && bookingForm.checkOut) {
      const checkInDate = new Date(bookingForm.checkIn);
      const checkOutDate = new Date(bookingForm.checkOut);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (checkInDate < today) {
        newErrors.checkIn = 'วันที่เข้าพักต้องเป็นวันนี้หรือวันถัดไป';
      }
      
      if (checkOutDate <= checkInDate) {
        newErrors.checkOut = 'วันที่ออกต้องหลังจากวันที่เข้าพัก';
      }
    }

    // Check guest information
    if (!bookingForm.guestName?.trim()) {
      newErrors.guestName = 'กรุณากรอกชื่อผู้เข้าพัก';
    } else if (bookingForm.guestName.trim().length < 2) {
      newErrors.guestName = 'ชื่อผู้เข้าพักต้องมีอย่างน้อย 2 ตัวอักษร';
    }
    
    if (!bookingForm.guestEmail?.trim()) {
      newErrors.guestEmail = 'กรุณากรอกอีเมล';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(bookingForm.guestEmail.trim())) {
        newErrors.guestEmail = 'รูปแบบอีเมลไม่ถูกต้อง';
      }
    }
    
    if (!bookingForm.guestPhone?.trim()) {
      newErrors.guestPhone = 'กรุณากรอกเบอร์โทรศัพท์';
    } else {
      const phoneRegex = /^[0-9]{10}$/;
      const cleanPhone = bookingForm.guestPhone.replace(/[-\s]/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        newErrors.guestPhone = 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลักเท่านั้น';
      } else if (!cleanPhone.startsWith('0')) {
        newErrors.guestPhone = 'เบอร์โทรศัพท์ต้องขึ้นต้นด้วย 0';
      }
    }

    // Check national ID
    if (!bookingForm.guestNationalId?.trim()) {
      newErrors.guestNationalId = 'กรุณากรอกเลขที่บัตรประจำตัวประชาชน';
    } else {
      const nationalIdRegex = /^[0-9]{13}$/;
      const cleanNationalId = bookingForm.guestNationalId.replace(/[-\s]/g, '');
      if (!nationalIdRegex.test(cleanNationalId)) {
        newErrors.guestNationalId = 'เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก';
      }
      // ไม่ต้องตรวจสอบ checksum - เช็คแค่ 13 หลักเท่านั้น
    }

    // Check guests number
    if (selectedRoom && bookingForm.guests > selectedRoom.max_guests) {
      newErrors.guests = `จำนวนผู้เข้าพักไม่เกิน ${selectedRoom.max_guests} คน`;
    }

    // Check authentication
    if (!user?.id) {
      newErrors.auth = 'กรุณาเข้าสู่ระบบก่อนทำการจอง';
    }

    // Check room availability
    if (availabilityData && !availabilityData.isAvailable) {
      newErrors.availability = 'ช่วงเวลาที่เลือกไม่ว่าง กรุณาเลือกวันที่อื่น';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProceedToPayment = async () => {
    // Validate form first
    if (!validateForm()) {
      // Scroll to first error
      const firstErrorField = document.querySelector('.error-field');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    try {
      setSubmitting(true);
      
      const total = calculateTotal();
      const hotel = hotels.find(h => h.id === selectedRoom.hotel_id) || { id: 1 };

      // ตรวจสอบ bed_type ก่อนส่งข้อมูล
      if (!selectedRoom.bed_type) {
        console.error('❌ bed_type is missing from selectedRoom:', selectedRoom);
        setErrors({ submit: 'ข้อมูลประเภทเตียงไม่ครบถ้วน กรุณาเลือกห้องใหม่' });
        return;
      }

      // สร้างการจองในฐานข้อมูล
      const bookingData = {
        user_id: user.id,
        hotel_id: hotel.id,
        bed_type: selectedRoom.bed_type, // ใช้ bed_type แทน room_type_id
        check_in_date: bookingForm.checkIn,
        check_out_date: bookingForm.checkOut,
        guests: bookingForm.guests,
        guest_name: bookingForm.guestName.trim(),
        guest_email: bookingForm.guestEmail.trim(),
        guest_phone: bookingForm.guestPhone.trim(),
        guest_national_id: bookingForm.guestNationalId.replace(/[-\s]/g, '').trim(),
        total_price: total,
        room_name: selectedRoom.name, // เพิ่มชื่อห้องสำหรับการแจ้งเตือน
        hotel_name: hotel.name // เพิ่มชื่อโรงแรมสำหรับการแจ้งเตือน
      };

      console.log('Sending booking data:', bookingData);
      console.log('🔍 bed_type value:', bookingData.bed_type);

      const response = await fetch('http://localhost:3001/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Check if data has booking ID
        const bookingId = result.data?.id || result.data?.insertId || (Array.isArray(result.data) ? null : null);
        
        if (bookingId) {
          // ไปหน้าชำระเงินพร้อม booking ID
          const paymentUrl = `/payment-step?` + new URLSearchParams({
            bookingId: bookingId,
            roomName: selectedRoom.name,
            hotelName: hotel.name,
            checkIn: bookingForm.checkIn,
            checkOut: bookingForm.checkOut,
            guests: bookingForm.guests,
            guestName: bookingForm.guestName,
            guestEmail: bookingForm.guestEmail,
            guestPhone: bookingForm.guestPhone,
            guestNationalId: bookingForm.guestNationalId,
            total: total
          }).toString();

          router.push(paymentUrl);
        } else {
          setErrors({ submit: 'ไม่สามารถสร้าง ID การจองได้ กรุณาลองใหม่' });
        }
      } else {
        // จัดการข้อผิดพลาดเฉพาะกรณีห้องไม่ว่าง
        if (result.error === 'ROOM_NOT_AVAILABLE') {
          setErrors({ 
            availability: result.message || 'ห้องไม่ว่างในช่วงเวลาที่เลือก กรุณาเลือกวันที่อื่น' 
          });
          
          // อัปเดตสถานะห้องว่างด้วย
          if (result.availability) {
            setAvailabilityData(result.availability);
          }
          
          toast.error('ห้องไม่ว่างในช่วงเวลาที่เลือก กรุณาเลือกวันที่อื่น');
        } else {
          setErrors({ submit: result.message || 'เกิดข้อผิดพลาดในการสร้างการจอง' });
        }
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      setErrors({ submit: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (!selectedRoom) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">เลือกห้องพัก</h1>
            <p className="text-gray-600 mb-6">กรุณาเลือกห้องพักจากหน้าแรก</p>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
            >
              กลับไปหน้าแรก
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hotel = hotels.find(h => h.id === selectedRoom.hotel_id) || { name: 'โรงแรม', address: '', rating: 4.5 };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Image Zoom Modal */}
      {showImageModal && selectedRoom?.images && selectedRoom.images.length > 0 && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={closeImageModal}
        >
          <div className="relative max-w-4xl max-h-full">
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
              src={`/images/rooms/${selectedRoom.images[currentImageIndex]}`}
              alt={`${selectedRoom.name} - รูปที่ ${currentImageIndex + 1}`}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              onError={(e) => {
                if (!e.target.dataset.fallbackUsed) {
                  e.target.dataset.fallbackUsed = 'true';
                  e.target.src = "/images/rooms/placeholder.svg";
                }
              }}
            />

            {/* Navigation Arrows */}
            {selectedRoom.images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    previousImage();
                  }}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full p-3 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full p-3 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Image Counter */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-full text-sm">
              {currentImageIndex + 1} / {selectedRoom.images.length}
            </div>

            {/* Image Thumbnails */}
            {selectedRoom.images.length > 1 && (
              <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex space-x-2 max-w-full overflow-x-auto">
                {selectedRoom.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
                    className={`flex-shrink-0 w-12 h-12 rounded overflow-hidden border-2 transition-all ${
                      index === currentImageIndex 
                        ? 'border-white shadow-lg' 
                        : 'border-gray-400 hover:border-white opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={`/images/rooms/${image}`}
                      alt={`รูปที่ ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        if (!e.target.dataset.fallbackUsed) {
                          e.target.dataset.fallbackUsed = 'true';
                          e.target.src = "/images/rooms/placeholder.svg";
                        }
                      }}
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Keyboard Hints */}
            <div className="absolute top-4 left-4 text-white text-sm bg-black bg-opacity-50 px-3 py-2 rounded">
              <div>ESC: ปิด</div>
              {selectedRoom.images.length > 1 && <div>← →: เปลี่ยนรูป</div>}
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">จองห้องพัก</h1>
          <p className="text-gray-600">ขั้นตอนที่ 1: กรอกข้อมูลการจอง</p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Room Details */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">ห้องพักที่เลือก</h2>
              
              {/* Room Images Gallery */}
              <div className="mb-4">
                {selectedRoom.images && Array.isArray(selectedRoom.images) && selectedRoom.images.length > 0 ? (
                  <div className="space-y-3">
                    {/* Main Image */}
                    <div className="relative group cursor-pointer" onClick={() => openImageModal(0)}>
                      <img
                        src={`/images/rooms/${selectedRoom.images[0]}`}
                        alt={`${selectedRoom.name} - รูปที่ 1`}
                        className="w-full h-64 object-cover rounded-lg shadow-sm transition-transform duration-200 group-hover:scale-105"
                        onLoad={() => {
                          console.log('✅ Booking step main image loaded:', selectedRoom.images?.[0]);
                        }}
                        onError={(e) => {
                          console.log('❌ Booking step main image failed:', selectedRoom.images?.[0]);
                          if (!e.target.dataset.fallbackUsed) {
                            e.target.dataset.fallbackUsed = 'true';
                            e.target.src = "/images/rooms/placeholder.svg";
                          }
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all duration-200 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                        </div>
                      </div>
                      {selectedRoom.images.length > 1 && (
                        <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm">
                          1/{selectedRoom.images.length}
                        </div>
                      )}
                    </div>
                    
                    {/* Additional Images */}
                    {selectedRoom.images.length > 1 && (
                      <div className="grid grid-cols-3 gap-2">
                        {selectedRoom.images.slice(1).map((image, index) => (
                          <div key={index + 1} className="relative group cursor-pointer">
                            <img
                              src={`/images/rooms/${image}`}
                              alt={`${selectedRoom.name} - รูปที่ ${index + 2}`}
                              className="w-full h-20 object-cover rounded transition-all duration-200 hover:opacity-80 group-hover:scale-105"
                              onLoad={() => {
                                console.log(`✅ Booking step thumbnail ${index + 2} loaded:`, image);
                              }}
                              onError={(e) => {
                                console.log(`❌ Booking step thumbnail ${index + 2} failed:`, image);
                                if (!e.target.dataset.fallbackUsed) {
                                  e.target.dataset.fallbackUsed = 'true';
                                  e.target.src = "/images/rooms/placeholder.svg";
                                }
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                // Option 1: Open zoom modal
                                openImageModal(index + 1);
                                
                                // Option 2: Swap main image (uncomment if you want this instead)
                                /*
                                const newImages = [...selectedRoom.images];
                                [newImages[0], newImages[index + 1]] = [newImages[index + 1], newImages[0]];
                                setSelectedRoom(prev => ({
                                  ...prev,
                                  images: newImages
                                }));
                                */
                              }}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded transition-all duration-200 flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Image count indicator with zoom hint */}
                    <div className="text-center text-sm text-gray-500 flex items-center justify-center gap-2">
                      <span>{selectedRoom.images.length} รูปภาพ</span>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">คลิกเพื่อซูม</span>
                    </div>
                  </div>
                ) : (
                  <img
                    src="/images/rooms/placeholder.svg"
                    alt={selectedRoom.name}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                )}
              </div>

              <h3 className="text-xl font-semibold text-blue-600 mb-2">{selectedRoom.name}</h3>
              <p className="text-gray-600 mb-4">{selectedRoom.description}</p>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>{hotel.name}</span>
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  <span>รองรับได้สูงสุด {selectedRoom.max_guests} คน</span>
                </div>
                <div className="flex items-center">
                  <Star className="w-4 h-4 mr-2 text-yellow-500" />
                  <span>คะแนน {hotel.rating}/5</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">ราคาต่อคืน</span>
                  <span className="text-2xl font-bold text-green-600">
                    ฿{getPrice(selectedRoom).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Booking Form */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">ข้อมูลการจอง</h2>
              
              {/* Show general errors */}
              {(errors.room || errors.auth || errors.submit) && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-red-800 text-sm space-y-1">
                    {errors.room && <div>• {errors.room}</div>}
                    {errors.auth && <div>• {errors.auth}</div>}
                    {errors.submit && <div>• {errors.submit}</div>}
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                {/* Check-in & Check-out */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      วันที่เข้าพัก <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={bookingForm.checkIn}
                      onChange={(e) => handleFormChange('checkIn', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.checkIn ? 'border-red-300 error-field' : 'border-gray-300'
                      }`}
                      required
                    />
                    {errors.checkIn && <p className="text-red-500 text-sm mt-1">{errors.checkIn}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      วันที่ออก <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={bookingForm.checkOut}
                      onChange={(e) => handleFormChange('checkOut', e.target.value)}
                      min={bookingForm.checkIn || new Date().toISOString().split('T')[0]}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.checkOut ? 'border-red-300 error-field' : 'border-gray-300'
                      }`}
                      required
                    />
                    {errors.checkOut && <p className="text-red-500 text-sm mt-1">{errors.checkOut}</p>}
                  </div>
                </div>

                {/* Availability Status */}
                {bookingForm.checkIn && bookingForm.checkOut && selectedRoom && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      สถานะห้องพัก
                    </h4>
                    
                    {availabilityLoading ? (
                      <div className="flex items-center text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        กำลังตรวจสอบความพร้อม...
                      </div>
                    ) : availabilityData ? (
                      <div className="space-y-3">
                        <div className={`flex items-center ${availabilityData.isAvailable && availabilityData.availableRooms > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {availabilityData.isAvailable && availabilityData.availableRooms > 0 ? (
                            <CheckCircle className="w-5 h-5 mr-2" />
                          ) : (
                            <XCircle className="w-5 h-5 mr-2" />
                          )}
                          <span className="font-medium">
                            {availabilityData.isAvailable && availabilityData.availableRooms > 0 
                              ? 'ว่าง - สามารถจองได้' 
                              : 'ไม่ว่าง - กรุณาเลือกวันที่อื่น'
                            }
                          </span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Number of Guests */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    จำนวนผู้เข้าพัก <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={bookingForm.guests}
                    onChange={(e) => handleFormChange('guests', parseInt(e.target.value))}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.guests ? 'border-red-300 error-field' : 'border-gray-300'
                    }`}
                  >
                    {[...Array(selectedRoom.max_guests)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1} คน
                      </option>
                    ))}
                  </select>
                  {errors.guests && <p className="text-red-500 text-sm mt-1">{errors.guests}</p>}
                </div>

                {/* Guest Information */}
                <div className="border-t pt-4">
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900">ข้อมูลผู้เข้าพัก</h4>
                    {isAuthenticated && (
                      <div className="flex items-center gap-2 text-sm mt-1">
                        {profileLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                            <span className="text-blue-600">กำลังดึงข้อมูลจากโปรไฟล์...</span>
                          </>
                        ) : (
                          <span className="text-green-600">ข้อมูลถูกดึงจากโปรไฟล์อัตโนมัติ</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อผู้เข้าพัก <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={bookingForm.guestName}
                    onChange={(e) => handleFormChange('guestName', e.target.value)}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.guestName ? 'border-red-300 error-field' : 'border-gray-300'
                    }`}
                    placeholder="กรอกชื่อเต็ม"
                    required
                  />
                  {errors.guestName && <p className="text-red-500 text-sm mt-1">{errors.guestName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    อีเมล <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={bookingForm.guestEmail}
                    onChange={(e) => handleFormChange('guestEmail', e.target.value)}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.guestEmail ? 'border-red-300 error-field' : 'border-gray-300'
                    }`}
                    placeholder="example@email.com"
                    required
                  />
                  {errors.guestEmail && <p className="text-red-500 text-sm mt-1">{errors.guestEmail}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={bookingForm.guestPhone}
                    onChange={(e) => {
                      // Allow only numbers and limit to 10 digits
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                      handleFormChange('guestPhone', value);
                    }}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.guestPhone ? 'border-red-300 error-field' : 'border-gray-300'
                    }`}
                    placeholder="0812345678"
                    maxLength="10"
                    pattern="[0-9]{10}"
                    required
                  />
                  {errors.guestPhone && <p className="text-red-500 text-sm mt-1">{errors.guestPhone}</p>}
                  <p className="text-gray-500 text-xs mt-1">
                    กรอกตัวเลข 10 หลักเท่านั้น {bookingForm.guestPhone && (
                      <span className="text-blue-600 font-mono">
                        ({bookingForm.guestPhone.length}/10 หลัก)
                      </span>
                    )}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    เลขที่บัตรประจำตัวประชาชน <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={bookingForm.guestNationalId}
                    onChange={(e) => {
                      // Allow only numbers and limit to 13 digits
                      const value = e.target.value.replace(/\D/g, '').slice(0, 13);
                      handleFormChange('guestNationalId', value);
                    }}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.guestNationalId ? 'border-red-300 error-field' : 'border-gray-300'
                    }`}
                    placeholder=""
                    maxLength="13"
                    pattern="[0-9]{13}"
                    required
                  />
                  {errors.guestNationalId && <p className="text-red-500 text-sm mt-1">{errors.guestNationalId}</p>}
                  <p className="text-gray-500 text-xs mt-1">
                    กรอกตัวเลข 13 หลักเท่านั้น {bookingForm.guestNationalId && (
                      <span className="text-blue-600 font-mono">
                        ({bookingForm.guestNationalId.length}/13 หลัก)
                      </span>
                    )}
                  </p>
                </div>

                {/* Total Calculation */}
                {bookingForm.checkIn && bookingForm.checkOut && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-2">สรุปการจอง</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>จำนวนคืน:</span>
                        <span>{Math.max(1, Math.ceil((new Date(bookingForm.checkOut) - new Date(bookingForm.checkIn)) / (1000 * 60 * 60 * 24)))} คืน</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ราคาต่อคืน:</span>
                        <span>฿{getPrice(selectedRoom).toLocaleString()}</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between font-bold text-lg">
                        <span>รวมทั้งหมด:</span>
                        <span className="text-green-600">฿{calculateTotal().toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-4">
                  <button
                    onClick={() => router.push('/')}
                    disabled={submitting}
                    className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← กลับหน้าแรก
                  </button>
                  
                  <button
                    onClick={handleProceedToPayment}
                    disabled={submitting}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        กำลังบันทึก...
                      </>
                    ) : (
                      'ดำเนินการชำระเงิน →'
                    )}
                  </button>
                </div>

                {/* Required Fields Note */}
                <div className="text-sm text-gray-500 text-center pt-2">
                  <span className="text-red-500">*</span> ข้อมูลที่จำเป็นต้องกรอก
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}