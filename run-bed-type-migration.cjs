const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/hotel_booking'
});

async function runMigration() {
  try {
    console.log('🚀 Running bed_type field migration...');
    
    // ทtest database connection
    console.log('Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully');
    
    // อ่านไฟล์ SQL migration
    const migrationPath = path.join(__dirname, 'add-bed-type-field.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // แยก SQL statements
    const allStatements = migrationSQL.split(';').map(stmt => stmt.trim());
    console.log('All statements after split:', allStatements);
    
    const statements = allStatements
      .filter(stmt => {
        const trimmed = stmt.trim();
        console.log('Checking statement:', trimmed.substring(0, 50), '...');
        console.log('Contains ALTER:', trimmed.toUpperCase().includes('ALTER'));
        return trimmed.length > 0 && trimmed.toLowerCase() !== 'commit';
      });
    
    console.log('Filtered statements:', statements);
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const rawStatement = statements[i];
      
      // ลบ comment และ whitespace ออก
      const cleanStatement = rawStatement
        .split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n')
        .trim();
      
      if (!cleanStatement) continue;
      
      console.log(`\n${i + 1}. Executing: ${cleanStatement.substring(0, 50)}...`);
      
      try {
        const result = await pool.query(cleanStatement);
        console.log(`   ✅ Success${result.rows && result.rows.length > 0 ? ` (${result.rows.length} rows affected)` : ''}`);
        
        // แสดงผลลัพธ์ถ้าเป็น SELECT
        if (result.rows && result.rows.length > 0 && cleanStatement.toUpperCase().includes('SELECT')) {
          result.rows.forEach(row => {
            console.log(`      ${JSON.stringify(row)}`);
          });
        }
      } catch (error) {
        if (error.message.includes('already exists') || error.message.includes('column "bed_type" of relation "room_types" already exists')) {
          console.log(`   ⚠️  Warning: ${error.message}`);
        } else {
          console.log(`   ❌ Error: ${error.message}`);
          console.log(`   Full SQL: ${cleanStatement}`);
        }
      }
    }
    
    console.log('\n🎉 Migration completed!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await pool.end();
  }
}

runMigration();