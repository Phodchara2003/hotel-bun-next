// Customer Database Management System
// Real SQL Database Integration for Customer Data Storage

const fs = require('fs');
const path = require('path');

// Database configuration
const DB_CONFIG = {
  // For SQLite (Local development)
  sqlite: {
    filename: path.join(__dirname, 'customer_data.db'),
    type: 'sqlite'
  },
  
  // For PostgreSQL (Production)
  postgresql: {
    connectionString: process.env.DATABASE_URL || 'postgresql://username:password@localhost:5432/hotel_customers',
    type: 'postgresql'
  }
};

// In-memory storage for now (will be replaced with real SQL)
let customerDatabase = {
  customers: [],
  bookings: [],
  payments: [],
  nextCustomerId: 1,
  nextBookingId: 1,
  nextPaymentId: 1
};

// Load existing data
function loadDatabase() {
  const dbFile = path.join(__dirname, 'customer_database.json');
  if (fs.existsSync(dbFile)) {
    try {
      const data = fs.readFileSync(dbFile, 'utf8');
      customerDatabase = JSON.parse(data);
      console.log('📊 Customer database loaded successfully');
    } catch (error) {
      console.error('❌ Error loading customer database:', error.message);
    }
  } else {
    console.log('🆕 Creating new customer database');
    saveDatabase();
  }
}

// Save database
function saveDatabase() {
  const dbFile = path.join(__dirname, 'customer_database.json');
  try {
    fs.writeFileSync(dbFile, JSON.stringify(customerDatabase, null, 2));
    console.log('💾 Customer database saved successfully');
  } catch (error) {
    console.error('❌ Error saving customer database:', error.message);
  }
}

// Generate unique reference numbers
function generateBookingReference() {
  const prefix = 'BOK';
  const number = String(customerDatabase.nextBookingId).padStart(3, '0');
  customerDatabase.nextBookingId++;
  return `${prefix}${number}`;
}

function generatePaymentReference() {
  const prefix = 'PAY';
  const number = String(customerDatabase.nextPaymentId).padStart(3, '0');
  customerDatabase.nextPaymentId++;
  return `${prefix}${number}`;
}

// Customer Management Functions

// Create new customer (after payment)
function createCustomer(customerData) {
  const customer = {
    id: customerDatabase.nextCustomerId++,
    email: customerData.email,
    firstName: customerData.firstName,
    lastName: customerData.lastName,
    phone: customerData.phone,
    nationality: customerData.nationality || '',
    
    // Address
    address: {
      line1: customerData.address?.line1 || '',
      city: customerData.address?.city || '',
      country: customerData.address?.country || '',
      postalCode: customerData.address?.postalCode || ''
    },
    
    // Preferences
    preferredLanguage: customerData.preferredLanguage || 'en',
    marketingConsent: customerData.marketingConsent || false,
    loyaltyPoints: 0,
    customerTier: 'bronze',
    
    // Status
    isVerified: true, // Auto-verified after payment
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLogin: new Date().toISOString()
  };
  
  customerDatabase.customers.push(customer);
  saveDatabase();
  
  console.log(`✅ Customer created: ${customer.firstName} ${customer.lastName} (ID: ${customer.id})`);
  return customer;
}

// Find customer by email
function findCustomerByEmail(email) {
  return customerDatabase.customers.find(c => c.email.toLowerCase() === email.toLowerCase());
}

// Create booking (after payment confirmed)
function createBooking(bookingData) {
  const booking = {
    id: customerDatabase.nextBookingId,
    bookingReference: generateBookingReference(),
    customerId: bookingData.customerId,
    
    // Hotel information
    hotelId: bookingData.hotelId,
    hotelName: bookingData.hotelName,
    roomType: bookingData.roomType,
    roomNumber: bookingData.roomNumber || null,
    
    // Dates
    checkInDate: bookingData.checkInDate,
    checkOutDate: bookingData.checkOutDate,
    nights: calculateNights(bookingData.checkInDate, bookingData.checkOutDate),
    
    // Guests
    adults: bookingData.adults || 1,
    children: bookingData.children || 0,
    totalGuests: (bookingData.adults || 1) + (bookingData.children || 0),
    
    // Pricing
    roomRate: bookingData.roomRate,
    subtotal: bookingData.subtotal,
    taxAmount: bookingData.taxAmount || 0,
    serviceFee: bookingData.serviceFee || 0,
    totalAmount: bookingData.totalAmount,
    currency: bookingData.currency || 'THB',
    
    // Status (confirmed because payment was successful)
    bookingStatus: 'confirmed',
    paymentStatus: 'paid',
    
    // Additional
    specialRequests: bookingData.specialRequests || '',
    confirmationSent: false,
    qrCode: null,
    
    // Timestamps
    bookingDate: new Date().toISOString(),
    confirmedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  customerDatabase.bookings.push(booking);
  
  // Update customer loyalty points
  updateCustomerLoyaltyPoints(bookingData.customerId, Math.floor(bookingData.totalAmount / 100));
  
  saveDatabase();
  
  console.log(`✅ Booking created: ${booking.bookingReference} for customer ${booking.customerId}`);
  return booking;
}

// Record payment
function recordPayment(paymentData) {
  const payment = {
    id: customerDatabase.nextPaymentId,
    paymentReference: generatePaymentReference(),
    bookingId: paymentData.bookingId,
    customerId: paymentData.customerId,
    
    // Payment details
    amount: paymentData.amount,
    currency: paymentData.currency || 'THB',
    paymentType: paymentData.paymentType, // credit_card, bank_transfer, etc.
    paymentGateway: paymentData.paymentGateway, // stripe, omise, etc.
    
    // Gateway information
    transactionId: paymentData.transactionId,
    gatewayReference: paymentData.gatewayReference,
    
    // Status
    paymentStatus: 'completed',
    paymentDate: new Date().toISOString(),
    processedAt: new Date().toISOString(),
    
    // Security
    ipAddress: paymentData.ipAddress || '',
    userAgent: paymentData.userAgent || '',
    
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  customerDatabase.payments.push(payment);
  saveDatabase();
  
  console.log(`✅ Payment recorded: ${payment.paymentReference} for ${payment.amount} ${payment.currency}`);
  return payment;
}

// Helper functions
function calculateNights(checkIn, checkOut) {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
}

function updateCustomerLoyaltyPoints(customerId, points) {
  const customer = customerDatabase.customers.find(c => c.id === customerId);
  if (customer) {
    customer.loyaltyPoints += points;
    customer.updatedAt = new Date().toISOString();
    
    // Update tier based on points
    if (customer.loyaltyPoints >= 1000) {
      customer.customerTier = 'platinum';
    } else if (customer.loyaltyPoints >= 500) {
      customer.customerTier = 'gold';
    } else if (customer.loyaltyPoints >= 200) {
      customer.customerTier = 'silver';
    }
  }
}

// Query functions
function getAllCustomers() {
  return customerDatabase.customers;
}

function getCustomerBookings(customerId) {
  return customerDatabase.bookings.filter(b => b.customerId === customerId);
}

function getBookingPayments(bookingId) {
  return customerDatabase.payments.filter(p => p.bookingId === bookingId);
}

function getCustomerSummary(customerId) {
  const customer = customerDatabase.customers.find(c => c.id === customerId);
  if (!customer) return null;
  
  const bookings = getCustomerBookings(customerId);
  const totalSpent = bookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
  
  return {
    customer: customer,
    totalBookings: bookings.length,
    totalSpent: totalSpent,
    lastBooking: bookings.length > 0 ? bookings[bookings.length - 1] : null
  };
}

// Complete booking flow (called after successful payment)
function processSuccessfulPayment(paymentData) {
  console.log('💳 Processing successful payment...');
  
  try {
    // 1. Find or create customer
    let customer = findCustomerByEmail(paymentData.customerEmail);
    if (!customer) {
      customer = createCustomer({
        email: paymentData.customerEmail,
        firstName: paymentData.customerFirstName,
        lastName: paymentData.customerLastName,
        phone: paymentData.customerPhone,
        nationality: paymentData.customerNationality,
        address: paymentData.customerAddress
      });
    }
    
    // 2. Create booking
    const booking = createBooking({
      customerId: customer.id,
      hotelId: paymentData.hotelId,
      hotelName: paymentData.hotelName,
      roomType: paymentData.roomType,
      checkInDate: paymentData.checkInDate,
      checkOutDate: paymentData.checkOutDate,
      adults: paymentData.adults,
      children: paymentData.children,
      roomRate: paymentData.roomRate,
      subtotal: paymentData.subtotal,
      taxAmount: paymentData.taxAmount,
      serviceFee: paymentData.serviceFee,
      totalAmount: paymentData.totalAmount,
      currency: paymentData.currency,
      specialRequests: paymentData.specialRequests
    });
    
    // 3. Record payment
    const payment = recordPayment({
      bookingId: booking.id,
      customerId: customer.id,
      amount: paymentData.totalAmount,
      currency: paymentData.currency,
      paymentType: paymentData.paymentType,
      paymentGateway: paymentData.paymentGateway,
      transactionId: paymentData.transactionId,
      gatewayReference: paymentData.gatewayReference,
      ipAddress: paymentData.ipAddress,
      userAgent: paymentData.userAgent
    });
    
    console.log('🎉 Payment processing completed successfully!');
    
    return {
      success: true,
      customer: customer,
      booking: booking,
      payment: payment
    };
    
  } catch (error) {
    console.error('❌ Error processing payment:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Initialize database
loadDatabase();

// Sample data for testing
function createSampleData() {
  console.log('🔄 Creating sample customer data...');
  
  // Sample payment 1
  processSuccessfulPayment({
    customerEmail: 'john.doe@email.com',
    customerFirstName: 'John',
    customerLastName: 'Doe',
    customerPhone: '+66812345678',
    customerNationality: 'Thai',
    customerAddress: {
      line1: '123 Sukhumvit Road',
      city: 'Bangkok',
      country: 'Thailand'
    },
    hotelId: 1,
    hotelName: 'Royal Palace Bangkok',
    roomType: 'Deluxe Room',
    checkInDate: '2025-10-01',
    checkOutDate: '2025-10-03',
    adults: 2,
    children: 0,
    roomRate: 2500,
    subtotal: 5000,
    taxAmount: 350,
    serviceFee: 100,
    totalAmount: 5450,
    currency: 'THB',
    paymentType: 'credit_card',
    paymentGateway: 'stripe',
    transactionId: 'TXN123456789',
    gatewayReference: 'pi_1234567890'
  });
  
  // Sample payment 2
  processSuccessfulPayment({
    customerEmail: 'jane.smith@email.com',
    customerFirstName: 'Jane',
    customerLastName: 'Smith',
    customerPhone: '+66887654321',
    customerNationality: 'American',
    customerAddress: {
      line1: '456 Silom Road',
      city: 'Bangkok',
      country: 'Thailand'
    },
    hotelId: 2,
    hotelName: 'Paradise Beach Resort',
    roomType: 'Beach View Room',
    checkInDate: '2025-10-15',
    checkOutDate: '2025-10-18',
    adults: 2,
    children: 1,
    roomRate: 2800,
    subtotal: 8400,
    taxAmount: 588,
    serviceFee: 100,
    totalAmount: 9088,
    currency: 'THB',
    paymentType: 'credit_card',
    paymentGateway: 'omise',
    transactionId: 'TXN987654321',
    gatewayReference: 'charge_987654321'
  });
  
  console.log('✅ Sample data created successfully!');
}

// Export functions
module.exports = {
  createCustomer,
  findCustomerByEmail,
  createBooking,
  recordPayment,
  processSuccessfulPayment,
  getAllCustomers,
  getCustomerBookings,
  getCustomerSummary,
  createSampleData,
  customerDatabase
};

// Run sample data creation if called directly
if (require.main === module) {
  console.log('🚀 Customer Database Management System');
  console.log('=====================================');
  createSampleData();
  
  // Display summary
  console.log('\n📊 Database Summary:');
  console.log(`👥 Customers: ${customerDatabase.customers.length}`);
  console.log(`📅 Bookings: ${customerDatabase.bookings.length}`);
  console.log(`💳 Payments: ${customerDatabase.payments.length}`);
  
  console.log('\n✅ Customer database system ready!');
}