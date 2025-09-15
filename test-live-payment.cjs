// Live Payment Processing Test
// Test script to demonstrate customer data storage after payment

const http = require('http');

const paymentData = {
  customerEmail: 'live-demo@example.com',
  customerFirstName: 'Live',
  customerLastName: 'Demo',
  customerPhone: '+66987654321',
  customerNationality: 'Thai',
  totalAmount: 3000,
  hotelId: 1,
  hotelName: 'Premium Hotel Bangkok',
  roomType: 'Deluxe Suite',
  checkInDate: '2024-02-20',
  checkOutDate: '2024-02-22',
  guests: 2,
  paymentMethod: 'credit_card'
};

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const request = http.request(url, options, (response) => {
      let data = '';
      response.on('data', chunk => {
        data += chunk;
      });
      response.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : null;
          resolve({
            statusCode: response.statusCode,
            data: jsonData,
            rawData: data
          });
        } catch (error) {
          resolve({
            statusCode: response.statusCode,
            data: null,
            rawData: data
          });
        }
      });
    });

    request.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      request.write(options.body);
    }

    request.end();
  });
}

async function testLivePayment() {
  console.log('💳 Testing Live Payment Processing...');
  console.log('🔄 Processing payment for Live Demo customer...');
  
  try {
    // Process payment
    const paymentResponse = await makeRequest('http://localhost:3003/api/process-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    });
    
    console.log('📊 Payment Response:');
    console.log(`   Status: ${paymentResponse.statusCode}`);
    console.log(`   Success: ${paymentResponse.data.success}`);
    
    if (paymentResponse.data.success) {
      console.log('✅ Payment Processed Successfully!');
      console.log(`   Customer ID: ${paymentResponse.data.customer.id}`);
      console.log(`   Customer: ${paymentResponse.data.customer.firstName} ${paymentResponse.data.customer.lastName}`);
      console.log(`   Email: ${paymentResponse.data.customer.email}`);
      console.log(`   Booking ID: ${paymentResponse.data.booking.id}`);
      console.log(`   Booking Reference: ${paymentResponse.data.booking.bookingReference}`);
      console.log(`   Hotel: ${paymentResponse.data.booking.hotelName}`);
      console.log(`   Amount: ฿${paymentResponse.data.payment.amount}`);
      console.log(`   Payment Reference: ${paymentResponse.data.payment.paymentReference}`);
      
      // Verify customer was saved
      const customerId = paymentResponse.data.customer.id;
      console.log(`\n🔍 Verifying customer data storage...`);
      
      const customerResponse = await makeRequest(`http://localhost:3003/api/customers/${customerId}`);
      
      if (customerResponse.data.success) {
        console.log('✅ Customer Data Retrieved Successfully!');
        console.log(`   Customer: ${customerResponse.data.customer.firstName} ${customerResponse.data.customer.lastName}`);
        console.log(`   Total Bookings: ${customerResponse.data.totalBookings}`);
        console.log(`   Total Spent: ฿${customerResponse.data.totalSpent}`);
        console.log(`   Customer Tier: ${customerResponse.data.customer.customerTier}`);
        console.log(`   Loyalty Points: ${customerResponse.data.customer.loyaltyPoints}`);
      }
      
      // Get database statistics
      console.log(`\n📊 Getting database statistics...`);
      const statsResponse = await makeRequest('http://localhost:3003/api/database-stats');
      
      if (statsResponse.data.success) {
        console.log('✅ Database Statistics:');
        console.log(`   Total Customers: ${statsResponse.data.statistics.customers.total}`);
        console.log(`   Total Bookings: ${statsResponse.data.statistics.bookings.total}`);
        console.log(`   Total Payments: ${statsResponse.data.statistics.payments.total}`);
        console.log(`   Total Revenue: ฿${statsResponse.data.statistics.payments.total_amount}`);
      }
      
    } else {
      console.log('❌ Payment Failed:');
      console.log(`   Error: ${paymentResponse.data.message}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testLivePayment();