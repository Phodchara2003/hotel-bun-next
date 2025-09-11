'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Clock, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SessionManager() {
  const { 
    user, 
    getTimeRemaining, 
    getRememberMePreference, 
    needsRefresh, 
    refreshToken,
    logout,
    isAuthenticated 
  } = useAuth();
  
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    const updateTimer = () => {
      const remaining = getTimeRemaining();
      setTimeRemaining(remaining);
      
      // Show warning when less than 30 minutes
      if (remaining > 0 && remaining < 1800 && !getRememberMePreference()) {
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }
      
      // Auto logout when expired
      if (remaining <= 0) {
        toast.error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
        logout();
      }
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [isAuthenticated, getTimeRemaining, getRememberMePreference, logout]);

  const handleRefreshSession = async () => {
    setIsRefreshing(true);
    try {
      const success = await refreshToken();
      if (success) {
        toast.success('ต่ออายุเซสชันสำเร็จ');
        setShowWarning(false);
      } else {
        toast.info('ฟีเจอร์ต่ออายุเซสชันยังไม่พร้อมใช้งาน');
      }
    } catch (error) {
      console.error('Session refresh failed:', error);
      toast.error('ไม่สามารถต่ออายุเซสชันได้');
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatTimeRemaining = (seconds) => {
    if (seconds <= 0) return 'หมดอายุแล้ว';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours} ชั่วโมง ${minutes} นาที`;
    } else {
      return `${minutes} นาที`;
    }
  };

  const getStatusColor = () => {
    if (timeRemaining > 3600) return 'text-green-600'; // > 1 hour
    if (timeRemaining > 1800) return 'text-yellow-600'; // > 30 minutes
    return 'text-red-600'; // < 30 minutes
  };

  if (!isAuthenticated) return null;

  return (
    <>
      {/* Session Status Widget */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-3 min-w-[200px]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">เซสชัน</span>
            </div>
            {timeRemaining > 3600 ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
            )}
          </div>
          
          <div className={`text-sm font-medium ${getStatusColor()}`}>
            {formatTimeRemaining(timeRemaining)}
          </div>
          
          {getRememberMePreference() && (
            <div className="text-xs text-gray-500 mt-1">
              Remember Me ใช้งาน
            </div>
          )}
        </div>
      </div>

      {/* Session Warning Modal */}
      {showWarning && !getRememberMePreference() && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  เซสชันจะหมดอายุเร็วๆ นี้
                </h3>
                <p className="text-sm text-gray-600">
                  เหลือเวลาอีก {formatTimeRemaining(timeRemaining)}
                </p>
              </div>
            </div>
            
            <p className="text-gray-600 mb-6">
              เซสชันของคุณจะหมดอายุในไม่ช้า คุณต้องการต่ออายุเซสชันหรือเซฟงานของคุณก่อน
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={handleRefreshSession}
                disabled={isRefreshing}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isRefreshing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span>ต่ออายุเซสชัน</span>
              </button>
              
              <button
                onClick={() => setShowWarning(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                ปิด
              </button>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700">
                💡 เคล็ดลับ: เปิด "จดจำการเข้าสู่ระบบ" เพื่อใช้เซสชันยาวนานถึง 30 วัน
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
