import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3003;

// Serve static files
app.use(express.static(__dirname));

// Route สำหรับหน้าทดสอบ
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-complete-system.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`
🧪 ระบบทดสอบโรงแรมวรุณภัฏเริ่มทำงานแล้ว!
🌐 เปิดเบราว์เซอร์ที่: http://localhost:${PORT}
📝 ทดสอบการค้นหาห้องพักและการเชื่อมต่อ API

📋 ขั้นตอนการทดสอบ:
1. เลือกวันที่เข้าพักและออก
2. เลือกจำนวนผู้เข้าพัก (1-2 คน)
3. เลือกประเภทเตียง (ไม่บังคับ)
4. กดปุ่ม "ค้นหาห้องว่าง"
5. ตรวจสอบผลลัพธ์

⚡ หมายเหตุ: Backend Server ต้องทำงานที่ http://localhost:3001
  `);
});

export default app;