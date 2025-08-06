import { sql } from './database.js';

async function createNotificationsTable() {
  try {
    console.log('📦 Creating notifications table...');
    
    // Create notifications table with enhanced schema
    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL DEFAULT 'general',
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        data JSONB DEFAULT '{}',
        priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
        is_read BOOLEAN DEFAULT false,
        read_at TIMESTAMP WITH TIME ZONE NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT valid_notification_type CHECK (type IN (
          'general', 'booking_created', 'booking_cancelled', 'booking_updated', 
          'payment_approved', 'payment_rejected', 'check_in_reminder',
          'admin_notification', 'system_message'
        ))
      )
    `;
    
    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS notifications_booking_id_idx ON notifications(booking_id)`;
    await sql`CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON notifications(is_read)`;
    await sql`CREATE INDEX IF NOT EXISTS notifications_read_at_idx ON notifications(read_at)`;
    await sql`CREATE INDEX IF NOT EXISTS notifications_type_idx ON notifications(type)`;
    await sql`CREATE INDEX IF NOT EXISTS notifications_priority_idx ON notifications(priority)`;
    await sql`CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at DESC)`;

    console.log('✅ Enhanced notifications table created successfully!');
    
    // เพิ่มการแจ้งเตือนตัวอย่าง
    await createSampleNotifications();
    
    // Check if table exists and show structure
    const tableInfo = await sql`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'notifications'
      ORDER BY ordinal_position
    `;
    
    console.log('📋 Enhanced notifications table structure:');
    console.table(tableInfo);
    
  } catch (error) {
    console.error('❌ Error creating notifications table:', error);
  }
}

async function createSampleNotifications() {
  try {
    // ตรวจสอบว่ามีข้อมูลอยู่แล้วหรือไม่
    const existingNotifications = await sql`SELECT COUNT(*) as count FROM notifications`;
    if (existingNotifications[0].count > 0) {
      console.log('📋 Sample notifications already exist');
      return;
    }

    // ดึง user ตัวอย่าง
    const users = await sql`SELECT id, role, email FROM users LIMIT 5`;
    
    if (users.length === 0) {
      console.log('⚠️ No users found, skipping sample notifications');
      return;
    }

    console.log('📝 Creating sample notifications...');
    
    for (const user of users) {
      // การแจ้งเตือนสำหรับ user ทั่วไป
      if (user.role !== 'admin') {
        // แจ้งเตือนการจองใหม่
        await sql`
          INSERT INTO notifications (user_id, type, title, message, data, priority) 
          VALUES (
            ${user.id}, 
            'booking_created', 
            '🎉 จองสำเร็จแล้ว!', 
            'การจองที่โรงแรม Royal Garden Hotel Bangkok สำเร็จแล้ว',
            '{"bookingReference":"HTL-SAMPLE-001","hotelName":"Royal Garden Hotel Bangkok","totalPrice":2500}',
            'high'
          )
        `;

        // แจ้งเตือนการชำระเงิน
        await sql`
          INSERT INTO notifications (user_id, type, title, message, data, priority, created_at) 
          VALUES (
            ${user.id}, 
            'payment_approved', 
            '✅ การชำระเงินได้รับการอนุมัติ', 
            'การชำระเงินสำหรับการจอง HTL-SAMPLE-001 อนุมัติแล้ว',
            '{"bookingReference":"HTL-SAMPLE-001","amount":2500}',
            'high',
            NOW() - INTERVAL '1 hour'
          )
        `;

        // แจ้งเตือนก่อนเข้าพัก
        await sql`
          INSERT INTO notifications (user_id, type, title, message, data, priority, created_at) 
          VALUES (
            ${user.id}, 
            'check_in_reminder', 
            '🏨 แจ้งเตือนการเข้าพัก', 
            'พรุ่งนี้คือวันเข้าพักที่โรงแรม Royal Garden Hotel Bangkok',
            '{"bookingReference":"HTL-SAMPLE-001","hotelName":"Royal Garden Hotel Bangkok","checkInDate":"2025-08-07"}',
            'medium',
            NOW() - INTERVAL '30 minutes'
          )
        `;
      }

      // การแจ้งเตือนสำหรับ admin
      if (user.role === 'admin') {
        await sql`
          INSERT INTO notifications (user_id, type, title, message, data, priority) 
          VALUES (
            ${user.id}, 
            'admin_notification', 
            '🆕 มีการจองใหม่', 
            'มีการจองใหม่จาก คุณ ทดสอบ ระบบ ที่โรงแรม Royal Garden Hotel Bangkok มูลค่า 2500 บาท',
            '{"customerName":"ทดสอบ ระบบ","hotelName":"Royal Garden Hotel Bangkok","amount":2500,"bookingId":1}',
            'high'
          )
        `;

        await sql`
          INSERT INTO notifications (user_id, type, title, message, data, priority, created_at) 
          VALUES (
            ${user.id}, 
            'admin_notification', 
            '💰 ได้รับการชำระเงิน', 
            'ได้รับการชำระเงินสำหรับการจอง HTL-SAMPLE-001 จำนวน 2500 บาท',
            '{"bookingReference":"HTL-SAMPLE-001","amount":2500}',
            'medium',
            NOW() - INTERVAL '2 hours'
          )
        `;
      }
    }
    
    console.log('✅ Sample notifications created successfully');
  } catch (error) {
    console.error('❌ Error creating sample notifications:', error);
  }
}

// ฟังก์ชันตรวจสอบโครงสร้างตาราง
async function checkNotificationsTable() {
  try {
    const result = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'notifications'
      ORDER BY ordinal_position
    `;
    
    console.log('📋 Notifications table structure:');
    result.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    return result.length > 0;
  } catch (error) {
    console.error('❌ Error checking notifications table:', error);
    return false;
  }
}

// Export functions
export { 
  createNotificationsTable, 
  createSampleNotifications,
  checkNotificationsTable
};

// ถ้าไฟล์นี้รันโดยตรง
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 Setting up notifications table...\n');
  
  createNotificationsTable()
    .then(() => {
      console.log('\n✅ Notifications table setup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Failed to setup notifications table:', error);
      process.exit(1);
    });
}
