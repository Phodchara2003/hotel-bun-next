import { Elysia } from 'elysia';
import postgres from 'postgres';
import { authMiddleware } from '../../middleware/auth.js';

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

export const permissionRoutes = new Elysia()
  // ดูสิทธิ์ทั้งหมด
  .get('/permissions', async ({ headers, set }) => {
    try {
      const user = await authMiddleware({ headers, set });
      if (user.error) return user;

      // ตรวจสอบสิทธิ์
      const hasPermission = await sql`
        SELECT 1 FROM user_permissions up
        JOIN permissions p ON up.permission_id = p.id
        WHERE up.user_id = ${user.id} AND p.name = 'users_manage_permissions'
      `;

      if (!hasPermission.length && user.role !== 'super_admin') {
        set.status = 403;
        return { error: 'ไม่มีสิทธิ์ในการจัดการสิทธิ์ผู้ใช้' };
      }

      const permissions = await sql`
        SELECT id, name, description, category
        FROM permissions
        ORDER BY category, name
      `;

      return { permissions };
    } catch (error) {
      console.error('Error fetching permissions:', error);
      set.status = 500;
      return { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลสิทธิ์' };
    }
  })

  // ดูสิทธิ์ของผู้ใช้คนหนึ่ง
  .get('/users/:userId/permissions', async ({ headers, set, params }) => {
    try {
      const user = await authMiddleware({ headers, set });
      if (user.error) return user;

      const hasPermission = await sql`
        SELECT 1 FROM user_permissions up
        JOIN permissions p ON up.permission_id = p.id
        WHERE up.user_id = ${user.id} AND p.name = 'users_manage_permissions'
      `;

      if (!hasPermission.length && user.role !== 'super_admin') {
        set.status = 403;
        return { error: 'ไม่มีสิทธิ์ในการดูสิทธิ์ผู้ใช้' };
      }

      const userPermissions = await sql`
        SELECT p.id, p.name, p.description, p.category,
               up.granted_at, 
               COALESCE(g.first_name || ' ' || g.last_name, 'ระบบ') as granted_by_name
        FROM permissions p
        LEFT JOIN user_permissions up ON p.id = up.permission_id AND up.user_id = ${params.userId}
        LEFT JOIN users g ON up.granted_by = g.id
        ORDER BY p.category, p.name
      `;

      return { permissions: userPermissions };
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      set.status = 500;
      return { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลสิทธิ์ผู้ใช้' };
    }
  })

  // อัปเดตสิทธิ์ของผู้ใช้
  .put('/users/:userId/permissions', async ({ headers, set, params, body }) => {
    try {
      const user = await authMiddleware({ headers, set });
      if (user.error) return user;

      const hasPermission = await sql`
        SELECT 1 FROM user_permissions up
        JOIN permissions p ON up.permission_id = p.id
        WHERE up.user_id = ${user.id} AND p.name = 'users_manage_permissions'
      `;

      if (!hasPermission.length && user.role !== 'super_admin') {
        set.status = 403;
        return { error: 'ไม่มีสิทธิ์ในการจัดการสิทธิ์ผู้ใช้' };
      }

      const { permissionIds = [] } = body;

      // ตรวจสอบว่าผู้ใช้ที่จะแก้ไขมีอยู่จริง
      const targetUser = await sql`
        SELECT id, role FROM users WHERE id = ${params.userId}
      `;

      if (!targetUser.length) {
        set.status = 404;
        return { error: 'ไม่พบผู้ใช้ที่ระบุ' };
      }

      // ป้องกันการแก้ไขสิทธิ์ของ super_admin
      if (targetUser[0].role === 'super_admin' && user.role !== 'super_admin') {
        set.status = 403;
        return { error: 'ไม่สามารถแก้ไขสิทธิ์ของ Super Admin ได้' };
      }

      await sql.begin(async sql => {
        // ลบสิทธิ์เก่าทั้งหมด
        await sql`
          DELETE FROM user_permissions 
          WHERE user_id = ${params.userId}
        `;

        // เพิ่มสิทธิ์ใหม่
        if (permissionIds.length > 0) {
          for (const permissionId of permissionIds) {
            await sql`
              INSERT INTO user_permissions (user_id, permission_id, granted_by)
              VALUES (${params.userId}, ${permissionId}, ${user.id})
            `;
          }
        }
      });

      return { success: true, message: 'อัปเดตสิทธิ์ผู้ใช้เรียบร้อยแล้ว' };
    } catch (error) {
      console.error('Error updating user permissions:', error);
      set.status = 500;
      return { error: 'เกิดข้อผิดพลาดในการอัปเดตสิทธิ์ผู้ใช้' };
    }
  })

  // ดูรายชื่อผู้ใช้ทั้งหมดพร้อมสิทธิ์
  .get('/users-with-permissions', async ({ headers, set }) => {
    try {
      const user = await authMiddleware({ headers, set });
      if (user.error) return user;

      const hasPermission = await sql`
        SELECT 1 FROM user_permissions up
        JOIN permissions p ON up.permission_id = p.id
        WHERE up.user_id = ${user.id} AND p.name IN ('users_view', 'users_manage_permissions')
      `;

      if (!hasPermission.length && user.role !== 'super_admin') {
        set.status = 403;
        return { error: 'ไม่มีสิทธิ์ในการดูข้อมูลผู้ใช้' };
      }

      const users = await sql`
        SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.created_at,
               COUNT(up.permission_id) as permission_count
        FROM users u
        LEFT JOIN user_permissions up ON u.id = up.user_id
        GROUP BY u.id, u.email, u.first_name, u.last_name, u.role, u.created_at
        ORDER BY u.created_at DESC
      `;

      return { users };
    } catch (error) {
      console.error('Error fetching users with permissions:', error);
      set.status = 500;
      return { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้' };
    }
  });
