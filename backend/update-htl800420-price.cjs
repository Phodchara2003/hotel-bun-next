const { Client } = require('pg');

async function updateHTL800420Price() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://hotel_bun_next_owner:P5CJp1Rg4hyz@ep-hidden-dawn-a5z7j5s9.us-east-2.aws.neon.tech/hotel_bun_next?sslmode=require'
  });

  try {
    await client.connect();
    console.log('🔗 เชื่อมต่อฐานข้อมูลสำเร็จ');

    // ตรวจสอบข้อมูลการจองปัจจุบัน
    console.log('📊 ตรวจสอบการจอง HTL800420...');
    const checkQuery = `
      SELECT id, booking_reference, check_in_date, check_out_date, 
             nights, room_price, total_price, status
      FROM bookings 
      WHERE booking_reference = 'HTL800420'
    `;
    const currentData = await client.query(checkQuery);
    
    if (currentData.rows.length === 0) {
      console.log('❌ ไม่พบการจอง HTL800420');
      return;
    }

    const booking = currentData.rows[0];
    console.log('📋 ข้อมูลปัจจุบัน:', {
      id: booking.id,
      booking_reference: booking.booking_reference,
      check_in_date: booking.check_in_date?.toISOString?.() || booking.check_in_date,
      check_out_date: booking.check_out_date?.toISOString?.() || booking.check_out_date,
      nights: booking.nights,
      room_price: booking.room_price,
      total_price: booking.total_price,
      status: booking.status
    });

    // คำนวนราคาที่ถูกต้องจากวันที่
    const checkInDate = new Date(booking.check_in_date);
    const checkOutDate = new Date(booking.check_out_date);
    const correctNights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const roomPricePerNight = 600; // ราคาต่อคืน
    const correctTotalPrice = correctNights * roomPricePerNight;

    console.log('💰 การคำนวนที่ถูกต้อง:');
    console.log(`- วันเข้าพัก: ${checkInDate.toISOString().split('T')[0]}`);
    console.log(`- วันออก: ${checkOutDate.toISOString().split('T')[0]}`);
    console.log(`- จำนวนคืนที่ถูกต้อง: ${correctNights} คืน`);
    console.log(`- ราคาต่อคืน: ฿${roomPricePerNight}`);
    console.log(`- ราคารวมที่ถูกต้อง: ฿${correctTotalPrice}`);

    // อัพเดทข้อมูลถึงมีการเปลี่ยนแปลง
    if (booking.total_price !== correctTotalPrice || booking.nights !== correctNights || booking.room_price !== roomPricePerNight) {
      console.log('🔄 กำลังอัพเดทข้อมูล...');
      
      const updateQuery = `
        UPDATE bookings 
        SET nights = $1, 
            total_price = $2,
            room_price = $3,
            updated_at = NOW()
        WHERE booking_reference = 'HTL800420'
        RETURNING *
      `;
      
      const updateResult = await client.query(updateQuery, [correctNights, correctTotalPrice, roomPricePerNight]);
      
      console.log('✅ อัพเดทข้อมูลสำเร็จ:');
      console.log('📊 ข้อมูลใหม่:', {
        id: updateResult.rows[0].id,
        booking_reference: updateResult.rows[0].booking_reference,
        check_in_date: updateResult.rows[0].check_in_date?.toISOString?.()?.split('T')[0] || updateResult.rows[0].check_in_date,
        check_out_date: updateResult.rows[0].check_out_date?.toISOString?.()?.split('T')[0] || updateResult.rows[0].check_out_date,
        nights: updateResult.rows[0].nights,
        room_price: updateResult.rows[0].room_price,
        total_price: updateResult.rows[0].total_price,
        updated_at: updateResult.rows[0].updated_at?.toISOString?.() || updateResult.rows[0].updated_at
      });
    } else {
      console.log('✅ ข้อมูลถูกต้องอยู่แล้ว ไม่ต้องอัพเดท');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('🔚 ปิดการเชื่อมต่อฐานข้อมูล');
  }
}

updateHTL800420Price();