# Hotel Booking System

ระบบจองโรงแรมออนไลน์ที่สมบูรณ์แบบ พัฒนาด้วย Bun + Elysia (Backend) และ Next.js (Frontend) พร้อมฐานข้อมูล Neon PostgreSQL

## 🏗️ โครงสร้างโปรเจกต์

```
hotel bun next/
├── backend/          # Bun + Elysia API Server
│   ├── src/
│   │   ├── db/       # Database setup & migrations
│   │   ├── routes/   # API routes
│   │   ├── middleware/ # Auth middleware
│   │   ├── schemas/  # Validation schemas
│   │   └── utils/    # Utility functions
│   └── package.json
│
└── frontend/         # Next.js Frontend
    ├── app/          # App Router (Next.js 13+)
    ├── components/   # React Components
    ├── contexts/     # React Contexts
    ├── lib/          # Utility libraries
    └── package.json
```

## 🚀 คุณสมบัติหลัก

### Frontend (Next.js)
- ✅ หน้าแรกพร้อมระบบค้นหา
- ✅ ระบบสมัครสมาชิก/เข้าสู่ระบบ
- ✅ ค้นหาและแสดงรายการโรงแรม
- ✅ รายละเอียดโรงแรมและห้องพัก
- ✅ ระบบจองห้องพัก
- ✅ จัดการการจองของผู้ใช้
- ✅ Responsive Design
- ✅ Dark/Light Mode Support

### Backend (Bun + Elysia)
- ✅ RESTful API
- ✅ Authentication & Authorization (JWT)
- ✅ User Management
- ✅ Hotel & Room Management
- ✅ Booking System
- ✅ Search & Filter
- ✅ API Documentation (Swagger)

### Database (Neon PostgreSQL)
- ✅ Users Table
- ✅ Hotels Table
- ✅ Room Types Table
- ✅ Rooms Table
- ✅ Bookings Table
- ✅ Reviews Table

## 📋 ข้อกำหนดระบบ

- **Node.js** >= 18.0.0
- **Bun** >= 1.0.0
- **PostgreSQL** (Neon Database)

## 🛠️ การติดตั้งและการใช้งาน

### 1. Clone Repository

```bash
git clone <repository-url>
cd "hotel bun next"
```

### 2. ติดตั้ง Backend

```bash
cd backend
bun install
```

### 3. ตั้งค่า Environment Variables

สร้างไฟล์ `.env` ในโฟลเดอร์ backend:

```env
# Database Configuration (Neon PostgreSQL)
DATABASE_URL=postgresql://username:password@host.neon.tech/database_name?sslmode=require

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

### 4. รัน Database Migration

```bash
bun run db:migrate
```

### 5. เริ่มต้น Backend Server

```bash
bun run dev
```

Backend จะทำงานที่ `http://localhost:3001`

### 6. ติดตั้ง Frontend

เปิด Terminal ใหม่:

```bash
cd frontend
npm install
```

### 7. ตั้งค่า Environment Variables สำหรับ Frontend

สร้างไฟล์ `.env.local` ในโฟลเดอร์ frontend:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 8. เริ่มต้น Frontend Server

```bash
npm run dev
```

Frontend จะทำงานที่ `http://localhost:3000`

## 📚 API Documentation

เมื่อ Backend Server ทำงานแล้ว สามารถดู API Documentation ได้ที่:
`http://localhost:3001/swagger`

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - สมัครสมาชิก
- `POST /api/auth/login` - เข้าสู่ระบบ

### Hotels
- `GET /api/hotels` - ดูรายการโรงแรม
- `GET /api/hotels/:id` - ดูรายละเอียดโรงแรม
- `GET /api/hotels/search/availability` - ค้นหาห้องพักว่าง

### Bookings
- `POST /api/bookings` - สร้างการจอง
- `GET /api/bookings` - ดูการจองของผู้ใช้
- `GET /api/bookings/:id` - ดูรายละเอียดการจอง
- `PUT /api/bookings/:id/cancel` - ยกเลิกการจอง

## 🗄️ Database Schema

### Users
- id, email, password, first_name, last_name, phone, role, created_at, updated_at

### Hotels
- id, name, description, address, city, country, rating, images, amenities, created_at, updated_at

### Room Types
- id, hotel_id, name, description, price_per_night, max_guests, size_sqm, amenities, images

### Rooms
- id, hotel_id, room_type_id, room_number, floor, status

### Bookings
- id, user_id, hotel_id, room_type_id, check_in_date, check_out_date, guests, total_price, status, special_requests, booking_reference

### Reviews
- id, user_id, hotel_id, booking_id, rating, comment, created_at

## 🎨 UI Components

- **Header** - Navigation และ User Menu
- **SearchBox** - ค้นหาโรงแรม
- **HotelCard** - แสดงข้อมูลโรงแรมในรูปแบบ Card
- **BookingForm** - ฟอร์มจองห้องพัก
- **AuthForms** - ฟอร์มเข้าสู่ระบบและสมัครสมาชิก

## 🔒 Security Features

- JWT Authentication
- Password Hashing (bcrypt)
- Input Validation (Zod)
- CORS Protection
- SQL Injection Prevention

## 📱 Responsive Design

- Mobile-first approach
- Tailwind CSS
- Dark mode support
- Touch-friendly interface

## 🚀 Deployment

### Backend Deployment
1. Deploy ไปยัง Railway, Render หรือ Vercel
2. ตั้งค่า Environment Variables
3. Run Database Migration

### Frontend Deployment
1. Deploy ไปยัง Vercel, Netlify หรือ Railway
2. ตั้งค่า NEXT_PUBLIC_API_URL

## 🤝 Contributing

1. Fork repository
2. สร้าง feature branch
3. Commit changes
4. Push branch
5. สร้าง Pull Request

## 📄 License

MIT License

## 👨‍💻 Developer

พัฒนาโดย: Your Name
Email: your.email@example.com
