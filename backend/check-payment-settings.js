import { sql } from './src/db/database.js';

console.log('🔍 Checking payment settings in database...');

try {
  // Check if table exists and get current settings
  const settings = await sql`
    SELECT * FROM simple_payment_settings 
    ORDER BY updated_at DESC 
    LIMIT 1
  `;
  
  console.log('📊 Raw settings data:', settings.length);
  
  if (settings.length > 0) {
    console.log('🔍 Raw settings field:', settings[0].settings);
    
    // Parse the JSON string
    const parsedSettings = typeof settings[0].settings === 'string' 
      ? JSON.parse(settings[0].settings) 
      : settings[0].settings;
    
    console.log('🔍 Parsed Settings:', JSON.stringify(parsedSettings, null, 2));
    console.log('🔍 Bank Image URL:', parsedSettings.bankInfo?.bankImageUrl);
  } else {
    console.log('❌ No settings found in database');
  }
  
} catch (error) {
  console.error('❌ Error:', error);
}

process.exit(0);
