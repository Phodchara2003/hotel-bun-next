# 📊 ระบบแสดงข้อมูลการจองแบบละเอียด (Detailed Bookings System)

## 🎯 ภาพรวม
ระบบแสดงข้อมูลการจองแบบละเอียดสำหรับ Admin ที่รวมข้อมูลการจอง, รายละเอียดโรงแรม, ประเภทห้อง, ข้อมูลลูกค้า, และหลักฐานการชำระเงินในหน้าเดียว

## ✨ คุณสมบัติ

### 🔍 การแสดงข้อมูลครบถ้วน
- **ข้อมูลการจอง**: หมายเลขการจอง, วันเข้า-ออก, จำนวนผู้เข้าพัก, ราคา, สถานะ
- **ข้อมูลลูกค้า**: ชื่อ, อีเมล, เบอร์โทร, ข้อมูลบัญชีผู้ใช้
- **ข้อมูลโรงแรม**: ชื่อโรงแรม, ที่อยู่, รายละเอียด, สิ่งอำนวยความสะดวก
- **ข้อมูลห้องพัก**: ประเภท, ราคาต่อคืน, ขนาด, ผู้เข้าพักสูงสุด
- **หลักฐานการชำระเงิน**: รูปภาพ slip, จำนวนเงิน, วันที่ชำระ, สถานะ

### 🎨 UI/UX ที่ปรับปรุงแล้ว
- **Responsive Design**: รองรับทุกขนาดหน้าจอ
- **Loading States**: แสดงสถานะการโหลดข้อมูล
- **Error Handling**: จัดการกับข้อผิดพลาดอย่างเหมาะสม
- **Modal View**: แสดงรายละเอียดแบบ popup
- **Breadcrumbs**: นำทางกลับง่าย
- **Print Function**: พิมพ์รายละเอียดได้

### 📸 การจัดการรูปภาพ
- **Smart Image Loading**: แสดง loading state ขณะโหลดรูป
- **Error Fallback**: แสดงข้อความเมื่อไม่สามารถโหลดรูปได้
- **Responsive Images**: ปรับขนาดตามหน้าจอ
- **File Information**: แสดงชื่อไฟล์เมื่อเกิดข้อผิดพลาด

## 🛠 การใช้งาน

### สำหรับ Admin
1. เข้าสู่ระบบด้วยบัญชี admin
2. ไปที่ Dashboard → "ข้อมูลการจองแบบละเอียด"
3. ดูข้อมูลสรุปการจอง
4. คลิก "ดูรายละเอียด" เพื่อดูข้อมูลครบถ้วน
5. ใน Modal สามารถ:
   - ดูข้อมูลลูกค้าและการจอง
   - ดูรายละเอียดโรงแรมและห้อง
   - ดูหลักฐานการชำระเงิน
   - พิมพ์ข้อมูล

### การเข้าถึง
```
URL: http://localhost:3002/admin/bookings/detailed
ต้องมีสิทธิ์: Admin หรือ Staff
```

## 🔧 เทคโนโลยี

### Backend
- **Database Query**: MySQL JOIN query ข้าม 5 ตาราง
- **API Endpoint**: `/api/admin/bookings/detailed`
- **Data Processing**: จัดกลุ่ม payment slips ตาม booking
- **Error Handling**: ครอบคลุมทุกกรณี

### Frontend
- **Framework**: Next.js 14 with React
- **State Management**: useState, useEffect
- **API Communication**: Axios wrapper
- **Image Handling**: Next.js Image component
- **Notifications**: React Hot Toast
- **Styling**: Tailwind CSS

## 📊 โครงสร้างข้อมูล

### API Response
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": 7,
      "booking_reference": "HTL123456",
      "guest_name": "ชื่อลูกค้า",
      "guest_email": "email@example.com",
      "guest_phone": "0123456789",
      "hotel": {
        "name": "ชื่อโรงแรม",
        "address": "ที่อยู่",
        "description": "รายละเอียด"
      },
      "room_type": {
        "name": "ประเภทห้อง",
        "price_per_night": 1500,
        "max_guests": 2,
        "size_sqm": 25
      },
      "payment_slips": [
        {
          "id": 1,
          "file_path": "/uploads/payment-slips/slip1.jpg",
          "amount": 1500,
          "payment_date": "2025-09-16",
          "status": "approved"
        }
      ],
      "user": {
        "first_name": "ชื่อ",
        "last_name": "นามสกุล",
        "email": "user@email.com"
      }
    }
  ]
}
```

## 🎯 จุดเด่น

### 1. ข้อมูลครบถ้วน
- รวบรวมข้อมูลจาก 5 ตารางในการ query เดียว
- แสดงความสัมพันธ์ระหว่างข้อมูลได้ชัดเจน

### 2. Performance
- การ JOIN query ที่มีประสิทธิภาพ
- จำกัดผลลัพธ์ที่ 50 รายการ
- Loading states ให้ feedback ผู้ใช้

### 3. User Experience
- Interface ใช้งานง่าย
- ข้อมูลจัดระเบียบดี
- Modal ที่ responsive

### 4. Maintainability
- Component แยกชัดเจน
- Error handling ครอบคลุม
- Code ที่อ่านง่าย

## 🔗 การเชื่อมต่อ

### จาก Dashboard
- Quick Action: "ข้อมูลการจองแบบละเอียด"
- แสดงจำนวนการจองทั้งหมด

### Navigation
- Breadcrumbs: Dashboard → Detailed Bookings
- Back to Dashboard: คลิกที่ breadcrumb

## ⚡ การทำงาน

### Backend Process
1. รับ request ที่ `/api/admin/bookings/detailed`
2. ทำ MySQL JOIN query ข้าม 5 ตาราง
3. จัดกลุ่มข้อมูล payment slips
4. ส่งกลับข้อมูลที่จัดระเบียบแล้ว

### Frontend Process
1. เรียก API เมื่อ component mount
2. แสดง loading state
3. แสดงข้อมูลในตารางและ stats
4. เปิด modal เมื่อคลิกรายละเอียด
5. จัดการ error และ image loading

## 🎉 ผลลัพธ์
ระบบที่สมบูรณ์แบบสำหรับ Admin ในการดูข้อมูลการจองแบบครบถ้วน พร้อมรูปภาพหลักฐานการชำระเงิน และข้อมูลที่เกี่ยวข้องทั้งหมดในหน้าเดียว

---
*อัพเดทล่าสุด: 16 กันยายน 2025*