'use client';

import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export default function TestLoginPage() {
  const { user, login, logout, isAuthenticated, loading } = useAuth();
  const [credentials, setCredentials] = useState({
    email: 'demo@example.com',
    password: 'password123'
  });

  const handleLogin = async () => {
    const result = await login(credentials);
    console.log('Login result:', result);
  };

  if (loading) {
    return <div className="p-8">กำลังโหลด...</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">ทดสอบระบบ Login</h1>
      
      {isAuthenticated ? (
        <div className="bg-green-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-green-800">เข้าสู่ระบบแล้ว!</h2>
          <p className="text-green-700">ยินดีต้อนรับ {user?.first_name} {user?.last_name}</p>
          <p className="text-sm text-green-600">อีเมล: {user?.email}</p>
          <button 
            onClick={logout}
            className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            ออกจากระบบ
          </button>
        </div>
      ) : (
        <div className="bg-blue-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-blue-800">ทดสอบการเข้าสู่ระบบ</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">อีเมล:</label>
              <input
                type="email"
                value={credentials.email}
                onChange={(e) => setCredentials({...credentials, email: e.target.value})}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">รหัสผ่าน:</label>
              <input
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <button 
              onClick={handleLogin}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              เข้าสู่ระบบ
            </button>
          </div>
        </div>
      )}
      
      <div className="mt-8 bg-gray-100 p-4 rounded-lg">
        <h3 className="font-semibold">ข้อมูลผู้ใช้ปัจจุบัน:</h3>
        <pre className="mt-2 text-sm">{JSON.stringify({ user, isAuthenticated }, null, 2)}</pre>
      </div>
    </div>
  );
}
