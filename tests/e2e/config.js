// E2E Test Configuration
const puppeteer = require('puppeteer');

class TestConfig {
  static get defaults() {
    return {
      baseUrl: 'http://localhost:3000',
      apiUrl: 'http://localhost:3002',
      timeout: 30000,
      viewport: { width: 1280, height: 720 },
      browser: {
        headless: false, // เปลี่ยนเป็น true สำหรับ CI/CD
        devtools: true,
        slowMo: 100, // ช้าลง 100ms เพื่อดูการทำงาน
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      }
    };
  }

  static async createBrowser() {
    return await puppeteer.launch(this.defaults.browser);
  }

  static async createPage(browser) {
    const page = await browser.newPage();
    await page.setViewport(this.defaults.viewport);
    
    // Enable console logging
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      if (text.includes('🔍') || text.includes('📞') || text.includes('✅') || text.includes('❌') || text.includes('🧪')) {
        console.log(`[${type.toUpperCase()}] ${text}`);
      }
    });

    // Handle page errors
    page.on('pageerror', error => {
      console.error('❌ Page Error:', error);
    });

    return page;
  }
}

module.exports = TestConfig;
