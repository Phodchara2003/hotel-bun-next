'use client';

import Link from 'next/link';

export default function TestPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Navigation</h1>
      <div className="space-y-4">
        <div>
          <Link href="/login" className="bg-blue-500 text-white px-4 py-2 rounded">
            Go to Login
          </Link>
        </div>
        <div>
          <Link href="/register" className="bg-green-500 text-white px-4 py-2 rounded">
            Go to Register
          </Link>
        </div>
        <div>
          <Link href="/" className="bg-gray-500 text-white px-4 py-2 rounded">
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
