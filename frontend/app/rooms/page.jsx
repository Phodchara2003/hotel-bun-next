'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Users, Wifi, Car, Coffee, Tv, Wind, Star, ArrowLeft } from 'lucide-react';
import { hotelAPI } from '../../lib/api';
import { getRoomsData } from '../../lib/roomsData';
import { getRoomImageUrl, getRoomPlaceholder, getPlaceholderImageUrl } from '../../lib/roomImageUtils';
import { useAuth } from '../../contexts/AuthContext';

function RoomsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchCriteria, setSearchCriteria] = useState({
    checkin: searchParams.get('checkin') || '',
    checkout: searchParams.get('checkout') || '',
    guests: parseInt(searchParams.get('guests')) || 1
  });

  useEffect(() => {
    fetchRooms();
  }, [searchParams]);

  const fetchRooms = async () => {
    try {
      setIsLoading(true);
      console.log('🚀 fetchRooms started');
      console.log('🔍 searchCriteria:', searchCriteria);
      
      // ดึงข้อมูลจาก API ก่อน (ข้อมูลล่าสุดที่แอดมินอัพเดต)
      const updatedRooms = await getRoomsData();
      console.log('📋 updatedRooms from getRoomsData:', updatedRooms.length, 'rooms');
      console.log('📋 updatedRooms IDs:', updatedRooms.map(r => r.id));
      setRooms(updatedRooms);
      
      // ตรวจสอบความพร้อมใช้งาน - หากมีการค้นหาตามวันที่ หรือแสดงห้องทั้งหมดถ้าไม่มีการค้นหา
      if (searchCriteria.checkin && searchCriteria.checkout) {
        console.log('🔍 Search with date criteria');
        try {
          const response = await hotelAPI.searchRooms(searchCriteria);
          console.log('🔍 Room search response structure:', response);
          console.log('🔍 Debug checks:');
          console.log('  - response.success:', response.success);
          console.log('  - response.data exists:', !!response.data);
          console.log('  - response.data.data exists:', !!(response.data && response.data.data));
          console.log('  - response.data.data length:', response.data && response.data.data ? response.data.data.length : 'N/A');
          
          if (response.success && response.data && response.data.data) {
            console.log('✅ All conditions met, processing rooms...');
            // รวมข้อมูลห้องที่อัพเดตแล้วกับสถานะความพร้อมใช้งาน
            const roomsWithAvailability = updatedRooms.map(room => {
              const availableRoom = response.data.data.find(ar => ar.room_type_id === room.id || ar.id === room.id);
              console.log(`🔍 Mapping room ${room.id}:`, availableRoom ? 'Found match' : 'No match');
              return {
                ...room, // ใช้ข้อมูลล่าสุดจาก API (รวมรูปภาพที่อัพเดต)
                available: availableRoom ? true : false, // ถ้าเจอในผลลัพธ์การค้นหา = ว่าง
                available_count: availableRoom ? availableRoom.available_count : 0,
                room_numbers: availableRoom ? availableRoom.room_numbers : []
              };
            });
            console.log('🎯 Final rooms with availability:', roomsWithAvailability.length);
            setRooms(roomsWithAvailability);
            console.log('✅ Room search completed, showing rooms with availability');
          } else {
            console.log('❌ No rooms available or invalid response structure');
            console.log('❌ Failed condition details:');
            console.log('  - response.success:', response.success);
            console.log('  - response.data:', response.data);
            console.log('  - response.data.data:', response.data && response.data.data);
          }
        } catch (apiError) {
          console.log('Availability API not available, showing all rooms');
        }
      } else {
        console.log('📋 No search criteria provided, showing all rooms as available');
        // แสดงห้องทั้งหมดเมื่อไม่มีการค้นหาตามวันที่
        const allRoomsAvailable = updatedRooms.map(room => ({
          ...room,
          available: true,
          available_count: room.id === 8 ? 6 : room.id === 10 ? 28 : 1, // จำนวนห้องตามฐานข้อมูล
          room_numbers: room.id === 8 ? ['507', '508', '509', '510', '511', '512'] : 
                       room.id === 10 ? ['501', '502', '503', '504', '505', '506'] : []
        }));
        setRooms(allRoomsAvailable);
        console.log('✅ All rooms set as available for display');
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateNights = () => {
    if (!searchCriteria.checkin || !searchCriteria.checkout) return 1;
    const checkin = new Date(searchCriteria.checkin);
    const checkout = new Date(searchCriteria.checkout);
    const timeDiff = checkout.getTime() - checkin.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-thai">กำลังค้นหาห้องพัก...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="inline-flex items-center text-slate-600 hover:text-slate-800 mb-4">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Home
              </Link>
              <h1 className="text-3xl font-bold text-slate-800">Available Rooms</h1>
              {searchCriteria.checkin && searchCriteria.checkout && (
                <div className="mt-2 text-slate-600 font-thai">
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(searchCriteria.checkin)} - {formatDate(searchCriteria.checkout)}
                    </span>
                    <span className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {searchCriteria.guests} Guests
                    </span>
                    <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded font-medium">
                      {calculateNights()} Nights
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Room Types Found</p>
              <p className="text-2xl font-bold text-slate-800">{rooms.length} Types</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rooms List */}
      <div className="container mx-auto px-6 py-8">
        <div className="space-y-8">
          {rooms.map((room, index) => (
            <div 
              key={room.id} 
              className="overflow-hidden transition-all duration-500 opacity-0 animate-fadeInUp"
              style={{
                animationDelay: `${index * 200}ms`,
                animationFillMode: 'forwards'
              }}
            >
              <div className="flex flex-col lg:flex-row">
                {/* Room Content */}
                <div className="lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center transform transition-all duration-700 hover:translate-x-2">
                  <h2 className="text-4xl lg:text-5xl font-light text-slate-800 mb-6 font-english-elegant italic">
                    {room.name === 'Standard Room' ? 'Standard' : room.name === 'Deluxe Room' ? 'Deluxe' : room.name}
                  </h2>
                  
                  <p className="text-slate-600 text-lg leading-relaxed mb-8 font-light font-english">
                    {room.description || 
                     (room.bed_type === 'Single' 
                       ? 'Our Standard Room offers a spacious and stylish design, complete with all the amenities you need for a comfortable stay. The room features a comfortable double bed, as well as a luxurious bathroom.'
                       : 'Our Deluxe Room offers the ultimate in luxury and comfort, with a spacious design and high-quality amenities. The room features a comfortable double bed, a seating area, a large flat-screen TV, as well as a luxurious bathroom.')
                    }
                  </p>

                  {/* Room Specs */}
                  <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                      <div className="text-sm text-slate-500 uppercase tracking-wide mb-1">GUESTS</div>
                      <div className="text-xl font-light text-slate-800">{room.max_occupancy} Guests</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500 uppercase tracking-wide mb-1">BED</div>
                      <div className="text-xl font-light text-slate-800 italic">
                        1 {room.bed_type} 
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-4">
                    <Link
                      href={`/rooms/${room.id}?${searchParams.toString()}`}
                      className="bg-slate-800 hover:bg-slate-900 text-white px-8 py-3 text-sm uppercase tracking-wider font-medium transition-all duration-300 flex-1 text-center transform hover:scale-105 hover:shadow-lg font-english"
                    >
                      BOOK NOW
                    </Link>
                    <Link
                      href={`/rooms/${room.id}`}
                      className="border border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-800 px-8 py-3 text-sm uppercase tracking-wider font-medium transition-all duration-300 flex-1 text-center transform hover:scale-105 hover:shadow-md hover:bg-slate-50 font-english"
                    >
                      DETAILS
                    </Link>
                  </div>

                  {/* Price Info */}
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-light text-slate-800">
                          ฿{room.price_per_night?.toLocaleString()}
                        </div>
                        <div className="text-sm text-slate-500 font-english">per night</div>
                      </div>
                    </div>
                    {searchCriteria.checkin && searchCriteria.checkout && (
                      <div className="text-sm text-slate-600 mt-2 font-english">
                        Total: ฿{(room.price_per_night * calculateNights()).toLocaleString()} ({calculateNights()} nights)
                      </div>
                    )}
                  </div>
                </div>

                {/* Room Image */}
                <div className="lg:w-1/2 relative group">
                  <div className="h-64 lg:h-full min-h-[400px] relative overflow-hidden">
                    <img
                      src={getRoomImageUrl(room.image_url) || getRoomPlaceholder(room.bed_type)}
                      alt={room.name}
                      className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-110"
                      onError={(e) => {
                        e.target.src = getRoomPlaceholder(room.bed_type);
                      }}
                    />
                    
                    {/* Decorative Pattern Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-l from-transparent to-black/5"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {rooms.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏨</div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">No rooms found matching your criteria</h2>
            <p className="text-slate-600">Please try changing your dates or number of guests</p>
            <Link
              href="/"
              className="inline-block mt-4 bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
            >
              Search Again
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingRooms() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading rooms...</p>
        </div>
      </div>
    </div>
  );
}

export default function RoomsPage() {
  return (
    <Suspense fallback={<LoadingRooms />}>
      <RoomsContent />
    </Suspense>
  );
}