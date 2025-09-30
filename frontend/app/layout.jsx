import { Inter, Noto_Sans_Thai, Kanit } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '../contexts/AuthContext'
import { NotificationProvider } from '../contexts/NotificationContext'
import { LanguageProvider } from '../contexts/LanguageContext'
import { ThemeProvider } from '../contexts/ThemeContext'
import LayoutWrapper from '../components/LayoutWrapper'
import GlobalLanguageThemeHandler from '../components/GlobalLanguageThemeHandler'
import SessionManager from '../components/auth/SessionManager'
import HydrationErrorBoundary from '../components/HydrationErrorBoundary'
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
                    position="top-right"
                    toastOptions={{
                      duration: 4000,
                      style: {
                        background: '#fff',
                        color: '#333',
                        fontSize: '14px',
                      },
                      success: {
                        style: {
                          border: '1px solid #10B981',
                        },
                      },
                      error: {
                        style: {
                          border: '1px solid #EF4444',
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
