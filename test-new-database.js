// Simple database connection test
import postgres from 'postgres';

const DATABASE_URL = 'postgresql://neondb_owner:npg_dr8IAjq1xoQD@ep-curly-wind-a1564pc2-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

console.log('🔄 ทดสอบการเชื่อมต่อฐานข้อมูลใหม่...');
console.log('📍 Database URL:', DATABASE_URL.replace(/:[^:@]*@/, ':****@'));

const sql = postgres(DATABASE_URL, { 
  ssl: 'require',
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10
});

async function testConnection() {
  try {
    console.log('📡 กำลังทดสอบการเชื่อมต่อ...');
    
    const result = await sql`SELECT NOW() as current_time, version() as db_version`;
    
    console.log('✅ เชื่อมต่อฐานข้อมูลสำเร็จ!');
    console.log('⏰ เวลาปัจจุบัน:', result[0].current_time);
    console.log('🗄️ เวอร์ชัน:', result[0].db_version);
    
    // ตรวจสอบตารางที่มีอยู่
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    
    console.log('\n📋 ตารางที่มีอยู่ในฐานข้อมูล:');
    if (tables.length === 0) {
      console.log('   ไม่มีตาราง - ฐานข้อมูลว่างเปล่า');
    } else {
      tables.forEach((table, index) => {
        console.log(`   ${index + 1}. ${table.table_name}`);
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการเชื่อมต่อ:', error.message);
    return false;
  } finally {
    await sql.end();
  }
}

testConnection();