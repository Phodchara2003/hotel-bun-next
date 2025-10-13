#!/usr/bin/env bun

import mysql from 'mysql2/promise';

async function checkMySQLData() {
  let connection;
  
  try {
    console.log('🔗 Connecting to MySQL...');
    
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '12345678',
      database: 'hotel_booking'
    });
    
    console.log('✅ Connected to MySQL');
    
    // Check hotels
    console.log('\n1️⃣ Checking hotels in MySQL...');
    const [hotels] = await connection.execute('SELECT * FROM hotels LIMIT 5');
    
    if (hotels.length > 0) {
      console.log(`✅ Hotels found: ${hotels.length}`);
      hotels.forEach(hotel => {
        console.log(`   - ID: ${hotel.id}, Name: ${hotel.name}`);
      });
    } else {
      console.log('❌ No hotels found in MySQL');
      
      // Create sample hotel
      console.log('\n🏨 Creating sample hotel...');
      await connection.execute(`
        INSERT INTO hotels (name, address, description, contact_phone, contact_email, created_at) 
        VALUES (?, ?, ?, ?, ?, NOW())
      `, [
        'โรงแรมวรุณภัฏ มหาวิทยาลัยราชภัฏมหาสารคาม',
        '80 ถนนนครสวรรค์ ตำบลตลาด อำเภอเมือง มหาสารคาม 44000',
        'โรงแรมภายในมหาวิทยาลัยราชภัฏมหาสารคาม บรรยากาศดี สะอาด ปลอดภัย',
        '043-721000',
        'hotel@rmu.ac.th'
      ]);
      
      console.log('✅ Sample hotel created');
      
      // Check again
      const [newHotels] = await connection.execute('SELECT * FROM hotels');
      console.log(`✅ Hotels now: ${newHotels.length}`);
      newHotels.forEach(hotel => {
        console.log(`   - ID: ${hotel.id}, Name: ${hotel.name}`);
      });
    }
    
    // Check reviews table
    console.log('\n2️⃣ Checking reviews table...');
    const [reviews] = await connection.execute('SELECT * FROM reviews LIMIT 5');
    console.log(`📝 Reviews found: ${reviews.length}`);
    
    // Check users table
    console.log('\n3️⃣ Checking users table...');
    const [users] = await connection.execute('SELECT * FROM users LIMIT 5');
    
    if (users.length > 0) {
      console.log(`✅ Users found: ${users.length}`);
      users.forEach(user => {
        console.log(`   - ID: ${user.id}, Email: ${user.email}, Name: ${user.first_name} ${user.last_name || ''}`);
      });
    } else {
      console.log('❌ No users found in MySQL');
      
      // Create sample user
      console.log('\n👤 Creating sample user...');
      await connection.execute(`
        INSERT INTO users (email, password, first_name, last_name, phone, created_at) 
        VALUES (?, ?, ?, ?, ?, NOW())
      `, [
        'demo@example.com',
        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password
        'Demo',
        'User',
        '0800000000'
      ]);
      
      console.log('✅ Sample user created');
      
      // Check again
      const [newUsers] = await connection.execute('SELECT * FROM users');
      console.log(`✅ Users now: ${newUsers.length}`);
      newUsers.forEach(user => {
        console.log(`   - ID: ${user.id}, Email: ${user.email}, Name: ${user.first_name} ${user.last_name || ''}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 MySQL server is not running or connection details are wrong');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 MySQL connection closed');
    }
  }
}

checkMySQLData();