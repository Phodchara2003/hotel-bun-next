// ฟังก์ชันสำหรับจัดการรูปภาพห้องพัก
export const getRoomImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  
  // ถ้าเป็น URL เต็ม ใช้เลย
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }
  
  // ถ้าเป็น path ที่เริ่มด้วย / ใช้เลย (สำหรับ public folder)
  if (imageUrl.startsWith('/')) {
    return imageUrl;
  }
  
  // ถ้าไม่มี / นำหน้า ให้ใส่
  return `/${imageUrl}`;
};

export const getFallbackRoomImages = () => {
  return [
    '/images/rooms/single-room-main.jpg',
    '/images/rooms/double-room-main.jpg'
  ];
};

export const getPlaceholderImageUrl = () => {
  return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
};

// ฟังก์ชันสำหรับสร้าง placeholder รูปห้องพักตามประเภท (2 แบบเท่านั้น)
export const getRoomPlaceholder = (roomType) => {
  const placeholders = {
    'เตียงเดี่ยว': 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'เตียงคู่': 'https://images.unsplash.com/photo-1578774204375-2bcb25c8b83e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  };
  
  return placeholders[roomType] || getPlaceholderImageUrl();
};