'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Hotel, Calendar, User, Users, Settings, BarChart3, 
  DollarSign, MessageSquare, Star, LogOut, Menu, X, 
  ChevronRight, Bed, CreditCard, Home, Phone, Mail,
  Shield, UserCheck, FileText, Database, UserPlus, MapPin
} from 'lucide-react';
import { useTranslation } from '../translations';
import { useLanguage } from '../contexts/LanguageContext';
import toast from 'react-hot-toast';

export default function Sidebar({ isMobileOpen = false, onMobileClose }) {
  const { user, isAuthenticated, logout } = useAuth();
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});

  // Don't show sidebar on auth pages only
  if (pathname === '/login' || pathname === '/register') {
    return null;
  }

  const toggleMenu = (menuKey) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการออกจากระบบ');
    }
  };

  // Guest Menu Items (ลูกค้าทั่วไป)
  const guestMenuItems = [
    {
      key: 'home',
      label: 'หน้าหลัก',
      icon: Home,
      href: '/',
      color: 'text-emerald-400'
    },
    {
      key: 'rooms',
      label: 'ห้องพัก',
      icon: Bed,
      href: '/rooms',
      color: 'text-amber-400'
    },
    {
      key: 'bookings',
      label: 'การจองของฉัน',
      icon: Calendar,
      href: '/bookings',
      color: 'text-blue-400'
    },
    {
      key: 'profile',
      label: 'โปรไฟล์',
      icon: User,
      href: '/profile',
      color: 'text-purple-400'
    }
  ];

  // Staff Menu Items
  const staffMenuItems = [
    {
      key: 'dashboard',
      label: 'แดชบอร์ด',
      icon: BarChart3,
      href: '/staff/dashboard',
      color: 'text-emerald-400'
    },
    {
      key: 'bookings',
      label: 'จัดการการจอง',
      icon: Calendar,
      href: '/staff/bookings',
      color: 'text-blue-400'
    },
    {
      key: 'guests',
      label: 'ข้อมูลแขก',
      icon: Users,
      href: '/staff/guests',
      color: 'text-purple-400'
    }
  ];

  // Manager Menu Items (ใช้ admin routes เดียวกัน)
  const managerMenuItems = [
    {
      key: 'dashboard',
      label: 'แดชบอร์ด',
      icon: BarChart3,
      href: '/admin/dashboard',
      color: 'text-emerald-400'
    },
    {
      key: 'reports',
      label: 'รายงาน',
      icon: FileText,
      href: '/admin/reports',
      color: 'text-green-400'
    }
  ];

  // Admin Menu Items
  const adminMenuItems = [
    {
      key: 'dashboard',
      label: 'แดชบอร์ด',
      icon: BarChart3,
      href: '/admin/dashboard',
      color: 'text-emerald-400'
    },
    {
      key: 'rooms',
      label: 'จัดการห้องพัก',
      icon: Bed,
      href: '/admin/rooms',
      color: 'text-amber-400'
    },
    {
      key: 'users',
      label: 'จัดการผู้ใช้งาน',
      icon: Users,
      href: '/admin/users',
      color: 'text-blue-400'
    },
    {
      key: 'bookings',
      label: 'จัดการการจอง',
      icon: Calendar,
      href: '/admin/bookings',
      color: 'text-green-400'
    },
    {
      key: 'reports',
      label: 'รายงาน',
      icon: FileText,
      href: '/admin/reports',
      color: 'text-purple-400'
    },
    {
      key: 'settings',
      label: 'ตั้งค่าระบบ',
      icon: Settings,
      href: '/admin/settings',
      color: 'text-gray-400'
    }
  ];

  const getMenuItems = () => {
    if (!user) return guestMenuItems;
    
    switch (user.role) {
      case 'admin': return adminMenuItems;
      case 'manager': return managerMenuItems;
      case 'staff': return staffMenuItems;
      default: return guestMenuItems;
    }
  };

  const currentMenuItems = getMenuItems();

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full bg-gradient-to-b from-emerald-900 via-emerald-800 to-emerald-900 text-white z-50
        transform transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isCollapsed ? 'w-16' : 'w-64'}
      `}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-emerald-700/50">
          <div className={`transition-all duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
            <h1 className="text-2xl font-light tracking-wider">วรุณภัฏ</h1>
            <p className="text-emerald-200 text-sm font-light">โรงแรม</p>
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:block p-2 rounded-lg hover:bg-emerald-700/50 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <button
            onClick={onMobileClose}
            className="lg:hidden p-2 rounded-lg hover:bg-emerald-700/50 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Info */}
        {user && (
          <div className="p-6 border-b border-emerald-700/50">
            <div className={`flex items-center space-x-3 ${isCollapsed ? 'justify-center' : ''}`}>
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              {!isCollapsed && (
                <div>
                  <p className="font-medium text-white">{user.name}</p>
                  <p className="text-sm text-emerald-200 capitalize">
                    {user.role === 'admin' ? 'ผู้ดูแลระบบ' : 
                     user.role === 'manager' ? 'ผู้จัดการ' :
                     user.role === 'staff' ? 'พนักงาน' : 'ลูกค้า'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 py-6">
          <div className="space-y-2 px-4">
            {currentMenuItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={onMobileClose}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200
                    ${isActive 
                      ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 border-l-4 border-amber-400 text-amber-300' 
                      : 'hover:bg-emerald-700/30 text-emerald-100 hover:text-white'
                    }
                    ${isCollapsed ? 'justify-center' : ''}
                  `}
                >
                  <IconComponent className={`h-5 w-5 ${isActive ? 'text-amber-400' : item.color}`} />
                  {!isCollapsed && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-emerald-700/50">
          {user ? (
            <button
              onClick={handleLogout}
              className={`
                w-full flex items-center space-x-3 px-4 py-3 rounded-xl
                text-red-300 hover:text-red-200 hover:bg-red-500/10 transition-all duration-200
                ${isCollapsed ? 'justify-center' : ''}
              `}
            >
              <LogOut className="h-5 w-5" />
              {!isCollapsed && <span className="font-medium">ออกจากระบบ</span>}
            </button>
          ) : (
            <Link
              href="/login"
              onClick={onMobileClose}
              className={`
                w-full flex items-center space-x-3 px-4 py-3 rounded-xl
                text-white transition-all duration-200
                ${isCollapsed ? 'justify-center' : ''}
              `}
              style={{ 
                background: '#082220',
                '&:hover': { background: '#0a2926' }
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#0a2926';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#082220';
              }}
            >
              <User className="h-5 w-5" />
              {!isCollapsed && <span className="font-medium">เข้าสู่ระบบ</span>}
            </Link>
          )}
        </div>
      </div>
    </>
  );
}