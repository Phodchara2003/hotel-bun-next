// ข้อมูลประเภทห้องพัก - 2 ประเภทหลัก พร้อมห้องย่อยที่แอดมินจัดการ
export const roomsData = [
  {
    id: 1,
    name: "ห้องเตียงคู่ (Double Room)",
    description: "ห้องพักหรูหราพร้อมเตียงคู่ขนาดใหญ่ ตกแต่งด้วยโทนสีอบอุ่น มีผ้าปูที่นอนลายไทยแบบดั้งเดิม ห้องกว้างขวางพร้อมสิ่งอำนวยความสะดวกครบครัน",
    image_url: "/images/rooms/double-room-main.jpg",
    images: [
      "/images/rooms/double-room-main.jpg",
      "/images/rooms/double-room-swan.jpg", 
      "/images/rooms/double-room-golden.jpg",
      "/images/rooms/bathroom-modern.jpg"
    ],
    price_per_night: 1800,
    max_occupancy: 2,
    bed_type: "double",
    room_type: "double",
    category: "room-type", // ประเภทห้อง
    amenities: [
      "เครื่องปรับอากาศ",
      "ทีวีจอแบน",
      "Wi-Fi ฟรี",
      "โต๊ะทำงาน",
      "ตู้เซฟ",
      "มินิบาร์",
      "ห้องน้ำส่วนตัว",
      "เครื่องทำน้ำร้อน",
      "ผ้าปูที่นอนลายไทยพิเศษ",
      "ผ้าเช็ดตัวเรียงรูปหงส์"
    ],
    available: true,
    featured: true,
    // ห้องย่อยที่แอดมินจัดการ
    sub_rooms: [
      { id: 101, room_number: "201", available: true, has_booking: false },
      { id: 102, room_number: "202", available: true, has_booking: true },
      { id: 103, room_number: "203", available: false, has_booking: false },
      { id: 104, room_number: "204", available: true, has_booking: false },
      { id: 105, room_number: "205", available: true, has_booking: true }
    ]
  },
  {
    id: 2,
    name: "ห้องเตียงเดี่ยว (Single Room)",
    description: "ห้องพักสะดวกสบายสำหรับผู้เดินทางคนเดียว เตียงเดี่ยวขนาดมาตรฐาน ห้องสะอาดสมัยใหม่ พื้นที่เหมาะสมไม่คับแคบ",
    image_url: "/images/rooms/single-room-main.jpg",
    images: [
      "/images/rooms/single-room-main.jpg",
      "/images/rooms/single-room-modern.jpg",
      "/images/rooms/bathroom-modern.jpg"
    ],
    price_per_night: 1200,
    max_occupancy: 1,
    bed_type: "single",
    room_type: "single",
    category: "room-type", // ประเภทห้อง
    amenities: [
      "เครื่องปรับอากาศ",
      "ทีวีจอแบน",
      "Wi-Fi ฟรี",
      "โต๊ะทำงาน",
      "ตู้เซฟ",
      "มินิบาร์",
      "ห้องน้ำส่วนตัว",
      "เครื่องทำน้ำร้อน",
      "ตู้เสื้อผ้า",
      "ผ้าปูที่นอนคุณภาพดี"
    ],
    available: true,
    // ห้องย่อยที่แอดมินจัดการ
    sub_rooms: [
      { id: 201, room_number: "101", available: true, has_booking: false },
      { id: 202, room_number: "102", available: true, has_booking: false },
      { id: 203, room_number: "103", available: false, has_booking: false },
      { id: 204, room_number: "104", available: true, has_booking: true },
      { id: 205, room_number: "105", available: true, has_booking: false }
    ]
  }
];

// ฟังก์ชันสำหรับดึงข้อมูลห้องพักจาก API
export const getRoomsData = async () => {
  try {
    // ใช้ backend API สำหรับข้อมูลที่อัพเดตแล้วจากแอดมิน พร้อม cache busting
    const timestamp = new Date().getTime();
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${API_BASE_URL}/api/room-types-with-images?t=${timestamp}`, {
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    const result = await response.json();
    
    if (result.success && result.data) {
      // แปลงข้อมูลจาก backend format เป็น frontend format
      const convertedRooms = result.data.map(room => ({
        id: room.id,
        name: room.name,
        description: room.description || 'ห้องพักสะดวกสบาย',
        image_url: room.images && room.images.length > 0 ? `/images/rooms/${room.images[0]}` : '/images/rooms/room-placeholder.jpg',
        images: room.images && room.images.length > 0 
          ? room.images.map(img => `/images/rooms/${img}`) 
          : ['/images/rooms/room-placeholder.jpg'],
        price_per_night: parseFloat(room.price_per_night) || 1500,
        max_occupancy: room.max_guests || 2,
        bed_type: room.bed_type === 'single' ? 'เตียงเดี่ยว' : 'เตียงคู่',
        room_type: room.bed_type || 'single',
        category: 'room-type',
        amenities: Array.isArray(room.amenities) ? room.amenities : (typeof room.amenities === 'string' ? JSON.parse(room.amenities) : []),
        available: true,
        featured: true,
        floor: room.floor || '1',
        size_sqm: room.size_sqm,
        hotel_name: room.hotel_name,
        hotel_id: room.hotel_id || 2 // Add hotel_id from backend data
      }));
      
      console.log('✅ Loaded rooms from backend API:', convertedRooms.length);
      return convertedRooms;
    } else {
      console.error('Error fetching rooms from backend API:', result.message);
      return roomsData; // fallback to static data
    }
  } catch (error) {
    console.error('Error fetching rooms from backend API:', error);
    return roomsData; // fallback to static data
  }
};

// ฟังก์ชันสำหรับดึงข้อมูลห้องพักตาม ID (async version)
export const getRoomById = async (id) => {
  const rooms = await getRoomsData();
  return rooms.find(room => room.id === parseInt(id));
};

// ฟังก์ชันสำหรับดึงห้องพักที่แนะนำ (async version)
export const getFeaturedRooms = async () => {
  const rooms = await getRoomsData();
  return rooms.filter(room => room.featured || room.available);
};

// Synchronous versions for backward compatibility
export const getRoomsDataSync = () => {
  return roomsData;
};

export const getRoomByIdSync = (id) => {
  return roomsData.find(room => room.id === parseInt(id));
};

export const getFeaturedRoomsSync = () => {
  return roomsData.filter(room => room.featured || room.available);
};