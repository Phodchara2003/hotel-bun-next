'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Users, MapPin, Wifi, Car, Coffee, Tv, Wind, Bed, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function RoomDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [room, setRoom] = useState(null);
  const [hotel, setHotel] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const fetchRoomDetails = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Fetching room details for ID:', params.id);
      
      // Use the same API endpoint as homepage for consistency with cache busting
      const roomTypesResponse = await fetch(`http://localhost:3001/api/room-types-with-images?t=${Date.now()}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
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

  // Refresh room data when page gets focus to show latest images
  useEffect(() => {
    const handleFocus = () => {
      if (params.id && !isLoading) {
        console.log('🔄 Refreshing room data on page focus');
        fetchRoomDetails();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [params.id, isLoading]);

  // Helper function to get bed type label
  const getBedTypeLabel = (bedType) => {
    const bedTypes = {
      'single': 'เตียงเดี่ยว',
      'double': 'เตียงคู่',
      'queen': 'เตียงควีน',
      'king': 'เตียงคิง',
      'twin': 'เตียงแฝด'
    };
    return bedTypes[bedType] || bedType;
  };

  // Image zoom functions
  const openImageModal = (index) => {
    setCurrentImageIndex(index);
    setShowImageModal(true);
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    document.body.style.overflow = 'auto'; // Restore scrolling
  };

  const goToPreviousImage = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? room.images.length - 1 : prevIndex - 1
    );
  };

  const goToNextImage = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === room.images.length - 1 ? 0 : prevIndex + 1
    );
  };

  // Close modal on escape key
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeImageModal();
      } else if (event.key === 'ArrowLeft') {
        goToPreviousImage();
      } else if (event.key === 'ArrowRight') {
        goToNextImage();
      }
    };

    if (showImageModal) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showImageModal, room?.images?.length]);

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
              <h1 className="text-3xl font-bold text-gray-900">
                {room.name}{room.bed_type ? ` - ${getBedTypeLabel(room.bed_type)}` : ''}
              </h1>
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
                <div 
                  key={index} 
                  className="relative aspect-w-16 aspect-h-9 rounded-lg overflow-hidden bg-gray-200 cursor-pointer group"
                  onClick={() => openImageModal(index)}
                >
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
                  {/* Overlay for click indication */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
                    <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="bg-black bg-opacity-50 rounded-full p-2">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                      </div>
                    </div>
                  </div>
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

      {/* Image Modal */}
      {showImageModal && room && room.images && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90" onClick={closeImageModal}>
          <div className="relative max-w-7xl max-h-full p-4" onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 transition-colors"
            >
              <X className="h-8 w-8" />
            </button>

            {/* Navigation buttons */}
            {room.images.length > 1 && (
              <>
                <button
                  onClick={goToPreviousImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:text-gray-300 transition-colors"
                >
                  <ChevronLeft className="h-10 w-10" />
                </button>
                <button
                  onClick={goToNextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:text-gray-300 transition-colors"
                >
                  <ChevronRight className="h-10 w-10" />
                </button>
              </>
            )}

            {/* Main image */}
            <div className="flex items-center justify-center">
              <img
                src={room.images[currentImageIndex]}
                alt={`${room.name} - รูปที่ ${currentImageIndex + 1}`}
                className="max-w-full max-h-screen object-contain"
                onError={(e) => {
                  console.log('❌ Modal image failed to load:', e.target.src);
                  const fallbackImages = ['/images/rooms/room1.jpg', '/images/rooms/room2.jpg', '/images/rooms/suite1.jpg'];
                  const fallbackSrc = fallbackImages[currentImageIndex % fallbackImages.length] || '/images/rooms/placeholder.svg';
                  if (e.target.src !== fallbackSrc) {
                    e.target.src = fallbackSrc;
                  }
                }}
              />
            </div>

            {/* Image counter */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black bg-opacity-50 rounded-full px-3 py-1">
              {currentImageIndex + 1} / {room.images.length}
            </div>

            {/* Thumbnail strip */}
            {room.images.length > 1 && (
              <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex space-x-2 bg-black bg-opacity-50 rounded-lg p-2">
                {room.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-12 h-12 rounded border-2 overflow-hidden ${
                      index === currentImageIndex ? 'border-white' : 'border-gray-400 opacity-60'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}