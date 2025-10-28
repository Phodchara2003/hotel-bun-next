# 📧 การตั้งค่าอีเมลระบบ Hotel Booking System

## ✨ ฟีเจอร์ใหม่: การตั้งค่าอีเมลในหน้า Admin Settings

### 🎯 วัตถุประสงค์
ให้แอดมินสามารถแก้ไขการตั้งค่าอีเมลสำหรับส่งการแจ้งเตือนได้ผ่านหน้าเว็บ โดยไม่ต้องแก้ไขไฟล์ `.env` โดยตรง

---

## 🚀 วิธีการใช้งาน

### 1. เข้าสู่หน้า Admin Settings
- URL: `http://localhost:3680/admin/settings`
- ต้องล็อกอินด้วยบัญชี Admin เท่านั้น
- อีเมล: `admin@hotel.com`
- รหัสผ่าน: `admin123`

### 2. ส่วนการตั้งค่าอีเมล
ในหน้า Admin Settings จะมีส่วน **"การตั้งค่าอีเมล"** ที่มีฟิลด์ต่อไปนี้:

#### 📨 อีเมลของระบบ (Gmail)
- **ชื่อฟิลด์**: `gmail_user`
- **รูปแบบ**: `example@gmail.com`
- **คำอธิบาย**: อีเมล Gmail ที่จะใช้ส่งการแจ้งเตือน

#### 🔐 รหัสผ่านแอป Gmail (App Password)
- **ชื่อฟิลด์**: `gmail_app_password`
- **รูปแบบ**: `xxxx xxxx xxxx xxxx` (16 ตัวอักษร)
- **คำอธิบาย**: App Password จาก Google Account Settings
- **ความปลอดภัย**: จะแสดงเป็น `****` เมื่อโหลดข้อมูล

#### 👤 ชื่อผู้ส่ง
- **ชื่อฟิลด์**: `from_name`
- **ตัวอย่าง**: `Hotel System`, `rmu Hotel System`
- **คำอธิบาย**: ชื่อที่จะแสดงเป็นผู้ส่งอีเมล

#### 👨‍💼 อีเมลผู้ดูแลระบบ
- **ชื่อฟิลด์**: `admin_emails`
- **รูปแบบ**: `admin1@hotel.com, admin2@hotel.com`
- **คำอธิบาย**: อีเมลแอดมินที่จะได้รับการแจ้งเตือน (คั่นด้วยจุลภาค)

---

## 🔧 วิธีการสร้าง Gmail App Password

### ขั้นตอนการตั้งค่า:
1. **ไปที่ Google Account Settings**
   - เปิด: https://myaccount.google.com

2. **เปิด 2-Step Verification**
   - เลือก `Security` → `2-Step Verification`
   - ทำการเปิดใช้งาน 2-Step Verification ให้เรียบร้อย

3. **สร้าง App Password**
   - เลือก `Security` → `App passwords`
   - Select app: `Mail`
   - Select device: `Other (Custom name)`
   - ตั้งชื่อ: `Hotel Booking System`

4. **คัดลอกรหัส**
   - Google จะให้รหัส 16 ตัวอักษร
   - รูปแบบ: `xxxx xxxx xxxx xxxx`
   - คัดลอกรหัสนี้มาใส่ในฟิลด์ App Password

---

## 💾 การบันทึกการตั้งค่า

### การทำงานของระบบ:
1. **แก้ไขข้อมูล** ในฟิลด์ต่างๆ ตามต้องการ
2. **คลิกปุ่ม** "บันทึกการตั้งค่าอีเมล"
3. **ระบบจะทำการ**:
   - ตรวจสอบรูปแบบอีเมล
   - อัปเดตไฟล์ `.env` ใน backend
   - อัปเดต environment variables
   - แสดงข้อความแจ้งผลสำเร็จ

### ไฟล์ที่ได้รับการอัปเดต:
- `backend/.env` - การตั้งค่าหลัก
- Environment Variables ที่เกี่ยวข้อง:
  - `GMAIL_USER`
  - `GMAIL_APP_PASSWORD`
  - `FROM_NAME`
  - `ADMIN_EMAILS`

---

## 🔒 ความปลอดภัย

### มาตรการรักษาความปลอดภัย:
1. **ซ่อนรหัสผ่าน**: App Password จะแสดงเป็น `****` เมื่อโหลด
2. **การตรวจสอบ**: ตรวจสอบรูปแบบอีเมลก่อนบันทึก
3. **สิทธิ์การเข้าถึง**: เฉพาะ Admin เท่านั้นที่เข้าถึงได้
4. **การเข้ารหัส**: ข้อมูลจะถูกเก็บใน environment variables

---

## 🧪 การทดสอบ

### API Endpoints:
- **GET** `/api/admin/email-settings` - โหลดการตั้งค่า
- **POST** `/api/admin/email-settings` - บันทึกการตั้งค่า

### ตัวอย่างการทดสอบ:
```powershell
# ดึงการตั้งค่าปัจจุบัน
Invoke-RestMethod -Uri "http://localhost:5680/api/admin/email-settings" -Method GET

# บันทึกการตั้งค่าใหม่
Invoke-RestMethod -Uri "http://localhost:5680/api/admin/email-settings" -Method POST -ContentType "application/json" -Body '{"settings":{"gmail_user":"newuser@gmail.com","from_name":"New Hotel System"}}'
```

---

## ✅ สถานะการพัฒนา

### เสร็จสมบูรณ์:
- ✅ UI สำหรับการตั้งค่าอีเมล
- ✅ API endpoints (GET/POST)
- ✅ การอัปเดตไฟล์ .env
- ✅ การตรวจสอบความปลอดภัย
- ✅ คำแนะนำการใช้งาน
- ✅ การทดสอบระบบ

### พร้อมใช้งาน: 🎉
**ระบบการตั้งค่าอีเมลพร้อมใช้งานแล้ว!**

---

## 📞 การสนับสนุน

หากมีปัญหาหรือข้อสงสัย สามารถตรวจสอบ:
1. **Console Logs** ใน browser และ backend
2. **ไฟล์ .env** ว่าได้รับการอัปเดตหรือไม่
3. **สิทธิ์การเข้าถึง** ว่าล็อกอินด้วย Admin หรือไม่

**Happy Email Configuration! 📧✨**