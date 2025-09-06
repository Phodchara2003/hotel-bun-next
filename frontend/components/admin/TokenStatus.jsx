'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Clock, Shield, AlertTriangle, CheckCircle } from 'lucide-react';

const TokenStatus = () => {
  const { getTokenInfo, isAuthenticated, needsRefresh } = useAuth();
  const [tokenInfo, setTokenInfo] = useState(null);
  const [timeDisplay, setTimeDisplay] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;

    const updateTokenInfo = () => {
      const info = getTokenInfo();
      setTokenInfo(info);
      
      if (info && info.timeRemaining > 0) {
        const hours = Math.floor(info.timeRemaining / 3600);
        const minutes = Math.floor((info.timeRemaining % 3600) / 60);
        
        if (hours > 0) {
          setTimeDisplay(`${hours}ชม ${minutes}นาที`);
        } else {
          setTimeDisplay(`${minutes}นาที`);
        }
      } else {
        setTimeDisplay('หมดอายุ');
      }
    };

    // Update immediately
    updateTokenInfo();

    // Update every 30 seconds
    const interval = setInterval(updateTokenInfo, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, getTokenInfo]);

  if (!isAuthenticated || !tokenInfo) {
    return null;
  }

  const getStatusColor = () => {
    if (!tokenInfo.isValid) return 'text-red-500';
    if (tokenInfo.timeRemaining < 600) return 'text-red-500'; // Less than 10 minutes
    if (tokenInfo.timeRemaining < 1800) return 'text-yellow-500'; // Less than 30 minutes
    return 'text-green-500';
  };

  const getStatusIcon = () => {
    if (!tokenInfo.isValid) return <AlertTriangle className="w-4 h-4" />;
    if (tokenInfo.timeRemaining < 600) return <AlertTriangle className="w-4 h-4" />;
    if (tokenInfo.timeRemaining < 1800) return <Clock className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (!tokenInfo.isValid) return 'เซสชันหมดอายุ';
    if (tokenInfo.timeRemaining < 600) return 'เซสชันจะหมดอายุเร็วๆ นี้';
    if (tokenInfo.timeRemaining < 1800) return 'เซสชันใกล้หมดอายุ';
    return 'เซสชันปกติ';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-blue-500" />
          <h3 className="text-sm font-medium text-gray-900">สถานะเซสชัน</h3>
        </div>
        
        <div className={`flex items-center space-x-2 ${getStatusColor()}`}>
          {getStatusIcon()}
          <span className="text-sm font-medium">{getStatusText()}</span>
        </div>
      </div>
      
      <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500">เวลาเหลือ:</span>
          <span className={`ml-2 font-medium ${getStatusColor()}`}>
            {timeDisplay}
          </span>
        </div>
        
        <div>
          <span className="text-gray-500">หมดอายุ:</span>
          <span className="ml-2 font-medium text-gray-900">
            {tokenInfo.expiresAt.toLocaleTimeString('th-TH', {
              hour: '2-digit',
              minute: '2-digit',
              day: '2-digit',
              month: '2-digit'
            })}
          </span>
        </div>
      </div>
      
      {needsRefresh() && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-800 text-xs">
            💡 แนะนำให้บันทึกงานของคุณ เซสชันจะหมดอายุในเร็วๆ นี้
          </p>
        </div>
      )}
    </div>
  );
};

export default TokenStatus;
