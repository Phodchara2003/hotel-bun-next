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
      toast.success('ออกจากระบบสำเร็จ');
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการออกจากระบบ');
    }
  };

  // Guest Menu Items (ลูกค้าทั่วไป)
  const guestMenuItems = [
    {
      key: 'home',
      icon: Home,
      label: 'หน้าแรก',
      href: '/',
      color: 'text-amber-600',
    },
    {
      key: 'rooms',
      icon: Bed,
      label: 'ห้องพัก',
      href: '/rooms',
      color: 'text-blue-600',
    },
    {
      key: 'bookings',
      icon: Calendar,
      label: 'การจอง',
      href: '/bookings',
      color: 'text-green-600',
    },
    {
      key: 'contact',
      icon: Phone,
      label: 'ติดต่อเรา',
      href: '/contact',
      color: 'text-purple-600',
    }
  ];

  // User Menu Items (ลูกค้าที่ล็อกอินแล้ว)
  const userMenuItems = [
    ...guestMenuItems,
    {
      key: 'profile',
      icon: User,
      label: 'โปรไฟล์',
      href: '/profile',
      color: 'text-indigo-600',
    },
    {
      key: 'my-bookings',
      icon: FileText,
      label: 'การจองของฉัน',
      href: '/my-bookings',
      color: 'text-orange-600',
    }
  ];

  // Admin/Manager Menu Items
  const adminMenuItems = [
    {
      key: 'dashboard',
      icon: BarChart3,
      label: 'แดชบอร์ด',
      href: '/admin/dashboard',
      color: 'text-blue-600',
    },
    {
      key: 'room-management',
      icon: Bed,
      label: 'จัดการห้องพัก',
      color: 'text-green-600',
      subItems: [
        { label: 'ห้องพัก', href: '/admin/rooms' },
        { label: 'ประเภทห้อง', href: '/admin/room-types' },
        { label: 'สถานะห้อง', href: '/admin/room-status' }
      ]
    },
    {
      key: 'booking-management',
      icon: Calendar,
      label: 'จัดการการจอง',
      color: 'text-purple-600',
      subItems: [
        { label: 'การจองทั้งหมด', href: '/admin/bookings' },
        { label: 'คำขอยกเลิก', href: '/admin/cancellation-requests' },
        { label: 'รายงานการจอง', href: '/admin/booking-reports' }
      ]
    },
    {
      key: 'user-management',
      icon: Users,
      label: 'จัดการผู้ใช้',
      color: 'text-indigo-600',
      subItems: [
        { label: 'ผู้ใช้ทั้งหมด', href: '/admin/users' },
        { label: 'สร้างผู้ใช้ใหม่', href: '/admin/users/create' },
        { label: 'บทบาทผู้ใช้', href: '/admin/user-roles' }
      ]
    },
    {
      key: 'hotel-management',
      icon: Hotel,
      label: 'จัดการโรงแรม',
      color: 'text-red-600',
      subItems: [
        { label: 'สิ่งอำนวยความสะดวก', href: '/admin/amenities' },
        { label: 'รูปภาพ', href: '/admin/images' }
      ]
    },
    {
      key: 'settings',
      icon: Settings,
      label: 'ตั้งค่าระบบ',
      color: 'text-gray-600',
      subItems: [
        { label: 'การตั้งค่าทั่วไป', href: '/admin/settings' },
        { label: 'การแจ้งเตือน', href: '/admin/notifications' },
        { label: 'ข้อมูลระบบ', href: '/admin/system-info' }
      ]
    }
  ];

  // เลือกเมนูตาม role ของผู้ใช้
  let menuItems = guestMenuItems;
  
  if (user) {
    if (['admin', 'manager', 'staff'].includes(user.role)) {
      menuItems = adminMenuItems;
    } else {
      menuItems = userMenuItems;
    }
  }

  const renderMenuItem = (item) => {
    const Icon = item.icon;
    const isActive = pathname === item.href || 
                    (item.subItems && item.subItems.some(sub => pathname === sub.href));
    const hasSubItems = item.subItems && item.subItems.length > 0;

    if (hasSubItems) {
      return (
        <div key={item.key} className="mb-1">
          <button
            onClick={() => toggleMenu(item.key)}
            className={`w-full flex items-center justify-between px-4 py-3 text-left rounded-lg transition-all duration-200 ${
              isActive 
                ? 'bg-amber-50 text-amber-700 border-r-2 border-amber-600' 
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Icon className={`h-5 w-5 ${item.color}`} />
              <span className="font-medium">{item.label}</span>
            </div>
            <ChevronRight 
              className={`h-4 w-4 transition-transform duration-200 ${
                expandedMenus[item.key] ? 'rotate-90' : ''
              }`} 
            />
          </button>
          
          {expandedMenus[item.key] && (
            <div className="ml-8 mt-2 space-y-1">
              {item.subItems.map((subItem, index) => (
                <Link
                  key={index}
                  href={subItem.href}
                  onClick={onMobileClose}
                  className={`block px-4 py-2 text-sm roundedevery transition-colors duration-200 ${
                    pathname === subItem.href
                      ? 'bg-amber-100 text-amber-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {subItem.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.key}
        href={item.href}
        onClick={onMobileClose}
        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 mb-1 ${
          isActive 
            ? 'bg-amber-50 text-amber-700 border-r-2 border-amber-600 font-medium' 
            : 'text-gray-700 hover:bg-gray-50'
        }`}
      >
        <Icon className={`h-5 w-5 ${isActive ? 'text-amber-600' : item.color}`} />
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:bg-white lg:border-r lg:border-gray-200 lg:shadow-sm">
        <div className="flex flex-col flex-1 pt-5 pb-4 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center justify-center px-4 mb-8">
            <Link href="/" className="flex items-center space-x-2">
              <div className="bg-amber-600 p-2 rounded-lg">
                <Hotel className="h-6 w-6 text-white" />
              </div>
              <div className="text-xl font-bold text-gray-900">วรุณภัฏ</div>
            </Link>
          </div>

          {/* User Info */}
          {user && (
            <div className="px-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  <div className="bg-amber-100 p-2 rounded-full">
                    <User className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.name || user.username}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {user.role === 'admin' ? 'ผู้ดูแลระบบ' : 
                       user.role === 'manager' ? 'ผู้จัดการ' :
                       user.role === 'staff' ? 'พนักงาน' : 'ลูกค้า'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-1">
            {menuItems.map(renderMenuItem)}
          </nav>

          {/* Bottom Section */}
          <div className="px-4 pt-4 border-t border-gray-200">
            {user ? (
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 w-full px-4 py-3 text-left text-gray-700 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors duration-200"
              >
                <LogOut className="h-5 w-5" />
                <span>ออกจากระบบ</span>
              </button>
            ) : (
              <div className="space-y-2">
                <Link
                  href="/login"
                  className="flex items-center justify-center w-full px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors duration-200"
                >
                  เข้าสู่ระบบ
                </Link>
                <Link
                  href="/register"
                  className="flex items-center justify-center w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  สมัครสมาชิก
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div className={`lg:hidden fixed inset-0 z-50 ${isMobileOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onMobileClose}></div>
        <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <Link href="/" className="flex items-center space-x-2" onClick={onMobileClose}>
                <div className="bg-amber-600 p-2 rounded-lg">
                  <Hotel className="h-5 w-5 text-white" />
                </div>
                <div className="text-lg font-bold text-gray-900">วรุณภัฏ</div>
              </Link>
              <button
                onClick={onMobileClose}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* User Info */}
            {user && (
              <div className="p-4 border-b border-gray-200">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center space-x-3">
                    <div className="bg-amber-100 p-2 rounded-full">
                      <User className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.name || user.username}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {user.role === 'admin' ? 'ผู้ดูแลระบบ' : 
                         user.role === 'manager' ? 'ผู้จัดการ' :
                         user.role === 'staff' ? 'พนักงาน' : 'ลูกค้า'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {menuItems.map(renderMenuItem)}
            </nav>

            {/* Bottom Section */}
            <div className="p-4 border-t border-gray-200">
              {user ? (
                <button
                  onClick={() => {
                    handleLogout();
                    onMobileClose();
                  }}
                  className="flex items-center space-x-3 w-full px-4 py-3 text-left text-gray-700 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors duration-200"
                >
                  <LogOut className="h-5 w-5" />
                  <span>ออกจากระบบ</span>
                </button>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/login"
                    onClick={onMobileClose}
                    className="flex items-center justify-center w-full px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors duration-200"
                  >
                    เข้าสู่ระบบ
                  </Link>
                  <Link
                    href="/register"
                    onClick={onMobileClose}
                    className="flex items-center justify-center w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    สมัครสมาชิก
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}