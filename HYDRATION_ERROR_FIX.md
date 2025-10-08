# 🔧 แก้ไข Hydration Error - หน้าทดสอบอีเมล

## ❌ ปัญหาที่พบ
```
Warning: Text content did not match. Server: "1759934927731" Client: "1759934928294"
Hydration failed because the initial UI does not match what was rendered on the server.
```

## 🔍 สาเหตุ
- การใช้ `Date.now()` ในการสร้าง booking reference และวันที่
- เวลาบน server และ client ไม่เหมือนกัน ทำให้เกิด Hydration Mismatch
- Next.js ไม่สามารถ match HTML ที่ render บน server กับ client ได้

## ✅ วิธีแก้ไข

### 1. เปลี่ยนจากค่าแบบ dynamic เป็นค่าคงที่
```javascript
// ❌ เดิม (ทำให้เกิด hydration error)
bookingReference: 'HTL' + Date.now(),
checkInDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
checkOutDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),

// ✅ ใหม่ (ใช้ค่าคงที่)
bookingReference: 'HTL123456789',
checkInDate: '2025-10-15',
checkOutDate: '2025-10-17',
```

### 2. เพิ่ม Client-side rendering protection
```javascript
const [isClient, setIsClient] = useState(false);

useEffect(() => {
  setIsClient(true);
}, []);

if (!isClient) {
  return <LoadingComponent />;
}
```

### 3. แยก Component เป็น Client Component
```javascript
function EmailTestContent() {
  // main content here
}

export default function EmailTestPage() {
  return <EmailTestContent />;
}
```

## 🎯 ผลลัพธ์
- ✅ ไม่มี Hydration Error อีกต่อไป
- ✅ หน้าโหลดได้อย่างเสถียร
- ✅ การทำงานของระบบทดสอบอีเมลปกติ
- ✅ UI แสดงผลถูกต้องทั้งบน server และ client

## 📝 บทเรียน
1. **หลีกเลี่ยง dynamic values** ใน initial render ที่อาจต่างกันระหว่าง server และ client
2. **ใช้ useEffect** สำหรับ client-only logic
3. **ใช้ Loading state** เพื่อรอให้ client hydration เสร็จ
4. **ทดสอบใน browser console** เพื่อตรวจสอบ hydration warnings

## 🔗 อ้างอิง
- [Next.js Hydration Error Docs](https://nextjs.org/docs/messages/react-hydration-error)
- [React Hydration Best Practices](https://react.dev/reference/react-dom/hydrate)