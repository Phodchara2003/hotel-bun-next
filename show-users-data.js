// Direct test: Manually call admin users API and create a working display

async function createWorkingUsersDisplay() {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJhZG1pbkByb3lhbGdhcmRlbi5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTY4NzUwNTgsImV4cCI6MTc1NzQ3OTg1OH0.CEQUI622l5njFYBMpzKAprIjbpeAGD4iZ_yT7IQHq8Y';
  
  try {
    console.log('🔧 Fetching users from API...');
    const response = await fetch('http://localhost:3001/api/admin/users?page=1&limit=20', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    const data = await response.json();
    
    console.log('\n✅ SUCCESS! Here are the users from your database:\n');
    console.log('📊 Total Users:', data.pagination.total);
    console.log('📄 Page:', data.pagination.page, 'of', data.pagination.totalPages);
    console.log('=====================================');
    
    data.users.forEach((user, index) => {
      const roleEmoji = {
        'user': '👤',
        'staff': '👨‍💼', 
        'admin': '👑',
        'super_admin': '🔱'
      }[user.role] || '❓';
      
      console.log(`${index + 1}. ${roleEmoji} ${user.fullName}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🏷️ Role: ${user.role}`);
      console.log(`   📞 Phone: ${user.phone || 'ไม่ระบุ'}`);
      console.log(`   📅 Created: ${new Date(user.createdAt).toLocaleDateString('th-TH')}`);
      console.log('-----------------------------------');
    });
    
    console.log('\n🎉 ข้อมูลผู้ใช้ทั้งหมดถูกโหลดเรียบร้อยแล้ว!');
    console.log('💡 ปัญหาอยู่ที่ frontend ไม่ได้เรียก API');
    console.log('🔧 ข้อมูลจริงมีอยู่แล้วใน database และ API ทำงานได้');
    
    return data;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

// เรียกใช้
createWorkingUsersDisplay()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Failed:', error.message);
    process.exit(1);
  });
