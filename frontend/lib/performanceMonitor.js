// Performance Monitor - ติดตาม API calls และ performance
class PerformanceMonitor {
  constructor() {
    this.apiCalls = new Map();
    this.startTimes = new Map();
    this.isEnabled = process.env.NODE_ENV === 'development';
  }

  // Track API call start
  startApiCall(endpoint, method = 'GET') {
    if (!this.isEnabled) return;
    
    const key = `${method} ${endpoint}`;
    const now = performance.now();
    
    this.startTimes.set(key, now);
    
    // Track call count
    const count = this.apiCalls.get(key) || 0;
    this.apiCalls.set(key, count + 1);
    
    // Only log if it's not a repeated call within 5 seconds
    const lastLog = this.lastLogTime?.get(key) || 0;
    if (now - lastLog > 5000) {
      console.log(`📞 API Call #${count + 1}: ${key}`);
      if (!this.lastLogTime) this.lastLogTime = new Map();
      this.lastLogTime.set(key, now);
    }
  }

  // Track API call end
  endApiCall(endpoint, method = 'GET', success = true) {
    if (!this.isEnabled) return;
    
    const key = `${method} ${endpoint}`;
    const startTime = this.startTimes.get(key);
    
    if (startTime) {
      const duration = performance.now() - startTime;
      const status = success ? '✅' : '❌';
      
      console.log(`${status} API Response: ${key} (${duration.toFixed(2)}ms)`);
      this.startTimes.delete(key);
      
      // Warn if API call is too slow
      if (duration > 2000) {
        console.warn(`⚠️ Slow API call detected: ${key} took ${duration.toFixed(2)}ms`);
      }
    }
  }

  // Get API statistics
  getStats() {
    if (!this.isEnabled) return null;
    
    const stats = {};
    for (const [endpoint, count] of this.apiCalls.entries()) {
      stats[endpoint] = count;
    }
    
    return stats;
  }

  // Log current statistics
  logStats() {
    if (!this.isEnabled) return;
    
    console.group('📊 API Call Statistics');
    const stats = this.getStats();
    
    if (Object.keys(stats).length === 0) {
      console.log('No API calls recorded');
    } else {
      for (const [endpoint, count] of Object.entries(stats)) {
        console.log(`${endpoint}: ${count} calls`);
      }
    }
    
    console.groupEnd();
  }

  // Reset statistics
  reset() {
    this.apiCalls.clear();
    this.startTimes.clear();
    console.log('🧹 Performance monitor reset');
  }

  // Check for excessive API calls
  checkExcessiveCalls() {
    if (!this.isEnabled) return;
    
    for (const [endpoint, count] of this.apiCalls.entries()) {
      if (count > 5) {
        console.warn(`⚠️ Excessive API calls detected: ${endpoint} called ${count} times`);
      }
    }
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Auto-log stats every 30 seconds in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  setInterval(() => {
    performanceMonitor.checkExcessiveCalls();
  }, 30000);
}

export default performanceMonitor;
