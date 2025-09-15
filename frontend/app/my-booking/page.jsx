'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  User, 
  Users, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail,
  CheckCircle,
  Clock,
  AlertCircle,
  Bed,
  CreditCard,
  FileText,
  Star,
  Home,
  Globe,
  IdCard
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function MyBookingDetailsPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  
  const guestRef = searchParams.get('guestRef');
  const bookingRef = searchParams.get('bookingRef');
  
  const [guestData, setGuestData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (guestRef) {
      fetchGuestData();
    }
  }, [guestRef]);

  const fetchGuestData = async () => {
    try {
      setLoading(true);
      
      // Fetch guest data by reference
      const response = await fetch(`/api/guest-information?ref=${guestRef}`);
      const data = await response.json();
      
      if (data.success) {
        setGuestData(data.guest);
      } else {
        toast.error('ไม่พบข้อมูลการจอง');
      }
      
    } catch (error) {
      console.error('Error fetching guest data:', error);
      toast.error('เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  // Calculate nights
  const calculateNights = () => {
    if (!guestData?.bookingDetails) return 0;
    const checkIn = new Date(guestData.bookingDetails.checkInDate);
    const checkOut = new Date(guestData.bookingDetails.checkOutDate);
    return Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get status color and icon
  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return { 
          color: 'text-yellow-600 bg-yellow-100', 
          icon: Clock, 
          text: 'รอเข้าพัก' 
        };
      case 'checked_in':
        return { 
          color: 'text-green-600 bg-green-100', 
          icon: CheckCircle, 
          text: 'เข้าพักแล้ว' 
        };
      case 'checked_out':
        return { 
          color: 'text-gray-600 bg-gray-100', 
          icon: CheckCircle, 
          text: 'เช็คเอาท์แล้ว' 
        };
      default:
        return { 
          color: 'text-blue-600 bg-blue-100', 
          icon: AlertCircle, 
          text: status 
        };
    }
  };

  const getPaymentStatusInfo = (status) => {
    switch (status) {
      case 'pending_verification':
        return { 
          color: 'text-yellow-600 bg-yellow-100', 
          icon: Clock, 
          text: 'รอตรวจสอบ' 
        };
      case 'verified':
        return { 
          color: 'text-green-600 bg-green-100', 
          icon: CheckCircle, 
          text: 'ตรวจสอบแล้ว' 
        };
      case 'rejected':
        return { 
          color: 'text-red-600 bg-red-100', 
          icon: AlertCircle, 
          text: 'ถูกปฏิเสธ' 
        };
      default:
        return { 
          color: 'text-gray-600 bg-gray-100', 
          icon: AlertCircle, 
          text: status 
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดข้อมูลการจอง...</p>
        </div>
      </div>
    );
  }

  if (!guestData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">ไม่พบข้อมูลการจอง</h2>
          <p className="text-gray-600 mb-6">ไม่พบข้อมูลการจองที่คุณต้องการ</p>
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Home className="h-5 w-5 mr-2" />
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(guestData.checkInStatus);
  const paymentStatusInfo = getPaymentStatusInfo(guestData.paymentInfo?.paymentStatus);
  const StatusIcon = statusInfo.icon;
  const PaymentStatusIcon = paymentStatusInfo.icon;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                ข้อมูลการจองของคุณ
              </h1>
              <p className="text-gray-600">
                รหัสผู้เข้าพัก: <span className="font-mono font-semibold">{guestData.guestReference}</span>
              </p>
              <p className="text-gray-600">
                รหัสการจอง: <span className="font-mono font-semibold">{guestData.bookingReference}</span>
              </p>
            </div>
            
            <div className="mt-4 md:mt-0 flex flex-col space-y-2">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                <StatusIcon className="h-4 w-4 mr-1" />
                {statusInfo.text}
              </div>
              
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${paymentStatusInfo.color}`}>
                <PaymentStatusIcon className="h-4 w-4 mr-1" />
                การชำระเงิน: {paymentStatusInfo.text}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Guest Information */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <User className="h-6 w-6 mr-2 text-blue-600" />
              ข้อมูลผู้เข้าพัก
            </h2>
            
            {/* Primary Guest */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">ผู้เข้าพักหลัก</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <User className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <span className="font-medium">
                      {guestData.primaryGuest.title} {guestData.primaryGuest.firstName} {guestData.primaryGuest.lastName}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-gray-400 mr-3" />
                  <span>{guestData.primaryGuest.email}</span>
                </div>
                
                <div className="flex items-center">
                  <Phone className="h-5 w-5 text-gray-400 mr-3" />
                  <span>{guestData.primaryGuest.phone}</span>
                </div>
                
                <div className="flex items-center">
                  <Globe className="h-5 w-5 text-gray-400 mr-3" />
                  <span>สัญชาติ: {guestData.primaryGuest.nationality}</span>
                </div>
                
                {guestData.primaryGuest.address && (
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <div>{guestData.primaryGuest.address.street}</div>
                      <div>
                        {guestData.primaryGuest.address.city} {guestData.primaryGuest.address.state} {guestData.primaryGuest.address.postalCode}
                      </div>
                      <div>{guestData.primaryGuest.address.country}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Additional Guests */}
            {guestData.additionalGuests && guestData.additionalGuests.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  ผู้เข้าพักร่วม ({guestData.additionalGuests.length} ท่าน)
                </h3>
                <div className="space-y-3">
                  {guestData.additionalGuests.map((guest, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium">
                          {guest.title} {guest.firstName} {guest.lastName}
                        </span>
                        <div className="text-sm text-gray-600">
                          ความสัมพันธ์: {guest.relationship}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Booking Details */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Bed className="h-6 w-6 mr-2 text-blue-600" />
              รายละเอียดการจอง
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">โรงแรม</label>
                <div className="text-lg font-semibold text-gray-900">
                  {guestData.bookingDetails.hotelName}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">ประเภทห้อง</label>
                <div className="text-lg font-semibold text-gray-900">
                  {guestData.bookingDetails.roomType}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">วันที่เข้าพัก</label>
                  <div className="font-semibold text-gray-900 flex items-center">
                    <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                    {formatDate(guestData.bookingDetails.checkInDate)}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">วันที่ออก</label>
                  <div className="font-semibold text-gray-900 flex items-center">
                    <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                    {formatDate(guestData.bookingDetails.checkOutDate)}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">จำนวนคืน</label>
                  <div className="font-semibold text-gray-900">
                    {calculateNights()} คืน
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">จำนวนผู้เข้าพัก</label>
                  <div className="font-semibold text-gray-900">
                    {guestData.bookingDetails.numberOfGuests} ท่าน
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-600">ราคารวม</span>
                  <span className="text-2xl font-bold text-blue-600">
                    ฿{guestData.bookingDetails.totalAmount?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <CreditCard className="h-6 w-6 mr-2 text-blue-600" />
              ข้อมูลการชำระเงิน
            </h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">สถานะการชำระเงิน</span>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${paymentStatusInfo.color}`}>
                  <PaymentStatusIcon className="h-4 w-4 mr-1" />
                  {paymentStatusInfo.text}
                </div>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">วิธีการชำระเงิน</span>
                <span className="font-medium">
                  {guestData.paymentInfo?.paymentMethod === 'bank_transfer' ? 'โอนเงินผ่านธนาคาร' : guestData.paymentInfo?.paymentMethod}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">จำนวนเงิน</span>
                <span className="font-bold text-green-600">
                  ฿{guestData.paymentInfo?.paymentAmount?.toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">วันที่ชำระเงิน</span>
                <span className="font-medium">
                  {formatDate(guestData.paymentInfo?.paymentDate)}
                </span>
              </div>
            </div>
          </div>

          {/* Special Requests */}
          {guestData.specialRequests && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Star className="h-6 w-6 mr-2 text-blue-600" />
                ความต้องการพิเศษ
              </h2>
              
              <div className="space-y-4">
                {guestData.specialRequests.dietaryRequirements && guestData.specialRequests.dietaryRequirements.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">ความต้องการด้านอาหาร</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {guestData.specialRequests.dietaryRequirements.map((diet, index) => (
                        <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                          {diet}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {guestData.specialRequests.bedPreference && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">ประเภทเตียง</label>
                    <div className="font-medium text-gray-900">
                      {guestData.specialRequests.bedPreference}
                    </div>
                  </div>
                )}
                
                {guestData.specialRequests.smokingPreference && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">การสูบบุหรี่</label>
                    <div className="font-medium text-gray-900">
                      {guestData.specialRequests.smokingPreference === 'non-smoking' ? 'ห้องปลอดบุหรี่' : 'ห้องสูบบุหรี่ได้'}
                    </div>
                  </div>
                )}
                
                {guestData.specialRequests.additionalRequests && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">คำขอเพิ่มเติม</label>
                    <div className="p-3 bg-gray-50 rounded-lg mt-1">
                      {guestData.specialRequests.additionalRequests}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Emergency Contact */}
          {guestData.emergencyContact && guestData.emergencyContact.name && (
            <div className="bg-white rounded-lg shadow-lg p-6 lg:col-span-2">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <AlertCircle className="h-6 w-6 mr-2 text-red-600" />
                ข้อมูลติดต่อฉุกเฉิน
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">ชื่อผู้ติดต่อ</label>
                  <div className="font-medium text-gray-900">
                    {guestData.emergencyContact.name}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">ความสัมพันธ์</label>
                  <div className="font-medium text-gray-900">
                    {guestData.emergencyContact.relationship}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">เบอร์โทรศัพท์</label>
                  <div className="font-medium text-gray-900 flex items-center">
                    <Phone className="h-4 w-4 mr-1 text-gray-400" />
                    {guestData.emergencyContact.phone}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Home className="h-5 w-5 mr-2" />
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  );
}