'use client';

import { useState, useEffect } from 'react';
import { Upload, X, Eye, Save, RotateCcw, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { getRoomsData, getRoomById } from '../../../lib/roomsData';
import { toast } from 'react-hot-toast';

export default function RoomImageManagement() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // โหลดข้อมูลห้องพัก
    const loadRooms = async () => {
      const roomsData = await getRoomsData();
      setRooms(roomsData);
      if (roomsData.length > 0) {
        setSelectedRoom(roomsData[0]);
        setSelectedImages(roomsData[0].images || []);
      }
    };
    
    loadRooms();
  }, []);

  // ตรวจสอบสิทธิ์แอดมิน
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">ไม่มีสิทธิ์เข้าถึง</h1>
          <p className="text-gray-600">เฉพาะแอดมินเท่านั้นที่สามารถจัดการรูปภาพห้องพักได้</p>
        </div>
      </div>
    );
  }

  const handleRoomSelect = (room) => {
    if (hasChanges) {
      if (!confirm('คุณมีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก ต้องการเปลี่ยนห้องโดยไม่บันทึกหรือไม่?')) {
        return;
      }
    }
    setSelectedRoom(room);
    setSelectedImages(room.images || []);
    setPreviewImages([]);
    setHasChanges(false);
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    
    // ตรวจสอบประเภทไฟล์
    const validFiles = files.filter(file => {
      const isValid = file.type.startsWith('image/');
      if (!isValid) {
        toast.error(`ไฟล์ ${file.name} ไม่ใช่รูปภาพ`);
      }
      return isValid;
    });

    // สร้าง preview
    const newPreviews = [];
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push({
          file,
          preview: e.target.result,
          name: file.name
        });
        
        if (newPreviews.length === validFiles.length) {
          setPreviewImages(prev => [...prev, ...newPreviews]);
          setHasChanges(true);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePreviewImage = (index) => {
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const removeExistingImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!selectedRoom) return;

    setIsUploading(true);
    
    try {
      let newImagePaths = [];

      // อัปโหลดรูปใหม่ถ้ามี
      if (previewImages.length > 0) {
        const formData = new FormData();
        
        previewImages.forEach((imageData) => {
          formData.append('images', imageData.file);
        });
        
        formData.append('roomId', selectedRoom.id.toString());
        formData.append('roomType', selectedRoom.bed_type);

        const uploadResponse = await fetch('/api/admin/room-images', {
          method: 'POST',
          body: formData
        });

        const uploadResult = await uploadResponse.json();
        
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'เกิดข้อผิดพลาดในการอัปโหลด');
        }

        newImagePaths = uploadResult.files;
      }

      // รวมรูปเก่าและรูปใหม่
      const updatedImages = [...selectedImages, ...newImagePaths];
      
      // อัปเดตข้อมูลห้องใน database
      const updateResponse = await fetch('/api/admin/rooms', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: selectedRoom.id,
          images: updatedImages,
          image_url: updatedImages[0] || selectedRoom.image_url
        })
      });

      const updateResult = await updateResponse.json();
      
      if (!updateResult.success) {
        throw new Error(updateResult.error || 'เกิดข้อผิดพลาดในการอัปเดต');
      }

      const updatedRoom = updateResult.data;

      // อัปเดต state
      setRooms(prev => prev.map(room => 
        room.id === selectedRoom.id ? updatedRoom : room
      ));
      setSelectedRoom(updatedRoom);
      setSelectedImages(updatedRoom.images);
      setPreviewImages([]);
      setHasChanges(false);

      // รีเฟรชข้อมูลใหม่เพื่อให้แน่ใจว่าซิงค์แล้ว
      setTimeout(async () => {
        try {
          const refreshedRooms = await getRoomsData();
          setRooms(refreshedRooms);
          const refreshedRoom = refreshedRooms.find(r => r.id === selectedRoom.id);
          if (refreshedRoom) {
            setSelectedRoom(refreshedRoom);
            setSelectedImages(refreshedRoom.images);
          }
        } catch (error) {
          console.error('Error refreshing rooms data:', error);
        }
      }, 1000);

      toast.success(`อัปเดตรูปภาพห้อง ${selectedRoom.name} เรียบร้อยแล้ว! ข้อมูลจะซิงค์ไปยังหน้าลูกค้าอัตโนมัติ`);

    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error(error.message || 'เกิดข้อผิดพลาดในการอัปโหลดรูป');
    } finally {
      setIsUploading(false);
    }
  };

  const resetChanges = () => {
    if (selectedRoom) {
      setSelectedImages(selectedRoom.images || []);
      setPreviewImages([]);
      setHasChanges(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            📷 จัดการรูปภาพห้องพัก
          </h1>
          <p className="text-gray-600">
            อัปโหลดและจัดการรูปภาพสำหรับห้องพักต่างๆ
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Room Selection */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">เลือกห้องพัก</h2>
            <div className="space-y-3">
              {rooms.map(room => (
                <button
                  key={room.id}
                  onClick={() => handleRoomSelect(room)}
                  className={`w-full p-4 rounded-lg text-left transition-colors ${
                    selectedRoom?.id === room.id
                      ? 'bg-blue-100 border-2 border-blue-500 text-blue-800'
                      : 'bg-white border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{room.name}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {room.images?.length || 0} รูป
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Image Management */}
          <div className="lg:col-span-3">
            {selectedRoom && (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">
                    จัดการรูปภาพ: {selectedRoom.name}
                  </h2>
                  <div className="flex gap-3">
                    {hasChanges && (
                      <button
                        onClick={resetChanges}
                        className="flex items-center px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        ยกเลิก
                      </button>
                    )}
                    <button
                      onClick={handleSave}
                      disabled={!hasChanges || isUploading}
                      className={`flex items-center px-6 py-2 rounded-lg font-medium ${
                        hasChanges && !isUploading
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isUploading ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                    </button>
                  </div>
                </div>

                {/* File Upload */}
                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    เพิ่มรูปภาพใหม่
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="imageUpload"
                    />
                    <label htmlFor="imageUpload" className="cursor-pointer">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">คลิกเพื่อเลือกรูปภาพ</p>
                      <p className="text-sm text-gray-500">
                        รองรับ JPG, PNG, GIF (สามารถเลือกหลายไฟล์)
                      </p>
                    </label>
                  </div>
                </div>

                {/* Current Images */}
                {selectedImages.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">
                      รูปภาพปัจจุบัน ({selectedImages.length})
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedImages.map((imagePath, index) => (
                        <div key={index} className="relative group">
                          <div className="relative aspect-square bg-gray-200 rounded-lg overflow-hidden">
                            <img
                              src={imagePath}
                              alt={`${selectedRoom.name} รูปที่ ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgMTAwTDEzMCA3MEwxNzAgMTEwTDE3MCA4MEwyMDAgODBWMTQwSDBWODBMMzAgODBMNzAgMTEwTDEwMCAxMDBaIiBmaWxsPSIjOUI5QjlCIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTIwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNkI3MjgwIiBmb250LXNpemU9IjE0Ij7guYTguKHguYjguKHguLXguJnguYzguJTguYDguKrguKHguLnguJnguKPguLnguJc8L3RleHQ+Cjwvc3ZnPgo=';
                              }}
                            />
                            {index === 0 && (
                              <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                                รูปหลัก
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => removeExistingImage(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4 mx-auto" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preview New Images */}
                {previewImages.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-4">
                      รูปภาพใหม่ที่จะเพิ่ม ({previewImages.length})
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {previewImages.map((imageData, index) => (
                        <div key={index} className="relative group">
                          <div className="relative aspect-square bg-gray-200 rounded-lg overflow-hidden">
                            <img
                              src={imageData.preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                              ใหม่
                            </div>
                          </div>
                          <button
                            onClick={() => removePreviewImage(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4 mx-auto" />
                          </button>
                          <div className="mt-2 text-xs text-gray-500 truncate">
                            {imageData.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Images Message */}
                {selectedImages.length === 0 && previewImages.length === 0 && (
                  <div className="text-center py-12">
                    <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">ยังไม่มีรูปภาพสำหรับห้องนี้</p>
                    <p className="text-gray-400">เพิ่มรูปภาพเพื่อแสดงให้ลูกค้าดู</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}