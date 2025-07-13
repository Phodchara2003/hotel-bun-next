-- Add additional columns to room_types table for better room management
ALTER TABLE room_types
ADD COLUMN IF NOT EXISTS amenities TEXT[],
ADD COLUMN IF NOT EXISTS image TEXT,
ADD COLUMN IF NOT EXISTS available BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS beds INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update existing room_types with default values
UPDATE room_types 
SET 
  amenities = ARRAY['wifi', 'aircon', 'tv']::TEXT[],
  image = 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
  available = true,
  beds = 1,
  created_at = CURRENT_TIMESTAMP,
  updated_at = CURRENT_TIMESTAMP
WHERE amenities IS NULL OR image IS NULL;

-- Add some sample room data if not exists
INSERT INTO room_types (hotel_id, name, type, capacity, price, description, amenities, image, available, beds, created_at, updated_at)
SELECT 
  h.id,
  'Deluxe Room 201',
  'Deluxe Room',
  4,
  3500.00,
  'ห้องพักระดับดีลักซ์ พร้อมวิวสวนสวย และสิ่งอำนวยความสะดวกครบครัน',
  ARRAY['wifi', 'aircon', 'tv', 'minibar', 'breakfast']::TEXT[],
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
  true,
  2,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM hotels h
WHERE NOT EXISTS (
  SELECT 1 FROM room_types rt WHERE rt.name = 'Deluxe Room 201'
)
LIMIT 1;

INSERT INTO room_types (hotel_id, name, type, capacity, price, description, amenities, image, available, beds, created_at, updated_at)
SELECT 
  h.id,
  'Family Suite 301',
  'Family Room',
  6,
  4500.00,
  'ห้องสำหรับครอบครัว ขนาดใหญ่ สะดวกสบาย เหมาะสำหรับกลุ่มใหญ่',
  ARRAY['wifi', 'aircon', 'tv', 'minibar', 'breakfast', 'parking']::TEXT[],
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
  true,
  3,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM hotels h
WHERE NOT EXISTS (
  SELECT 1 FROM room_types rt WHERE rt.name = 'Family Suite 301'
)
LIMIT 1;

INSERT INTO room_types (hotel_id, name, type, capacity, price, description, amenities, image, available, beds, created_at, updated_at)
SELECT 
  h.id,
  'Presidential Suite 401',
  'Presidential Suite',
  8,
  8000.00,
  'ห้องพักระดับประธานาธิบดี หรูหรา พร้อมสิ่งอำนวยความสะดวกระดับพรีเมียม',
  ARRAY['wifi', 'aircon', 'tv', 'minibar', 'breakfast', 'parking', 'room_service']::TEXT[],
  'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
  true,
  4,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM hotels h
WHERE NOT EXISTS (
  SELECT 1 FROM room_types rt WHERE rt.name = 'Presidential Suite 401'
)
LIMIT 1;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_room_types_available ON room_types (available);
CREATE INDEX IF NOT EXISTS idx_room_types_type ON room_types (type);
CREATE INDEX IF NOT EXISTS idx_room_types_price ON room_types (price);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_room_types_updated_at ON room_types;
CREATE TRIGGER update_room_types_updated_at
    BEFORE UPDATE ON room_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Display results
SELECT 
    rt.id,
    rt.name,
    rt.type,
    rt.capacity,
    rt.price,
    rt.available,
    rt.amenities,
    h.name as hotel_name
FROM room_types rt
JOIN hotels h ON rt.hotel_id = h.id
ORDER BY rt.type, rt.name;
