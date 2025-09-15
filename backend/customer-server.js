// Enhanced Server with Customer Database Integration
// Hotel Booking Server + Customer Management + Payment Processing

const { createServer } = require('http');
const { parse } = require('url');
const fs = require('fs');
const path = require('path');

// Import customer database functions
const {
  createCustomer,
  findCustomerByEmail,
  createBooking,
  recordPayment,
  processSuccessfulPayment,
  getAllCustomers,
  getCustomerBookings,
  getCustomerSummary,
  customerDatabase
} = require('./customer-database');

const PORT = process.env.PORT || 3003;

// Database file paths (existing hotel data)
const DB_DIR = path.join(__dirname, 'db');
const HOTELS_DB = path.join(DB_DIR, 'hotels.json');
const NOTIFICATIONS_DB = path.join(DB_DIR, 'notifications.json');
const SETTINGS_DB = path.join(DB_DIR, 'settings.json');

// Helper functions
const sendJSON = (res, statusCode, data) => {
  res.setHeader('Content-Type', 'application/json');
  res.writeHead(statusCode);
  res.end(JSON.stringify(data, null, 2));
};

const setCORSHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

const parseRequestBody = (req) => {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
};

// Existing hotel database functions
function getHotels(limit = 10) {
  try {
    const data = fs.readFileSync(HOTELS_DB, 'utf8');
    const hotels = JSON.parse(data);
    return hotels.filter(hotel => hotel.is_active).slice(0, limit);
  } catch (error) {
    return [];
  }
}

function getNotifications(limit = 10) {
  try {
    const data = fs.readFileSync(NOTIFICATIONS_DB, 'utf8');
    const notifications = JSON.parse(data);
    return notifications.slice(0, limit);
  } catch (error) {
    return [];
  }
}

function getSetting(key) {
  try {
    const data = fs.readFileSync(SETTINGS_DB, 'utf8');
    const settings = JSON.parse(data);
    return settings[key];
  } catch (error) {
    return null;
  }
}

const server = createServer(async (req, res) => {
  setCORSHeaders(res);
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  console.log(`📞 ${method} ${path}`);

  try {
    // Health check with customer database status
    if (path === '/health') {
      const hotelsCount = getHotels().length;
      const notificationsCount = getNotifications().length;
      const customersCount = getAllCustomers().length;
      const bookingsCount = customerDatabase.bookings.length;
      
      sendJSON(res, 200, {
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: 'json_database_connected',
        customer_database: 'connected',
        data_counts: {
          hotels: hotelsCount,
          notifications: notificationsCount,
          customers: customersCount,
          bookings: bookingsCount
        },
        port: PORT
      });
      return;
    }

    // Root endpoint with customer info
    if (path === '/') {
      const hotelsCount = getHotels().length;
      const customersCount = getAllCustomers().length;
      
      sendJSON(res, 200, {
        message: 'Hotel Booking API Server (With Customer Database!)',
        status: 'OK',
        timestamp: new Date().toISOString(),
        port: PORT,
        database: 'JSON Database + Customer Management',
        data_summary: {
          hotels: hotelsCount,
          customers: customersCount,
          source: 'JSON files + Customer DB'
        },
        endpoints: [
          'GET /health',
          'GET /api/hotels',
          'GET /api/notifications',
          'GET /global-settings/room_price_per_night',
          'GET /api/customers',
          'GET /api/customers/:id',
          'POST /api/process-payment',
          'POST /api/create-booking',
          'GET /api/customer-bookings/:customerId'
        ]
      });
      return;
    }

    // Existing hotel APIs (unchanged)
    if (path === '/api/hotels' && method === 'GET') {
      const limit = parseInt(parsedUrl.query.limit) || 10;
      const hotels = getHotels(limit);
      
      sendJSON(res, 200, {
        success: true,
        data: hotels,
        count: hotels.length,
        source: 'json_database'
      });
      return;
    }

    if (path === '/api/notifications' && method === 'GET') {
      const notifications = getNotifications();
      
      sendJSON(res, 200, {
        success: true,
        data: notifications,
        count: notifications.length,
        source: 'json_database'
      });
      return;
    }

    if (path === '/global-settings/room_price_per_night' && method === 'GET') {
      const price = getSetting('room_price_per_night');
      const currency = getSetting('currency');
      
      sendJSON(res, 200, {
        success: true,
        price: price || 1500,
        currency: currency || 'THB',
        source: 'json_database'
      });
      return;
    }

    // NEW: Customer Management APIs

    // Get all customers
    if (path === '/api/customers' && method === 'GET') {
      console.log('👥 Fetching all customers...');
      const customers = getAllCustomers();
      
      // Remove sensitive data for response
      const safeCustomers = customers.map(customer => ({
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        nationality: customer.nationality,
        customerTier: customer.customerTier,
        loyaltyPoints: customer.loyaltyPoints,
        isVerified: customer.isVerified,
        createdAt: customer.createdAt
      }));
      
      sendJSON(res, 200, {
        success: true,
        data: safeCustomers,
        count: safeCustomers.length,
        source: 'customer_database'
      });
      return;
    }

    // Get specific customer with summary
    if (path.startsWith('/api/customers/') && method === 'GET') {
      const customerId = parseInt(path.split('/')[3]);
      console.log(`👤 Fetching customer ${customerId}...`);
      
      const summary = getCustomerSummary(customerId);
      if (!summary) {
        sendJSON(res, 404, {
          success: false,
          message: 'Customer not found'
        });
        return;
      }
      
      // Remove sensitive data
      const safeCustomer = {
        id: summary.customer.id,
        email: summary.customer.email,
        firstName: summary.customer.firstName,
        lastName: summary.customer.lastName,
        phone: summary.customer.phone,
        nationality: summary.customer.nationality,
        address: summary.customer.address,
        customerTier: summary.customer.customerTier,
        loyaltyPoints: summary.customer.loyaltyPoints,
        isVerified: summary.customer.isVerified,
        createdAt: summary.customer.createdAt
      };
      
      sendJSON(res, 200, {
        success: true,
        customer: safeCustomer,
        totalBookings: summary.totalBookings,
        totalSpent: summary.totalSpent,
        lastBooking: summary.lastBooking,
        source: 'customer_database'
      });
      return;
    }

    // Get customer bookings
    if (path.startsWith('/api/customer-bookings/') && method === 'GET') {
      const customerId = parseInt(path.split('/')[3]);
      console.log(`📅 Fetching bookings for customer ${customerId}...`);
      
      const bookings = getCustomerBookings(customerId);
      
      sendJSON(res, 200, {
        success: true,
        data: bookings,
        count: bookings.length,
        customerId: customerId,
        source: 'customer_database'
      });
      return;
    }

    // Process payment (creates customer + booking + payment)
    if (path === '/api/process-payment' && method === 'POST') {
      console.log('💳 Processing payment...');
      
      const paymentData = await parseRequestBody(req);
      
      // Validate required fields
      const requiredFields = ['customerEmail', 'customerFirstName', 'customerLastName', 'totalAmount', 'hotelId', 'hotelName', 'roomType', 'checkInDate', 'checkOutDate'];
      const missingFields = requiredFields.filter(field => !paymentData[field]);
      
      if (missingFields.length > 0) {
        sendJSON(res, 400, {
          success: false,
          message: 'Missing required fields',
          missingFields: missingFields
        });
        return;
      }
      
      // Process the payment
      const result = processSuccessfulPayment(paymentData);
      
      if (result.success) {
        sendJSON(res, 200, {
          success: true,
          message: 'Payment processed successfully',
          customer: {
            id: result.customer.id,
            email: result.customer.email,
            firstName: result.customer.firstName,
            lastName: result.customer.lastName
          },
          booking: {
            id: result.booking.id,
            bookingReference: result.booking.bookingReference,
            hotelName: result.booking.hotelName,
            checkInDate: result.booking.checkInDate,
            checkOutDate: result.booking.checkOutDate,
            totalAmount: result.booking.totalAmount
          },
          payment: {
            id: result.payment.id,
            paymentReference: result.payment.paymentReference,
            amount: result.payment.amount,
            status: result.payment.paymentStatus
          }
        });
      } else {
        sendJSON(res, 500, {
          success: false,
          message: 'Payment processing failed',
          error: result.error
        });
      }
      return;
    }

    // Database statistics
    if (path === '/api/database-stats' && method === 'GET') {
      console.log('📊 Getting database statistics...');
      
      const hotels = getHotels();
      const customers = getAllCustomers();
      const bookings = customerDatabase.bookings;
      const payments = customerDatabase.payments;
      
      const stats = {
        hotels: {
          total: hotels.length,
          active: hotels.filter(h => h.is_active).length
        },
        customers: {
          total: customers.length,
          verified: customers.filter(c => c.isVerified).length,
          by_tier: {
            bronze: customers.filter(c => c.customerTier === 'bronze').length,
            silver: customers.filter(c => c.customerTier === 'silver').length,
            gold: customers.filter(c => c.customerTier === 'gold').length,
            platinum: customers.filter(c => c.customerTier === 'platinum').length
          }
        },
        bookings: {
          total: bookings.length,
          confirmed: bookings.filter(b => b.bookingStatus === 'confirmed').length,
          completed: bookings.filter(b => b.bookingStatus === 'completed').length
        },
        payments: {
          total: payments.length,
          completed: payments.filter(p => p.paymentStatus === 'completed').length,
          total_amount: payments.reduce((sum, p) => sum + p.amount, 0)
        }
      };
      
      sendJSON(res, 200, {
        success: true,
        statistics: stats,
        timestamp: new Date().toISOString(),
        source: 'customer_database'
      });
      return;
    }

    // 404 - Not Found
    sendJSON(res, 404, {
      error: 'Not Found',
      message: `Path ${path} not found`,
      availableEndpoints: [
        'GET /',
        'GET /health',
        'GET /api/hotels',
        'GET /api/notifications',
        'GET /global-settings/room_price_per_night',
        'GET /api/customers',
        'GET /api/customers/:id',
        'POST /api/process-payment',
        'GET /api/customer-bookings/:customerId',
        'GET /api/database-stats'
      ]
    });

  } catch (error) {
    console.error('Server error:', error);
    sendJSON(res, 500, {
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Hotel Booking Backend Server running on http://localhost:${PORT}`);
  console.log('🔧 Server: Node.js HTTP Server with Customer Database Integration');
  console.log('🔑 Environment:', process.env.NODE_ENV || 'development');
  
  console.log('\n📋 Available endpoints:');
  console.log(`   GET http://localhost:${PORT}/                            - Server info`);
  console.log(`   GET http://localhost:${PORT}/health                      - Health check`);
  console.log(`   GET http://localhost:${PORT}/api/hotels                  - Hotels`);
  console.log(`   GET http://localhost:${PORT}/api/notifications           - Notifications`);
  console.log(`   GET http://localhost:${PORT}/global-settings/room_price_per_night - Room pricing`);
  console.log(`   GET http://localhost:${PORT}/api/customers               - All customers`);
  console.log(`   GET http://localhost:${PORT}/api/customers/:id           - Customer details`);
  console.log(`   POST http://localhost:${PORT}/api/process-payment        - Process payment & create booking`);
  console.log(`   GET http://localhost:${PORT}/api/customer-bookings/:id   - Customer bookings`);
  console.log(`   GET http://localhost:${PORT}/api/database-stats          - Database statistics`);
  
  console.log('\n✅ Server ready with Customer Database Integration!');
  console.log('🔗 Ready to handle payments and customer data storage!');
  console.log(`📁 Hotel data: ${DB_DIR}`);
  console.log(`📁 Customer data: customer_database.json`);
});