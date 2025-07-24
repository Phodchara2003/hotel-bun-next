-- Migration: Add room status and management fields
-- File: add-room-status-fields.sql

ALTER TABLE rooms ADD COLUMN IF NOT EXISTS room_number VARCHAR(10) UNIQUE;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS floor INTEGER DEFAULT 1;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS building VARCHAR(5) DEFAULT 'A';
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'available';
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS current_guest_id INTEGER;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS last_checkout TIMESTAMP;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS next_checkin TIMESTAMP;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS last_maintenance TIMESTAMP;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS next_maintenance TIMESTAMP;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS maintenance_notes TEXT;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS view_type VARCHAR(20) DEFAULT 'city';
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS bed_type VARCHAR(20) DEFAULT 'queen';
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS bed_count INTEGER DEFAULT 1;

-- Add check constraint for status
ALTER TABLE rooms ADD CONSTRAINT check_room_status 
CHECK (status IN ('available', 'occupied', 'maintenance', 'cleaning', 'blocked', 'out_of_order'));

-- Add check constraint for view_type
ALTER TABLE rooms ADD CONSTRAINT check_view_type 
CHECK (view_type IN ('sea', 'garden', 'city', 'pool', 'mountain', 'courtyard'));

-- Add check constraint for bed_type
ALTER TABLE rooms ADD CONSTRAINT check_bed_type 
CHECK (bed_type IN ('single', 'twin', 'double', 'queen', 'king', 'sofa_bed'));

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_rooms_floor ON rooms(floor);
CREATE INDEX IF NOT EXISTS idx_rooms_room_number ON rooms(room_number);

-- Create room_status_history table for tracking changes
CREATE TABLE IF NOT EXISTS room_status_history (
    id SERIAL PRIMARY KEY,
    room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    changed_by INTEGER REFERENCES users(id),
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create housekeeping_tasks table
CREATE TABLE IF NOT EXISTS housekeeping_tasks (
    id SERIAL PRIMARY KEY,
    room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
    task_type VARCHAR(50) NOT NULL, -- 'cleaning', 'maintenance', 'inspection'
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
    assigned_to INTEGER REFERENCES users(id),
    estimated_duration INTEGER, -- minutes
    actual_duration INTEGER, -- minutes
    description TEXT,
    notes TEXT,
    checklist JSONB, -- JSON array of checklist items
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for housekeeping_tasks
CREATE INDEX IF NOT EXISTS idx_housekeeping_room_id ON housekeeping_tasks(room_id);
CREATE INDEX IF NOT EXISTS idx_housekeeping_status ON housekeeping_tasks(status);
CREATE INDEX IF NOT EXISTS idx_housekeeping_assigned_to ON housekeeping_tasks(assigned_to);

-- Update existing rooms with room numbers if not set
UPDATE rooms 
SET room_number = LPAD((100 + id)::text, 3, '0')
WHERE room_number IS NULL;

-- Update existing rooms with default status
UPDATE rooms 
SET status = 'available'
WHERE status IS NULL;
