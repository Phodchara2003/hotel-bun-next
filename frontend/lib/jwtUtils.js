/**
 * Safely decode a JWT payload.
 * JWTs use base64url encoding ('+' → '-', '/' → '_', no '=' padding).
 * Plain atob() only handles standard base64, so we must convert first.
 *
 * @param {string} token - Full JWT string (header.payload.signature)
 * @returns {object} Decoded payload
 */
export const parseJWTPayload = (token) => {
  const raw = token.split('.')[1];
  if (!raw) throw new Error('Invalid JWT: missing payload segment');
  const base64 = raw.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
  return JSON.parse(atob(padded));
};
