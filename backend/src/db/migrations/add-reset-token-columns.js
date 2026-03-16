import { Database } from 'bun:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create SQLite database
const dbPath = path.join(__dirname, '..', 'hotel_booking.db');
const db = new Database(dbPath);

console.log('Adding reset token columns to users table...');

try {
  // ตรวจสอบว่า column มีอยู่แล้วหรือไม่
  const checkColumns = db.prepare("PRAGMA table_info(users)").all();
  const hasResetToken = checkColumns.some(col => col.name === 'reset_token');
  const hasResetTokenExpires = checkColumns.some(col => col.name === 'reset_token_expires');
  
  if (!hasResetToken) {
    db.exec(`ALTER TABLE users ADD COLUMN reset_token TEXT`);
    console.log('✅ Added reset_token column');
  } else {
    console.log('ℹ️ reset_token column already exists');
  }
  
  if (!hasResetTokenExpires) {
    db.exec(`ALTER TABLE users ADD COLUMN reset_token_expires DATETIME`);
    console.log('✅ Added reset_token_expires column');
  } else {
    console.log('ℹ️ reset_token_expires column already exists');
  }
  
  console.log('🎉 Database migration completed successfully!');
  
} catch (error) {
  console.error('❌ Migration failed:', error);
} finally {
  db.close();
}
