// ทดสอบการดึงข้อมูลห้องพักจาก API สำหรับแสดงในหน้าโฮมเพจ
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001';

async function testRoomTypesWithImages() {
  try {
    console.log('🏠 Testing room types API for homepage...');
    
    const response = await axios.get(`${API_BASE_URL}/api/room-types-with-images`);
    
    console.log('✅ API Response:', response.data.success);
    console.log('📊 Total rooms:', response.data.count);
    
    if (response.data.data && response.data.data.length > 0) {
      console.log('\n🏨 Room Details:');
      response.data.data.forEach((room, index) => {
        console.log(`\n--- Room ${index + 1} ---`);
        console.log('ID:', room.id);
        console.log('Name:', room.name);
        console.log('Bed Type:', room.bed_type);
        console.log('Floor:', room.floor);
        console.log('Price:', room.price_per_night);
        console.log('Max Guests:', room.max_guests);
        console.log('Images:', room.images ? room.images.length : 0, 'files');
        if (room.images && room.images.length > 0) {
          console.log('Image Files:', room.images);
        }
        console.log('Amenities:', Array.isArray(room.amenities) ? room.amenities.length : 'string/json');
      });
      
      // Test converted format
      console.log('\n🔄 Testing frontend format conversion...');
      const convertedRooms = response.data.data.map(room => ({
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
        amenities: Array.isArray(room.amenities) ? room.amenities : (typeof room.amenities === 'string' ? JSON.parse(room.amenities) : []),
        featured: true,
        floor: room.floor || '1'
      }));
      
      console.log('\n✅ Converted format for homepage:');
      convertedRooms.forEach((room, index) => {
        console.log(`\n--- Converted Room ${index + 1} ---`);
        console.log('Name:', room.name);
        console.log('Image URL:', room.image_url);
        console.log('Images Count:', room.images.length);
        console.log('Price:', room.price_per_night);
        console.log('Bed Type:', room.bed_type);
        console.log('Floor:', room.floor);
        console.log('Amenities:', room.amenities.length, 'items');
      });
      
    } else {
      console.log('❌ No room data found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testRoomTypesWithImages();