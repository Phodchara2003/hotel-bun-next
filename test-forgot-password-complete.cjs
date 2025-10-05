const mysql = require('mysql2/promise');

async function testForgotPasswordSystem() {
  let connection;
  
  try {
    console.log('🔍 กำลังตรวจสอบระบบ forgot password...');
    
    // เชื่อมต่อฐานข้อมูล
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '12345678',
      database: 'hotel_booking'
    });
    
    console.log('✅ เชื่อมต่อฐานข้อมูลสำเร็จ');
    
    const testEmail = 'mmoorrttff72308@gmail.com';
    
    // ตรวจสอบผู้ใช้
    const [users] = await connection.execute(
      'SELECT id, email, first_name, last_name FROM users WHERE email = ?',
      [testEmail]
    );
    
    if (users.length === 0) {
      console.log('❌ ไม่พบผู้ใช้นี้ในระบบ');
      return;
    }
    
    console.log('✅ พบผู้ใช้:', {
      id: users[0].id,
      email: users[0].email,
      name: `${users[0].first_name} ${users[0].last_name}`
    });
    
    // ตรวจสอบ reset tokens
    const [tokens] = await connection.execute(
      'SELECT * FROM password_reset_tokens WHERE email = ? ORDER BY created_at DESC',
      [testEmail]
    );
    
    console.log(`\n📋 มี ${tokens.length} reset token(s) ในระบบ:`);
    
    if (tokens.length > 0) {
      tokens.forEach((token, index) => {
        console.log(`\n${index + 1}. Token:`, {
          email: token.email,
          token: token.token.substring(0, 20) + '...',
          expires: token.expires_at,
          created: token.created_at,
          expired: new Date() > new Date(token.expires_at) ? 'หมดอายุแล้ว' : 'ยังใช้ได้'
        });
      });
    } else {
      console.log('❌ ไม่มี reset token ในระบบ');
    }
    
    console.log('\n🧪 การทดสอบ forgot password API...');
    
    // ทดสอบ frontend API
    try {
      const response = await fetch('http://localhost:3002/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: testEmail }),
      });
      
      const result = await response.json();
      console.log('Frontend API Response:', {
        status: response.status,
        message: result.message,
        success: result.success,
        resetUrl: result.resetUrl ? 'มี URL' : 'ไม่มี URL'
      });
      
    } catch (error) {
      console.log('❌ ไม่สามารถเรียก frontend API:', error.message);
    }
    
    // ตรวจสอบ tokens อีกครั้งหลังจากส่งคำขอ
    const [newTokens] = await connection.execute(
      'SELECT * FROM password_reset_tokens WHERE email = ? ORDER BY created_at DESC LIMIT 1',
      [testEmail]
    );
    
    if (newTokens.length > 0) {
      console.log('\n✅ พบ token ใหม่ในฐานข้อมูล:', {
        token: newTokens[0].token.substring(0, 20) + '...',
        expires: newTokens[0].expires_at,
        created: newTokens[0].created_at
      });
    } else {
      console.log('\n❌ ไม่พบ token ใหม่ในฐานข้อมูล');
    }
    
  } catch (error) {
    console.error('❌ ข้อผิดพลาด:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testForgotPasswordSystem();