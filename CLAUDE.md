# CodeViz Research Context

> **Note**: This file contains research context from CodeViz. Most recent contexts are at the bottom.

---

## Research Query

ทำเป็นภาษาไทยให้หน่อย

*Session: 7451253bdc3cc996b5babdab29503b39 | Generated: 8/12/2025, 6:28:25 PM*

### Analysis Summary

# รายงานการวิเคราะห์ Codebase

## สถาปัตยกรรมระดับสูง

ระบบนี้เป็นแอปพลิเคชันแบบ Full-Stack ที่แบ่งออกเป็นสองส่วนหลัก: **Backend** และ **Frontend** ทั้งสองส่วนทำงานร่วมกันเพื่อให้บริการฟังก์ชันการทำงานของโรงแรม

*   **Backend** ทำหน้าที่เป็น API Server จัดการตรรกะทางธุรกิจ การโต้ตอบกับฐานข้อมูล การยืนยันตัวตน และการอนุญาต
*   **Frontend** เป็นแอปพลิเคชันส่วนติดต่อผู้ใช้ (User Interface) ที่ผู้ใช้โต้ตอบด้วย ซึ่งจะสื่อสารกับ **Backend** ผ่าน API เพื่อดึงและส่งข้อมูล

## ส่วนประกอบ Backend

ส่วนประกอบ **Backend** สร้างขึ้นด้วย Node.js/Bun.js และทำหน้าที่เป็นแกนหลักของตรรกะทางธุรกิจและบริการข้อมูล

*   **วัตถุประสงค์**: จัดการคำขอ API, โต้ตอบกับฐานข้อมูล, จัดการการยืนยันตัวตนและการอนุญาต, และดำเนินการตรรกะทางธุรกิจหลักของแอปพลิเคชัน
*   **ส่วนประกอบภายใน**:
    *   **จุดเริ่มต้น**: แอปพลิเคชันเริ่มต้นจากไฟล์ [index.js](backend/src/index.js) ซึ่งกำหนดค่าเซิร์ฟเวอร์และเส้นทาง
    *   **เลเยอร์ฐานข้อมูล**: ไฟล์ที่เกี่ยวข้องกับฐานข้อมูลทั้งหมดจะอยู่ในไดเรกทอรี [backend/src/db/](backend/src/db/) โดยมี [database.js](backend/src/db/database.js) เป็นไฟล์หลักสำหรับการเชื่อมต่อและดำเนินการกับฐานข้อมูล นอกจากนี้ยังมีไฟล์สำหรับการย้ายข้อมูล (migrations) เช่น [migrate.js](backend/src/db/migrate.js) และสคริปต์การสร้างตารางต่างๆ เช่น [create-notifications-table.js](backend/src/db/create-notifications-table.js)
    *   **เส้นทาง API (API Routes)**: เส้นทาง API ทั้งหมดถูกกำหนดไว้ในไดเรกทอรี [backend/src/routes/](backend/src/routes/) ซึ่งแต่ละไฟล์จะจัดการชุดของปลายทาง API ที่เกี่ยวข้อง ตัวอย่างเช่น [auth.js](backend/src/routes/auth.js) สำหรับการยืนยันตัวตน, [bookings.js](backend/src/routes/bookings.js) สำหรับการจัดการการจอง, และ [admin-rooms.js](backend/src/routes/admin-rooms.js) สำหรับการจัดการห้องพักโดยผู้ดูแลระบบ
    *   **มิดเดิลแวร์ (Middleware)**: มิดเดิลแวร์สำหรับการยืนยันตัวตนและการอนุญาตจะอยู่ใน [backend/src/middleware/auth.js](backend/src/middleware/auth.js) ซึ่งใช้ในการตรวจสอบสิทธิ์คำขอที่เข้ามา
    *   **การตรวจสอบความถูกต้อง (Validation)**: สคีมาการตรวจสอบความถูกต้องของข้อมูลสำหรับคำขอ API ถูกกำหนดไว้ใน [backend/src/schemas/validation.js](backend/src/schemas/validation.js)
*   **ความสัมพันธ์ภายนอก**: **Backend** เปิดเผย RESTful API endpoints ให้กับ **Frontend** และโต้ตอบกับระบบฐานข้อมูลเพื่อจัดเก็บและดึงข้อมูล

## ส่วนประกอบ Frontend

ส่วนประกอบ **Frontend** สร้างขึ้นด้วย Next.js และรับผิดชอบในการแสดงผลส่วนติดต่อผู้ใช้และจัดการการโต้ตอบของผู้ใช้

*   **วัตถุประสงค์**: จัดการส่วนติดต่อผู้ใช้ (UI), การนำทาง, การแสดงข้อมูลที่ดึงมาจาก **Backend** และการจัดการการโต้ตอบของผู้ใช้
*   **ส่วนประกอบภายใน**:
    *   **โครงสร้างแอปพลิเคชัน Next.js**: หน้าเว็บและเลย์เอาต์หลักของแอปพลิเคชันอยู่ในไดเรกทอรี [frontend/app/](frontend/app/) ซึ่งแบ่งออกเป็นไดเรกทอรีย่อยตามคุณสมบัติหรือหน้าต่างๆ เช่น [login/](frontend/app/login/) สำหรับหน้าเข้าสู่ระบบ, [bookings/](frontend/app/bookings/) สำหรับหน้าการจอง, และ [admin/](frontend/app/admin/) สำหรับส่วนผู้ดูแลระบบ
    *   **ส่วนประกอบที่นำกลับมาใช้ใหม่ได้ (Reusable Components)**: ส่วนประกอบ UI ที่นำกลับมาใช้ใหม่ได้จะอยู่ในไดเรกทอรี [frontend/components/](frontend/components/) ตัวอย่างเช่น [Header.jsx](frontend/components/Header.jsx) สำหรับส่วนหัวของหน้า, [RoomCard.jsx](frontend/components/RoomCard.jsx) สำหรับการแสดงข้อมูลห้องพัก, และ [ConfirmModal.jsx](frontend/components/ConfirmModal.jsx) สำหรับโมดอลยืนยัน
    *   **บริบท/การจัดการสถานะ (Contexts/State Management)**: บริบทสำหรับการจัดการสถานะทั่วทั้งแอปพลิเคชันจะอยู่ในไดเรกทอรี [frontend/contexts/](frontend/contexts/) โดยมี [AuthContext.jsx](frontend/contexts/AuthContext.jsx) สำหรับการจัดการสถานะการยืนยันตัวตนของผู้ใช้ และ [NotificationContext.jsx](frontend/contexts/NotificationContext.jsx) สำหรับการจัดการการแจ้งเตือน
    *   **ไคลเอนต์ API (API Client)**: ฟังก์ชันสำหรับการเรียก API ไปยัง **Backend** ถูกกำหนดไว้ใน [frontend/lib/api.js](frontend/lib/api.js)
*   **ความสัมพันธ์ภายนอก**: **Frontend** ใช้ RESTful API endpoints ที่เปิดเผยโดย **Backend** เพื่อดึงและส่งข้อมูล

