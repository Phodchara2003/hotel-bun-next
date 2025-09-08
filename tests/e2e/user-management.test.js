// E2E User Management Tests
const TestConfig = require('./config');
const AuthTests = require('./auth.test');

class UserManagementTests extends AuthTests {
  async testCreateUser() {
    console.log('➕ Testing create user...');
    
    try {
      // Click create user button - ใช้ XPath แทน
      await this.page.waitForXPath('//button[contains(text(), "เพิ่มผู้ใช้ใหม่")]');
      const createButton = await this.page.$x('//button[contains(text(), "เพิ่มผู้ใช้ใหม่")]');
      if (createButton.length > 0) {
        await createButton[0].click();
      }
      
      // Wait for modal
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Fill form
      const testEmail = `test_${Date.now()}@example.com`;
      const emailInput = await this.page.$('input[type="email"]');
      if (emailInput) {
        await emailInput.type(testEmail);
      }
      
      const nameInput = await this.page.$('input[placeholder*="ชื่อเต็ม"]');
      if (nameInput) {
        await nameInput.type('Test User');
      }
      
      const passwordInput = await this.page.$('input[type="password"]');
      if (passwordInput) {
        await passwordInput.type('test123');
      }
      
      // Submit form
      const submitButton = await this.page.$('button[type="submit"]');
      if (submitButton) {
        await submitButton.click();
      }
      
      // Wait for response
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log('✅ Create user test completed');
      return true;
      
    } catch (error) {
      console.error('❌ Create user test error:', error);
      return false;
    }
  }

  async testSearchUser() {
    console.log('🔍 Testing search user...');
    
    try {
      // Find search input - ลองหลาย selector
      let searchInput = await this.page.$('input[placeholder*="ค้นหา"]');
      if (!searchInput) {
        searchInput = await this.page.$('input[type="text"]');
      }
      if (!searchInput) {
        searchInput = await this.page.$('.search-input');
      }
      
      if (searchInput) {
        await searchInput.click();
        await searchInput.type('admin');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('✅ Search test completed');
        return true;
      } else {
        console.log('❌ Search input not found');
        return false;
      }
      
    } catch (error) {
      console.error('❌ Search user test error:', error);
      return false;
    }
  }

  async testFilterUsers() {
    console.log('🎛️ Testing filter users...');
    
    try {
      // Find filter dropdown
      const filterSelect = await this.page.$('select');
      if (filterSelect) {
        await filterSelect.select('admin');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('✅ Filter test completed');
        return true;
      } else {
        console.log('❌ Filter dropdown not found');
        return false;
      }
      
    } catch (error) {
      console.error('❌ Filter users test error:', error);
      return false;
    }
  }

  async runUserManagementTests() {
    console.log('🧪 Running user management tests...');
    
    await this.setup();
    
    try {
      // Login first
      const loginSuccess = await this.testLogin();
      if (!loginSuccess) {
        throw new Error('Login required for user management tests');
      }

      // Navigate to user management
      await this.page.goto(`${TestConfig.defaults.baseUrl}/admin/user-management`);
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Run tests
      await this.testSearchUser();
      await this.testFilterUsers();
      // await this.testCreateUser(); // Uncomment เมื่อต้องการทดสอบสร้างผู้ใช้

      console.log('🎉 All user management tests completed!');
      return true;

    } catch (error) {
      console.error('❌ User management tests failed:', error);
      return false;
    } finally {
      // Keep browser open for inspection
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
  const userMgmtTests = new UserManagementTests();
  userMgmtTests.runUserManagementTests();
}

module.exports = UserManagementTests;
