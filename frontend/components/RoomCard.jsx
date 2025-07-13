'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Users, Maximize, Bed, Wifi, Car, Coffee, Bath } from 'lucide-react';

const RoomCard = ({ roomType, hotelId }) => {
  const getAmenityIcon = (amenity) => {
    const amenityLower = amenity.toLowerCase();
    if (amenityLower.includes('wifi')) return <Wifi className="h-4 w-4" />;
    if (amenityLower.includes('ที่จอดรถ') || amenityLower.includes('car')) return <Car className="h-4 w-4" />;
    if (amenityLower.includes('กาแฟ') || amenityLower.includes('coffee')) return <Coffee className="h-4 w-4" />;
    if (amenityLower.includes('อ่างอาบน้ำ') || amenityLower.includes('bath')) return <Bath className="h-4 w-4" />;
    return <Bed className="h-4 w-4" />;
  };

  // ใช้รูปภาพที่แอดมินอัปโหลด (field image) เป็นอันดับแรก หากไม่มีจึงใช้ images[0]
  const roomImage = roomType.image || roomType.images?.[0] || '/api/placeholder/400/300';

  return (
    <div className="card hover:shadow-xl transition-shadow duration-300">
      {/* Room Image */}
      <div className="relative h-48 sm:h-56">
        <Image
          src={roomImage}
          alt={roomType.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        
        {/* Price Badge */}
        <div className="absolute top-4 right-4 bg-white rounded-lg px-3 py-2 shadow-md">
          <div className="text-lg font-bold text-primary-600">
            ฿{roomType.pricePerNight?.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">ต่อคืน</div>
        </div>
      </div>

      {/* Room Info */}
      <div className="p-6">
        {/* Room Name & Details */}
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {roomType.name}
          </h3>
          
          {/* Room Specs */}
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              <span>{roomType.maxGuests} ผู้เข้าพัก</span>
            </div>
            {roomType.sizeSqm && (
              <div className="flex items-center">
                <Maximize className="h-4 w-4 mr-1" />
                <span>{roomType.sizeSqm} ตรม.</span>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {roomType.description}
        </p>

        {/* Amenities */}
        {roomType.amenities && roomType.amenities.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-2">สิ่งอำนวยความสะดวก</h4>
            <div className="flex flex-wrap gap-2">
              {roomType.amenities.slice(0, 4).map((amenity, index) => (
                <div 
                  key={index}
                  className="flex items-center bg-gray-100 rounded-full px-2 py-1 text-xs text-gray-700"
                >
                  {getAmenityIcon(amenity)}
                  <span className="ml-1">{amenity}</span>
                </div>
              ))}
              {roomType.amenities.length > 4 && (
                <div className="flex items-center bg-gray-100 rounded-full px-2 py-1 text-xs text-gray-700">
                  +{roomType.amenities.length - 4} อื่นๆ
                </div>
              )}
            </div>
          </div>
        )}

        {/* Price & Action */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div>
            <div className="text-2xl font-bold text-primary-600">
              ฿{roomType.pricePerNight?.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">ต่อคืน (รวมภาษี)</div>
          </div>
          
          <Link 
            href={`/rooms/${roomType.id}/book?hotelId=${hotelId}`}
            className="btn-primary"
          >
            จองเลย
          </Link>
        </div>

        {/* Room Gallery Link */}
        {roomType.images && roomType.images.length > 1 && (
          <div className="mt-3 text-center">
            <button className="text-sm text-primary-600 hover:text-primary-700">
              ดูรูปภาพเพิ่มเติม ({roomType.images.length} รูป)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomCard;
