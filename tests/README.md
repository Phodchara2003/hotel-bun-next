# E2E Testing Guide

## การตั้งค่า

1. ติดตั้ง dependencies:
```bash
npm install
```

2. เริ่มทั้ง frontend และ backend:
```bash
# Terminal 1: Backend
cd backend && bun dev

# Terminal 2: Frontend  
cd frontend && npm run dev
```

## การรัน Tests

### รัน Tests ทั้งหมด
```bash
npm run test:e2e
```

### รัน Tests แยกประเภท
```bash
# ทดสอบ Authentication เท่านั้น
npm run test:auth

# ทดสอบ User Management เท่านั้น
npm run test:user

# รันในโหมด Development (browser จะเปิดให้ดู)
npm run test:dev
```

## โครงสร้าง Tests

```
tests/
└── e2e/
    ├── config.js           # การตั้งค่า Puppeteer
    ├── auth.test.js        # ทดสอบระบบ Login/Auth
    ├── user-management.test.js  # ทดสอบหน้าจัดการผู้ใช้
    └── runner.js           # Test Runner หลัก
```

## การทดสอบที่มี

### 🔑 Auth Tests
- [x] Login ด้วย admin credentials
- [x] ตรวจสอบการ redirect หลัง login
- [x] ทดสอบการเข้าถึงหน้าจัดการผู้ใช้

### 👥 User Management Tests  
- [x] โหลดข้อมูลผู้ใช้จาก API
- [x] ทดสอบการค้นหาผู้ใช้
- [x] ทดสอบการ filter ตาม role
- [ ] ทดสอบการสร้างผู้ใช้ใหม่ (ปิดไว้เพื่อป้องกันข้อมูลจริง)

## การปรับแต่ง

### เปลี่ยน Browser Mode
```javascript
// ใน config.js
browser: {
  headless: true,  // true = ไม่แสดง browser, false = แสดง browser
  devtools: false, // true = เปิด DevTools
  slowMo: 0       // ความเร็วในการทำงาน (ms)
}
```

### เพิ่ม Test ใหม่
1. สร้างไฟล์ในโฟลเดอร์ `tests/e2e/`
2. Extend จาก `AuthTests` class
3. เพิ่มใน `runner.js`

## ตัวอย่างการใช้งาน

```javascript
const AuthTests = require('./tests/e2e/auth.test');

const authTests = new AuthTests();
await authTests.testAuthFlow();
```

## หมายเหตุ
- Tests จะเปิด browser และแสดงการทำงานจริง
- ใช้ credentials: `admin@royalgarden.com` / `admin123`
- Browser จะปิดอัตโนมัติหลังจาก test เสร็จ
- สำหรับ CI/CD ให้ set `headless: true`
