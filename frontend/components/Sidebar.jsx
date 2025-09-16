'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Hotel, Calendar, User, Users, Settings, BarChart3, 
  DollarSign, MessageSquare, Star, LogOut, Menu, X, 
  ChevronRight, Bed, CreditCard, Bell,
  Shield, UserCheck, FileText, Database, UserPlus
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

  // Don't show sidebar on auth pages
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
      toast.success('ออกจากระบบสำเร็จ');
      // ไม่ redirect ให้อยู่หน้าเดิม
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการออกจากระบบ');
    }
  };

  // Customer Menu Items (when not authenticated)
  const guestMenuItems = [
    {
      key: 'home',
      label: 'หน้าแรก',
      icon: Hotel,
      href: '/',
      active: pathname === '/'
    }
  ];

  // Customer Menu Items (when authenticated)
  const customerMenuItems = [
    {
      key: 'home',
      label: 'ห้องพัก',
      icon: Bed,
      href: '/',
      active: pathname === '/'
    },
    {
      key: 'bookings',
      label: 'การจองของฉัน',
      icon: Calendar,
      href: '/my-bookings',
      active: pathname === '/my-bookings'
    },
    {
      key: 'notifications',
      label: 'การแจ้งเตือน',
      icon: Bell,
      href: '/notifications',
      active: pathname === '/notifications'
    }
  ];

  // Admin Menu Items
  const adminMenuItems = [
    {
      key: 'admin-dashboard',
      label: 'แดชบอร์ดแอดมิน',
      icon: BarChart3,
      href: '/admin/dashboard',
      active: pathname === '/admin/dashboard'
    },
    {
      key: 'bookings-management',
      label: 'จัดการการจอง',
      icon: Calendar,
      href: '/admin/bookings',
      active: pathname === '/admin/bookings'
    },
    {
      key: 'booking-calendar',
      label: 'ปฏิทินการจอง',
      icon: Calendar,
      href: '/admin/calendar',
      active: pathname === '/admin/calendar'
    },
    {
      key: 'rooms-management',
      label: 'จัดการห้องพัก',
      icon: Bed,
      href: '/admin/rooms',
      active: pathname === '/admin/rooms'
    },
    {
      key: 'users-management',
      label: 'จัดการผู้ใช้',
      icon: Users,
      href: '/admin/user-management',
      active: pathname === '/admin/user-management'
    },
    {
      key: 'reports',
      label: 'รายงาน',
      icon: FileText,
      href: '/admin/reports',
      active: pathname === '/admin/reports'
    },
    {
      key: 'settings',
      label: 'การตั้งค่า',
      icon: Settings,
      href: '/admin/payment-settings',
      active: pathname === '/admin/payment-settings'
    }
  ];

  // Staff Menu Items
  const staffMenuItems = [
    {
      key: 'staff-dashboard',
      label: 'แดชบอร์ดพนักงาน',
      icon: UserCheck,
      href: '/staff/dashboard',
      active: pathname === '/staff/dashboard'
    },
    {
      key: 'staff-bookings',
      label: 'จัดการการจอง',
      icon: Calendar,
      href: '/staff/bookings',
      active: pathname === '/staff/bookings'
    },
    {
      key: 'check-in-out',
      label: 'เช็คอิน/เช็คเอาท์',
      icon: UserCheck,
      href: '/staff/checkin',
      active: pathname === '/staff/checkin'
    },
    {
      key: 'room-status',
      label: 'สถานะห้องพัก',
      icon: Bed,
      href: '/staff/rooms',
      active: pathname === '/staff/rooms'
    }
  ];

  const getMenuItems = () => {
    if (!isAuthenticated) return guestMenuItems;
    
    switch (user?.role) {
      case 'admin':
        return adminMenuItems;
      case 'staff':
        return staffMenuItems;
      default:
        return customerMenuItems;
    }
  };

  const renderMenuItem = (item, level = 0) => {
    const Icon = item.icon;

    return (
      <Link
        key={item.key}
        href={item.href}
        className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 mb-1 ${
          isCollapsed ? 'px-3 justify-center' : ''
        } ${
          item.active
            ? 'bg-blue-600 text-white shadow-lg'
            : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
        }`}
      >
        <Icon className={`${isCollapsed ? 'w-5 h-5' : 'w-5 h-5 mr-3'} flex-shrink-0`} />
        {!isCollapsed && <span className="font-medium">{item.label}</span>}
      </Link>
    );
  };

  return (
    <>
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full bg-gradient-to-b from-gray-900 via-slate-900 to-gray-900 border-r border-gray-700/50 transition-all duration-300 z-40 ${
        isCollapsed ? 'w-16' : 'w-64'
      } ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
          {!isCollapsed && (
            <div className="flex items-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg blur opacity-60"></div>
                <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg shadow-lg">
                  <Hotel className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-white font-bold text-lg">HotelBook</h1>
                <p className="text-gray-400 text-xs">
                  {!isAuthenticated ? 'ยินดีต้อนรับ' :
                   user?.role === 'admin' ? 'ผู้ดูแลระบบ' : 
                   user?.role === 'staff' ? 'พนักงาน' : 'ลูกค้า'}
                </p>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors hidden lg:block"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </button>
          <button
            onClick={onMobileClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors lg:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Info */}
        {isAuthenticated && !isCollapsed && (
          <div className="p-4 border-b border-gray-700/50">
            <Link 
              href={user?.role === 'admin' || user?.role === 'staff' ? '/admin/profile' : '/profile'} 
              className="flex items-center hover:bg-gray-700/30 rounded-lg p-2 transition-colors"
            >
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="ml-3">
                <p className="text-white font-medium text-sm">
                  {user?.first_name || user?.firstName || user?.name || 'ผู้ใช้'}
                </p>
                <p className="text-gray-400 text-xs">{user?.email}</p>
              </div>
            </Link>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {getMenuItems().map(item => renderMenuItem(item))}
          </div>
        </nav>

        {/* Logout Button or Login/Register Buttons */}
        {isAuthenticated ? (
          <div className="p-4 border-t border-gray-700/50">
            <button
              onClick={handleLogout}
              className={`w-full flex items-center px-4 py-3 text-gray-300 hover:bg-red-600 hover:text-white rounded-lg transition-all duration-200 ${
                isCollapsed ? 'px-3 justify-center' : ''
              }`}
            >
              <LogOut className={`${isCollapsed ? 'w-5 h-5' : 'w-5 h-5 mr-3'} flex-shrink-0`} />
              {!isCollapsed && <span className="font-medium">ออกจากระบบ</span>}
            </button>
          </div>
        ) : (
          <div className="p-4 border-t border-gray-700/50 space-y-2">
            <Link
              href="/login"
              className={`w-full flex items-center px-4 py-3 text-gray-300 hover:bg-blue-600 hover:text-white rounded-lg transition-all duration-200 ${
                isCollapsed ? 'px-3 justify-center' : ''
              }`}
            >
              <User className={`${isCollapsed ? 'w-5 h-5' : 'w-5 h-5 mr-3'} flex-shrink-0`} />
              {!isCollapsed && <span className="font-medium">เข้าสู่ระบบ</span>}
            </Link>
            <Link
              href="/register"
              className={`w-full flex items-center px-4 py-3 text-gray-300 hover:bg-green-600 hover:text-white rounded-lg transition-all duration-200 ${
                isCollapsed ? 'px-3 justify-center' : ''
              }`}
            >
              <UserPlus className={`${isCollapsed ? 'w-5 h-5' : 'w-5 h-5 mr-3'} flex-shrink-0`} />
              {!isCollapsed && <span className="font-medium">สมัครสมาชิก</span>}
            </Link>
          </div>
        )}
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onMobileClose}
        />
      )}
    </>
  );
}
