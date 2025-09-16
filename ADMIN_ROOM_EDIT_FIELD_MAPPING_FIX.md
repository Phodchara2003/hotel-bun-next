# ปัญหาแอดมินแก้ไขห้องพักไม่ได้ - การแก้ไขสมบูรณ์

## สรุปปัญหา
แอดมินไม่สามารถแก้ไขข้อมูลห้องพักได้ เกิดข้อผิดพลาด MySQL "Incorrect arguments to mysqld_stmt_execute"

## รายละเอียดข้อผิดพลาด
```
❌ Error updating room: Error: Incorrect arguments to mysqld_stmt_execute
code: 'ER_WRONG_ARGUMENTS',
errno: 1210,
sqlMessage: 'Incorrect arguments to mysqld_stmt_execute'
```

## การวิเคราะห์สาเหตุ
จากการ log พบปัญหาหลัก 3 ประการ:

### 1. Field Names ไม่ตรงกัน
**Frontend ส่ง:**
```json
{
  "name": "Ocean View Room",
  "type": "standard", 
  "capacity": "2",        // ⚠️ ไม่ตรงกับ max_guests
  "price": "231",         // ⚠️ ไม่ตรงกับ price_per_night
  "size": "23",          // ⚠️ ไม่ตรงกับ size_sqm
  "description": "Beautiful room...",
  "amenities": ["WiFi", "AC", "TV"]
}
```

**Backend คาดหวัง:**
```javascript
{
  hotel_id,
  name,
  description,
  price_per_night,        // ⚠️ แต่ frontend ส่ง "price"
  max_guests,            // ⚠️ แต่ frontend ส่ง "capacity"  
  size_sqm,              // ⚠️ แต่ frontend ส่ง "size"
  amenities,
  images,
  type
}
```

### 2. Data Type Mismatch
- Frontend ส่งตัวเลขเป็น **string**: `"231"`, `"2"`, `"23"`
- Database ต้องการ **number**: `231`, `2`, `23`

### 3. Array Handling
- Frontend ส่ง amenities เป็น **array**: `["WiFi", "AC", "TV"]`
- Database เก็บเป็น **JSON string**: `'["WiFi", "AC", "TV"]'`

## การแก้ไขที่ใช้

### 1. Field Mapping และ Data Conversion

```javascript
// Map frontend fields to database fields
const mappedData = {
  hotel_id: roomData.hotel_id,
  name: roomData.name,
  description: roomData.description,
  price_per_night: roomData.price_per_night || roomData.price, // รองรับทั้ง 2 format
  max_guests: roomData.max_guests || roomData.capacity,        // รองรับทั้ง 2 format
  size_sqm: roomData.size_sqm || roomData.size,              // รองรับทั้ง 2 format
  amenities: roomData.amenities,
  images: roomData.images,
  type: roomData.type
};
```

### 2. Type Conversion และ Null Handling

```javascript
// Convert และ validate ข้อมูล
const safePricePerNight = price_per_night !== undefined ? parseFloat(price_per_night) || null : null;
const safeMaxGuests = max_guests !== undefined ? parseInt(max_guests) || null : null;
const safeSizeSquareMeters = size_sqm !== undefined ? parseFloat(size_sqm) || null : null;
const safeAmenities = amenities !== undefined ? (Array.isArray(amenities) ? JSON.stringify(amenities) : amenities) : null;
```

### 3. Flexible Field Support

| Frontend Field | Database Field | Conversion |
|---------------|----------------|------------|
| `price` หรือ `price_per_night` | `price_per_night` | `parseFloat()` |
| `capacity` หรือ `max_guests` | `max_guests` | `parseInt()` |
| `size` หรือ `size_sqm` | `size_sqm` | `parseFloat()` |
| `amenities` (array) | `amenities` (JSON string) | `JSON.stringify()` |

## ผลการทดสอบ

### ก่อนแก้ไข
- ❌ Room update: MySQL error "Incorrect arguments"
- ❌ Field mismatch: capacity ≠ max_guests
- ❌ Type error: string ≠ number  
- ❌ Array error: array ≠ JSON string

### หลังแก้ไข  
- ✅ Room update: สำเร็จ StatusCode 200
- ✅ Field mapping: capacity → max_guests ✓
- ✅ Type conversion: "231" → 231 ✓
- ✅ Array handling: ["WiFi"] → '["WiFi"]' ✓

## การทดสอบยืนยัน

**คำสั่งทดสอบ:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3001/api/admin/rooms/6" -Method PUT 
-Body '{"name": "Ocean View Room Updated", "type": "standard", "capacity": "2", "price": "250"}' 
-ContentType "application/json"
```

**ผลลัพธ์:**
```json
{
  "success": true,
  "message": "อัพเดทข้อมูลห้องพักเรียบร้อยแล้ว",
  "data": {
    "id": 6,
    "name": "Ocean View Room Updated",
    "price_per_night": 250,
    "max_guests": 2
  }
}
```

## ไฟล์ที่แก้ไข

### backend/mysql-server.cjs
- **ฟังก์ชัน**: `updateRoom(roomId, roomData)`
- **การเปลี่ยนแปลง**: เพิ่ม field mapping และ type conversion
- **บรรทัด**: ~1285-1330

## สถานะระบบ
🟢 **ใช้งานได้เต็มรูปแบบ** - การจัดการห้องพักของแอดมินทำงานได้ถูกต้อง:

- ✅ **ดูข้อมูลห้องพัก**: แสดงรายการห้องพัก
- ✅ **เพิ่มห้องพัก**: สร้างห้องพักใหม่
- ✅ **แก้ไขห้องพัก**: อัพเดทข้อมูลห้องพัก (แก้ไขแล้ว)
- ✅ **ลบห้องพัก**: ลบห้องพัก
- ✅ **เปิด/ปิดการจอง**: จัดการสถานะห้องพัก

## คุณสมบัติที่รองรับ
1. **Partial Updates**: แก้ไขเฉพาะฟิลด์ที่เปลี่ยน
2. **Type Safety**: แปลงประเภทข้อมูลอัตโนมัติ
3. **Field Flexibility**: รองรับชื่อฟิลด์แบบต่างๆ
4. **Data Validation**: ตรวจสอบความถูกต้องของข้อมูล
5. **Error Handling**: จัดการข้อผิดพลาดอย่างเหมาะสม

## บทเรียนที่ได้
**Field Mapping Importance**: เมื่อ frontend และ backend ใช้ field names ที่แตกต่างกัน ต้องมี mapping layer เพื่อแปลงข้อมูลให้ตรงกัน รวมถึงการแปลงประเภทข้อมูลที่เหมาะสม

---
**วันที่แก้ไข**: 17 กันยายน 2025  
**ปัญหา**: แอดมินแก้ไขห้องพักไม่ได้ เกิด MySQL parameter error  
**สถานะ**: ✅ แก้ไขเรียบร้อย  
**การยืนยัน**: ทดสอบการแก้ไขห้องพักผ่าน API และ frontend interface สำเร็จ