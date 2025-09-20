const mysql = require('mysql2/promise');

async function testNotifications() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '12345678',
    database: 'hotel_booking'
  });

  try {
    console.log('🔔 Testing Notifications System...\n');

    // Test 1: Get all notifications
    console.log('1. Testing GET notifications...');
    const [allNotifications] = await connection.execute(`
      SELECT id, title, message, type, read_status, priority, created_at 
      FROM notifications 
      ORDER BY created_at DESC
    `);
    console.log(`   Found ${allNotifications.length} notifications`);
    allNotifications.forEach(n => {
      console.log(`   - [${n.type.toUpperCase()}] ${n.title} (${n.read_status ? 'READ' : 'UNREAD'})`);
    });

    // Test 2: Get unread count
    console.log('\n2. Testing unread count...');
    const [unreadResult] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM notifications 
      WHERE read_status = FALSE
    `);
    console.log(`   Unread notifications: ${unreadResult[0].count}`);

    // Test 3: Create a new notification
    console.log('\n3. Testing create notification...');
    const [insertResult] = await connection.execute(`
      INSERT INTO notifications (title, message, type, priority, created_at) 
      VALUES (?, ?, ?, ?, NOW())
    `, [
      'ทดสอบระบบแจ้งเตือน',
      'การทดสอบระบบแจ้งเตือนทำงานได้อย่างสมบูรณ์',
      'success',
      'medium'
    ]);
    console.log(`   Created notification with ID: ${insertResult.insertId}`);

    // Test 4: Mark notification as read
    console.log('\n4. Testing mark as read...');
    const [updateResult] = await connection.execute(`
      UPDATE notifications 
      SET read_status = TRUE, updated_at = NOW() 
      WHERE id = ?
    `, [insertResult.insertId]);
    console.log(`   Updated ${updateResult.affectedRows} notification(s)`);

    // Test 5: Test API endpoint (if server is running)
    console.log('\n5. Testing API endpoints...');
    try {
      const response = await fetch('http://localhost:3001/api/notifications');
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ GET /api/notifications - Success (${data.count} notifications)`);
      } else {
        console.log(`   ❌ GET /api/notifications - Failed (${response.status})`);
      }
    } catch (error) {
      console.log('   ⚠️  Server not running or not accessible');
    }

    // Test 6: Check bookings table structure
    console.log('\n6. Checking bookings table structure...');
    const [columns] = await connection.execute(`
      SHOW COLUMNS FROM bookings
    `);
    console.log('   Bookings table columns:');
    columns.forEach(col => {
      console.log(`   - ${col.Field} (${col.Type})`);
    });

    console.log('\n🎉 All notification tests completed successfully!');

  } catch (error) {
    console.error('❌ Error testing notifications:', error.message);
  } finally {
    await connection.end();
  }
}

testNotifications();