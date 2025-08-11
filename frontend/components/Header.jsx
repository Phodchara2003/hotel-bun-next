'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

const Header = () => {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const { unreadCount, hasUnread } = useNotifications();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <header className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto container-padding">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🏨</span>
              <span className="text-xl font-bold text-gray-900">HotelBook</span>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto container-padding">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link 
            href={isAuthenticated && ['admin', 'staff'].includes(user?.role) ? '/admin/dashboard' : '/'} 
            className="flex items-center space-x-2"
          >
            <span className="text-2xl">🏨</span>
            <span className="text-xl font-bold text-gray-900">
              {isAuthenticated && ['admin', 'staff'].includes(user?.role) ? 'HotelBook Admin' : 'HotelBook'}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {isAuthenticated && ['admin', 'staff'].includes(user?.role) ? (
              // Admin/Staff navigation
              <>
                <Link href="/admin/dashboard" className="text-gray-700 hover:text-primary-600 transition-colors">
                  🏠 แดชบอร์ด
                </Link>
                
                {/* Hotel Operations Dropdown */}
                <div className="relative group">
                  <button className="text-gray-700 hover:text-primary-600 transition-colors flex items-center">
                    🏨 จัดการโรงแรม
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-2">
                      <Link href="/admin/rooms" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                        🛏️ จัดการห้องพัก
                      </Link>
                      <Link href="/room-status" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                        📊 สถานะห้อง
                      </Link>
                      <Link href="/checkin-checkout" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                        🏨 Check-in & Check-out
                      </Link>
                      <Link href="/housekeeping" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                        🧹 Housekeeping
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Management Dropdown */}
                <div className="relative group">
                  <button className="text-gray-700 hover:text-primary-600 transition-colors flex items-center">
                    ⚙️ จัดการระบบ
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-2">
                      <Link href="/admin/users" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                        👥 จัดการสมาชิก
                      </Link>
                      <Link href="/admin/reports" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                        📈 รายงาน
                      </Link>
                      {user?.role === 'admin' && (
                        <>
                          <Link href="/admin/permissions" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                            🔐 จัดการสิทธิ์
                          </Link>
                          <Link href="/admin/payment-settings" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                            💳 ตั้งค่าการชำระเงิน
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              // Regular user navigation
              <>
                <Link href="/" className="text-gray-700 hover:text-primary-600 transition-colors">
                  หน้าหลัก
                </Link>
                <Link href="/#rooms" className="text-gray-700 hover:text-primary-600 transition-colors">
                  ห้องพัก
                </Link>
                <Link href="/reviews/1" className="text-gray-700 hover:text-primary-600 transition-colors">
                  รีวิว
                </Link>
                {isAuthenticated && (
                  <>
                    <Link href="/bookings" className="text-gray-700 hover:text-primary-600 transition-colors">
                      การจองของฉัน
                    </Link>
                    <Link href="/notifications" className="text-gray-700 hover:text-primary-600 transition-colors relative">
                      <div className="flex items-center space-x-1">
                        <Bell className="h-5 w-5" />
                        <span>การแจ้งเตือน</span>
                        {hasUnread && (
                          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                      </div>
                    </Link>
                  </>
                )}
              </>
            )}
          </nav>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors">
                  <span className="text-lg">👤</span>
                  <span>{user?.firstName} {user?.lastName}</span>
                </button>
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="py-2">
                    {['admin', 'staff'].includes(user?.role) ? (
                      // Admin/Staff dropdown
                      <>
                        <Link href="/admin/dashboard" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100">
                          <span className="text-sm mr-2">⚙️</span>
                          แดชบอร์ด
                        </Link>
                        <Link href="/admin/rooms" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100">
                          <span className="text-sm mr-2">🏨</span>
                          จัดการห้องพัก
                        </Link>
                        <Link href="/admin/users" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100">
                          <span className="text-sm mr-2">👥</span>
                          จัดการสมาชิก
                        </Link>
                        <Link href="/admin/reports" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100">
                          <span className="text-sm mr-2">📊</span>
                          รายงาน
                        </Link>
                        {user?.role === 'admin' && (
                          <>
                            <Link href="/admin/permissions" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100">
                              <span className="text-sm mr-2">🔐</span>
                              จัดการสิทธิ์
                            </Link>
                            <Link href="/admin/payment-settings" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100">
                              <span className="text-sm mr-2">💳</span>
                              ตั้งค่าการชำระเงิน
                            </Link>
                          </>
                        )}
                        <Link href="/profile" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 border-t border-gray-100">
                          <span className="text-sm mr-2">⚙️</span>
                          โปรไฟล์
                        </Link>
                      </>
                    ) : (
                      // Regular user dropdown
                      <>
                        <Link href="/profile" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100">
                          <span className="text-sm mr-2">⚙️</span>
                          โปรไฟล์
                        </Link>
                        <Link href="/bookings" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100">
                          <span className="text-sm mr-2">📅</span>
                          การจองของฉัน
                        </Link>
                        <Link href="/notifications" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100">
                          <span className="text-sm mr-2">🔔</span>
                          การแจ้งเตือน
                        </Link>
                      </>
                    )}
                    <button 
                      onClick={logout}
                      className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100 border-t border-gray-100"
                    >
                      <span className="text-sm mr-2">🚪</span>
                      ออกจากระบบ
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  href="/login" 
                  className="text-gray-700 hover:text-primary-600 transition-colors"
                >
                  เข้าสู่ระบบ
                </Link>
                <Link 
                  href="/register" 
                  className="btn-primary"
                >
                  สมัครสมาชิก
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            {isMenuOpen ? <span className="text-xl">✕</span> : <span className="text-xl">☰</span>}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="py-4 space-y-4">
              {isAuthenticated && ['admin', 'staff'].includes(user?.role) ? (
                // Admin/Staff mobile menu
                <>
                  <Link 
                    href="/admin/dashboard" 
                    className="block text-gray-700 hover:text-primary-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    แดชบอร์ด
                  </Link>
                  <Link 
                    href="/admin/rooms" 
                    className="block text-gray-700 hover:text-primary-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    จัดการห้องพัก
                  </Link>
                  <Link 
                    href="/admin/users" 
                    className="block text-gray-700 hover:text-primary-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    จัดการสมาชิก
                  </Link>
                  <Link 
                    href="/admin/reports" 
                    className="block text-gray-700 hover:text-primary-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    รายงาน
                  </Link>
                  {user?.role === 'admin' && (
                    <Link 
                      href="/admin/payment-settings" 
                      className="block text-gray-700 hover:text-primary-600"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      ตั้งค่าการชำระเงิน
                    </Link>
                  )}
                  <Link 
                    href="/profile" 
                    className="block text-gray-700 hover:text-primary-600 border-t border-gray-200 pt-4"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    โปรไฟล์
                  </Link>
                  <button 
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left text-gray-700 hover:text-primary-600"
                  >
                    ออกจากระบบ
                  </button>
                </>
              ) : (
                // Regular user mobile menu
                <>
                  <Link 
                    href="/" 
                    className="block text-gray-700 hover:text-primary-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    หน้าหลัก
                  </Link>
                  <Link 
                    href="/#rooms" 
                    className="block text-gray-700 hover:text-primary-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    ห้องพัก
                  </Link>
                  <Link 
                    href="/reviews/1" 
                    className="block text-gray-700 hover:text-primary-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    รีวิว
                  </Link>
                  
                  {isAuthenticated ? (
                    <>
                      <Link 
                        href="/bookings" 
                        className="block text-gray-700 hover:text-primary-600"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        การจองของฉัน
                      </Link>
                      <Link 
                        href="/notifications" 
                        className="block text-gray-700 hover:text-primary-600 relative"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <div className="flex items-center space-x-2">
                          <Bell className="h-5 w-5" />
                          <span>การแจ้งเตือน</span>
                          {hasUnread && (
                            <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                          )}
                        </div>
                      </Link>
                      <Link 
                        href="/profile" 
                        className="block text-gray-700 hover:text-primary-600"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        โปรไฟล์
                      </Link>
                      <button 
                        onClick={() => {
                          logout();
                          setIsMenuOpen(false);
                        }}
                        className="block w-full text-left text-gray-700 hover:text-primary-600 border-t border-gray-200 pt-4"
                      >
                        ออกจากระบบ
                      </button>
                    </>
                  ) : (
                    <>
                      <Link 
                        href="/login" 
                        className="block text-gray-700 hover:text-primary-600"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        เข้าสู่ระบบ
                      </Link>
                      <Link 
                        href="/register" 
                        className="block btn-primary text-center"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        สมัครสมาชิก
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
