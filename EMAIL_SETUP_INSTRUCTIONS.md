# Email Setup Instructions

## 🔧 การตั้งค่า Email สำหรับระบบ Forgot Password

ระบบ forgot password ทำงานได้แล้ว แต่ต้องตั้งค่า SMTP เพื่อส่งอีเมลจริง

### 📧 Gmail Setup (แนะนำ)

1. **เปิด 2-Step Verification**
   - ไป Google Account → Security → 2-Step Verification
   - เปิดใช้งาน 2-Step Verification

2. **สร้าง App Password**
   - ไป Google Account → Security → App passwords
   - เลือก app: Mail
   - เลือก device: Other (custom name)
   - ตั้งชื่อ: "Hotel Booking System"
   - คัดลอก App Password (16 ตัวอักษร)

3. **แก้ไขไฟล์ .env.local**
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-actual-email@gmail.com
   SMTP_PASS=your-16-digit-app-password
   ```

### 📧 Outlook/Hotmail Setup

```bash
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

### 📧 Yahoo Setup

```bash
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your-app-password
```

### 🧪 ทดสอบ Email

1. แก้ไข .env.local ให้ถูกต้อง
2. Restart development server: `npm run dev`
3. ทดสอบ forgot password อีกครั้ง

### 🔍 Debug

หากมีปัญหา ดูใน console จะมีข้อความแสดงสถานะ:
- ✅ `Email sent successfully` = สำเร็จ
- ❌ `SMTP error` = ตรวจสอบ credentials
- ❌ `Connection failed` = ตรวจสอบ host/port

### 🛡️ Security Notes

- ใช้ App Password แทน password จริง
- ไม่ commit .env.local ลง git
- ตั้งค่า environment variables ใน production

### 🎯 ผลลัพธ์ที่คาดหวัง

เมื่อตั้งค่าเสร็จ:
1. User กรอก email ในหน้า forgot password
2. ระบบส่งอีเมลพร้อม reset link
3. User คลิก link ในอีเมล
4. เปิดหน้า reset password พร้อม token
5. User ตั้งรหัสผ่านใหม่

### 📱 Current Status

✅ Reset token generation ทำงาน
✅ API endpoints ทำงาน
✅ Reset password page ทำงาน
⏳ ต้องตั้งค่า SMTP เพื่อส่งอีเมล

### 🔗 Test Reset URL

ปัจจุบันสามารถใช้ URL นี้ทดสอบ reset password:
http://localhost:3002/reset-password?token=909b959f267f78bfef3a1ef3982167f260c8d3586c617051746de9e91e86f8df

(Token จะหมดอายุหลัง 1 ชั่วโมง)