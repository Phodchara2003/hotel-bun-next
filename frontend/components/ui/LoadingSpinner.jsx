'use client';

export default function LoadingSpinner({ size = 'medium', className = '' }) {
  const sizeClasses = {
    small: 'h-6 w-6',
    medium: 'h-12 w-12',
    large: 'h-16 w-16'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} border-4 border-green-200 border-t-green-600 rounded-full animate-spin`}></div>
    </div>
  );
}