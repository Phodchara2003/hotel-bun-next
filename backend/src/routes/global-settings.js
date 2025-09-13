import { Pool } from 'pg';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export function globalSettingsRoutes(app) {
  return app
    // GET global settings
    .get('/api/admin/global-settings', async ({ set, headers }) => {
      try {
        // Check admin authentication
        const token = headers.authorization?.replace('Bearer ', '');
        if (!token) {
          set.status = 401;
          return { error: 'Authorization required' };
        }

        const result = await pool.query('SELECT * FROM global_settings ORDER BY setting_key');
        return result.rows;
      } catch (error) {
        console.error('Error fetching global settings:', error);
        set.status = 500;
        return { error: 'Failed to fetch global settings' };
      }
    })

    // PUT update specific global setting
    .put('/api/admin/global-settings/:key', async ({ params, body, set, headers }) => {
      try {
        // Check admin authentication
        const token = headers.authorization?.replace('Bearer ', '');
        if (!token) {
          set.status = 401;
          return { error: 'Authorization required' };
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
        set.status = 500;
        return { error: 'Failed to update setting' };
      }
    })

    // PUT update room type details (excluding price)
    .put('/api/admin/room-types/:id', async ({ params, body, set, headers }) => {
      try {
        // Check admin authentication
        const token = headers.authorization?.replace('Bearer ', '');
        if (!token) {
          set.status = 401;
          return { error: 'Authorization required' };
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
        set.status = 500;
        return { error: 'Failed to update room type' };
      }
    })

    // GET rooms with details including global price
    .get('/api/admin/rooms-with-details', async ({ set, headers }) => {
      try {
        // Check admin authentication
        const token = headers.authorization?.replace('Bearer ', '');
        if (!token) {
          set.status = 401;
          return { error: 'Authorization required' };
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
        set.status = 500;
        return { error: 'Failed to fetch rooms with details' };
      }
    });
}