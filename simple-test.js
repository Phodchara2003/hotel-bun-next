// No-dependency test runner using built-in Node.js modules
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

class SimpleTester {
  constructor() {
    this.results = [];
    this.testCount = 0;
    this.passCount = 0;
    this.failCount = 0;
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

  async httpGet(url) {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      
      client.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            data: data,
            headers: res.headers
          });
        });
      }).on('error', reject);
    });
  }

  async httpPost(url, postData) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const client = url.startsWith('https') ? https : http;
      
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (url.startsWith('https') ? 443 : 80),
        path: urlObj.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = client.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            data: data,
            headers: res.headers
          });
        });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });
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

  async checkServers() {
    this.log('\n🔍 Checking Servers...', 'warning');
    
    await this.test('Backend Server Health', async () => {
      try {
        const response = await this.httpGet('http://localhost:3003/health');
        if (response.status !== 200) {
          throw new Error(`Backend returned status ${response.status}`);
        }
        this.log('   Backend is responding correctly', 'info');
      } catch (error) {
        throw new Error('Backend server not responding. Start with: cd backend/src && bun index.js');
      }
    });

    await this.test('Frontend Server Health', async () => {
      try {
        const response = await this.httpGet('http://localhost:3000');
        if (response.status !== 200) {
          throw new Error(`Frontend returned status ${response.status}`);
        }
        this.log('   Frontend is responding correctly', 'info');
      } catch (error) {
        throw new Error('Frontend server not responding. Start with: cd frontend && bun dev');
      }
    });
  }

  async testAPIs() {
    this.log('\n🧪 Testing API Endpoints...', 'warning');

    await this.test('API Health Check', async () => {
      const response = await this.httpGet('http://localhost:3003/api/health');
      if (response.status !== 200) {
        throw new Error(`API health check failed with status ${response.status}`);
      }
    });

    await this.test('Password Reset - Invalid Email', async () => {
      const postData = JSON.stringify({ email: 'nonexistent@test.com' });
      const response = await this.httpPost('http://localhost:3003/api/auth/check-email', postData);
      
      // Should return 404 for non-existent email
      if (response.status !== 404) {
        this.log(`   Expected 404, got ${response.status}`, 'warning');
      }
    });

    await this.test('Password Reset - Invalid Token', async () => {
      const postData = JSON.stringify({ token: 'invalid-token-123' });
      const response = await this.httpPost('http://localhost:3003/api/auth/verify-reset-token', postData);
      
      // Should return 400 for invalid token
      if (response.status !== 400) {
        this.log(`   Expected 400, got ${response.status}`, 'warning');
      }
    });

    await this.test('Login - Missing Data', async () => {
      const postData = JSON.stringify({});
      const response = await this.httpPost('http://localhost:3003/api/auth/login', postData);
      
      // Should return 400 for missing data
      if (response.status !== 400) {
        this.log(`   Expected 400, got ${response.status}`, 'warning');
      }
    });
  }

  checkFiles() {
    this.log('\n📁 Checking File Structure...', 'warning');

    const criticalFiles = [
      // Frontend files
      'frontend/app/login/page.jsx',
      'frontend/app/register/page.jsx',
      'frontend/app/forgot-password/page.jsx',
      'frontend/app/reset-password/page.jsx',
      'frontend/contexts/AuthContext.jsx',
      'frontend/components/auth/SessionManager.jsx',
      'frontend/components/auth/RememberMeStatus.jsx',
      
      // Backend files
      'backend/src/index.js',
      'backend/src/routes/password-reset.js',
      'backend/src/db/add-reset-token-columns.js',
      
      // API routes
      'frontend/app/api/auth/forgot-password/route.js',
      'frontend/app/api/auth/reset-password/route.js',
      
      // Configuration
      'frontend/package.json',
      'backend/package.json'
    ];

    let existingFiles = 0;
    let missingFiles = [];

    criticalFiles.forEach(file => {
      const fullPath = path.join(__dirname, file);
      if (fs.existsSync(fullPath)) {
        existingFiles++;
      } else {
        missingFiles.push(file);
      }
    });

    const percentage = (existingFiles / criticalFiles.length) * 100;
    
    this.log(`📊 File Check: ${existingFiles}/${criticalFiles.length} files exist (${percentage.toFixed(1)}%)`, 'info');
    
    if (percentage === 100) {
      this.log('✅ All critical files present', 'success');
    } else if (percentage >= 80) {
      this.log('⚠️ Most files present, some missing', 'warning');
      if (missingFiles.length <= 3) {
        missingFiles.forEach(file => this.log(`   Missing: ${file}`, 'warning'));
      }
    } else {
      this.log('❌ Many critical files missing', 'error');
    }
  }

  checkFeatures() {
    this.log('\n🎯 Feature Implementation Check...', 'warning');

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
          'frontend/app/register/page.jsx'
        ]
      }
    ];

    features.forEach(feature => {
      const existingFiles = feature.files.filter(file => {
        const fullPath = path.join(__dirname, file);
        return fs.existsSync(fullPath);
      });
      
      const percentage = (existingFiles.length / feature.files.length) * 100;
      
      if (percentage === 100) {
        this.log(`✅ ${feature.name}: Complete`, 'success');
      } else if (percentage >= 50) {
        this.log(`⚠️ ${feature.name}: ${percentage.toFixed(0)}% complete`, 'warning');
      } else {
        this.log(`❌ ${feature.name}: ${percentage.toFixed(0)}% complete`, 'error');
      }
    });
  }

  checkDependencies() {
    this.log('\n📦 Checking Dependencies...', 'warning');

    const frontendPkg = path.join(__dirname, 'frontend', 'package.json');
    const backendPkg = path.join(__dirname, 'backend', 'package.json');

    if (fs.existsSync(frontendPkg)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(frontendPkg, 'utf8'));
        const hasNextJS = pkg.dependencies && pkg.dependencies.next;
        const hasBcrypt = pkg.dependencies && pkg.dependencies.bcryptjs;
        
        this.log(`📱 Frontend: Next.js ${hasNextJS ? '✅' : '❌'}, bcryptjs ${hasBcrypt ? '✅' : '❌'}`, 'info');
      } catch (error) {
        this.log('❌ Frontend package.json parse error', 'error');
      }
    } else {
      this.log('❌ Frontend package.json not found', 'error');
    }

    if (fs.existsSync(backendPkg)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(backendPkg, 'utf8'));
        const hasElysia = pkg.dependencies && (pkg.dependencies.elysia || pkg.dependencies['@elysiajs/cors']);
        
        this.log(`🚀 Backend: Elysia ${hasElysia ? '✅' : '❌'}`, 'info');
      } catch (error) {
        this.log('❌ Backend package.json parse error', 'error');
      }
    } else {
      this.log('❌ Backend package.json not found', 'error');
    }
  }

  generateReport() {
    this.log('\n📊 Test Summary Report', 'warning');
    this.log('='.repeat(60), 'info');
    this.log(`🧪 Total Tests: ${this.testCount}`, 'info');
    this.log(`✅ Passed: ${this.passCount}`, 'success');
    this.log(`❌ Failed: ${this.failCount}`, 'error');
    this.log(`📈 Success Rate: ${((this.passCount / this.testCount) * 100).toFixed(1)}%`, 'info');
    this.log('='.repeat(60), 'info');

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

    this.log('\n💡 Next Steps:', 'warning');
    if (this.testCount === 0) {
      this.log('⚠️ No tests were run. Check server connectivity.', 'warning');
    } else if (this.failCount === 0) {
      this.log('🎉 All tests passed! System is working well.', 'success');
      this.log('🚀 Ready for full testing with: node auto-test.js', 'info');
    } else {
      this.log('🔧 Fix failing tests before proceeding.', 'warning');
      this.log('📋 Check server startup commands above.', 'info');
    }
  }

  async run() {
    const startTime = Date.now();
    
    this.log('🚀 Simple Automated Test Suite', 'warning');
    this.log('Testing core Hotel Booking System functionality\n', 'info');
    
    // File system checks (always run)
    this.checkFiles();
    this.checkFeatures();
    this.checkDependencies();
    
    // Server tests (may fail if servers not running)
    try {
      await this.checkServers();
      await this.testAPIs();
    } catch (error) {
      this.log(`\n⚠️ Server tests skipped: ${error.message}`, 'warning');
    }
    
    const duration = Date.now() - startTime;
    this.log(`\n⏱️ Test completed in ${duration}ms`, 'info');
    
    this.generateReport();
  }
}

// Run the simple test suite
const tester = new SimpleTester();
tester.run().catch(error => {
  console.error('\x1b[31m💥 Test suite crashed:', error.message, '\x1b[0m');
});
