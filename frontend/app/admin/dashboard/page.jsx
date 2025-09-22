'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { isStaffOrAdmin } from '../../../lib/roles';

export default function AdminDashboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();

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
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          </div>
          
          {/* Search and User Info */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search here"
                className="bg-gray-100 text-gray-900 placeholder-gray-500 px-4 py-2 pr-10 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 w-64"
              />
              <svg className="absolute right-3 top-2.5 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            {/* Notifications */}
            <div className="relative">
              <button className="bg-gray-100 p-2 rounded-lg hover:bg-gray-200 transition-colors">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5-5-5h5z" />
                </svg>
              </button>
              <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">3</span>
            </div>

            {/* Settings */}
            <button className="bg-gray-100 p-2 rounded-lg hover:bg-gray-200 transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user?.username?.charAt(0).toUpperCase() || 'J'}
                </span>
              </div>
              <div>
                <p className="text-gray-900 text-sm font-medium">{user?.username || 'John Doe'}</p>
                <p className="text-gray-600 text-xs">Superadmin</p>
              </div>
            </div>
          </div>
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
                <h3 className="text-gray-900 font-semibold">September 2025</h3>
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
                  const isToday = day === 22;
                  
                  return (
                    <div
                      key={i}
                      className={`p-2 rounded transition-colors cursor-pointer ${
                        isToday
                          ? 'bg-blue-600 text-white font-bold'
                          : isCurrentMonth
                          ? 'text-gray-700 hover:bg-gray-100'
                          : 'text-gray-400'
                      }`}
                    >
                      {isCurrentMonth ? day : day <= 0 ? 31 + day : day - 30}
                      {isToday && <div className="w-1 h-1 bg-yellow-400 rounded-full mx-auto mt-1"></div>}
                    </div>
                  );
                })}
              </div>

              {/* Occupancy indicators */}
              <div className="mt-4 flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                  <span className="text-gray-600">70% Check In</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-gray-600">30% Check Out</span>
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
                {[
                  { name: 'Samantha Humble', date: 'October 3th, 2020', room: 'Room A-21', persons: '3-5 Person', status: 'online' },
                  { name: 'Louise Marquee', date: 'October 3th, 2020', room: 'Room A-21', persons: '3-5 Person', status: 'away' },
                  { name: 'Richard Smile', date: 'October 3th, 2020', room: 'Room A-21', persons: '3-5 Person', status: 'online' },
                  { name: 'Bella Yen', date: 'October 3th, 2020', room: 'Room A-21', persons: '3-5 Person', status: 'offline' }
                ].map((booking, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="relative">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {booking.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                        booking.status === 'online' ? 'bg-green-500' : 
                        booking.status === 'away' ? 'bg-yellow-500' : 'bg-gray-500'
                      }`}></div>
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900 font-medium">{booking.name}</p>
                      <p className="text-gray-600 text-sm">{booking.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-700 text-sm">{booking.room}</p>
                      <p className="text-gray-600 text-xs">{booking.persons}</p>
                    </div>
                  </div>
                ))}
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
