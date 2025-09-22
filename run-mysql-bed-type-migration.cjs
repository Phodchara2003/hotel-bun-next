const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Database connection - ใช้ same config กับ mysql-server.cjs
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '12345678',
  database: 'hotel_booking',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
};

async function runMySQLMigration() {
  let connection;
  
  try {
    console.log('🚀 Running bed_type field migration for MySQL...');
    
    // Create connection
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ MySQL connected successfully');
    
    // Test connection
    await connection.execute('SELECT NOW()');
    console.log('✅ Database connection tested');
    
    console.log('\n1. Adding bed_type column to room_types table...');
    
    try {
      await connection.execute(`
        ALTER TABLE room_types 
        ADD COLUMN bed_type VARCHAR(20) DEFAULT 'single'
      `);
      console.log('   ✅ bed_type column added successfully');
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log('   ⚠️  Warning: bed_type column already exists');
      } else {
        throw error;
      }
    }
    
    console.log('\n2. Updating existing data with bed_type values...');
    
    // Update expensive rooms to double bed
    const [result1] = await connection.execute(`
      UPDATE room_types 
      SET bed_type = 'double' 
      WHERE price_per_night > 1500
    `);
    console.log(`   ✅ Updated ${result1.changedRows} rooms to 'double' bed type`);
    
    // Update suite rooms to queen bed
    const [result2] = await connection.execute(`
      UPDATE room_types 
      SET bed_type = 'queen' 
      WHERE type = 'suite'
    `);
    console.log(`   ✅ Updated ${result2.changedRows} suite rooms to 'queen' bed type`);
    
    console.log('\n3. Creating index for bed_type...');
    try {
      await connection.execute(`
        CREATE INDEX idx_room_types_bed_type ON room_types(bed_type)
      `);
      console.log('   ✅ Index created successfully');
    } catch (error) {
      if (error.message.includes('Duplicate key name')) {
        console.log('   ⚠️  Warning: Index already exists');
      } else {
        throw error;
      }
    }
    
    console.log('\n4. Showing updated room types...');
    const [rows] = await connection.execute(`
      SELECT id, name, type, bed_type, price_per_night 
      FROM room_types 
      ORDER BY id 
      LIMIT 10
    `);
    
    console.log('📋 Room types with bed_type:');
    rows.forEach(room => {
      console.log(`   - ID: ${room.id}, Name: ${room.name}, Type: ${room.type}, Bed: ${room.bed_type}, Price: ${room.price_per_night}`);
    });
    
    console.log('\n🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔚 Database connection closed');
    }
  }
}

runMySQLMigration();