import { Database } from 'bun:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create SQLite database
const dbPath = path.join(__dirname, '..', 'hotel_booking.db');
const db = new Database(dbPath);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON');

console.log('SQLite Database connected:', dbPath);

// Create tables
const createTables = () => {
  try {
    // Create tables if they don't exist
    console.log('Creating tables...');

    // Users table
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        phone TEXT,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Hotels table
    db.exec(`
      CREATE TABLE IF NOT EXISTS hotels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        address TEXT,
        city TEXT,
        country TEXT,
        rating REAL DEFAULT 0,
        amenities TEXT, -- JSON string
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Room types table
    db.exec(`
      CREATE TABLE IF NOT EXISTS room_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hotel_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        capacity INTEGER NOT NULL,
        price_per_night REAL NOT NULL,
        amenities TEXT, -- JSON string
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
      )
    `);

    // Rooms table
    db.exec(`
      CREATE TABLE IF NOT EXISTS rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hotel_id INTEGER NOT NULL,
        room_type_id INTEGER NOT NULL,
        room_number TEXT NOT NULL,
        is_available BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
        FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE CASCADE,
        UNIQUE(hotel_id, room_number)
      )
    `);

    // Bookings table
    db.exec(`
      CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        hotel_id INTEGER NOT NULL,
        room_id INTEGER NOT NULL,
        room_type_id INTEGER NOT NULL,
        booking_reference TEXT UNIQUE NOT NULL,
        check_in_date DATE NOT NULL,
        check_out_date DATE NOT NULL,
        guests INTEGER NOT NULL,
        total_amount REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
        FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE CASCADE
      )
    `);

    // Reviews table
    db.exec(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        hotel_id INTEGER NOT NULL,
        booking_id INTEGER,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
        FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
      )
    `);

    // Notifications table
    db.exec(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'info',
        is_read BOOLEAN DEFAULT 0,
        booking_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
      )
    `);

    console.log('✅ Database tables created successfully');
    return true;
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    return false;
  }
};

// Insert sample data
const insertSampleData = () => {
  try {
    // Insert admin user
    db.exec(`
      INSERT OR REPLACE INTO users (id, email, password, first_name, last_name, role)
      VALUES (2, 'admin@royalgarden.com', '$2b$12$8xvj5QQ9lK9.EKGzTlXWIuF8DXq2O.YGqTdQFN4qZYCpqE3L6oWOy', 'Admin', 'Manager', 'admin')
    `);

    // Insert hotel
    db.exec(`
      INSERT OR REPLACE INTO hotels (id, name, description, address, city, country, rating, amenities)
      VALUES (1, 'Royal Garden Resort', 'Luxury resort with beautiful gardens and excellent service', 
              '123 Garden Street', 'Chiang Mai', 'Thailand', 4.5, 
              '["Pool", "Spa", "Restaurant", "WiFi", "Gym", "Garden", "Room Service"]')
    `);

    // Insert room types
    db.exec(`
      INSERT OR REPLACE INTO room_types (id, hotel_id, name, description, capacity, price_per_night, amenities)
      VALUES 
      (1, 1, 'Deluxe Room', 'Comfortable room with garden view', 2, 2500, '["King Bed", "Balcony", "Mini Bar", "AC", "WiFi"]'),
      (2, 1, 'Suite', 'Spacious suite with living area', 4, 4500, '["2 Bedrooms", "Living Room", "Kitchen", "Balcony", "WiFi"]'),
      (3, 1, 'Garden Villa', 'Private villa with garden access', 6, 8500, '["3 Bedrooms", "Private Garden", "Kitchen", "Living Room", "Pool Access"]')
    `);

    // Insert rooms
    db.exec(`
      INSERT OR REPLACE INTO rooms (id, hotel_id, room_type_id, room_number, is_available)
      VALUES 
      (1, 1, 1, '101', 1),
      (2, 1, 1, '102', 1),
      (3, 1, 1, '103', 1),
      (4, 1, 2, '201', 1),
      (5, 1, 2, '202', 1),
      (6, 1, 3, '301', 1)
    `);

    // Insert sample notifications
    db.exec(`
      INSERT OR REPLACE INTO notifications (id, user_id, title, message, type, is_read)
      VALUES 
      (1, 2, 'Welcome to Hotel Management System', 'Your account has been set up successfully.', 'info', 0),
      (2, 2, 'System Update', 'New features have been added to the dashboard.', 'success', 0)
    `);

    console.log('✅ Sample data inserted successfully');
    return true;
  } catch (error) {
    console.error('❌ Error inserting sample data:', error);
    return false;
  }
};

// Initialize database
const initializeDatabase = () => {
  if (createTables()) {
    insertSampleData();
  }
};

// Export database instance and helper functions
export { db, initializeDatabase };

// Helper function to convert SQLite row to object with proper JSON parsing
export const parseRow = (row) => {
  if (!row) return null;
  
  const parsed = { ...row };
  
  // Parse JSON fields
  if (parsed.amenities && typeof parsed.amenities === 'string') {
    try {
      parsed.amenities = JSON.parse(parsed.amenities);
    } catch (e) {
      parsed.amenities = [];
    }
  }
  
  return parsed;
};

// Helper function to parse multiple rows
export const parseRows = (rows) => {
  return rows.map(parseRow);
};
