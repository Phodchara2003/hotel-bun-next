// Test script for Real-time Notification System with Email Integration
import { sql } from './src/db/database.js';
import { createNotification, NotificationTemplates } from './src/routes/notifications.js';
import { createNotificationsTable } from './src/db/create-notifications-table.js';
import { notificationService } from './src/utils/notificationService.js';

async function createTestNotifications() {
  try {
    console.log('🧪 Creating test notifications...');

    // Get a user ID (assume user with ID 1 exists)
    const users = await sql`SELECT id FROM users LIMIT 1`;
    if (!users.length) {
      console.log('❌ No users found in database');
      return;
    }

    const userId = users[0].id;
    console.log('👤 Using user ID:', userId);

    // Get a booking ID (if exists)
    const bookings = await sql`
      SELECT b.id, b.booking_reference, h.name as hotel_name, b.check_in_date
      FROM bookings b
      LEFT JOIN room_types rt ON b.room_type_id = rt.id
      LEFT JOIN hotels h ON rt.hotel_id = h.id
      WHERE b.user_id = ${userId}
      LIMIT 1
    `;

    let bookingId = null;
    let bookingRef = 'TEST-001';
    let hotelName = 'Royal Garden Hotel';
    let checkInDate = new Date();

    if (bookings.length > 0) {
      bookingId = bookings[0].id;
      bookingRef = bookings[0].booking_reference;
      hotelName = bookings[0].hotel_name;
      checkInDate = bookings[0].check_in_date;
      console.log('🏨 Using booking ID:', bookingId, 'Ref:', bookingRef);
    } else {
      console.log('📝 No bookings found, using mock data');
    }

    // Create test notifications
    const notifications = [];

    // 1. Booking Confirmed
    const confirmedTemplate = NotificationTemplates.BOOKING_CONFIRMED(bookingRef, hotelName, checkInDate);
    const confirmed = await createNotification(userId, bookingId, confirmedTemplate.type, confirmedTemplate.title, confirmedTemplate.message);
    notifications.push(confirmed);
    console.log('✅ Created booking confirmed notification');

    // 2. Booking Approved
    const approvedTemplate = NotificationTemplates.BOOKING_APPROVED(bookingRef, hotelName, checkInDate);
    const approved = await createNotification(userId, bookingId, approvedTemplate.type, approvedTemplate.title, approvedTemplate.message);
    notifications.push(approved);
    console.log('🎉 Created booking approved notification');

    // 3. Payment Reminder
    const paymentTemplate = NotificationTemplates.PAYMENT_REMINDER(bookingRef, hotelName, 3);
    const payment = await createNotification(userId, bookingId, paymentTemplate.type, paymentTemplate.title, paymentTemplate.message);
    notifications.push(payment);
    console.log('💰 Created payment reminder notification');

    // 4. Check-in Reminder
    const checkinTemplate = NotificationTemplates.CHECK_IN_REMINDER(bookingRef, hotelName, checkInDate);
    const checkin = await createNotification(userId, bookingId, checkinTemplate.type, checkinTemplate.title, checkinTemplate.message);
    notifications.push(checkin);
    console.log('🏨 Created check-in reminder notification');

    // 5. General notification (no booking)
    const general = await createNotification(
      userId, 
      null, 
      'general', 
      'ยินดีต้อนรับสู่ HotelBook', 
      'ขอบคุณที่เลือกใช้บริการของเรา เราพร้อมให้บริการคุณอย่างดีที่สุด'
    );
    notifications.push(general);
    console.log('📢 Created general notification');

    console.log(`🎯 Created ${notifications.length} test notifications successfully!`);
    console.log('📱 You can now visit http://localhost:3003/notifications to see them');

  } catch (error) {
    console.error('❌ Error creating test notifications:', error);
  } finally {
    process.exit(0);
  }
}

// Run the test
createTestNotifications();
