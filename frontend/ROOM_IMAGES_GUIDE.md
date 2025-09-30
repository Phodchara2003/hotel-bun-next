# คำแนะนำการใช้รูปภาพห้องพัก

## ระบบห้องพักมี 2 แบบเท่านั้น:

### 1. ห้องเตียงเดี่ยว (Single Room)
- ราคา: 1,200 บาท/คืน
- ความจุ: 1 คน
- ขนาด: 25 ตร.ม.

### 2. ห้องเตียงคู่ (Double Room)  
- ราคา: 1,800 บาท/คืน
- ความจุ: 2 คน
- ขนาด: 35 ตร.ม.

## รูปภาพที่ต้องใช้:

จากรูปที่แนบมาใน attachments:

### สำหรับห้องเตียงเดี่ยว:
```
frontend/public/images/rooms/single-room-main.jpg     <- รูปห้องเตียงเดี่ยว (จากรูปที่ 6)
frontend/public/images/rooms/single-room-modern.jpg   <- รูปมุมอื่นของห้องเตียงเดี่ยว
```

### สำหรับห้องเตียงคู่:
```
frontend/public/images/rooms/double-room-main.jpg     <- รูปห้องเตียงคู่ (จากรูปที่ 3-4)
frontend/public/images/rooms/double-room-swan.jpg     <- รูปเตียงคู่พร้อมผ้าเช็ดตัวรูปหงส์
frontend/public/images/rooms/double-room-golden.jpg   <- รูปห้องเตียงคู่โทนสีทอง
```

### ห้องน้ำ (ใช้ร่วมกัน):
```
frontend/public/images/rooms/bathroom-modern.jpg      <- รูปห้องน้ำ (จากรูปที่ 5)
```

## วิธีการใช้งาน:

1. สร้างโฟลเดอร์ `frontend/public/images/rooms/`
2. คัดลอกรูปภาพจาก attachments ใส่ในโฟลเดอร์ตามชื่อที่กำหนด
3. ระบบจะแสดงรูปอัตโนมัติ

## หมายเหตุ:

- ระบบมี fallback เป็นรูป placeholder ในกรณีที่ไม่มีรูปจริง
- รูปภาพจะแสดงในหน้าแรก หน้ารายการห้องพัก และหน้ารายละเอียดห้อง
- รูปจะ responsive ปรับตามขนาดหน้าจอ