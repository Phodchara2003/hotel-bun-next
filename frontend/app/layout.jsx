import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '../contexts/AuthContext'
import Header from '../components/Header'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'HotelBook - ระบบจองโรงแรมออนไลน์',
  description: 'จองโรงแรมออนไลน์ง่ายๆ ราคาดี โรงแรมคุณภาพทั่วประเทศไทย',
}

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50">
            <Header />
            <main>
              {children}
            </main>
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
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
