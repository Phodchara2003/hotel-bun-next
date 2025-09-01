'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Users, Maximize, Bed, Wifi, Car, Coffee, Bath, Camera } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ImageCarousel from './ImageCarousel';

const RoomCard = ({ roomType, hotelId }) => {
  const { isAuthenticated } = useAuth();
  const [showCarousel, setShowCarousel] = useState(false);

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
    if (roomType.images && Array.isArray(roomType.images)) {
      // Add images array, but avoid duplicates
      roomType.images.forEach(img => {
        if (img && !allImages.includes(img)) {
          // Convert relative API paths to full URLs
          if (img.startsWith('/api/')) {
            allImages.push(`http://localhost:3001${img}`);
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
  const mainImage = allImages[0];

  return (
    <>
      <div className="card-elevated group transition-all duration-300 hover:transform hover:-translate-y-2">
        {/* Room Image */}
        <div className="relative h-64 overflow-hidden">
          <Image
            src={mainImage}
            alt={roomType.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {/* Multiple Images Indicator */}
          {allImages.length > 1 && (
            <button
              onClick={() => setShowCarousel(true)}
              className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm hover:bg-black/80 text-white px-3 py-2 rounded-xl flex items-center space-x-2 text-sm transition-all"
            >
              <Camera className="h-4 w-4" />
              <span>{allImages.length}</span>
            </button>
          )}
          
          {/* Price Badge */}
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg">
            <div className="text-lg font-bold text-primary-600">
              ฿{roomType.pricePerNight?.toLocaleString()}
            </div>
            <div className="text-xs dark-text-muted">ต่อคืน</div>
          </div>

          {/* View More Images Overlay */}
          {allImages.length > 1 && (
            <div 
              className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all cursor-pointer flex items-center justify-center"
              onClick={() => setShowCarousel(true)}
            >
              <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm font-medium bg-black/60 backdrop-blur-sm px-4 py-2 rounded-xl">
                ดูรูปทั้งหมด {allImages.length} รูป
              </div>
            </div>
          )}
        </div>

      {/* Room Info */}
      <div className="p-6">
        {/* Room Name & Details */}
        <div className="mb-4">
          <h3 className="text-xl font-semibold dark-text mb-3">
            {roomType.name}
          </h3>
          
          {/* Room Specs */}
          <div className="flex items-center gap-4 text-sm dark-text-secondary mb-4">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 bg-primary-100 rounded-lg mr-2">
                <Users className="h-4 w-4 text-primary-600" />
              </div>
              <span>{roomType.maxGuests} ผู้เข้าพัก</span>
            </div>
            {roomType.sizeSqm && (
              <div className="flex items-center">
                <div className="flex items-center justify-center w-8 h-8 bg-secondary-100 rounded-lg mr-2">
                  <Maximize className="h-4 w-4 text-secondary-600" />
                </div>
                <span>{roomType.sizeSqm} ตรม.</span>
              </div>
            )}
          </div>
        </div>

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
              ฿{roomType.pricePerNight?.toLocaleString()}
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
