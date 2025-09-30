'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import TopNavigation from './TopNavigation';
import Footer from './Footer';

export default function LayoutWrapper({ children }) {
  return (
    <div className="layout-wrapper min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <TopNavigation />
      
      {/* Main content wrapper */}
      <TopNavigationAwareContent>
        {children}
      </TopNavigationAwareContent>
    </div>
  );
}

// Component that adjusts margin based on top navigation
function TopNavigationAwareContent({ children }) {
  const { user } = useAuth();
  const pathname = usePathname();
  
  // Don't show top navigation for auth pages and homepage (homepage has its own TopNavigation)
  if (pathname === '/login' || pathname === '/register' || pathname === '/') {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="main-content flex-1">
          {children}
        </main>
        {/* Show footer only for homepage */}
        {pathname === '/' && (
          <div className="footer-wrapper">
            <Footer />
          </div>
        )}
      </div>
    );
  }
  
  // For all other pages, show with top navigation padding
  const paddingClass = 'pt-16'; // Account for fixed top navigation
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Content area that should grow */}
      <main className={`main-content ${paddingClass} flex-1`}>
        {children}
      </main>
      
      {/* Footer shown for all pages except auth */}
      <div className="footer-wrapper">
        <Footer />
      </div>
    </div>
  );
}
