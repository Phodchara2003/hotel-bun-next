/**
 * Browser utility functions to prevent hydration errors
 * These functions safely handle browser APIs that are not available during SSR
 */

// Safe localStorage operations
export const safeLocalStorage = {
  getItem: (key) => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('localStorage.getItem failed:', error);
      return null;
    }
  },
  
  setItem: (key, value) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn('localStorage.setItem failed:', error);
    }
  },
  
  removeItem: (key) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('localStorage.removeItem failed:', error);
    }
  }
};

// Safe sessionStorage operations
export const safeSessionStorage = {
  getItem: (key) => {
    if (typeof window === 'undefined') return null;
    try {
      return sessionStorage.getItem(key);
    } catch (error) {
      console.warn('sessionStorage.getItem failed:', error);
      return null;
    }
  },
  
  setItem: (key, value) => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(key, value);
    } catch (error) {
      console.warn('sessionStorage.setItem failed:', error);
    }
  },
  
  removeItem: (key) => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.warn('sessionStorage.removeItem failed:', error);
    }
  }
};

// Safe document operations
export const safeDocument = {
  addEventListener: (event, handler, options) => {
    if (typeof document === 'undefined') return;
    try {
      document.addEventListener(event, handler, options);
    } catch (error) {
      console.warn('document.addEventListener failed:', error);
    }
  },
  
  removeEventListener: (event, handler, options) => {
    if (typeof document === 'undefined') return;
    try {
      document.removeEventListener(event, handler, options);
    } catch (error) {
      console.warn('document.removeEventListener failed:', error);
    }
  },
  
  querySelector: (selector) => {
    if (typeof document === 'undefined') return null;
    try {
      return document.querySelector(selector);
    } catch (error) {
      console.warn('document.querySelector failed:', error);
      return null;
    }
  },
  
  createElement: (tagName) => {
    if (typeof document === 'undefined') return null;
    try {
      return document.createElement(tagName);
    } catch (error) {
      console.warn('document.createElement failed:', error);
      return null;
    }
  }
};

// Safe window operations
export const safeWindow = {
  open: (url, target, features) => {
    if (typeof window === 'undefined') return null;
    try {
      return window.open(url, target, features);
    } catch (error) {
      console.warn('window.open failed:', error);
      return null;
    }
  },
  
  addEventListener: (event, handler, options) => {
    if (typeof window === 'undefined') return;
    try {
      window.addEventListener(event, handler, options);
    } catch (error) {
      console.warn('window.addEventListener failed:', error);
    }
  },
  
  removeEventListener: (event, handler, options) => {
    if (typeof window === 'undefined') return;
    try {
      window.removeEventListener(event, handler, options);
    } catch (error) {
      console.warn('window.removeEventListener failed:', error);
    }
  }
};

// Check if we're running on client side
export const isClient = () => typeof window !== 'undefined';

// Check if we're running on server side
export const isServer = () => typeof window === 'undefined';

// Utility to run code only on client side
export const runOnClient = (callback) => {
  if (isClient()) {
    try {
      return callback();
    } catch (error) {
      console.warn('runOnClient callback failed:', error);
      return null;
    }
  }
  return null;
};

// Utility to get a value that might differ between server and client
export const getClientValue = (serverValue, clientValueGetter) => {
  if (isServer()) return serverValue;
  return runOnClient(clientValueGetter) ?? serverValue;
};