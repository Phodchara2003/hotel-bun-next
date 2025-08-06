import { sql } from './src/db/database.js';

const updateNotificationsTable = async () => {
  try {
    console.log('🔄 Updating notifications table structure...');
    
    // ตรวจสอบว่าตารางมีอยู่แล้วหรือไม่
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'notifications'
      )
    `;

    if (!tableExists[0].exists) {
      console.log('📦 Creating new notifications table...');
      
      await sql`
        CREATE TABLE notifications (
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
    } else {
      console.log('🔧 Table exists, checking for missing columns...');
      
      // ตรวจสอบและเพิ่มคอลัมน์ที่ขาดหายไป
      const columns = await sql`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'notifications'
      `;
      
      const columnNames = columns.map(col => col.column_name);
      
      if (!columnNames.includes('data')) {
        console.log('➕ Adding data column...');
        await sql`ALTER TABLE notifications ADD COLUMN data JSONB DEFAULT '{}'`;
      }
      
      if (!columnNames.includes('priority')) {
        console.log('➕ Adding priority column...');
        await sql`ALTER TABLE notifications ADD COLUMN priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high'))`;
      }
      
      if (!columnNames.includes('read_at')) {
        console.log('➕ Adding read_at column...');
        await sql`ALTER TABLE notifications ADD COLUMN read_at TIMESTAMP WITH TIME ZONE NULL`;
      }
    }

    // สร้าง indexes
    console.log('📊 Creating indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_notifications_booking_id ON notifications(booking_id)',
      'CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read)',
      'CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at)',
      'CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type)',
      'CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority)',
      'CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC)'
    ];

    for (const indexQuery of indexes) {
      await sql.unsafe(indexQuery);
    }

    console.log('✅ Notifications table updated successfully!');
    
    // เพิ่มข้อมูลตัวอย่าง
    await createSampleNotifications();
    
    // แสดงโครงสร้างตาราง
    const tableInfo = await sql`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'notifications'
      ORDER BY ordinal_position
    `;
    
    console.log('\n📋 Updated notifications table structure:');
    console.table(tableInfo);
    
    return true;
  } catch (error) {
    console.error('❌ Error updating notifications table:', error);
    return false;
  }
};

const createSampleNotifications = async () => {
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
};

// รันการอัปเดต
updateNotificationsTable()
  .then(() => {
    console.log('\n🎉 Notifications table setup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed to setup notifications table:', error);
    process.exit(1);
  });
