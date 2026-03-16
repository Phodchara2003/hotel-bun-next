// ── API / Monitoring ───────────────────────────────────────────────────────
export { default as api }                from './api.js';
export { default as apiMonitor }         from './apiMonitor.js';
export { default as performanceMonitor } from './performanceMonitor.js';

// ── Auth / Roles / Permissions ─────────────────────────────────────────────
export * from './jwtUtils.js';
export * from './permissions.js';
export * from './roles.js';

// ── Date utilities ─────────────────────────────────────────────────────────
export * from './dateUtils.js';

// ── Browser utilities ──────────────────────────────────────────────────────
export * from './browserUtils.js';

// ── Room & Image utilities ─────────────────────────────────────────────────
// roomImageUtils is the primary source for room images
export * from './roomImageUtils.js';
// imageUtils has additional helpers (cache-busting, upload URLs)
// Export only non-conflicting names to avoid collision with roomImageUtils
export {
  getImageUrl,
  getUploadImageUrl,
  getPlaceholderImageUrl as getPlaceholderImage,
  getFallbackRoomImages  as getFallbackImages,
  invalidateRoomImageCache,
  getRoomImageCacheBuster,
  getRoomImageUrlWithCache,
} from './imageUtils.js';

// ── Room data ──────────────────────────────────────────────────────────────
export * from './roomsData.js';

// ── Payment ────────────────────────────────────────────────────────────────
export { DEFAULT_PAYMENT_SETTINGS, SUPPORTED_PAYMENT_APPS } from './payment-config.js';
export { default as defaultPaymentSettings } from './payment-config.js';

// ── QR Code ────────────────────────────────────────────────────────────────
export * from './qrcode-generator.js';
