'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslation } from '../../translations';

export default function AdminPage() {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const { t } = useTranslation(language);

  useEffect(() => {
    if (!loading) {
      // Check authentication and role before redirecting
      if (!isAuthenticated) {
        router.replace('/login?redirect=/admin');
        return;
      }

      if (!user || !['admin', 'staff'].includes(user.role)) {
        router.replace('/');
        return;
      }

      // Redirect to dashboard for valid admin/staff users
      router.replace('/admin/dashboard');
    }
  }, [loading, isAuthenticated, user, router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">
          {t('admin.redirecting', 'กำลังเปลี่ยนเส้นทางไปยังแดชบอร์ด...')}
        </p>
      </div>
    </div>
  );
}
