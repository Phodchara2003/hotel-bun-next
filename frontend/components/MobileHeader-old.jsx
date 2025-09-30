'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { Menu, Hotel } from 'lucide-react';

export default function MobileHeader({ onMenuToggle }) {
  const { user } = useAuth();
  const pathname = usePathname();
  
  // แสดงเมนูในทุกหน้า ยกเว้นหน้า auth
  const shouldShowMenuToggle = pathname !== '/login' && pathname !== '/register';
  
  if (!shouldShowMenuToggle) {
    return null;
  }

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-40 shadow-sm">
      <button
        onClick={onMenuToggle}
        className="p-2 rounded-lg text-gray-600 hover:text-amber-600 hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors duration-200"
      >
        <span className="sr-only">เปิดเมนู</span>
        <Menu className="h-6 w-6" />
      </button>
      
      <Link href="/" className="flex items-center space-x-2">
        <div className="bg-amber-600 p-1.5 rounded-lg">
          <Hotel className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-bold text-gray-900">วรุณภัฏ</span>
      </Link>
      
      <div className="w-10" /> {/* Spacer for centering */}
    </div>
  );
}