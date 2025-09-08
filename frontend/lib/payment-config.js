// Centralized payment configuration and defaults

export const DEFAULT_PAYMENT_SETTINGS = {
  promptpay: {
    id: process.env.NEXT_PUBLIC_PROMPTPAY_ID || '0123456789012',
    name: process.env.NEXT_PUBLIC_PROMPTPAY_NAME || 'Hotel Bun Next'
  },
  qrcode: {
    expiryMinutes: 15
  }
};

export const SUPPORTED_PAYMENT_APPS = [
  { name: 'SCB Easy', icon: '🏦' },
  { name: 'KBank', icon: '💚' },
  { name: 'Krungthai NEXT', icon: '💙' },
  { name: 'PromptPay', icon: '⚡' },
  { name: 'TrueMoney', icon: '🟠' }
];

export default DEFAULT_PAYMENT_SETTINGS;
