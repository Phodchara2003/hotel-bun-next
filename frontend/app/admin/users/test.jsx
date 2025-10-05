import React from 'react';

// Test component เพื่อทดสอบ
const TestUsersPage = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Test Users Page</h1>
      <p>หากเห็นข้อความนี้แสดงว่า component โหลดได้</p>
      <a href="/admin/users" className="text-blue-600 hover:underline">
        ไปยังหน้า Users จริง
      </a>
    </div>
  );
};

export default TestUsersPage;