import { Database } from 'bun:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create SQLite database connection
const dbPath = path.join(__dirname, 'backend', 'src', 'hotel_booking.db');
const db = new Database(dbPath);

console.log('🔍 ตรวจสอบโครงสร้างฐานข้อมูล');
console.log('='.repeat(50));

try {
  // ตรวจสอบตาราง users
  console.log('\n📋 โครงสร้างตาราง users:');
  const usersInfo = db.prepare("PRAGMA table_info(users)").all();
  usersInfo.forEach(col => {
    console.log(`   ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
  });

  // ตรวจสอบตาราง bookings
  console.log('\n📋 โครงสร้างตาราง bookings:');
  const bookingsInfo = db.prepare("PRAGMA table_info(bookings)").all();
  if (bookingsInfo.length > 0) {
    bookingsInfo.forEach(col => {
      console.log(`   ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
    });
  } else {
    console.log('   ❌ ไม่พบตาราง bookings');
  }

  // แสดงตารางทั้งหมด
  console.log('\n📋 ตารางทั้งหมดในฐานข้อมูล:');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  tables.forEach(table => {
    console.log(`   📊 ${table.name}`);
  });

} catch (error) {
  console.error('❌ เกิดข้อผิดพลาด:', error.message);
}
