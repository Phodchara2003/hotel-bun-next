'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto container-padding">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link 
            href={isAuthenticated && user?.role === 'admin' ? '/admin/dashboard' : '/'} 
            className="flex items-center space-x-2"
          >
            <span className="text-2xl">🏨</span>
            <span className="text-xl font-bold text-gray-900">
              {isAuthenticated && user?.role === 'admin' ? 'HotelBook Admin' : 'HotelBook'}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {isAuthenticated && user?.role === 'admin' ? (
              // Admin navigation
              <>
                <Link href="/admin/dashboard" className="text-gray-700 hover:text-primary-600 transition-colors">
                  แดชบอร์ด
                </Link>
                <Link href="/admin/rooms" className="text-gray-700 hover:text-primary-600 transition-colors">
                  จัดการห้องพัก
                </Link>
                <Link href="/admin/users" className="text-gray-700 hover:text-primary-600 transition-colors">
                  จัดการสมาชิก
                </Link>
                <Link href="/admin/reports" className="text-gray-700 hover:text-primary-600 transition-colors">
                  รายงาน
                </Link>
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
                    <Link href="/notifications" className="text-gray-700 hover:text-primary-600 transition-colors">
                      การแจ้งเตือน
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
                    {user?.role === 'admin' ? (
                      // Admin dropdown
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
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
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
              {isAuthenticated && user?.role === 'admin' ? (
                // Admin mobile menu
                <>
                  <Link 
                    href="/admin/dashboard" 
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    แดชบอร์ด
                  </Link>
                  <Link 
                    href="/admin/rooms" 
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    จัดการห้องพัก
                  </Link>
                  <Link 
                    href="/admin/users" 
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    จัดการสมาชิก
                  </Link>
                  <Link 
                    href="/admin/reports" 
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    รายงาน
                  </Link>
                </>
              ) : (
                // Regular user mobile menu
                <>
                  <Link 
                    href="/" 
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    หน้าหลัก
                  </Link>
                  <Link 
                    href="/#rooms" 
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    ห้องพัก
                  </Link>
                  <Link 
                    href="/reviews/1" 
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    รีวิว
                  </Link>
                  {isAuthenticated && (
                    <>
                      <Link 
                        href="/bookings" 
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        การจองของฉัน
                      </Link>
                      <Link 
                        href="/notifications" 
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        การแจ้งเตือน
                      </Link>
                    </>
                  )}
                </>
              )}

              {/* Mobile Auth Section */}
              <div className="border-t border-gray-200 pt-4">
                {isAuthenticated ? (
                  <div className="space-y-2">
                    <div className="px-4 py-2 text-sm text-gray-500">
                      สวัสดี, {user?.firstName} {user?.lastName}
                    </div>
                    <Link 
                      href="/profile" 
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      โปรไฟล์
                    </Link>
                    <button 
                      onClick={() => {
                        logout();
                        setIsMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                    >
                      ออกจากระบบ
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link 
                      href="/login" 
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      เข้าสู่ระบบ
                    </Link>
                    <Link 
                      href="/register" 
                      className="block px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      สมัครสมาชิก
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
