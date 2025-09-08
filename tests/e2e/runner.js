// Test Runner - เรียกใช้ทุก test
const AuthTests = require('./auth.test');
const UserManagementTests = require('./user-management.test');

class TestRunner {
  static async runAllTests() {
    console.log('🚀 Starting E2E Test Suite...');
    console.log('=====================================');
    
    const results = {};
    
    try {
      // Auth Tests
      console.log('\n📋 Running Auth Tests...');
      const authTests = new AuthTests();
      results.auth = await authTests.testAuthFlow();
      
      // User Management Tests
      console.log('\n📋 Running User Management Tests...');
      const userMgmtTests = new UserManagementTests();
      results.userManagement = await userMgmtTests.runUserManagementTests();
      
      // Summary
      console.log('\n=====================================');
      console.log('📊 Test Results Summary:');
      console.log(`✅ Auth Tests: ${results.auth ? 'PASSED' : 'FAILED'}`);
      console.log(`✅ User Management Tests: ${results.userManagement ? 'PASSED' : 'FAILED'}`);
      
      const allPassed = Object.values(results).every(result => result === true);
      console.log(`\n🎯 Overall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
      
      return allPassed;
      
    } catch (error) {
      console.error('❌ Test runner error:', error);
      return false;
    }
  }
  
  static async runAuthTestsOnly() {
    console.log('🔑 Running Auth Tests Only...');
    const authTests = new AuthTests();
    return await authTests.testAuthFlow();
  }
  
  static async runUserMgmtTestsOnly() {
    console.log('👥 Running User Management Tests Only...');
    const userMgmtTests = new UserManagementTests();
    return await userMgmtTests.runUserManagementTests();
  }
}

// Command line interface
if (require.main === module) {
  const testType = process.argv[2] || 'all';
  
  switch (testType) {
    case 'auth':
      TestRunner.runAuthTestsOnly();
      break;
    case 'user':
      TestRunner.runUserMgmtTestsOnly();
      break;
    case 'all':
    default:
      TestRunner.runAllTests();
      break;
  }
}

module.exports = TestRunner;
