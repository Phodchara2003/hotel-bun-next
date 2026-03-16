import { describe, it, expect } from 'bun:test';
import {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  generateBookingReference,
} from '../utils/auth.js';

describe('hashPassword / comparePassword', () => {
  it('produces a hash that is not the original password', async () => {
    const hash = await hashPassword('secret123');
    expect(hash).not.toBe('secret123');
    expect(hash.length).toBeGreaterThan(20);
  });

  it('matches the correct password', async () => {
    const hash = await hashPassword('correct');
    expect(await comparePassword('correct', hash)).toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await hashPassword('correct');
    expect(await comparePassword('wrong', hash)).toBe(false);
  });

  it('two hashes of the same password are different (salt)', async () => {
    const h1 = await hashPassword('same');
    const h2 = await hashPassword('same');
    expect(h1).not.toBe(h2);
  });
});

describe('generateToken / verifyToken', () => {
  const payload = { id: 7, email: 'user@example.com', role: 'user' };

  it('generates a three-part JWT string', () => {
    const token = generateToken(payload);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('round-trips the payload correctly', () => {
    const token = generateToken(payload);
    const decoded = verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded.id).toBe(payload.id);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
  });

  it('returns null for a garbage token', () => {
    expect(verifyToken('not.a.token')).toBeNull();
  });

  it('returns null for a tampered signature', () => {
    const token = generateToken(payload);
    const tampered = token.slice(0, -4) + 'XXXX';
    expect(verifyToken(tampered)).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(verifyToken('')).toBeNull();
  });
});

describe('generateBookingReference', () => {
  it('starts with HTL', () => {
    expect(generateBookingReference()).toMatch(/^HTL/);
  });

  it('has a minimum length', () => {
    expect(generateBookingReference().length).toBeGreaterThanOrEqual(8);
  });

  it('generates unique values', () => {
    const refs = new Set(Array.from({ length: 200 }, generateBookingReference));
    expect(refs.size).toBe(200);
  });
});
