# 📧 ระบบแจ้งเตือนการจองผ่านอีเมล - คู่มือการใช้งาน

## 🎯 **ฟีเจอร์ที่พร้อมใช้งาน**

### ✅ **1. แจ้งเตือนการจองสำเร็จ**
- ส่งอีเมลทันทีเมื่อผู้ใช้จองห้องพักสำเร็จ
- แสดงรายละเอียดการจองครบถ้วน
- รวมรหัสการจอง, วันที่, ราคา, และข้อมูลโรงแรม

### ✅ **2. แจ้งเตือนการยกเลิกการจอง**
- ส่งอีเมลเมื่อผู้ดูแลระบบยกเลิกการจอง
- แจ้งรายละเอียดการคืนเงิน
- ลิงก์สำหรับค้นหาที่พักใหม่

### ✅ **3. แจ้งเตือนการอัปเดตการจอง**
- ส่งอีเมลเมื่อมีการเปลี่ยนแปลงข้อมูลการจอง
- ระบุรายละเอียดการเปลี่ยนแปลง
- ลิงก์ดูรายละเอียดการจองใหม่

## 🛠️ **การติดตั้งและการตั้งค่า**

### 1. **Environment Variables**
ตั้งค่าในไฟล์ `.env` ใน backend:
```bash
# Gmail SMTP Configuration (ฟรี)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password

# Frontend URL สำหรับลิงก์ในอีเมล
FRONTEND_URL=http://localhost:3000
```

### 2. **การสร้าง Gmail App Password**
1. ไปที่ Google Account Settings
2. Security > 2-Step Verification (ต้องเปิดก่อน)
3. App passwords > Select app: Mail
4. คัดลอก 16-digit password มาใส่ใน GMAIL_APP_PASSWORD

### 3. **การทดสอบระบบ**
```bash
cd backend
node test-booking-email.js
```

## 📋 **รายละเอียดการทำงาน**

### **เมื่อมีการจองใหม่:**
```javascript
// ในไฟล์ bookings.js - POST /bookings
sendBookingConfirmationEmail(user.email, emailData, userName)
  .then(() => console.log('✅ Email sent'))
  .catch((error) => console.error('❌ Email failed'));
```

### **เมื่อมีการยกเลิกการจอง:**
```javascript
// ในไฟล์ bookings.js - DELETE /bookings/:id
sendBookingCancellationEmail(bookingDetail.user_email, emailData, userName)
  .then(() => console.log('✅ Cancellation email sent'))
  .catch((error) => console.error('❌ Email failed'));
```

## 🎨 **รูปแบบอีเมล**

### **อีเมลยืนยันการจอง**
- 🎉 หัวข้อ: "ยืนยันการจองสำเร็จ - [ชื่อโรงแรม]"
- 📋 รหัสการจอง พร้อม badge สถานะ
- 🏨 รายละเอียดโรงแรมและห้องพัก
- 📅 วันที่เข้าพัก-ออก, จำนวนผู้เข้าพัก
- 💰 ราคารวม
- 📝 ความต้องการพิเศษ (ถ้ามี)
- 🔗 ปุ่มดูรายละเอียดการจอง

### **อีเมลการยกเลิก**
- ❌ หัวข้อ: "การจองถูกยกเลิก - [ชื่อโรงแรม]"
- 📋 รายละเอียดการจองที่ยกเลิก
- 💰 ข้อมูลการคืนเงิน
- 🔗 ปุ่มค้นหาที่พักใหม่

### **อีเมลการอัปเดต**
- 🔄 หัวข้อ: "การจองได้รับการอัปเดต - [ชื่อโรงแรม]"
- 📝 รายละเอียดการเปลี่ยนแปลง
- 🔗 ปุ่มดูรายละเอียดการจอง

## ⚙️ **การตั้งค่าการแจ้งเตือนสำหรับผู้ใช้**

ผู้ใช้สามารถตั้งค่าการแจ้งเตือนในหน้า Profile:

### **ตัวเลือกการแจ้งเตือน:**
- ✅ **อีเมลแจ้งเตือน** - เปิด/ปิดการส่งอีเมลทั้งหมด
- ✅ **การอัพเดทการจอง** - แจ้งเตือนเมื่อมีการเปลี่ยนแปลงการจอง
- ✅ **โปรโมชั่น** - แจ้งเตือนข้อเสนอพิเศษ (ในอนาคต)

## 🔧 **การปรับแต่งเพิ่มเติม**

### **เพิ่มอีเมลแจ้งเตือนใหม่:**
1. เพิ่มฟังก์ชันใน `emailService.js`
2. Import และเรียกใช้ในจุดที่ต้องการ
3. เพิ่มการตั้งค่าใน Profile (ถ้าต้องการ)

### **ปรับแต่งรูปแบบอีเมล:**
- แก้ไข HTML template ใน `emailService.js`
- เปลี่ยนสี, ฟอนต์, หรือ layout
- เพิ่มรูปภาพ หรือ logo

## 📊 **การติดตามและ Debug**

### **Log Messages:**
```bash
✅ Booking confirmation email sent successfully to: user@example.com
❌ Failed to send booking confirmation email: [error details]
```

### **การตรวจสอบ:**
1. ตรวจสอบ Environment Variables
2. ตรวจสอบ Gmail App Password
3. ดู Console logs สำหรับข้อผิดพลาด
4. ทดสอบด้วยไฟล์ `test-booking-email.js`

## 🚀 **การพัฒนาต่อในอนาคต**

### **ฟีเจอร์ที่สามารถเพิ่มได้:**
- 📅 แจ้งเตือนก่อนวันเข้าพัก (Reminder emails)
- 📋 Survey หลังเข้าพัก
- 🎁 อีเมลโปรโมชั่นและข้อเสนอพิเศษ
- 📱 SMS notifications (ใช้ Twilio)
- 🔔 Web push notifications

### **การปรับปรุงความปลอดภัย:**
- Rate limiting สำหรับการส่งอีเมล
- Email verification สำหรับอีเมลใหม่
- Encryption สำหรับข้อมูลส่วนตัว

## ✨ **สรุป**

ระบบแจ้งเตือนการจองผ่านอีเมลพร้อมใช้งานแล้ว! ผู้ใช้จะได้รับอีเมลแจ้งเตือนทุกครั้งที่มีการเปลี่ยนแปลงการจอง ระบบทำงานแบบ background ไม่บล็อคการทำงานหลัก และมีการจัดการ error ที่ดี

🎉 **Happy Booking!** 🏨✨
