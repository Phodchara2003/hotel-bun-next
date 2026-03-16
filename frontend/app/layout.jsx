import { Inter, Noto_Sans_Thai, Kanit } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '../contexts/AuthContext'
import { NotificationProvider } from '../contexts/NotificationContext'
import { LanguageProvider } from '../contexts/LanguageContext'
import { ThemeProvider } from '../contexts/ThemeContext'
import LayoutWrapper from '@/components/layout/LayoutWrapper'
import GlobalLanguageThemeHandler from '@/components/theming/GlobalLanguageThemeHandler'
import SessionManager from '@/components/auth/SessionManager'
import HydrationErrorBoundary from '@/components/ui/HydrationErrorBoundary'
import { Toaster } from 'react-hot-toast'
import '../lib/apiMonitor' // Initialize API monitoring

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true
})

const notoSansThai = Noto_Sans_Thai({
  subsets: ['thai', 'latin'],
  display: 'swap',
  preload: true,
  variable: '--font-noto-sans-thai'
})

const kanit = Kanit({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  preload: true,
  variable: '--font-kanit'
})

export const metadata = {
  title: 'ระบบจองโรงแรมวรุณภัฏ - มหาวิทยาลัยราชภัฏมหาสารคาม',
  description: 'ระบบจองโรงแรมวรุณภัฏมหาวิทยาลัยราชภัฏมหาสารคาม - พัฒนาโดย นาย พชร มีหา',
}

export default function RootLayout({ children }) {
  return (
    <html lang="th" suppressHydrationWarning={true}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body className={`${inter.className} ${notoSansThai.variable} ${kanit.variable}`} suppressHydrationWarning={true}>
        {/* Prevent MetaMask and other extension errors */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Debug hydration issues
              if (typeof window !== 'undefined') {
                console.log('🔍 RootLayout client-side initialized');
              }
              
              // Suppress MetaMask injection errors
              window.addEventListener('error', function(e) {
                if (e.message && e.message.includes('MetaMask')) {
                  e.preventDefault();
                  return false;
                }
                // Log other hydration errors for debugging
                if (e.message && e.message.includes('Hydration')) {
                  console.error('🚨 Hydration Error:', e.message);
                }
              });
              
              // Suppress unhandled promise rejections from extensions
              window.addEventListener('unhandledrejection', function(e) {
                if (e.reason && e.reason.message && e.reason.message.includes('MetaMask')) {
                  e.preventDefault();
                  return false;
                }
              });
            `,
          }}
        />
        <HydrationErrorBoundary>
          <LanguageProvider>
            <ThemeProvider>
              <GlobalLanguageThemeHandler />
              <AuthProvider>
                <NotificationProvider>
                  <LayoutWrapper>
                    <div>
                      {children}
                    </div>
                    <SessionManager />
                  </LayoutWrapper>
                  <Toaster 
                    position="top-center"
                    toastOptions={{
                      duration: 4000,
                      style: {
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: '600',
                        padding: '16px 24px',
                        borderRadius: '12px',
                        boxShadow: '0 10px 30px rgba(16, 185, 129, 0.4)',
                        border: '2px solid rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(10px)',
                      },
                      success: {
                        style: {
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          color: 'white',
                        },
                        iconTheme: {
                          primary: 'white',
                          secondary: '#10b981',
                        },
                      },
                      error: {
                        style: {
                          background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                          color: 'white',
                          border: '2px solid rgba(255, 255, 255, 0.2)',
                        },
                        iconTheme: {
                          primary: 'white',
                          secondary: '#dc2626',
                        },
                      },
                      loading: {
                        style: {
                          background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                          color: 'white',
                        },
                      },
                    }}
                  />
                </NotificationProvider>
              </AuthProvider>
            </ThemeProvider>
          </LanguageProvider>
        </HydrationErrorBoundary>
      </body>
    </html>
  )
}
