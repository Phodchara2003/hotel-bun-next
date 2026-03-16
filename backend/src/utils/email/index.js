// ESM email services
export {
  sendNewBookingAdminEmail,
  sendPaymentReceivedAdminEmail,
  sendCancellationAdminEmail,
  sendDailyAdminSummaryEmail,
  automaticAdminEmailNotifications,
} from './adminEmailService.js';

export { AdminEmailTemplates }    from './adminEmailTemplates.js';
export { BookingApprovalTemplates } from './bookingApprovalTemplates.js';

export {
  automaticEmailNotifications,
  batchEmailNotifications,
  conditionalEmailNotifications,
} from './automaticEmailService.js';

export {
  createUserTransporter,
  sendOTPWithUserEmail,
  sendTestEmail,
  sendOTPWithFallback,
} from './dynamicEmailService.js';

export {
  generateOTP,
  sendOTPEmail,
  sendPasswordResetConfirmation,
  sendBookingConfirmationEmail,
  sendBookingCancellationEmail,
  sendBookingUpdateEmail,
  sendCheckInReminderEmail,
  sendBookingApprovalEmail,
  sendBookingRejectionEmail,
  sendRequestAdditionalInfoEmail,
  sendAutomaticNotifications,
} from './emailService.js';

// Note: mockEmailService.cjs and realEmailService.cjs are CommonJS modules
// and cannot be re-exported from an ESM barrel. Import them directly if needed.
