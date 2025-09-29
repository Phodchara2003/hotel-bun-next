'use client';

import React from 'react';

class HydrationErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Check if this is a hydration error
    if (error.message && error.message.includes('Hydration')) {
      console.error('🚨 Hydration Error Boundary caught:', error);
      return { hasError: true, error };
    }
    return null;
  }

  componentDidCatch(error, errorInfo) {
    if (error.message && error.message.includes('Hydration')) {
      console.error('🚨 Hydration Error Details:', { error, errorInfo });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              เกิดข้อผิดพลาดในการโหลดหน้าเว็บ
            </h2>
            <p className="text-gray-600 mb-4">
              กรุณารีเฟรชหน้าเว็บหรือลองใหม่อีกครั้ง
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              รีเฟรชหน้าเว็บ
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default HydrationErrorBoundary;