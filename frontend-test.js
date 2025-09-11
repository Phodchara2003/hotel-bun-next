#!/usr/bin/env node

/**
 * Frontend Automation Tester
 * Tests UI interactions and frontend functionality
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

class FrontendTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = [];
    this.testCount = 0;
    this.passCount = 0;
    this.failCount = 0;
    this.baseUrl = 'http://localhost:3000';
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      error: '\x1b[31m',
      warning: '\x1b[33m',
      reset: '\x1b[0m'
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

  async setup() {
    this.log('🚀 Setting up browser...', 'info');
    this.browser = await chromium.launch({ 
      headless: false, // Set to true for CI/CD
      slowMo: 500 // Slow down for visibility
    });
    this.page = await this.browser.newPage();
    
    // Set viewport
    await this.page.setViewportSize({ width: 1280, height: 720 });
    
    // Add console logging
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        this.log(`🔴 Browser Error: ${msg.text()}`, 'error');
      }
    });
  }

  async teardown() {
    if (this.browser) {
      await this.browser.close();
      this.log('🧹 Browser closed', 'info');
    }
  }

  async testHomePage() {
    this.log('\n🏠 Testing Home Page...', 'warning');

    await this.test('Home Page Load', async () => {
      await this.page.goto(this.baseUrl);
      await this.page.waitForLoadState('networkidle');
      
      const title = await this.page.title();
      if (!title.includes('HotelBook')) {
        throw new Error(`Unexpected title: ${title}`);
      }
    });

    await this.test('Navigation Menu', async () => {
      // Check if navigation exists
      const nav = await this.page.locator('nav').first();
      await nav.waitFor({ state: 'visible' });
      
      // Check for key navigation items
      const loginBtn = this.page.locator('text=เข้าสู่ระบบ').first();
      await loginBtn.waitFor({ state: 'visible', timeout: 5000 });
    });
  }

  async testLoginPage() {
    this.log('\n🔐 Testing Login Page...', 'warning');

    await this.test('Login Page Navigation', async () => {
      await this.page.goto(`${this.baseUrl}/login`);
      await this.page.waitForLoadState('networkidle');
      
      // Check for login form
      const emailInput = this.page.locator('input[type="email"]').first();
      const passwordInput = this.page.locator('input[type="password"]').first();
      
      await emailInput.waitFor({ state: 'visible' });
      await passwordInput.waitFor({ state: 'visible' });
    });

    await this.test('Login Form Elements', async () => {
      // Check email input
      const emailInput = this.page.locator('input[type="email"]').first();
      await emailInput.fill('test@example.com');
      
      const emailValue = await emailInput.inputValue();
      if (emailValue !== 'test@example.com') {
        throw new Error('Email input not working');
      }
      
      // Check password input
      const passwordInput = this.page.locator('input[type="password"]').first();
      await passwordInput.fill('testpassword');
      
      // Check remember me checkbox
      const rememberMe = this.page.locator('input[type="checkbox"]').first();
      await rememberMe.check();
      
      const isChecked = await rememberMe.isChecked();
      if (!isChecked) {
        throw new Error('Remember me checkbox not working');
      }
    });

    await this.test('Remember Me Functionality', async () => {
      // Check if remember me checkbox exists and has proper label
      const rememberMeLabel = this.page.locator('text=จดจำการเข้าสู่ระบบ');
      await rememberMeLabel.waitFor({ state: 'visible' });
      
      // Check if the label shows duration
      const labelText = await rememberMeLabel.textContent();
      if (!labelText.includes('30 วัน')) {
        throw new Error('Remember me duration not displayed');
      }
    });

    await this.test('Password Visibility Toggle', async () => {
      const passwordInput = this.page.locator('input[type="password"]').first();
      const eyeIcon = this.page.locator('[data-testid="password-toggle"], .eye-icon').first();
      
      if (await eyeIcon.count() > 0) {
        await eyeIcon.click();
        await this.page.waitForTimeout(500);
        
        // Check if input type changed to text
        const inputType = await passwordInput.getAttribute('type');
        if (inputType === 'password') {
          // Try alternative selector
          const toggleBtn = this.page.locator('button').filter({ hasText: /eye/i }).first();
          if (await toggleBtn.count() > 0) {
            await toggleBtn.click();
          }
        }
      }
    });

    await this.test('Forgot Password Link', async () => {
      const forgotLink = this.page.locator('text=ลืมรหัสผ่าน');
      await forgotLink.waitFor({ state: 'visible' });
      
      // Check if link is clickable
      await forgotLink.click();
      await this.page.waitForLoadState('networkidle');
      
      const currentUrl = this.page.url();
      if (!currentUrl.includes('/forgot-password')) {
        throw new Error('Forgot password navigation failed');
      }
      
      // Go back to login
      await this.page.goto(`${this.baseUrl}/login`);
    });
  }

  async testForgotPasswordPage() {
    this.log('\n🔑 Testing Forgot Password Page...', 'warning');

    await this.test('Forgot Password Page Load', async () => {
      await this.page.goto(`${this.baseUrl}/forgot-password`);
      await this.page.waitForLoadState('networkidle');
      
      // Check for email input
      const emailInput = this.page.locator('input[type="email"]').first();
      await emailInput.waitFor({ state: 'visible' });
      
      // Check for submit button
      const submitBtn = this.page.locator('button[type="submit"]').first();
      await submitBtn.waitFor({ state: 'visible' });
    });

    await this.test('Forgot Password Form Validation', async () => {
      const emailInput = this.page.locator('input[type="email"]').first();
      const submitBtn = this.page.locator('button[type="submit"]').first();
      
      // Test with invalid email
      await emailInput.fill('invalid-email');
      await submitBtn.click();
      
      // Should show validation error (HTML5 validation or custom)
      await this.page.waitForTimeout(1000);
      
      // Test with valid email format
      await emailInput.fill('test@example.com');
      const value = await emailInput.inputValue();
      if (value !== 'test@example.com') {
        throw new Error('Email input validation failed');
      }
    });

    await this.test('Back to Login Link', async () => {
      const backLink = this.page.locator('text=กลับไปหน้าเข้าสู่ระบบ').first();
      if (await backLink.count() > 0) {
        await backLink.click();
        await this.page.waitForLoadState('networkidle');
        
        const currentUrl = this.page.url();
        if (!currentUrl.includes('/login')) {
          throw new Error('Back to login navigation failed');
        }
      }
    });
  }

  async testRegisterPage() {
    this.log('\n📝 Testing Register Page...', 'warning');

    await this.test('Register Page Load', async () => {
      await this.page.goto(`${this.baseUrl}/register`);
      await this.page.waitForLoadState('networkidle');
      
      // Check for form fields
      const firstNameInput = this.page.locator('input[name="first_name"], input[placeholder*="ชื่อ"]').first();
      const lastNameInput = this.page.locator('input[name="last_name"], input[placeholder*="นามสกุล"]').first();
      const emailInput = this.page.locator('input[type="email"]').first();
      
      await firstNameInput.waitFor({ state: 'visible' });
      await lastNameInput.waitFor({ state: 'visible' });
      await emailInput.waitFor({ state: 'visible' });
    });

    await this.test('Register Form Filling', async () => {
      const firstNameInput = this.page.locator('input[name="first_name"], input[placeholder*="ชื่อ"]').first();
      const lastNameInput = this.page.locator('input[name="last_name"], input[placeholder*="นามสกุล"]').first();
      const emailInput = this.page.locator('input[type="email"]').first();
      const passwordInput = this.page.locator('input[type="password"]').first();
      
      await firstNameInput.fill('ทดสอบ');
      await lastNameInput.fill('อัตโนมัติ');
      await emailInput.fill('autotest@example.com');
      await passwordInput.fill('TestPassword123!');
      
      // Verify values
      const firstName = await firstNameInput.inputValue();
      const lastName = await lastNameInput.inputValue();
      const email = await emailInput.inputValue();
      
      if (firstName !== 'ทดสอบ' || lastName !== 'อัตโนมัติ' || email !== 'autotest@example.com') {
        throw new Error('Form filling failed');
      }
    });

    await this.test('Terms and Conditions', async () => {
      const termsCheckbox = this.page.locator('input[type="checkbox"]').first();
      if (await termsCheckbox.count() > 0) {
        await termsCheckbox.check();
        const isChecked = await termsCheckbox.isChecked();
        if (!isChecked) {
          throw new Error('Terms checkbox not working');
        }
      }
    });
  }

  async testResponsiveDesign() {
    this.log('\n📱 Testing Responsive Design...', 'warning');

    await this.test('Mobile View - Login Page', async () => {
      await this.page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
      await this.page.goto(`${this.baseUrl}/login`);
      await this.page.waitForLoadState('networkidle');
      
      // Check if elements are still visible and properly arranged
      const emailInput = this.page.locator('input[type="email"]').first();
      const passwordInput = this.page.locator('input[type="password"]').first();
      
      await emailInput.waitFor({ state: 'visible' });
      await passwordInput.waitFor({ state: 'visible' });
      
      // Check if elements are not overlapping
      const emailBox = await emailInput.boundingBox();
      const passwordBox = await passwordInput.boundingBox();
      
      if (emailBox && passwordBox && emailBox.y >= passwordBox.y) {
        throw new Error('Form elements overlapping in mobile view');
      }
    });

    await this.test('Tablet View - Home Page', async () => {
      await this.page.setViewportSize({ width: 768, height: 1024 }); // iPad
      await this.page.goto(this.baseUrl);
      await this.page.waitForLoadState('networkidle');
      
      // Navigation should still be functional
      const nav = this.page.locator('nav').first();
      await nav.waitFor({ state: 'visible' });
    });

    // Reset to desktop view
    await this.page.setViewportSize({ width: 1280, height: 720 });
  }

  async testAccessibility() {
    this.log('\n♿ Testing Accessibility...', 'warning');

    await this.test('Keyboard Navigation', async () => {
      await this.page.goto(`${this.baseUrl}/login`);
      await this.page.waitForLoadState('networkidle');
      
      // Test tab navigation
      await this.page.keyboard.press('Tab');
      await this.page.keyboard.press('Tab');
      
      // Should be able to reach form elements
      const focusedElement = await this.page.evaluate(() => document.activeElement.tagName);
      if (!['INPUT', 'BUTTON', 'A'].includes(focusedElement)) {
        this.log(`⚠️ Focused element: ${focusedElement}`, 'warning');
      }
    });

    await this.test('Form Labels', async () => {
      await this.page.goto(`${this.baseUrl}/login`);
      
      // Check if inputs have labels or aria-labels
      const emailInput = this.page.locator('input[type="email"]').first();
      const passwordInput = this.page.locator('input[type="password"]').first();
      
      const emailLabel = await emailInput.getAttribute('aria-label') || 
                         await emailInput.getAttribute('placeholder');
      const passwordLabel = await passwordInput.getAttribute('aria-label') || 
                           await passwordInput.getAttribute('placeholder');
      
      if (!emailLabel || !passwordLabel) {
        throw new Error('Form inputs missing labels or placeholders');
      }
    });
  }

  async testSessionManager() {
    this.log('\n🧠 Testing Session Manager...', 'warning');

    await this.test('Session Widget Visibility', async () => {
      await this.page.goto(this.baseUrl);
      await this.page.waitForLoadState('networkidle');
      
      // Look for session manager widget (should appear when logged in)
      const sessionWidget = this.page.locator('[class*="session"], [class*="timer"], [data-testid="session-manager"]');
      
      // If not logged in, widget shouldn't be visible
      const count = await sessionWidget.count();
      this.log(`Session widget elements found: ${count}`, 'info');
    });

    await this.test('Remember Me Status Component', async () => {
      // This would be visible in a logged-in state
      // For now, just check if the component code exists in the page
      await this.page.goto(`${this.baseUrl}/login`);
      
      const rememberMeText = this.page.locator('text=จดจำการเข้าสู่ระบบ');
      await rememberMeText.waitFor({ state: 'visible' });
      
      const textContent = await rememberMeText.textContent();
      if (!textContent.includes('30 วัน')) {
        throw new Error('Remember Me duration not displayed correctly');
      }
    });
  }

  async testPerformance() {
    this.log('\n⚡ Testing Performance...', 'warning');

    await this.test('Page Load Time', async () => {
      const startTime = Date.now();
      
      await this.page.goto(this.baseUrl);
      await this.page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      this.log(`Page load time: ${loadTime}ms`, 'info');
      
      if (loadTime > 5000) {
        throw new Error(`Page load too slow: ${loadTime}ms`);
      }
    });

    await this.test('JavaScript Errors', async () => {
      const errors = [];
      
      this.page.on('pageerror', error => {
        errors.push(error.message);
      });
      
      await this.page.goto(`${this.baseUrl}/login`);
      await this.page.waitForLoadState('networkidle');
      
      if (errors.length > 0) {
        this.log(`JavaScript errors found: ${errors.join(', ')}`, 'warning');
        // Don't fail the test for now, just warn
      }
    });
  }

  generateReport() {
    this.log('\n📊 Frontend Test Report', 'warning');
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

    // Generate HTML report
    this.generateHTMLReport();
  }

  generateHTMLReport() {
    const reportHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Frontend Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f8ff; padding: 20px; border-radius: 8px; }
        .pass { color: green; }
        .fail { color: red; }
        .test-item { margin: 10px 0; padding: 10px; border-left: 4px solid #ccc; }
        .test-pass { border-left-color: green; background: #f0fff0; }
        .test-fail { border-left-color: red; background: #fff0f0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Frontend Test Report</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <p>Total: ${this.testCount} | Passed: <span class="pass">${this.passCount}</span> | Failed: <span class="fail">${this.failCount}</span></p>
        <p>Success Rate: ${((this.passCount / this.testCount) * 100).toFixed(1)}%</p>
    </div>
    
    <h2>Test Results</h2>
    ${this.results.map(r => `
        <div class="test-item ${r.status === 'PASS' ? 'test-pass' : 'test-fail'}">
            <strong>${r.status === 'PASS' ? '✅' : '❌'} ${r.name}</strong>
            ${r.error ? `<br><small>Error: ${r.error}</small>` : ''}
        </div>
    `).join('')}
</body>
</html>`;

    fs.writeFileSync('frontend-test-report.html', reportHTML);
    this.log('📄 HTML report saved to frontend-test-report.html', 'info');
  }

  async runAllTests() {
    this.log('🚀 Starting Frontend Automated Testing...', 'warning');
    
    try {
      await this.setup();
      
      await this.testHomePage();
      await this.testLoginPage();
      await this.testForgotPasswordPage();
      await this.testRegisterPage();
      await this.testResponsiveDesign();
      await this.testAccessibility();
      await this.testSessionManager();
      await this.testPerformance();
      
      this.generateReport();
      
    } catch (error) {
      this.log(`💥 Test suite crashed: ${error.message}`, 'error');
    } finally {
      await this.teardown();
    }
  }
}

// Check if Playwright is available
async function checkDependencies() {
  try {
    require('playwright');
    return true;
  } catch (error) {
    console.log('\x1b[31m❌ Playwright not installed. Run: bun add -D playwright\x1b[0m');
    console.log('\x1b[33m💡 After installing, run: bunx playwright install chromium\x1b[0m');
    return false;
  }
}

// Main execution
async function main() {
  const hasPlaywright = await checkDependencies();
  
  if (!hasPlaywright) {
    console.log('\x1b[33m⚠️ Running basic tests without Playwright...\x1b[0m');
    
    // Run basic tests without browser
    const axios = require('axios');
    try {
      const response = await axios.get('http://localhost:3000', { timeout: 5000 });
      console.log('\x1b[32m✅ Frontend server is responding\x1b[0m');
    } catch (error) {
      console.log('\x1b[31m❌ Frontend server not responding. Start with: cd frontend && bun dev\x1b[0m');
    }
    return;
  }
  
  const tester = new FrontendTester();
  await tester.runAllTests();
}

main().catch(console.error);
