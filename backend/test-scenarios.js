// ทดสอบสถานการณ์ต่างๆ ที่อาจทำให้ไม่มีห้องว่าง
async function testDifferentScenarios() {
  const baseUrl = 'http://localhost:3001/api/rooms/search';
  
  const scenarios = [
    {
      name: 'ทดสอบปกติ (2 คน, วันที่อนาคต)',
      params: 'checkin=2025-10-05&checkout=2025-10-07&guests=2'
    },
    {
      name: 'ทดสอบ 1 คน',
      params: 'checkin=2025-10-05&checkout=2025-10-07&guests=1'
    },
    {
      name: 'ทดสอบ 3 คน (เกินความจุ)',
      params: 'checkin=2025-10-05&checkout=2025-10-07&guests=3'
    },
    {
      name: 'ทดสอบวันที่ในอดีต',
      params: 'checkin=2025-10-01&checkout=2025-10-03&guests=2'
    },
    {
      name: 'ทดสอบวันเดียวกัน (same day)',
      params: 'checkin=2025-10-05&checkout=2025-10-05&guests=2'
    },
    {
      name: 'ทดสอบวันที่ผิดลำดับ',
      params: 'checkin=2025-10-07&checkout=2025-10-05&guests=2'
    }
  ];
  
  for (const scenario of scenarios) {
    try {
      console.log(`\n🧪 ${scenario.name}`);
      console.log(`   URL: ${baseUrl}?${scenario.params}`);
      
      const response = await fetch(`${baseUrl}?${scenario.params}`);
      const data = await response.json();
      
      if (data.success) {
        console.log(`   ✅ Success: ${data.count} room types found`);
        if (data.data && data.data.length > 0) {
          const totalRooms = data.data.reduce((sum, room) => sum + (room.available_rooms || 0), 0);
          console.log(`   📊 Total available rooms: ${totalRooms}`);
        }
      } else {
        console.log(`   ❌ Failed: ${data.message || 'Unknown error'}`);
      }
      
    } catch (error) {
      console.log(`   💥 Error: ${error.message}`);
    }
  }
}

testDifferentScenarios();