'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  User,
  Calendar,
  CreditCard,
  Download,
  RefreshCw,
  UserCheck,
  Bed
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminGuestManagementPage() {
  const [guests, setGuests] = useState([]);
  const [filteredGuests, setFilteredGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState(null);
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [checkInStatusFilter, setCheckInStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [showGuestModal, setShowGuestModal] = useState(false);

  useEffect(() => {
    fetchGuestsData();
    fetchStatistics();
  }, []);

  useEffect(() => {
    filterGuests();
  }, [guests, searchTerm, statusFilter, checkInStatusFilter, paymentStatusFilter]);

  const fetchGuestsData = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/guests');
      const data = await response.json();
      
      if (data.success) {
        setGuests(data.data);
      } else {
        toast.error('ไม่สามารถดึงข้อมูลผู้เข้าพักได้');
      }
      
    } catch (error) {
      console.error('Error fetching guests:', error);
      toast.error('เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/guest-statistics');
      const data = await response.json();
      
      if (data.success) {
        setStatistics(data.statistics);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const filterGuests = () => {
    let filtered = [...guests];
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(guest => 
        guest.guestReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.bookingReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.primaryGuest.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.primaryGuest.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.primaryGuest.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.bookingDetails.hotelName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Status filters
    if (statusFilter !== 'all') {
      filtered = filtered.filter(guest => guest.status === statusFilter);
    }
    
    if (checkInStatusFilter !== 'all') {
      filtered = filtered.filter(guest => guest.checkInStatus === checkInStatusFilter);
    }
    
    if (paymentStatusFilter !== 'all') {
      filtered = filtered.filter(guest => guest.paymentInfo.paymentStatus === paymentStatusFilter);
    }
    
    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    setFilteredGuests(filtered);
  };

  const handleCheckIn = async (guestId) => {
    try {
      const checkInData = {
        actualRoomNumber: `Room-${Math.floor(Math.random() * 1000) + 100}`,
        keyCardsIssued: 2,
        checkedInBy: 'admin',
        staffName: 'Admin Staff',
        idVerified: true,
        paymentVerified: true,
        depositAmount: 500,
        depositMethod: 'credit_card'
      };
      
      const response = await fetch(`/api/guest-checkin/${guestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkInData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('เช็คอินสำเร็จแล้ว!');
        fetchGuestsData();
        fetchStatistics();
      } else {
        toast.error('เกิดข้อผิดพลาดในการเช็คอิน');
      }
    } catch (error) {
      console.error('Error checking in guest:', error);
      toast.error('เกิดข้อผิดพลาดในการเช็คอิน');
    }
  };

  const viewGuestDetails = async (guestId) => {
    try {
      const response = await fetch(`/api/guests/${guestId}`);
      const data = await response.json();
      
      if (data.success) {
        setSelectedGuest(data.guest);
        setShowGuestModal(true);
      } else {
        toast.error('ไม่สามารถดึงข้อมูลผู้เข้าพักได้');
      }
    } catch (error) {
      console.error('Error fetching guest details:', error);
      toast.error('เกิดข้อผิดพลาดในการดึงข้อมูล');
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'รอเข้าพัก' },
      checked_in: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'เข้าพักแล้ว' },
      checked_out: { color: 'bg-gray-100 text-gray-800', icon: CheckCircle, text: 'เช็คเอาท์แล้ว' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: AlertCircle, text: 'ยกเลิก' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent className="h-3 w-3 mr-1" />
        {config.text}
      </span>
    );
  };

  const getPaymentStatusBadge = (status) => {
    const statusConfig = {
      pending_verification: { color: 'bg-yellow-100 text-yellow-800', text: 'รอตรวจสอบ' },
      verified: { color: 'bg-green-100 text-green-800', text: 'ตรวจสอบแล้ว' },
      rejected: { color: 'bg-red-100 text-red-800', text: 'ปฏิเสธ' }
    };
    
    const config = statusConfig[status] || statusConfig.pending_verification;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดข้อมูลผู้เข้าพัก...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            จัดการข้อมูลผู้เข้าพัก
          </h1>
          <p className="text-gray-600">
            ดูและจัดการข้อมูลผู้เข้าพักทั้งหมด
          </p>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center">
                <Users className="h-12 w-12 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">ผู้เข้าพักทั้งหมด</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.totalGuests}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center">
                <Clock className="h-12 w-12 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">รอเข้าพัก</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.pendingCheckIn}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center">
                <CheckCircle className="h-12 w-12 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">เข้าพักแล้ว</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.checkedIn}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center">
                <Calendar className="h-12 w-12 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">เข้าพักวันนี้</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.todayArrivals}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ค้นหา
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="ชื่อ, อีเมล, รหัสจอง..."
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                สถานะการเข้าพัก
              </label>
              <select
                value={checkInStatusFilter}
                onChange={(e) => setCheckInStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">ทั้งหมด</option>
                <option value="pending">รอเข้าพัก</option>
                <option value="checked_in">เข้าพักแล้ว</option>
                <option value="checked_out">เช็คเอาท์แล้ว</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                สถานะการชำระเงิน
              </label>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">ทั้งหมด</option>
                <option value="pending_verification">รอตรวจสอบ</option>
                <option value="verified">ตรวจสอบแล้ว</option>
                <option value="rejected">ปฏิเสธ</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                การดำเนินการ
              </label>
              <button
                onClick={fetchGuestsData}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                รีเฟรช
              </button>
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            แสดง {filteredGuests.length} จาก {guests.length} รายการ
          </div>
        </div>

        {/* Guests Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ผู้เข้าพัก
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    การจอง
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    วันที่เข้าพัก
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    การชำระเงิน
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    การดำเนินการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredGuests.map((guest) => (
                  <tr key={guest.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {guest.primaryGuest.title} {guest.primaryGuest.firstName} {guest.primaryGuest.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {guest.primaryGuest.email}
                          </div>
                          <div className="text-xs text-gray-400">
                            รหัส: {guest.guestReference}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {guest.bookingDetails.hotelName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {guest.bookingDetails.roomType}
                      </div>
                      <div className="text-xs text-gray-400">
                        จอง: {guest.bookingReference}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(guest.bookingDetails.checkInDate)}
                      </div>
                      <div className="text-sm text-gray-500">
                        ถึง {formatDate(guest.bookingDetails.checkOutDate)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {guest.bookingDetails.numberOfGuests} ท่าน
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(guest.checkInStatus)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="mb-1">
                        {getPaymentStatusBadge(guest.paymentInfo.paymentStatus)}
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        ฿{guest.paymentInfo.paymentAmount?.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => viewGuestDetails(guest.id)}
                        className="text-blue-600 hover:text-blue-900 flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        ดู
                      </button>
                      
                      {guest.checkInStatus === 'pending' && (
                        <button
                          onClick={() => handleCheckIn(guest.id)}
                          className="text-green-600 hover:text-green-900 flex items-center"
                        >
                          <UserCheck className="h-4 w-4 mr-1" />
                          เช็คอิน
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredGuests.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">ไม่พบข้อมูลผู้เข้าพัก</p>
            </div>
          )}
        </div>

        {/* Guest Details Modal */}
        {showGuestModal && selectedGuest && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    รายละเอียดผู้เข้าพัก
                  </h3>
                  <button
                    onClick={() => setShowGuestModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {/* Guest Info */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">ข้อมูลผู้เข้าพัก</h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p><strong>ชื่อ:</strong> {selectedGuest.primaryGuest.title} {selectedGuest.primaryGuest.firstName} {selectedGuest.primaryGuest.lastName}</p>
                      <p><strong>อีเมล:</strong> {selectedGuest.primaryGuest.email}</p>
                      <p><strong>โทรศัพท์:</strong> {selectedGuest.primaryGuest.phone}</p>
                      <p><strong>สัญชาติ:</strong> {selectedGuest.primaryGuest.nationality}</p>
                    </div>
                  </div>
                  
                  {/* Booking Details */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">รายละเอียดการจอง</h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p><strong>โรงแรม:</strong> {selectedGuest.bookingDetails.hotelName}</p>
                      <p><strong>ประเภทห้อง:</strong> {selectedGuest.bookingDetails.roomType}</p>
                      <p><strong>วันที่เข้าพัก:</strong> {formatDate(selectedGuest.bookingDetails.checkInDate)}</p>
                      <p><strong>วันที่ออก:</strong> {formatDate(selectedGuest.bookingDetails.checkOutDate)}</p>
                      <p><strong>จำนวนผู้เข้าพัก:</strong> {selectedGuest.bookingDetails.numberOfGuests} ท่าน</p>
                      <p><strong>ราคารวม:</strong> ฿{selectedGuest.bookingDetails.totalAmount?.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  {/* Special Requests */}
                  {selectedGuest.specialRequests && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">ความต้องการพิเศษ</h4>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        {selectedGuest.specialRequests.bedPreference && (
                          <p><strong>ประเภทเตียง:</strong> {selectedGuest.specialRequests.bedPreference}</p>
                        )}
                        {selectedGuest.specialRequests.smokingPreference && (
                          <p><strong>การสูบบุหรี่:</strong> {selectedGuest.specialRequests.smokingPreference}</p>
                        )}
                        {selectedGuest.specialRequests.additionalRequests && (
                          <p><strong>คำขอเพิ่มเติม:</strong> {selectedGuest.specialRequests.additionalRequests}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowGuestModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    ปิด
                  </button>
                  
                  {selectedGuest.checkInStatus === 'pending' && (
                    <button
                      onClick={() => {
                        handleCheckIn(selectedGuest.id);
                        setShowGuestModal(false);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      เช็คอิน
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}