import { Elysia } from 'elysia';
import postgres from 'postgres';
import { authMiddleware } from '../middleware/auth.js';

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

export const checkinRoutes = new Elysia()
  // ดูสถานะห้องทั้งหมด
  .get('/rooms/status', async ({ headers, set }) => {
    try {
      const user = await authMiddleware({ headers, set });
      if (user.error) return user;

      const roomsStatus = await sql`
        SELECT 
          rt.id,
          rt.name,
          rt.type,
          rt.max_guests,
          rt.price_per_night,
          rs.status,
          rs.last_checkout,
          rs.last_cleaning,
          rs.notes,
          rs.updated_at,
          b.id as current_booking_id,
          b.check_in_date,
          b.check_out_date,
          COALESCE(u.first_name || ' ' || u.last_name, 'ไม่ระบุ') as guest_name
        FROM room_types rt
        LEFT JOIN room_status rs ON rt.id = rs.room_id
        LEFT JOIN bookings b ON rs.current_booking_id = b.id
        LEFT JOIN users u ON b.user_id = u.id
        ORDER BY rt.name
      `;

      return { rooms: roomsStatus };
    } catch (error) {
      console.error('Error fetching room status:', error);
      set.status = 500;
      return { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลสถานะห้อง' };
    }
  })

  // ดูการจองที่พร้อม check-in วันนี้
  .get('/check-ins/pending', async ({ headers, set }) => {
    try {
      const user = await authMiddleware({ headers, set });
      if (user.error) return user;

      const today = new Date().toISOString().split('T')[0];
      
      const pendingCheckins = await sql`
        SELECT 
          b.id,
          b.booking_reference,
          b.check_in_date,
          b.check_out_date,
          b.total_price,
          b.special_requests,
          rt.name as room_name,
          rt.type as room_type,
          u.first_name,
          u.last_name,
          u.email,
          u.phone,
          ci.id as check_in_id
        FROM bookings b
        JOIN room_types rt ON b.room_type_id = rt.id
        JOIN users u ON b.user_id = u.id
        LEFT JOIN check_ins ci ON b.id = ci.booking_id
        WHERE DATE(b.check_in_date) = ${today}
          AND b.status = 'confirmed'
          AND ci.id IS NULL
        ORDER BY b.check_in_date
      `;

      return { pendingCheckins };
    } catch (error) {
      console.error('Error fetching pending check-ins:', error);
      set.status = 500;
      return { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลการ check-in' };
    }
  })

  // ทำการ check-in
  .post('/check-in', async ({ headers, set, body }) => {
    try {
      const user = await authMiddleware({ headers, set });
      if (user.error) return user;

      const {
        bookingId,
        guestName,
        guestPhone,
        guestIdNumber,
        guestIdType = 'passport',
        idDocumentUrl,
        additionalGuests = 0,
        specialRequests,
        arrivalTransport,
        depositAmount = 0,
        depositPaid = false,
        roomKeyIssued = false,
        welcomePackageGiven = false
      } = body;

      // ตรวจสอบการจองและอัปเดตสถานะ
      const booking = await sql`
        SELECT b.*, rt.id as room_id, rt.name as room_name
        FROM bookings b
        JOIN room_types rt ON b.room_type_id = rt.id
        WHERE b.id = ${bookingId} AND b.status = 'confirmed'
      `;

      if (!booking.length) {
        set.status = 404;
        return { error: 'ไม่พบการจองหรือการจองไม่ได้รับการยืนยัน' };
      }

      const roomId = booking[0].room_id;

      await sql.begin(async sql => {
        // สร้างข้อมูล check-in
        const checkIn = await sql`
          INSERT INTO check_ins (
            booking_id, guest_name, guest_phone, guest_id_number, guest_id_type,
            id_document_url, additional_guests, special_requests, arrival_transport,
            deposit_amount, deposit_paid, room_key_issued, welcome_package_given,
            checked_in_by, check_in_time
          ) VALUES (
            ${bookingId}, ${guestName}, ${guestPhone}, ${guestIdNumber}, ${guestIdType},
            ${idDocumentUrl}, ${additionalGuests}, ${specialRequests}, ${arrivalTransport},
            ${depositAmount}, ${depositPaid}, ${roomKeyIssued}, ${welcomePackageGiven},
            ${user.id}, CURRENT_TIMESTAMP
          )
          RETURNING *
        `;

        // อัปเดตสถานะห้อง
        await sql`
          UPDATE room_status 
          SET status = 'occupied', 
              current_booking_id = ${bookingId},
              updated_at = CURRENT_TIMESTAMP
          WHERE room_id = ${roomId}
        `;

        // อัปเดตสถานะการจอง
        await sql`
          UPDATE bookings 
          SET status = 'checked_in',
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ${bookingId}
        `;

        return checkIn[0];
      });

      return { 
        success: true, 
        message: 'Check-in สำเร็จ',
        roomName: booking[0].room_name
      };

    } catch (error) {
      console.error('Error during check-in:', error);
      set.status = 500;
      return { error: 'เกิดข้อผิดพลาดในการ check-in' };
    }
  })

  // ดูการจองที่พร้อม check-out วันนี้
  .get('/check-outs/pending', async ({ headers, set }) => {
    try {
      const user = await authMiddleware({ headers, set });
      if (user.error) return user;

      const today = new Date().toISOString().split('T')[0];
      
      const pendingCheckouts = await sql`
        SELECT 
          b.id,
          b.booking_reference,
          b.check_in_date,
          b.check_out_date,
          b.total_price,
          rt.name as room_name,
          rt.type as room_type,
          ci.guest_name,
          ci.guest_phone,
          ci.check_in_time,
          ci.deposit_amount,
          ci.deposit_paid,
          co.id as check_out_id
        FROM bookings b
        JOIN room_types rt ON b.room_type_id = rt.id
        JOIN check_ins ci ON b.id = ci.booking_id
        LEFT JOIN check_outs co ON ci.id = co.check_in_id
        WHERE DATE(b.check_out_date) = ${today}
          AND b.status = 'checked_in'
          AND co.id IS NULL
        ORDER BY b.check_out_date
      `;

      return { pendingCheckouts };
    } catch (error) {
      console.error('Error fetching pending check-outs:', error);
      set.status = 500;
      return { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลการ check-out' };
    }
  })

  // ทำการ check-out
  .post('/check-out', async ({ headers, set, body }) => {
    try {
      const user = await authMiddleware({ headers, set });
      if (user.error) return user;

      const {
        bookingId,
        checkInId,
        lateCheckout = false,
        lateCheckoutFee = 0,
        roomConditionNotes,
        damagesReported,
        damageCharges = 0,
        minibarCharges = 0,
        extraServicesCharges = 0,
        satisfactionRating,
        feedback,
        housekeepingAssigned = true
      } = body;

      const totalAdditionalCharges = parseFloat(lateCheckoutFee) + 
                                   parseFloat(damageCharges) + 
                                   parseFloat(minibarCharges) + 
                                   parseFloat(extraServicesCharges);

      // ดึงข้อมูลการจองและ check-in
      const bookingInfo = await sql`
        SELECT 
          b.*, rt.id as room_id, rt.name as room_name,
          ci.deposit_amount, ci.deposit_paid
        FROM bookings b
        JOIN room_types rt ON b.room_type_id = rt.id
        JOIN check_ins ci ON b.id = ci.booking_id
        WHERE b.id = ${bookingId} AND ci.id = ${checkInId}
      `;

      if (!bookingInfo.length) {
        set.status = 404;
        return { error: 'ไม่พบข้อมูลการจองหรือ check-in' };
      }

      const { room_id, deposit_amount, deposit_paid } = bookingInfo[0];
      const depositReturned = deposit_paid ? Math.max(0, deposit_amount - totalAdditionalCharges) : 0;
      const finalBillAmount = Math.max(0, totalAdditionalCharges - (deposit_paid ? deposit_amount : 0));

      await sql.begin(async sql => {
        // สร้างข้อมูล check-out
        await sql`
          INSERT INTO check_outs (
            booking_id, check_in_id, late_checkout, late_checkout_fee,
            room_condition_notes, damages_reported, damage_charges,
            minibar_charges, extra_services_charges, total_additional_charges,
            deposit_returned, final_bill_amount, satisfaction_rating, feedback,
            checked_out_by, housekeeping_assigned, actual_checkout_time
          ) VALUES (
            ${bookingId}, ${checkInId}, ${lateCheckout}, ${lateCheckoutFee},
            ${roomConditionNotes}, ${damagesReported}, ${damageCharges},
            ${minibarCharges}, ${extraServicesCharges}, ${totalAdditionalCharges},
            ${depositReturned}, ${finalBillAmount}, ${satisfactionRating}, ${feedback},
            ${user.id}, ${housekeepingAssigned}, CURRENT_TIMESTAMP
          )
        `;

        // อัปเดตสถานะห้อง
        await sql`
          UPDATE room_status 
          SET status = 'cleaning',
              current_booking_id = NULL,
              last_checkout = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
          WHERE room_id = ${room_id}
        `;

        // อัปเดตสถานะการจอง
        await sql`
          UPDATE bookings 
          SET status = 'completed',
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ${bookingId}
        `;

        // สร้าง housekeeping task อัตโนมัติ
        if (housekeepingAssigned) {
          await sql`
            INSERT INTO housekeeping_tasks (
              room_id, task_type, priority, description, created_by
            ) VALUES (
              ${room_id}, 'cleaning', 'normal', 
              'ทำความสะอาดห้องหลัง check-out - ${bookingInfo[0].room_name}',
              ${user.id}
            )
          `;
        }
      });

      return { 
        success: true, 
        message: 'Check-out สำเร็จ',
        roomName: bookingInfo[0].room_name,
        depositReturned,
        finalBillAmount,
        additionalCharges: totalAdditionalCharges
      };

    } catch (error) {
      console.error('Error during check-out:', error);
      set.status = 500;
      return { error: 'เกิดข้อผิดพลาดในการ check-out' };
    }
  })

  // อัปเดตสถานะห้อง
  .put('/rooms/:roomId/status', async ({ headers, set, params, body }) => {
    try {
      const user = await authMiddleware({ headers, set });
      if (user.error) return user;

      const { status, notes } = body;
      const validStatuses = ['available', 'occupied', 'maintenance', 'cleaning', 'out_of_order'];
      
      if (!validStatuses.includes(status)) {
        set.status = 400;
        return { error: 'สถานะห้องไม่ถูกต้อง' };
      }

      await sql`
        UPDATE room_status 
        SET status = ${status},
            notes = ${notes || null},
            updated_at = CURRENT_TIMESTAMP
        WHERE room_id = ${params.roomId}
      `;

      // หากเปลี่ยนเป็น available ให้อัปเดต last_cleaning
      if (status === 'available') {
        await sql`
          UPDATE room_status 
          SET last_cleaning = CURRENT_TIMESTAMP
          WHERE room_id = ${params.roomId}
        `;
      }

      return { 
        success: true, 
        message: `อัปเดตสถานะห้องเป็น ${status} เรียบร้อยแล้ว` 
      };

    } catch (error) {
      console.error('Error updating room status:', error);
      set.status = 500;
      return { error: 'เกิดข้อผิดพลาดในการอัปเดตสถานะห้อง' };
    }
  });
