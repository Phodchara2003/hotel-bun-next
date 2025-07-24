import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require'
});

// สร้างตาราง user_email_settings
export const createUserEmailSettingsTable = async () => {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS user_email_settings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider VARCHAR(50) NOT NULL DEFAULT 'gmail',
        email VARCHAR(255) NOT NULL,
        app_password TEXT,
        smtp_host VARCHAR(255) DEFAULT 'smtp.gmail.com',
        smtp_port INTEGER DEFAULT 587,
        is_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id)
      )
    `;
    
    console.log('✅ user_email_settings table created successfully');
  } catch (error) {
    console.error('❌ Error creating user_email_settings table:', error);
  }
};

// Auto-run when imported
createUserEmailSettingsTable();
