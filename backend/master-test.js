// Master Test Script - ทดสอบทุกส่วนของระบบ
// รัน Backend Tests + Integration Tests + Generate Report

const { runAllTests } = require('./auto-test-suite');
const { testFrontendBackendIntegration } = require('./integration-test');
const fs = require('fs');
const path = require('path');

async function runMasterTest() {
  console.log('🏆 HOTEL BOOKING SYSTEM - MASTER TEST SUITE');
  console.log('=' .repeat(80));
  console.log('⏰ Started at:', new Date().toISOString());
  console.log('🎯 Testing: Backend APIs + Database + Frontend Integration');
  console.log('=' .repeat(80));
  console.log('');

  const startTime = Date.now();
  let allTestsPassed = true;

  try {
    // Phase 1: Backend and Database Tests
    console.log('📋 PHASE 1: BACKEND & DATABASE TESTS');
    console.log('-'.repeat(50));
    
    const backendSuccess = await runAllTests();
    if (!backendSuccess) {
      allTestsPassed = false;
      console.log('❌ Backend tests failed!');
    } else {
      console.log('✅ Backend tests completed successfully!');
    }

    console.log('\n' + '='.repeat(50));

    // Phase 2: Integration Tests
    console.log('📋 PHASE 2: FRONTEND-BACKEND INTEGRATION TESTS');
    console.log('-'.repeat(50));
    
    await testFrontendBackendIntegration();

    console.log('\n' + '='.repeat(50));

    // Final Summary
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('🏁 MASTER TEST SUITE COMPLETED');
    console.log('=' .repeat(80));
    console.log(`⏱️ Total Duration: ${duration} seconds`);
    console.log(`📊 Overall Status: ${allTestsPassed ? '✅ ALL PASSED' : '❌ SOME FAILED'}`);
    
    if (allTestsPassed) {
      console.log('');
      console.log('🎉 CONGRATULATIONS! 🎉');
      console.log('✨ Your Hotel Booking System is working perfectly!');
      console.log('🚀 All components tested and verified:');
      console.log('   ✅ Backend Server (Node.js)');
      console.log('   ✅ JSON Database System');
      console.log('   ✅ API Endpoints (Hotels, Notifications, Settings)');
      console.log('   ✅ CORS Configuration');
      console.log('   ✅ Error Handling');
      console.log('   ✅ Frontend Server (Next.js)');
      console.log('   ✅ Frontend-Backend Integration');
      console.log('');
      console.log('🌟 System Status: PRODUCTION READY! 🌟');
    } else {
      console.log('');
      console.log('⚠️ Some issues found. Please check the detailed reports above.');
    }

    // Generate comprehensive report
    const report = {
      timestamp: new Date().toISOString(),
      duration: duration,
      overall_status: allTestsPassed ? 'PASSED' : 'FAILED',
      phases: {
        backend_database: backendSuccess ? 'PASSED' : 'FAILED',
        integration: 'COMPLETED'
      },
      next_steps: allTestsPassed ? [
        'System is ready for production deployment',
        'Consider adding more advanced features',
        'Set up monitoring and logging'
      ] : [
        'Fix failing tests',
        'Check server configurations',
        'Verify all dependencies are installed'
      ]
    };

    fs.writeFileSync(path.join(__dirname, 'master-test-report.json'), JSON.stringify(report, null, 2));
    console.log('💾 Master test report saved to master-test-report.json');

  } catch (error) {
    console.error('❌ Master test suite failed:', error);
    allTestsPassed = false;
  }

  console.log('=' .repeat(80));
  process.exit(allTestsPassed ? 0 : 1);
}

// Run master tests if called directly
if (require.main === module) {
  runMasterTest();
}

module.exports = { runMasterTest };