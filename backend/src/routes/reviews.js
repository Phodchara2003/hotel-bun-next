import { Elysia } from 'elysia';
import { sql } from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { NotificationService } from '../utils/notificationService.js';

// สร้าง instance ของ NotificationService
const notificationService = new NotificationService();

export const reviewRoutes = new Elysia({ prefix: '/reviews' })

  // ดึงรีวิวของโรงแรม (ไม่ต้องการ auth)
  .get('/hotel/:hotelId', async ({ params, query, set }) => {
    try {
      console.log('🔍 Review route hit - hotel reviews request for hotelId:', params.hotelId);
      const hotelId = parseInt(params.hotelId);
      const page = parseInt(query.page) || 1;
      const limit = parseInt(query.limit) || 10;
      const sortBy = query.sortBy || 'newest';
      const filterRating = query.rating ? parseInt(query.rating) : null;

      console.log(`📖 Getting reviews for hotel ${hotelId}, page ${page}, limit ${limit}`);

      // Base query สำหรับดึงรีวิว
      let baseWhere = sql`WHERE r.hotel_id = ${hotelId} AND r.is_approved = true`;
      
      // เพิ่มฟิลเตอร์คะแนนถ้ามี
      if (filterRating) {
        baseWhere = sql`WHERE r.hotel_id = ${hotelId} AND r.is_approved = true AND r.rating = ${filterRating}`;
      }

      // กำหนดการเรียงลำดับ
      let orderBy = sql`ORDER BY r.created_at DESC`;
      switch (sortBy) {
        case 'oldest':
          orderBy = sql`ORDER BY r.created_at ASC`;
          break;
        case 'highest':
          orderBy = sql`ORDER BY r.rating DESC, r.created_at DESC`;
          break;
        case 'lowest':
          orderBy = sql`ORDER BY r.rating ASC, r.created_at DESC`;
          break;
      }

      // ดึงรีวิว
      const reviews = await sql`
        SELECT 
          r.id, r.rating, r.comment, r.photos, r.is_verified_stay,
          r.created_at, r.updated_at,
          u.first_name, u.last_name
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        ${baseWhere}
        ${orderBy}
        LIMIT ${limit} OFFSET ${(page - 1) * limit}
      `;

      // นับจำนวนรีวิวทั้งหมด
      const countResult = await sql`
        SELECT COUNT(*) as count 
        FROM reviews r 
        ${baseWhere}
      `;
      
      const total = parseInt(countResult[0].count);
      const totalPages = Math.ceil(total / limit);

      // สถิติรีวิว
      const statsResult = await sql`
        SELECT 
          AVG(rating) as average_rating,
          COUNT(*) as total_reviews,
          COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
          COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
          COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
          COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
          COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star,
          COUNT(CASE WHEN is_verified_stay = true THEN 1 END) as verified_stays
        FROM reviews r
        WHERE r.hotel_id = ${hotelId} AND r.is_approved = true
      `;

      const stats = statsResult[0];

      // จัดรูปแบบข้อมูลรีวิว
      const formattedReviews = reviews.map(review => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        photos: typeof review.photos === 'string' ? JSON.parse(review.photos) : review.photos,
        isVerifiedStay: review.is_verified_stay,
        createdAt: review.created_at,
        updatedAt: review.updated_at,
        user: {
          firstName: review.first_name,
          lastName: review.last_name
        }
      }));

      return {
        success: true,
        data: {
          reviews: formattedReviews,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems: total,
            itemsPerPage: limit,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          },
          statistics: {
            averageRating: parseFloat(stats.average_rating || 0).toFixed(1),
            totalReviews: parseInt(stats.total_reviews),
            ratingDistribution: {
              5: parseInt(stats.five_star),
              4: parseInt(stats.four_star),
              3: parseInt(stats.three_star),
              2: parseInt(stats.two_star),
              1: parseInt(stats.one_star)
            },
            verifiedStays: parseInt(stats.verified_stays)
          }
        }
      };

    } catch (error) {
      console.error('❌ Error getting hotel reviews:', error);
      set.status = 500;
      return { error: 'ไม่สามารถดึงรีวิวได้' };
    }
  })

  // สร้างรีวิวใหม่
  .post('/', async ({ body, headers, set }) => {
    try {
      // Manual auth check
      const authUser = await authMiddleware({ headers, set });
      if (!authUser || authUser.error) {
        return authUser || { error: 'Authentication required' };
      }
      
      const authHeader = headers.authorization;
      const token = authHeader?.substring(7);

      if (!token) {
        set.status = 401;
        return { error: 'Access token required' };
      }

      // ใช้ user ที่ได้จาก authMiddleware
      const user = authUser;

      const { hotelId, rating, comment, photos = [], bookingId } = body;

      // Validation
      if (!hotelId || !rating) {
        set.status = 400;
        return { error: 'ต้องระบุ hotelId และ rating' };
      }

      if (rating < 1 || rating > 5) {
        set.status = 400;
        return { error: 'คะแนนต้องอยู่ระหว่าง 1-5' };
      }

      // ตรวจสอบว่าโรงแรมมีอยู่จริง
      const hotel = await sql`SELECT id, name FROM hotels WHERE id = ${hotelId}`;
      if (hotel.length === 0) {
        set.status = 404;
        return { error: 'ไม่พบโรงแรมที่ระบุ' };
      }

      // ตรวจสอบว่าผู้ใช้เคยรีวิวโรงแรมนี้แล้วหรือไม่
      const existingReview = await sql`
        SELECT id FROM reviews WHERE user_id = ${user.id} AND hotel_id = ${hotelId}
      `;

      if (existingReview.length > 0) {
        set.status = 400;
        return { error: 'คุณได้รีวิวโรงแรมนี้แล้ว สามารถแก้ไขรีวิวเดิมได้' };
      }

      // สร้างรีวิว
      const review = await sql`
        INSERT INTO reviews (
          user_id, hotel_id, booking_id, rating, comment, photos, 
          is_verified_stay, created_at
        ) VALUES (
          ${user.id}, ${hotelId}, ${bookingId || null}, ${rating}, 
          ${comment || ''}, ${JSON.stringify(photos)}, 
          ${bookingId ? true : false}, NOW()
        ) RETURNING id, created_at
      `;

      // อัปเดตคะแนนเฉลี่ยของโรงแรม
      await updateHotelRating(hotelId);

      return {
        success: true,
        message: 'สร้างรีวิวสำเร็จ',
        review: {
          id: review[0].id,
          rating,
          comment: comment || '',
          isVerifiedStay: bookingId ? true : false,
          createdAt: review[0].created_at
        }
      };

    } catch (error) {
      console.error('❌ Error creating review:', error);
      set.status = 500;
      return { error: 'ไม่สามารถสร้างรีวิวได้' };
    }
  })

  // ดึงรีวิวของผู้ใช้
  .get('/user/:userId', async ({ params, set }) => {
    try {
      const userId = parseInt(params.userId);

      const reviews = await sql`
        SELECT 
          r.id, r.rating, r.comment, r.photos, r.is_verified_stay,
          r.created_at, r.updated_at,
          h.id as hotel_id, h.name as hotel_name
        FROM reviews r
        JOIN hotels h ON r.hotel_id = h.id
        WHERE r.user_id = ${userId}
        ORDER BY r.created_at DESC
      `;

      const formattedReviews = reviews.map(review => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        photos: typeof review.photos === 'string' ? JSON.parse(review.photos) : review.photos,
        isVerifiedStay: review.is_verified_stay,
        createdAt: review.created_at,
        updatedAt: review.updated_at,
        hotel: {
          id: review.hotel_id,
          name: review.hotel_name
        }
      }));

      return {
        success: true,
        data: formattedReviews
      };

    } catch (error) {
      console.error('❌ Error getting user reviews:', error);
      set.status = 500;
      return { error: 'ไม่สามารถดึงรีวิวของผู้ใช้ได้' };
    }
  });

// ฟังก์ชันอัปเดตคะแนนเฉลี่ยของโรงแรม
async function updateHotelRating(hotelId) {
  try {
    const stats = await sql`
      SELECT 
        AVG(rating) as avg_rating,
        COUNT(*) as review_count
      FROM reviews 
      WHERE hotel_id = ${hotelId} AND is_approved = true
    `;

    await sql`
      UPDATE hotels 
      SET 
        average_rating = ${parseFloat(stats[0].avg_rating || 0).toFixed(2)},
        review_count = ${parseInt(stats[0].review_count)}
      WHERE id = ${hotelId}
    `;

    console.log(`✅ Updated hotel ${hotelId} rating: ${parseFloat(stats[0].avg_rating || 0).toFixed(2)}`);
  } catch (error) {
    console.error('❌ Error updating hotel rating:', error);
  }
}
