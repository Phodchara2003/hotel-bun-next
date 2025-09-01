'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { hotelAPI } from '../lib/api';
import { 
  Search, 
  Filter, 
  MapPin, 
  Star, 
  Users, 
  Wifi, 
  Car, 
  Coffee,
  Tv,
  Wind,
  Calendar,
  SortAsc,
  SortDesc,
  Grid,
  List
} from 'lucide-react';
import RoomCard from '../components/RoomCard';
import DatePickerComponent from '../components/DatePicker';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();
  const { language } = useLanguage();
  const [hotel, setHotel] = useState(null);
  const [roomTypes, setRoomTypes] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [maxGuests, setMaxGuests] = useState('');
  const [amenityFilters, setAmenityFilters] = useState([]);
  const [sortBy, setSortBy] = useState('price-asc'); // price-asc, price-desc, rating, size
  const [dateRange, setDateRange] = useState({
    checkIn: '',
    checkOut: ''
  });

  useEffect(() => {
    fetchHotelAndRooms();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [roomTypes, searchTerm, priceRange, maxGuests, amenityFilters, sortBy]);

  const fetchHotelAndRooms = async () => {
    try {
      const hotelResponse = await hotelAPI.getHotelById(1);
      setHotel(hotelResponse);
      setRoomTypes(hotelResponse.roomTypes || []);
    } catch (error) {
      console.error('Error fetching hotel data:', error);
      toast.error('ไม่สามารถโหลดข้อมูลห้องพักได้');
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...roomTypes];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(room => 
        room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Price filter
    filtered = filtered.filter(room => 
      room.pricePerNight >= priceRange[0] && room.pricePerNight <= priceRange[1]
    );

    // Max guests filter
    if (maxGuests) {
      filtered = filtered.filter(room => room.maxGuests >= parseInt(maxGuests));
    }

    // Amenity filters
    if (amenityFilters.length > 0) {
      filtered = filtered.filter(room => 
        amenityFilters.every(amenity => 
          room.amenities && room.amenities.includes(amenity)
        )
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.pricePerNight - b.pricePerNight;
        case 'price-desc':
          return b.pricePerNight - a.pricePerNight;
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'size':
          return (b.sizeSqm || 0) - (a.sizeSqm || 0);
        default:
          return 0;
      }
    });

    setFilteredRooms(filtered);
  };

  const handleAmenityFilter = (amenity) => {
    setAmenityFilters(prev => {
      if (prev.includes(amenity)) {
        return prev.filter(a => a !== amenity);
      } else {
        return [...prev, amenity];
      }
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setPriceRange([0, 10000]);
    setMaxGuests('');
    setAmenityFilters([]);
    setSortBy('price-asc');
    setDateRange({ checkIn: '', checkOut: '' });
  };

  const commonAmenities = [
    { id: 'wifi', name: 'Wi-Fi', icon: Wifi },
    { id: 'parking', name: 'ที่จอดรถ', icon: Car },
    { id: 'breakfast', name: 'อาหารเช้า', icon: Coffee },
    { id: 'tv', name: 'ทีวี', icon: Tv },
    { id: 'aircon', name: 'เครื่องปรับอากาศ', icon: Wind }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดข้อมูลห้องพัก...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hotel Header */}
        {hotel && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{hotel.name}</h1>
                <div className="flex items-center mt-2 text-gray-600">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{hotel.address}, {hotel.city}, {hotel.country}</span>
                </div>
                <div className="flex items-center mt-2">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < Math.floor(hotel.rating) ? 'fill-current' : ''}`} />
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-gray-600">({hotel.rating} จาก 5)</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">ห้องพักทั้งหมด</p>
                <p className="text-2xl font-bold text-blue-600">{roomTypes.length} ห้อง</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">ตัวกรอง</h2>
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  ล้างทั้งหมด
                </button>
              </div>

              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">ค้นหาห้องพัก</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="ชื่อห้อง, รายละเอียด..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Date Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">วันที่เข้าพัก</label>
                <div className="space-y-2">
                  <input
                    type="date"
                    value={dateRange.checkIn}
                    onChange={(e) => setDateRange(prev => ({ ...prev, checkIn: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="date"
                    value={dateRange.checkOut}
                    onChange={(e) => setDateRange(prev => ({ ...prev, checkOut: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ช่วงราคา (฿{priceRange[0].toLocaleString()} - ฿{priceRange[1].toLocaleString()})
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="10000"
                    step="500"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Guests */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">จำนวนผู้เข้าพัก</label>
                <select
                  value={maxGuests}
                  onChange={(e) => setMaxGuests(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">ไม่จำกัด</option>
                  <option value="1">1 คน</option>
                  <option value="2">2 คน</option>
                  <option value="3">3 คน</option>
                  <option value="4">4 คน หรือมากกว่า</option>
                </select>
              </div>

              {/* Amenities */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">สิ่งอำนวยความสะดวก</label>
                <div className="space-y-2">
                  {commonAmenities.map((amenity) => {
                    const IconComponent = amenity.icon;
                    return (
                      <label key={amenity.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={amenityFilters.includes(amenity.id)}
                          onChange={() => handleAmenityFilter(amenity.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <IconComponent className="h-4 w-4 ml-3 mr-2 text-gray-500" />
                        <span className="text-sm text-gray-700">{amenity.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Header with view toggle and sort */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <p className="text-gray-600">
                    พบ {filteredRooms.length} ห้องพัก
                  </p>
                  
                  {/* View Mode Toggle */}
                  <div className="flex border border-gray-300 rounded-lg">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-500'} rounded-l-lg`}
                    >
                      <Grid className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-500'} rounded-r-lg`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="price-asc">ราคา: ต่ำ → สูง</option>
                  <option value="price-desc">ราคา: สูง → ต่ำ</option>
                  <option value="rating">คะแนนรีวิว</option>
                  <option value="size">ขนาดห้อง</option>
                </select>
              </div>
            </div>

            {/* Rooms Grid/List */}
            {filteredRooms.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <Search className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่พบห้องพักที่ตรงกับเงื่อนไข</h3>
                <p className="text-gray-600 mb-4">ลองปรับเปลี่ยนตัวกรองหรือเงื่อนไขการค้นหา</p>
                <button
                  onClick={clearFilters}
                  className="btn-primary"
                >
                  ล้างตัวกรอง
                </button>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 
                'grid grid-cols-1 md:grid-cols-2 gap-6' : 
                'space-y-6'
              }>
                {filteredRooms.map((room) => (
                  <div key={room.id} className={`bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow ${
                    viewMode === 'list' ? 'flex' : ''
                  }`}>
                    <div className={viewMode === 'list' ? 'w-1/3' : 'w-full'}>
                      <div className="relative h-48 bg-gray-200">
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                          <span className="text-sm">ภาพห้องพัก</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className={`p-6 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{room.name}</h3>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600">฿{room.pricePerNight.toLocaleString()}</p>
                          <p className="text-sm text-gray-600">ต่อคืน</p>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{room.description}</p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          <span>{room.maxGuests} คน</span>
                        </div>
                        {room.sizeSqm && (
                          <div>
                            <span>{room.sizeSqm} ตร.ม.</span>
                          </div>
                        )}
                      </div>

                      {/* Amenities */}
                      {room.amenities && room.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {room.amenities.slice(0, 4).map((amenity, index) => (
                            <span key={index} className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                              {amenity}
                            </span>
                          ))}
                          {room.amenities.length > 4 && (
                            <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                              +{room.amenities.length - 4} อื่นๆ
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex space-x-3">
                        <Link 
                          href={`/rooms/${room.id}/book`}
                          className="flex-1 btn-primary text-center"
                        >
                          จองเลย
                        </Link>
                        <Link 
                          href={`/rooms/${room.id}`}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          ดูรายละเอียด
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
