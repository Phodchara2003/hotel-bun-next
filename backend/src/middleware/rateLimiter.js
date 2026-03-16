// Simple in-memory rate limiter
// key: "prefix:ip" → { count, windowStart, windowMs }
const store = new Map();

// Cleanup expired entries every 2 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of store.entries()) {
    if (now - record.windowStart > record.windowMs) {
      store.delete(key);
    }
  }
}, 120_000);

function getClientIp(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

function check(ip, prefix, windowMs, max, set) {
  const key = `${prefix}:${ip}`;
  const now = Date.now();
  const record = store.get(key);

  if (!record || now - record.windowStart > windowMs) {
    store.set(key, { count: 1, windowStart: now, windowMs });
    return;
  }

  record.count++;
  if (record.count > max) {
    const retryAfter = Math.ceil((record.windowStart + windowMs - now) / 1000);
    set.status = 429;
    set.headers['Retry-After'] = String(retryAfter);
    return {
      error: 'Too Many Requests',
      message: 'คำขอมากเกินไป กรุณาลองใหม่ภายหลัง',
      retryAfter,
    };
  }
}

/**
 * Rate limiter middleware for Elysia
 *
 * Auth endpoints  : 10 req / 60s per IP
 * All other API   : 200 req / 60s per IP
 */
export function rateLimiter() {
  return (app) =>
    app.onBeforeHandle({ as: 'global' }, ({ request, set }) => {
      const ip = getClientIp(request);
      const path = new URL(request.url).pathname;

      const isAuthPath =
        path.includes('/auth/') ||
        path.endsWith('/login') ||
        path.endsWith('/register') ||
        path.includes('/forgot-password') ||
        path.includes('/reset-password');

      if (isAuthPath) {
        return check(ip, 'auth', 60_000, 10, set);
      }

      return check(ip, 'api', 60_000, 200, set);
    });
}
