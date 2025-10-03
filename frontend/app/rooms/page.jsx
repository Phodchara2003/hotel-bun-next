'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Users, Wifi, Car, Coffee, Tv, Wind, Star, ArrowLeft } from 'lucide-react';
import { hotelAPI } from '../../lib/api';
import { getRoomsData } from '../../lib/roomsData';
import { getRoomImageUrl, getRoomPlaceholder, getPlaceholderImageUrl } from '../../lib/roomImageUtils';
import { useAuth } from '../../contexts/AuthContext';

export default function RoomsPage() {
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
      
      // ดึงข้อมูลจาก API ก่อน (ข้อมูลล่าสุดที่แอดมินอัพเดต)
      const updatedRooms = await getRoomsData();
      setRooms(updatedRooms);
      
      // หากมีการค้นหาตามวันที่ ให้ตรวจสอบความพร้อมใช้งาน
      if (searchCriteria.checkin && searchCriteria.checkout) {
        try {
          const response = await hotelAPI.searchRooms(searchCriteria);
          if (response.success && response.data) {
            // รวมข้อมูลห้องที่อัพเดตแล้วกับสถานะความพร้อมใช้งาน
            const roomsWithAvailability = updatedRooms.map(room => {
              const availableRoom = response.data.find(ar => ar.id === room.id);
              return {
                ...room, // ใช้ข้อมูลล่าสุดจาก API (รวมรูปภาพที่อัพเดต)
                available: availableRoom ? availableRoom.available : false
              };
            });
            setRooms(roomsWithAvailability);
          }
        } catch (apiError) {
          console.log('Availability API not available, showing all rooms');
        }
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
              <Link href="/" className="inline-flex items-center text-slate-600 hover:text-slate-800 mb-4 font-thai">
                <ArrowLeft className="h-5 w-5 mr-2" />
                กลับหน้าหลัก
              </Link>
              <h1 className="text-3xl font-bold text-slate-800 font-thai-header">ห้องพักที่พร้อมให้บริการ</h1>
              {searchCriteria.checkin && searchCriteria.checkout && (
                <div className="mt-2 text-slate-600 font-thai">
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(searchCriteria.checkin)} - {formatDate(searchCriteria.checkout)}
                    </span>
                    <span className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {searchCriteria.guests} ผู้เข้าพัก
                    </span>
                    <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded font-medium">
                      {calculateNights()} คืน
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500 font-thai">พบห้องพัก</p>
              <p className="text-2xl font-bold text-slate-800">{rooms.length} ห้อง</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {rooms.map((room) => (
            <div key={room.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              {/* Room Image */}
              <div className="relative h-64 overflow-hidden">
                <img
                  src={getRoomImageUrl(room.image_url) || getRoomPlaceholder(room.bed_type)}
                  alt={room.name}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                  onError={(e) => {
                    e.target.src = getRoomPlaceholder(room.bed_type);
                  }}
                />
                {room.available && (
                  <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium font-thai">
                    ห้องว่าง
                  </div>
                )}
                {room.featured && (
                  <div className="absolute top-4 right-4 bg-amber-500 text-white px-3 py-1 rounded-full text-sm font-medium font-thai">
                    แนะนำ
                  </div>
                )}
              </div>

              {/* Room Details */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-800 mb-2 font-thai-header">{room.name}</h3>
                
                {/* Room Info */}
                <div className="flex items-center space-x-4 text-sm text-slate-600 mb-4 font-thai">
                  <span className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {room.max_occupancy} คน
                  </span>
                  <span>{room.bed_type}</span>
                </div>

                <p className="text-slate-600 mb-4 font-thai leading-relaxed">
                  {room.description}
                </p>

                {/* Amenities */}
                {room.amenities && room.amenities.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {room.amenities.slice(0, 3).map((amenity, i) => (
                        <span key={i} className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-thai">
                          {amenity}
                        </span>
                      ))}
                      {room.amenities.length > 3 && (
                        <span className="text-slate-500 text-xs font-thai">
                          +{room.amenities.length - 3} เพิ่มเติม
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Price and Book Button */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <div className="text-2xl font-bold text-slate-800 font-thai">
                      ฿{room.price_per_night?.toLocaleString()}
                    </div>
                    <div className="text-sm text-slate-500 font-thai">ต่อคืน</div>
                    {searchCriteria.checkin && searchCriteria.checkout && (
                      <div className="text-sm text-amber-600 font-medium font-thai">
                        รวม ฿{(room.price_per_night * calculateNights()).toLocaleString()} ({calculateNights()} คืน)
                      </div>
                    )}
                  </div>
                  <Link
                    href={`/rooms/${room.id}?${searchParams.toString()}`}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 font-thai"
                  >
                    จองเลย
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {rooms.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏨</div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2 font-thai-header">ไม่พบห้องพักที่ตรงกับเงื่อนไข</h2>
            <p className="text-slate-600 font-thai">กรุณาลองเปลี่ยนวันที่หรือจำนวนผู้เข้าพัก</p>
            <Link
              href="/"
              className="inline-block mt-4 bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 font-thai"
            >
              ค้นหาใหม่
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}