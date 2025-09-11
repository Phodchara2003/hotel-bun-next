// ทดสอบการล็อกอินด้วยบัญชีทดสอบทั้งหมด
const http = require('http');
const https = require('https');

const BASE_URL = 'http://localhost:3000';

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testLogin(email, password, accountType) {
  console.log(`\n🔍 ทดสอบการล็อกอิน: ${accountType}`);
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);
  
  const loginData = JSON.stringify({ email, password });
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      },
      body: loginData
    });
    
    if (response.status === 200) {
      console.log(`   ✅ ล็อกอินสำเร็จ`);
      if (response.data.user) {
        console.log(`   👤 ชื่อผู้ใช้: ${response.data.user.firstName || 'ไม่ระบุ'} ${response.data.user.lastName || ''}`);
        console.log(`   🎭 บทบาท: ${response.data.user.role || 'ไม่ระบุ'}`);
        console.log(`   🆔 ID: ${response.data.user.id || 'ไม่ระบุ'}`);
      }
      if (response.data.token) {
        console.log(`   🔑 Token: มี (${response.data.token.substring(0, 20)}...)`);
      }
      return true;
    } else {
      console.log(`   ❌ ล็อกอินล้มเหลว - Status: ${response.status}`);
      console.log(`   📝 ข้อความ: ${response.data.message || response.data.error || 'ไม่ทราบข้อผิดพลาด'}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ เกิดข้อผิดพลาด: ${error.message}`);
    return false;
  }
}

async function testAllLoginAccounts() {
  console.log('🚀 เริ่มทดสอบการล็อกอินบัญชีทดสอบทั้งหมด');
  console.log('=' * 60);
  
  const testAccounts = [
    { email: 'admin@hotel.com', password: 'admin123', type: 'Admin' },
    { email: 'user@hotel.com', password: 'user123', type: 'Customer' },
    { email: 'staff@hotel.com', password: 'staff123', type: 'Staff' }
  ];
  
  let successCount = 0;
  
  for (const account of testAccounts) {
    const success = await testLogin(account.email, account.password, account.type);
    if (success) successCount++;
  }
  
  console.log('\n' + '=' * 60);
  console.log(`📊 สรุปผลการทดสอบ: ${successCount}/${testAccounts.length} บัญชี`);
  
  if (successCount === testAccounts.length) {
    console.log('🎉 การทดสอบผ่านทั้งหมด! ระบบล็อกอินทำงานปกติ');
  } else {
    console.log('⚠️  มีบัญชีบางตัวล็อกอินไม่ได้ กรุณาตรวจสอบ');
  }
  
  console.log('\n💡 วิธีใช้งาน:');
  console.log('   1. เปิดเว็บไซต์ที่ http://localhost:3000/login');
  console.log('   2. คลิกที่บัญชีทดสอบที่ต้องการ');
  console.log('   3. กดปุ่มเข้าสู่ระบบ');
  console.log('   4. ระบบจะพาไปหน้าที่เหมาะสมตามบทบาท');
}

// เริ่มทดสอบ
testAllLoginAccounts().catch(console.error);
