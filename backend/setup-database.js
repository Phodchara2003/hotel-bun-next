// Database Setup Script for PostgreSQL (Neon)
// Run this to create tables and insert sample data

const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function setupDatabase() {
  try {
    console.log('🔌 Connecting to PostgreSQL database...');
    await client.connect();
    console.log('✅ Connected to database successfully!');

    // Drop existing tables (for clean setup)
    console.log('\n🗑️ Dropping existing tables...');
    await client.query(`
      DROP TABLE IF EXISTS bookings CASCADE;
      DROP TABLE IF EXISTS rooms CASCADE;
      DROP TABLE IF EXISTS hotels CASCADE;
      DROP TABLE IF EXISTS notifications CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS global_settings CASCADE;
    `);

    // Create Users Table
    console.log('👥 Creating users table...');
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'staff', 'admin')),
        is_active BOOLEAN DEFAULT true,
        email_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Hotels Table
    console.log('🏨 Creating hotels table...');
    await client.query(`
      CREATE TABLE hotels (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        location VARCHAR(255) NOT NULL,
        amenities TEXT[],
        image_url VARCHAR(500),
        rating DECIMAL(2,1) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
        total_rooms INTEGER DEFAULT 0,
        avg_price DECIMAL(10,2) DEFAULT 0.00,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Rooms Table
    console.log('🏠 Creating rooms table...');
    await client.query(`
      CREATE TABLE rooms (
        id SERIAL PRIMARY KEY,
        hotel_id INTEGER REFERENCES hotels(id) ON DELETE CASCADE,
        room_number VARCHAR(10) NOT NULL,
        room_type VARCHAR(50) NOT NULL,
        price_per_night DECIMAL(10,2) NOT NULL,
        max_occupancy INTEGER DEFAULT 2,
        amenities TEXT[],
        description TEXT,
        image_url VARCHAR(500),
        is_available BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(hotel_id, room_number)
      )
    `);

    // Create Bookings Table
    console.log('📅 Creating bookings table...');
    await client.query(`
      CREATE TABLE bookings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        hotel_id INTEGER REFERENCES hotels(id) ON DELETE CASCADE,
        room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
        check_in_date DATE NOT NULL,
        check_out_date DATE NOT NULL,
        guests INTEGER DEFAULT 1,
        total_amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
        payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
        special_requests TEXT,
        qr_code VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CHECK (check_out_date > check_in_date)
      )
    `);

    // Create Notifications Table
    console.log('🔔 Creating notifications table...');
    await client.query(`
      CREATE TABLE notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
        read_status BOOLEAN DEFAULT false,
        action_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Global Settings Table
    console.log('⚙️ Creating global_settings table...');
    await client.query(`
      CREATE TABLE global_settings (
        id SERIAL PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT NOT NULL,
        setting_type VARCHAR(20) DEFAULT 'string' CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Indexes
    console.log('📊 Creating database indexes...');
    await client.query(`
      CREATE INDEX idx_bookings_user_id ON bookings(user_id);
      CREATE INDEX idx_bookings_hotel_id ON bookings(hotel_id);
      CREATE INDEX idx_bookings_room_id ON bookings(room_id);
      CREATE INDEX idx_bookings_dates ON bookings(check_in_date, check_out_date);
      CREATE INDEX idx_bookings_status ON bookings(status);
      CREATE INDEX idx_rooms_hotel_id ON rooms(hotel_id);
      CREATE INDEX idx_rooms_available ON rooms(is_available);
      CREATE INDEX idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX idx_notifications_read ON notifications(read_status);
      CREATE INDEX idx_users_email ON users(email);
      CREATE INDEX idx_users_role ON users(role);
    `);

    // Insert sample hotels
    console.log('🏨 Inserting sample hotels...');
    await client.query(`
      INSERT INTO hotels (name, description, location, amenities, image_url, rating, total_rooms, avg_price) VALUES 
      ($1, $2, $3, $4, $5, $6, $7, $8),
      ($9, $10, $11, $12, $13, $14, $15, $16),
      ($17, $18, $19, $20, $21, $22, $23, $24)
    `, [
      'Royal Palace Bangkok', 'Luxury 5-star hotel in downtown Bangkok', 'Bangkok, Thailand', 
      ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant'], 
      'https://images.unsplash.com/photo-1566073771259-6a8506099945', 4.8, 200, 2500.00,
      
      'Paradise Beach Resort', 'Beachfront resort with private beach access', 'Phuket, Thailand',
      ['Beach Access', 'Pool', 'Water Sports', 'Bar', 'WiFi'],
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4', 4.9, 150, 3200.00,

      'Mountain View Lodge', 'Cozy lodge with mountain views', 'Chiang Mai, Thailand',
      ['Mountain View', 'Hiking', 'WiFi', 'Restaurant', 'Fireplace'],
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d', 4.6, 80, 1800.00
    ]);

    // Insert sample rooms
    console.log('🏠 Inserting sample rooms...');
    await client.query(`
      INSERT INTO rooms (hotel_id, room_number, room_type, price_per_night, max_occupancy, amenities, description) VALUES 
      ($1, $2, $3, $4, $5, $6, $7),
      ($8, $9, $10, $11, $12, $13, $14),
      ($15, $16, $17, $18, $19, $20, $21),
      ($22, $23, $24, $25, $26, $27, $28),
      ($29, $30, $31, $32, $33, $34, $35),
      ($36, $37, $38, $39, $40, $41, $42),
      ($43, $44, $45, $46, $47, $48, $49),
      ($50, $51, $52, $53, $54, $55, $56),
      ($57, $58, $59, $60, $61, $62, $63)
    `, [
      // Royal Palace Bangkok rooms
      1, '101', 'Standard Room', 1500.00, 2, ['WiFi', 'Air Conditioning', 'TV'], 'Comfortable standard room with city view',
      1, '102', 'Standard Room', 1500.00, 2, ['WiFi', 'Air Conditioning', 'TV'], 'Comfortable standard room with city view',
      1, '201', 'Deluxe Room', 2500.00, 2, ['WiFi', 'Air Conditioning', 'TV', 'Minibar'], 'Spacious deluxe room with premium amenities',
      1, '301', 'Suite', 4000.00, 4, ['WiFi', 'Air Conditioning', 'TV', 'Minibar', 'Living Area'], 'Luxury suite with separate living area',
      // Paradise Beach Resort rooms
      2, 'B101', 'Beach View Room', 2800.00, 2, ['WiFi', 'Air Conditioning', 'TV', 'Beach View'], 'Room with direct beach view',
      2, 'B102', 'Beach View Room', 2800.00, 2, ['WiFi', 'Air Conditioning', 'TV', 'Beach View'], 'Room with direct beach view',
      2, 'V201', 'Villa', 5000.00, 4, ['WiFi', 'Air Conditioning', 'TV', 'Private Pool', 'Kitchen'], 'Private villa with pool',
      // Mountain View Lodge rooms
      3, 'M101', 'Mountain View Room', 1200.00, 2, ['WiFi', 'Heating', 'TV', 'Mountain View'], 'Cozy room with mountain view',
      3, 'M102', 'Mountain View Room', 1200.00, 2, ['WiFi', 'Heating', 'TV', 'Mountain View'], 'Cozy room with mountain view'
    ]);

    // Insert sample users (password: admin123 - this is a hashed version)
    console.log('👥 Inserting sample users...');
    await client.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified) VALUES 
      ($1, $2, $3, $4, $5, $6),
      ($7, $8, $9, $10, $11, $12),
      ($13, $14, $15, $16, $17, $18)
    `, [
      'admin@hotel.com', '$2b$10$8K4zYkQeKkh1DH1KqW0KUeC.Yz.8zF4K3H2Z1G9F5M0N7X2V4L8B6', 'Admin', 'User', 'admin', true,
      'staff@hotel.com', '$2b$10$8K4zYkQeKkh1DH1KqW0KUeC.Yz.8zF4K3H2Z1G9F5M0N7X2V4L8B6', 'Staff', 'User', 'staff', true,
      'customer@email.com', '$2b$10$8K4zYkQeKkh1DH1KqW0KUeC.Yz.8zF4K3H2Z1G9F5M0N7X2V4L8B6', 'John', 'Doe', 'customer', true
    ]);

    // Insert global settings
    console.log('⚙️ Inserting global settings...');
    await client.query(`
      INSERT INTO global_settings (setting_key, setting_value, setting_type, description) VALUES 
      ($1, $2, $3, $4),
      ($5, $6, $7, $8),
      ($9, $10, $11, $12),
      ($13, $14, $15, $16),
      ($17, $18, $19, $20),
      ($21, $22, $23, $24)
    `, [
      'room_price_per_night', '1500', 'number', 'Default room price per night in THB',
      'currency', 'THB', 'string', 'Default currency for the system',
      'max_booking_days', '365', 'number', 'Maximum days in advance for booking',
      'cancellation_hours', '24', 'number', 'Hours before check-in to allow free cancellation',
      'tax_rate', '7', 'number', 'Tax rate percentage',
      'service_fee', '100', 'number', 'Service fee in THB'
    ]);

    // Insert sample notifications
    console.log('🔔 Inserting sample notifications...');
    await client.query(`
      INSERT INTO notifications (user_id, title, message, type) VALUES 
      ($1, $2, $3, $4),
      ($5, $6, $7, $8),
      ($9, $10, $11, $12)
    `, [
      null, 'System Online', 'Hotel booking system is now online and ready', 'success',
      null, 'Database Connected', 'Successfully connected to PostgreSQL database', 'info',
      3, 'Welcome!', 'Welcome to our hotel booking system', 'info'
    ]);

    // Display table counts
    console.log('\n📊 Database setup completed! Table counts:');
    const tables = ['hotels', 'rooms', 'users', 'global_settings', 'notifications'];
    
    for (const table of tables) {
      const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`   ${table}: ${result.rows[0].count} records`);
    }

    console.log('\n✅ Database setup completed successfully!');
    console.log('🎯 Ready to connect real PostgreSQL data to the API!');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed.');
  }
}

// Run the setup
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };