import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '../contexts/AuthContext'
import { NotificationProvider } from '../contexts/NotificationContext'
import { LanguageProvider } from '../contexts/LanguageContext'
import { ThemeProvider } from '../contexts/ThemeContext'
import LayoutWrapper from '../components/LayoutWrapper'
import GlobalLanguageThemeHandler from '../components/GlobalLanguageThemeHandler'
import SessionManager from '../components/auth/SessionManager'
import { Toaster } from 'react-hot-toast'
import '../lib/apiMonitor' // Initialize API monitoring

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'HotelBook - ระบบจองโรงแรมออนไลน์',
  description: 'จองโรงแรมออนไลน์ง่ายๆ ราคาดี โรงแรมคุณภาพทั่วประเทศไทย',
}

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body className={inter.className}>
        {/* Prevent MetaMask and other extension errors */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Suppress MetaMask injection errors
              window.addEventListener('error', function(e) {
                if (e.message && e.message.includes('MetaMask')) {
                  e.preventDefault();
                  return false;
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
        <LanguageProvider>
          <ThemeProvider>
            <GlobalLanguageThemeHandler />
            <AuthProvider>
              <NotificationProvider>
                <LayoutWrapper>
                  {children}
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
      </body>
    </html>
  )
}
