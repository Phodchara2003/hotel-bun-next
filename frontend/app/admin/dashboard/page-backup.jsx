'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { isStaffOrAdmin, canAccessAdminDashboard } from '../../../lib/permissions';
import { bookingAPI, roomAPI } from '../../../lib/api';

export default function AdminDashboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [recentBookings, setRecentBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  
  // Calendar states
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateBookings, setDateBookings] = useState([]);
  const [dateBookingsLoading, setDateBookingsLoading] = useState(false);
  
  // Room statistics states
  const [roomStats, setRoomStats] = useState(null);
  const [roomStatsLoading, setRoomStatsLoading] = useState(true);
  const [selectedStatsDate, setSelectedStatsDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0);
  });

  // Fetch recent bookings
  useEffect(() => {
    const fetchRecentBookings = async () => {
      try {
        setBookingsLoading(true);
        console.log('🔄 Fetching recent bookings...');
        
        // Fetch more bookings for calendar visualization
        const response = await bookingAPI.getAdminBookings({ 
          page: 1, 
          limit: 50, // Increase limit for calendar visualization
          sortBy: 'created_at',
          sortOrder: 'DESC'
        });
        
        console.log('📥 Bookings API response:', response);
        
        // Handle different response formats
        let bookings = [];
        if (response.success && response.bookings) {
          bookings = response.bookings;
        } else if (response.bookings) {
          bookings = response.bookings;
        } else if (response.data) {
          bookings = response.data;
        } else if (Array.isArray(response)) {
          bookings = response;
        }
        
        console.log('📋 Processed bookings:', bookings);
        setRecentBookings(bookings);
        
      } catch (error) {
        console.error('❌ Error fetching recent bookings:', error);
        setRecentBookings([]);
      } finally {
        setBookingsLoading(false);
      }
    };

    if (isAuthenticated && isStaffOrAdmin(user)) {
      fetchRecentBookings();
    }
  }, [isAuthenticated, user]);

  // Fetch bookings for selected date
  const fetchBookingsForDate = async (date) => {
    try {
      setDateBookingsLoading(true);
      console.log('🔄 Fetching bookings for date:', date);
      
      const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      const response = await bookingAPI.getAdminBookings({ 
        page: 1, 
        limit: 50,
        date: dateString  // Use the new date filter
      });
      
      console.log('📥 Date bookings API response:', response);
      console.log('🎯 Expected format check:', {
        hasSuccess: !!response.success,
        hasBookings: !!response.bookings,
        hasData: !!response.data,
        dataLength: response.data?.length,
        count: response.count
      });
      
      // Handle different response formats
      let bookings = [];
      if (response.success && response.data) {
        bookings = response.data;
        console.log('✅ Using response.data:', bookings);
      } else if (response.success && response.bookings) {
        bookings = response.bookings;
        console.log('✅ Using response.bookings:', bookings);
      } else if (response.bookings) {
        bookings = response.bookings;
        console.log('✅ Using fallback response.bookings:', bookings);
      } else if (response.data) {
        bookings = response.data;
        console.log('✅ Using fallback response.data:', bookings);
      }
      
      console.log('📋 Final bookings for date:', bookings);
      console.log('🔢 Bookings count:', bookings.length);
      setDateBookings(bookings);
      
    } catch (error) {
      console.error('❌ Error fetching bookings for date:', error);
      setDateBookings([]);
    } finally {
      setDateBookingsLoading(false);
    }
  };

  // Fetch bookings when selected date changes
  useEffect(() => {
    if (isAuthenticated && isStaffOrAdmin(user) && selectedDate) {
      console.log('🔔 useEffect triggered for date:', selectedDate.toISOString().split('T')[0]);
      fetchBookingsForDate(selectedDate);
    }
  }, [selectedDate, isAuthenticated, user]);

  // Fetch room statistics
  useEffect(() => {
    console.log('🔄 useEffect triggered for room stats', {
      isAuthenticated,
      isStaff: isStaffOrAdmin(user),
      selectedDate: selectedStatsDate.toISOString().split('T')[0]
    });
    
    const fetchRoomStats = async () => {
      try {
        setRoomStatsLoading(true);
        console.log('🏨 Fetching room statistics for date:', selectedStatsDate.toISOString().split('T')[0]);
        
        const dateString = selectedStatsDate.toISOString().split('T')[0];
        console.log('🔗 Calling roomAPI.getRoomStatistics with:', dateString);
        const response = await roomAPI.getRoomStatistics(dateString);
        console.log('📊 Room stats response:', response);
        
        if (response.success) {
          console.log('✅ Room stats data loaded:', response.data);
          setRoomStats(response.data);
        } else {
          console.error('❌ Failed to fetch room statistics:', response.message);
          setRoomStats(null);
        }
        
      } catch (error) {
        console.error('❌ Error fetching room statistics:', error);
        console.error('Error details:', error.response?.data || error.message);
        setRoomStats(null);
      } finally {
        setRoomStatsLoading(false);
        console.log('🏁 Room stats loading finished');
      }
    };

    if (isAuthenticated && isStaffOrAdmin(user)) {
      fetchRoomStats();
    }
  }, [isAuthenticated, user, selectedStatsDate]);

  if (!isAuthenticated || !isStaffOrAdmin(user)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">ไม่มีสิทธิ์เข้าถึง</h1>
          <p className="text-gray-600">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          
          {/* Date Picker */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">ดูข้อมูลวันที่:</label>
            <input
              type="date"
              value={selectedStatsDate.toISOString().split('T')[0]}
              onChange={(e) => {
                const dateValue = e.target.value;
                console.log('📅 Date picker value changed:', dateValue);
                if (dateValue) {
                  // Create date with explicit timezone to avoid offset issues
                  const [year, month, day] = dateValue.split('-').map(Number);
                  const newDate = new Date(year, month - 1, day, 12, 0, 0);
                  console.log('📅 New date object:', newDate);
                  console.log('📅 Date parts:', { year, month, day });
                  console.log('📅 Stats date changed to:', newDate.toISOString().split('T')[0]);
                  console.log('🔄 Triggering room stats update...');
                  setSelectedStatsDate(newDate);
                }
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            {selectedStatsDate.toISOString().split('T')[0] !== new Date().toISOString().split('T')[0] && (
              <button
                onClick={() => {
                  const today = new Date();
                  const todayFixed = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0);
                  console.log('📅 Resetting to today:', todayFixed.toISOString().split('T')[0]);
                  setSelectedStatsDate(todayFixed);
                }}
                className="px-3 py-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
              >
                วันนี้
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Date Info */}
        <div className="mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>📅 แสดงข้อมูลวันที่:</span>
            <span className="font-medium text-gray-900">
              {selectedStatsDate.toLocaleDateString('th-TH', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                weekday: 'long'
              })}
            </span>
            {selectedStatsDate.toISOString().split('T')[0] === new Date().toISOString().split('T')[0] && (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">วันนี้</span>
            )}
            {roomStatsLoading && (
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-blue-600 text-xs">กำลังโหลด...</span>
              </div>
            )}
            {!roomStatsLoading && roomStats && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                อัปเดตแล้ว
              </span>
            )}
            {!roomStatsLoading && !roomStats && (
              <>
                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                  ไม่สามารถโหลดข้อมูล
                </span>
                <button
                  onClick={() => {
                    console.log('🔄 Manual refresh triggered');
                    setSelectedStatsDate(new Date(selectedStatsDate));
                  }}
                  className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200 transition-colors"
                >
                  รีเฟรช
                </button>
              </>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {/* Total Bookings Card */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white relative overflow-hidden transform hover:scale-105 transition-transform duration-200">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  {roomStatsLoading ? (
                    <div className="animate-pulse">
                      <div className="h-10 bg-white/20 rounded mb-2 w-20"></div>
                      <div className="h-4 bg-white/20 rounded w-24"></div>
                    </div>
                  ) : (
                    <>
                      <p className="text-4xl font-bold mb-2">{roomStats?.bookings?.total || 0}</p>
                      <h3 className="text-blue-100 text-sm font-medium">Total Bookings</h3>
                    </>
                  )}
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Available Rooms Card */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white relative overflow-hidden transform hover:scale-105 transition-transform duration-200">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  {roomStatsLoading ? (
                    <div className="animate-pulse">
                      <div className="h-10 bg-white/20 rounded mb-2 w-20"></div>
                      <div className="h-4 bg-white/20 rounded w-28"></div>
                    </div>
                  ) : (
                    <>
                      <p className="text-4xl font-bold mb-2">{roomStats?.rooms?.available || 0}</p>
                      <h3 className="text-green-100 text-sm font-medium">Available Rooms</h3>
                    </>
                  )}
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Check In Card */}
          <div className="bg-gradient-to-r from-orange-400 to-orange-500 rounded-xl p-6 text-white relative overflow-hidden transform hover:scale-105 transition-transform duration-200">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  {roomStatsLoading ? (
                    <div className="animate-pulse">
                      <div className="h-10 bg-white/20 rounded mb-2 w-20"></div>
                      <div className="h-4 bg-white/20 rounded w-24"></div>
                    </div>
                  ) : (
                    <>
                      <p className="text-4xl font-bold mb-2">{roomStats?.bookings?.checkin_today || 0}</p>
                      <h3 className="text-orange-100 text-sm font-medium">Check In Today</h3>
                    </>
                  )}
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Check Out Card */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white relative overflow-hidden transform hover:scale-105 transition-transform duration-200">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  {roomStatsLoading ? (
                    <div className="animate-pulse">
                      <div className="h-10 bg-white/20 rounded mb-2 w-20"></div>
                      <div className="h-4 bg-white/20 rounded w-26"></div>
                    </div>
                  ) : (
                    <>
                      <p className="text-4xl font-bold mb-2">{roomStats?.bookings?.checkout_today || 0}</p>
                      <h3 className="text-red-100 text-sm font-medium">Check Out Today</h3>
                    </>
                  )}
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Card */}
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white relative overflow-hidden transform hover:scale-105 transition-transform duration-200">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  {roomStatsLoading ? (
                    <div className="animate-pulse">
                      <div className="h-10 bg-white/20 rounded mb-2 w-20"></div>
                      <div className="h-4 bg-white/20 rounded w-24"></div>
                    </div>
                  ) : (
                    <>
                      <p className="text-4xl font-bold mb-2">
                        ฿{roomStats?.revenue?.daily_total ? Math.floor(roomStats.revenue.daily_total).toLocaleString() : '0'}
                      </p>
                      <h3 className="text-purple-100 text-sm font-medium">รายได้วันนี้</h3>
                    </>
                  )}
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Available Room Today - Circular Progress */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center mb-6">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="3"
                    strokeDasharray={roomStats?.rooms?.occupancy_rate ? `${roomStats.rooms.occupancy_rate}, 100` : "0, 100"}
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    {roomStatsLoading ? (
                      <div className="animate-pulse">
                        <div className="h-10 bg-gray-200 rounded mb-2 w-16 mx-auto"></div>
                        <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
                      </div>
                    ) : (
                      <>
                        <p className="text-4xl font-bold text-gray-900">{roomStats?.rooms?.total || 0}</p>
                        <p className="text-gray-600 text-sm">Total Rooms</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress bars */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600 text-sm">Available</span>
                    <span className="text-gray-900 text-sm font-medium">
                      {roomStatsLoading ? (
                        <div className="w-8 h-4 bg-gray-200 rounded animate-pulse"></div>
                      ) : (
                        roomStats?.rooms?.available || 0
                      )}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                      style={{ 
                        width: roomStats?.rooms?.total > 0 
                          ? `${(roomStats.rooms.available / roomStats.rooms.total) * 100}%` 
                          : '0%' 
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600 text-sm">Occupied</span>
                    <span className="text-gray-900 text-sm font-medium">
                      {roomStatsLoading ? (
                        <div className="w-8 h-4 bg-gray-200 rounded animate-pulse"></div>
                      ) : (
                        roomStats?.rooms?.occupied || 0
                      )}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full transition-all duration-300" 
                      style={{ 
                        width: roomStats?.rooms?.total > 0 
                          ? `${(roomStats.rooms.occupied / roomStats.rooms.total) * 100}%` 
                          : '0%' 
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600 text-sm">Occupancy Rate</span>
                    <span className="text-gray-900 text-sm font-medium">
                      {roomStatsLoading ? (
                        <div className="w-12 h-4 bg-gray-200 rounded animate-pulse"></div>
                      ) : (
                        `${roomStats?.rooms?.occupancy_rate || 0}%`
                      )}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                      style={{ 
                        width: `${roomStats?.rooms?.occupancy_rate || 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Revenue & Booking Statistics */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-gray-900 text-xl font-semibold">สถิติรายได้และการจอง</h3>
                <p className="text-gray-600 text-sm">
                  วันที่ {selectedStatsDate.toLocaleDateString('th-TH', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  {roomStatsLoading ? (
                    <div className="animate-pulse">
                      <div className="h-8 bg-gray-200 rounded mb-1 w-16"></div>
                      <div className="h-4 bg-gray-200 rounded w-12"></div>
                    </div>
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-gray-900">{roomStats?.bookings?.checkin_today || 0}</p>
                      <p className="text-gray-600 text-sm">Check In</p>
                    </>
                  )}
                </div>
                <div className="text-right">
                  {roomStatsLoading ? (
                    <div className="animate-pulse">
                      <div className="h-8 bg-gray-200 rounded mb-1 w-16"></div>
                      <div className="h-4 bg-gray-200 rounded w-12"></div>
                    </div>
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-gray-900">{roomStats?.bookings?.checkout_today || 0}</p>
                      <p className="text-gray-600 text-sm">Check Out</p>
                    </>
                  )}
                </div>
                <div className="text-right">
                  {roomStatsLoading ? (
                    <div className="animate-pulse">
                      <div className="h-8 bg-gray-200 rounded mb-1 w-20"></div>
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </div>
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-purple-600">
                        ฿{roomStats?.revenue?.daily_total ? Math.floor(roomStats.revenue.daily_total).toLocaleString() : '0'}
                      </p>
                      <p className="text-gray-600 text-sm">รายได้รวม</p>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Revenue Breakdown */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">รายได้จาก Check-in</p>
                    <p className="text-xl font-bold text-purple-600">
                      ฿{roomStatsLoading ? '...' : (roomStats?.revenue?.checkin_revenue ? Math.floor(roomStats.revenue.checkin_revenue).toLocaleString() : '0')}
                    </p>
                  </div>
                  <div className="text-purple-600">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">อัตราการเข้าพัก</p>
                    <p className="text-xl font-bold text-blue-600">
                      {roomStatsLoading ? '...' : `${roomStats?.rooms?.occupancy_rate || 0}%`}
                    </p>
                  </div>
                  <div className="text-blue-600">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Chart Area */}
            <div className="h-48 bg-gray-50 rounded-lg flex items-end justify-center px-4 py-6 relative overflow-hidden">
              {/* Mock Chart Lines */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 200">
                <defs>
                  <linearGradient id="blueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="1"/>
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.1"/>
                  </linearGradient>
                  <linearGradient id="redGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity="1"/>
                    <stop offset="100%" stopColor="#EF4444" stopOpacity="0.1"/>
                  </linearGradient>
                </defs>
                
                {/* Blue line (Check In) */}
                <path 
                  d="M 20 150 Q 80 120 120 100 T 200 80 T 280 60 T 360 40" 
                  stroke="#3B82F6" 
                  strokeWidth="3" 
                  fill="none"
                />
                <path 
                  d="M 20 150 Q 80 120 120 100 T 200 80 T 280 60 T 360 40 L 360 180 L 20 180 Z" 
                  fill="url(#blueGradient)"
                />
                
                {/* Red line (Check Out) */}
                <path 
                  d="M 20 170 Q 80 160 120 140 T 200 120 T 280 110 T 360 100" 
                  stroke="#EF4444" 
                  strokeWidth="3" 
                  fill="none"
                />
                <path 
                  d="M 20 170 Q 80 160 120 140 T 200 120 T 280 110 T 360 100 L 360 180 L 20 180 Z" 
                  fill="url(#redGradient)"
                />
              </svg>
              
              {/* Chart Labels */}
              <div className="absolute bottom-2 left-0 right-0 flex justify-between text-xs text-gray-500 px-4">
                {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map((month, i) => (
                  <span key={i} className="text-center">{month}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Calendar Section - Full Width */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={() => {
                const prevMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1);
                setSelectedDate(prevMonth);
              }}
              className="text-gray-600 hover:text-gray-900 transition-colors p-2 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-xl font-bold text-gray-900">
              ปฏิทินการเข้าพัก - {selectedDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
            </h2>
            <button 
              onClick={() => {
                const nextMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1);
                setSelectedDate(nextMonth);
              }}
              className="text-gray-600 hover:text-gray-900 transition-colors p-2 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          {/* Calendar Grid with Booking Visualization - Full Width */}
          <div className="grid grid-cols-7 gap-2 text-center">
            {['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'].map(day => (
              <div key={day} className="text-gray-700 font-semibold p-4 bg-gray-50 rounded-lg text-sm">{day}</div>
            ))}
            
            {/* Calendar Days with Booking Overlays - Larger Size */}
            {(() => {
              const year = selectedDate.getFullYear();
              const month = selectedDate.getMonth();
              const firstDay = new Date(year, month, 1);
              const lastDay = new Date(year, month + 1, 0);
              const startDate = new Date(firstDay);
              startDate.setDate(startDate.getDate() - firstDay.getDay());
              
              const days = [];
              for (let i = 0; i < 42; i++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + i);
                days.push(currentDate);
              }
              
              return days.map((day, i) => {
                const isCurrentMonth = day.getMonth() === month;
                const today = new Date();
                const isToday = day.toDateString() === today.toDateString();
                const isSelected = day.toDateString() === selectedDate.toDateString();
                
                // Find bookings for this day
                const dayBookings = recentBookings.filter(booking => {
                  // Handle different date field names
                  const checkinDate = new Date(
                    booking.checkin_date || 
                    booking.check_in_date || 
                    booking.check_in || 
                    booking.start_date
                  );
                  const checkoutDate = new Date(
                    booking.checkout_date || 
                    booking.check_out_date || 
                    booking.check_out || 
                    booking.end_date
                  );
                  const currentDay = new Date(day);
                  
                  // Handle invalid dates
                  if (isNaN(checkinDate.getTime()) || isNaN(checkoutDate.getTime())) {
                    return false;
                  }
                  
                  // Remove time part for accurate comparison
                  checkinDate.setHours(0, 0, 0, 0);
                  checkoutDate.setHours(0, 0, 0, 0);
                  currentDay.setHours(0, 0, 0, 0);
                  
                  return currentDay >= checkinDate && currentDay < checkoutDate;
                });
                
                // Check if this day is a check-in or check-out day
                const isCheckinDay = recentBookings.some(booking => {
                  const checkinDate = new Date(
                    booking.checkin_date || 
                    booking.check_in_date || 
                    booking.check_in || 
                    booking.start_date
                  );
                  if (isNaN(checkinDate.getTime())) return false;
                  
                  checkinDate.setHours(0, 0, 0, 0);
                  const currentDay = new Date(day);
                  currentDay.setHours(0, 0, 0, 0);
                  return checkinDate.getTime() === currentDay.getTime();
                });
                
                const isCheckoutDay = recentBookings.some(booking => {
                  const checkoutDate = new Date(
                    booking.checkout_date || 
                    booking.check_out_date || 
                    booking.check_out || 
                    booking.end_date
                  );
                  if (isNaN(checkoutDate.getTime())) return false;
                  
                  checkoutDate.setHours(0, 0, 0, 0);
                  const currentDay = new Date(day);
                  currentDay.setHours(0, 0, 0, 0);
                  return checkoutDate.getTime() === currentDay.getTime();
                });
                
                const handleDateClick = () => {
                  if (isCurrentMonth) {
                    setSelectedDate(new Date(day));
                  }
                };
                
                return (
                  <div
                    key={i}
                    onClick={handleDateClick}
                    className={`relative p-3 h-24 rounded-lg transition-all duration-200 cursor-pointer border-2 ${
                      isSelected
                        ? 'bg-blue-600 text-white font-bold border-blue-700 shadow-lg transform scale-105'
                        : isToday
                        ? 'bg-blue-100 text-blue-700 font-bold border-blue-300 shadow-md'
                        : isCurrentMonth
                        ? 'text-gray-700 hover:bg-gray-50 border-gray-200 hover:shadow-md hover:border-gray-300'
                        : 'text-gray-400 cursor-not-allowed border-gray-100 bg-gray-50'
                    }`}
                  >
                    {/* Day Number */}
                    <div className="text-lg font-semibold mb-1">
                      {day.getDate()}
                    </div>
                    
                    {/* Booking Indicators */}
                    <div className="absolute inset-x-2 bottom-2 space-y-1">
                      {/* Check-in indicator */}
                      {isCheckinDay && (
                        <div className="h-1.5 bg-green-500 rounded-full shadow-sm" title="เช็คอิน"></div>
                      )}
                      
                      {/* Stay period indicator */}
                      {dayBookings.length > 0 && (
                        <div className="h-1.5 bg-blue-400 rounded-full shadow-sm" title={`มีผู้พัก ${dayBookings.length} ห้อง`}></div>
                      )}
                      
                      {/* Check-out indicator */}
                      {isCheckoutDay && (
                        <div className="h-1.5 bg-red-500 rounded-full shadow-sm" title="เช็คเอาท์"></div>
                      )}
                      
                      {/* Guest count indicator */}
                      {dayBookings.length > 0 && (
                        <div className="text-xs text-center bg-black bg-opacity-75 text-white rounded px-1 py-0.5">
                          {dayBookings.length}
                        </div>
                      )}
                    </div>
                    
                    {/* Guest names tooltip */}
                    {dayBookings.length > 0 && (
                      <div className="absolute z-20 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs p-2 rounded-lg shadow-lg -top-16 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                        {dayBookings.slice(0, 3).map(booking => 
                          booking.customer_name || booking.guest_name || 'ไม่ระบุชื่อ'
                        ).join(', ')}
                        {dayBookings.length > 3 && ` และอีก ${dayBookings.length - 3} คน`}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>

          {/* Enhanced Legend */}
          <div className="mt-6 flex flex-wrap gap-6 justify-center bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-2 bg-green-500 rounded-full shadow-sm"></div>
              <span className="text-sm font-medium text-gray-700">เช็คอิน</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-2 bg-blue-400 rounded-full shadow-sm"></div>
              <span className="text-sm font-medium text-gray-700">ระหว่างพัก</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-2 bg-red-500 rounded-full shadow-sm"></div>
              <span className="text-sm font-medium text-gray-700">เช็คเอาท์</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-black bg-opacity-75 text-white rounded text-xs flex items-center justify-center font-bold">3</div>
              <span className="text-sm font-medium text-gray-700">จำนวนการจอง</span>
            </div>
          </div>

          {/* Selected Date Bookings - Enhanced */}
          <div className="mt-6 border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                การจองวันที่ {selectedDate.toLocaleDateString('th-TH', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h3>
              {dateBookingsLoading && (
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-64 overflow-y-auto">
              {dateBookingsLoading ? (
                <div className="col-span-full text-center text-gray-500 py-8">กำลังโหลดข้อมูล...</div>
              ) : (() => {
                // Filter bookings for selected date
                const selectedDayBookings = recentBookings.filter(booking => {
                  const checkinDate = new Date(
                    booking.checkin_date || 
                    booking.check_in_date || 
                    booking.check_in || 
                    booking.start_date
                  );
                  const checkoutDate = new Date(
                    booking.checkout_date || 
                    booking.check_out_date || 
                    booking.check_out || 
                    booking.end_date
                  );
                  const selectedDay = new Date(selectedDate);
                  
                  // Handle invalid dates
                  if (isNaN(checkinDate.getTime()) || isNaN(checkoutDate.getTime())) {
                    return false;
                  }
                  
                  checkinDate.setHours(0, 0, 0, 0);
                  checkoutDate.setHours(0, 0, 0, 0);
                  selectedDay.setHours(0, 0, 0, 0);
                  
                  return selectedDay >= checkinDate && selectedDay < checkoutDate;
                });
                
                return selectedDayBookings.length > 0 ? (
                  selectedDayBookings.map((booking) => {
                    const checkinDate = new Date(
                      booking.checkin_date || 
                      booking.check_in_date || 
                      booking.check_in || 
                      booking.start_date
                    );
                    const checkoutDate = new Date(
                      booking.checkout_date || 
                      booking.check_out_date || 
                      booking.check_out || 
                      booking.end_date
                    );
                    const selectedDay = new Date(selectedDate);
                    
                    // Handle invalid dates
                    if (isNaN(checkinDate.getTime()) || isNaN(checkoutDate.getTime())) {
                      return null;
                    }
                    
                    checkinDate.setHours(0, 0, 0, 0);
                    checkoutDate.setHours(0, 0, 0, 0);
                    selectedDay.setHours(0, 0, 0, 0);
                    
                    const isCheckinDay = selectedDay.getTime() === checkinDate.getTime();
                    const isCheckoutDay = selectedDay.getTime() === checkoutDate.getTime();
                    
                    return (
                      <div key={booking.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900 text-sm">
                              {booking.customer_name || booking.guest_name || booking.name || 'ไม่ระบุชื่อ'}
                            </h4>
                            {isCheckinDay && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">เช็คอิน</span>
                            )}
                            {isCheckoutDay && (
                              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">เช็คเอาท์</span>
                            )}
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            booking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                            booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {booking.status === 'confirmed' ? 'ยืนยัน' :
                             booking.status === 'pending' ? 'รอดำเนินการ' :
                             booking.status === 'completed' ? 'เสร็จสิ้น' :
                             booking.status === 'cancelled' ? 'ยกเลิก' :
                             booking.status}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>ห้อง: {booking.room_number || booking.room_name || 'TBD'}</p>
                          <p>ผู้เข้าพัก: {booking.guests || booking.guest_count || 1} คน</p>
                          <p>ระยะเวลา: {checkinDate.toLocaleDateString('th-TH')} - {checkoutDate.toLocaleDateString('th-TH')}</p>
                          <p>จำนวนคืน: {Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24))} คืน</p>
                          <p className="font-medium text-gray-900">ราคา: ฿{parseFloat(booking.total_price || booking.price || 0).toLocaleString()}</p>
                        </div>
                      </div>
                    );
                  }).filter(Boolean) // Remove null items
                ) : (
                  <div className="col-span-full text-center text-gray-500 py-8 bg-gray-50 rounded-lg">
                    <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p>ไม่มีการจองในวันนี้</p>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Bottom Section - Recent Bookings and Reviews */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Bookings */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">การจองล่าสุด</h3>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors">ดูทั้งหมด</button>
            </div>
              
              <div className="space-y-4">
                {bookingsLoading ? (
                  // Loading state
                  Array.from({ length: 4 }, (_, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 animate-pulse">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                      </div>
                      <div className="text-right">
                        <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                  ))
                ) : recentBookings.length > 0 ? (
                  recentBookings.map((booking) => {
                    const guestName = booking.guest_name || `${booking.guest_email ? booking.guest_email.split('@')[0] : 'Guest'}`;
                    const bookingDate = new Date(booking.created_at).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                    const roomName = booking.room_type_name || 'ไม่ระบุห้อง';
                    const guestCount = `${booking.guests} คน`;
                    
                    return (
                      <div key={booking.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                        <div className="relative">
                          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                              {guestName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                            booking.status === 'confirmed' ? 'bg-green-500' : 
                            booking.status === 'pending' ? 'bg-yellow-500' : 
                            booking.status === 'completed' ? 'bg-blue-500' : 'bg-gray-500'
                          }`}></div>
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900 font-medium">{guestName}</p>
                          <p className="text-gray-600 text-sm">{bookingDate}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-700 text-sm">{roomName}</p>
                          <p className="text-gray-600 text-xs">{guestCount}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  // Empty state
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm">ยังไม่มีการจองใหม่</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Customer Reviews */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">รีวิวลูกค้าล่าสุด</h3>
              <button className="text-gray-600 hover:text-gray-900 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>

            <div className="space-y-6 max-h-96 overflow-y-auto">
              {[
                {
                  id: 1,
                  name: 'CC',
                  initials: 'CC',
                  date: '26/04/2020, 12:42 AM',
                  rating: 5,
                  review: 'I have been there many times. Rooms, Food and Service are excellent we did lots of Excursions and all the places are from the Hotel reachable. we visited Long Waterfall and was very helpful and excellent'
                },
                {
                  id: 2,
                  name: 'Ali Muzair',
                  initials: 'AM',
                  date: '26/04/2020, 12:42 AM',
                  rating: 5,
                  review: 'I have been there many times. Rooms, Food and Service are excellent we did lots of Excursions and all the places are from the Hotel reachable. we visited Long Waterfall and was very helpful and excellent'
                }
              ].map((review) => (
                <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {review.initials}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{review.name}</h4>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                              }`}
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mb-3">Posted on {review.date}</p>
                      <p className="text-sm text-gray-700 leading-relaxed mb-4">
                        {review.review}
                      </p>
                      <div className="flex items-center gap-2">
                        <button className="w-8 h-8 bg-green-600 hover:bg-green-700 rounded-full flex items-center justify-center transition-colors">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button className="w-8 h-8 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-colors">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
