const mysql = require('mysql2/promise');
require('dotenv').config();

async function createContactSettingsTable() {
  let connection;
  
  try {
    console.log('🔄 Connecting to MySQL database...');
    
    // First connect without database to create it
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      charset: 'utf8mb4'
    });
    
    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'hotel_db';
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`✅ Database '${dbName}' ensured to exist`);
    
    // Now connect to the specific database
    await connection.end();
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: dbName,
      charset: 'utf8mb4'
    });
    
    console.log('✅ Connected to database successfully!');
    
    // Create contact_settings table
    console.log('📋 Creating contact_settings table...');
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS contact_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(50) NOT NULL UNIQUE,
        setting_value TEXT,
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Table created successfully!');
    
    // Insert default contact settings
    console.log('📝 Inserting default contact settings...');
    
    const defaultSettings = [
      ['phone', '02-123-4567'],
      ['email', 'support@hotel.com'],
      ['address', ''],
      ['website', ''],
      ['facebook', ''],
      ['line', '']
    ];
    
    for (const [key, value] of defaultSettings) {
      await connection.execute(`
        INSERT INTO contact_settings (setting_key, setting_value)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE 
        setting_value = VALUES(setting_value),
        updated_at = NOW()
      `, [key, value]);
      
      console.log(`✅ Inserted/Updated setting: ${key} = ${value}`);
    }
    
    // Verify data
    console.log('🔍 Verifying inserted data...');
    const [rows] = await connection.execute('SELECT * FROM contact_settings');
    console.log('📋 Contact settings in database:');
    rows.forEach(row => {
      console.log(`  ${row.setting_key}: ${row.setting_value}`);
    });
    
    console.log('🎉 Contact settings table setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error setting up contact settings table:', error);
    console.error('Details:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('📤 Database connection closed');
    }
  }
}

// Run the setup
createContactSettingsTable().catch(console.error);
