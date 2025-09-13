// ทดสอบ Authentication API กับฐานข้อมูลใหม่
const BASE_URL = 'http://localhost:3003';

console.log('🔐 ทดสอบ Authentication API กับฐานข้อมูลใหม่...');

async function testLogin(email, password, expectedResult = true) {
  try {
    console.log(`1. ทดสอบ POST /api/auth/login - ล็อกอินด้วย ${email}`);
    
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password
      })
    });
    
    const data = await response.json();
    
    console.log('   📊 Status:', response.status);
    
    if (response.ok && expectedResult) {
      console.log('   ✅ เข้าสู่ระบบสำเร็จ');
      console.log(`   👤 ผู้ใช้: ${data.user.first_name} ${data.user.last_name}`);
      console.log(`   📧 อีเมล: ${data.user.email}`);
      console.log(`   🏷️ บทบาท: ${data.user.role}`);
      console.log(`   🔑 Token: ${data.token.substring(0, 20)}...`);
      
      return { success: true, user: data.user, token: data.token };
    } else if (!response.ok && !expectedResult) {
      console.log('   ✅ ตัวอย่างการเข้าสู่ระบบไม่สำเร็จ (ตามที่คาดหวัง)');
      console.log('   📋 Error:', data.error || data.message);
      
      return { success: false, error: data };
    } else {
      console.log('   ❌ ผลการทดสอบไม่ตรงกับที่คาดหวัง');
      console.log('   📋 Response:', data);
      
      return { success: false, error: data };
    }
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการทดสอบ Login:', error.message);
    return { success: false, error: error.message };
  }
}

async function testRegister(userData) {
  try {
    console.log(`\n2. ทดสอบ POST /api/auth/register - สมัครสมาชิกใหม่`);
    
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });
    
    const data = await response.json();
    
    console.log('   📊 Status:', response.status);
    
    if (response.ok) {
      console.log('   ✅ สมัครสมาชิกสำเร็จ');
      console.log(`   👤 ผู้ใช้ใหม่: ${data.user.first_name} ${data.user.last_name}`);
      console.log(`   📧 อีเมล: ${data.user.email}`);
      console.log(`   🔑 Token: ${data.token.substring(0, 20)}...`);
      
      return { success: true, user: data.user, token: data.token };
    } else {
      console.log('   ⚠️ สมัครสมาชิกไม่สำเร็จ:', data.error || data.message);
      
      return { success: false, error: data };
    }
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการทดสอบ Register:', error.message);
    return { success: false, error: error.message };
  }
}

async function testProtectedRoute(token) {
  try {
    console.log('\n3. ทดสอบ Protected Route - ดึงข้อมูลโปรไฟล์');
    
    const response = await fetch(`${BASE_URL}/api/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    
    console.log('   📊 Status:', response.status);
    
    if (response.ok) {
      console.log('   ✅ เข้าถึง Protected Route สำเร็จ');
      console.log(`   👤 ข้อมูลโปรไฟล์: ${data.first_name} ${data.last_name}`);
      console.log(`   📧 อีเมล: ${data.email}`);
      
      return { success: true, profile: data };
    } else {
      console.log('   ❌ เข้าถึง Protected Route ไม่สำเร็จ:', data);
      
      return { success: false, error: data };
    }
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการทดสอบ Protected Route:', error.message);
    return { success: false, error: error.message };
  }
}

async function testAdminAccess(token) {
  try {
    console.log('\n4. ทดสอบ Admin Access - ดึงข้อมูลผู้ใช้ทั้งหมด');
    
    const response = await fetch(`${BASE_URL}/api/admin/users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    
    console.log('   📊 Status:', response.status);
    
    if (response.ok) {
      console.log('   ✅ เข้าถึง Admin Route สำเร็จ');
      console.log(`   👥 จำนวนผู้ใช้ทั้งหมด: ${data.length || data.users?.length || 'N/A'}`);
      
      return { success: true, users: data };
    } else {
      console.log('   ⚠️ เข้าถึง Admin Route ไม่สำเร็จ (อาจไม่มีสิทธิ์ admin):', data.error || data.message);
      
      return { success: false, error: data };
    }
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการทดสอบ Admin Access:', error.message);
    return { success: false, error: error.message };
  }
}

// รันการทดสอบ
async function runAllAuthTests() {
  console.log('='.repeat(60));
  console.log('🚀 เริ่มทดสอบ Authentication API กับฐานข้อมูลใหม่');
  console.log('='.repeat(60));
  
  // ทดสอบล็อกอินด้วยบัญชี admin ที่สร้างไว้
  console.log('\n📧 ทดสอบล็อกอินด้วยบัญชี admin');
  const adminLogin = await testLogin('admin@royalgarden.com', 'password');
  
  // ทดสอบล็อกอินด้วยบัญชี demo user
  console.log('\n📧 ทดสอบล็อกอินด้วยบัญชี demo user');
  const userLogin = await testLogin('demo@example.com', 'password');
  
  // ทดสอบล็อกอินไม่สำเร็จ
  console.log('\n❌ ทดสอบล็อกอินไม่สำเร็จ');
  await testLogin('nonexistent@email.com', 'wrongpassword', false);
  
  // ทดสอบสมัครสมาชิกใหม่
  const newUserData = {
    firstName: 'Test',
    lastName: 'User',
    email: 'testuser@example.com',
    phone: '0801234567',
    password: 'testpass123'
  };
  
  console.log('\n👥 ทดสอบสมัครสมาชิกใหม่');
  const registerResult = await testRegister(newUserData);
  
  // ทดสอบ Protected Route
  if (userLogin.success) {
    await testProtectedRoute(userLogin.token);
  }
  
  // ทดสอบ Admin Access
  if (adminLogin.success) {
    await testAdminAccess(adminLogin.token);
  } else if (userLogin.success) {
    await testAdminAccess(userLogin.token); // ควรไม่สำเร็จ
  }
  
  console.log('\n='.repeat(60));
  console.log('✅ การทดสอบ Authentication API เสร็จสิ้น');
  console.log('='.repeat(60));
}

runAllAuthTests();