'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Users, 
  Maximize, 
  Bed, 
  Wifi, 
  Car, 
  Coffee, 
  Bath, 
  Camera, 
  Star,
  Heart,
  Share2,
  Eye,
  Clock,
  CheckCircle,
  Sparkles,
  TrendingUp,
  Zap,
  Award,
  Shield,
  Palette
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ImageCarousel from './ImageCarousel';

const RoomCard = ({ roomType, hotelId }) => {
  const { isAuthenticated } = useAuth();
  const [showCarousel, setShowCarousel] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [showQuickView, setShowQuickView] = useState(false);

  // Debug log for component render
  useEffect(() => {
    console.log(`🏠 RoomCard rendered for: ${roomType.name}, Images: ${getAllImages().length}`);
  }, [roomType.name]);

  // Debug log for imageIndex changes
  useEffect(() => {
    console.log(`📸 ${roomType.name} - Image index changed to: ${imageIndex}`);
  }, [imageIndex, roomType.name]);

  // Auto-rotate images every 5 seconds when hovered (optional)
  useEffect(() => {
    if (isHovered && allImages.length > 1) {
      const interval = setInterval(() => {
        setImageIndex((prev) => (prev + 1) % allImages.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isHovered, allImages.length]);

  const getAmenityIcon = (amenity) => {
    const amenityLower = amenity.toLowerCase();
    if (amenityLower.includes('wifi')) return <Wifi className="h-4 w-4" />;
    if (amenityLower.includes('ที่จอดรถ') || amenityLower.includes('car')) return <Car className="h-4 w-4" />;
    if (amenityLower.includes('กาแฟ') || amenityLower.includes('coffee')) return <Coffee className="h-4 w-4" />;
    if (amenityLower.includes('อ่างอาบน้ำ') || amenityLower.includes('bath')) return <Bath className="h-4 w-4" />;
    return <Bed className="h-4 w-4" />;
  };

  // Get all available images with fallback images based on room type
  const getAllImages = () => {
    const allImages = [];
    
    // First, check if we have actual images from the API
    if (roomType.image) allImages.push(roomType.image);
    
    if (roomType.images) {
      let processedImages = [];
      
      if (Array.isArray(roomType.images)) {
        processedImages = roomType.images;
      } else if (typeof roomType.images === 'string') {
        try {
          // Try parsing as JSON first
          const parsedImages = JSON.parse(roomType.images);
          processedImages = Array.isArray(parsedImages) ? parsedImages : [roomType.images];
        } catch {
          // If not JSON, treat as space-separated string
          processedImages = roomType.images.split(' ').filter(img => img.trim());
        }
      }
      
      // Add processed images, but avoid duplicates
      processedImages.forEach(img => {
        if (img && !allImages.includes(img)) {
          // Convert relative paths to full URLs
          if (img.startsWith('/api/') || img.startsWith('/uploads/')) {
            allImages.push(`http://localhost:5680${img}`);
          } else if (!img.startsWith('http')) {
            allImages.push(`http://localhost:5680/uploads/room-images/${img}`);
          } else {
            allImages.push(img);
          }
        }
      });
    }
    
    // If we have real images, use them
    if (allImages.length > 0) {
      return allImages;
    }
    
    // Otherwise, use beautiful fallback images based on room type or name
    const roomTypeLower = (roomType.name || roomType.type || '').toLowerCase();
    if (roomTypeLower.includes('standard')) {
      return [
        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80',
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80'
      ];
    } else if (roomTypeLower.includes('deluxe')) {
      return [
        'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600&q=80',
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&q=80'
      ];
    } else if (roomTypeLower.includes('junior') || roomTypeLower.includes('suite')) {
      return [
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&q=80',
        'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600&q=80'
      ];
    } else if (roomTypeLower.includes('executive')) {
      return [
        'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600&q=80',
        'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=600&q=80'
      ];
    } else if (roomTypeLower.includes('presidential')) {
      return [
        'https://images.unsplash.com/photo-1506059612708-99d6c258160e?w=600&q=80',
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&q=80'
      ];
    } else {
      // Default hotel room images
      return [
        'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600&q=80',
        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80'
      ];
    }
  };

  const allImages = getAllImages();
  const mainImage = allImages[imageIndex];
  
  // Mock data for enhanced features
  const mockRating = 4.8;
  const mockReviewsCount = 156;
  const mockAvailableRooms = Math.floor(Math.random() * 5) + 1;
  const mockIsPopular = mockRating >= 4.7;
  const mockHasDiscount = Math.random() > 0.7;
  const mockDiscountPercent = mockHasDiscount ? Math.floor(Math.random() * 30) + 10 : 0;
  const mockOriginalPrice = roomType.price || roomType.pricePerNight || 1500;
  const mockFinalPrice = mockHasDiscount ? Math.floor(mockOriginalPrice * (1 - mockDiscountPercent / 100)) : mockOriginalPrice;
  const mockBookedToday = Math.floor(Math.random() * 8) + 2;
  
  // Auto-rotate images on hover (disabled to allow manual control)
  useEffect(() => {
    // Reset to first image when not hovered for consistency
    if (!isHovered) {
      const timer = setTimeout(() => {
        setImageIndex(0);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isHovered]);

  const handleFavoriteToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorited(!isFavorited);
  };

  const handleShare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: roomType.name,
        text: `ดูห้องพักสุดพิเศษ ${roomType.name}`,
        url: window.location.href,
      });
    }
  };

  // Navigation helper functions
  const goToPreviousImage = () => {
    setImageIndex((prev) => {
      const newIndex = prev === 0 ? allImages.length - 1 : prev - 1;
      console.log(`📸 Previous: ${prev} → ${newIndex}`);
      return newIndex;
    });
  };

  const goToNextImage = () => {
    setImageIndex((prev) => {
      const newIndex = (prev + 1) % allImages.length;
      console.log(`📸 Next: ${prev} → ${newIndex}`);
      return newIndex;
    });
  };

  const goToImage = (index) => {
    console.log(`📸 Jump to image: ${imageIndex} → ${index}`);
    setImageIndex(index);
  };

  return (
    <>
      <div 
        className="relative bg-white rounded-2xl shadow-lg transition-all duration-700 ease-out group hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-3 hover:scale-[1.02] overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Enhanced Room Image Section */}
        <div className="relative h-72 overflow-hidden group-hover:cursor-pointer" title={allImages.length > 1 ? "คลิกเพื่อดูรูปถัดไป หรือคลิกจุดด้านล่างเพื่อเลือกรูป" : ""}>
          {/* Main Image with enhanced animations */}
          <Image
            src={mainImage}
            alt={roomType.name}
            fill
            className={`object-cover transition-all duration-700 ${
              isHovered ? 'scale-110 brightness-110' : 'scale-100'
            } ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onLoad={() => setIsImageLoaded(true)}
          />
          
          {/* Click to open gallery overlay */}
          <div 
            className="absolute inset-0 cursor-pointer z-10 bg-black/0 hover:bg-black/10 transition-all duration-300"
            onClick={(e) => {
              e.stopPropagation();
              console.log('🖱️ Image clicked - Opening gallery');
              setShowCarousel(true);
            }}
            title="คลิกเพื่อดูแกลเลอรี่รูปภาพ"
          />

          {/* Navigation arrows - always visible when multiple images */}
          {allImages.length > 1 && (
            <>
              {/* Previous Image Arrow */}
              <button
                className="absolute left-3 top-1/2 transform -translate-y-1/2 z-20 bg-black/70 hover:bg-black/90 text-white p-3 rounded-full transition-all duration-200 hover:scale-110 shadow-lg border-2 border-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('⬅️ Previous arrow clicked');
                  goToPreviousImage();
                }}
                title="รูปก่อนหน้า"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Next Image Arrow */}
              <button
                className="absolute right-3 top-1/2 transform -translate-y-1/2 z-20 bg-black/70 hover:bg-black/90 text-white p-3 rounded-full transition-all duration-200 hover:scale-110 shadow-lg border-2 border-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('➡️ Next arrow clicked');
                  goToNextImage();
                }}
                title="รูปถัดไป"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
          
          {/* Loading shimmer effect */}
          {!isImageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 animate-pulse" />
          )}
          
          {/* Dynamic gradient overlays */}
          <div className={`absolute inset-0 transition-all duration-500 ${
            isHovered 
              ? 'bg-gradient-to-t from-black/60 via-black/20 to-transparent' 
              : 'bg-gradient-to-t from-black/30 via-transparent to-transparent'
          }`} />
          
          {/* Floating Action Buttons */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {/* Popular Badge */}
            {mockIsPopular && (
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg animate-pulse">
                <Sparkles className="h-3 w-3" />
                ยอดนิยม
              </div>
            )}
            
            {/* Discount Badge */}
            {mockHasDiscount && (
              <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                ลด {mockDiscountPercent}%
              </div>
            )}
            
            {/* Enhanced Gallery Button */}
            {allImages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('📷 Gallery button clicked');
                  setShowCarousel(true);
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2.5 rounded-full flex items-center gap-2 text-sm font-medium transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <Camera className="h-4 w-4" />
                <span>แกลเลอรี่ ({allImages.length})</span>
              </button>
            )}
          </div>
          
          {/* Top Right Actions */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            {/* Price Badge */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-xl border border-white/20">
              {mockHasDiscount && (
                <div className="text-xs text-gray-500 line-through">
                  ฿{mockOriginalPrice.toLocaleString()}
                </div>
              )}
              <div className="text-lg font-bold text-blue-600">
                ฿{mockFinalPrice.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600">ต่อคืน</div>
            </div>
            
            {/* Action Buttons */}
            <div className={`flex flex-col gap-2 transition-all duration-300 ${
              isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            }`}>
              <button
                onClick={handleFavoriteToggle}
                className={`p-2.5 rounded-full backdrop-blur-sm transition-all transform hover:scale-110 ${
                  isFavorited 
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' 
                    : 'bg-white/90 text-gray-700 hover:bg-white'
                }`}
              >
                <Heart className={`h-4 w-4 ${isFavorited ? 'fill-current' : ''}`} />
              </button>
              
              <button
                onClick={handleShare}
                className="p-2.5 bg-white/90 backdrop-blur-sm hover:bg-white text-gray-700 rounded-full transition-all transform hover:scale-110"
              >
                <Share2 className="h-4 w-4" />
              </button>
              
              <button
                onClick={() => setShowQuickView(true)}
                className="p-2.5 bg-white/90 backdrop-blur-sm hover:bg-white text-gray-700 rounded-full transition-all transform hover:scale-110"
              >
                <Eye className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {/* Image dots indicator - แสดงตลอดเวลา */}
          {allImages.length > 1 && (
            <div className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 transition-opacity duration-300 z-30 ${
              isHovered ? 'opacity-100' : 'opacity-70'
            }`}>
              {allImages.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log(`🔘 Dot ${index + 1} clicked`);
                    setImageIndex(index);
                  }}
                  className={`transition-all duration-300 rounded-full cursor-pointer hover:scale-125 ${
                    index === imageIndex 
                      ? 'bg-white w-6 h-2 shadow-lg' 
                      : 'bg-white/60 hover:bg-white/90 w-2 h-2'
                  }`}
                  title={`ดูรูปที่ ${index + 1}`}
                />
              ))}
            </div>
          )}
          
          {/* Interactive hint overlay */}
          {allImages.length > 1 && isHovered && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <div className="text-white text-xs font-medium bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/20 opacity-80">
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>คลิกเปลี่ยนรูป</span>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          )}
          
          {/* Enhanced dots indicator with counter */}
          {allImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
              <div className="flex items-center gap-3 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full">
                {/* Image counter */}
                <span className="text-white text-xs font-medium">
                  {imageIndex + 1}/{allImages.length}
                </span>
                
                {/* Dots */}
                <div className="flex gap-1.5">
                  {allImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log(`🔘 Dot ${index + 1} clicked`);
                        goToImage(index);
                      }}
                      className={`w-2 h-2 rounded-full transition-all duration-300 hover:scale-125 ${
                        index === imageIndex 
                          ? 'bg-white shadow-lg' 
                          : 'bg-white/50 hover:bg-white/80'
                      }`}
                      title={`ดูรูปที่ ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Room Info */}
        <div className="p-6 space-y-4">
          {/* Header with rating */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                {roomType.name}
              </h3>
              
              {/* Rating and Reviews */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 transition-all duration-200 ${
                        star <= Math.floor(mockRating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : star - 0.5 <= mockRating
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="text-sm font-semibold text-gray-900 ml-1">
                    {mockRating}
                  </span>
                </div>
                <span className="text-sm text-gray-600">
                  ({mockReviewsCount} รีวิว)
                </span>
                {mockRating >= 4.5 && (
                  <div className="flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                    <Award className="h-3 w-3 mr-1" />
                    เยี่ยม
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Room Specs with enhanced design */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center p-3 bg-blue-50 rounded-xl transition-all hover:bg-blue-100">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-500 rounded-lg mr-3">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  {roomType.maxGuests} ผู้เข้าพัก
                </div>
                <div className="text-xs text-gray-600">สูงสุด</div>
              </div>
            </div>
            
            {roomType.sizeSqm && (
              <div className="flex items-center p-3 bg-green-50 rounded-xl transition-all hover:bg-green-100">
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    {roomType.sizeSqm} ตรม.
                  </div>
                  <div className="text-xs text-gray-600">พื้นที่</div>
                </div>
              </div>
            )}
          </div>
          
          {/* Booking status and urgency */}
          <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl border border-orange-100">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">
                จองแล้ว {mockBookedToday} ครั้งวันนี้
              </span>
            </div>
            <div className="flex items-center gap-1 text-sm text-orange-600">
              <Clock className="h-4 w-4" />
              เหลือ {mockAvailableRooms} ห้อง
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-600 text-sm mb-6 line-clamp-2 leading-relaxed">
            {roomType.description}
          </p>

          {/* Enhanced Amenities */}
          {roomType.amenities && roomType.amenities.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                <Sparkles className="h-4 w-4 mr-2 text-purple-500" />
                สิ่งอำนวยความสะดวก
              </h4>
              <div className="flex flex-wrap gap-2">
                {roomType.amenities.slice(0, 4).map((amenity, index) => (
                  <div 
                    key={index}
                    className="group flex items-center bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border border-blue-100 rounded-full px-3 py-2 text-xs text-gray-700 transition-all duration-300 hover:scale-105 cursor-pointer"
                  >
                    {getAmenityIcon(amenity)}
                    <span className="ml-2 font-medium">{amenity}</span>
                  </div>
                ))}
                {roomType.amenities.length > 4 && (
                  <div className="flex items-center bg-gradient-to-r from-indigo-100 to-purple-100 border border-indigo-200 rounded-full px-3 py-2 text-xs text-indigo-700 font-medium">
                    <Zap className="h-3 w-3 mr-1" />
                    +{roomType.amenities.length - 4} อื่นๆ
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Enhanced Price & Action */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-100">
            <div>
              {mockHasDiscount && (
                <div className="text-sm text-gray-500 line-through mb-1">
                  ฿{mockOriginalPrice.toLocaleString()}
                </div>
              )}
              <div className="text-2xl font-bold text-blue-600 flex items-center">
                ฿{mockFinalPrice.toLocaleString()}
                {mockHasDiscount && (
                  <span className="ml-2 bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-medium">
                    ประหยัด ฿{(mockOriginalPrice - mockFinalPrice).toLocaleString()}
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-600">ต่อคืน (รวมภาษี)</div>
            </div>
            
            {isAuthenticated ? (
              <Link 
                href={`/rooms/${roomType.id}?hotelId=${hotelId}`}
                className="group relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 overflow-hidden"
                onClick={() => {
                  console.log('Booking link clicked:', {
                    roomId: roomType.id,
                    hotelId: hotelId,
                    href: `/rooms/${roomType.id}?hotelId=${hotelId}`
                  });
                }}
              >
                <span className="relative z-10 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  จองเลย
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
            ) : (
              <Link 
                href="/login"
                className="group relative bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                onClick={() => {
                  console.log('Login link clicked');
                }}
              >
                <span className="flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  เข้าสู่ระบบ
                </span>
              </Link>
            )}
          </div>

          {/* View All Images Button with Instructions */}
          {allImages.length > 1 && (
            <div className="mt-4 text-center space-y-2">
              <button 
                onClick={() => setShowCarousel(true)}
                className="group text-sm text-blue-600 hover:text-blue-700 transition-colors font-medium flex items-center justify-center w-full py-2 rounded-lg hover:bg-blue-50"
              >
                <Camera className="h-4 w-4 mr-2 transition-transform group-hover:scale-110" />
                ดูแกลเลอรี่ทั้งหมด ({allImages.length} รูป) • ปัจจุบัน: รูปที่ {imageIndex + 1}
              </button>
              <p className="text-xs text-gray-500">
                💡 คลิกลูกศร ⬅️ ➡️ เพื่อเปลี่ยนรูป | คลิกจุด • เพื่อเลือกรูป | คลิกปุ่มแกลเลอรี่เพื่อดูทั้งหมด
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Image Carousel Modal */}
      <ImageCarousel
        images={allImages}
        isOpen={showCarousel}
        onClose={() => setShowCarousel(false)}
        initialIndex={0}
      />
    </>
  );
};

export default RoomCard;