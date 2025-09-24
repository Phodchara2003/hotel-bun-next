// API Performance Monitor for debugging excessive API calls
class APIMonitor {
  constructor() {
    this.calls = new Map();
    this.warningThreshold = 5; // Warn if same endpoint called more than 5 times in 2 minutes
    this.timeWindow = 2 * 60 * 1000; // 2 minutes
    this.blockedEndpoints = new Map(); // Global rate limiting
  }

  track(endpoint, method = 'GET') {
    const key = `${method} ${endpoint}`;
    const now = Date.now();
    
    // Check if endpoint is currently blocked
    if (this.blockedEndpoints.has(key)) {
      const blockUntil = this.blockedEndpoints.get(key);
      if (now < blockUntil) {
        const remainingSeconds = Math.ceil((blockUntil - now) / 1000);
        console.warn(`🚫 API call blocked: ${key} (rate limited for ${remainingSeconds}s)`);
        return -1; // Indicate blocked
      } else {
        this.blockedEndpoints.delete(key);
      }
    }
    
    if (!this.calls.has(key)) {
      this.calls.set(key, []);
    }
    
    const calls = this.calls.get(key);
    calls.push(now);
    
    // Clean up old calls outside the time window
    const recentCalls = calls.filter(time => now - time < this.timeWindow);
    this.calls.set(key, recentCalls);
    
    // Check for excessive calls and implement temporary blocking
    if (recentCalls.length > this.warningThreshold) {
      console.warn(`🚨 Excessive API calls detected: ${key} called ${recentCalls.length} times in the last 2 minutes`);
      
      // Block the endpoint for escalating periods
      let blockDuration = 30000; // Start with 30 seconds
      if (recentCalls.length > 10) blockDuration = 60000; // 1 minute
      if (recentCalls.length > 15) blockDuration = 120000; // 2 minutes
      
      this.blockedEndpoints.set(key, now + blockDuration);
      console.error(`❌ RATE LIMITED: ${key} blocked for ${blockDuration/1000} seconds due to ${recentCalls.length} calls`);
    }
    
    return recentCalls.length;
  }

  getStats() {
    const stats = {};
    for (const [endpoint, calls] of this.calls.entries()) {
      const now = Date.now();
      const recentCalls = calls.filter(time => now - time < this.timeWindow);
      stats[endpoint] = {
        total: calls.length,
        recent: recentCalls.length,
        lastCall: calls.length > 0 ? new Date(Math.max(...calls)).toLocaleString() : 'Never'
      };
    }
    return stats;
  }

  reset() {
    this.calls.clear();
    console.log('📊 API Monitor: Statistics reset');
  }
}

// Global instance
const apiMonitor = new APIMonitor();

// Monkey patch fetch to track API calls and block excessive requests
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  
  window.fetch = function(...args) {
    const url = args[0];
    const options = args[1] || {};
    const method = options.method || 'GET';
    
    // Only track our API calls
    if (typeof url === 'string' && (url.includes('/api/') || url.includes('localhost:3001'))) {
      const endpoint = url.replace('http://localhost:3001', '').split('?')[0];
      const callCount = apiMonitor.track(endpoint, method);
      
      // Block if rate limited
      if (callCount === -1) {
        console.warn(`🚫 Blocked API call: ${method} ${endpoint}`);
        return Promise.reject(new Error(`Rate limited: ${endpoint}`));
      }
      
      // Log high-frequency calls in development
      if (process.env.NODE_ENV === 'development' && callCount > 3) {
        console.log(`📈 API Call #${callCount}: ${method} ${endpoint}`);
      }
    }
    
    return originalFetch.apply(this, args);
  };
}

// Expose global functions for debugging
if (typeof window !== 'undefined') {
  window.apiMonitor = apiMonitor;
  window.showAPIStats = () => {
    console.table(apiMonitor.getStats());
  };
  window.resetAPIStats = () => {
    apiMonitor.reset();
  };
}

export default apiMonitor;