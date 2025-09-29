'use client';

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { Menu, Bell, User, Hotel } from 'lucide-react';
import Link from 'next/link';

export default function MobileHeader({ onMenuToggle }) {
  const { user, isAuthenticated } = useAuth();
  const pathname = usePathname();

  // Don't show on auth pages only
  if (pathname === '/login' || pathname === '/register') {
    return null;
  }

  // Always show menu toggle for all pages (except auth pages)
  const shouldShowMenuToggle = true;

  // Don't show header for regular users on customer pages
  const isAdminPath = pathname.startsWith('/admin') || pathname.startsWith('/manager');
  const isUserWithAdminRole = user && ['admin', 'manager', 'staff'].includes(user.role);
  const shouldShowHeader = isUserWithAdminRole || isAdminPath;
  
  // Don't show mobile header for regular customers
  if (!shouldShowHeader) {
    return null;
  }

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/10 backdrop-blur-xl border-b border-white/20 z-50">
      <div className="flex items-center justify-between h-full px-4">
        {/* Menu Button */}
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-lg text-gray-800 hover:bg-gray-100 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Logo */}
        <div className="flex items-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-lg blur opacity-60"></div>
            <div className="relative bg-gradient-to-r from-emerald-500 to-cyan-500 p-2 rounded-lg">
              <Hotel className="h-5 w-5 text-white" />
            </div>
          </div>
          <span className="ml-2 text-gray-800 font-bold text-lg">HotelBook</span>
        </div>

        {/* User Actions */}
        <div className="flex items-center space-x-2">
          {isAuthenticated && (
            <>
              <button className="p-2 rounded-lg text-gray-800 hover:bg-gray-100 transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              <Link 
                href={user?.role === 'admin' || user?.role === 'staff' ? '/admin/profile' : '/profile'}
                className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center hover:from-emerald-600 hover:to-cyan-600 transition-colors"
                title="จัดการโปรไฟล์"
              >
                <User className="w-4 h-4 text-white" />
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
