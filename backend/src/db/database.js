import postgres from 'postgres';
import 'dotenv/config';

console.log('Database URL:', process.env.DATABASE_URL);

// Use a more flexible database configuration
let sql;
try {
  const isNeonDatabase = process.env.DATABASE_URL?.includes('neon.tech');
  
  sql = postgres(process.env.DATABASE_URL || 'postgresql://localhost:5432/hotel_booking', {
    ssl: isNeonDatabase ? 'require' : false, // Enable SSL for Neon, disable for local
    onnotice: () => {}, // Ignore notices
    connection: {
      application_name: 'hotel_booking_api',
    },
    max: 10, // Maximum connections
    idle_timeout: 20,
    connect_timeout: 30, // Increase timeout for cloud connection
    transform: {
      undefined: null // Convert undefined to null
    }
  });
} catch (error) {
  console.error('Failed to initialize database connection:', error);
  // Fallback to mock mode for development
  sql = null;
}

export const createTables = async () => {
  try {
    // Drop existing tables if they exist (in correct order due to dependencies)
    await sql`DROP TABLE IF EXISTS reviews CASCADE`;
    await sql`DROP TABLE IF EXISTS bookings CASCADE`;
    await sql`DROP TABLE IF EXISTS rooms CASCADE`;
    await sql`DROP TABLE IF EXISTS room_types CASCADE`;
    await sql`DROP TABLE IF EXISTS hotels CASCADE`;
    await sql`DROP TABLE IF EXISTS users CASCADE`;

    // Users table
    await sql`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Hotels table
    await sql`
      CREATE TABLE hotels (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        address TEXT NOT NULL,
        city VARCHAR(100) NOT NULL,
        country VARCHAR(100) NOT NULL,
        rating DECIMAL(2,1) DEFAULT 0,
        images TEXT[], -- Array of image URLs
        amenities TEXT[], -- Array of amenities
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Room types table
    await sql`
      CREATE TABLE room_types (
        id SERIAL PRIMARY KEY,
        hotel_id INTEGER REFERENCES hotels(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price_per_night DECIMAL(10,2) NOT NULL,
        max_guests INTEGER NOT NULL,
        size_sqm INTEGER,
        amenities TEXT[],
        images TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Rooms table
    await sql`
      CREATE TABLE rooms (
        id SERIAL PRIMARY KEY,
        hotel_id INTEGER REFERENCES hotels(id) ON DELETE CASCADE,
        room_type_id INTEGER REFERENCES room_types(id) ON DELETE CASCADE,
        room_number VARCHAR(20) NOT NULL,
        floor INTEGER,
        status VARCHAR(20) DEFAULT 'available', -- available, occupied, maintenance
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(hotel_id, room_number)
      )
    `;

    // Bookings table
    await sql`
      CREATE TABLE bookings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        hotel_id INTEGER REFERENCES hotels(id) ON DELETE CASCADE,
        room_type_id INTEGER REFERENCES room_types(id) ON DELETE CASCADE,
        check_in_date DATE NOT NULL,
        check_out_date DATE NOT NULL,
        guests INTEGER NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, cancelled, completed
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

    // Notifications table
    await sql`
      CREATE TABLE notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL, -- booking_confirmed, booking_cancelled, payment_reminder, check_in_reminder
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Reviews table
    await sql`
      CREATE TABLE reviews (
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

    console.log('✅ All tables created successfully');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  }
};

export const insertSampleData = async () => {
  try {
    // Insert demo users (regular user + admin)
    const bcrypt = await import('bcryptjs');
    const userPassword = await bcrypt.hash('password123', 10);
    const adminPassword = await bcrypt.hash('admin123', 10);
    
    await sql`
      INSERT INTO users (first_name, last_name, email, phone, password, role)
      VALUES 
        ('Demo', 'User', 'demo@example.com', '0812345678', ${userPassword}, 'user'),
        ('Admin', 'Manager', 'admin@royalgarden.com', '0887654321', ${adminPassword}, 'admin')
      ON CONFLICT (email) DO NOTHING
    `;

    // Insert single hotel data
    const hotel = await sql`
      INSERT INTO hotels (name, description, address, city, country, rating, images, amenities)
      VALUES 
        ('Royal Garden Hotel Bangkok', 'โรงแรมหรูระดับ 5 ดาว ใจกลางกรุงเทพฯ พร้อมสิ่งอำนวยความสะดวกครบครัน', 
         '123 สาทรใต้ ยานนาวา กรุงเทพฯ 10120', 'กรุงเทพฯ', 'ประเทศไทย', 4.8, 
         ARRAY['https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800', 
               'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
               'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800'], 
         ARRAY['WiFi ฟรี', 'สระว่ายน้ำ', 'สปา', 'ฟิตเนส', 'ร้านอาหาร', 'บาร์', 'รูมเซอร์วิส 24 ชม.', 'ที่จอดรถฟรี', 'บริการซักรีด'])
      RETURNING id
    `;

    const hotelId = hotel[0].id;

    // Insert room types with more variety
    await sql`
      INSERT INTO room_types (hotel_id, name, description, price_per_night, max_guests, size_sqm, amenities, images)
      VALUES 
        (${hotelId}, 'Standard Room', 'ห้องพักมาตรฐานขนาด 25 ตรม. พร้อมเตียงคิงไซส์ และวิวเมือง', 2500, 2, 25, 
         ARRAY['เครื่องปรับอากาศ', 'ทีวี LED 32"', 'WiFi ฟรี', 'มินิบาร์', 'ตู้เซฟ', 'โต๊ะทำงาน'], 
         ARRAY['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600',
               'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600']),
        
        (${hotelId}, 'Deluxe Room', 'ห้องพักระดับพรีเมียม ขนาด 35 ตรม. พร้อมระเบียงส่วนตัว', 3500, 2, 35,
         ARRAY['เครื่องปรับอากาศ', 'ทีวี LED 42"', 'WiFi ฟรี', 'มินิบาร์', 'ตู้เซฟ', 'โต๊ะทำงาน', 'ระเบียงส่วนตัว', 'เครื่องชงกาแฟ'],
         ARRAY['https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600',
               'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600']),
        
        (${hotelId}, 'Junior Suite', 'ห้องสวีทขนาด 50 ตรม. พร้อมห้องนั่งเล่นแยก และวิวสระว่ายน้ำ', 5000, 3, 50,
         ARRAY['เครื่องปรับอากาศ', 'ทีวี LED 50"', 'WiFi ฟรี', 'มินิบาร์', 'ตู้เซฟ', 'โต๊ะทำงาน', 'ระเบียงส่วนตัว', 'เครื่องชงกาแฟ', 'ห้องนั่งเล่น', 'โซฟาเบด'],
         ARRAY['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600',
               'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600']),
        
        (${hotelId}, 'Executive Suite', 'ห้องสวีทเอ็กเซ็กคิวทีฟ ขนาด 75 ตรม. พร้อมห้องทำงาน และวิวเมืองสวยงาม', 8000, 4, 75,
         ARRAY['เครื่องปรับอากาศ', 'ทีวี LED 55"', 'WiFi ฟรี', 'มินิบาร์', 'ตู้เซฟ', 'โต๊ะทำงาน', 'ระเบียงส่วนตัว', 'เครื่องชงกาแฟ', 'ห้องนั่งเล่น', 'ห้องทำงาน', 'อ่างอาบน้ำจากุซซี่'],
         ARRAY['https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600',
               'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=600']),
        
        (${hotelId}, 'Presidential Suite', 'ห้องสวีทประธานาธิบดี ขนาด 120 ตรม. ห้องพักระดับโรงแรม 5 ดาวที่สุดหรู', 15000, 6, 120,
         ARRAY['เครื่องปรับอากาศ', 'ทีวี LED 65"', 'WiFi ฟรี', 'มินิบาร์', 'ตู้เซฟ', 'โต๊ะทำงาน', 'ระเบียงส่วนตัว', 'เครื่องชงกาแฟ', 'ห้องนั่งเล่น', 'ห้องทำงาน', 'อ่างอาบน้ำจากุซซี่', 'ห้องแต่งตัว', 'ห้องครัวเล็ก'],
         ARRAY['https://images.unsplash.com/photo-1506059612708-99d6c258160e?w=600',
               'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600'])
    `;

    // Insert actual room numbers for each room type
    const roomTypes = await sql`SELECT id FROM room_types WHERE hotel_id = ${hotelId}`;
    
    // Standard Rooms (101-110)
    for (let i = 1; i <= 10; i++) {
      await sql`
        INSERT INTO rooms (hotel_id, room_type_id, room_number, floor, status)
        VALUES (${hotelId}, ${roomTypes[0].id}, ${`10${i}`}, 1, 'available')
      `;
    }
    
    // Deluxe Rooms (201-215)
    for (let i = 1; i <= 15; i++) {
      const roomNumber = i < 10 ? `20${i}` : `2${i}`;
      await sql`
        INSERT INTO rooms (hotel_id, room_type_id, room_number, floor, status)
        VALUES (${hotelId}, ${roomTypes[1].id}, ${roomNumber}, 2, 'available')
      `;
    }
    
    // Junior Suites (301-308)
    for (let i = 1; i <= 8; i++) {
      await sql`
        INSERT INTO rooms (hotel_id, room_type_id, room_number, floor, status)
        VALUES (${hotelId}, ${roomTypes[2].id}, ${`30${i}`}, 3, 'available')
      `;
    }
    
    // Executive Suites (401-405)
    for (let i = 1; i <= 5; i++) {
      await sql`
        INSERT INTO rooms (hotel_id, room_type_id, room_number, floor, status)
        VALUES (${hotelId}, ${roomTypes[3].id}, ${`40${i}`}, 4, 'available')
      `;
    }
    
    // Presidential Suite (501)
    await sql`
      INSERT INTO rooms (hotel_id, room_type_id, room_number, floor, status)
      VALUES (${hotelId}, ${roomTypes[4].id}, '501', 5, 'available')
    `;

    console.log('✅ Sample data inserted successfully');
  } catch (error) {
    console.error('❌ Error inserting sample data:', error);
    throw error;
  }
};

export { sql };
