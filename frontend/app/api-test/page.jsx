'use client';

import { useState, useEffect } from 'react';
import { hotelAPI } from '../../lib/api';

export default function APITestPage() {
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = (message, type = 'info') => {
    const newLog = {
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    };
    setLogs(prev => [...prev, newLog]);
    console.log(`[${type}]`, message);
  };

  useEffect(() => {
    testAPI();
  }, []);

  const testAPI = async () => {
    try {
      addLog('Starting API test...', 'info');
      addLog('Fetching hotel data for ID 1...', 'info');
      
      const hotelResponse = await hotelAPI.getHotelById(1);
      
      addLog('Hotel response received', 'success');
      addLog(`Hotel name: ${hotelResponse.name}`, 'success');
      addLog(`Room types count: ${hotelResponse.roomTypes?.length || 0}`, 'success');
      
      setHotel(hotelResponse);
    } catch (error) {
      addLog(`API Error: ${error.message}`, 'error');
      addLog(`Error status: ${error.response?.status}`, 'error');
      addLog(`Error data: ${JSON.stringify(error.response?.data)}`, 'error');
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">API Test Page</h1>
        
        {/* Logs Section */}
        <div className="bg-black text-green-400 p-4 rounded-lg mb-8 h-64 overflow-y-auto font-mono text-sm">
          <h2 className="text-white mb-4">API Logs:</h2>
          {logs.map((log, index) => (
            <div key={index} className={`mb-1 ${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : 'text-gray-300'}`}>
              [{log.timestamp}] {log.message}
            </div>
          ))}
        </div>

        {/* Status Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold">Loading Status</h3>
            <p className={loading ? 'text-yellow-600' : 'text-green-600'}>
              {loading ? 'Loading...' : 'Complete'}
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold">Error Status</h3>
            <p className={error ? 'text-red-600' : 'text-green-600'}>
              {error ? 'Error' : 'No Errors'}
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold">Hotel Data</h3>
            <p className={hotel ? 'text-green-600' : 'text-gray-600'}>
              {hotel ? 'Loaded' : 'No Data'}
            </p>
          </div>
        </div>

        {/* Hotel Data Section */}
        {hotel && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-4">Hotel Data</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold">Basic Info</h3>
                <p><strong>Name:</strong> {hotel.name}</p>
                <p><strong>City:</strong> {hotel.city}</p>
                <p><strong>Rating:</strong> {hotel.rating}</p>
                <p><strong>Description:</strong> {hotel.description}</p>
              </div>
              
              <div>
                <h3 className="font-semibold">Room Types ({hotel.roomTypes?.length || 0})</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {hotel.roomTypes?.map(room => (
                    <div key={room.id} className="border p-2 rounded">
                      <p className="font-medium">{room.name}</p>
                      <p className="text-sm text-gray-600">฿{room.pricePerNight}/night</p>
                      <p className="text-sm text-gray-600">Max guests: {room.maxGuests}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Section */}
        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <h3 className="text-red-800 font-semibold">Error Details</h3>
            <pre className="text-red-700 text-sm mt-2 overflow-x-auto">
              {JSON.stringify(error, null, 2)}
            </pre>
          </div>
        )}

        {/* Retry Button */}
        <div className="mt-8">
          <button
            onClick={() => {
              setLogs([]);
              setError(null);
              setHotel(null);
              setLoading(true);
              testAPI();
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry API Test
          </button>
        </div>
      </div>
    </div>
  );
}
