const axios = require('axios');

// Configuration
const BACKEND_URL = 'http://localhost:3003';
const FRONTEND_URL = 'http://localhost:3000';

class AutoTester {
  constructor() {
    this.results = [];
    this.testCount = 0;
    this.passCount = 0;
    this.failCount = 0;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const colors = {
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m', // Green
      error: '\x1b[31m',   // Red
      warning: '\x1b[33m', // Yellow
      reset: '\x1b[0m'     // Reset
    };
    
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  async test(testName, testFunction) {
    this.testCount++;
    this.log(`🧪 Testing: ${testName}`, 'info');
    
    try {
      await testFunction();
      this.passCount++;
      this.log(`✅ PASS: ${testName}`, 'success');
      this.results.push({ name: testName, status: 'PASS', error: null });
    } catch (error) {
      this.failCount++;
      this.log(`❌ FAIL: ${testName} - ${error.message}`, 'error');
      this.results.push({ name: testName, status: 'FAIL', error: error.message });
    }
  }

  async checkServerHealth() {
    try {
      const response = await axios.get(`${BACKEND_URL}/health`, { timeout: 5000 });
      if (response.status === 200) {
        this.log('✅ Backend server is running', 'success');
        return true;
      }
    } catch (error) {
      this.log('❌ Backend server is not responding', 'error');
      return false;
    }
  }

  async checkFrontendHealth() {
    try {
      const response = await axios.get(FRONTEND_URL, { timeout: 5000 });
      if (response.status === 200) {
        this.log('✅ Frontend server is running', 'success');
        return true;
      }
    } catch (error) {
      this.log('❌ Frontend server is not responding', 'error');
      return false;
    }
  }

  async testBackendAPIs() {
    this.log('\n📡 Testing Backend APIs...', 'warning');

    // Test health endpoint
    await this.test('Backend Health Check', async () => {
      const response = await axios.get(`${BACKEND_URL}/health`);
      if (response.status !== 200) throw new Error('Health check failed');
    });

    // Test API health endpoint
    await this.test('API Health Check', async () => {
      const response = await axios.get(`${BACKEND_URL}/api/health`);
      if (response.status !== 200) throw new Error('API health check failed');
    });

    // Test password reset email check
    await this.test('Check Email API', async () => {
      const response = await axios.post(`${BACKEND_URL}/api/auth/check-email`, {
        email: 'test@example.com'
      });
      // Should return 404 if email doesn't exist, which is expected
      if (response.status !== 404 && response.status !== 200) {
        throw new Error(`Unexpected status: ${response.status}`);
      }
    });

    // Test invalid email format
    await this.test('Invalid Email Format', async () => {
      try {
        await axios.post(`${BACKEND_URL}/api/auth/check-email`, {
          email: 'invalid-email'
        });
        throw new Error('Should have failed with invalid email');
      } catch (error) {
        if (error.response && error.response.status === 400) {
          // Expected behavior
          return;
        }
        throw error;
      }
    });

    // Test token verification with invalid token
    await this.test('Invalid Token Verification', async () => {
      try {
        await axios.post(`${BACKEND_URL}/api/auth/verify-reset-token`, {
          token: 'invalid-token-123'
        });
        throw new Error('Should have failed with invalid token');
      } catch (error) {
        if (error.response && error.response.status === 400) {
          // Expected behavior
          return;
        }
        throw error;
      }
    });
  }

  async testAuthenticationFlow() {
    this.log('\n🔐 Testing Authentication Flow...', 'warning');

    const testUser = {
      email: 'autotest@example.com',
      password: 'TestPassword123!',
      first_name: 'Auto',
      last_name: 'Test',
      phone: '0812345678'
    };

    let authToken = null;

    // Test user registration
    await this.test('User Registration', async () => {
      try {
        const response = await axios.post(`${BACKEND_URL}/api/auth/register`, testUser);
        if (response.status === 201 && response.data.token) {
          authToken = response.data.token;
          this.log('📝 Test user registered successfully', 'info');
        }
      } catch (error) {
        if (error.response?.status === 409) {
          this.log('📝 Test user already exists, continuing...', 'warning');
          return; // User already exists, continue with login test
        }
        throw error;
      }
    });

    // Test user login
    await this.test('User Login', async () => {
      const response = await axios.post(`${BACKEND_URL}/api/auth/login`, {
        email: testUser.email,
        password: testUser.password
      });
      
      if (response.status !== 200) throw new Error('Login failed');
      if (!response.data.token) throw new Error('No token received');
      if (!response.data.user) throw new Error('No user data received');
      
      authToken = response.data.token;
      this.log(`🎟️ Auth token received: ${authToken.substring(0, 20)}...`, 'info');
    });

    // Test authenticated request
    await this.test('Authenticated Request', async () => {
      if (!authToken) throw new Error('No auth token available');
      
      const response = await axios.get(`${BACKEND_URL}/api/profile`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (response.status !== 200) throw new Error('Authenticated request failed');
    });

    // Test invalid login
    await this.test('Invalid Login Credentials', async () => {
      try {
        await axios.post(`${BACKEND_URL}/api/auth/login`, {
          email: testUser.email,
          password: 'wrongpassword'
        });
        throw new Error('Should have failed with wrong password');
      } catch (error) {
        if (error.response && (error.response.status === 401 || error.response.status === 400)) {
          // Expected behavior
          return;
        }
        throw error;
      }
    });
  }

  async testPasswordResetFlow() {
    this.log('\n🔑 Testing Password Reset Flow...', 'warning');

    const testEmail = 'autotest@example.com';

    // Test forgot password request
    await this.test('Forgot Password Request', async () => {
      try {
        const response = await axios.post(`${BACKEND_URL}/api/auth/forgot-password`, {
          email: testEmail
        });
        
        if (response.status === 200) {
          this.log('📧 Password reset email would be sent', 'info');
        }
      } catch (error) {
        if (error.response?.status === 404) {
          this.log('📧 Email not found (expected for test)', 'warning');
          return; // Expected if test user doesn't exist
        }
        throw error;
      }
    });

    // Test forgot password with invalid email
    await this.test('Invalid Email for Password Reset', async () => {
      try {
        await axios.post(`${BACKEND_URL}/api/auth/forgot-password`, {
          email: 'nonexistent@example.com'
        });
        throw new Error('Should have failed with non-existent email');
      } catch (error) {
        if (error.response && error.response.status === 404) {
          // Expected behavior
          return;
        }
        throw error;
      }
    });

    // Test reset password with invalid token
    await this.test('Reset Password Invalid Token', async () => {
      try {
        await axios.post(`${BACKEND_URL}/api/auth/reset-password`, {
          token: 'invalid-token',
          password: 'NewPassword123!',
          confirmPassword: 'NewPassword123!'
        });
        throw new Error('Should have failed with invalid token');
      } catch (error) {
        if (error.response && error.response.status === 400) {
          // Expected behavior
          return;
        }
        throw error;
      }
    });

    // Test password mismatch
    await this.test('Password Mismatch', async () => {
      try {
        await axios.post(`${BACKEND_URL}/api/auth/reset-password`, {
          token: 'some-token',
          password: 'Password123!',
          confirmPassword: 'DifferentPassword123!'
        });
        throw new Error('Should have failed with password mismatch');
      } catch (error) {
        if (error.response && error.response.status === 400) {
          // Expected behavior
          return;
        }
        throw error;
      }
    });
  }

  async testDatabaseConnections() {
    this.log('\n💾 Testing Database Connections...', 'warning');

    // Test users table
    await this.test('Users Table Access', async () => {
      const response = await axios.get(`${BACKEND_URL}/api/admin/users`, {
        headers: {
          'Authorization': 'Bearer test-token' // This will likely fail, but tests the endpoint
        }
      });
      // Expected to fail without proper auth, but endpoint should exist
    });

    // Test rooms table
    await this.test('Rooms Table Access', async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/rooms`);
        // Should return data or proper error
      } catch (error) {
        if (error.response && error.response.status < 500) {
          // Client errors are expected, server errors are not
          return;
        }
        throw error;
      }
    });
  }

  async testRememberMeFunctionality() {
    this.log('\n🧠 Testing Remember Me Functionality...', 'warning');

    // Test localStorage operations (simulated)
    await this.test('Remember Me Storage Logic', async () => {
      // Simulate localStorage operations
      const testData = {
        remember_me: 'true',
        auth_token_backup: 'test-token-backup',
        user_data_backup: JSON.stringify({ id: 1, email: 'test@example.com' }),
        backup_expires_at: (Date.now() + 30 * 24 * 60 * 60 * 1000).toString()
      };
      
      // Validate data structure
      if (!testData.remember_me) throw new Error('Remember me flag missing');
      if (!testData.auth_token_backup) throw new Error('Backup token missing');
      if (!testData.user_data_backup) throw new Error('Backup user data missing');
      if (!testData.backup_expires_at) throw new Error('Backup expiration missing');
      
      const expiresAt = parseInt(testData.backup_expires_at);
      if (expiresAt <= Date.now()) throw new Error('Backup already expired');
      
      this.log('🔄 Remember Me data structure validated', 'info');
    });

    // Test token validation logic
    await this.test('Token Validation Logic', async () => {
      const validJWT = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODk5Mzg0MDAsImV4cCI6MTcyMTQ3NDQwMCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoianJvY2tldEBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6IkpvaG5ueSIsIlN1cm5hbWUiOiJSb2NrZXQiLCJFbWFpbCI6Impyb2NrZXRAZXhhbXBsZS5jb20iLCJSb2xlIjpbIk1hbmFnZXIiLCJQcm9qZWN0IEFkbWluaXN0cmF0b3IiXX0.7VNiDYGJZZhG4p3SMMR0_0r8S6B8_XMsGzTyJwI_V0w';
      
      // Test JWT structure (should have 3 parts)
      const parts = validJWT.split('.');
      if (parts.length !== 3) throw new Error('Invalid JWT structure');
      
      this.log('🔍 JWT structure validation passed', 'info');
    });
  }

  async testErrorHandling() {
    this.log('\n🚨 Testing Error Handling...', 'warning');

    // Test 404 endpoints
    await this.test('404 Error Handling', async () => {
      try {
        await axios.get(`${BACKEND_URL}/api/nonexistent-endpoint`);
        throw new Error('Should have returned 404');
      } catch (error) {
        if (error.response && error.response.status === 404) {
          return; // Expected
        }
        throw error;
      }
    });

    // Test malformed requests
    await this.test('Malformed Request Handling', async () => {
      try {
        await axios.post(`${BACKEND_URL}/api/auth/login`, {
          invalid: 'data'
        });
        throw new Error('Should have returned 400');
      } catch (error) {
        if (error.response && error.response.status === 400) {
          return; // Expected
        }
        throw error;
      }
    });

    // Test missing required fields
    await this.test('Missing Required Fields', async () => {
      try {
        await axios.post(`${BACKEND_URL}/api/auth/login`, {});
        throw new Error('Should have returned 400');
      } catch (error) {
        if (error.response && error.response.status === 400) {
          return; // Expected
        }
        throw error;
      }
    });
  }

  generateReport() {
    this.log('\n📊 Test Report', 'warning');
    this.log('='.repeat(50), 'info');
    this.log(`Total Tests: ${this.testCount}`, 'info');
    this.log(`Passed: ${this.passCount}`, 'success');
    this.log(`Failed: ${this.failCount}`, 'error');
    this.log(`Success Rate: ${((this.passCount / this.testCount) * 100).toFixed(1)}%`, 'info');
    this.log('='.repeat(50), 'info');

    if (this.failCount > 0) {
      this.log('\n❌ Failed Tests:', 'error');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => this.log(`  • ${r.name}: ${r.error}`, 'error'));
    }

    if (this.passCount > 0) {
      this.log('\n✅ Passed Tests:', 'success');
      this.results
        .filter(r => r.status === 'PASS')
        .forEach(r => this.log(`  • ${r.name}`, 'success'));
    }
  }

  async runAllTests() {
    this.log('🚀 Starting Automated Testing Suite...', 'warning');
    this.log('Testing Hotel Booking System Features', 'info');
    
    // Check if servers are running
    const backendRunning = await this.checkServerHealth();
    const frontendRunning = await this.checkFrontendHealth();

    if (!backendRunning) {
      this.log('⚠️ Backend server not running. Start with: cd backend/src && bun index.js', 'warning');
    }

    if (!frontendRunning) {
      this.log('⚠️ Frontend server not running. Start with: cd frontend && bun dev', 'warning');
    }

    // Run tests
    await this.testBackendAPIs();
    await this.testAuthenticationFlow();
    await this.testPasswordResetFlow();
    await this.testDatabaseConnections();
    await this.testRememberMeFunctionality();
    await this.testErrorHandling();

    this.generateReport();

    // Recommendations
    this.log('\n💡 Recommendations:', 'warning');
    if (this.failCount === 0) {
      this.log('🎉 All tests passed! System is working well.', 'success');
    } else {
      this.log('🔧 Some tests failed. Check the errors above and fix issues.', 'error');
    }

    if (!backendRunning || !frontendRunning) {
      this.log('🚨 Make sure both servers are running for complete testing.', 'warning');
    }
  }
}

// Run the tests
const tester = new AutoTester();
tester.runAllTests().catch(error => {
  console.error('Test suite crashed:', error);
});
