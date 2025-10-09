-- Add room_id field to bookings table for room assignment
-- This allows storing the specific room assigned to each booking

-- Add room_id column to bookings table if it doesn't exist
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.columns 
    WHERE table_schema = DATABASE() 
    AND table_name = 'bookings' 
    AND column_name = 'room_id'
);

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE bookings ADD COLUMN room_id INT NULL, ADD INDEX idx_bookings_room_id (room_id)',
    'SELECT "room_id column already exists" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add current_booking_id column to rooms table if it doesn't exist  
SET @col_exists2 = (
    SELECT COUNT(*) 
    FROM information_schema.columns 
    WHERE table_schema = DATABASE() 
    AND table_name = 'rooms' 
    AND column_name = 'current_booking_id'
);

SET @sql2 = IF(@col_exists2 = 0, 
    'ALTER TABLE rooms ADD COLUMN current_booking_id INT NULL, ADD INDEX idx_rooms_current_booking_id (current_booking_id)',
    'SELECT "current_booking_id column already exists" as message'
);

PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- Show table structure
SHOW COLUMNS FROM bookings;
SHOW COLUMNS FROM rooms;