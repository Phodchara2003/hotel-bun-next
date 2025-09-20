'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Users, MapPin, Wifi, Car, Coffee, Tv, Wind } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function RoomDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [room, setRoom] = useState(null);
  const [hotel, setHotel] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRoomDetails = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Fetching room details for ID:', params.id);
      
      // Use the same API endpoint as homepage for consistency
      const roomTypesResponse = await fetch('http://localhost:3001/api/room-types-with-images');
      const roomTypesData = await roomTypesResponse.json();
      
      if (roomTypesData.success && roomTypesData.data) {
        const foundRoom = roomTypesData.data.find(r => r.id.toString() === params.id);
        
        if (foundRoom) {
          console.log('🏠 Found room data:', foundRoom);
          
          // Process images using the same logic as homepage
          const flattenImageArray = (images) => {
            let flatImages = [];
            
            if (Array.isArray(images)) {
              images.forEach(img => {
                if (typeof img === 'string' && img.trim() && !img.includes('System.Object')) {
                  if (img.includes(' ')) {
                    const splitImages = img.split(' ').filter(i => i.trim() && !i.includes('System.Object'));
                    flatImages.push(...splitImages);
                  } else {
                    flatImages.push(img.trim());
                  }
                } else if (Array.isArray(img)) {
                  flatImages.push(...flattenImageArray(img));
                }
              });
            } else if (typeof images === 'string' && images.trim() && !images.includes('System.Object')) {
              if (images.includes(' ')) {
                flatImages.push(...images.split(' ').filter(i => i.trim() && !i.includes('System.Object')));
              } else {
                flatImages.push(images.trim());
              }
            }
            
            return flatImages;
          };
          
          let processedImages = [];
          if (foundRoom.images) {
            processedImages = flattenImageArray(foundRoom.images);
            processedImages = [...new Set(processedImages.filter(img => img && img.trim() && !img.includes('System.Object')))];
          }
          
          // Convert to public folder paths
          const imageUrls = processedImages.map(img => `/images/rooms/${img}`);
          
          // Add fallback images if no images available
          if (imageUrls.length === 0) {
            const fallbackImages = ['/images/rooms/room1.jpg', '/images/rooms/room2.jpg', '/images/rooms/suite1.jpg'];
            imageUrls.push(fallbackImages[(foundRoom.id - 1) % fallbackImages.length] || '/images/rooms/placeholder.svg');
          }

          const roomData = {
            id: foundRoom.id,
            name: foundRoom.name,
            description: foundRoom.description,
            price: parseFloat(foundRoom.price_per_night || 1500),
            maxGuests: parseInt(foundRoom.max_guests || 2),
            sizeSqm: parseInt(foundRoom.size_sqm || 30),
            amenities: Array.isArray(foundRoom.amenities) ? foundRoom.amenities : [],
            images: imageUrls,
            type: foundRoom.type,
            hotel_id: foundRoom.hotel_id,
            hotel_name: foundRoom.hotel_name,
            hotel_address: foundRoom.hotel_address
          };
          
          setRoom(roomData);
          
          // Set hotel data from room data
          if (foundRoom.hotel_name) {
            setHotel({
              id: foundRoom.hotel_id,
              name: foundRoom.hotel_name,
              address: foundRoom.hotel_address,
              description: foundRoom.hotel_description
            });
          }
          
          console.log('✅ Room details loaded:', roomData);
        } else {
          toast.error('ไม่พบข้อมูลห้องพักที่ระบุ');
          router.push('/');
        }
      } else {
        throw new Error('Failed to fetch room data');
      }
      
    } catch (error) {
      console.error('Error fetching room details:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลห้องพัก');
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchRoomDetails();
    }
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูลห้องพัก...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">ไม่พบข้อมูลห้องพัก</p>
          <Link href="/" className="text-blue-600 hover:text-blue-700">
            กลับสู่หน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button 
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            กลับ
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{room.name}</h1>
              <div className="flex items-center text-gray-600 mt-2">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{hotel?.name || 'โรงแรม'}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">
                ฿{room.price.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">ต่อคืน</div>
            </div>
          </div>
        </div>

        {/* Images Gallery */}
        <div className="mb-8">
          {room.images.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {room.images.map((image, index) => (
                <div key={index} className="relative aspect-w-16 aspect-h-9 rounded-lg overflow-hidden bg-gray-200">
                  <img 
                    src={image} 
                    alt={`${room.name} - รูปที่ ${index + 1}`}
                    className="w-full h-64 object-cover hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      console.log('❌ Image failed to load:', e.target.src);
                      // Try fallback to predefined room images
                      const fallbackImages = ['/images/rooms/room1.jpg', '/images/rooms/room2.jpg', '/images/rooms/suite1.jpg'];
                      const fallbackSrc = fallbackImages[index % fallbackImages.length] || '/images/rooms/placeholder.svg';
                      if (e.target.src !== fallbackSrc) {
                        e.target.src = fallbackSrc;
                      } else {
                        // Hide image and show placeholder
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }
                    }}
                  />
                  <div className="absolute inset-0 hidden items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600">
                    <div className="text-center">
                      <Calendar className="h-8 w-8 mx-auto mb-1" />
                      <span className="text-sm">ภาพห้องพัก</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg h-64 flex items-center justify-center">
              <div className="text-center text-blue-600">
                <Calendar className="h-12 w-12 mx-auto mb-2" />
                <span className="text-lg">ไม่มีรูปภาพ</span>
              </div>
            </div>
          )}
        </div>

        {/* Room Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4">รายละเอียดห้องพัก</h3>
              <p className="text-gray-700 leading-relaxed mb-6">
                {room.description}
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-gray-700">รองรับ {room.maxGuests} คน</span>
                </div>
                <div className="flex items-center">
                  <div className="h-5 w-5 text-gray-400 mr-2 flex items-center justify-center">
                    <span className="text-xs font-bold">㎡</span>
                  </div>
                  <span className="text-gray-700">ขนาด {room.sizeSqm} ตร.ม.</span>
                </div>
              </div>

              {/* Amenities */}
              <div>
                <h4 className="text-lg font-semibold mb-3">สิ่งอำนวยความสะดวก</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {room.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center">
                      <div className="h-5 w-5 text-blue-600 mr-2">
                        {amenity.toLowerCase().includes('wifi') ? <Wifi className="h-5 w-5" /> :
                         amenity.toLowerCase().includes('tv') ? <Tv className="h-5 w-5" /> :
                         amenity.toLowerCase().includes('ac') || amenity.toLowerCase().includes('air') ? <Wind className="h-5 w-5" /> :
                         amenity.toLowerCase().includes('car') || amenity.toLowerCase().includes('parking') ? <Car className="h-5 w-5" /> :
                         amenity.toLowerCase().includes('coffee') || amenity.toLowerCase().includes('minibar') ? <Coffee className="h-5 w-5" /> :
                         <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
                      </div>
                      <span className="text-gray-700">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Booking */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <div className="text-center mb-6">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  ฿{room.price.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">ต่อคืน</div>
              </div>

              {/* Booking Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">วันที่เช็คอิน</label>
                  <input 
                    type="date" 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">วันที่เช็คเอาท์</label>
                  <input 
                    type="date" 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนผู้เข้าพัก</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    {Array.from({ length: room.maxGuests }, (_, i) => i + 1).map(num => (
                      <option key={num} value={num}>{num} คน</option>
                    ))}
                  </select>
                </div>
              </div>

              <Link 
                href={`/booking-step?roomId=${room.id}&hotelId=${room.hotel_id}`}
                className="w-full bg-blue-600 text-white text-center py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold mt-6 block"
              >
                จองห้องนี้เลย
              </Link>

              <div className="text-center mt-4">
                <Link 
                  href="/"
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  ดูห้องพักอื่น ๆ
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}