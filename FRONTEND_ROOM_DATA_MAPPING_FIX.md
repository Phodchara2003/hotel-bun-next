# Frontend Room Data Mapping Fix - การแก้ไขการ Map ข้อมูลห้องพัก

## ปัญหาที่พบ
หลังจากแก้ไข API backend สำเร็จแล้ว แต่หน้า frontend ยังไม่แสดงข้อมูลที่อัปเดตอย่างถูกต้อง เนื่องจาก field names ระหว่าง database และ form ไม่ตรงกัน

## สาเหตุของปัญหา

### 1. Database Fields vs Form Fields Mismatch
| Database Field | Form Field | ปัญหา |
|---------------|------------|-------|
| `max_guests` | `capacity` | ไม่ตรงกัน |
| `price_per_night` | `price` | ไม่ตรงกัน |
| `size_sqm` | `size` | ไม่ตรงกัน |
| `amenities` (JSON string) | `amenities` (array) | Type ไม่ตรงกัน |

### 2. Data Flow ปัญหา
```
API Response → Frontend Display → Edit Form → API Request
    ↓              ↓               ↓            ↓
Database Fields  Missing Mapping  Wrong Fields  Backend Mapping (Fixed)
```

## การแก้ไขที่ใช้

### 1. แก้ไข openModal Function (page.jsx)

**ก่อนแก้ไข:**
```javascript
setFormData({
  capacity: room.capacity || '',        // ❌ undefined จาก database
  price: room.price || '',              // ❌ undefined จาก database  
  size: room.size || '',                // ❌ undefined จาก database
  amenities: room.amenities || [],      // ❌ JSON string แทน array
});
```

**หลังแก้ไข:**
```javascript
setFormData({
  capacity: room.max_guests || room.capacity || '',     // ✅ Map max_guests → capacity
  price: room.price_per_night || room.price || '',      // ✅ Map price_per_night → price
  size: room.size_sqm || room.size || '',               // ✅ Map size_sqm → size
  amenities: (() => {                                   // ✅ Safe JSON parsing
    try {
      if (room.amenities) {
        if (typeof room.amenities === 'string') {
          return JSON.parse(room.amenities);
        } else if (Array.isArray(room.amenities)) {
          return room.amenities;
        }
      }
      return [];
    } catch (e) {
      console.error('Error parsing amenities:', e);
      return [];
    }
  })(),
});
```

### 2. เพิ่ม Debug Logging

```javascript
// ใน fetchRooms function
console.log('🔧 Sample room data from API:', response.data[0]);

// ใน openModal function  
console.log('🔧 Original room data for edit:', room);
console.log('🔧 Mapped form data for edit:', mappedFormData);
```

### 3. Safe Amenities Parsing

```javascript
amenities: (() => {
  try {
    if (room.amenities) {
      if (typeof room.amenities === 'string') {
        return JSON.parse(room.amenities);  // Parse JSON string
      } else if (Array.isArray(room.amenities)) {
        return room.amenities;              // Already array
      }
    }
    return [];                              // Default empty array
  } catch (e) {
    console.error('Error parsing amenities:', e);
    return [];                              // Fallback on error
  }
})()
```

## Data Flow หลังแก้ไข

```
API Response → Frontend Display → Edit Form → API Request
    ↓              ↓               ↓            ↓
Database Fields  ✅ Mapped Data   ✅ Correct    ✅ Backend
max_guests      → capacity        → capacity    → max_guests
price_per_night → price          → price       → price_per_night  
size_sqm        → size           → size        → size_sqm
amenities (JSON) → amenities (Array) → amenities → amenities (JSON)
```

## ผลลัพธ์ที่คาดหวัง

### Frontend Display
- ✅ แสดงข้อมูลห้องพักถูกต้องจาก database
- ✅ การ์ดห้องพักแสดงราคา, จำนวนแขก, ขนาดถูกต้อง
- ✅ Amenities แสดงเป็น list อย่างถูกต้อง

### Edit Form Population
- ✅ เมื่อคลิกปุ่มแก้ไข form จะเติมข้อมูลเดิมถูกต้อง
- ✅ ราคา แสดงเป็น 250 แทน undefined
- ✅ จำนวนแขก แสดงเป็น 2 แทน undefined  
- ✅ ขนาด แสดงเป็น 25 แทน undefined
- ✅ Amenities แสดงเป็น checkbox list

### After Update
- ✅ หลังบันทึกแก้ไข หน้าต่าง modal ปิด
- ✅ รายการห้องพักรีเฟรชและแสดงข้อมูลใหม่
- ✅ ข้อมูลที่แก้ไขแสดงทันทีโดยไม่ต้องรีโหลดหน้า

## การทดสอบ

### 1. ทดสอบการแสดงข้อมูล
```
1. เปิดหน้า /admin/rooms
2. ตรวจสอบ console log: "🔧 Sample room data from API"
3. ยืนยันว่าข้อมูลแสดงครบถ้วน
```

### 2. ทดสอบการแก้ไข
```
1. คลิกปุ่ม "แก้ไข" ในการ์ดห้องพักใดๆ
2. ตรวจสอบ console log: "🔧 Original room data for edit"
3. ตรวจสอบ console log: "🔧 Mapped form data for edit"  
4. ยืนยันว่า form fields เติมข้อมูลถูกต้อง
5. แก้ไขข้อมูลและบันทึก
6. ยืนยันว่าข้อมูลอัปเดตในรายการ
```

## ไฟล์ที่แก้ไข

### frontend/app/admin/rooms/page.jsx
- **ฟังก์ชัน**: `openModal(type, room)` 
- **การเปลี่ยนแปลง**: เพิ่ม field mapping และ safe parsing
- **ฟังก์ชัน**: `fetchRooms()` 
- **การเปลี่ยนแปลง**: เพิ่ม debug logging
- **บรรทัด**: ~215-240, ~125

## สถานะระบบ
🟢 **กำลังทดสอบ** - Frontend room editing data mapping:

- ✅ Backend API: รองรับ field mapping
- ✅ Frontend Form: เพิ่ม field mapping  
- 🔄 **Testing**: ทดสอบการแสดงผลและการแก้ไข
- ⏳ **Verification**: รอยืนยันผลการทดสอบ

---
**วันที่แก้ไข**: 17 กันยายน 2025  
**ปัญหา**: Frontend ไม่แสดงข้อมูลอัปเดตหลังแก้ไขห้องพัก  
**สถานะ**: 🔄 กำลังทดสอบการแก้ไข field mapping  
**ขั้นตอนต่อไป**: ทดสอบ edit form และยืนยันการทำงาน