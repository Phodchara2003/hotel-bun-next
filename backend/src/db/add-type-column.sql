-- Add type column to room_types table
ALTER TABLE room_types
ADD COLUMN IF NOT EXISTS type VARCHAR(100);

-- Update existing records to have type same as name for now
UPDATE room_types 
SET type = CASE 
  WHEN name LIKE '%Deluxe%' THEN 'Deluxe Room'
  WHEN name LIKE '%Family%' THEN 'Family Room' 
  WHEN name LIKE '%Suite%' THEN 'Executive Suite'
  WHEN name LIKE '%Standard%' THEN 'Standard Room'
  WHEN name LIKE '%Presidential%' THEN 'Presidential Suite'
  ELSE 'Standard Room'
END
WHERE type IS NULL;

-- Display current structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'room_types' 
ORDER BY ordinal_position;
