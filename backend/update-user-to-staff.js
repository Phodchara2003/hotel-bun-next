import { sql } from './src/db/database.js';

async function updateUserToStaff() {
  try {
    console.log('=== Update User to Staff ===');
    
    // List all current users
    const users = await sql`SELECT id, email, role FROM users WHERE role = 'user' ORDER BY email`;
    console.log('\nCurrent users with "user" role:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}, Email: ${user.email}, Role: ${user.role}`);
    });
    
    if (users.length === 0) {
      console.log('No users with "user" role found.');
      process.exit(0);
    }
    
    // Example: Update specific user to staff
    // Uncomment and modify the email below to update a specific user
    /*
    const emailToUpdate = 'demo@example.com'; // Change this to the email you want to update
    
    const result = await sql`
      UPDATE users 
      SET role = 'staff', updated_at = NOW()
      WHERE email = ${emailToUpdate}
      RETURNING id, email, role
    `;
    
    if (result.length > 0) {
      console.log(`\n✅ Successfully updated ${emailToUpdate} to staff role:`, result[0]);
    } else {
      console.log(`\n❌ User with email ${emailToUpdate} not found.`);
    }
    */
    
    console.log('\n=== Instructions ===');
    console.log('To update a user to staff role:');
    console.log('1. Uncomment the code above');
    console.log('2. Change emailToUpdate to the desired email');
    console.log('3. Run: bun update-user-to-staff.js');
    console.log('\nOr run SQL directly:');
    console.log("UPDATE users SET role = 'staff' WHERE email = 'user@example.com';");
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

updateUserToStaff();
