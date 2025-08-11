import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function createPaymentSettingsTable() {
  try {
    console.log('Creating payment_settings table...');
    
    // Create payment_settings table
    await sql`
      CREATE TABLE IF NOT EXISTS payment_settings (
        id SERIAL PRIMARY KEY,
        qr_code_url TEXT,
        bank_name VARCHAR(255),
        account_number VARCHAR(50),
        account_name VARCHAR(255),
        instructions TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    console.log('✅ payment_settings table created successfully');
    
    // Insert default payment settings if table is empty
    const existing = await sql`SELECT COUNT(*) as count FROM payment_settings`;
    
    if (existing[0].count === '0') {
      await sql`
        INSERT INTO payment_settings (
          bank_name, 
          account_number, 
          account_name, 
          instructions
        ) VALUES (
          'ธนาคารกรุงเทพ',
          '123-4-56789-0',
          'Royal Garden Hotel',
          'กรุณาโอนเงินตามจำนวนที่ระบุ และอัปโหลดหลักฐานการโอนเงิน'
        )
      `;
      
      console.log('✅ Default payment settings inserted');
    }
    
    console.log('✅ Payment settings table created successfully');
  } catch (error) {
    console.error('❌ Error creating payment_settings table:', error);
  } finally {
    await sql.end();
  }
}

// Auto-run when imported
createPaymentSettingsTable();
