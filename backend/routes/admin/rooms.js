const { Router } = require('express');
const { Pool } = require('pg');

const router = Router();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// GET global settings
router.get('/global-settings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM global_settings ORDER BY setting_key');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching global settings:', error);
    res.status(500).json({ error: 'Failed to fetch global settings' });
  }
});

// PUT update specific global setting
router.put('/global-settings/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

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

    res.json({ success: true, message: 'Setting updated successfully' });
  } catch (error) {
    console.error('Error updating global setting:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

// GET room types with current global price
router.get('/room-types', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        rt.*,
        (SELECT setting_value::DECIMAL FROM global_settings WHERE setting_key = 'room_price_per_night') as current_global_price
      FROM room_types rt 
      ORDER BY rt.id
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching room types:', error);
    res.status(500).json({ error: 'Failed to fetch room types' });
  }
});

// PUT update room type details (excluding price)
router.put('/room-types/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, max_guests, size_sqm, amenities, type, bed_type } = req.body;

    await pool.query(`
      UPDATE room_types 
      SET name = $1, description = $2, max_guests = $3, size_sqm = $4, 
          amenities = $5, type = $6, bed_type = $7, updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
    `, [name, description, max_guests, size_sqm, amenities, type, bed_type || 'single', id]);

    res.json({ success: true, message: 'Room type updated successfully' });
  } catch (error) {
    console.error('Error updating room type:', error);
    res.status(500).json({ error: 'Failed to update room type' });
  }
});

// GET rooms with details including global price
router.get('/rooms-with-details', async (req, res) => {
  try {
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
        rt.bed_type,
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
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching rooms with details:', error);
    res.status(500).json({ error: 'Failed to fetch rooms with details' });
  }
});

// POST create new room type
router.post('/room-types', async (req, res) => {
  try {
    const { hotel_id, name, description, max_guests, size_sqm, amenities, type, bed_type } = req.body;
    
    // ดึงราคาปัจจุบันจาก global settings
    const priceResult = await pool.query(
      'SELECT setting_value FROM global_settings WHERE setting_key = $1',
      ['room_price_per_night']
    );
    const globalPrice = priceResult.rows[0]?.setting_value || '1500';

    const result = await pool.query(`
      INSERT INTO room_types (hotel_id, name, description, price_per_night, max_guests, size_sqm, amenities, type, bed_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [hotel_id, name, description, parseFloat(globalPrice), max_guests, size_sqm, amenities, type, bed_type || 'single']);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating room type:', error);
    res.status(500).json({ error: 'Failed to create room type' });
  }
});

// DELETE room type
router.delete('/room-types/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // ตรวจสอบว่ามีห้องที่ใช้ room type นี้อยู่หรือไม่
    const roomsCheck = await pool.query('SELECT COUNT(*) FROM rooms WHERE room_type_id = $1', [id]);
    if (parseInt(roomsCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete room type that is being used by existing rooms' 
      });
    }

    await pool.query('DELETE FROM room_types WHERE id = $1', [id]);
    res.json({ success: true, message: 'Room type deleted successfully' });
  } catch (error) {
    console.error('Error deleting room type:', error);
    res.status(500).json({ error: 'Failed to delete room type' });
  }
});

module.exports = router;