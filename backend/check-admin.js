import { sql } from './src/db/database.js';

async function checkAdminUsers() {
  try {
    const users = await sql`SELECT id, email, role FROM users WHERE role = 'admin'`;
    console.log('Admin users:', users);
    
    // Check if admin@hotel.com exists
    const adminHotel = await sql`SELECT id, email, role FROM users WHERE email = 'admin@hotel.com'`;
    
    if (adminHotel.length === 0) {
      console.log('Creating admin@hotel.com user...');
      
      // Import auth utils
      const { hashPassword } = await import('./src/utils/auth.js');
      
      // Create admin user
      const hashedPassword = await hashPassword('admin123');
      const adminUser = await sql`
        INSERT INTO users (email, password, first_name, last_name, role)
        VALUES ('admin@hotel.com', ${hashedPassword}, 'Admin', 'User', 'admin')
        RETURNING id, email, role
      `;
      
      console.log('Created admin user:', adminUser[0]);
    } else {
      console.log('admin@hotel.com already exists:', adminHotel[0]);
    }
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

checkAdminUsers();
