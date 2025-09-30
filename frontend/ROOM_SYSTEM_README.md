# การใช้งานระบบห้องพักใหม่

## รูปภาพห้องพัก

รูปภาพที่คุณแนบมาได้ถูกจัดหมวดหมู่และใช้ในระบบดังนี้:

### ประเภทห้องพัก:

1. **ห้องสูพีเรียร์ เตียงเดี่ยว** (ID: 1)
   - รูปหลัก: room-modern-single.jpg (รูปที่ 1, 5)
   - รูปเพิ่มเติม: room-bathroom-modern.jpg (รูปที่ 4)

2. **ห้องดีลักซ์ เตียงคู่** (ID: 2) 
   - รูปหลัก: room-deluxe-double.jpg (รูปที่ 2)
   - รูปเพิ่มเติม: room-deluxe-swan.jpg (รูปที่ 2 - ผ้าปูลายไทย), room-golden-accent.jpg (รูปที่ 3)

3. **ห้องแฟมิลี่ เตียงแฝด** (ID: 3)
   - รูปหลัก: room-family-twin.jpg (รูปที่ 6)
   - รูปเพิ่มเติม: room-twin-beds.jpg (รูปที่ 7), room-twin-traditional.jpg

## วิธีเพิ่มรูปภาพจริง:

1. **คัดลอกรูปภาพ** ที่คุณแนบมาไปยัง:
   ```
   frontend/public/images/rooms/
   ```

2. **ตั้งชื่อไฟล์** ตามที่กำหนดใน `roomsData.js`:
   - room-modern-single.jpg
   - room-deluxe-double.jpg
   - room-deluxe-swan.jpg
   - room-golden-accent.jpg
   - room-bathroom-modern.jpg
   - room-family-twin.jpg
   - room-twin-beds.jpg
   - room-twin-traditional.jpg

3. **หรือปรับแก้ path** ในไฟล์ `lib/roomsData.js` ให้ตรงกับชื่อไฟล์จริง

## ฟีเจอร์ที่พร้อมใช้งาน:

✅ หน้าหลักแสดงห้องพักพร้อมรูปภาพ
✅ หน้ารายการห้องพักพร้อมการค้นหา
✅ หน้ารายละเอียดห้องพักพร้อม gallery
✅ ระบบจองห้องพัก (เชื่อมต่อ API)
✅ Fallback images ถ้ารูปไม่โหลด
✅ Responsive design
✅ การตรวจสอบวันที่และจำนวนผู้เข้าพัก

## การเชื่อมต่อ API:

ระบบได้เชื่อมต่อกับ API endpoints ที่มีอยู่:
- `GET /api/hotels` - ดึงข้อมูลโรงแรม
- `GET /api/room-types` - ดึงประเภทห้องพัก
- `GET /api/rooms/search` - ค้นหาห้องว่าง
- `GET /api/rooms/{id}` - รายละเอียดห้องพัก
- `POST /api/bookings` - สร้างการจอง

หากไม่สามารถเชื่อมต่อ API ได้ ระบบจะใช้ข้อมูลจำลองแทน

## หมายเหตุ:

- ระบบใช้สี #082220 ตามที่คุณต้องการ
- ฟอนต์ไทยแสดงผลสวยงาม
- Navigation อยู่ด้านบนแล้ว
- รองรับการใช้งานบนมือถือ