import { Elysia } from 'elysia';
import postgres from 'postgres';
import { authMiddleware } from '../middleware/auth.js';

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

export const housekeepingRoutes = new Elysia()
  // ดู housekeeping tasks ทั้งหมด
  .get('/housekeeping/tasks', async ({ headers, set, query }) => {
    try {
      const user = await authMiddleware({ headers, set });
      if (user.error) return user;

      const { status = 'all', priority = 'all', assigned_to = 'all' } = query;

      let whereConditions = [];
      let params = [];

      if (status !== 'all') {
        whereConditions.push(`ht.status = $${params.length + 1}`);
        params.push(status);
      }
      if (priority !== 'all') {
        whereConditions.push(`ht.priority = $${params.length + 1}`);
        params.push(priority);
      }
      if (assigned_to !== 'all' && assigned_to !== 'unassigned') {
        whereConditions.push(`ht.assigned_to = $${params.length + 1}`);
        params.push(assigned_to);
      }
      if (assigned_to === 'unassigned') {
        whereConditions.push('ht.assigned_to IS NULL');
      }

      const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

      const tasks = await sql`
        SELECT 
          ht.*,
          rt.name as room_name,
          rt.type as room_type,
          creator.first_name || ' ' || creator.last_name as created_by_name,
          assignee.first_name || ' ' || assignee.last_name as assigned_to_name
        FROM housekeeping_tasks ht
        JOIN room_types rt ON ht.room_id = rt.id
        LEFT JOIN users creator ON ht.created_by = creator.id
        LEFT JOIN users assignee ON ht.assigned_to = assignee.id
        ${whereClause.length > 0 ? sql.unsafe(whereClause) : sql``}
        ORDER BY 
          CASE ht.priority 
            WHEN 'urgent' THEN 1 
            WHEN 'high' THEN 2 
            WHEN 'normal' THEN 3 
            WHEN 'low' THEN 4 
          END,
          ht.created_at DESC
      `;

      return { tasks };
    } catch (error) {
      console.error('Error fetching housekeeping tasks:', error);
      set.status = 500;
      return { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลงาน housekeeping' };
    }
  })

  // สร้าง housekeeping task ใหม่
  .post('/housekeeping/tasks', async ({ headers, set, body }) => {
    try {
      const user = await authMiddleware({ headers, set });
      if (user.error) return user;

      const {
        roomId,
        taskType,
        priority = 'normal',
        description,
        assignedTo,
        estimatedDuration,
        specialInstructions
      } = body;

      const validTaskTypes = ['cleaning', 'maintenance', 'inspection', 'laundry', 'restocking'];
      const validPriorities = ['low', 'normal', 'high', 'urgent'];

      if (!validTaskTypes.includes(taskType)) {
        set.status = 400;
        return { error: 'ประเภทงานไม่ถูกต้อง' };
      }

      if (!validPriorities.includes(priority)) {
        set.status = 400;
        return { error: 'ระดับความสำคัญไม่ถูกต้อง' };
      }

      const task = await sql`
        INSERT INTO housekeeping_tasks (
          room_id, task_type, priority, description, assigned_to,
          estimated_duration, special_instructions, created_by
        ) VALUES (
          ${roomId}, ${taskType}, ${priority}, ${description}, ${assignedTo || null},
          ${estimatedDuration || null}, ${specialInstructions || null}, ${user.id}
        )
        RETURNING *
      `;

      return { 
        success: true, 
        message: 'สร้างงาน housekeeping เรียบร้อยแล้ว',
        task: task[0]
      };

    } catch (error) {
      console.error('Error creating housekeeping task:', error);
      set.status = 500;
      return { error: 'เกิดข้อผิดพลาดในการสร้างงาน housekeeping' };
    }
  })

  // อัปเดต housekeeping task
  .put('/housekeeping/tasks/:taskId', async ({ headers, set, params, body }) => {
    try {
      const user = await authMiddleware({ headers, set });
      if (user.error) return user;

      const {
        status,
        assignedTo,
        priority,
        description,
        estimatedDuration,
        specialInstructions,
        completionNotes,
        actualDuration
      } = body;

      const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
      
      if (status && !validStatuses.includes(status)) {
        set.status = 400;
        return { error: 'สถานะงานไม่ถูกต้อง' };
      }

      // สร้าง dynamic query
      let updateFields = [];
      let values = [];
      
      if (status !== undefined) {
        updateFields.push(`status = $${values.length + 1}`);
        values.push(status);
        
        if (status === 'in_progress') {
          updateFields.push(`started_at = CURRENT_TIMESTAMP`);
        } else if (status === 'completed') {
          updateFields.push(`completed_at = CURRENT_TIMESTAMP`);
        }
      }
      
      if (assignedTo !== undefined) {
        updateFields.push(`assigned_to = $${values.length + 1}`);
        values.push(assignedTo);
      }
      
      if (priority !== undefined) {
        updateFields.push(`priority = $${values.length + 1}`);
        values.push(priority);
      }
      
      if (description !== undefined) {
        updateFields.push(`description = $${values.length + 1}`);
        values.push(description);
      }
      
      if (estimatedDuration !== undefined) {
        updateFields.push(`estimated_duration = $${values.length + 1}`);
        values.push(estimatedDuration);
      }
      
      if (specialInstructions !== undefined) {
        updateFields.push(`special_instructions = $${values.length + 1}`);
        values.push(specialInstructions);
      }
      
      if (completionNotes !== undefined) {
        updateFields.push(`completion_notes = $${values.length + 1}`);
        values.push(completionNotes);
      }
      
      if (actualDuration !== undefined) {
        updateFields.push(`actual_duration = $${values.length + 1}`);
        values.push(actualDuration);
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      
      const queryText = `
        UPDATE housekeeping_tasks 
        SET ${updateFields.join(', ')}
        WHERE id = $${values.length + 1}
        RETURNING *
      `;
      
      values.push(params.taskId);

      const result = await sql.unsafe(queryText, values);

      if (!result.length) {
        set.status = 404;
        return { error: 'ไม่พบงาน housekeeping ที่ระบุ' };
      }

      // หากงานเสร็จสิ้นและเป็นการทำความสะอาด ให้อัปเดตสถานะห้อง
      if (status === 'completed' && result[0].task_type === 'cleaning') {
        await sql`
          UPDATE room_status 
          SET status = 'available',
              last_cleaning = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
          WHERE room_id = ${result[0].room_id}
        `;
      }

      return { 
        success: true, 
        message: 'อัปเดตงาน housekeeping เรียบร้อยแล้ว',
        task: result[0]
      };

    } catch (error) {
      console.error('Error updating housekeeping task:', error);
      set.status = 500;
      return { error: 'เกิดข้อผิดพลาดในการอัปเดตงาน housekeeping' };
    }
  })

  // ลบ housekeeping task
  .delete('/housekeeping/tasks/:taskId', async ({ headers, set, params }) => {
    try {
      const user = await authMiddleware({ headers, set });
      if (user.error) return user;

      const result = await sql`
        DELETE FROM housekeeping_tasks 
        WHERE id = ${params.taskId}
        RETURNING *
      `;

      if (!result.length) {
        set.status = 404;
        return { error: 'ไม่พบงาน housekeeping ที่ระบุ' };
      }

      return { 
        success: true, 
        message: 'ลบงาน housekeeping เรียบร้อยแล้ว'
      };

    } catch (error) {
      console.error('Error deleting housekeeping task:', error);
      set.status = 500;
      return { error: 'เกิดข้อผิดพลาดในการลบงาน housekeeping' };
    }
  })

  // ดู room inspections
  .get('/housekeeping/inspections', async ({ headers, set, query }) => {
    try {
      const user = await authMiddleware({ headers, set });
      if (user.error) return user;

      const { roomId, status = 'all', dateFrom, dateTo } = query;

      let whereConditions = [];
      let params = [];

      if (roomId) {
        whereConditions.push(`ri.room_id = $${params.length + 1}`);
        params.push(roomId);
      }
      
      if (status !== 'all') {
        whereConditions.push(`ri.status = $${params.length + 1}`);
        params.push(status);
      }
      
      if (dateFrom) {
        whereConditions.push(`DATE(ri.inspection_date) >= $${params.length + 1}`);
        params.push(dateFrom);
      }
      
      if (dateTo) {
        whereConditions.push(`DATE(ri.inspection_date) <= $${params.length + 1}`);
        params.push(dateTo);
      }

      const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

      const inspections = await sql`
        SELECT 
          ri.*,
          rt.name as room_name,
          rt.type as room_type,
          inspector.first_name || ' ' || inspector.last_name as inspector_name
        FROM room_inspections ri
        JOIN room_types rt ON ri.room_id = rt.id
        LEFT JOIN users inspector ON ri.inspector_id = inspector.id
        ${whereClause.length > 0 ? sql.unsafe(whereClause) : sql``}
        ORDER BY ri.inspection_date DESC
      `;

      return { inspections };
    } catch (error) {
      console.error('Error fetching room inspections:', error);
      set.status = 500;
      return { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลการตรวจห้อง' };
    }
  })

  // สร้าง room inspection ใหม่
  .post('/housekeeping/inspections', async ({ headers, set, body }) => {
    try {
      const user = await authMiddleware({ headers, set });
      if (user.error) return user;

      const {
        roomId,
        cleanlinessScore,
        maintenanceScore,
        amenitiesScore,
        overallScore,
        notes,
        issuesFound,
        photos,
        status = 'completed'
      } = body;

      const inspection = await sql`
        INSERT INTO room_inspections (
          room_id, inspector_id, cleanliness_score, maintenance_score,
          amenities_score, overall_score, notes, issues_found,
          photos, status, inspection_date
        ) VALUES (
          ${roomId}, ${user.id}, ${cleanlinessScore}, ${maintenanceScore},
          ${amenitiesScore}, ${overallScore}, ${notes || null}, ${issuesFound || null},
          ${photos || null}, ${status}, CURRENT_TIMESTAMP
        )
        RETURNING *
      `;

      return { 
        success: true, 
        message: 'สร้างรายงานการตรวจห้องเรียบร้อยแล้ว',
        inspection: inspection[0]
      };

    } catch (error) {
      console.error('Error creating room inspection:', error);
      set.status = 500;
      return { error: 'เกิดข้อผิดพลาดในการสร้างรายงานการตรวจห้อง' };
    }
  })

  // อัปเดต room inspection
  .put('/housekeeping/inspections/:inspectionId', async ({ headers, set, params, body }) => {
    try {
      const user = await authMiddleware({ headers, set });
      if (user.error) return user;

      const {
        cleanlinessScore,
        maintenanceScore,
        amenitiesScore,
        overallScore,
        notes,
        issuesFound,
        photos,
        status
      } = body;

      const result = await sql`
        UPDATE room_inspections 
        SET cleanliness_score = ${cleanlinessScore},
            maintenance_score = ${maintenanceScore},
            amenities_score = ${amenitiesScore},
            overall_score = ${overallScore},
            notes = ${notes || null},
            issues_found = ${issuesFound || null},
            photos = ${photos || null},
            status = ${status},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${params.inspectionId}
        RETURNING *
      `;

      if (!result.length) {
        set.status = 404;
        return { error: 'ไม่พบรายงานการตรวจห้องที่ระบุ' };
      }

      return { 
        success: true, 
        message: 'อัปเดตรายงานการตรวจห้องเรียบร้อยแล้ว',
        inspection: result[0]
      };

    } catch (error) {
      console.error('Error updating room inspection:', error);
      set.status = 500;
      return { error: 'เกิดข้อผิดพลาดในการอัปเดตรายงานการตรวจห้อง' };
    }
  })

  // สถิติ housekeeping
  .get('/housekeeping/stats', async ({ headers, set, query }) => {
    try {
      const user = await authMiddleware({ headers, set });
      if (user.error) return user;

      const { period = '7' } = query; // default 7 days

      const stats = await sql`
        WITH task_stats AS (
          SELECT 
            COUNT(*) as total_tasks,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tasks,
            COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tasks,
            COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent_tasks
          FROM housekeeping_tasks 
          WHERE created_at >= CURRENT_DATE - INTERVAL '${period} days'
        ),
        inspection_stats AS (
          SELECT 
            COUNT(*) as total_inspections,
            AVG(overall_score) as avg_overall_score,
            AVG(cleanliness_score) as avg_cleanliness_score
          FROM room_inspections 
          WHERE inspection_date >= CURRENT_DATE - INTERVAL '${period} days'
        ),
        room_status_stats AS (
          SELECT 
            COUNT(CASE WHEN status = 'available' THEN 1 END) as available_rooms,
            COUNT(CASE WHEN status = 'occupied' THEN 1 END) as occupied_rooms,
            COUNT(CASE WHEN status = 'cleaning' THEN 1 END) as cleaning_rooms,
            COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance_rooms,
            COUNT(CASE WHEN status = 'out_of_order' THEN 1 END) as out_of_order_rooms
          FROM room_status
        )
        SELECT 
          ts.*,
          ins.*,
          rss.*
        FROM task_stats ts
        CROSS JOIN inspection_stats ins
        CROSS JOIN room_status_stats rss
      `;

      return { stats: stats[0] };
    } catch (error) {
      console.error('Error fetching housekeeping stats:', error);
      set.status = 500;
      return { error: 'เกิดข้อผิดพลาดในการดึงสถิติ housekeeping' };
    }
  });
