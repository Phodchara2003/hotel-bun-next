# Bed Type Feature Implementation

## สรุป
เพิ่มฟีเจอร์ประเภทเตียง (bed_type) ในระบบจัดการห้องพักโรงแรม เพื่อให้ผู้ดูแลระบบสามารถเลือกประเภทเตียงได้ และลูกค้าสามารถเห็นข้อมูลประเภทเตียงในการแสดงห้องพัก

## ฟีเจอร์ที่เพิ่ม

### 1. Admin Interface
- เพิ่มตัวเลือกประเภทเตียงในหน้าจัดการห้องพัก
- ประเภทเตียงที่รองรับ: เตียงเดี่ยว, เตียงคู่, เตียงควีน, เตียงคิง, เตียงแฝด
- แสดงประเภทเตียงใน room cards ของหน้า admin

### 2. Customer Interface  
- แสดงประเภทเตียงใน room cards หน้าแรก
- แสดงประเภทเตียงในหน้ารายละเอียดห้องพัก
- แสดงประเภทเตียงในหน้าจองห้องพัก
- รูปแบบการแสดง: "ห้องมาตรฐาน (เตียงคู่)"

### 3. Database Schema
- เพิ่มฟิลด์ `bed_type` ในตาราง `room_types`
- ประเภทข้อมูล: VARCHAR(20)
- ค่าเริ่มต้น: 'single'

### 4. Backend API
- อัปเดต POST `/api/admin/room-types` รองรับ bed_type
- อัปเดต PUT `/api/admin/room-types/:id` รองรับ bed_type  
- อัปเดต GET endpoints ให้ส่ง bed_type กลับมา

## ไฟล์ที่แก้ไข

### Frontend
- `frontend/app/admin/rooms/page.jsx` - เพิ่ม bed type options ในฟอร์ม admin
- `frontend/app/page.jsx` - แสดง bed type ใน room cards หน้าแรก
- `frontend/app/room-details/[id]/page.jsx` - แสดง bed type ในหน้ารายละเอียด
- `frontend/app/room-details/[id]/book/page.jsx` - แสดง bed type ในหน้าจอง

### Backend
- `backend/routes/admin/rooms.js` - อัปเดต API endpoints รองรับ bed_type
- `backend/postgres-server.js` - อัปเดต SELECT queries รวม bed_type

### Database
- `add-bed-type-field.sql` - SQL migration เพิ่มฟิลด์ bed_type
- `run-bed-type-migration.js` - สคริปต์รัน migration
- `test-bed-type-field.js` - สคริปต์ทดสอบฟิลด์ bed_type

## การติดตั้ง

### 1. รัน Database Migration
```bash
# ตรวจสอบ database connection
node test-bed-type-field.js

# รัน migration เพิ่มฟิลด์ bed_type
node run-bed-type-migration.js

# ทดสอบหลัง migration
node test-bed-type-field.js
```

### 2. เริ่มต้น Services
```bash
# Backend (เปิด terminal ใหม่)
cd backend
npm start

# Frontend (เปิด terminal ใหม่)  
cd frontend
npm run dev
```

## ประเภทเตียงที่รองรับ

| Code | ภาษาไทย | ภาษาอังกฤษ |
|------|---------|-------------|
| single | เตียงเดี่ยว | Single Bed |
| double | เตียงคู่ | Double Bed |
| queen | เตียงควีน | Queen Bed |
| king | เตียงคิง | King Bed |
| twin | เตียงแฝด | Twin Beds |

## การทำงาน

### Admin สามารถ:
1. เลือกประเภทเตียงเมื่อสร้างห้องพักใหม่
2. แก้ไขประเภทเตียงของห้องพักที่มีอยู่
3. เห็นประเภทเตียงในรายการห้องพัก

### ลูกค้าสามารถ:
1. เห็นประเภทเตียงใน room cards หน้าแรก
2. เห็นประเภทเตียงในหน้ารายละเอียดห้องพัก  
3. เห็นประเภทเตียงในหน้าจองห้องพัก

## ปัญหาที่อาจเกิดขึ้น

### 1. Database Column ไม่มี
**อาการ:** Error "column bed_type does not exist"
**แก้ไข:** รัน migration script
```bash
node run-bed-type-migration.js
```

### 2. API ไม่ส่ง bed_type กลับมา
**อาการ:** Frontend ไม่แสดงประเภทเตียง
**แก้ไข:** ตรวจสอบ backend queries รวม bed_type field

### 3. Frontend แสดงค่า undefined
**อาการ:** แสดง "undefined" แทนประเภทเตียง
**แก้ไข:** ตรวจสอบ getBedTypeLabel function และ default values

## Testing

```bash
# ทดสอบ database field
node test-bed-type-field.js

# ทดสอบ API endpoints (ใช้ Postman หรือ curl)
curl -X GET http://localhost:3001/api/room-types

# ทดสอบ frontend
# เปิด http://localhost:3000 และตรวจสอบการแสดงผล
```