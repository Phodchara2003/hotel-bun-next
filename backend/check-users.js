import { sql } from './src/db/database.js';

async function checkUsersData() {
  try {
    const users = await sql`SELECT * FROM users WHERE id IN (1, 4)`;
    console.log('Users with IDs 1 and 4:');
    console.log(JSON.stringify(users, null, 2));
    
    // Also check if the JOIN query works
    const reviewsWithUsers = await sql`
      SELECT r.*, u.first_name, u.last_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.hotel_id = 1
      ORDER BY r.created_at DESC
      LIMIT 10
    `;
    console.log('\nReviews with user names (LEFT JOIN):');
    console.log(JSON.stringify(reviewsWithUsers, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkUsersData();
