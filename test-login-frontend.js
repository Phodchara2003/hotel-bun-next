// Test frontend login and user management
const puppeteer = require('puppeteer');

async function testLoginAndUserManagement() {
  let browser;
  try {
    console.log('🚀 Starting browser...');
    browser = await puppeteer.launch({ 
      headless: false, 
      devtools: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      if (text.includes('🔍') || text.includes('📞') || text.includes('✅') || text.includes('❌') || text.includes('🧪')) {
        console.log(`[${type.toUpperCase()}] ${text}`);
      }
    });
    
    // Navigate to login page
    console.log('📍 Navigating to login page...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    
    // Fill login form
    console.log('📝 Filling login form...');
    await page.type('input[type="email"]', 'admin@royalgarden.com');
    await page.type('input[type="password"]', 'admin123');
    
    // Submit login
    console.log('🔑 Submitting login...');
    await page.click('button[type="submit"]');
    
    // Wait for redirect or success
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Navigate to user management
    console.log('👥 Navigating to user management...');
    await page.goto('http://localhost:3000/admin/user-management', { waitUntil: 'networkidle2' });
    
    // Wait for logs and API calls
    console.log('⏳ Waiting for API calls and logs...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    console.log('✅ Test completed. Check browser console for detailed logs.');
    
    // Keep browser open for manual inspection
    await new Promise(resolve => setTimeout(resolve, 30000));
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testLoginAndUserManagement();
