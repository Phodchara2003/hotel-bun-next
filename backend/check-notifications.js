// Check notifications directly in database
import { sql } from './src/db/database.js';

async function checkNotifications() {
  try {
    console.log('🔍 Checking notifications in database...\n');
    
    // First check users table structure
    const userColumns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `;
    
    console.log('👤 Users table structure:');
    console.table(userColumns);
    
    // Get all notifications without joining users first
    const notifications = await sql`
      SELECT 
        n.id,
        n.user_id,
        n.booking_id,
        n.type,
        n.title,
        n.message,
        n.is_read,
        n.created_at
      FROM notifications n
      ORDER BY n.created_at DESC
    `;
    
    console.log(`📊 Total notifications in database: ${notifications.length}\n`);
    
    if (notifications.length > 0) {
      console.log('📋 Notifications:');
      notifications.forEach((notif, index) => {
        console.log(`${index + 1}. ID: ${notif.id} | User ID: ${notif.user_id} | Type: ${notif.type}`);
        console.log(`   Title: ${notif.title}`);
        console.log(`   Read: ${notif.is_read ? 'Yes' : 'No'} | Created: ${notif.created_at}`);
        console.log('');
      });
    }
    
    // Check users separately
    const users = await sql`SELECT * FROM users LIMIT 3`;
    console.log('👥 Available users:');
    console.table(users);
    
  } catch (error) {
    console.error('❌ Error checking notifications:', error);
  } finally {
    process.exit(0);
  }
}

checkNotifications();
