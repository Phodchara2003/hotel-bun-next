const mysql = require('mysql2/promise');

async function createTestNotifications() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '12345678',
    database: 'hotel_booking'
  });

  try {
    console.log('🔔 Creating test notifications...\n');

    const notifications = [
      {
        title: 'การจองใหม่ - ห้อง Deluxe',
        message: 'มีการจองห้อง Deluxe สำหรับวันที่ 25 กันยายน 2025 โดยคุณสมชาย ใจดี',
        type: 'info',
        priority: 'high',
        related_type: 'booking'
      },
      {
        title: 'การชำระเงินสำเร็จ',
        message: 'ได้รับการชำระเงินจำนวน 2,500 บาท สำหรับการจอง #BK001',
        type: 'success',
        priority: 'medium',
        related_type: 'payment'
      },
      {
        title: 'ใกล้ถึงเวลาเช็คอิน',
        message: 'ลูกค้า คุณสมหญิง มีนัด มีกำหนดเช็คอินในวันนี้ เวลา 14:00 น.',
        type: 'warning',
        priority: 'high',
        related_type: 'checkin'
      },
      {
        title: 'ห้องพักต้องการการทำความสะอาด',
        message: 'ห้อง 205 ต้องการการทำความสะอาดหลังลูกค้าเช็คเอาต์',
        type: 'info',
        priority: 'medium',
        related_type: 'maintenance'
      },
      {
        title: 'การยกเลิกการจอง',
        message: 'ลูกค้าขอยกเลิกการจองสำหรับวันที่ 30 กันยายน 2025',
        type: 'warning',
        priority: 'medium',
        related_type: 'cancellation'
      }
    ];

    for (const notif of notifications) {
      const [result] = await connection.execute(`
        INSERT INTO notifications (title, message, type, priority, related_type, created_at) 
        VALUES (?, ?, ?, ?, ?, NOW())
      `, [notif.title, notif.message, notif.type, notif.priority, notif.related_type]);
      
      console.log(`✅ Created: ${notif.title} (ID: ${result.insertId})`);
    }

    console.log(`\n🎉 Created ${notifications.length} test notifications successfully!`);
    console.log('\n📱 คุณสามารถดูการแจ้งเตือนได้ที่หน้าโปรไฟล์แล้ว!');

  } catch (error) {
    console.error('❌ Error creating test notifications:', error);
  } finally {
    await connection.end();
  }
}

createTestNotifications();