'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from './Sidebar';
import MobileHeader from './MobileHeader';
import Footer from './Footer';

export default function LayoutWrapper({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="layout-wrapper min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Sidebar 
        isMobileOpen={isMobileMenuOpen} 
        onMobileClose={() => setIsMobileMenuOpen(false)} 
      />
      <MobileHeader onMenuToggle={() => setIsMobileMenuOpen(true)} />
      
      {/* Main content wrapper with conditional margin based on sidebar visibility */}
      <SidebarAwareContent 
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuClose={() => setIsMobileMenuOpen(false)}
      >
        {children}
      </SidebarAwareContent>
    </div>
  );
}

// Component that adjusts margin based on sidebar visibility
function SidebarAwareContent({ children, isMobileMenuOpen }) {
  const { user } = useAuth();
  const pathname = usePathname();
  
  // Don't adjust for auth pages (sidebar is hidden there anyway)
  if (pathname === '/login' || pathname === '/register') {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="main-content flex-1">
          {children}
        </main>
        {/* Footer hidden for auth pages */}
      </div>
    );
  }
  
  // For all other pages, always show sidebar with proper margin and header
  const marginClass = 'ml-0 lg:ml-64';
  const paddingClass = 'pt-16 lg:pt-0';
  
  return (
    <div className={`${marginClass} min-h-screen flex flex-col transition-all duration-300`}>
      {/* Content area that should grow */}
      <main className={`main-content ${paddingClass} flex-1`}>
        {children}
      </main>
      
      {/* Footer shown for homepage and customer pages */}
      <div className="footer-wrapper">
        <Footer />
      </div>
    </div>
  );
}
