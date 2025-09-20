'use client';

import { useState, useEffect } from 'react';

export default function TestImagesPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        console.log('🔍 Fetching room types with images...');
        const response = await fetch('http://localhost:3001/api/room-types-with-images');
        const data = await response.json();
        console.log('📸 Room data received:', data);
        setRooms(data.data || []);
      } catch (error) {
        console.error('❌ Failed to fetch rooms:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Room Images Test</h1>
      
      {rooms.map((room) => (
        <div key={room.id} className="mb-8 p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">{room.name}</h2>
          <p className="text-gray-600 mb-4">Room ID: {room.id}</p>
          
          <div className="mb-4">
            <strong>Raw Images Data:</strong>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
              {JSON.stringify(room.images, null, 2)}
            </pre>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.isArray(room.images) && room.images.map((imageName, index) => {
              const imageSrc = `/images/rooms/${imageName}`;
              return (
                <div key={index} className="border rounded-lg overflow-hidden">
                  <div className="h-48 bg-gray-100 relative">
                    <img
                      src={imageSrc}
                      alt={`${room.name} - Image ${index + 1}`}
                      className="w-full h-full object-cover"
                      onLoad={() => {
                        console.log('✅ Image loaded:', imageSrc);
                      }}
                      onError={(e) => {
                        console.log('❌ Image failed:', imageSrc);
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="absolute inset-0 hidden items-center justify-center bg-red-100 text-red-600">
                      <div className="text-center">
                        <div className="font-semibold">Image Failed</div>
                        <div className="text-sm">{imageName}</div>
                      </div>
                    </div>
                  </div>
                  <div className="p-2 text-sm text-gray-600">
                    {imageName}
                  </div>
                </div>
              );
            })}
          </div>

          {(!room.images || room.images.length === 0) && (
            <div className="text-gray-500 italic">No images available for this room</div>
          )}
        </div>
      ))}
    </div>
  );
}