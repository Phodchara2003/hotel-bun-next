// E2E Authentication Tests
const TestConfig = require('./config');

class AuthTests {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async setup() {
    console.log('🚀 Setting up browser for auth tests...');
    this.browser = await TestConfig.createBrowser();
    this.page = await TestConfig.createPage(this.browser);
  }

  async teardown() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async testLogin(credentials = { email: 'admin@royalgarden.com', password: 'admin123' }) {
    console.log('🔑 Testing login...');
    
    try {
      // Navigate to login page
      await this.page.goto(`${TestConfig.defaults.baseUrl}/login`, { 
        waitUntil: 'networkidle2' 
      });

      // Fill login form
      await this.page.waitForSelector('input[type="email"]');
      await this.page.type('input[type="email"]', credentials.email);
      await this.page.type('input[type="password"]', credentials.password);

      // Submit form
      await this.page.click('button[type="submit"]');

      // Wait for navigation or success indicator
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Check if login was successful
      const currentUrl = this.page.url();
      console.log('📍 Current URL after login:', currentUrl);

      if (currentUrl.includes('/admin') || currentUrl.includes('/dashboard')) {
        console.log('✅ Login successful');
        return true;
      } else {
        console.log('❌ Login failed - still on login page');
        return false;
      }

    } catch (error) {
      console.error('❌ Login test error:', error);
      return false;
    }
  }

  async testUserManagementPage() {
    console.log('👥 Testing user management page...');
    
    try {
      // Navigate to user management
      await this.page.goto(`${TestConfig.defaults.baseUrl}/admin/user-management`, {
        waitUntil: 'networkidle2'
      });

      // Wait for data to load
      console.log('⏳ Waiting for user data to load...');
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Check if users table exists
      const usersTable = await this.page.$('tbody tr');
      if (usersTable) {
        console.log('✅ Users table found');
        
        // Count rows
        const rows = await this.page.$$('tbody tr');
        console.log(`📊 Found ${rows.length} user rows`);
        
        return true;
      } else {
        console.log('❌ No users table found');
        return false;
      }

    } catch (error) {
      console.error('❌ User management test error:', error);
      return false;
    }
  }

  async testAuthFlow() {
    console.log('🧪 Running complete auth flow test...');
    
    await this.setup();
    
    try {
      // Test login
      const loginSuccess = await this.testLogin();
      if (!loginSuccess) {
        throw new Error('Login failed');
      }

      // Test user management page
      const userMgmtSuccess = await this.testUserManagementPage();
      if (!userMgmtSuccess) {
        throw new Error('User management page test failed');
      }

      console.log('🎉 All auth tests passed!');
      return true;

    } catch (error) {
      console.error('❌ Auth flow test failed:', error);
      return false;
    } finally {
      // Keep browser open for inspection in development
      if (process.env.NODE_ENV !== 'test') {
        console.log('🔍 Keeping browser open for inspection...');
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
      await this.teardown();
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const authTests = new AuthTests();
  authTests.testAuthFlow();
}

module.exports = AuthTests;
