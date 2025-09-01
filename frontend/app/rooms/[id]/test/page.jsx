'use client';

import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function TestBookPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  
  const roomId = params.id;
  const hotelId = searchParams.get('hotelId');

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test Booking Page</h1>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Parameters</h2>
          <div className="space-y-2">
            <p><strong>Room ID:</strong> {roomId || 'Not found'}</p>
            <p><strong>Hotel ID:</strong> {hotelId || 'Not found'}</p>
            <p><strong>Current URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'Server side'}</p>
          </div>
          
          <div className="mt-6">
            <Link 
              href="/"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              กลับสู่หน้าแรก
            </Link>
          </div>
        </div>
        
        <div className="mt-8 bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <h3 className="font-semibold text-yellow-800">Test Links</h3>
          <div className="mt-2 space-y-2">
            <div>
              <Link href="/rooms/1/book?hotelId=1" className="text-blue-600 hover:text-blue-700">
                Test Room 1 Booking (Standard Room)
              </Link>
            </div>
            <div>
              <Link href="/rooms/2/book?hotelId=1" className="text-blue-600 hover:text-blue-700">
                Test Room 2 Booking (Deluxe Room)
              </Link>
            </div>
            <div>
              <Link href="/rooms/3/book?hotelId=1" className="text-blue-600 hover:text-blue-700">
                Test Room 3 Booking (Junior Suite)
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
