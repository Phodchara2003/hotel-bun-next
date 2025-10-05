'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, Hotel, ArrowRight, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPageClient() {
  const router = useRouter();
  const { login, user, getRememberMePreference } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Load remember me preference and redirect if already logged in
  useEffect(() => {
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
      const credentials = {
        email: formData.email,
        password: formData.password
      };
      const result = await login(credentials, rememberMe);
      
      if (result.success) {
        if (result.user) {
          toast.success(`ยินดีต้อนรับ ${result.user.first_name || result.user.username || 'คุณ'}!`);
          // Redirect based on user role
          const userRole = result.user.role?.toLowerCase();
          if (userRole === 'admin' || userRole === 'staff' || userRole === 'manager') {
            router.push('/admin');
          } else {
            router.push('/');
          }
        } else {
          toast.success('เข้าสู่ระบบสำเร็จ!');
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
      
      // Handle network or other errors
      if (error.message) {
        if (error.message.includes('fetch')) {
          toast.error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
        } else if (error.message.includes('timeout')) {
          toast.error('การเชื่อมต่อหมดเวลา กรุณาลองใหม่อีกครั้ง');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error('เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{
      backgroundImage: 'url(/images/university-building.jpg), linear-gradient(135deg, #059669, #0891b2)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-72 h-72 bg-white/5 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-0 right-4 w-72 h-72 bg-white/5 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-white/5 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-600 to-green-600 rounded-2xl mb-6 shadow-lg transform hover:scale-105 transition-all duration-300">
              <Hotel className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-emerald-900 to-green-900 bg-clip-text text-transparent mb-3">
              ยินดีต้อนรับกลับ
            </h1>
            <p className="text-gray-600 text-lg">
              เข้าสู่ระบบเพื่อจองโรงแรมกับเรา
            </p>
          </div>

          {/* Login Form Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8 transform hover:scale-[1.02] transition-all duration-300">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  อีเมล
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-emerald-500 transition-colors" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border-2 border-gray-200 rounded-2xl focus:border-emerald-500 focus:bg-white transition-all duration-300 text-gray-900 placeholder-gray-500"
                    placeholder="กรอกอีเมลของคุณ"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  รหัสผ่าน
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-emerald-500 transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-12 py-4 bg-gray-50/50 border-2 border-gray-200 rounded-2xl focus:border-emerald-500 focus:bg-white transition-all duration-300 text-gray-900 placeholder-gray-500"
                    placeholder="กรอกรหัสผ่านของคุณ"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={handleRememberMeChange}
                      className="sr-only"
                      disabled={loading}
                    />
                    <div className={`w-5 h-5 rounded border-2 transition-all duration-200 ${
                      rememberMe 
                        ? 'bg-emerald-500 border-emerald-500' 
                        : 'bg-white border-gray-300 hover:border-emerald-400'
                    }`}>
                      {rememberMe && (
                        <CheckCircle className="w-5 h-5 text-white absolute inset-0" />
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-700">จดจำการเข้าสู่ระบบ</span>
                </label>
                
                <Link 
                  href="/forgot-password" 
                  className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors hover:underline"
                >
                  ลืมรหัสผ่าน?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold py-4 px-6 rounded-2xl hover:from-emerald-700 hover:to-green-700 transform hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>กำลังเข้าสู่ระบบ...</span>
                  </>
                ) : (
                  <>
                    <span>เข้าสู่ระบบ</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              {/* Sign Up Link */}
              <div className="text-center pt-4">
                <p className="text-gray-600">
                  ยังไม่มีบัญชี?{' '}
                  <Link 
                    href="/register" 
                    className="font-bold text-emerald-600 hover:text-emerald-700 transition-colors hover:underline"
                  >
                    สมัครสมาชิก
                  </Link>
                </p>
              </div>
            </form>
          </div>

          {/* Footer hidden per user request */}
          {/* <div className="text-center mt-8 space-y-2">
            <p className="text-gray-600 text-sm font-medium">
              ระบบจองโรงแรมวรุณภัฏมหาวิทยาลัยราชภัฏมหาสารคาม
            </p>
            <p className="text-gray-500 text-xs">
              พัฒนาโดย นาย พชร มีหา
            </p>
            <p className="text-gray-400 text-xs">
              © 2025 สงวนลิขสิทธิ์ทุกประการ
            </p>
          </div> */}
        </div>
      </div>
    </div>
  );
}