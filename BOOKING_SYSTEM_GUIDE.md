# ระบบจองห้องพัก - คู่มือการใช้งาน

## 🎯 หลักการทำงานของระบบจอง

ระบบจองห้องพักใหม่ทำงานตามหลักการดังนี้:

1. **ลูกค้าเลือกประเภทห้องพัก** จาก `room_types`
2. **ระบบเช็คสถานะห้องพัก** จากตาราง `rooms` และ `bookings`
3. **แสดงผลลัพธ์**:
   - หากมีห้องว่าง → แสดงห้องที่ว่างให้ลูกค้าจอง
   - หากไม่มีห้องว่างเลย → แสดงข้อความแจ้งว่าไม่มีห้องว่าง

## 🚀 วิธีการใช้งาน

### สำหรับลูกค้า

1. **เข้าหน้าจอง**: ไปที่ `/booking` หรือคลิกปุ่ม "จองห้องพักเลย" ในหน้าหลัก

2. **กรอกข้อมูลการจอง**:
   - วันที่เข้าพัก
   - วันที่ออก
   - จำนวนผู้เข้าพัก (1-10 คน)

3. **เลือกประเภทห้องพัก**:
   - ดูข้อมูลห้องพัก (ราคา, ความจุ, สิ่งอำนวยความสะดวก)
   - คลิก "ตรวจสอบห้องว่าง" สำหรับห้องที่ต้องการ

4. **ตรวจสอบผลลัพธ์**:
   - ✅ **มีห้องว่าง**: แสดงจำนวนห้องที่พร้อมใช้งาน
   - ❌ **ไม่มีห้องว่าง**: แสดงข้อความแจ้งและแนะนำให้เลือกวันอื่น

5. **ดำเนินการจอง**: คลิก "ดำเนินการจอง" หากมีห้องว่าง

### การทำงานของระบบ

#### API Endpoints ที่เกี่ยวข้อง

```javascript
// ดึงประเภทห้องพัก
GET /api/room-types

// ตรวจสอบห้องว่าง
POST /api/check-availability
{
  "room_type_id": 10,
  "check_in": "2025-10-05",
  "check_out": "2025-10-07",
  "guests": 2
}
```

#### Response Format

```json
{
  "success": true,
  "data": {
    "isAvailable": true,
    "totalRooms": 2,
    "bookedRooms": 0,
    "availableRooms": 2,
    "existingBookings": []
  },
  "message": "มีห้องว่าง 2 ห้อง จากทั้งหมด 2 ห้อง"
}
```

## 🔧 Technical Implementation

### Frontend Components

- **BookingPage** (`/frontend/app/booking/page.jsx`)
  - Form สำหรับเลือกวันที่และจำนวนคน
  - Card แสดงประเภทห้องพัก
  - ปุ่มตรวจสอบห้องว่าง
  - แสดงผลลัพธ์การตรวจสอบ

### Backend Logic

- **API Handler** (`/backend/mysql-server.cjs`)
  - `/api/check-availability` endpoint
  - ใช้ `checkRoomAvailability()` function
  - ตรวจสอบการจองที่ทับซ้อน

### Database Queries

```sql
-- ตรวจสอบจำนวนห้องทั้งหมด
SELECT quantity as totalRooms
FROM room_types
WHERE id = ?

-- นับการจองที่ชนกัน
SELECT COUNT(*) as conflictCount
FROM bookings
WHERE room_type_id = ?
AND status IN ('confirmed', 'checked_in')
AND (
  (check_in_date <= ? AND check_out_date > ?) OR
  (check_in_date < ? AND check_out_date >= ?) OR
  (check_in_date >= ? AND check_out_date <= ?)
)
```

## 📱 User Interface Features

### 🎨 UI Components

1. **Booking Criteria Form**
   - วันที่เข้าพัก/ออก (Date Pickers)
   - จำนวนผู้เข้าพัก (Dropdown)
   - แสดงจำนวนคืน (Auto-calculate)

2. **Room Type Cards**
   - รูปภาพห้องพัก
   - ชื่อและรายละเอียด
   - ประเภทเตียง (Badge)
   - ราคาต่อคืนและราคารวม
   - ปุ่มตรวจสอบห้องว่าง

3. **Availability Results**
   - ✅ **Available**: เขียว พร้อมข้อมูลห้องที่ว่าง
   - ❌ **Not Available**: แดง พร้อมข้อมูลห้องที่จองแล้ว

4. **Proceed to Booking Section**
   - สรุปข้อมูลการจอง
   - ราคารวมทั้งหมด
   - ปุ่มดำเนินการจอง

### 🔄 State Management

```javascript
const [roomTypes, setRoomTypes] = useState([]);
const [loading, setLoading] = useState(true);
const [checkingAvailability, setCheckingAvailability] = useState(false);
const [availabilityResults, setAvailabilityResults] = useState(null);
const [selectedRoomType, setSelectedRoomType] = useState(null);
const [bookingCriteria, setBookingCriteria] = useState({
  checkIn: '',
  checkOut: '',
  guests: 1
});
```

## 🎯 Key Features

### ✨ ความสามารถหลัก

1. **Real-time Availability Check**: ตรวจสอบห้องว่างแบบเรียลไทม์
2. **Smart Date Validation**: ตรวจสอบวันที่ให้ถูกต้อง
3. **Responsive Design**: ใช้งานได้ทุกอุปกรณ์
4. **User Feedback**: แจ้งผลลัพธ์ด้วย Toast messages
5. **Loading States**: แสดงสถานะการโหลด
6. **Error Handling**: จัดการข้อผิดพลาดได้ดี

### 🛡️ Validation & Security

- ตรวจสอบวันที่ไม่ให้เป็นอดีต
- ตรวจสอบวันที่ออกมาหลังวันที่เข้า
- จำกัดจำนวนผู้เข้าพัก 1-10 คน
- ป้องกัน XSS และ SQL Injection

## 🚀 การใช้งาน

### เริ่มต้นระบบ

```bash
# Backend (Terminal 1)
cd backend
node mysql-server.cjs

# Frontend (Terminal 2)
cd frontend
npm run dev
```

### URLs ที่สำคัญ

- **Frontend**: http://localhost:3002
- **หน้าจอง**: http://localhost:3002/booking
- **Backend API**: http://localhost:3001

### การทดสอบ

```bash
# ทดสอบ API ดึงประเภทห้องพัก
Invoke-RestMethod -Uri "http://localhost:3001/api/room-types" -Method GET

# ทดสอบ API ตรวจสอบห้องว่าง
$body = @{
    room_type_id = 10
    check_in = "2025-10-05"
    check_out = "2025-10-07"
    guests = 2
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/check-availability" -Method POST -Body $body -ContentType "application/json"
```

## 📊 Benefits

### สำหรับลูกค้า
- ✅ เลือกได้เฉพาะห้องที่มีว่าง
- ✅ ไม่ต้องเสียเวลาจองห้องที่ไม่ว่าง
- ✅ เห็นข้อมูลราคาและรายละเอียดครบถ้วน
- ✅ กระบวนการจองที่ชัดเจน

### สำหรับธุรกิจ
- ✅ ลดการจองผิดพลาด
- ✅ เพิ่มประสิทธิภาพการจัดการห้องพัก
- ✅ ลดงานแก้ไขการจองที่ชนกัน
- ✅ ข้อมูลสถิติการจองที่แม่นยำ

---

## 🔄 Flow Diagram

```
┌─────────────────┐
│   หน้าหลัก      │
│                 │
│ [จองห้องพักเลย] │
└─────────┬───────┘
          │
          v
┌─────────────────┐
│   หน้าจอง       │
│                 │
│ 1. เลือกวันที่   │
│ 2. เลือกจำนวนคน │
└─────────┬───────┘
          │
          v
┌─────────────────┐
│ แสดงประเภทห้อง  │
│                 │
│ [ตรวจสอบห้องว่าง]│
└─────────┬───────┘
          │
          v
┌─────────────────┐    ❌ ไม่ว่าง
│ API Check       │───────────┐
│ Availability    │           │
└─────────┬───────┘           │
          │ ✅ มีห้องว่าง      │
          v                   │
┌─────────────────┐           │
│ แสดงผลลัพธ์     │           │
│                 │           │
│ [ดำเนินการจอง]  │           │
└─────────┬───────┘           │
          │                   │
          v                   │
┌─────────────────┐           │
│ หน้าจองขั้นตอน  │           │
│ (booking-step)  │           │
└─────────────────┘           │
                              │
          ┌───────────────────┘
          │
          v
┌─────────────────┐
│ แสดงข้อความ     │
│ "ไม่มีห้องว่าง"  │
│                 │
│ แนะนำเลือกวันอื่น│
└─────────────────┘
```

ด้วยระบบนี้ ลูกค้าจะได้รับประสบการณ์การจองที่ดีขึ้น โดยรู้ล่วงหน้าว่าห้องไหนมีว่างก่อนที่จะดำเนินการจอง ทำให้ลดความผิดหวังและเพิ่มความพึงพอใจของลูกค้า 🎉