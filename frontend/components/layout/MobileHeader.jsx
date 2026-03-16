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
    <div className="lg:hidden fixed top-0 left-0 right-0 bg-gradient-to-r from-emerald-900 to-emerald-800 px-4 py-3 flex items-center justify-between z-40 shadow-lg">
      <button
        onClick={onMenuToggle}
        className="p-2 rounded-lg text-emerald-100 hover:text-white hover:bg-emerald-700/50 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors duration-200"
      >
        <span className="sr-only">เปิดเมนู</span>
        <Menu className="h-6 w-6" />
      </button>
      
      <Link href="/" className="flex items-center space-x-2">
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-1.5 rounded-lg">
          <Hotel className="h-5 w-5 text-white" />
        </div>
        <span className="text-xl font-light text-white tracking-wider">วรุณภัฏ</span>
      </Link>
      
      <div className="w-10" /> {/* Spacer for centering */}
    </div>
  );
}