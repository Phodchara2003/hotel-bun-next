// Create Admin User for Testing
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_N6QVxYpgu5EG@ep-rough-dream-a1b92i89-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
});

const createAdminUser = async () => {
  try {
    console.log('🔐 Creating Admin User...');
    
    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    // Check if admin exists
    const existingAdmin = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      ['admin@hotel.com']
    );
    
    if (existingAdmin.rows.length > 0) {
      console.log('✅ Admin user already exists');
      console.log('📧 Email:', existingAdmin.rows[0].email);
      console.log('🎭 Role:', existingAdmin.rows[0].role);
      return;
    }
    
    // Create admin user
    const result = await pool.query(`
      INSERT INTO users (username, email, password, first_name, last_name, role, phone)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, email, first_name, last_name, role
    `, [
      'admin_user',
      'admin@hotel.com',
      hashedPassword,
      'Admin',
      'User',
      'admin',
      '0800000000'
    ]);
    
    console.log('✅ Admin user created successfully!');
    console.log('👤 User Info:', result.rows[0]);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
};

createAdminUser();
