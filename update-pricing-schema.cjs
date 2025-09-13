const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_dr8IAjq1xoQD@ep-curly-wind-a1564pc2-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

async function updateSchema() {
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    const sql = fs.readFileSync('update-uniform-pricing-schema.sql', 'utf8');
    await client.query(sql);
    
    console.log('✅ Schema updated successfully');
    
    // ตรวจสอบผลลัพธ์
    const result = await client.query('SELECT setting_key, setting_value FROM global_settings WHERE setting_key = $1', ['room_price_per_night']);
    console.log('📊 Current room price:', result.rows[0]);
    
    // ตรวจสอบ room types
    const roomTypes = await client.query('SELECT id, name, price_per_night FROM room_types ORDER BY id');
    console.log('📋 Room types with prices:');
    roomTypes.rows.forEach(room => {
      console.log(`  - ${room.name}: ${room.price_per_night} THB`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

updateSchema();