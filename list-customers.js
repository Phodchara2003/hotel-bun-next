import { Database } from 'bun:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create SQLite database connection
const dbPath = path.join(__dirname, 'backend', 'src', 'hotel_booking.db');
const db = new Database(dbPath);

console.log('👥 รายชื่อลูกค้าปกติในระบบ');
console.log('='.repeat(60));

try {
  // ดึงข้อมูลลูกค้าปกติเท่านั้น (role = 'user')
  const customers = db.prepare(`
    SELECT 
      id, 
      email, 
      first_name, 
      last_name, 
      phone, 
      created_at,
      updated_at
    FROM users 
    WHERE role = 'user'
    ORDER BY created_at DESC
  `).all();

  if (customers.length === 0) {
    console.log('❌ ไม่พบลูกค้าปกติในระบบ');
    process.exit(0);
  }

  console.log(`📊 พบลูกค้าปกติทั้งหมด ${customers.length} คน\n`);

  // แสดงรายละเอียดลูกค้าแต่ละคน
  customers.forEach((customer, index) => {
    const fullName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'ไม่ระบุชื่อ';
    const phone = customer.phone || 'ไม่ระบุ';
    const createdDate = new Date(customer.created_at).toLocaleString('th-TH');
    const updatedDate = customer.updated_at ? new Date(customer.updated_at).toLocaleString('th-TH') : 'ไม่เคยอัปเดต';
    
    console.log(`${index + 1}. 👤 ลูกค้า ID: ${customer.id}`);
    console.log(`   📧 อีเมล: ${customer.email}`);
    console.log(`   👤 ชื่อ-นามสกุล: ${fullName}`);
    console.log(`   📱 เบอร์โทร: ${phone}`);
    console.log(`   📅 สมัครเมื่อ: ${createdDate}`);
    console.log(`   🔄 อัปเดตล่าสุด: ${updatedDate}`);
    console.log('');
  });

  // ตรวจสอบลูกค้าที่มีการจองห้อง
  console.log('\n📋 การจองของลูกค้า');
  console.log('-'.repeat(40));
  
  for (const customer of customers) {
    const bookings = db.prepare(`
      SELECT 
        b.id,
        b.booking_reference,
        b.check_in_date,
        b.check_out_date,
        b.total_amount,
        b.status,
        b.guests,
        b.created_at,
        rt.name as room_type_name,
        h.name as hotel_name
      FROM bookings b
      LEFT JOIN room_types rt ON b.room_type_id = rt.id
      LEFT JOIN hotels h ON b.hotel_id = h.id
      WHERE b.user_id = ?
      ORDER BY b.created_at DESC
    `).all(customer.id);

    const fullName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'ไม่ระบุชื่อ';
    
    if (bookings.length > 0) {
      console.log(`\n👤 ${fullName} (${customer.email}):`);
      console.log(`   📊 จำนวนการจอง: ${bookings.length} ครั้ง`);
      
      bookings.forEach((booking, idx) => {
        const checkIn = new Date(booking.check_in_date).toLocaleDateString('th-TH');
        const checkOut = new Date(booking.check_out_date).toLocaleDateString('th-TH');
        const bookingDate = new Date(booking.created_at).toLocaleDateString('th-TH');
        const statusIcon = {
          'pending': '⏳',
          'confirmed': '✅',
          'cancelled': '❌',
          'completed': '🏁'
        };
        
        console.log(`   ${idx + 1}. ${statusIcon[booking.status] || '❓'} การจอง #${booking.id} (${booking.booking_reference})`);
        console.log(`      🏨 โรงแรม: ${booking.hotel_name || 'ไม่ระบุ'}`);
        console.log(`      🛏️  ประเภทห้อง: ${booking.room_type_name || 'ไม่ระบุ'}`);
        console.log(`      👥 จำนวนแขก: ${booking.guests} คน`);
        console.log(`      📅 เข้าพัก: ${checkIn} - ${checkOut}`);
        console.log(`      💰 ราคา: ${booking.total_amount?.toLocaleString()} บาท`);
        console.log(`      📋 สถานะ: ${booking.status}`);
        console.log(`      🗓️  จองเมื่อ: ${bookingDate}`);
        console.log('');
      });
    } else {
      console.log(`\n👤 ${fullName} (${customer.email}): ไม่มีการจอง`);
    }
  }

  // สถิติลูกค้า
  console.log('\n📈 สถิติลูกค้า');
  console.log('-'.repeat(30));
  
  const totalBookings = db.prepare(`
    SELECT COUNT(*) as total 
    FROM bookings b
    JOIN users u ON b.user_id = u.id
    WHERE u.role = 'user'
  `).get();

  const customersWithBookings = db.prepare(`
    SELECT COUNT(DISTINCT u.id) as total
    FROM users u
    JOIN bookings b ON u.id = b.user_id
    WHERE u.role = 'user'
  `).get();

  const customersWithoutBookings = customers.length - customersWithBookings.total;
  
  console.log(`👥 ลูกค้าทั้งหมด: ${customers.length} คน`);
  console.log(`🏨 ลูกค้าที่เคยจอง: ${customersWithBookings.total} คน`);
  console.log(`😴 ลูกค้าที่ยังไม่เคยจอง: ${customersWithoutBookings} คน`);
  console.log(`📊 การจองทั้งหมด: ${totalBookings.total} ครั้ง`);
  
  if (customersWithBookings.total > 0) {
    const avgBookings = (totalBookings.total / customersWithBookings.total).toFixed(1);
    console.log(`📊 การจองเฉลี่ยต่อลูกค้า: ${avgBookings} ครั้ง`);
  }

  // แสดงตารางสรุป
  console.log('\n📝 ตารางลูกค้าทั้งหมด');
  console.log('-'.repeat(90));
  console.log('| ID | อีเมล                    | ชื่อ-นามสกุล         | เบอร์โทร     | วันที่สมัคร |');
  console.log('-'.repeat(90));
  
  customers.forEach(customer => {
    const fullName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || '-';
    const email = customer.email.length > 25 ? customer.email.substring(0, 22) + '...' : customer.email.padEnd(25);
    const name = fullName.length > 20 ? fullName.substring(0, 17) + '...' : fullName.padEnd(20);
    const phone = (customer.phone || '-').padEnd(12);
    const date = new Date(customer.created_at).toLocaleDateString('th-TH');
    
    console.log(`| ${customer.id.toString().padEnd(2)} | ${email} | ${name} | ${phone} | ${date} |`);
  });

  // ลูกค้าที่ทดสอบ
  console.log('\n🧪 ลูกค้าทดสอบ');
  console.log('-'.repeat(20));
  const testCustomers = customers.filter(customer => 
    customer.email.includes('@hotel.com') || customer.email.includes('test')
  );

  if (testCustomers.length > 0) {
    testCustomers.forEach(customer => {
      const fullName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
      console.log(`👤 ${customer.email} - ${fullName}`);
    });
  } else {
    console.log('ไม่พบลูกค้าทดสอบ');
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ แสดงรายชื่อลูกค้าปกติเสร็จสิ้น');

} catch (error) {
  console.error('❌ เกิดข้อผิดพลาด:', error.message);
  console.error('Stack:', error.stack);
}
