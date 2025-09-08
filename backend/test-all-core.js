/**
 * Quick API smoke test for core endpoints.
 * Run while backend server is running on port 3002.
 * Usage: bun run test-all-core.js
 */

const BASE = process.env.BASE_URL || 'http://localhost:3002';

async function req(method, path, { body, token, expectStatus, name }) {
  const url = path.startsWith('http') ? path : BASE + path;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  let res, data, ok=false, status=0, error=null;
  const started = Date.now();
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    status = res.status;
    const text = await res.text();
  let original;
  try { original = text ? JSON.parse(text) : {}; } catch { original = { raw: text }; }
  data = sanitize(original);
  // Extract JWT if present
  const jwtFromBody = typeof original === 'object' && original?.token ? original.token : null;
    ok = expectStatus ? status === expectStatus : res.ok;
    if (!ok) error = original?.error || original?.message || JSON.stringify(original).slice(0,200);
  return { name, method, path, status, ok, ms: Date.now()-started, error, sample: data, raw: original, token: jwtFromBody };
  } catch (e) {
    error = e.message;
  return { name, method, path, status, ok, ms: Date.now()-started, error };
  }
}

function sanitize(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const clone = Array.isArray(obj) ? obj.slice(0,3) : { ...obj };
  if (Array.isArray(clone)) return clone.map(o=>sanitize(o));
  for (const k of Object.keys(clone)) {
    if (typeof clone[k] === 'string' && clone[k].length > 120) clone[k] = clone[k].slice(0,117)+'...';
    if (Array.isArray(clone[k])) clone[k] = clone[k].slice(0,3);
  }
  return clone;
}

async function ensureAdminToken() {
  // Attempt login with known seeded admin
  const adminEmail = 'admin@hotel.com';
  const adminPass = 'admin123';
  const r = await req('POST', '/api/auth/login', { body: { email: adminEmail, password: adminPass }, name: 'auth.login(admin)' });
  if (r.ok && (r.token || r.raw?.token || r.sample?.token)) return { token: r.token || r.raw?.token || r.sample?.token, loginResult: r };
  return { token: null, loginResult: r };
}

async function ensureTestUser() {
  const email = `apitest_${Date.now()}@example.com`;
  const password = 'test1234';
  const reg = await req('POST', '/api/auth/register', { body: { email, password, firstName: 'API', lastName: 'Test' }, name: 'auth.register(testUser)' });
  let login;
  if (reg.ok) {
    login = await req('POST', '/api/auth/login', { body: { email, password }, name: 'auth.login(testUser)' });
  }
  return { email, password, reg, login, token: login?.token || login?.raw?.token || login?.sample?.token || null };
}

async function main() {
  const results = [];

  // Public / health
  results.push(await req('GET','/health', { name: 'root.health' }));
  results.push(await req('GET','/api/health', { name: 'api.health' }));

  // Admin token
  const { token: adminToken, loginResult } = await ensureAdminToken();
  results.push(loginResult);

  // Test user for non-admin endpoints
  const testUser = await ensureTestUser();
  results.push(testUser.reg, testUser.login);

  const userToken = testUser.token;

  if (userToken) {
    results.push(await req('GET','/api/auth/validate', { name: 'auth.validate(user)', token: userToken }));
    results.push(await req('GET','/api/profile', { name: 'profile.get(user)', token: userToken }));
    results.push(await req('GET','/api/notifications?limit=5', { name: 'notifications.list(user)', token: userToken }));
  }

  if (adminToken) {
    results.push(await req('GET','/api/admin/users?limit=5', { name: 'admin.users.list', token: adminToken }));
    results.push(await req('GET','/api/bookings/admin/all?limit=5', { name: 'admin.bookings.list', token: adminToken }));
    results.push(await req('GET','/api/admin/', { name: 'admin.payment.settings(real)', token: adminToken }));
    results.push(await req('GET','/api/admin/payment-settings', { name: 'admin.payment.settings(simple)', token: adminToken }));
  } else {
    results.push({ name: 'admin.tests', ok: false, status: 0, error: 'Admin login failed; admin endpoints skipped' });
  }

  // Public-ish endpoints
  results.push(await req('GET','/api/hotels', { name: 'hotels.list' }));
  results.push(await req('GET','/api/simple-payment-settings', { name: 'payment.settings.public' }));
  results.push(await req('GET','/api/room-status', { name: 'room-status.list' }));

  // Summarize
  const pass = results.filter(r=>r?.ok).length;
  const fail = results.filter(r=>!r?.ok).length;

  console.log('\n===== API SMOKE TEST RESULTS =====');
  for (const r of results) {
    if (!r) continue;
    console.log(`${r.ok ? '✅' : '❌'} ${r.name} [${r.method||''} ${r.path||''}] status=${r.status} ${r.ms? r.ms+'ms':''}${r.error? ' :: '+r.error:''}`);
    if (r.sample && r.ok) console.log('   ↳ sample:', r.sample);
  }
  console.log(`----------------------------------`);
  console.log(`Passed: ${pass}  Failed: ${fail}`);
  if (fail > 0) {
    console.log('\nFailed endpoints detail:');
    for (const r of results.filter(r=>!r?.ok)) {
      console.log(` - ${r.name} => status=${r.status} error=${r.error}`);
    }
  }
  if (fail > 0) process.exitCode = 1;
}

main();
