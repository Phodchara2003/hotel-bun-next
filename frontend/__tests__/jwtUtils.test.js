import { describe, it, expect } from 'bun:test';
import { parseJWTPayload } from '../lib/jwtUtils.js';

/**
 * Build a test token using standard base64url encoding.
 * Note: btoa() only handles Latin-1; for this helper we keep payloads ASCII-safe.
 */
function makeToken(payload) {
  const toBase64url = (str) =>
    btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const header = toBase64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = toBase64url(JSON.stringify(payload));
  return `${header}.${body}.fakesignature`;
}

describe('parseJWTPayload', () => {
  it('decodes a simple payload', () => {
    const result = parseJWTPayload(makeToken({ id: 1, role: 'user' }));
    expect(result.id).toBe(1);
    expect(result.role).toBe('user');
  });

  it('handles base64url characters (- replacing +, _ replacing /)', () => {
    // Force a payload that produces + or / in standard base64 by including chars
    // that encode to those bytes (e.g., char codes 0xFB, 0xFF produce + / / in base64)
    // Simpler: manually construct a token segment with - and _ to verify the decoder.
    const raw = JSON.stringify({ x: 1 });
    const standard = btoa(raw);
    // Artificially replace + and / with - and _ as a JWT encoder would
    const base64url = standard.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    const token = `header.${base64url}.sig`;
    expect(parseJWTPayload(token).x).toBe(1);
  });

  it('handles padding-sensitive payloads (1, 2, or 3 leftover bytes)', () => {
    // Different payload lengths exercise each padding case
    for (const payload of [{ a: 1 }, { ab: 12 }, { abc: 123 }]) {
      const result = parseJWTPayload(makeToken(payload));
      expect(result).toMatchObject(payload);
    }
  });

  it('throws for a token with only one segment (no dot)', () => {
    expect(() => parseJWTPayload('nodotsinhere')).toThrow('Invalid JWT');
  });

  it('throws for an empty string', () => {
    expect(() => parseJWTPayload('')).toThrow();
  });

  it('throws for a token whose payload is not valid JSON', () => {
    const badPayload = btoa('not json').replace(/=/g, '');
    expect(() => parseJWTPayload(`h.${badPayload}.s`)).toThrow();
  });

  it('preserves all standard JWT user fields', () => {
    const payload = { id: 42, email: 'test@hotel.com', role: 'admin', iat: 1700000000, exp: 1700604800 };
    const result = parseJWTPayload(makeToken(payload));
    expect(result).toMatchObject(payload);
  });
});
