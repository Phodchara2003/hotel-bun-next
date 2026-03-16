import { sql } from './database.js';

async function checkUsers() {
  try {
    console.log('Checking users...');
    const users = await sql`SELECT id, email, first_name, last_name, role FROM users`;
    console.log('Users found:', users.length);
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Email: ${user.email}, Role: ${user.role}, Name: ${user.first_name} ${user.last_name}`);
    });
    
    // Check if password hashing is working
    const userWithPassword = await sql`SELECT id, email, password FROM users LIMIT 1`;
    console.log('Sample user password (hashed):', userWithPassword[0]?.password?.substring(0, 20) + '...');
    
  } catch (error) {
    console.error('Error checking users:', error);
  }
}

checkUsers();
