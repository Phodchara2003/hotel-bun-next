// ทดสอบการแก้ไขฟังก์ชันค้นหาห้องพัก
console.log('🧪 Testing Room Search Fix...');

// จำลอง response จาก API
const mockApiResponse = {
  success: true,
  data: {
    success: true,
    count: 2,
    data: [
      {
        room_type_id: 8,
        room_type_name: "ห้องเตียงเดี่ยว (Single Room)",
        available_count: 6,
        room_numbers: ["507", "508", "509", "510", "511", "512"]
      },
      {
        room_type_id: 10,
        room_type_name: "ห้องเตียงคู่ (Double Room)",
        available_count: 28,
        room_numbers: ["501", "502", "503", "504", "505", "506"]
      }
    ]
  }
};

// จำลอง updatedRooms จากหน้า rooms page
const mockUpdatedRooms = [
  { id: 8, name: "ห้องเตียงเดี่ยว (Single Room)", price: 600 },
  { id: 10, name: "ห้องเตียงคู่ (Double Room)", price: 600 },
  { id: 12, name: "ห้องสวีท (Suite Room)", price: 1200 }
];

console.log('\n📋 Testing room mapping logic...');

// ทดสอบ logic ที่แก้ไขแล้ว
if (mockApiResponse.success && mockApiResponse.data && mockApiResponse.data.data) {
  const roomsWithAvailability = mockUpdatedRooms.map(room => {
    const availableRoom = mockApiResponse.data.data.find(ar => ar.room_type_id === room.id || ar.id === room.id);
    return {
      ...room,
      available: availableRoom ? true : false,
      available_count: availableRoom ? availableRoom.available_count : 0,
      room_numbers: availableRoom ? availableRoom.room_numbers : []
    };
  });

  console.log('\n✅ Room search mapping results:');
  roomsWithAvailability.forEach((room, index) => {
    console.log(`\n--- Room ${index + 1} ---`);
    console.log('ID:', room.id);
    console.log('Name:', room.name);
    console.log('Available:', room.available ? '✅ ว่าง' : '❌ ไม่ว่าง');
    console.log('Available Count:', room.available_count);
    console.log('Room Numbers:', room.room_numbers.join(', ') || 'ไม่มี');
  });

  const availableRooms = roomsWithAvailability.filter(room => room.available);
  console.log(`\n🎯 Summary: ${availableRooms.length}/${roomsWithAvailability.length} rooms available`);
  
  if (availableRooms.length > 0) {
    console.log('✅ Room search functionality should work now!');
  } else {
    console.log('❌ No rooms found available');
  }
} else {
  console.log('❌ Invalid response structure');
}