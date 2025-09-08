'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home,
  Calendar, 
  CalendarDays,
  Bed,
  Users, 
  CreditCard, 
  TrendingUp,
  Settings,
  ChevronRight
} from 'lucide-react';

const AdminNavigation = ({ title, description }) => {
  const pathname = usePathname();

  const navigationItems = [
    {
      name: 'แดชบอร์ด',
      href: '/admin/dashboard',
      icon: Home,
      active: pathname === '/admin/dashboard'
    },
    {
      name: 'จัดการจอง',
      href: '/admin/bookings',
      icon: Calendar,
      active: pathname === '/admin/bookings'
    },
    {
      name: 'ปฏิทินการจอง',
      href: '/admin/calendar',
      icon: CalendarDays,
      active: pathname === '/admin/calendar'
    },
    {
      name: 'จัดการห้องพัก',
      href: '/admin/rooms',
      icon: Bed,
      active: pathname === '/admin/rooms'
    },
    {
      name: 'จัดการผู้ใช้',
      href: '/admin/user-management',
      icon: Users,
      active: pathname === '/admin/user-management'
    },
    {
      name: 'รายงาน',
      href: '/admin/reports',
      icon: TrendingUp,
      active: pathname === '/admin/reports'
    },
    {
      name: 'ตั้งค่า',
      href: '/admin/payment-settings',
      icon: Settings,
      active: pathname === '/admin/payment-settings'
    }
  ];

  const getBreadcrumbs = () => {
    const breadcrumbs = [
      { name: 'แอดมิน', href: '/admin/dashboard' }
    ];

    if (pathname !== '/admin/dashboard') {
      const currentItem = navigationItems.find(item => item.active);
      if (currentItem) {
        breadcrumbs.push({ name: currentItem.name, href: currentItem.href });
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <>
      {/* Breadcrumb Navigation */}
      <div className="mb-6">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            {breadcrumbs.map((breadcrumb, index) => (
              <li key={breadcrumb.href} className="flex items-center">
                {index > 0 && (
                  <ChevronRight className="h-4 w-4 text-neutral-400 mx-2" />
                )}
                <Link
                  href={breadcrumb.href}
                  className={`text-sm font-medium transition-colors ${
                    index === breadcrumbs.length - 1
                      ? 'text-neutral-900 dark:text-white'
                      : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
                  }`}
                >
                  {breadcrumb.name}
                </Link>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Page Header */}
      {title && (
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
            {title}
          </h1>
          {description && (
            <p className="text-neutral-600 dark:text-neutral-400">
              {description}
            </p>
          )}
        </div>
      )}

      {/* Quick Navigation Cards */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
          เมนูหลัก
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-lg transform hover:scale-105 ${
                  item.active
                    ? 'bg-primary-50 border-primary-500 text-primary-700 dark:bg-primary-900 dark:border-primary-400 dark:text-primary-300'
                    : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-neutral-600'
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
                    item.active
                      ? 'bg-primary-500 text-white'
                      : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-medium">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default AdminNavigation;
