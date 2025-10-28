# 🚀 Production Deployment Configuration

## การกำหนดพอร์ตสำหรับ Production Server

### พอร์ตที่กำหนด:
- **Frontend (Next.js)**: พอร์ต `3680`
- **Backend (Bun/Elysia)**: พอร์ต `5680`

### ไฟล์ที่ถูกอัปเดต:

#### Backend Configuration:
1. `backend/.env` - เปลี่ยน PORT เป็น 5680
2. `backend/.env.production` - สร้างไฟล์ใหม่สำหรับ production
3. `backend/server.js` - ใช้ PORT จาก environment variable

#### Frontend Configuration:
1. `frontend/.env.local` - อัปเดต API URLs และ Site URL
2. `frontend/.env.production` - สร้างไฟล์ใหม่สำหรับ production
3. `frontend/package.json` - เปลี่ยน scripts ให้ใช้พอร์ต 3680
4. `frontend/next.config.js` - อัปเดต default API URL

### วิธีการรัน Production Server:

#### วิธีที่ 1: ใช้ Script อัตโนมัติ
```powershell
# PowerShell
.\start-production.ps1

# หรือ Command Prompt
start-production.bat
```

#### วิธีที่ 2: รันแยกแต่ละส่วน

**Backend:**
```powershell
cd backend
bun run server.js
```

**Frontend:**
```powershell
cd frontend
npm run build
npm run start
```

### การตรวจสอบ:
- Frontend: http://localhost:3680
- Backend: http://localhost:5680
- Backend Health Check: http://localhost:5680/health

### หมายเหตุ:
- ตรวจสอบให้แน่ใจว่าฐานข้อมูล PostgreSQL ทำงานอยู่
- ตรวจสอบการตั้งค่า Email SMTP
- สำหรับ production จริง ควรใช้ domain name แทน localhost
- อย่าลืมเปิดพอร์ต 3680 และ 5680 ใน Firewall หากจำเป็น

### Security Notes:
- เปลี่ยน JWT_SECRET ใน production จริง
- ใช้ Environment Variables แทนการเก็บข้อมูลลับในไฟล์
- กำหนด CORS อย่างเหมาะสมสำหรับ production domain