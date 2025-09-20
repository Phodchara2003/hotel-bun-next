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
            allImages.push(`http://localhost:3001${img}`);
          } else if (!img.startsWith('http')) {
            allImages.push(`http://localhost:3001/uploads/room-images/${img}`);
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
  
  // Auto-rotate images on hover
  useEffect(() => {
    let interval;
    if (isHovered && allImages.length > 1) {
      interval = setInterval(() => {
        setImageIndex((prev) => (prev + 1) % allImages.length);
      }, 2000);
    } else {
      setImageIndex(0);
    }
    return () => clearInterval(interval);
  }, [isHovered, allImages.length]);

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

  return (
    <>
      <div 
        className="relative bg-white rounded-2xl shadow-lg transition-all duration-700 ease-out group hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-3 hover:scale-[1.02] overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Enhanced Room Image Section */}
        <div className="relative h-72 overflow-hidden">
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
            
            {/* Image Count */}
            {allImages.length > 1 && (
              <button
                onClick={() => setShowCarousel(true)}
                className="bg-black/70 backdrop-blur-sm hover:bg-black/90 text-white px-3 py-2 rounded-full flex items-center gap-2 text-sm transition-all transform hover:scale-105"
              >
                <Camera className="h-4 w-4" />
                <span>{allImages.length}</span>
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
          
          {/* Image dots indicator */}
          {allImages.length > 1 && isHovered && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              {allImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setImageIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === imageIndex 
                      ? 'bg-white w-6' 
                      : 'bg-white/50 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          )}
          
          {/* Interactive overlay for image gallery */}
          {allImages.length > 1 && (
            <div 
              className="absolute inset-0 cursor-pointer flex items-center justify-center"
              onClick={() => setShowCarousel(true)}
            >
              <div className={`transition-all duration-300 ${
                isHovered 
                  ? 'opacity-100 scale-100' 
                  : 'opacity-0 scale-95'
              } text-white text-sm font-medium bg-black/60 backdrop-blur-sm px-6 py-3 rounded-2xl border border-white/20`}>
                <Camera className="h-4 w-4 inline mr-2" />
                ดูรูปทั้งหมด {allImages.length} รูป
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
              <div className="flex items-center justify-center w-10 h-10 bg-green-500 rounded-lg mr-3">
                <Maximize className="h-5 w-5 text-white" />
              </div>
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
        </div></div>

        {/* Description */}
        <p className="dark-text-secondary text-sm mb-6 line-clamp-2 leading-relaxed">
          {roomType.description}
        </p>

        {/* Amenities */}
        {roomType.amenities && roomType.amenities.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold dark-text mb-3">สิ่งอำนวยความสะดวก</h4>
            <div className="flex flex-wrap gap-2">
              {roomType.amenities.slice(0, 4).map((amenity, index) => (
                <div 
                  key={index}
                  className="flex items-center bg-neutral-100 dark:bg-neutral-700 rounded-full px-3 py-1.5 text-xs dark-text-secondary"
                >
                  {getAmenityIcon(amenity)}
                  <span className="ml-1">{amenity}</span>
                </div>
              ))}
              {roomType.amenities.length > 4 && (
                <div className="flex items-center bg-primary-100 dark:bg-primary-900 rounded-full px-3 py-1.5 text-xs text-primary-700 dark:text-primary-300 font-medium">
                  +{roomType.amenities.length - 4} อื่นๆ
                </div>
              )}
            </div>
          </div>
        )}

        {/* Price & Action */}
        <div className="flex items-center justify-between pt-6 dark-border border-t">
          <div>
            <div className="text-2xl font-bold text-primary-600">
              ฿{(roomType.price || roomType.pricePerNight || 1500).toLocaleString()}
            </div>
            <div className="text-sm dark-text-muted">ต่อคืน (รวมภาษี)</div>
          </div>
          
          {isAuthenticated ? (
            <Link 
              href={`/rooms/${roomType.id}/book?hotelId=${hotelId}`}
              className="btn-primary shadow-lg"
              onClick={() => {
                console.log('Booking link clicked:', {
                  roomId: roomType.id,
                  hotelId: hotelId,
                  href: `/rooms/${roomType.id}/book?hotelId=${hotelId}`
                });
              }}
            >
              จองเลย
            </Link>
          ) : (
            <Link 
              href="/login"
              className="btn-primary shadow-lg"
              onClick={() => {
                console.log('Login link clicked');
              }}
            >
              เข้าสู่ระบบ
            </Link>
          )}
        </div>

        {/* View All Images Button */}
        {allImages.length > 1 && (
          <div className="mt-4 text-center">
            <button 
              onClick={() => setShowCarousel(true)}
              className="text-sm text-primary-600 hover:text-primary-700 transition-colors font-medium"
            >
              ดูรูปภาพทั้งหมด ({allImages.length} รูป)
            </button>
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
