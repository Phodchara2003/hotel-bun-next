'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Users, Bed, MapPin, ArrowRight, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function BookingPage() {
  const router = useRouter();
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityResults, setAvailabilityResults] = useState(null);
  const [selectedRoomType, setSelectedRoomType] = useState(null);
  
  const [bookingCriteria, setBookingCriteria] = useState({
    checkIn: '',
    checkOut: '',
    guests: 1
  });

  useEffect(() => {
    fetchRoomTypes();
  }, []);

  const fetchRoomTypes = async () => {
    try {
      setLoading(true);
      console.log('🏨 Fetching room types...');
      
      const response = await fetch('http://localhost:3001/api/room-types');
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Room types loaded:', data.data);
        setRoomTypes(data.data);
      } else {
        console.error('❌ Failed to load room types:', data.message);
        toast.error('ไม่สามารถโหลดข้อมูลประเภทห้องพักได้');
      }
    } catch (error) {
      console.error('❌ Error fetching room types:', error);
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingCriteria(prev => ({
      ...prev,
      [name]: name === 'guests' ? parseInt(value) : value
    }));
  };

  const validateBookingCriteria = () => {
    const errors = {};
    
    if (!bookingCriteria.checkIn) {
      errors.checkIn = 'กรุณาเลือกวันที่เข้าพัก';
    }
    
    if (!bookingCriteria.checkOut) {
      errors.checkOut = 'กรุณาเลือกวันที่ออก';
    }
    
    if (bookingCriteria.checkIn && bookingCriteria.checkOut) {
      const checkInDate = new Date(bookingCriteria.checkIn);
      const checkOutDate = new Date(bookingCriteria.checkOut);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (checkInDate < today) {
        errors.checkIn = 'วันที่เข้าพักต้องเป็นวันนี้หรือหลังจากนี้';
      }
      
      if (checkOutDate <= checkInDate) {
        errors.checkOut = 'วันที่ออกต้องหลังจากวันที่เข้าพัก';
      }
    }
    
    if (bookingCriteria.guests < 1 || bookingCriteria.guests > 10) {
      errors.guests = 'จำนวนผู้เข้าพักต้องอยู่ระหว่าง 1-10 คน';
    }
    
    return errors;
  };

  const checkRoomAvailability = async (roomType) => {
    const errors = validateBookingCriteria();
    if (Object.keys(errors).length > 0) {
      Object.values(errors).forEach(error => toast.error(error));
      return;
    }

    try {
      setCheckingAvailability(true);
      setSelectedRoomType(roomType);
      console.log('🔍 Checking availability for room type:', roomType.name);

      const response = await fetch('http://localhost:3001/api/check-availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room_type_id: roomType.id,
          check_in: bookingCriteria.checkIn,
          check_out: bookingCriteria.checkOut,
          guests: bookingCriteria.guests
        }),
      });

      const data = await response.json();
      console.log('📋 Availability response:', data);

      if (data.success) {
        setAvailabilityResults(data.data);
        
        if (data.data.isAvailable) {
          toast.success(`มีห้องว่าง ${data.data.availableRooms} ห้อง จากทั้งหมด ${data.data.totalRooms} ห้อง`);
        } else {
          toast.error('ไม่มีห้องว่างในช่วงเวลาที่เลือก');
        }
      } else {
        toast.error(data.message || 'เกิดข้อผิดพลาดในการตรวจสอบ');
        setAvailabilityResults(null);
      }
    } catch (error) {
      console.error('❌ Error checking availability:', error);
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
      setAvailabilityResults(null);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const proceedToBooking = () => {
    if (!selectedRoomType || !availabilityResults?.isAvailable) {
      toast.error('กรุณาเลือกประเภทห้องพักที่มีห้องว่าง');
      return;
    }

    const bookingParams = new URLSearchParams({
      roomId: selectedRoomType.id,
      checkIn: bookingCriteria.checkIn,
      checkOut: bookingCriteria.checkOut,
      guests: bookingCriteria.guests
    });

    router.push(`/booking-step?${bookingParams.toString()}`);
  };

  const calculateNights = () => {
    if (!bookingCriteria.checkIn || !bookingCriteria.checkOut) return 0;
    const checkIn = new Date(bookingCriteria.checkIn);
    const checkOut = new Date(bookingCriteria.checkOut);
    const timeDiff = checkOut.getTime() - checkIn.getTime();
    return Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('th-TH').format(price);
  };

  const getBedTypeText = (bedType) => {
    switch (bedType) {
      case 'single': return 'เตียงเดี่ยว';
      case 'double': return 'เตียงคู่';
      case 'twin': return 'เตียงแฝด';
      case 'king': return 'เตียงคิงส์ไซส์';
      case 'queen': return 'เตียงควีนส์ไซส์';
      default: return bedType || 'ไม่ระบุ';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูลประเภทห้องพัก...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            จองห้องพัก
          </h1>
          <p className="text-gray-600">
            เลือกประเภทห้องพักและตรวจสอบความพร้อมใช้งาน
          </p>
        </div>

        {/* Booking Criteria Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            ข้อมูลการจอง
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                วันที่เข้าพัก
              </label>
              <input
                type="date"
                name="checkIn"
                value={bookingCriteria.checkIn}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                วันที่ออก
              </label>
              <input
                type="date"
                name="checkOut"
                value={bookingCriteria.checkOut}
                onChange={handleInputChange}
                min={bookingCriteria.checkIn || new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="w-4 h-4 inline mr-1" />
                จำนวนผู้เข้าพัก
              </label>
              <select
                name="guests"
                value={bookingCriteria.guests}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <option key={num} value={num}>{num} คน</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                {calculateNights() > 0 && (
                  <div>
                    <span className="font-medium">{calculateNights()} คืน</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Room Types Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {roomTypes.map((roomType) => (
            <div
              key={roomType.id}
              className={`bg-white rounded-lg shadow-md overflow-hidden transition-all duration-200 hover:shadow-lg ${
                selectedRoomType?.id === roomType.id ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {/* Room Image */}
              <div className="h-48 bg-gray-200 relative">
                {roomType.images && roomType.images.length > 0 ? (
                  <img
                    src={`http://localhost:3001/uploads/${roomType.images[0]}`}
                    alt={roomType.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Prevent infinite loop by replacing with div instead of another image
                      e.target.style.display = 'none';
                      const parent = e.target.parentElement;
                      parent.innerHTML = `
                        <div class="w-full h-full flex items-center justify-center bg-gray-100">
                          <svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                          </svg>
                        </div>
                      `;
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <Bed className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                
                {/* Room Type Badge */}
                <div className="absolute top-4 left-4">
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {getBedTypeText(roomType.bed_type)}
                  </span>
                </div>
              </div>

              {/* Room Details */}
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {roomType.name}
                </h3>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {roomType.description || 'ห้องพักสะดวกสบาย พร้อมสิ่งอำนวยความสะดวกครบครัน'}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    รองรับได้สูงสุด {roomType.max_guests} คน
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    ห้องพักทั้งหมด: {roomType.total_rooms || roomType.quantity} ห้อง
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-2xl font-bold text-blue-600">
                      ฿{formatPrice(roomType.price_per_night)}
                    </span>
                    <span className="text-gray-500 text-sm">/คืน</span>
                  </div>
                  
                  {calculateNights() > 0 && (
                    <div className="text-right">
                      <div className="text-sm text-gray-500">รวม {calculateNights()} คืน</div>
                      <div className="text-lg font-bold text-green-600">
                        ฿{formatPrice(roomType.price_per_night * calculateNights())}
                      </div>
                    </div>
                  )}
                </div>

                {/* Check Availability Button */}
                <button
                  onClick={() => checkRoomAvailability(roomType)}
                  disabled={checkingAvailability}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 mb-2"
                >
                  {checkingAvailability && selectedRoomType?.id === roomType.id ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      กำลังตรวจสอบ...
                    </div>
                  ) : (
                    'ตรวจสอบห้องว่าง'
                  )}
                </button>

                {/* Availability Results */}
                {selectedRoomType?.id === roomType.id && availabilityResults && (
                  <div className={`p-3 rounded-md text-sm ${
                    availabilityResults.isAvailable 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    {availabilityResults.isAvailable ? (
                      <div className="flex items-center text-green-800">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        <div>
                          <div className="font-medium">มีห้องว่าง!</div>
                          <div>ห้องพร้อมใช้งาน: {availabilityResults.availableRooms} ห้อง</div>
                          <div>จากทั้งหมด: {availabilityResults.totalRooms} ห้อง</div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center text-red-800">
                        <XCircle className="w-4 h-4 mr-2 text-red-600" />
                        <div>
                          <div className="font-medium">ไม่มีห้องว่าง</div>
                          <div>ห้องที่จองแล้ว: {availabilityResults.bookedRooms} ห้อง</div>
                          <div>จากทั้งหมด: {availabilityResults.totalRooms} ห้อง</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Proceed to Booking */}
        {selectedRoomType && availabilityResults?.isAvailable && (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
              <h3 className="text-xl font-semibold text-gray-900">
                พร้อมจองห้องพัก {selectedRoomType.name}
              </h3>
            </div>
            
            <div className="text-gray-600 mb-6">
              <div>วันที่: {new Date(bookingCriteria.checkIn).toLocaleDateString('th-TH')} - {new Date(bookingCriteria.checkOut).toLocaleDateString('th-TH')}</div>
              <div>จำนวน: {calculateNights()} คืน, {bookingCriteria.guests} คน</div>
              <div className="text-lg font-semibold text-blue-600 mt-2">
                ราคารวม: ฿{formatPrice(selectedRoomType.price_per_night * calculateNights())}
              </div>
            </div>
            
            <button
              onClick={proceedToBooking}
              className="bg-green-600 text-white py-3 px-8 rounded-md hover:bg-green-700 transition-colors duration-200 flex items-center justify-center mx-auto"
            >
              ดำเนินการจอง
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        )}

        {/* No Rooms Available Message */}
        {roomTypes.length === 0 && !loading && (
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              ไม่มีประเภทห้องพักในขณะนี้
            </h3>
            <p className="text-gray-600">
              กรุณาติดต่อแผนกต้อนรับ หรือลองใหม่อีกครั้ง
            </p>
          </div>
        )}
      </div>
    </div>
  );
}