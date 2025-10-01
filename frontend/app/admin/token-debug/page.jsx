'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

export default function TokenDebugPage() {
  const { user, getAuthToken } = useAuth();
  const [storageInfo, setStorageInfo] = useState({});

  const checkAllStorage = () => {
    if (typeof window !== 'undefined') {
      const info = {
        cookies: {
          auth_token: document.cookie.split('; ').find(row => row.startsWith('auth_token='))?.split('=')[1]?.slice(0, 50) + '...',
          user_data: document.cookie.split('; ').find(row => row.startsWith('user_data='))?.split('=')[1]?.slice(0, 50) + '...'
        },
        localStorage: {
          auth_token_persistent: localStorage.getItem('auth_token_persistent')?.slice(0, 50) + '...',
          user_data_persistent: localStorage.getItem('user_data_persistent')?.slice(0, 50) + '...',
          auth_expires_at: localStorage.getItem('auth_expires_at'),
          remember_me: localStorage.getItem('remember_me')
        },
        sessionStorage: {
          auth_token: sessionStorage.getItem('auth_token')?.slice(0, 50) + '...',
          user_data: sessionStorage.getItem('user_data')?.slice(0, 50) + '...',
          token_expires_at: sessionStorage.getItem('token_expires_at')
        },
        contextData: {
          user: user ? { id: user.id, email: user.email, role: user.role } : null,
          tokenFromFunction: getAuthToken()?.slice(0, 50) + '...'
        }
      };
      setStorageInfo(info);
    }
  };

  useEffect(() => {
    checkAllStorage();
    // Check every 2 seconds
    const interval = setInterval(checkAllStorage, 2000);
    return () => clearInterval(interval);
  }, [user, getAuthToken]);

  const clearAllStorage = () => {
    if (typeof window !== 'undefined') {
      // Clear localStorage
      localStorage.removeItem('auth_token_persistent');
      localStorage.removeItem('user_data_persistent');
      localStorage.removeItem('auth_expires_at');
      localStorage.removeItem('remember_me');
      
      // Clear sessionStorage
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('user_data');
      sessionStorage.removeItem('token_expires_at');
      
      // Clear cookies
      document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'user_data=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      checkAllStorage();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Token Debug Page</h1>
            <div className="flex gap-4">
              <button
                onClick={checkAllStorage}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                🔄 Refresh
              </button>
              <button
                onClick={clearAllStorage}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                🗑️ Clear All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">🍪 Cookies</h3>
                <pre className="text-sm text-yellow-700 whitespace-pre-wrap">
                  {JSON.stringify(storageInfo.cookies, null, 2)}
                </pre>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">💾 LocalStorage</h3>
                <pre className="text-sm text-blue-700 whitespace-pre-wrap">
                  {JSON.stringify(storageInfo.localStorage, null, 2)}
                </pre>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">🔄 SessionStorage</h3>
                <pre className="text-sm text-green-700 whitespace-pre-wrap">
                  {JSON.stringify(storageInfo.sessionStorage, null, 2)}
                </pre>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-800 mb-2">⚛️ React Context</h3>
                <pre className="text-sm text-purple-700 whitespace-pre-wrap">
                  {JSON.stringify(storageInfo.contextData, null, 2)}
                </pre>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">🕐 Timestamp Info</h3>
            <p className="text-sm text-gray-600">
              Current Time: {new Date().toLocaleString('th-TH')}
            </p>
            {storageInfo.localStorage?.auth_expires_at && (
              <p className="text-sm text-gray-600">
                Token Expires: {new Date(parseInt(storageInfo.localStorage.auth_expires_at)).toLocaleString('th-TH')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}