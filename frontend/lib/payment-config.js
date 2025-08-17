// Payment Settings Configuration
export const DEFAULT_PAYMENT_SETTINGS = {
  promptpay: {
    id: "0610931494", // หมายเลข PromptPay ของโรงแรม
    name: "โรงแรม Hotel Bun Next",
    enabled: true
  },
  qrcode: {
    expiryMinutes: 30, // QR Code หมดอายุใน 30 นาทีงใน 30 นาที
    showHotelName: true,
    showBookingDetails: true
  },
  banking: {
    supportedBanks: [
      { code: "SCB", name: "ธนาคารไทยพาณิชย์", logo: "/banks/scb.png" },
      { code: "BBL", name: "ธนาคารกรุงเทพ", logo: "/banks/bbl.png" },
      { code: "KTB", name: "ธนาคารกรุงไทย", logo: "/banks/ktb.png" },
      { code: "BAY", name: "ธนาคารกรุงศรีอยุธยา", logo: "/banks/bay.png" },
      { code: "TMB", name: "ธนาคารทหารไทยธนชาต", logo: "/banks/tmb.png" },
      { code: "KBANK", name: "ธนาคารกสิกรไทย", logo: "/banks/kbank.png" },
      { code: "GSB", name: "ธนาคารออมสิน", logo: "/banks/gsb.png" },
      { code: "BAAC", name: "ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร", logo: "/banks/baac.png" }
    ]
  },
  ui: {
    showInstructions: true,
    showTimer: true,
    showSupportedApps: true
  }
};

// Payment Apps that support PromptPay QR
export const SUPPORTED_PAYMENT_APPS = [
  { name: "Banking Apps", description: "แอปธนาคารทุกแห่ง", icon: "🏦" },
  { name: "True Money Wallet", description: "True Money Wallet", icon: "💳" },
  { name: "Rabbit LINE Pay", description: "Rabbit LINE Pay", icon: "🐰" },
  { name: "ShopeePay", description: "ShopeePay", icon: "🛒" },
  { name: "AirPay", description: "AirPay", icon: "✈️" }
];
