import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

console.log('Creating Check-in/Check-out system tables...');

try {
  // สร้างตาราง room_status สำหรับติดตามสถานะห้อง
  await sql`
    CREATE TABLE IF NOT EXISTS room_status (
      id SERIAL PRIMARY KEY,
      room_id INTEGER REFERENCES room_types(id) ON DELETE CASCADE,
      status VARCHAR(50) NOT NULL DEFAULT 'available',
      -- available, occupied, maintenance, cleaning, out_of_order
      current_booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
      last_checkout TIMESTAMP,
      last_cleaning TIMESTAMP,
      notes TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(room_id)
    )
  `;
  console.log('✅ Created room_status table');

  // สร้างตาราง check_ins
  await sql`
    CREATE TABLE IF NOT EXISTS check_ins (
      id SERIAL PRIMARY KEY,
      booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
      guest_name VARCHAR(255) NOT NULL,
      guest_phone VARCHAR(20),
      guest_id_number VARCHAR(50),
      guest_id_type VARCHAR(20) DEFAULT 'passport',
      -- passport, national_id, driving_license
      id_document_url TEXT,
      additional_guests INTEGER DEFAULT 0,
      special_requests TEXT,
      arrival_transport VARCHAR(100),
      check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      checked_in_by INTEGER REFERENCES users(id),
      room_key_issued BOOLEAN DEFAULT false,
      welcome_package_given BOOLEAN DEFAULT false,
      deposit_amount DECIMAL(10,2) DEFAULT 0,
      deposit_paid BOOLEAN DEFAULT false,
      status VARCHAR(20) DEFAULT 'checked_in',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  console.log('✅ Created check_ins table');

  // สร้างตาราง check_outs
  await sql`
    CREATE TABLE IF NOT EXISTS check_outs (
      id SERIAL PRIMARY KEY,
      booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
      check_in_id INTEGER REFERENCES check_ins(id) ON DELETE CASCADE,
      actual_checkout_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      late_checkout BOOLEAN DEFAULT false,
      late_checkout_fee DECIMAL(10,2) DEFAULT 0,
      room_condition_notes TEXT,
      damages_reported TEXT,
      damage_charges DECIMAL(10,2) DEFAULT 0,
      minibar_charges DECIMAL(10,2) DEFAULT 0,
      extra_services_charges DECIMAL(10,2) DEFAULT 0,
      total_additional_charges DECIMAL(10,2) DEFAULT 0,
      deposit_returned DECIMAL(10,2) DEFAULT 0,
      final_bill_amount DECIMAL(10,2) DEFAULT 0,
      payment_status VARCHAR(20) DEFAULT 'pending',
      -- pending, paid, partial
      satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
      feedback TEXT,
      checked_out_by INTEGER REFERENCES users(id),
      housekeeping_assigned BOOLEAN DEFAULT false,
      status VARCHAR(20) DEFAULT 'checked_out',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  console.log('✅ Created check_outs table');

  // สร้างตาราง housekeeping_tasks
  await sql`
    CREATE TABLE IF NOT EXISTS housekeeping_tasks (
      id SERIAL PRIMARY KEY,
      room_id INTEGER REFERENCES room_types(id) ON DELETE CASCADE,
      task_type VARCHAR(50) NOT NULL,
      -- cleaning, maintenance, inspection, deep_clean
      priority VARCHAR(20) DEFAULT 'normal',
      -- low, normal, high, urgent
      assigned_to INTEGER REFERENCES users(id),
      description TEXT,
      estimated_duration INTEGER DEFAULT 60, -- minutes
      status VARCHAR(20) DEFAULT 'pending',
      -- pending, in_progress, completed, cancelled
      started_at TIMESTAMP,
      completed_at TIMESTAMP,
      notes TEXT,
      supplies_needed TEXT[],
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  console.log('✅ Created housekeeping_tasks table');

  // สร้างตาราง room_inspections
  await sql`
    CREATE TABLE IF NOT EXISTS room_inspections (
      id SERIAL PRIMARY KEY,
      room_id INTEGER REFERENCES room_types(id) ON DELETE CASCADE,
      inspector_id INTEGER REFERENCES users(id),
      inspection_type VARCHAR(50) DEFAULT 'routine',
      -- routine, checkout, maintenance, deep_clean
      overall_status VARCHAR(20) DEFAULT 'pending',
      -- pending, passed, failed, needs_attention
      cleanliness_score INTEGER CHECK (cleanliness_score >= 1 AND cleanliness_score <= 5),
      amenities_check JSONB, -- {"tv": true, "ac": true, "wifi": true, etc.}
      defects_found TEXT[],
      photos TEXT[],
      repair_needed BOOLEAN DEFAULT false,
      deep_clean_needed BOOLEAN DEFAULT false,
      ready_for_guest BOOLEAN DEFAULT false,
      notes TEXT,
      inspected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  console.log('✅ Created room_inspections table');

  // เพิ่ม indexes สำหรับประสิทธิภาพ
  await sql`CREATE INDEX IF NOT EXISTS idx_room_status_room_id ON room_status(room_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_room_status_status ON room_status(status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_check_ins_booking_id ON check_ins(booking_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_check_outs_booking_id ON check_outs(booking_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_housekeeping_room_id ON housekeeping_tasks(room_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_housekeeping_status ON housekeeping_tasks(status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_inspections_room_id ON room_inspections(room_id)`;
  
  console.log('✅ Created indexes');

  // เพิ่มข้อมูล room_status เริ่มต้นสำหรับห้องที่มีอยู่
  const existingRooms = await sql`
    SELECT id FROM room_types 
    WHERE id NOT IN (SELECT room_id FROM room_status WHERE room_id IS NOT NULL)
  `;

  for (const room of existingRooms) {
    await sql`
      INSERT INTO room_status (room_id, status, updated_at)
      VALUES (${room.id}, 'available', CURRENT_TIMESTAMP)
      ON CONFLICT (room_id) DO NOTHING
    `;
  }
  
  console.log(`✅ Added room_status for ${existingRooms.length} existing rooms`);

  console.log('\n🎉 Check-in/Check-out system database setup completed!');

} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  await sql.end();
}

process.exit(0);
