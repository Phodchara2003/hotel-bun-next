'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star, MapPin, Wifi, Car, Coffee, Users } from 'lucide-react';

const HotelCard = ({ hotel }) => {
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
      );
    }
    
    if (hasHalfStar) {
      stars.push(
        <Star key="half" className="h-4 w-4 fill-yellow-200 text-yellow-400" />
      );
    }
    
    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />
      );
    }
    
    return stars;
  };

  const getAmenityIcon = (amenity) => {
    const amenityLower = amenity.toLowerCase();
    if (amenityLower.includes('wifi')) return <Wifi className="h-4 w-4" />;
    if (amenityLower.includes('parking') || amenityLower.includes('car')) return <Car className="h-4 w-4" />;
    if (amenityLower.includes('restaurant') || amenityLower.includes('coffee')) return <Coffee className="h-4 w-4" />;
    if (amenityLower.includes('pool') || amenityLower.includes('gym')) return <Users className="h-4 w-4" />;
    return null;
  };

  return (
    <div className="card hover:shadow-xl transition-shadow duration-300">
      {/* Hotel Image */}
      <div className="relative h-48 sm:h-56">
        <Image
          src={hotel.images?.[0] || '/api/placeholder/400/300'}
          alt={hotel.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        
        {/* Rating Badge */}
        <div className="absolute top-4 right-4 bg-white rounded-lg px-2 py-1 shadow-md">
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{hotel.rating}</span>
          </div>
        </div>
      </div>

      {/* Hotel Info */}
      <div className="p-6">
        {/* Hotel Name & Location */}
        <div className="mb-3">
          <h3 className="text-xl font-semibold text-gray-900 mb-1">
            {hotel.name}
          </h3>
          <div className="flex items-center text-gray-600">
            <MapPin className="h-4 w-4 mr-1" />
            <span className="text-sm">{hotel.city}, {hotel.country}</span>
          </div>
        </div>

        {/* Rating Stars */}
        <div className="flex items-center mb-3">
          {renderStars(hotel.rating)}
          <span className="ml-2 text-sm text-gray-600">
            ({hotel.rating}/5)
          </span>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {hotel.description}
        </p>

        {/* Amenities */}
        {hotel.amenities && hotel.amenities.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {hotel.amenities.slice(0, 4).map((amenity, index) => (
                <div 
                  key={index}
                  className="flex items-center bg-gray-100 rounded-full px-3 py-1 text-xs text-gray-700"
                >
                  {getAmenityIcon(amenity)}
                  <span className="ml-1">{amenity}</span>
                </div>
              ))}
              {hotel.amenities.length > 4 && (
                <div className="flex items-center bg-gray-100 rounded-full px-3 py-1 text-xs text-gray-700">
                  +{hotel.amenities.length - 4} อื่นๆ
                </div>
              )}
            </div>
          </div>
        )}

        {/* Price & Action */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-primary-600">
              ฿{hotel.minPrice?.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">ต่อคืน</div>
            {hotel.maxPrice && hotel.maxPrice !== hotel.minPrice && (
              <div className="text-sm text-gray-500">
                ถึง ฿{hotel.maxPrice.toLocaleString()}
              </div>
            )}
          </div>
          
          <Link 
            href={`/hotels/${hotel.id}`}
            className="btn-primary"
          >
            ดูรายละเอียด
          </Link>
        </div>

        {/* Room Types Count */}
        {hotel.roomTypesCount && (
          <div className="mt-3 text-sm text-gray-500">
            {hotel.roomTypesCount} ประเภทห้องพัก
          </div>
        )}
      </div>
    </div>
  );
};

export default HotelCard;
