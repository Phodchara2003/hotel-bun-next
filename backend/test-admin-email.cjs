/**
 * Test script for Admin Email Notification System
 * Run this script to test email notifications
 */

const mysql = require('mysql2/promise');
const nodemailer = require('nodemailer');

// Email configuration using provided credentials
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'hotelsystem.rmu.ac.th@gmail.com',
    pass: 'omqi tddz vubp wakz' // รหัสผ่านที่ถูกต้องจากไฟล์ .env
  }
});

async function testEmailSystem() {
  console.log('🧪 Testing Admin Email Notification System...');
  
  try {
    // Test basic email sending
    console.log('📧 Testing basic email functionality...');
    
    const testEmailOptions = {
      from: 'hotelsystem.rmu.ac.th@gmail.com',
      to: 'hotelsystem.rmu.ac.th@gmail.com', // Send to self for testing
      subject: '🧪 Test: Admin Email System Working',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">🎉 Admin Email System Test Success!</h2>
          <p>This is a test email to verify that the admin email notification system is working correctly.</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-left: 4px solid #10b981; margin: 20px 0;">
            <strong>✅ Email system is configured and working properly!</strong>
          </div>
          <p><strong>Test Details:</strong></p>
          <ul>
            <li>Email Service: Gmail SMTP</li>
            <li>From Address: hotelsystem.rmu.ac.th@gmail.com</li>
            <li>Test Time: ${new Date().toLocaleString('th-TH')}</li>
          </ul>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px;">
            This is an automated test email from the Hotel Booking System Admin Notification Service.
          </p>
        </div>
      `
    };

    await emailTransporter.sendMail(testEmailOptions);
    console.log('✅ Test email sent successfully!');
    
    // Test booking notification template
    console.log('📧 Testing booking notification template...');
    
    const bookingTestData = {
      booking_id: 'TEST-001',
      guest_name: 'Test User',
      guest_email: 'test@example.com',
      guest_phone: '081-234-5678',
      room_type: 'Standard Room',
      check_in: new Date().toISOString().split('T')[0],
      check_out: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      total_amount: 1500.00,
      created_at: new Date().toLocaleString('th-TH')
    };

    const bookingEmailOptions = {
      from: 'hotelsystem.rmu.ac.th@gmail.com',
      to: 'hotelsystem.rmu.ac.th@gmail.com',
      subject: '🏨 Test: New Booking Notification - TEST-001',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">🏨 New Booking Alert!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Hotel Administration System</p>
          </div>
          
          <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin-bottom: 25px;">
              <h2 style="color: #1e40af; margin: 0 0 10px 0;">📋 Booking Details</h2>
              <p style="margin: 0; color: #1e40af;"><strong>This is a TEST notification</strong></p>
            </div>
            
            <div style="display: grid; gap: 15px;">
              <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
                <span style="font-weight: bold; color: #374151;">Booking ID:</span>
                <span style="color: #6b7280;">${bookingTestData.booking_id}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
                <span style="font-weight: bold; color: #374151;">Guest Name:</span>
                <span style="color: #6b7280;">${bookingTestData.guest_name}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
                <span style="font-weight: bold; color: #374151;">Room Type:</span>
                <span style="color: #6b7280;">${bookingTestData.room_type}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
                <span style="font-weight: bold; color: #374151;">Check-in:</span>
                <span style="color: #6b7280;">${bookingTestData.check_in}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
                <span style="font-weight: bold; color: #374151;">Check-out:</span>
                <span style="color: #6b7280;">${bookingTestData.check_out}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
                <span style="font-weight: bold; color: #374151;">Total Amount:</span>
                <span style="color: #059669; font-weight: bold;">฿${bookingTestData.total_amount.toLocaleString()}</span>
              </div>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; background-color: #f9fafb; border-radius: 0 0 10px 10px;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              🧪 This is a test email from Hotel Booking System<br>
              Sent at: ${new Date().toLocaleString('th-TH')}
            </p>
          </div>
        </div>
      `
    };

    await emailTransporter.sendMail(bookingEmailOptions);
    console.log('✅ Booking notification test email sent successfully!');
    
    console.log('\n🎉 All email tests completed successfully!');
    console.log('📬 Check your email inbox: hotelsystem.rmu.ac.th@gmail.com');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Basic email functionality: WORKING');
    console.log('   ✅ Booking notification template: WORKING');
    console.log('   ✅ Gmail SMTP connection: WORKING');
    
  } catch (error) {
    console.error('❌ Email test failed:', error);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('   1. Check Gmail app password is correct');
    console.log('   2. Verify 2-step verification is enabled');
    console.log('   3. Check internet connection');
    console.log('   4. Verify Gmail allows less secure apps');
  }
}

// Run the test
testEmailSystem();