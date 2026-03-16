import { Elysia, t } from 'elysia';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export const adminRoomManagementRoutes = new Elysia({ prefix: '/api/admin' })

  // GET global settings
  .get('/global-settings', async ({ headers }) => {
    try {
      // ตรวจสอบ auth token (simple check)
      const authHeader = headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return { error: 'Unauthorized' };
      }

      const result = await pool.query('SELECT * FROM global_settings ORDER BY setting_key');
      return result.rows;
    } catch (error) {
      console.error('Error fetching global settings:', error);
      return { error: 'Failed to fetch global settings' };
    }
  })

  // PUT update specific global setting
  .put('/global-settings/:key', async ({ params, body, headers }) => {
    try {
      // ตรวจสอบ auth token
      const authHeader = headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return { error: 'Unauthorized' };
      }

      const { key } = params;
      const { value } = body;

      // อัปเดต global setting
      await pool.query(
        'UPDATE global_settings SET setting_value = $1, updated_at = CURRENT_TIMESTAMP WHERE setting_key = $2',
        [value, key]
      );

      // ถ้าเป็นการอัปเดตราคาห้อง ให้อัปเดต room_types ด้วย
      if (key === 'room_price_per_night') {
        await pool.query(
          'UPDATE room_types SET price_per_night = $1, updated_at = CURRENT_TIMESTAMP',
          [parseFloat(value)]
        );
      }

      return { success: true, message: 'Setting updated successfully' };
    } catch (error) {
      console.error('Error updating global setting:', error);
      return { error: 'Failed to update setting' };
    }
  }, {
    body: t.Object({
      value: t.String()
    }),
    params: t.Object({
      key: t.String()
    })
  })

  // PUT update room type details (excluding price)
  .put('/room-types/:id', async ({ params, body, headers }) => {
    try {
      // ตรวจสอบ auth token
      const authHeader = headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return { error: 'Unauthorized' };
      }

      const { id } = params;
      const { name, description, max_guests, size_sqm, amenities, type } = body;

      await pool.query(`
        UPDATE room_types 
        SET name = $1, description = $2, max_guests = $3, size_sqm = $4, 
            amenities = $5, type = $6, updated_at = CURRENT_TIMESTAMP
        WHERE id = $7
      `, [name, description, max_guests, size_sqm, amenities, type, id]);

      return { success: true, message: 'Room type updated successfully' };
    } catch (error) {
      console.error('Error updating room type:', error);
      return { error: 'Failed to update room type' };
    }
  }, {
    body: t.Object({
      name: t.String(),
      description: t.Optional(t.String()),
      max_guests: t.Number(),
      size_sqm: t.Optional(t.Number()),
      amenities: t.Optional(t.Array(t.String())),
      type: t.Optional(t.String())
    }),
    params: t.Object({
      id: t.String()
    })
  })

  // GET rooms with details including global price
  .get('/rooms-with-details', async ({ headers }) => {
    try {
      // ตรวจสอบ auth token
      const authHeader = headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return { error: 'Unauthorized' };
      }

      const result = await pool.query(`
        SELECT 
          r.id as room_id,
          r.room_number,
          r.floor,
          r.status,
          rt.id as room_type_id,
          rt.name as room_type_name,
          rt.description as room_type_description,
          rt.max_guests,
          rt.size_sqm,
          rt.amenities,
          rt.images,
          rt.type,
          (SELECT setting_value::DECIMAL FROM global_settings WHERE setting_key = 'room_price_per_night') as price_per_night,
          h.id as hotel_id,
          h.name as hotel_name,
          h.address,
          h.city,
          h.country
        FROM rooms r
        JOIN room_types rt ON r.room_type_id = rt.id
        JOIN hotels h ON r.hotel_id = h.id
        ORDER BY r.room_number
      `);
      return result.rows;
    } catch (error) {
      console.error('Error fetching rooms with details:', error);
      return { error: 'Failed to fetch rooms with details' };
    }
  })

  // POST create new room type
  .post('/room-types', async ({ body, headers }) => {
    try {
      // ตรวจสอบ auth token
      const authHeader = headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return { error: 'Unauthorized' };
      }

      const { hotel_id, name, description, max_guests, size_sqm, amenities, type } = body;
      
      // ดึงราคาปัจจุบันจาก global settings
      const priceResult = await pool.query(
        'SELECT setting_value FROM global_settings WHERE setting_key = $1',
        ['room_price_per_night']
      );
      const globalPrice = priceResult.rows[0]?.setting_value || '1500';

      const result = await pool.query(`
        INSERT INTO room_types (hotel_id, name, description, price_per_night, max_guests, size_sqm, amenities, type)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [hotel_id, name, description, parseFloat(globalPrice), max_guests, size_sqm, amenities, type]);

      return result.rows[0];
    } catch (error) {
      console.error('Error creating room type:', error);
      return { error: 'Failed to create room type' };
    }
  }, {
    body: t.Object({
      hotel_id: t.Number(),
      name: t.String(),
      description: t.Optional(t.String()),
      max_guests: t.Number(),
      size_sqm: t.Optional(t.Number()),
      amenities: t.Optional(t.Array(t.String())),
      type: t.Optional(t.String())
    })
  })

  // DELETE room type
  .delete('/room-types/:id', async ({ params, headers }) => {
    try {
      // ตรวจสอบ auth token
      const authHeader = headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return { error: 'Unauthorized' };
      }

      const { id } = params;

      // ตรวจสอบว่ามีห้องที่ใช้ room type นี้อยู่หรือไม่
      const roomsCheck = await pool.query('SELECT COUNT(*) FROM rooms WHERE room_type_id = $1', [id]);
      if (parseInt(roomsCheck.rows[0].count) > 0) {
        return { 
          error: 'Cannot delete room type that is being used by existing rooms' 
        };
      }

      await pool.query('DELETE FROM room_types WHERE id = $1', [id]);
      return { success: true, message: 'Room type deleted successfully' };
    } catch (error) {
      console.error('Error deleting room type:', error);
      return { error: 'Failed to delete room type' };
    }
  }, {
    params: t.Object({
      id: t.String()
    })
  });