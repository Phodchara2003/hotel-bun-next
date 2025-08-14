export const translations = {
  // Navigation & Header
  header: {
    home: "หน้าหลัก",
    rooms: "ห้องพัก", 
    bookings: "การจองของฉัน",
    profile: "โปรไฟล์",
    login: "เข้าสู่ระบบ",
    register: "สมัครสมาชิก",
    logout: "ออกจากระบบ",
    admin: "แอดมิน",
    hotelManagement: "จัดการโรงแรม",
    systemManagement: "จัดการระบบ",
    roomsManagement: "จัดการห้องพัก",
    checkinCheckout: "เช็คอิน/เช็คเอ้า",
    reports: "รายงาน",
    userManagement: "จัดการสมาชิก",
    permissions: "จัดการสิทธิ์",
    paymentSettings: "ตั้งค่าการชำระเงิน",
    notifications: "แจ้งเตือน"
  },

  // Permissions Management
  permissions: {
    title: "จัดการสิทธิ์ผู้ใช้",
    description: "กำหนดสิทธิ์ในการใช้งานระบบให้กับผู้ใช้แต่ละคน",
    userList: "รายชื่อผู้ใช้",
    searchPlaceholder: "🔍 ค้นหาชื่อ, นามสกุล หรืออีเมล...",
    showCount: "แสดง",
    noUsers: "ไม่พบผู้ใช้ที่ตรงกับคำค้นหา",
    manageFor: "จัดการสิทธิ์:",
    saveChanges: "บันทึกการเปลี่ยนแปลง",
    grantedAt: "ได้รับสิทธิ์:",
    grantedBy: "โดย",
    selectUser: "เลือกผู้ใช้เพื่อจัดการสิทธิ์",
    selectUserDesc: "คลิกที่ชื่อผู้ใช้ทางซ้ายเพื่อเริ่มจัดการสิทธิ์"
  },

  // Homepage
  hero: {
    title: "ค้นหาที่พักในฝันของคุณ",
    subtitle: "โรงแรมหรูระดับ 5 ดาว ใจกลางกรุงเทพฯ พร้อมสิ่งอำนวยความสะดวกครบครัน",
    search: "เลือกห้องพักที่ต้องการ",
    checkIn: "วันที่เข้าพัก",
    checkOut: "วันที่ออก",
    guests: "จำนวนผู้เข้าพัก",
    searchButton: "ค้นหา",
    bookNow: "จองเลย",
    viewRooms: "ดูห้องพัก"
  },

  quickActions: {
    title: "การดำเนินการด่วน",
    viewBookings: "ดูการจองของฉัน",
    findRooms: "ค้นหาห้องพัก",
    specialOffers: "โปรโมชั่นพิเศษ"
  },

  rooms: {
    title: "ห้องพักยอดนิยม",
    subtitle: "เลือกห้องพักที่ใช่สำหรับคุณ",
    viewAll: "ดูทั้งหมด",
    pricePerNight: "ต่อคืน",
    guests: "ผู้เข้าพัก",
    sqm: "ตรม.",
    amenities: "สิ่งอำนวยความสะดวก",
    bookNow: "จองเลย",
    viewImages: "ดูรูปภาพทั้งหมด",
    photos: "รูป",
    more: "อื่นๆ",
    noRooms: "ไม่พบข้อมูลห้องพัก",
    tryAgain: "กรุณาลองใหม่อีกครั้งในภายหลัง"
  },

  features: {
    title: "ทำไมต้องเลือกเรา?",
    subtitle: "เราให้บริการที่ดีที่สุด พร้อมความสะดวกและปลอดภัย",
    quality: {
      title: "ห้องพักคุณภาพ",
      description: "ห้องพักที่ผ่านการคัดสรรแล้ว พร้อมสิ่งอำนวยความสะดวกครบครัน"
    },
    secure: {
      title: "จองง่าย ปลอดภัย",
      description: "ระบบจองที่ปลอดภัย รองรับการชำระเงินหลายช่องทาง"
    },
    cancellation: {
      title: "ยกเลิกได้ฟรี",
      description: "ยกเลิกการจองได้ฟรีก่อน 24 ชั่วโมงของวันเข้าพัก"
    }
  },

  cta: {
    title: "พร้อมจองห้องพักแล้วใช่ไหม?",
    subtitle: "สมัครสมาชิกวันนี้ รับส่วนลดพิเศษสำหรับการจองครั้งแรก",
    signUp: "สมัครสมาชิกฟรี",
    viewRooms: "ดูห้องพักทั้งหมด"
  },

  // Authentication
  auth: {
    loginTitle: "เข้าสู่ระบบ",
    registerTitle: "สมัครสมาชิก", 
    email: "อีเมล",
    password: "รหัสผ่าน",
    confirmPassword: "ยืนยันรหัสผ่าน",
    firstName: "ชื่อ",
    lastName: "นามสกุล",
    phone: "หมายเลขโทรศัพท์",
    loginButton: "เข้าสู่ระบบ",
    registerButton: "สมัครสมาชิก",
    forgotPassword: "ลืมรหัสผ่าน?",
    noAccount: "ยังไม่มีบัญชี?",
    haveAccount: "มีบัญชีแล้ว?",
    clickHere: "คลิกที่นี่",
    loginSuccess: "เข้าสู่ระบบสำเร็จ!",
    registerSuccess: "สมัครสมาชิกสำเร็จ!",
    logoutSuccess: "ออกจากระบบเรียบร้อย",
    loginError: "เข้าสู่ระบบไม่สำเร็จ",
    registerError: "เกิดข้อผิดพลาดในการสมัครสมาชิก",
    loginRequired: "กรุณาเข้าสู่ระบบ"
  },

  // Common
  common: {
    loading: "กำลังโหลด...",
    error: "ไม่สามารถโหลดข้อมูลได้",
    save: "บันทึก",
    cancel: "ยกเลิก",
    delete: "ลบ",
    edit: "แก้ไข",
    view: "ดู",
    search: "ค้นหา",
    filter: "กรอง",
    reset: "รีเซ็ต",
    submit: "ส่ง",
    confirm: "ยืนยัน",
    back: "กลับ",
    next: "ถัดไป",
    previous: "ก่อนหน้า",
    close: "ปิด",
    yes: "ใช่",
    no: "ไม่",
    ok: "ตกลง",
    error: "ข้อผิดพลาด",
    success: "สำเร็จ",
    warning: "คำเตือน",
    info: "ข้อมูล",
    total: "รวม",
    select: "เลือก",
    upload: "อัปโหลด",
    download: "ดาวน์โหลด",
    print: "พิมพ์",
    refresh: "รีเฟรช",
    saving: "กำลังบันทึก..."
  },

  // Bookings
  bookings: {
    title: "การจองของฉัน",
    noBookings: "ยังไม่มีการจอง",
    startBooking: "เริ่มจองโรงแรมเพื่อเริ่มต้นการเดินทางของคุณ",
    bookingReference: "รหัสการจอง",
    hotel: "โรงแรม",
    room: "ห้อง",
    checkIn: "เช็คอิน",
    checkOut: "เช็คเอ้า",
    guests: "ผู้เข้าพัก",
    nights: "คืน",
    totalAmount: "ยอดรวม",
    status: "สถานะ",
    pending: "รอการยืนยัน",
    confirmed: "ยืนยันแล้ว",
    cancelled: "ยกเลิกแล้ว",
    completed: "เสร็จสิ้น",
    viewDetails: "ดูรายละเอียด",
    cancelBooking: "ยกเลิกการจอง",
    payNow: "ชำระเงิน"
  },

  // Rooms
  rooms: {
    title: "ห้องพัก",
    roomType: "ประเภทห้อง",
    capacity: "ความจุ",
    price: "ราคา",
    perNight: "ต่อคืน",
    amenities: "สิ่งอำนวยความสะดวก",
    available: "พร้อมใช้งาน",
    notAvailable: "ไม่พร้อมใช้งาน",
    bookNow: "จองเลย",
    selectRoom: "เลือกห้อง",
    roomDetails: "รายละเอียดห้อง",
    checkAvailability: "ตรวจสอบห้องว่าง"
  },

  // Profile
  profile: {
    title: "โปรไฟล์",
    personalInfo: "ข้อมูลส่วนตัว",
    editProfile: "แก้ไขโปรไฟล์",
    changePassword: "เปลี่ยนรหัสผ่าน",
    changeEmail: "เปลี่ยนอีเมล",
    emailSettings: "ตั้งค่าอีเมล",
    currentPassword: "รหัสผ่านปัจจุบัน",
    newPassword: "รหัสผ่านใหม่",
    confirmNewPassword: "ยืนยันรหัสผ่านใหม่",
    updateSuccess: "อัปเดตข้อมูลสำเร็จ",
    updateError: "เกิดข้อผิดพลาดในการอัปเดตข้อมูล"
  },

  // Admin
  admin: {
    dashboard: "แดชบอร์ด",
    usersManagement: "จัดการสมาชิก",
    roomsManagement: "จัดการห้องพัก", 
    bookingsManagement: "จัดการการจอง",
    reports: "รายงาน",
    settings: "ตั้งค่า",
    permissions: "จัดการสิทธิ์",
    totalUsers: "จำนวนสมาชิกทั้งหมด",
    totalRooms: "จำนวนห้องทั้งหมด",
    totalBookings: "จำนวนการจองทั้งหมด",
    activeBookings: "การจองที่ใช้งานอยู่",
    searchUsers: "ค้นหาสมาชิก",
    searchResults: "ผลการค้นหา",
    userRole: "บทบาท",
    userStatus: "สถานะ",
    lastLogin: "เข้าสู่ระบบล่าสุด"
  },

  // Payment
  payment: {
    title: "การชำระเงิน",
    paymentMethod: "วิธีการชำระเงิน",
    qrCode: "QR Code",
    bankTransfer: "โอนเงินผ่านธนาคาร",
    bankName: "ชื่อธนาคาร",
    accountNumber: "เลขที่บัญชี",
    accountName: "ชื่อบัญชี",
    uploadReceipt: "อัปโหลดหลักฐานการโอนเงิน",
    paymentSuccess: "ชำระเงินสำเร็จ",
    paymentPending: "รอการตรวจสอบ",
    paymentFailed: "การชำระเงินล้มเหลว"
  },

  // Check-in/Check-out
  checkin: {
    title: "เช็คอิน/เช็คเอ้า",
    checkinTab: "เช็คอิน",
    checkoutTab: "เช็คเอ้า",
    searchBooking: "ค้นหาการจอง",
    bookingReference: "รหัสการจอง",
    guestName: "ชื่อผู้เข้าพัก",
    roomNumber: "หมายเลขห้อง",
    checkinTime: "เวลาเช็คอิน",
    checkoutTime: "เวลาเช็คเอ้า",
    additionalCharges: "ค่าใช้จ่ายเพิ่มเติม",
    totalBill: "ยอดรวมทั้งหมด",
    processCheckin: "ดำเนินการเช็คอิน",
    processCheckout: "ดำเนินการเช็คเอ้า",
    checkinSuccess: "เช็คอินสำเร็จ",
    checkoutSuccess: "เช็คเอ้าสำเร็จ"
  },

  // Notifications
  notifications: {
    title: "แจ้งเตือน",
    markAsRead: "ทำเครื่องหมายว่าอ่านแล้ว",
    markAllAsRead: "ทำเครื่องหมายทั้งหมดว่าอ่านแล้ว",
    deleteNotification: "ลบการแจ้งเตือน",
    noNotifications: "ไม่มีการแจ้งเตือน",
    newNotification: "การแจ้งเตือนใหม่",
    bookingConfirmed: "การจองได้รับการยืนยัน",
    bookingCancelled: "การจองถูกยกเลิก",
    paymentReminder: "การแจ้งเตือนการชำระเงิน",
    checkinReminder: "การแจ้งเตือนเช็คอิน"
  },

  // Language
  language: {
    thai: "ไทย",
    english: "English",
    changeLanguage: "เปลี่ยนภาษา",
    current: "ปัจจุบัน"
  },

  // Theme
  theme: {
    light: "โหมดสว่าง",
    dark: "โหมดมืด",
    changeTheme: "เปลี่ยนธีม",
    lightDescription: "ธีมสว่าง",
    darkDescription: "ธีมมืด"
  },

  // Footer
  footer: {
    copyright: "สงวนลิขสิทธิ์",
    allRightsReserved: "สงวนสิทธิ์ทั้งหมด",
    privacyPolicy: "นโยบายความเป็นส่วนตัว",
    termsOfService: "ข้อกำหนดการใช้งาน",
    contactUs: "ติดต่อเรา"
  }
};
