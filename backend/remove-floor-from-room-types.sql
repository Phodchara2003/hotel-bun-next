-- Remove floor column from room_types table
USE hotel_booking;

-- Check if column exists first
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'hotel_booking' 
AND TABLE_NAME = 'room_types' 
AND COLUMN_NAME = 'floor';

-- Remove floor column from room_types table
ALTER TABLE room_types DROP COLUMN IF EXISTS floor;

-- Verify the column was removed
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'hotel_booking' 
AND TABLE_NAME = 'room_types';