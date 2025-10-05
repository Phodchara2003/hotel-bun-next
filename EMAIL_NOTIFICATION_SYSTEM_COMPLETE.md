# 📧 ระบบการแจ้งเตือนอีเมล - Hotel Booking System

## 📋 Overview
ระบบการแจ้งเตือนอีเมลอัตโนมัติสำหรับระบบจองโรงแรม รองรับการส่งอีเมลยืนยันการจอง, แจ้งเตือนแอดมิน, และแจ้งเตือนก่อนเข้าพัก

## 🚀 Features
- ✅ อีเมลยืนยันการจองอัตโนมัติเมื่อลูกค้าทำการจอง
- ✅ อีเมลแจ้งเตือนแอดมินเมื่อมีการจองใหม่
- ✅ อีเมลแจ้งเตือนก่อนเข้าพัก (1 วันก่อน)
- ✅ สรุปข้อมูลประจำวันให้แอดมิน
- ✅ เทมเพลตอีเมล HTML ที่สวยงามและ responsive
- ✅ รองรับภาษาไทย
- ✅ Cron jobs สำหรับการแจ้งเตือนอัตโนมัติ

## 📁 File Structure
```
backend/
├── emailNotificationSystem.js     # ระบบหลักการแจ้งเตือนอีเมล
└── mysql-server.cjs               # เซิร์ฟเวอร์หลัก (เพิ่มการเรียกใช้ระบบอีเมล)

test-email-system.js               # ไฟล์ทดสอบระบบอีเมล
.env.example                       # ตัวอย่างการตั้งค่า environment variables
```

## ⚙️ Installation & Setup

### 1. ติดตั้ง Dependencies
```bash
npm install nodemailer node-cron
```

### 2. ตั้งค่า Environment Variables
สร้างไฟล์ `.env` หรือแก้ไขไฟล์ที่มีอยู่:

```env
# Gmail SMTP Configuration
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-specific-password

# Admin Email Addresses
ADMIN_EMAIL_1=admin@hotel.com
ADMIN_EMAIL_2=manager@hotel.com

# Test Email (for testing purposes)
TEST_EMAIL=test@example.com
```

### 3. สร้าง Gmail App Password
1. ไปที่ [Google Account Settings](https://myaccount.google.com/)
2. Security > 2-Step Verification (เปิดใช้งานถ้ายังไม่ได้เปิด)
3. App passwords > Generate password
4. เลือก "Mail" และ "Other" แล้วใส่ชื่อ "Hotel Booking System"
5. คัดลอกรหัสผ่านที่ได้มาใส่ใน `GMAIL_APP_PASSWORD`

## 🔧 Configuration

### Email Templates
ระบบมีเทมเพลตอีเมล 3 แบบหลัก:

1. **Booking Confirmation Email** - อีเมลยืนยันการจอง
2. **Admin Notification Email** - อีเมลแจ้งเตือนแอดมิน
3. **Check-in Reminder Email** - อีเมลแจ้งเตือนก่อนเข้าพัก

### Cron Jobs Schedule
- **Check-in Reminders**: ทุกวันเวลา 09:00 (เขตเวลากรุงเทพ)
- **Daily Summary**: ทุกวันเวลา 18:00 (เขตเวลากรุงเทพ)

## 🧪 Testing

### การทดสอบระบบอีเมล
```bash
node test-email-system.js
```

### การทดสอบด้วยตนเอง
```javascript
const { sendBookingConfirmationEmail } = require('./backend/emailNotificationSystem');

const testBooking = {
  bookingReference: 'TEST-001',
  hotelName: 'โรงแรมวรุณภัฏ',
  roomTypeName: 'ห้องเดี่ยว',
  checkInDate: new Date(),
  checkOutDate: new Date(Date.now() + 24*60*60*1000),
  guests: 2,
  totalPrice: 1500
};

sendBookingConfirmationEmail('test@example.com', testBooking, 'ลูกค้า ทดสอบ');
```

## 🔄 Integration

### การเรียกใช้ในระบบหลัก
ระบบได้รวมเข้ากับ `mysql-server.cjs` แล้ว และจะทำงานอัตโนมัติเมื่อ:

1. **มีการจองใหม่**: ส่งอีเมลยืนยันให้ลูกค้า + แจ้งเตือนแอดมิน
2. **ก่อนเข้าพัก 1 วัน**: ส่งอีเมลแจ้งเตือนให้ลูกค้า
3. **ทุกวันเวลา 18:00**: ส่งสรุปข้อมูลให้แอดมิน

### การเรียกใช้แบบ Manual
```javascript
// ส่งอีเมลยืนยันการจอง
await sendBookingConfirmationEmail(customerEmail, bookingData, customerName);

// ส่งอีเมลแจ้งเตือนแอดมิน
await sendAdminNotificationEmail(bookingData);

// ส่งอีเมลแจ้งเตือนก่อนเข้าพัก
await sendCheckInReminderEmail(customerEmail, bookingData, customerName);
```

## 📊 Monitoring & Logs

### การติดตาม
ระบบจะแสดง log ดังนี้:
- ✅ สีเขียว = สำเร็จ
- ❌ สีแดง = ผิดพลาด  
- ⚠️ สีเหลือง = คำเตือน
- 🔔 สำหรับการแจ้งเตือน
- 📧 สำหรับการส่งอีเมล

### ตัวอย่าง Log
```
✅ Email notification system initialized successfully
📧 Booking confirmation email sent to customer@email.com: <messageId>
🔔 Running check-in reminder job...
📋 Found 3 bookings for tomorrow check-in reminders
✅ Check-in reminder job completed
```

## 🛠️ Troubleshooting

### ปัญหาที่พบบ่อย

#### 1. Gmail Authentication Error
```
Error: Invalid login: 535-5.7.8 Username and Password not accepted
```
**วิธีแก้**: ตรวจสอบ App Password และเปิดใช้งาน 2-Step Verification

#### 2. Environment Variables ไม่ถูกต้อง
```
Error: Missing required environment variables
```
**วิธีแก้**: ตรวจสอบไฟล์ `.env` และค่าตัวแปร

#### 3. Network/Firewall Issues
```
Error: connect ECONNREFUSED
```
**วิธีแก้**: ตรวจสอบการเชื่อมต่ออินเทอร์เน็ตและ firewall

### การ Debug
1. เปิดใช้งาน verbose logging
2. ตรวจสอบการตั้งค่า SMTP
3. ทดสอบด้วย test-email-system.js
4. ตรวจสอบ spam folder ในอีเมล

## 🔐 Security Best Practices

1. **App Passwords**: ใช้ App Password แทนรหัสผ่านหลัก
2. **Environment Variables**: เก็บข้อมูลสำคัญใน .env
3. **Rate Limiting**: จำกัดจำนวนอีเมลที่ส่งต่อชั่วโมง
4. **Email Validation**: ตรวจสอบรูปแบบอีเมลก่อนส่ง
5. **Error Handling**: จัดการข้อผิดพลาดอย่างเหมาะสม

## 📈 Performance Optimization

1. **Connection Pooling**: ใช้ connection pool สำหรับ SMTP
2. **Batch Processing**: รวมการส่งอีเมลแอดมินหลายคนในครั้งเดียว
3. **Retry Logic**: ลองส่งใหม่หากล้มเหลว
4. **Caching**: cache template เพื่อลดการ render

## 🚀 Future Enhancements

- [ ] Email template builder
- [ ] SMS notifications  
- [ ] Push notifications
- [ ] Email analytics และ tracking
- [ ] Multi-language support
- [ ] Custom cron schedule configuration
- [ ] Email queue management
- [ ] Webhook integration

## 📝 API Reference

### sendBookingConfirmationEmail(email, bookingData, userName)
ส่งอีเมลยืนยันการจองให้ลูกค้า

**Parameters:**
- `email` (string): อีเมลลูกค้า
- `bookingData` (object): ข้อมูลการจอง
- `userName` (string): ชื่อลูกค้า

**Returns:** Promise<{success: boolean, messageId?: string, error?: string}>

### sendAdminNotificationEmail(bookingData)
ส่งอีเมลแจ้งเตือนการจองใหม่ให้แอดมิน

**Parameters:**
- `bookingData` (object): ข้อมูลการจอง

**Returns:** Promise<{success: boolean, results: Array}>

### sendCheckInReminderEmail(email, bookingData, userName)
ส่งอีเมลแจ้งเตือนก่อนเข้าพักให้ลูกค้า

**Parameters:**
- `email` (string): อีเมลลูกค้า  
- `bookingData` (object): ข้อมูลการจอง
- `userName` (string): ชื่อลูกค้า

**Returns:** Promise<{success: boolean, messageId?: string, error?: string}>

### initializeEmailNotificationSystem(dbConnection)
เริ่มต้นระบบ cron jobs สำหรับการแจ้งเตือนอัตโนมัติ

**Parameters:**
- `dbConnection` (mysql.Connection): การเชื่อมต่อฐานข้อมูล

**Returns:** void

## 📞 Support

หากมีปัญหาหรือข้อสงสัย กรุณาติดต่อ:
- **Developer**: นาย พชร มีหา
- **Institution**: มหาวิทยาลัยราชภัฏมหาสารคาม
- **Email**: [your-email@example.com]

---

© 2025 ระบบจองโรงแรมวรุณภัฏมหาวิทยาลัยราชภัฏมหาสารคาม - สงวนลิขสิทธิ์ทุกประการ