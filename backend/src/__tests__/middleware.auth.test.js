import { describe, it, expect } from 'bun:test';
import { generateToken } from '../utils/auth.js';
import { authMiddleware, requireAdmin, requireStaff } from '../middleware/auth.js';

/**
 * Build a minimal Elysia-style request context.
 * `set` is the response object Elysia passes in; middleware writes status to set.status.
 */
const ctx = (token) => ({
  headers: { authorization: token ? `Bearer ${token}` : undefined },
  set: { status: 200 },
});

// ─── authMiddleware ───────────────────────────────────────────────────────────

describe('authMiddleware', () => {
  it('returns 401 when Authorization header is absent', async () => {
    const c = ctx(null);
    const result = await authMiddleware(c);
    expect(c.set.status).toBe(401);
    expect(result).toMatchObject({ error: expect.any(String) });
  });

  it('returns 401 when header does not start with Bearer', async () => {
    const c = { headers: { authorization: 'Basic abc' }, set: { status: 200 } };
    const result = await authMiddleware(c);
    expect(c.set.status).toBe(401);
  });

  it('returns 401 for a malformed token', async () => {
    const c = ctx('this.is.garbage');
    const result = await authMiddleware(c);
    expect(c.set.status).toBe(401);
  });

  it('falls back to token claims when DB is unavailable', async () => {
    // The postgres connection will fail (no real DB in test env).
    // authMiddleware must catch the DB error and return token claims.
    const payload = { id: 99, email: 'fallback@test.com', role: 'user' };
    const token = generateToken(payload);
    const c = ctx(token);
    const result = await authMiddleware(c);

    expect(c.set.status).toBe(200); // no auth error
    expect(result.id).toBe(99);
    expect(result.email).toBe('fallback@test.com');
    expect(result.role).toBe('user');
  });
});

// ─── requireAdmin ─────────────────────────────────────────────────────────────

describe('requireAdmin', () => {
  it('returns 403 for a plain user', async () => {
    const c = ctx(generateToken({ id: 1, email: 'u@u.com', role: 'user' }));
    const result = await requireAdmin(c);
    expect(c.set.status).toBe(403);
    expect(result.error).toMatch(/admin/i);
  });

  it('returns 403 for staff role', async () => {
    const c = ctx(generateToken({ id: 2, email: 's@s.com', role: 'staff' }));
    const result = await requireAdmin(c);
    expect(c.set.status).toBe(403);
  });

  it('allows admin role', async () => {
    const c = ctx(generateToken({ id: 3, email: 'a@a.com', role: 'admin' }));
    const result = await requireAdmin(c);
    expect(result.role).toBe('admin');
  });

  it('allows super_admin role', async () => {
    const c = ctx(generateToken({ id: 4, email: 'sa@a.com', role: 'super_admin' }));
    const result = await requireAdmin(c);
    expect(result.role).toBe('super_admin');
  });
});

// ─── requireStaff ─────────────────────────────────────────────────────────────

describe('requireStaff', () => {
  it('returns 403 for a plain user', async () => {
    const c = ctx(generateToken({ id: 1, email: 'u@u.com', role: 'user' }));
    const result = await requireStaff(c);
    expect(c.set.status).toBe(403);
  });

  it.each(['staff', 'admin', 'super_admin', 'manager'])(
    'allows %s role',
    async (role) => {
      const c = ctx(generateToken({ id: 10, email: 'x@x.com', role }));
      const result = await requireStaff(c);
      expect(result.role).toBe(role);
    }
  );
});
