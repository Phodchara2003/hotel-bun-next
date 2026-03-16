'use client';

import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "ยืนยันการดำเนินการ",
  message = "คุณแน่ใจหรือไม่ที่จะดำเนินการต่อ?",
  confirmText = "ยืนยัน",
  cancelText = "ยกเลิก",
  type = "danger" // danger, warning, info
}) {
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Confirm action failed:', error);
    } finally {
      setIsConfirming(false);
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'danger': return 'text-red-600 bg-red-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'info': return 'text-blue-600 bg-blue-100';
      case 'success': return 'text-green-600 bg-green-100';
      default: return 'text-red-600 bg-red-100';
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case 'danger': return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
      case 'warning': return 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500';
      case 'info': return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
      case 'success': return 'bg-green-600 hover:bg-green-700 focus:ring-green-500';
      default: return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          aria-hidden="true"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Content */}
          <div className="sm:flex sm:items-start">
            {/* Icon */}
            <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${getIconColor()} sm:mx-0 sm:h-10 sm:w-10`}>
              <AlertTriangle className="h-6 w-6" aria-hidden="true" />
            </div>
            
            {/* Text */}
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                {title}
              </h3>
              <div className="mt-2">
                <div className="text-sm text-gray-500">
                  {typeof message === 'string' ? <p>{message}</p> : message}
                </div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isConfirming}
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white ${getButtonColor()} focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isConfirming ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  กำลังดำเนินการ...
                </>
              ) : (
                confirmText
              )}
            </button>
            
            <button
              type="button"
              onClick={onClose}
              disabled={isConfirming}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
