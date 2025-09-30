'use client';

import { useState } from 'react';
import { roomsData } from '@/lib/roomsData';

export default function TestImagesPage() {
  const [imageErrors, setImageErrors] = useState({});

  const handleImageError = (imageUrl) => {
    setImageErrors(prev => ({
      ...prev,
      [imageUrl]: true
    }));
  };

  const handleImageLoad = (imageUrl) => {
    setImageErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[imageUrl];
      return newErrors;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-[#082220]">
          ทดสอบรูปภาพห้องพัก - 2 แบบเท่านั้น
        </h1>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
          <h2 className="font-semibold text-yellow-800 mb-2">คำแนะนำ:</h2>
          <p className="text-yellow-700 text-sm">
            ตอนนี้เรามีห้องพัก 2 แบบเท่านั้น: <strong>เตียงคู่</strong> และ <strong>เตียงแฝด</strong> 
            กรุณาคัดลอกรูปภาพที่แนบมาไปยัง <code className="bg-yellow-100 px-1">frontend/public/images/rooms/</code> 
            และตั้งชื่อไฟล์ตามที่ระบุด้านล่าง
          </p>
        </div>

        {roomsData.map((room) => (
          <div key={room.id} className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-[#082220]">
              {room.name}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {room.images.map((imageUrl, index) => (
                <div key={index} className="relative">
                  <div className="bg-gray-100 rounded-lg overflow-hidden h-48">
                    <img
                      src={imageUrl}
                      alt={`${room.name} - รูปที่ ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(imageUrl)}
                      onLoad={() => handleImageLoad(imageUrl)}
                    />
                    {imageErrors[imageUrl] && (
                      <div className="absolute inset-0 bg-red-100 flex items-center justify-center">
                        <div className="text-center p-4">
                          <div className="text-red-600 font-semibold mb-2">
                            ไม่พบรูปภาพ
                          </div>
                          <div className="text-xs text-red-500 break-all">
                            {imageUrl}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-2 text-sm">
                    <div className="font-medium text-gray-700">
                      ชื่อไฟล์ที่ต้องการ:
                    </div>
                    <code className="text-xs bg-gray-100 p-1 rounded break-all">
                      {imageUrl}
                    </code>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2">ข้อมูลห้อง:</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">ประเภท:</span> {room.bed_type}
                </div>
                <div>
                  <span className="font-medium">ราคา:</span> ฿{room.price_per_night}/คืน
                </div>
                <div>
                  <span className="font-medium">ผู้เข้าพัก:</span> {room.max_occupancy} คน
                </div>
                <div>
                  <span className="font-medium">ขนาด:</span> {room.room_size} ตร.ม.
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h2 className="text-xl font-bold text-blue-800 mb-4">
            คำแนะนำการจับคู่รูปภาพ:
          </h2>
          
          <div className="space-y-4">
            <div className="bg-white p-4 rounded border">
              <h3 className="font-semibold text-blue-800 mb-2">🛏️ ห้องเตียงคู่ (Double Room):</h3>
              <p className="text-sm text-gray-600 mb-2">ใช้รูปที่มีเตียงใหญ่ 1 เตียง พร้อมผ้าปูลายไทย</p>
              <div className="grid grid-cols-1 gap-1 text-xs font-mono bg-gray-50 p-2 rounded">
                <div>/images/rooms/double-room-main.jpg (รูปเตียงคู่หลัก)</div>
                <div>/images/rooms/double-room-swan.jpg (รูปผ้าเช็ดตัวรูปหงส์)</div>
                <div>/images/rooms/double-room-golden.jpg (รูปห้องโทนทอง)</div>
                <div>/images/rooms/bathroom-modern.jpg (รูปห้องน้ำ)</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded border">
              <h3 className="font-semibold text-blue-800 mb-2">🛏️🛏️ ห้องเตียงแฝด (Twin Room):</h3>
              <p className="text-sm text-gray-600 mb-2">ใช้รูปที่มีเตียงเดี่ยว 2 เตียง</p>
              <div className="grid grid-cols-1 gap-1 text-xs font-mono bg-gray-50 p-2 rounded">
                <div>/images/rooms/twin-room-main.jpg (รูปเตียงแฝดหลัก)</div>
                <div>/images/rooms/twin-room-traditional.jpg (รูปเตียงแฝดโทนดั้งเดิม)</div>
                <div>/images/rooms/twin-room-modern.jpg (รูปเตียงแฝดสมัยใหม่)</div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold text-blue-800 mb-2">วิธีการเพิ่มรูปภาพ:</h3>
            <ol className="list-decimal list-inside space-y-2 text-blue-700 text-sm">
              <li>เปิด folder <code className="bg-blue-100 px-1">frontend/public/images/</code></li>
              <li>สร้าง folder ใหม่ชื่อ <code className="bg-blue-100 px-1">rooms</code> (ถ้ายังไม่มี)</li>
              <li>คัดลอกรูปภาพที่แนบมาไปไว้ใน folder rooms</li>
              <li>เปลี่ยนชื่อไฟล์ให้ตรงกับรายการด้านบน</li>
              <li>รีเฟรชหน้านี้เพื่อตรวจสอบ</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}