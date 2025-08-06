import { sql } from './src/db/database.js';
import { hashPassword } from './src/utils/auth.js';

async function createRoyalGardenAdmin() {
  try {
    console.log('Checking for admin@royalgarden.com...');
    
    // Check if admin@royalgarden.com exists
    const existing = await sql`SELECT id, email, role FROM users WHERE email = 'admin@royalgarden.com'`;
    
    if (existing.length > 0) {
      console.log('admin@royalgarden.com already exists:', existing[0]);
      
      // Update role to admin if it's not already
      if (existing[0].role !== 'admin') {
        await sql`UPDATE users SET role = 'admin' WHERE email = 'admin@royalgarden.com'`;
        console.log('Updated role to admin');
      }
    } else {
      console.log('Creating admin@royalgarden.com user...');
      
      // Create admin user
      const hashedPassword = await hashPassword('admin123');
      const adminUser = await sql`
        INSERT INTO users (email, password, first_name, last_name, role)
        VALUES ('admin@royalgarden.com', ${hashedPassword}, 'Royal Garden', 'Admin', 'admin')
        RETURNING id, email, role
      `;
      
      console.log('Created admin user:', adminUser[0]);
    }
    
    // Also check all admin users
    const allAdmins = await sql`SELECT id, email, role FROM users WHERE role IN ('admin', 'super_admin')`;
    console.log('All admin users:', allAdmins);
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

createRoyalGardenAdmin();
