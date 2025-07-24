# 📧 คู่มือการตั้งค่า Gmail สำหรับระบบส่งอีเมลอัตโนมัติ

## 🎯 ภาพรวมการตั้งค่า

ระบบต้องการ Gmail credentials เพื่อส่งอีเมลแจ้งเตือนอัตโนมัติ:

### 📧 GMAIL_USER คืออะไร?
- **อีเมล Gmail จริง** ที่จะเป็น "ผู้ส่ง" ของระบบ
- ตัวอย่าง: `hotel.booking.system@gmail.com`
- สามารถสร้างใหม่หรือใช้ที่มีอยู่

### 🔐 GMAIL_APP_PASSWORD คืออะไร?
- **ไม่ใช่รหัสผ่านปกติ!** 
- เป็นรหัสพิเศษ 16 ตัวอักษรจาก Google
- รูปแบบ: `abcd efgh ijkl mnop`
- ต้องสร้างผ่าน Google Account Settings

## 📋 ขั้นตอนการตั้งค่าละเอียด

### ขั้นตอนที่ 1: เตรียมอีเมล Gmail

**แนะนำ: สร้างอีเมลใหม่สำหรับระบบ**
```
ตัวอย่างชื่อที่ดี:
- hotel.booking.system@gmail.com
- noreply.hotelapp@gmail.com  
- booking.notifications@gmail.com
```

### ขั้นตอนที่ 2: เปิด 2-Step Verification

1. **เข้าไปที่:** https://myaccount.google.com
2. **เข้าสู่ระบบ** ด้วยอีเมลที่จะใช้
3. **คลิก "Security"** ในเมนูซ้าย
4. **หา "2-Step Verification"** และคลิก
5. **คลิก "Get started"** 
6. **ใส่เบอร์โทร** และยืนยัน SMS/Call
7. **เสร็จสิ้น** - จะเห็นสถานะ "On"

### ขั้นตอนที่ 3: สร้าง App Password

1. **อยู่ในหน้า Security เดิม**
2. **หา "App passwords"** และคลิก
3. **ใส่รหัสผ่าน Google** ของคุณ
4. **Select app:** เลือก **"Mail"**
5. **Select device:** เลือก **"Other (Custom name)"**
6. **ตั้งชื่อ:** พิมพ์ **"Hotel Booking System"**
7. **คลิก "Generate"**
8. **คัดลอกรหัส 16 ตัว** ที่ปรากฏ

**ตัวอย่างรหัสที่ได้:**
```
abcd efgh ijkl mnop
```
**⚠️ บันทึกไว้ทันที! จะไม่แสดงอีก**

### ขั้นตอนที่ 4: ตั้งค่าในโปรเจค
### ขั้นตอนที่ 4: ตั้งค่าในโปรเจค

**สร้างไฟล์ `.env` ในโฟลเดอร์ backend:**

```bash
# Gmail Configuration สำหรับระบบส่งอีเมลอัตโนมัติ
GMAIL_USER=hotel.booking.system@gmail.com
GMAIL_APP_PASSWORD=abcd efgh ijkl mnop
FROM_EMAIL=hotel.booking.system@gmail.com
FROM_NAME=Hotel Booking System
FRONTEND_URL=http://localhost:3000
```

**⚠️ แทนที่ข้อมูลจริง:**
- `hotel.booking.system@gmail.com` → อีเมลจริงของคุณ
- `abcd efgh ijkl mnop` → App Password จริงที่ได้

### ขั้นตอนที่ 5: ทดสอบระบบ

```powershell
cd backend
node test-automatic-email.js
```

**หากสำเร็จจะเห็น:**
```
✅ [SYSTEM] Automatic email sent successfully
📧 ระบบส่งอีเมลอัตโนมัติทำงานได้แล้ว
```

## 🔍 ตัวอย่างจริง

### ✅ การตั้งค่าที่ถูกต้อง:

**ไฟล์ .env:**
```bash
GMAIL_USER=mybookingapp@gmail.com
GMAIL_APP_PASSWORD=abcd efgh ijkl mnop
FROM_EMAIL=mybookingapp@gmail.com
FROM_NAME=My Hotel Booking
FRONTEND_URL=http://localhost:3000
```

### ❌ ข้อผิดพลาดที่พบบ่อย:

**1. ใช้รหัสผ่านปกติ:**
```bash
GMAIL_APP_PASSWORD=mypassword123  # ❌ ผิด!
```

**2. ไม่เปิด 2-Step Verification:**
```
Error: Missing credentials for "PLAIN"  # ❌ ต้องเปิด 2FA
```

**3. รูปแบบ App Password ผิด:**
```bash
GMAIL_APP_PASSWORD=abcdefghijklmnop     # ❌ ไม่มีเว้นวรรค
GMAIL_APP_PASSWORD=abcd-efgh-ijkl-mnop  # ❌ ใช้ - แทน space
```

## �️ ความปลอดภัย

1. **เพิ่ม .env ใน .gitignore:**
   ```
   .env
   .env.local
   ```

2. **ไม่แชร์ App Password ให้ใคร**

3. **ลบ App Password เก่า** หากไม่ใช้แล้ว

## 🆘 แก้ไขปัญหา

### ปัญหา: "Missing credentials for PLAIN"
**สาเหตุ:** ไม่ได้เปิด 2-Step Verification หรือไม่ได้สร้าง App Password

**วิธีแก้:**
1. ตรวจสอบเปิด 2-Step Verification แล้ว
2. สร้าง App Password ใหม่
3. ตรวจสอบไฟล์ .env มีข้อมูลครบ

### ปัญหา: "Invalid login" 
**สาเหตุ:** GMAIL_USER หรือ GMAIL_APP_PASSWORD ผิด

**วิธีแก้:**
1. ตรวจสอบ GMAIL_USER เป็นอีเมลที่ถูกต้อง
2. สร้าง App Password ใหม่
3. ตรวจสอบไม่มีช่องว่างหน้า/หลังใน .env

### ปัญหา: อีเมลไม่ส่ง
**วิธีแก้:**
1. ตรวจสอบ internet connection
2. ลองใช้ Gmail อื่น  
3. รอ 5-10 นาที (Gmail มี rate limit)

## 📱 สำหรับ Production

1. **ใช้ Environment Variables** แทนไฟล์ .env
2. **ตั้งค่าใน Hosting Service** (Vercel, Railway, Render)
3. **ใช้ Professional Email Service** (SendGrid, AWS SES) สำหรับปริมาณมาก

## ✅ สรุป

หลังทำตามขั้นตอนทั้งหมด:

1. **ระบบจะส่งอีเมลอัตโนมัติเมื่อ:**
   - 📧 มีการจองใหม่ 
   - 🚫 มีการยกเลิกการจอง
   - 🔄 มีการอัปเดตข้อมูล
   - ⏰ ก่อนวันเข้าพัก

2. **ไม่ต้องรอแอดมินส่ง** - ระบบทำทุกอย่างอัตโนมัติ

3. **Background Processing** - ไม่บล็อคการทำงานหลัก

🎉 **ระบบส่งอีเมลอัตโนมัติพร้อมใช้งาน!**

### 1. 📧 Email Services (ฟรี)
- **Gmail SMTP** - 100-500 อีเมล/วัน
- **Outlook/Hotmail** - คล้าย Gmail
- **Yahoo Mail** - รองรับ App Password

### 2. 📱 SMS Services (เสียค่าใช้จ่าย)
- **Twilio** - $0.0075/SMS
- **AWS SNS** - $0.00645/SMS  
- **MessageBird** - $0.0075/SMS

### 3. 📞 Voice OTP (เสียค่าใช้จ่าย)
- **Twilio Voice** - $0.013/นาที
- **AWS Connect** - ราคาแปรผัน

### 4. 🚀 Professional Email Services
- **SendGrid** - 100 อีเมล/วัน ฟรี
- **Mailgun** - 5,000 อีเมล/เดือน ฟรี
- **AWS SES** - 62,000 อีเมล/เดือน ฟรี (ปีแรก)

## ✅ ข้อแนะนำสำหรับ Production

1. **ใช้ Professional Email Service** แทน Gmail SMTP
2. **ตั้งค่า Rate Limiting** ป้องกันการส่ง OTP ซ้ำๆ
3. **Log การใช้งาน** เพื่อติดตามปัญหา
4. **Backup Email Templates** 
5. **Monitor Email Delivery Rate**
