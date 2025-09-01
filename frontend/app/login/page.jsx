'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslation } from '../../translations';
import { Eye, EyeOff, Mail, Lock, Hotel, User } from 'lucide-react';
import ForgotPassword from '../../components/ForgotPassword';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  useEffect(() => {
    const redirect = searchParams.get('redirect');
    if (redirect) {
      setRedirectUrl(decodeURIComponent(redirect));
    }
  }, [searchParams]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(formData);
      if (result.success) {
        // Get user data from the login result
        const user = result.user;
        
        // Wait a moment for state to update, then redirect
        setTimeout(() => {
          if (redirectUrl) {
            // Redirect to the original page they were trying to access
            router.push(redirectUrl);
          } else if (user?.role === 'admin') {
            router.push('/admin/dashboard');
          } else if (user?.role === 'staff') {
            router.push('/admin/dashboard'); // Staff can access admin dashboard but read-only
          } else {
            router.push('/'); // Regular users go to homepage
          }
        }, 100);
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-white/30 backdrop-blur-3xl"></div>
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'radial-gradient(circle at 25% 25%, #6366f1 0%, transparent 50%), radial-gradient(circle at 75% 75%, #8b5cf6 0%, transparent 50%)'
        }}
      ></div>
      
      <div className="relative max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-lg opacity-70"></div>
              <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-2xl">
                <Hotel className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            {t('auth.loginTitle')}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {language === 'en' 
              ? 'Sign in to book hotels and manage your reservations'
              : 'เข้าสู่ระบบเพื่อจองโรงแรมและจัดการการจองของคุณ'
            }
          </p>
        </div>

        {/* Login Form */}
        <div className="relative">
          {/* Glass effect background */}
          <div className="absolute inset-0 bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20"></div>
          
          <div className="relative p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('auth.email')}
                </label>
                <div className="relative group">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-3 bg-white/90 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 group-hover:bg-white text-gray-900 placeholder-gray-500"
                    placeholder="your@example.com"
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('auth.password')}
                </label>
                <div className="relative group">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-12 py-3 bg-white/90 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 group-hover:bg-white text-gray-900 placeholder-gray-500"
                    placeholder="••••••••"
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold text-lg 
                         hover:from-blue-700 hover:to-purple-700 transform hover:scale-[1.02] transition-all duration-200 
                         disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl
                         flex items-center justify-center"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  t('auth.loginButton')
                )}
              </button>

              {/* Forgot Password Link */}
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-blue-600 hover:text-purple-600 font-medium transition-colors"
                >
                  {t('auth.forgotPassword')}
                </button>
              </div>
            </form>

            {/* Footer Links */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {t('auth.noAccount')}{' '}
                <Link href="/register" className="text-blue-600 hover:text-purple-600 font-semibold transition-colors">
                  {t('auth.clickHere')}
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Demo Account Info */}
        <div className="space-y-3">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/10 backdrop-blur-xl rounded-xl border border-blue-200/30"></div>
            <div className="relative p-4">
              <h3 className="text-sm font-semibold text-blue-800 mb-2 flex items-center">
                <User className="h-4 w-4 mr-2" />
                บัญชีทดลองใช้งาน (ผู้ใช้ทั่วไป)
              </h3>
              <div className="text-sm text-blue-700 space-y-1 bg-blue-50/50 rounded-lg p-3">
                <p><strong>Email:</strong> demo@example.com</p>
                <p><strong>Password:</strong> password123</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-purple-500/10 backdrop-blur-xl rounded-xl border border-purple-200/30"></div>
            <div className="relative p-4">
              <h3 className="text-sm font-semibold text-purple-800 mb-2 flex items-center">
                <Hotel className="h-4 w-4 mr-2" />
                บัญชีผู้จัดการ (Admin)
              </h3>
              <div className="text-sm text-purple-700 space-y-1 bg-purple-50/50 rounded-lg p-3">
                <p><strong>Email:</strong> admin@royalgarden.com</p>
                <p><strong>Password:</strong> admin123</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <ForgotPassword
          isOpen={showForgotPassword}
          onClose={() => setShowForgotPassword(false)}
        />
      )}
    </div>
  );
}
