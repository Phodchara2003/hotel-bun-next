// Hotel Management System Database Setup
// สำหรับรันสร้างฐานข้อมูลฉบับสมบูรณ์ใหม่
import postgres from 'postgres';

const DATABASE_URL = 'postgresql://neondb_owner:npg_dr8IAjq1xoQD@ep-curly-wind-a1564pc2-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const sql = postgres(DATABASE_URL, { 
  ssl: 'require',
  max: 5,
  idle_timeout: 20,
  connect_timeout: 10
});

console.log('🚀 กำลังสร้างระบบฐานข้อมูลโรงแรมใหม่...');

async function createFullDatabase() {
  try {
    console.log('📋 กำลังสร้างตารางหลัก...');

    // 1. Users table - ข้อมูลผู้ใช้
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        role VARCHAR(20) DEFAULT 'user',
        address TEXT,
        username VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ สร้างตาราง users เรียบร้อย');

    // 2. Hotels table - ข้อมูลโรงแรม
    await sql`
      CREATE TABLE IF NOT EXISTS hotels (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        address TEXT NOT NULL,
        city VARCHAR(100) NOT NULL,
        country VARCHAR(100) NOT NULL,
        rating DECIMAL(2,1) DEFAULT 0,
        images TEXT[],
        amenities TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ สร้างตาราง hotels เรียบร้อย');

    // 3. Room types table - ประเภทห้องพัก
    await sql`
      CREATE TABLE IF NOT EXISTS room_types (
        id SERIAL PRIMARY KEY,
        hotel_id INTEGER REFERENCES hotels(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price_per_night DECIMAL(10,2) NOT NULL,
        max_guests INTEGER NOT NULL,
        size_sqm INTEGER,
        amenities TEXT[],
        images TEXT[],
        type VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ สร้างตาราง room_types เรียบร้อย');

    // 4. Rooms table - ห้องพักจริง
    await sql`
      CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        hotel_id INTEGER REFERENCES hotels(id) ON DELETE CASCADE,
        room_type_id INTEGER REFERENCES room_types(id) ON DELETE CASCADE,
        room_number VARCHAR(20) NOT NULL,
        floor INTEGER,
        status VARCHAR(20) DEFAULT 'available',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(hotel_id, room_number)
      )
    `;
    console.log('✅ สร้างตาราง rooms เรียบร้อย');

    // 5. Bookings table - การจองห้องพัก
    await sql`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        hotel_id INTEGER REFERENCES hotels(id) ON DELETE CASCADE,
        room_type_id INTEGER REFERENCES room_types(id) ON DELETE CASCADE,
        check_in_date DATE NOT NULL,
        check_out_date DATE NOT NULL,
        guests INTEGER NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        special_requests TEXT,
        booking_reference VARCHAR(50) UNIQUE NOT NULL,
        guest_name VARCHAR(255),
        guest_phone VARCHAR(20),
        guest_email VARCHAR(255),
        guest_address TEXT,
        guest_id_number VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ สร้างตาราง bookings เรียบร้อย');

    // 6. Notifications table - ระบบแจ้งเตือน
    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ สร้างตาราง notifications เรียบร้อย');

    // 7. Reviews table - รีวิวจากลูกค้า
    await sql`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        hotel_id INTEGER REFERENCES hotels(id) ON DELETE CASCADE,
        booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ สร้างตาราง reviews เรียบร้อย');

    // 8. Payment settings table - การตั้งค่าการชำระเงิน
    await sql`
      CREATE TABLE IF NOT EXISTS simple_payment_settings (
        id SERIAL PRIMARY KEY,
        settings JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ สร้างตาราง simple_payment_settings เรียบร้อย');

    // 9. Payment settings table (alternative) - สำหรับระบบ QR Code
    await sql`
      CREATE TABLE IF NOT EXISTS payment_settings (
        id SERIAL PRIMARY KEY,
        bank_name VARCHAR(255) NOT NULL,
        account_name VARCHAR(255) NOT NULL,
        account_number VARCHAR(50) NOT NULL,
        qr_code_image TEXT,
        prompt_pay_id VARCHAR(50),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ สร้างตาราง payment_settings เรียบร้อย');

    console.log('📋 กำลังสร้างตารางขั้นสูง...');

    // 10. Room status tracking - ติดตามสถานะห้องพัก
    await sql`
      CREATE TABLE IF NOT EXISTS room_status (
        id SERIAL PRIMARY KEY,
        room_id INTEGER REFERENCES room_types(id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL DEFAULT 'available',
        current_booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
        last_checkout TIMESTAMP,
        last_cleaning TIMESTAMP,
        notes TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(room_id)
      )
    `;
    console.log('✅ สร้างตาราง room_status เรียบร้อย');

    // 11. Check-ins table - ระบบเช็คอิน
    await sql`
      CREATE TABLE IF NOT EXISTS check_ins (
        id SERIAL PRIMARY KEY,
        booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
        guest_name VARCHAR(255) NOT NULL,
        guest_phone VARCHAR(20),
        guest_email VARCHAR(255),
        guest_id_number VARCHAR(50),
        guest_address TEXT,
        number_of_guests INTEGER NOT NULL,
        check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        checked_in_by INTEGER REFERENCES users(id),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ สร้างตาราง check_ins เรียบร้อย');

    // 12. Check-outs table - ระบบเช็คเอาท์
    await sql`
      CREATE TABLE IF NOT EXISTS check_outs (
        id SERIAL PRIMARY KEY,
        booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
        check_out_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        room_condition VARCHAR(50),
        minibar_charges DECIMAL(10,2) DEFAULT 0,
        damage_charges DECIMAL(10,2) DEFAULT 0,
        total_additional_charges DECIMAL(10,2) DEFAULT 0,
        payment_status VARCHAR(20) DEFAULT 'pending',
        notes TEXT,
        checked_out_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ สร้างตาราง check_outs เรียบร้อย');

    // 13. Housekeeping tasks - งานแม่บ้าน
    await sql`
      CREATE TABLE IF NOT EXISTS housekeeping_tasks (
        id SERIAL PRIMARY KEY,
        room_id INTEGER REFERENCES room_types(id) ON DELETE CASCADE,
        task_type VARCHAR(50) NOT NULL,
        priority VARCHAR(20) DEFAULT 'normal',
        status VARCHAR(20) DEFAULT 'pending',
        assigned_to INTEGER REFERENCES users(id),
        estimated_duration INTEGER,
        actual_duration INTEGER,
        notes TEXT,
        completed_at TIMESTAMP,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ สร้างตาราง housekeeping_tasks เรียบร้อย');

    // 14. Room inspections - การตรวจสอบห้องพัก
    await sql`
      CREATE TABLE IF NOT EXISTS room_inspections (
        id SERIAL PRIMARY KEY,
        room_id INTEGER REFERENCES room_types(id) ON DELETE CASCADE,
        inspector_id INTEGER REFERENCES users(id),
        inspection_type VARCHAR(50),
        status VARCHAR(20) DEFAULT 'pending',
        cleanliness_score INTEGER CHECK (cleanliness_score >= 1 AND cleanliness_score <= 5),
        maintenance_score INTEGER CHECK (maintenance_score >= 1 AND maintenance_score <= 5),
        amenities_score INTEGER CHECK (amenities_score >= 1 AND amenities_score <= 5),
        overall_score DECIMAL(3,2),
        issues_found TEXT[],
        photos TEXT[],
        notes TEXT,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ สร้างตาราง room_inspections เรียบร้อย');

    // 15. Room status history - ประวัติการเปลี่ยนสถานะห้อง
    await sql`
      CREATE TABLE IF NOT EXISTS room_status_history (
        id SERIAL PRIMARY KEY,
        room_id INTEGER REFERENCES room_types(id) ON DELETE CASCADE,
        old_status VARCHAR(50),
        new_status VARCHAR(50) NOT NULL,
        changed_by INTEGER REFERENCES users(id),
        reason TEXT,
        booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ สร้างตาราง room_status_history เรียบร้อย');

    // 16. User permissions - สิทธิ์การเข้าถึงของผู้ใช้
    await sql`
      CREATE TABLE IF NOT EXISTS user_permissions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        permission VARCHAR(100) NOT NULL,
        resource VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, permission, resource)
      )
    `;
    console.log('✅ สร้างตาราง user_permissions เรียบร้อย');

    console.log('📊 กำลังสร้าง indexes เพื่อประสิทธิภาพ...');

    // Create indexes for performance
    await sql`CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_bookings_hotel_id ON bookings(hotel_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(check_in_date, check_out_date)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_bookings_reference ON bookings(booking_reference)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_room_types_hotel_id ON room_types(hotel_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_rooms_hotel_id ON rooms(hotel_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_rooms_type_id ON rooms(room_type_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`;
    
    console.log('✅ สร้าง indexes เรียบร้อย');

    console.log('👥 กำลังสร้างผู้ใช้เริ่มต้น...');

    // Insert default users with hashed passwords
    await sql`
      INSERT INTO users (first_name, last_name, email, phone, password, role)
      VALUES 
        ('Admin', 'Manager', 'admin@royalgarden.com', '0887654321', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
        ('Demo', 'User', 'demo@example.com', '0812345678', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user'),
        ('Staff', 'Member', 'staff@hotel.com', '0833334444', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'staff')
      ON CONFLICT (email) DO NOTHING
    `;
    console.log('✅ สร้างผู้ใช้เริ่มต้นเรียบร้อย');

    console.log('🏨 กำลังสร้างข้อมูลโรงแรม...');

    // Insert hotel data
    const hotel = await sql`
      INSERT INTO hotels (name, description, address, city, country, rating, images, amenities)
      VALUES (
        'Royal Garden Hotel Bangkok',
        'โรงแรมหรูระดับ 5 ดาว ใจกลางกรุงเทพฯ พร้อมสิ่งอำนวยความสะดวกครบครัน มีประสบการณ์การให้บริการมากกว่า 20 ปี ด้วยการออกแบบที่ผสมผสานระหว่างสถาปัตยกรรมไทยดั้งเดิมและความทันสมัย',
        '123 สาทรใต้ ยานนาวา กรุงเทพฯ 10120',
        'กรุงเทพฯ',
        'ประเทศไทย',
        4.8,
        ${[
          'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800',
          'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
          'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'
        ]},
        ${[
          'WiFi ฟรี',
          'สระว่ายน้ำ',
          'สปา',
          'ฟิตเนส',
          'ร้านอาหาร',
          'บาร์',
          'รูมเซอร์วิส 24 ชม.',
          'ที่จอดรถฟรี',
          'บริการซักรีด',
          'บริการรับส่งสนามบิน',
          'ห้องประชุม',
          'ลิฟต์',
          'เครื่องปรับอากาศ'
        ]}
      )
      ON CONFLICT DO NOTHING
      RETURNING id
    `;

    const hotelId = hotel.length > 0 ? hotel[0].id : 1;
    console.log(`✅ สร้างโรงแรม ID: ${hotelId}`);

    console.log('🛏️ กำลังสร้างประเภทห้องพัก...');

    // Insert room types
    await sql`
      INSERT INTO room_types (hotel_id, name, description, price_per_night, max_guests, size_sqm, amenities, images, type)
      VALUES 
        (${hotelId}, 'Standard Room', 'ห้องพักมาตรฐานขนาด 25 ตรม. พร้อมเตียงคิงไซส์ และวิวเมือง ตกแต่งด้วยโทนสีอบอุ่น เหมาะสำหรับผู้เดินทางคนเดียวหรือคู่รัก', 2500, 2, 25, 
         ${['เครื่องปรับอากาศ', 'ทีวี LED 32"', 'WiFi ฟรี', 'มินิบาร์', 'ตู้เซฟ', 'โต๊ะทำงาน', 'เครื่องใช้ไฟฟ้าครบครัน', 'ผ้าปูที่นอนคุณภาพสูง']}, 
         ${['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600']},
         'standard'),
        
        (${hotelId}, 'Deluxe Room', 'ห้องพักระดับพรีเมียม ขนาด 35 ตรม. พร้อมระเบียงส่วนตัว วิวสวนสวย เฟอร์นิเจอร์ไม้สัก และสิ่งอำนวยความสะดวกระดับพรีเมียม', 3500, 2, 35,
         ${['เครื่องปรับอากาศ', 'ทีวี LED 42"', 'WiFi ฟรี', 'มินิบาร์', 'ตู้เซฟ', 'โต๊ะทำงาน', 'ระเบียงส่วนตัว', 'เครื่องชงกาแฟ', 'เครื่องใช้ไฟฟ้าครบครัน']},
         ${['https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600', 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600']},
         'deluxe'),
        
        (${hotelId}, 'Junior Suite', 'ห้องสวีทขนาด 50 ตรม. พร้อมห้องนั่งเล่นแยก และวิวสระว่ายน้ำ มีพื้นที่ใช้สอยกว้างขวาง เหมาะสำหรับครอบครัวเล็ก', 5000, 3, 50,
         ${['เครื่องปรับอากาศ', 'ทีวี LED 50"', 'WiFi ฟรี', 'มินิบาร์', 'ตู้เซฟ', 'โต๊ะทำงาน', 'ระเบียงส่วนตัว', 'เครื่องชงกาแฟ', 'ห้องนั่งเล่น', 'โซฟาเบด']},
         ${['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600', 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600']},
         'suite'),
        
        (${hotelId}, 'Executive Suite', 'ห้องสวีทเอ็กเซ็กคิวทีฟ ขนาด 75 ตรม. พร้อมห้องทำงาน วิวเมืองสวยงาม และสิ่งอำนวยความสะดวกระดับบิสซิเนส', 8000, 4, 75,
         ${['เครื่องปรับอากาศ', 'ทีวี LED 55"', 'WiFi ฟรี', 'มินิบาร์', 'ตู้เซฟ', 'โต๊ะทำงาน', 'ระเบียงส่วนตัว', 'เครื่องชงกาแฟ', 'ห้องนั่งเล่น', 'ห้องทำงาน', 'อ่างอาบน้ำจากุซซี่']},
         ${['https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600', 'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=600']},
         'executive'),
        
        (${hotelId}, 'Presidential Suite', 'ห้องสวีทประธานาธิบดี ขนาด 120 ตรม. ห้องพักระดับโรงแรม 5 ดาวที่สุดหรู พร้อมสิ่งอำนวยความสะดวกครบครันระดับเวิลด์คลาส', 15000, 6, 120,
         ${['เครื่องปรับอากาศ', 'ทีวี LED 65"', 'WiFi ฟรี', 'มินิบาร์', 'ตู้เซฟ', 'โต๊ะทำงาน', 'ระเบียงส่วนตัว', 'เครื่องชงกาแฟ', 'ห้องนั่งเล่น', 'ห้องทำงาน', 'อ่างอาบน้ำจากุซซี่', 'ห้องแต่งตัว', 'ห้องครัวเล็ก']},
         ${['https://images.unsplash.com/photo-1506059612708-99d6c258160e?w=600', 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600']},
         'presidential')
      ON CONFLICT DO NOTHING
    `;
    console.log('✅ สร้างประเภทห้องพักเรียบร้อย');

    console.log('🏠 กำลังสร้างห้องพัก...');

    // Get room type IDs
    const roomTypes = await sql`SELECT id FROM room_types WHERE hotel_id = ${hotelId} ORDER BY id`;
    
    if (roomTypes.length >= 5) {
      // Standard Rooms (101-110) - 10 rooms
      for (let i = 1; i <= 10; i++) {
        await sql`
          INSERT INTO rooms (hotel_id, room_type_id, room_number, floor, status)
          VALUES (${hotelId}, ${roomTypes[0].id}, ${`10${i}`}, 1, 'available')
          ON CONFLICT (hotel_id, room_number) DO NOTHING
        `;
      }
      
      // Deluxe Rooms (201-215) - 15 rooms  
      for (let i = 1; i <= 15; i++) {
        const roomNumber = i < 10 ? `20${i}` : `2${i}`;
        await sql`
          INSERT INTO rooms (hotel_id, room_type_id, room_number, floor, status)
          VALUES (${hotelId}, ${roomTypes[1].id}, ${roomNumber}, 2, 'available')
          ON CONFLICT (hotel_id, room_number) DO NOTHING
        `;
      }
      
      // Junior Suites (301-308) - 8 rooms
      for (let i = 1; i <= 8; i++) {
        await sql`
          INSERT INTO rooms (hotel_id, room_type_id, room_number, floor, status)
          VALUES (${hotelId}, ${roomTypes[2].id}, ${`30${i}`}, 3, 'available')
          ON CONFLICT (hotel_id, room_number) DO NOTHING
        `;
      }
      
      // Executive Suites (401-405) - 5 rooms
      for (let i = 1; i <= 5; i++) {
        await sql`
          INSERT INTO rooms (hotel_id, room_type_id, room_number, floor, status)
          VALUES (${hotelId}, ${roomTypes[3].id}, ${`40${i}`}, 4, 'available')
          ON CONFLICT (hotel_id, room_number) DO NOTHING
        `;
      }
      
      // Presidential Suite (501) - 1 room
      await sql`
        INSERT INTO rooms (hotel_id, room_type_id, room_number, floor, status)
        VALUES (${hotelId}, ${roomTypes[4].id}, '501', 5, 'available')
        ON CONFLICT (hotel_id, room_number) DO NOTHING
      `;
    }
    
    console.log('✅ สร้างห้องพักเรียบร้อย');

    console.log('💳 กำลังสร้างการตั้งค่าการชำระเงิน...');

    // Insert payment settings
    await sql`
      INSERT INTO simple_payment_settings (settings)
      VALUES (${JSON.stringify({
        bankName: "ธนาคารกสิกรไทย",
        accountName: "Royal Garden Hotel Bangkok",
        accountNumber: "123-456-7890",
        promptPayId: "0887654321",
        qrCodeImage: "",
        isActive: true
      })})
      ON CONFLICT DO NOTHING
    `;

    await sql`
      INSERT INTO payment_settings (bank_name, account_name, account_number, prompt_pay_id, is_active)
      VALUES ('ธนาคารกสิกรไทย', 'Royal Garden Hotel Bangkok', '123-456-7890', '0887654321', true)
      ON CONFLICT DO NOTHING
    `;

    console.log('✅ สร้างการตั้งค่าการชำระเงินเรียบร้อย');

    // Initialize room status for all room types
    await sql`
      INSERT INTO room_status (room_id, status, updated_at)
      SELECT id, 'available', CURRENT_TIMESTAMP 
      FROM room_types
      WHERE id NOT IN (SELECT room_id FROM room_status WHERE room_id IS NOT NULL)
    `;

    console.log('✅ กำหนดสถานะห้องพักเริ่มต้นเรียบร้อย');

    // Get final statistics
    const stats = await sql`
      SELECT 
        (SELECT COUNT(*) FROM users) as users_count,
        (SELECT COUNT(*) FROM hotels) as hotels_count,
        (SELECT COUNT(*) FROM room_types) as room_types_count,
        (SELECT COUNT(*) FROM rooms) as rooms_count,
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') as tables_count
    `;

    console.log('\n==============================================');
    console.log('🎉 ระบบฐานข้อมูลโรงแรมสร้างเสร็จเรียบร้อย!');
    console.log('==============================================');
    console.log(`📊 ตารางที่สร้าง: ${stats[0].tables_count} ตาราง`);
    console.log(`👥 ผู้ใช้: ${stats[0].users_count} คน`);
    console.log(`🏨 โรงแรม: ${stats[0].hotels_count} แห่ง`);
    console.log(`🛏️ ประเภทห้อง: ${stats[0].room_types_count} ประเภท`);
    console.log(`🏠 ห้องพัก: ${stats[0].rooms_count} ห้อง`);
    console.log('==============================================');
    console.log('🔑 บัญชีผู้ดูแลระบบ:');
    console.log('   📧 อีเมล: admin@royalgarden.com');
    console.log('   🔑 รหัสผ่าน: password');
    console.log('==============================================');
    console.log('🔑 บัญชีทดสอบ:');
    console.log('   📧 อีเมล: demo@example.com');
    console.log('   🔑 รหัสผ่าน: password');
    console.log('==============================================');

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการสร้างฐานข้อมูล:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// เรียกใช้ฟังก์ชัน
createFullDatabase();