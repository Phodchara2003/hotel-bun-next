// Script to create notifications table
import { createNotificationsTable } from './src/db/create-notifications-table.js';

async function runMigration() {
  await createNotificationsTable();
  process.exit(0);
}

runMigration();
