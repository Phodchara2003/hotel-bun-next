-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT '',
  photos JSONB DEFAULT '[]',
  is_verified_stay BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create review_reports table for inappropriate content reporting
CREATE TABLE IF NOT EXISTS review_reports (
  id SERIAL PRIMARY KEY,
  review_id INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason VARCHAR(100) NOT NULL,
  description TEXT DEFAULT '',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected')),
  admin_notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP WITH TIME ZONE NULL,
  reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reviews_hotel_id ON reviews(hotel_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_review_reports_status ON review_reports(status);

-- Add review columns to hotels table
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.0;

-- Insert some sample reviews (only if no reviews exist)
INSERT INTO reviews (user_id, hotel_id, rating, comment, photos, is_verified_stay, created_at)
SELECT 
  u.id,
  h.id,
  CASE 
    WHEN random() < 0.3 THEN 5
    WHEN random() < 0.6 THEN 4
    WHEN random() < 0.8 THEN 3
    ELSE 2
  END,
  CASE 
    WHEN random() < 0.2 THEN 'โรงแรมสุดยอดมาก! พนักงานบริการดีเยี่ยม ห้องพักสะอาด อาหารอร่อย แนะนำเลยครับ 👍'
    WHEN random() < 0.4 THEN 'โดยรวมดีมาก สถานที่สวย วิวสวยมาก แต่อาจจะมีเสียงรบกวนนิดหน่อยตอนกลางคืน'
    WHEN random() < 0.6 THEN 'พักมาหลายครั้งแล้ว ประทับใจทุกครั้ง บริการสุดยอด สิ่งอำนวยความสะดวกครบครัน 🏨✨'
    WHEN random() < 0.8 THEN 'ห้องพักโอเค ราคาเหมาะสม แต่อาหารเช้าควรปรับปรุงให้หลากหลายมากกว่านี้'
    ELSE 'สระว่ายน้ำสวยมาก ห้องพักกว้างขวาง พนักงานน่ารัก จะกลับมาพักอีกแน่นอน 🏊‍♀️'
  END,
  CASE 
    WHEN random() < 0.3 THEN '["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400"]'
    ELSE '[]'
  END::jsonb,
  random() > 0.5,
  NOW() - INTERVAL '1 day' * (random() * 30)::int
FROM users u, hotels h
WHERE u.role = 'user' 
  AND NOT EXISTS (SELECT 1 FROM reviews WHERE user_id = u.id AND hotel_id = h.id)
  AND random() < 0.7  -- Only create reviews for 70% of user-hotel combinations
LIMIT 10;

-- Update hotel ratings and review counts
UPDATE hotels SET 
  review_count = (SELECT COUNT(*) FROM reviews WHERE hotel_id = hotels.id),
  average_rating = COALESCE((SELECT ROUND(AVG(rating::numeric), 2) FROM reviews WHERE hotel_id = hotels.id), 0.0);
