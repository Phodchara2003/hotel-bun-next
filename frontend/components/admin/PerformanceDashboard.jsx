'use client';

import { useState, useEffect } from 'react';
import performanceMonitor from '../../lib/performanceMonitor';
import { BarChart3, Clock, AlertTriangle, RefreshCw } from 'lucide-react';

export default function PerformanceDashboard() {
  const [stats, setStats] = useState({});
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') return;

    const updateStats = () => {
      const currentStats = performanceMonitor.getStats();
      setStats(currentStats || {});
    };

    // Update stats every 5 seconds
    const interval = setInterval(updateStats, 5000);
    updateStats(); // Initial load

    return () => clearInterval(interval);
  }, []);

  if (process.env.NODE_ENV !== 'development' || !isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700"
          title="Show Performance Monitor"
        >
          <BarChart3 className="w-5 h-5" />
        </button>
      </div>
    );
  }

  const handleReset = () => {
    performanceMonitor.reset();
    setStats({});
  };

  const handleCheckExcessive = () => {
    performanceMonitor.checkExcessiveCalls();
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80 z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800 flex items-center">
          <BarChart3 className="w-4 h-4 mr-2" />
          API Performance
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {Object.keys(stats).length === 0 ? (
          <p className="text-gray-500 text-sm">No API calls recorded</p>
        ) : (
          Object.entries(stats).map(([endpoint, count]) => (
            <div key={endpoint} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <div className="flex-1 truncate">
                <div className="text-xs font-mono text-gray-600 truncate" title={endpoint}>
                  {endpoint}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-sm font-semibold ${count > 5 ? 'text-red-600' : count > 3 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {count}
                </span>
                {count > 5 && <AlertTriangle className="w-3 h-3 text-red-500" />}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex space-x-2 mt-3 pt-3 border-t border-gray-200">
        <button
          onClick={handleReset}
          className="flex-1 bg-gray-100 text-gray-700 px-3 py-1 rounded text-xs hover:bg-gray-200 flex items-center justify-center"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Reset
        </button>
        <button
          onClick={handleCheckExcessive}
          className="flex-1 bg-yellow-100 text-yellow-700 px-3 py-1 rounded text-xs hover:bg-yellow-200 flex items-center justify-center"
        >
          <AlertTriangle className="w-3 h-3 mr-1" />
          Check
        </button>
      </div>

      <div className="mt-2 text-xs text-gray-500 text-center">
        Development Mode Only
      </div>
    </div>
  );
}
