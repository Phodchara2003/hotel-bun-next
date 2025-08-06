import { sql } from './src/db/database.js';

async function updateSpecificUserToStaff() {
  try {
    console.log('=== Update Specific User to Staff ===');
    
    // Change this email to the user you want to make staff
    const emailToUpdate = 'demo@example.com'; // เปลี่ยนเป็นอีเมลที่ต้องการ
    
    // Check if user exists
    const user = await sql`SELECT id, email, role FROM users WHERE email = ${emailToUpdate}`;
    
    if (user.length === 0) {
      console.log(`❌ User with email ${emailToUpdate} not found.`);
      process.exit(0);
    }
    
    console.log('Current user data:', user[0]);
    
    if (user[0].role === 'staff') {
      console.log(`✅ User ${emailToUpdate} is already staff.`);
      process.exit(0);
    }
    
    // Update to staff role
    const result = await sql`
      UPDATE users 
      SET role = 'staff', updated_at = NOW()
      WHERE email = ${emailToUpdate}
      RETURNING id, email, role
    `;
    
    console.log(`✅ Successfully updated ${emailToUpdate} to staff role:`, result[0]);
    
    // Show all staff users
    const allStaff = await sql`SELECT id, email, role FROM users WHERE role = 'staff' ORDER BY email`;
    console.log('\n=== All Staff Users ===');
    allStaff.forEach(staff => {
      console.log(`ID: ${staff.id}, Email: ${staff.email}, Role: ${staff.role}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

updateSpecificUserToStaff();
