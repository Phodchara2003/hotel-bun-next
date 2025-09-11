'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Shield, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default function RememberMeStatus() {
  const { user, getRememberMePreference, clearRememberMe, getTimeRemaining, isAuthenticated } = useAuth();
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [rememberMeEnabled, setRememberMeEnabled] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      const isRemembered = getRememberMePreference();
      setRememberMeEnabled(isRemembered);
      
      // Update time remaining every minute
      const updateTimer = () => {
        const remaining = getTimeRemaining();
        setTimeRemaining(remaining);
      };
      
      updateTimer();
      const interval = setInterval(updateTimer, 60000); // Update every minute
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, getRememberMePreference, getTimeRemaining]);

  const formatTime = (seconds) => {
    if (seconds <= 0) return 'หมดอายุแล้ว';
    
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    
    if (days > 0) {
      return `${days} วัน ${hours} ชั่วโมง`;
    } else if (hours > 0) {
      return `${hours} ชั่วโมง ${minutes} นาที`;
    } else {
      return `${minutes} นาที`;
    }
  };

  const getStatusColor = () => {
    if (timeRemaining > 24 * 60 * 60) return 'text-green-600'; // > 1 day
    if (timeRemaining > 60 * 60) return 'text-yellow-600'; // > 1 hour
    return 'text-red-600'; // < 1 hour
  };

  const getStatusIcon = () => {
    if (timeRemaining > 24 * 60 * 60) return <CheckCircle className="w-4 h-4" />;
    if (timeRemaining > 60 * 60) return <AlertTriangle className="w-4 h-4" />;
    return <XCircle className="w-4 h-4" />;
  };

  if (!isAuthenticated) return null;

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-800">สถานะเซสชัน</h3>
        </div>
        {rememberMeEnabled && (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
            Remember Me
          </span>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">เวลาที่เหลือ:</span>
          <div className={`flex items-center space-x-1 ${getStatusColor()}`}>
            {getStatusIcon()}
            <span className="text-sm font-medium">{formatTime(timeRemaining)}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">ประเภทเซสชัน:</span>
          <span className="text-sm font-medium">
            {rememberMeEnabled ? 'ระยะยาว (30 วัน)' : 'ปกติ (7 วัน)'}
          </span>
        </div>
        
        {rememberMeEnabled && (
          <div className="pt-2 border-t border-gray-200">
            <button
              onClick={() => {
                clearRememberMe();
                setRememberMeEnabled(false);
              }}
              className="text-xs text-red-600 hover:text-red-800 transition-colors"
            >
              ปิดการจดจำการเข้าสู่ระบบ
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
