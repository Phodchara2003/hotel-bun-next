# 🔐 ข้อมูลล็อกอิน Admin

## สำหรับทดสอบระบบจัดการผู้ใช้

### 🌐 URL เข้าสู่ระบบ:
http://localhost:3000/login

### 👑 บัญชี Admin ที่ใช้ได้:

1. **Admin หลัก**
   - Email: `admin@royalgarden.com` 
   - Role: admin
   - Password: ต้องดูจากฐานข้อมูล (ไม่มีใน plaintext)

2. **Super Admin 1** 
   - Email: `admin@hotel.com`
   - Role: super_admin

3. **Super Admin 2**
   - Email: `admin@manager.com` 
   - Role: super_admin

### 📊 สถิติผู้ใช้ในระบบ:
- ทั้งหมด: 10 คน
- Admin: 1 คน  
- Super Admin: 2 คน
- Staff: 3 คน
- User: 4 คน

### 🔧 หลังจากล็อกอินแล้ว:
1. ไปที่ Dashboard: `/admin/dashboard`
2. คลิกแท็บ "ผู้ใช้งาน"
3. จะเห็นข้อมูลผู้ใช้ 10 คนพร้อมฟีเจอร์:
   - ✅ ดูรายชื่อผู้ใช้ทั้งหมด
   - ✅ เพิ่มผู้ใช้ใหม่ (กดปุ่ม "เพิ่มผู้ใช้")
   - ✅ แก้ไขผู้ใช้ (กดปุ่ม "แก้ไข")
   - ✅ ลบผู้ใช้ (กดปุ่ม "ลบ")
   - ✅ ส่งอีเมล (กดปุ่ม "ส่งอีเมล")
   - ✅ ดู Token Status แบบ real-time

### 🚀 ระบบพร้อมใช้งาน!
- Frontend: http://localhost:3000
- Backend: http://localhost:3001  
- API ทำงานสมบูรณ์แล้ว ✅
