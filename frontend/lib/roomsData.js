// ข้อมูลประเภทห้องพัก - 2 ประเภทหลัก พร้อมห้องย่อยที่แอดมินจัดการ
export const roomsData = [
  {
    id: 8, // Single Room - matches database room_type_id
    name: "ห้องเตียงเดี่ยว (Single Room)",
    description: "ห้องพักสะดวกสบายสำหรับผู้เดินทางคนเดียว เตียงเดี่ยวขนาดมาตรฐาน ห้องสะอาดสมัยใหม่ พื้นที่เหมาะสมไม่คับแคบ",
    image_url: "/images/rooms/single-room-main.jpg",
    images: [
      "/images/rooms/single-room-main.jpg",
      "/images/rooms/single-room-modern.jpg",
      "/images/rooms/bathroom-modern.jpg"
    ],
    price_per_night: 600, // Updated to match database price
    max_occupancy: 2, // Updated to match database max_guests
    bed_type: "single",
    room_type: "single",
    category: "room-type", // ประเภทห้อง
    amenities: [
      "WiFi ฟรี",
      "ตู้เย็น",
      "ระเบียง",
      "เครื่องปรับอากาศ",
      "โทรทัศน์",
      "เครื่องทำน้ำอุ่น"
    ],
    available: true,
    // ห้องย่อยที่แอดมินจัดการ - Single bed rooms
    sub_rooms: [
      { id: 101, room_number: "501", available: true, has_booking: false },
      { id: 102, room_number: "502", available: true, has_booking: false },
      { id: 103, room_number: "503", available: true, has_booking: false },
      { id: 104, room_number: "504", available: true, has_booking: false },
      { id: 105, room_number: "505", available: true, has_booking: false },
      { id: 106, room_number: "506", available: true, has_booking: false },
      { id: 113, room_number: "513", available: true, has_booking: false },
      { id: 114, room_number: "514", available: true, has_booking: false },
      { id: 115, room_number: "515", available: true, has_booking: false },
      { id: 116, room_number: "516", available: true, has_booking: false },
      { id: 117, room_number: "517", available: true, has_booking: false },
      { id: 601, room_number: "601", available: true, has_booking: false },
      { id: 602, room_number: "602", available: true, has_booking: false },
      { id: 603, room_number: "603", available: true, has_booking: false }
    ]
  },
  {
    id: 10, // Double Room - matches database room_type_id
    name: "ห้องเตียงคู่ (Double Room)",
    description: "ห้องพักหรูหราพร้อมเตียงคู่ขนาดใหญ่ ตกแต่งด้วยโทนสีอบอุ่น มีผ้าปูที่นอนลายไทยแบบดั้งเดิม ห้องกว้างขวางพร้อมสิ่งอำนวยความสะดวกครบครัน",
    image_url: "/images/rooms/double-room-main.jpg",
    images: [
      "/images/rooms/double-room-main.jpg",
      "/images/rooms/double-room-swan.jpg", 
      "/images/rooms/double-room-golden.jpg",
      "/images/rooms/bathroom-modern.jpg"
    ],
    price_per_night: 600, // Updated to match database price
    max_occupancy: 2, // Updated to match database max_guests
    bed_type: "double",
    room_type: "double",
    category: "room-type", // ประเภทห้อง
    amenities: [
      "WiFi ฟรี",
      "ตู้เย็น",
      "เครื่องปรับอากาศ",
      "โทรทัศน์",
      "เครื่องทำน้ำอุ่น",
      "ระเบียง"
    ],
    available: true,
    featured: true,
    // ห้องย่อยที่แอดมินจัดการ - Double bed rooms
    sub_rooms: [
      { id: 107, room_number: "507", available: true, has_booking: false },
      { id: 108, room_number: "508", available: true, has_booking: false },
      { id: 109, room_number: "509", available: true, has_booking: false },
      { id: 110, room_number: "510", available: true, has_booking: false },
      { id: 111, room_number: "511", available: true, has_booking: false },
      { id: 112, room_number: "512", available: true, has_booking: false },
      { id: 604, room_number: "604", available: true, has_booking: false },
      { id: 605, room_number: "605", available: true, has_booking: false },
      { id: 606, room_number: "606", available: true, has_booking: false },
      { id: 607, room_number: "607", available: true, has_booking: false },
      { id: 608, room_number: "608", available: true, has_booking: false },
      { id: 609, room_number: "609", available: true, has_booking: false },
      { id: 610, room_number: "610", available: true, has_booking: false },
      { id: 611, room_number: "611", available: true, has_booking: false },
      { id: 612, room_number: "612", available: true, has_booking: false },
      { id: 613, room_number: "613", available: true, has_booking: false },
      { id: 614, room_number: "614", available: true, has_booking: false },
      { id: 615, room_number: "615", available: true, has_booking: false },
      { id: 616, room_number: "616", available: true, has_booking: false },
      { id: 617, room_number: "617", available: true, has_booking: false }
    ]
  }
];

// ฟังก์ชันสำหรับดึงข้อมูลห้องพักจาก API
export const getRoomsData = async (forceRefresh = false) => {
  try {
    // Cache busting แรงสุด - บังคับให้ดึงข้อมูลใหม่ทุกครั้ง
    const timestamp = Date.now();
    const randomId = Math.floor(Math.random() * 1000000);
    const sessionId = Math.random().toString(36).substring(7);
    const refreshParam = forceRefresh ? '&force=1' : '';
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5680';
    
    console.log('🔄 Force fetching fresh data from API...', forceRefresh ? '(FORCE REFRESH)' : '');
    
    const response = await fetch(`${API_BASE_URL}/api/room-types-with-images?bust=${timestamp}&r=${randomId}&s=${sessionId}${refreshParam}`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    const result = await response.json();
    
    if (result.success && result.data) {
      console.log('🔄 Raw API data:', result.data);
      
      // แปลงข้อมูลจาก backend format เป็น frontend format
      const convertedRooms = result.data.map(room => {
        console.log(`🏨 Converting room ID ${room.id}: ${room.name} - bed_type: ${room.bed_type}`);
        return {
          id: room.id,
          name: room.name,
          description: room.description || 'ห้องพักสะดวกสบาย',
          image_url: room.images && room.images.length > 0 ? `/images/rooms/${room.images[0]}` : '/images/rooms/room-placeholder.jpg',
          images: room.images && room.images.length > 0 
            ? room.images.map(img => `/images/rooms/${img}`) 
            : ['/images/rooms/room-placeholder.jpg'],
          price_per_night: parseFloat(room.price_per_night) || 1500,
          max_occupancy: room.max_guests || 2,
          bed_type: room.bed_type, // ใช้ bed_type ต้นฉบับจาก backend (single/double)
          room_type: room.bed_type || 'single',
          category: 'room-type',
          amenities: Array.isArray(room.amenities) ? room.amenities : (typeof room.amenities === 'string' ? JSON.parse(room.amenities) : []),
          available: true,
          featured: true,
          floor: room.floor || '1',
          size_sqm: room.size_sqm,
          hotel_name: room.hotel_name,
          hotel_id: room.hotel_id || 2 // Add hotel_id from backend data
        };
      });
      
      console.log('✅ Converted rooms data:', convertedRooms.map(r => ({ id: r.id, name: r.name, bed_type: r.bed_type })));
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
export const getRoomById = async (id, forceRefresh = false) => {
  const rooms = await getRoomsData(forceRefresh);
  return rooms.find(room => room.id === parseInt(id));
};

// ฟังก์ชันสำหรับดึงห้องพักที่แนะนำ (async version)
export const getFeaturedRooms = async (forceRefresh = false) => {
  const rooms = await getRoomsData(forceRefresh);
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