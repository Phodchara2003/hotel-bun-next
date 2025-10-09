'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, Hotel, ArrowRight, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { login, user, getRememberMePreference } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false); // เปลี่ยนเป็น false เพื่อหลีกเลี่ยง hydration error
  const [isClient, setIsClient] = useState(false); // เพิ่ม state เพื่อตรวจสอบว่าเป็น client-side หรือไม่
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Load remember me preference and redirect if already logged in
  useEffect(() => {
    setIsClient(true);
    // Load remember me preference from localStorage
    const savedRememberMe = getRememberMePreference();
    setRememberMe(savedRememberMe);
    
    if (user) {
      router.push('/');
    }
  }, [user, router, getRememberMePreference]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRememberMeChange = (e) => {
    setRememberMe(e.target.checked);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Basic validation
    if (!formData.email || !formData.password) {
      toast.error('กรุณากรอกอีเมลและรหัสผ่าน');
      setLoading(false);
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('รูปแบบอีเมลไม่ถูกต้อง');
      setLoading(false);
      return;
    }

    try {
      // Pass both credentials and rememberMe preference
      const result = await login(
        { email: formData.email, password: formData.password },
        rememberMe
      );
      
      if (result.success) {
        // Redirect based on user role
        if (result.user?.role === 'manager') {
          router.push('/manager');
        } else if (['admin', 'staff'].includes(result.user?.role)) {
          router.push('/admin/dashboard');
        } else {
          router.push('/');
        }
      } else {
        // Handle specific login errors
        if (result.error) {
          if (result.error.includes('email') || result.error.includes('ไม่พบผู้ใช้')) {
            toast.error('ไม่พบอีเมลนี้ในระบบ กรุณาตรวจสอบอีเมลอีกครั้ง');
          } else if (result.error.includes('password') || result.error.includes('รหัสผ่าน')) {
            toast.error('รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
          } else if (result.error.includes('Invalid credentials') || result.error.includes('Unauthorized')) {
            toast.error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
          } else {
            toast.error(result.error || 'เข้าสู่ระบบไม่สำเร็จ');
          }
        } else {
          toast.error('เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle different types of errors
      if (error.response?.status === 401) {
        toast.error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      } else if (error.response?.status === 404) {
        toast.error('ไม่พบบัญชีผู้ใช้นี้');
      } else if (error.response?.status === 429) {
        toast.error('พยายามเข้าสู่ระบบหลายครั้งเกินไป กรุณารอสักครู่');
      } else if (error.message?.includes('Network')) {
        toast.error('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
      } else {
        toast.error('เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง');
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading state during hydration
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-400/20 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-0 right-4 w-72 h-72 bg-purple-400/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-400/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-6 shadow-lg transform hover:scale-105 transition-all duration-300">
              <Hotel className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-3">
              ยินดีต้อนรับกลับ
            </h1>
            <p className="text-gray-600 text-lg">
              เข้าสู่ระบบเพื่อจองโรงแรมกับเรา
            </p>
          </div>

          {/* Test Accounts Info - Hidden for production 
          <div className="mb-6 p-4 bg-amber-50/80 backdrop-blur-sm rounded-2xl border border-amber-200">
            <div className="text-center mb-3">
              <h3 className="text-sm font-semibold text-amber-800 mb-2">🧪 บัญชีทดสอบ</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <button
                type="button"
                onClick={() => fillTestAccount('admin')}
                className="bg-white/70 p-3 rounded-lg border border-amber-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 cursor-pointer"
              >
                <div className="font-semibold text-blue-700 mb-1">👨‍💼 แอดมิน</div>
                <div className="text-gray-600">
                  <div>📧 admin@hotel.com</div>
                  <div>🔑 admin123</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => fillTestAccount('user')}
                className="bg-white/70 p-3 rounded-lg border border-amber-200 hover:bg-green-50 hover:border-green-300 transition-all duration-200 cursor-pointer"
              >
                <div className="font-semibold text-green-700 mb-1">👤 ลูกค้า</div>
                <div className="text-gray-600">
                  <div>📧 user@hotel.com</div>
                  <div>🔑 user123</div>
                </div>
              </button>
            </div>
            <div className="text-center mt-3">
              <p className="text-xs text-amber-700">
                💡 คลิกเพื่อใช้บัญชีทดสอบ
              </p>
            </div>
          </div>
          */}

          {/* Login Form */}
          <div className="relative">
            {/* Glass Card Background */}
            <div className="absolute inset-0 bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40"></div>
            
            <div className="relative p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Email Field */}
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                    อีเมล
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="block w-full pl-12 pr-4 py-4 bg-white/80 border-2 border-gray-200/60 rounded-2xl 
                               focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 
                               hover:border-gray-300 transition-all duration-200
                               text-gray-900 placeholder-gray-500 text-base"
                      placeholder="example@email.com"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                    รหัสผ่าน
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className="block w-full pl-12 pr-12 py-4 bg-white/80 border-2 border-gray-200/60 rounded-2xl 
                               focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 
                               hover:border-gray-300 transition-all duration-200
                               text-gray-900 placeholder-gray-500 text-base"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Remember & Forgot Password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={handleRememberMeChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors duration-200"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 font-medium">
                      จดจำการเข้าสู่ระบบ (30 วัน)
                    </label>
                  </div>
                  <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors">
                    ลืมรหัสผ่าน?
                  </Link>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center items-center py-4 px-4 border border-transparent text-base font-semibold rounded-2xl text-white 
                           bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 
                           focus:outline-none focus:ring-4 focus:ring-blue-500/50 
                           disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                           transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <span className="absolute left-0 inset-y-0 flex items-center pl-4">
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <CheckCircle className="h-5 w-5 text-white/80 group-hover:text-white transition-colors" />
                    )}
                  </span>
                  {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                  {!loading && (
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  )}
                </button>

              </form>

              {/* Divider */}
              <div className="my-8">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300/60"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white/70 text-gray-500 font-medium">หรือ</span>
                  </div>
                </div>
              </div>

              {/* Register Link */}
              <div className="text-center">
                <p className="text-gray-600 text-base">
                  ยังไม่มีบัญชี?{' '}
                  <Link 
                    href="/register" 
                    className="font-semibold text-blue-600 hover:text-purple-600 transition-colors duration-200 hover:underline"
                  >
                    สมัครสมาชิกที่นี่
                  </Link>
                </p>
              </div>

              {/* Test Accounts - Hidden for production 
              <div className="mt-6 text-center text-sm text-gray-500">
                <p>บัญชีทดสอบ:</p>
                <p>Admin: admin@hotel.com / admin123</p>
                <p>Customer: user@hotel.com / user123</p>
                <p>Staff: staff@hotel.com / staff123</p>
              </div>
              */}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              © 2025 Hotel Management System. All rights reserved.
            </p>
          </div>

        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
