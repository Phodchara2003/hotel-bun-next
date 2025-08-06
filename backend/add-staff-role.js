import { sql } from './src/db/database.js';
import { hashPassword } from './src/utils/auth.js';

async function addStaffRole() {
  try {
    console.log('Adding staff role support...');
    
    // Check current users and their roles
    const users = await sql`SELECT id, email, role FROM users`;
    console.log('Current users:', users);
    
    // Create a staff user if not exists
    const staffEmail = 'staff@royalgarden.com';
    const existingStaff = await sql`SELECT id, email, role FROM users WHERE email = ${staffEmail}`;
    
    if (existingStaff.length === 0) {
      console.log('Creating staff user...');
      
      // Create staff user
      const hashedPassword = await hashPassword('staff123');
      const staffUser = await sql`
        INSERT INTO users (email, password, first_name, last_name, role)
        VALUES (${staffEmail}, ${hashedPassword}, 'Staff', 'Employee', 'staff')
        RETURNING id, email, role
      `;
      
      console.log('Created staff user:', staffUser[0]);
    } else {
      console.log('Staff user already exists:', existingStaff[0]);
      
      // Update role to staff if it's not already
      if (existingStaff[0].role !== 'staff') {
        await sql`UPDATE users SET role = 'staff' WHERE email = ${staffEmail}`;
        console.log('Updated role to staff');
      }
    }
    
    // Show example of how to update existing users to staff
    console.log('\n=== How to make existing users staff ===');
    console.log('To make a user staff, update their role:');
    console.log("UPDATE users SET role = 'staff' WHERE email = 'user@example.com';");
    
    // List all users with their roles
    const allUsers = await sql`SELECT id, email, role FROM users ORDER BY role, email`;
    console.log('\n=== All users ===');
    allUsers.forEach(user => {
      console.log(`ID: ${user.id}, Email: ${user.email}, Role: ${user.role}`);
    });
    
    console.log('\nStaff role support added successfully!');
    console.log('Available roles: user, staff, admin, super_admin');
    console.log('\nStaff Login Credentials:');
    console.log('Email: staff@royalgarden.com');
    console.log('Password: staff123');
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

addStaffRole();
