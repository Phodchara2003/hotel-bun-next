import { createTables, insertSampleData } from './database.js';

const runMigration = async () => {
  try {
    console.log('🚀 Starting database migration...');
    
    await createTables();
    await insertSampleData();
    
    console.log('✅ Database migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

runMigration();
