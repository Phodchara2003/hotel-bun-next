'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import MobileHeader from './MobileHeader';

export default function LayoutWrapper({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Sidebar 
        isMobileOpen={isMobileMenuOpen} 
        onMobileClose={() => setIsMobileMenuOpen(false)} 
      />
      <MobileHeader onMenuToggle={() => setIsMobileMenuOpen(true)} />
      <main className="ml-0 lg:ml-64 pt-16 lg:pt-0 transition-all duration-300">
        {children}
      </main>
    </div>
  );
}
