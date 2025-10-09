// ทดสอบ API call ไปยัง /bookings เพื่อดู validation error

const testBookingData = {
  user_id: 25,
  hotel_id: 2,
  roomTypeId: 10,
  check_in_date: '2025-10-09',
  check_out_date: '2025-10-10',
  guests: 1,
  total_price: 600,
  guest_name: 'Test User',
  guest_phone: '0610931494',
  guest_email: 'test@test.com',
  guest_national_id: '1312312321312',
  special_requests: '',
  guest_address: ''
};

console.log('🧪 Testing booking API call...');
console.log('📤 Sending data:', testBookingData);

try {
  const response = await fetch('http://localhost:3001/api/bookings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token'
    },
    body: JSON.stringify(testBookingData)
  });

  const responseText = await response.text();
  console.log('📥 Response status:', response.status);
  console.log('📥 Response text:', responseText);

  if (response.ok) {
    const data = JSON.parse(responseText);
    console.log('✅ Success:', data);
  } else {
    console.log('❌ Error response:', responseText);
    
    // ถ้าเป็น error เกี่ยวกับ bed_type ให้แสดงคำแนะนำ
    if (responseText.includes('bed_type')) {
      console.log('\n💡 ปัญหา: Backend ต้องการ field "bed_type"');
      console.log('📋 วิธีแก้:');
      console.log('1. เพิ่ม bed_type ใน bookingData ที่ส่งจาก frontend');
      console.log('2. หรือแก้ไข backend ให้ใช้ roomTypeId แทน bed_type');
    }
  }
} catch (error) {
  console.error('❌ Request failed:', error);
}