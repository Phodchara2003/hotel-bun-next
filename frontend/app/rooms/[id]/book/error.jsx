'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}) {
  useEffect(() => {
    console.error('Booking page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">เกิดข้อผิดพลาด</h2>
        <p className="text-gray-600 mb-6">
          ไม่สามารถโหลดหน้าการจองได้ กรุณาลองใหม่อีกครั้ง
        </p>
        <div className="space-y-3">
          <button
            onClick={() => reset()}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            ลองใหม่
          </button>
          <a
            href="/"
            className="block w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            กลับสู่หน้าแรก
          </a>
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-sm text-gray-500">
              Error Details (Development)
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
