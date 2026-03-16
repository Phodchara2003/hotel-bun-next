// ── Auth ───────────────────────────────────────────────────────────────────
export { authRoutes }                      from './auth/index.js';
export { default as changeEmailRoutes }    from './auth/changeEmail.js';
export { default as forgotPasswordRoutes } from './auth/forgotPassword.js';
export { passwordResetRoutes }             from './auth/password-reset.js';

// ── Admin ──────────────────────────────────────────────────────────────────
export {
  adminDashboardRoutes,
  adminPaymentsRoutes,
  adminRoomsRoutes,
  roomTypesRoutes,
  adminUsersRoutes,
  adminEmailRoutes,
  permissionRoutes,
} from './admin/index.js';

// ── Payment ────────────────────────────────────────────────────────────────
export {
  bankImageRoutes,
  bankPaymentRoutes,
  paymentSettingsRoutes,
  paymentSlipRoutes,
  qrPaymentRoutes,
  simplePaymentRoutes,
  userPaymentRoutes,
} from './payment/index.js';

// ── Core ───────────────────────────────────────────────────────────────────
export { hotelRoutes }          from './hotels.js';
export { bookingRoutes }        from './bookings.js';
export { notificationRoutes }   from './notifications.js';
export { reviewRoutes }         from './reviews.js';
export { globalSettingsRoutes } from './global-settings.js';
export { profileRoutes }        from './profile.js';
export { roomStatusRoutes }     from './room-status-new.js';
export { checkinRoutes }        from './checkin.js';
export { housekeepingRoutes }   from './housekeeping.js';
export { default as userEmailRoutes } from './userEmailSettings.js';
