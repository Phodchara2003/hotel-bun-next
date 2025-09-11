const axios = require('axios');

// Quick test without dependencies
class QuickTester {
  constructor() {
    this.backendUrl = 'http://localhost:3003';
    this.frontendUrl = 'http://localhost:3000';
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      error: '\x1b[31m',
      warning: '\x1b[33m',
      reset: '\x1b[0m'
    };
    
    console.log(`${colors[type]}${message}${colors.reset}`);
  }

  async checkServers() {
    this.log('🔍 Checking servers...', 'info');
    
    // Check backend
    try {
      const backendResponse = await axios.get(`${this.backendUrl}/health`, { timeout: 3000 });
      this.log('✅ Backend server is running', 'success');
      console.log(`   Status: ${backendResponse.status}`);
      console.log(`   Message: ${backendResponse.data.message || 'OK'}`);
    } catch (error) {
      this.log('❌ Backend server not responding', 'error');
      console.log('   Start backend: cd backend/src && bun index.js');
    }

    // Check frontend
    try {
      const frontendResponse = await axios.get(this.frontendUrl, { timeout: 3000 });
      this.log('✅ Frontend server is running', 'success');
      console.log(`   Status: ${frontendResponse.status}`);
    } catch (error) {
      this.log('❌ Frontend server not responding', 'error');
      console.log('   Start frontend: cd frontend && bun dev');
    }
  }

  async testAPI() {
    this.log('\n🧪 Quick API Tests...', 'warning');
    
    const tests = [
      {
        name: 'Health Check',
        url: `${this.backendUrl}/health`,
        method: 'GET'
      },
      {
        name: 'API Health',
        url: `${this.backendUrl}/api/health`,
        method: 'GET'
      },
      {
        name: 'Invalid Email Check',
        url: `${this.backendUrl}/api/auth/check-email`,
        method: 'POST',
        data: { email: 'nonexistent@test.com' },
        expectedStatus: 404
      },
      {
        name: 'Invalid Token Verify',
        url: `${this.backendUrl}/api/auth/verify-reset-token`,
        method: 'POST',
        data: { token: 'invalid-token' },
        expectedStatus: 400
      }
    ];

    for (const test of tests) {
      try {
        let response;
        if (test.method === 'POST') {
          response = await axios.post(test.url, test.data, { timeout: 3000 });
        } else {
          response = await axios.get(test.url, { timeout: 3000 });
        }
        
        if (test.expectedStatus && response.status !== test.expectedStatus) {
          this.log(`⚠️  ${test.name}: Expected ${test.expectedStatus}, got ${response.status}`, 'warning');
        } else {
          this.log(`✅ ${test.name}: OK`, 'success');
        }
      } catch (error) {
        if (test.expectedStatus && error.response?.status === test.expectedStatus) {
          this.log(`✅ ${test.name}: Expected error`, 'success');
        } else {
          this.log(`❌ ${test.name}: ${error.message}`, 'error');
        }
      }
    }
  }

  async testFeatures() {
    this.log('\n🎯 Feature Status Check...', 'warning');
    
    const features = [
      {
        name: 'Password Reset System',
        files: [
          'frontend/app/forgot-password/page.jsx',
          'frontend/app/reset-password/page.jsx',
          'frontend/app/api/auth/forgot-password/route.js',
          'backend/src/routes/password-reset.js'
        ]
      },
      {
        name: 'Remember Me Functionality',
        files: [
          'frontend/contexts/AuthContext.jsx',
          'frontend/components/auth/SessionManager.jsx',
          'frontend/components/auth/RememberMeStatus.jsx'
        ]
      },
      {
        name: 'Authentication System',
        files: [
          'frontend/app/login/page.jsx',
          'frontend/app/register/page.jsx',
          'backend/src/routes/auth.js'
        ]
      }
    ];

    const fs = require('fs');
    const path = require('path');

    for (const feature of features) {
      const existingFiles = feature.files.filter(file => {
        const fullPath = path.join(__dirname, file);
        return fs.existsSync(fullPath);
      });
      
      const percentage = (existingFiles.length / feature.files.length) * 100;
      
      if (percentage === 100) {
        this.log(`✅ ${feature.name}: Complete (${existingFiles.length}/${feature.files.length})`, 'success');
      } else if (percentage >= 50) {
        this.log(`⚠️  ${feature.name}: Partial (${existingFiles.length}/${feature.files.length})`, 'warning');
      } else {
        this.log(`❌ ${feature.name}: Incomplete (${existingFiles.length}/${feature.files.length})`, 'error');
      }
    }
  }

  async run() {
    this.log('🚀 Quick Test Suite Starting...', 'info');
    this.log('Testing core functionality without heavy dependencies\n', 'info');
    
    await this.checkServers();
    await this.testAPI();
    await this.testFeatures();
    
    this.log('\n🎉 Quick test completed!', 'success');
    this.log('\nFor comprehensive testing:', 'info');
    this.log('  Backend: node auto-test.js', 'info');
    this.log('  Frontend: node frontend-test.js (requires Playwright)', 'info');
  }
}

// Run quick tests
const tester = new QuickTester();
tester.run().catch(error => {
  console.error('Quick test failed:', error.message);
});
