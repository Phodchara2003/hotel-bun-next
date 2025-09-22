'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { isStaffOrAdmin } from '../../../lib/roles';
import { bookingAPI } from '../../../lib/api';

export default function AdminDashboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [recentBookings, setRecentBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  
  // Calendar states
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateBookings, setDateBookings] = useState([]);
  const [dateBookingsLoading, setDateBookingsLoading] = useState(false);

  // Fetch recent bookings
  useEffect(() => {
    const fetchRecentBookings = async () => {
      try {
        setBookingsLoading(true);
        console.log('🔄 Fetching recent bookings...');
        
        const response = await bookingAPI.getAdminBookings({ 
          page: 1, 
          limit: 4, 
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
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* New Booking Card */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white relative overflow-hidden transform hover:scale-105 transition-transform duration-200">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-4xl font-bold mb-2">872</p>
                  <h3 className="text-blue-100 text-sm font-medium">New Booking</h3>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Schedule Room Card */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white relative overflow-hidden transform hover:scale-105 transition-transform duration-200">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-4xl font-bold mb-2">285</p>
                  <h3 className="text-green-100 text-sm font-medium">Schedule Room</h3>
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
                  <p className="text-4xl font-bold mb-2">53</p>
                  <h3 className="text-orange-100 text-sm font-medium">Check In</h3>
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
                  <p className="text-4xl font-bold mb-2">78</p>
                  <h3 className="text-red-100 text-sm font-medium">Check Out</h3>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
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
                    strokeDasharray="75, 100"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-gray-900">785</p>
                    <p className="text-gray-600 text-sm">Available Room Today</p>
                  </div>
                </div>
              </div>

              {/* Progress bars */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600 text-sm">Pending</span>
                    <span className="text-gray-900 text-sm font-medium">234</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600 text-sm">Done</span>
                    <span className="text-gray-900 text-sm font-medium">65</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '40%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600 text-sm">Finish</span>
                    <span className="text-gray-900 text-sm font-medium">763</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '80%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reservation Statistics */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-gray-900 text-xl font-semibold">Reservation Statistic</h3>
                <p className="text-gray-600 text-sm">Lorem ipsum dolor sit amet</p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">549</p>
                  <p className="text-gray-600 text-sm">Check In</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">327</p>
                  <p className="text-gray-600 text-sm">Check Out</p>
                </div>
                <button className="text-gray-600 hover:text-gray-900">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
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

        {/* Bottom Section - Calendar, Bookings, and Reviews */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Calendar and Recent Bookings */}
          <div className="space-y-6">
            {/* Calendar */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <button className="text-gray-600 hover:text-gray-900 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h3 className="text-gray-900 font-semibold">
                  {selectedDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
                </h3>
                <button className="text-gray-600 hover:text-gray-900 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 text-center text-sm">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                  <div key={day} className="text-gray-600 font-medium p-2">{day}</div>
                ))}
                
                {/* Calendar Days */}
                {Array.from({ length: 35 }, (_, i) => {
                  const day = i - 5; // Adjust for month start
                  const isCurrentMonth = day > 0 && day <= 30;
                  const today = new Date();
                  const isToday = day === today.getDate() && 
                                selectedDate.getMonth() === today.getMonth() && 
                                selectedDate.getFullYear() === today.getFullYear();
                  const isSelected = day === selectedDate.getDate() && isCurrentMonth;
                  
                  const handleDateClick = () => {
                    if (isCurrentMonth) {
                      // Create date at noon to avoid timezone issues
                      const newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day, 12, 0, 0);
                      console.log('📅 Calendar date clicked:', {
                        day,
                        newDate: newDate.toISOString().split('T')[0],
                        dateObject: newDate,
                        isCurrentMonth,
                        formattedDate: newDate.toLocaleDateString('th-TH')
                      });
                      setSelectedDate(newDate);
                    }
                  };
                  
                  return (
                    <div
                      key={i}
                      onClick={handleDateClick}
                      className={`p-2 rounded transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white font-bold'
                          : isToday
                          ? 'bg-blue-100 text-blue-600 font-bold'
                          : isCurrentMonth
                          ? 'text-gray-700 hover:bg-gray-100'
                          : 'text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {isCurrentMonth ? day : day <= 0 ? 31 + day : day - 30}
                      {isToday && !isSelected && <div className="w-1 h-1 bg-blue-600 rounded-full mx-auto mt-1"></div>}
                    </div>
                  );
                })}
              </div>

              {/* Selected Date Bookings */}
              <div className="mt-4 border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-900">
                    การจองวันที่ {selectedDate.toLocaleDateString('th-TH')}
                  </h4>
                  {dateBookingsLoading && (
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  )}
                </div>
                
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {dateBookingsLoading ? (
                    <div className="text-sm text-gray-500">กำลังโหลด...</div>
                  ) : dateBookings.length > 0 ? (
                    dateBookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                        <div>
                          <p className="font-medium text-gray-900">{booking.guest_name}</p>
                          <p className="text-gray-600">{booking.room_type_name} • {booking.guests} คน</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            booking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500 text-center py-2">
                      ไม่มีการจองในวันนี้
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Bookings */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-900 font-semibold">Newest Booking</h3>
                <button className="text-blue-600 hover:text-blue-700 text-sm transition-colors">More</button>
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

          {/* Right Column - Customer Reviews */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-gray-900 font-semibold">Latest Customer Review</h3>
              <button className="text-gray-600 hover:text-gray-900 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>

            <div className="space-y-6 max-h-96 overflow-y-auto">
              {[
                { name: 'Ali Muzair', date: '26/04/2020, 12:42 AM', rating: 5 },
                { name: 'Keanu Repes', date: '26/04/2020, 12:42 AM', rating: 4 },
                { name: 'Chintya Clara', date: '26/04/2020, 12:42 AM', rating: 5 },
                { name: 'Ali Muzair', date: '26/04/2020, 12:42 AM', rating: 5 }
              ].map((review, index) => (
                <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {review.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-gray-900 font-medium">{review.name}</h4>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }, (_, i) => (
                            <svg
                              key={i}
                              className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">Posted on {review.date}</p>
                      <p className="text-gray-700 text-sm leading-relaxed mb-3">
                        I have been there many times.Rooms, Food and Service are excellent we did lots of
                        Excursions and all the places are from the Hotel reachable. we visited Long Waterfall and
                        was very helpful and excellent
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
