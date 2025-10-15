'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Menu, X, User, ShoppingCart, Home, Bed, Calendar, 
  Phone, BarChart3, Users, FileText, Settings, 
  Shield, UserCheck, Database, DollarSign, MessageSquare,
  Star, LogOut, MapPin
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function TopNavigation() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      setIsMenuOpen(false);
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการออกจากระบบ');
    }
  };

  // Guest Navigation Items
  const guestNavigation = [
    { name: 'หน้าหลัก', href: '/', icon: Home },
    { name: 'ห้องพัก', href: '/rooms', icon: Bed },
    { name: 'การจองของฉัน', href: '/bookings', icon: Calendar },
  ];

  // Staff Navigation Items
  const staffNavigation = [
    { name: 'แดชบอร์ด', href: '/staff/dashboard', icon: BarChart3 },
    { name: 'จัดการการจอง', href: '/staff/bookings', icon: Calendar },
    { name: 'ข้อมูลแขก', href: '/staff/guests', icon: Users },
  ];

  // Manager Navigation Items (ใช้ admin routes เดียวกัน)
  const managerNavigation = [
    { name: 'แดชบอร์ด', href: '/admin/dashboard', icon: BarChart3 },
    { name: 'รายงาน', href: '/admin/reports', icon: FileText },
  ];

  // Admin Navigation Items
  const adminNavigation = [
    { name: 'แดชบอร์ด', href: '/admin/dashboard', icon: BarChart3 },
    { name: 'ห้องพัก', href: '/admin/rooms', icon: Bed },
    { name: 'การจอง', href: '/admin/bookings', icon: Calendar },
    { name: 'ผู้ใช้งาน', href: '/admin/users', icon: Users },
    { name: 'รายงาน', href: '/admin/reports', icon: FileText },
    { name: 'รีวิว', href: '/admin/reviews', icon: MessageSquare },
    { name: 'จัดการข้อมูลการติดต่อ', href: '/admin/contact-settings', icon: Phone },
    { name: 'ตั้งค่า', href: '/admin/settings', icon: Settings },
  ];

  const getNavigation = () => {
    if (!user) return guestNavigation;
    
    switch (user.role) {
      case 'admin': return adminNavigation;
      case 'manager': return managerNavigation;
      case 'staff': return staffNavigation;
      default: return guestNavigation;
    }
  };

  const navigation = getNavigation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 shadow-lg" style={{ background: 'linear-gradient(90deg, #082220, #0a2b28, #082220)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="text-amber-100 text-xl font-light tracking-wider">วรุณภัฏ</div>
            <div className="text-amber-200 text-sm">โรงแรม</div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6">
            {navigation.slice(0, 6).map((item) => {
              const IconComponent = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                    isActive 
                      ? 'bg-amber-500/20 text-amber-300 border-b-2 border-amber-400' 
                      : 'text-amber-100 hover:text-white'
                  }`}
                  style={!isActive ? { ':hover': { backgroundColor: 'rgba(10, 43, 40, 0.7)' } } : {}}
                  onMouseEnter={(e) => !isActive && (e.target.style.backgroundColor = 'rgba(10, 43, 40, 0.7)')}
                  onMouseLeave={(e) => !isActive && (e.target.style.backgroundColor = 'transparent')}
                >
                  <IconComponent className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
            
            {/* More menu for additional items */}
            {navigation.length > 6 && (
              <div className="relative group">
                <button 
                  className="flex items-center space-x-1 px-3 py-2 rounded-lg text-amber-100 hover:text-white transition-all duration-200 text-sm font-medium"
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(10, 43, 40, 0.7)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <span>เพิ่มเติม</span>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  {navigation.slice(6).map((item) => {
                    const IconComponent = item.icon;
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center space-x-2 px-4 py-3 text-sm transition-colors duration-200 ${
                          isActive 
                            ? 'bg-amber-50 text-amber-700 border-l-4 border-amber-400' 
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <IconComponent className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* User Menu */}
            <div className="flex items-center space-x-4 border-l pl-6" style={{ borderColor: 'rgba(10, 43, 40, 0.5)' }}>
              {user ? (
                <div className="flex items-center space-x-4">
                  <Link href="/profile" className="flex items-center space-x-2 hover:opacity-80 transition-opacity duration-200">
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center cursor-pointer">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-white">
                      <div className="text-sm font-medium">{user.name}</div>
                      <div className="text-xs text-amber-200">
                        {user.role === 'admin' ? 'ผู้ดูแลระบบ' : 
                         user.role === 'manager' ? 'ผู้จัดการ' :
                         user.role === 'staff' ? 'พนักงาน' : 'ลูกค้า'}
                      </div>
                    </div>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 text-red-300 hover:text-red-200 transition-colors duration-200 text-sm font-medium"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>ออกจากระบบ</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    href="/login"
                    className="text-white transition-colors duration-200 text-sm font-medium"
                    style={{ color: 'white' }}
                    onMouseEnter={(e) => e.target.style.color = '#d1fae5'}
                    onMouseLeave={(e) => e.target.style.color = 'white'}
                  >
                    เข้าสู่ระบบ
                  </Link>
                  <Link
                    href="/register"
                    className="text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                    style={{ backgroundColor: '#082220' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#0a2926'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#082220'}
                  >
                    สมัครสมาชิก
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white hover:text-amber-400 transition-colors duration-200"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden">
            <div 
              className="px-2 pt-2 pb-3 space-y-1 border-t" 
              style={{ 
                background: 'linear-gradient(180deg, #0a2b28, #082220)',
                borderColor: 'rgba(10, 43, 40, 0.5)'
              }}
            >
              {/* User Info for Mobile */}
              {user && (
                <div className="px-3 py-4 border-b mb-2" style={{ borderColor: 'rgba(10, 43, 40, 0.5)' }}>
                  <Link href="/profile" className="flex items-center space-x-3 hover:opacity-80 transition-opacity duration-200" onClick={() => setIsMenuOpen(false)}>
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center cursor-pointer">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{user.name}</p>
                      <p className="text-sm text-amber-200">
                        {user.role === 'admin' ? 'ผู้ดูแลระบบ' : 
                         user.role === 'manager' ? 'ผู้จัดการ' :
                         user.role === 'staff' ? 'พนักงาน' : 'ลูกค้า'}
                      </p>
                    </div>
                  </Link>
                </div>
              )}

              {/* Navigation Items */}
              {navigation.map((item) => {
                const IconComponent = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 text-sm font-medium ${
                      isActive 
                        ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 border-l-4 border-amber-400 text-amber-300' 
                        : 'text-amber-100 hover:text-white'
                    }`}
                    style={!isActive ? {} : {}}
                    onMouseEnter={(e) => !isActive && (e.target.style.backgroundColor = 'rgba(10, 43, 40, 0.7)')}
                    onMouseLeave={(e) => !isActive && (e.target.style.backgroundColor = 'transparent')}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <IconComponent className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              
              {/* Auth Actions */}
              <div className="border-t mt-4 pt-4" style={{ borderColor: 'rgba(10, 43, 40, 0.5)' }}>
                {user ? (
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 w-full px-3 py-3 rounded-lg text-red-300 hover:text-red-200 hover:bg-red-500/10 transition-all duration-200 text-sm font-medium"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>ออกจากระบบ</span>
                  </button>
                ) : (
                  <div className="space-y-2">
                    <Link
                      href="/login"
                      className="flex items-center space-x-3 px-3 py-3 rounded-lg text-white transition-all duration-200 text-sm font-medium"
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(8, 34, 32, 0.2)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="h-5 w-5" />
                      <span>เข้าสู่ระบบ</span>
                    </Link>
                    <Link
                      href="/register"
                      className="flex items-center justify-center text-white px-3 py-3 rounded-lg text-sm font-medium transition-colors duration-200 mx-3"
                      style={{ backgroundColor: '#082220' }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#0a2926'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#082220'}
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
    </nav>
  );
}