# Staff Booking Management Permissions

## สรุปการแก้ไขสิทธิ์การจัดการการจองสำหรับพนักงาน

### ✅ ที่เพิ่มให้ Staff ทำได้:

#### 1. Dashboard Permissions
- ✅ **ดูรายละเอียดการจอง** - ดูข้อมูลการจองทั้งหมด
- ✅ **ยืนยันการจอง** - เปลี่ยนสถานะจาก "pending" เป็น "confirmed"
- ✅ **ยกเลิกการจอง** - ยกเลิกการจองที่อยู่ในสถานะ "pending" หรือ "confirmed"
- ✅ **ไปหน้าชำระเงิน** - นำลูกค้าไปหน้าอัปโหลดหลักฐานการชำระเงิน

#### 2. API Endpoints ที่ Staff เข้าถึงได้:
- ✅ `GET /api/bookings/admin/all` - ดูรายการการจองทั้งหมด
- ✅ `PUT /api/bookings/:id/confirm` - ยืนยันการจอง
- ✅ `PUT /api/bookings/admin/:id/cancel` - ยกเลิกการจอง

### ❌ ที่ยังคงเป็น Admin Only:

#### 1. Booking Operations
- ❌ **อนุมัติการจอง** (`approve`) - เฉพาะ admin เท่านั้น
- ❌ **ลบการจอง** (`delete`) - เฉพาะ admin เท่านั้น

#### 2. Other Admin Functions  
- ❌ **เพิ่ม/แก้ไข/ลบห้องพัก** - เฉพาะ admin
- ❌ **เพิ่ม/แก้ไข/ลบผู้ใช้** - เฉพาะ admin
- ❌ **เปลี่ยนสิทธิ์ผู้ใช้** - เฉพาะ admin

### 🔧 Technical Implementation:

#### Frontend Role Functions (lib/roles.js):
```javascript
// Staff และ Admin ใช้ได้
canManageBookings(user) // ยืนยัน/ยกเลิกการจอง
canEdit(user) // แก้ไขข้อมูลทั่วไป

// เฉพาะ Admin เท่านั้น
canApproveBookings(user) // อนุมัติการจอง
canDelete(user) // ลบข้อมูล
canCreate(user) // สร้างข้อมูลใหม่
```

#### Backend Middleware:
```javascript
requireStaff({ headers, set }) // รองรับ staff และ admin
requireAdmin({ headers, set }) // เฉพาะ admin เท่านั้น
```

#### UI Behavior:
- **Staff**: เห็นปุ่ม "ยืนยัน" และ "ยกเลิก" สำหรับ pending/confirmed bookings
- **Staff**: ไม่เห็นปุ่ม "อนุมัติ" และ "ลบ"
- **Admin**: เห็นปุ่มทั้งหมดเหมือนเดิม

### 📋 Staff Workflow:

#### การจัดการ Pending Booking:
1. ✅ Staff เห็นการจองที่รอการยืนยัน
2. ✅ กดปุ่ม "ยืนยัน" → เปลี่ยนเป็น "confirmed"
3. ✅ หรือกดปุ่ม "ยกเลิก" → เปลี่ยนเป็น "cancelled"

#### การจัดการ Confirmed Booking:
1. ✅ Staff เห็นการจองที่ยืนยันแล้ว
2. ✅ กดปุ่ม "ชำระเงิน" → ส่งลูกค้าไปอัปโหลดหลักฐาน
3. ✅ หรือกดปุ่ม "ยกเลิก" → ยกเลิกการจอง
4. ❌ ไม่เห็นปุ่ม "อนุมัติ" (เฉพาะ admin)

#### สิ่งที่ Staff ไม่สามารถทำได้:
- ❌ อนุมัติการจองให้เป็น "completed"
- ❌ ลบการจองออกจากระบบ
- ❌ เพิ่มห้องพักใหม่
- ❌ แก้ไขข้อมูลห้องพัก
- ❌ เพิ่ม/ลบผู้ใช้งาน

### 🎯 การใช้งาน:

#### Staff Login:
- **Email**: staff@royalgarden.com
- **Password**: Staff123!

#### Staff Dashboard:
1. เข้าสู่ระบบ → ไปหน้า Admin Dashboard อัตโนมัติ
2. เห็นรายการการจองทั้งหมดเหมือน admin
3. สามารถกรองและค้นหาการจองได้
4. เห็นปุ่มยืนยัน/ยกเลิกสำหรับการจองที่เหมาะสม
5. ไม่เห็นปุ่มอนุมัติ/ลบ

### ✅ System Ready:
ระบบพร้อมให้พนักงานจัดการการจองแล้ว! Staff สามารถช่วยยืนยันและยกเลิกการจองได้ ทำให้ลดภาระงานของ Admin และเพิ่มประสิทธิภาพในการบริการลูกค้า
