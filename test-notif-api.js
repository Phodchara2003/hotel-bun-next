// ทดสอบ Notifications API กับฐานข้อมูลใหม่
const BASE_URL = 'http://localhost:3003';

console.log('🔔 ทดสอบ Notifications API กับฐานข้อมูลใหม่...');

// ล็อกอินเพื่อรับ token ก่อน
async function getAuthToken() {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'demo@example.com',
        password: 'password'
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return { success: true, token: data.token, user: data.user };
    } else {
      return { success: false, error: data };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function testGetNotifications(token) {
  try {
    console.log('1. ทดสอบ GET /api/notifications - ดึงข้อมูลการแจ้งเตือนทั้งหมด');
    
    const response = await fetch(`${BASE_URL}/api/notifications`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    
    console.log('   📊 Status:', response.status);
    
    if (response.ok) {
      console.log('   ✅ ดึงข้อมูลการแจ้งเตือนสำเร็จ');
      
      if (data.notifications && data.notifications.length > 0) {
        console.log(`   📋 พบการแจ้งเตือน: ${data.notifications.length} รายการ`);
        
        data.notifications.forEach((notification, index) => {
          console.log(`   ${index + 1}. ${notification.title}`);
          console.log(`      📝 ข้อความ: ${notification.message.substring(0, 50)}...`);
          console.log(`      📅 วันที่: ${notification.created_at}`);
          console.log(`      👀 อ่านแล้ว: ${notification.is_read ? 'ใช่' : 'ไม่'}`);
        });
      } else {
        console.log('   📋 ไม่พบการแจ้งเตือน (ฐานข้อมูลใหม่ยังว่างเปล่า)');
      }
      
      return { success: true, notifications: data.notifications || [] };
    } else {
      console.log('   ❌ ดึงข้อมูลการแจ้งเตือนไม่สำเร็จ:', data);
      return { success: false, error: data };
    }
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการทดสอบ Get Notifications:', error.message);
    return { success: false, error: error.message };
  }
}

async function testGetUnreadCount(token) {
  try {
    console.log('\n2. ทดสอบ GET /api/notifications/unread-count - นับการแจ้งเตือนที่ยังไม่อ่าน');
    
    const response = await fetch(`${BASE_URL}/api/notifications/unread-count`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    
    console.log('   📊 Status:', response.status);
    
    if (response.ok) {
      console.log('   ✅ นับการแจ้งเตือนสำเร็จ');
      console.log(`   🔔 การแจ้งเตือนที่ยังไม่อ่าน: ${data.count || data.unreadCount || 0} รายการ`);
      
      return { success: true, count: data.count || data.unreadCount || 0 };
    } else {
      console.log('   ❌ นับการแจ้งเตือนไม่สำเร็จ:', data);
      return { success: false, error: data };
    }
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการทดสอบ Unread Count:', error.message);
    return { success: false, error: error.message };
  }
}

// รันการทดสอบ
async function runAllNotificationTests() {
  console.log('='.repeat(60));
  console.log('🚀 เริ่มทดสอบ Notifications API กับฐานข้อมูลใหม่');
  console.log('='.repeat(60));
  
  // ล็อกอินเพื่อรับ token
  console.log('🔐 ล็อกอินเพื่อรับ authentication token...');
  const authResult = await getAuthToken();
  
  if (!authResult.success) {
    console.error('❌ ไม่สามารถล็อกอินได้:', authResult.error);
    return;
  }
  
  console.log('✅ ล็อกอินสำเร็จ');
  const token = authResult.token;
  
  // ทดสอบดึงข้อมูลการแจ้งเตือน
  await testGetNotifications(token);
  
  // ทดสอบนับการแจ้งเตือนที่ยังไม่อ่าน
  await testGetUnreadCount(token);
  
  console.log('\n='.repeat(60));
  console.log('✅ การทดสอบ Notifications API เสร็จสิ้น');
  console.log('='.repeat(60));
}

runAllNotificationTests();