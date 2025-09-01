'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, User, Phone, Hotel } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

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

    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast.error('รหัสผ่านไม่ตรงกัน');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      toast.error('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      setLoading(false);
      return;
    }

    try {
      const result = await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password
      });

      if (result.success) {
        router.push('/');
      }
    } catch (error) {
      console.error('Register error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-white/30 backdrop-blur-3xl"></div>
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'radial-gradient(circle at 25% 25%, #10b981 0%, transparent 50%), radial-gradient(circle at 75% 75%, #06b6d4 0%, transparent 50%)'
        }}
      ></div>
      
      <div className="relative max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-2xl blur-lg opacity-70"></div>
              <div className="relative bg-gradient-to-r from-emerald-600 to-cyan-600 p-4 rounded-2xl">
                <Hotel className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            สมัครสมาชิก
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            สร้างบัญชีใหม่เพื่อเริ่มจองโรงแรมกับเรา
          </p>
        </div>

        {/* Register Form */}
        <div className="relative">
          {/* Glass effect background */}
          <div className="absolute inset-0 bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20"></div>
          
          <div className="relative p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-1">
                    ชื่อ
                  </label>
                  <div className="relative group">
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 bg-white/90 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 group-hover:bg-white text-gray-900 placeholder-gray-500"
                      placeholder="ชื่อ"
                    />
                    <User className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 group-focus-within:text-emerald-500 transition-colors" />
                  </div>
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 mb-1">
                    นามสกุล
                  </label>
                  <div className="relative group">
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 bg-white/90 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 group-hover:bg-white text-gray-900 placeholder-gray-500"
                      placeholder="นามสกุล"
                    />
                    <User className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 group-focus-within:text-emerald-500 transition-colors" />
                  </div>
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
                  อีเมล
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
                    className="w-full pl-10 pr-4 py-3 bg-white/90 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 group-hover:bg-white text-gray-900 placeholder-gray-500"
                    placeholder="your@example.com"
                  />
                  <Mail className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 group-focus-within:text-emerald-500 transition-colors" />
                </div>
              </div>

              {/* Phone Field */}
              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1">
                  เบอร์โทรศัพท์
                </label>
                <div className="relative group">
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-white/90 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 group-hover:bg-white text-gray-900 placeholder-gray-500"
                    placeholder="08X-XXX-XXXX"
                  />
                  <Phone className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 group-focus-within:text-emerald-500 transition-colors" />
                </div>
              </div>

              {/* Password Fields */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1">
                  รหัสผ่าน
                </label>
                <div className="relative group">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-10 py-3 bg-white/90 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 group-hover:bg-white text-gray-900 placeholder-gray-500"
                    placeholder="••••••••"
                  />
                  <Lock className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 group-focus-within:text-emerald-500 transition-colors" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-1">
                  ยืนยันรหัสผ่าน
                </label>
                <div className="relative group">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-white/90 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 group-hover:bg-white text-gray-900 placeholder-gray-500"
                    placeholder="••••••••"
                  />
                  <Lock className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 group-focus-within:text-emerald-500 transition-colors" />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 text-white py-3 px-4 rounded-xl font-semibold text-lg 
                         hover:from-emerald-700 hover:to-cyan-700 transform hover:scale-[1.02] transition-all duration-200 
                         disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl
                         flex items-center justify-center mt-6"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'สมัครสมาชิก'
                )}
              </button>
            </form>

            {/* Footer Links */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                มีบัญชีอยู่แล้ว?{' '}
                <Link href="/login" className="text-emerald-600 hover:text-cyan-600 font-semibold transition-colors">
                  เข้าสู่ระบบ
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Terms Notice */}
        <div className="relative">
          <div className="absolute inset-0 bg-gray-500/10 backdrop-blur-xl rounded-xl border border-gray-200/30"></div>
          <div className="relative p-4 text-center">
            <p className="text-xs text-gray-600">
              การสมัครสมาชิกถือว่าคุณยอมรับ{' '}
              <Link href="/terms" className="text-emerald-600 hover:text-cyan-600 font-medium underline">
                เงื่อนไขการใช้งาน
              </Link>{' '}
              และ{' '}
              <Link href="/privacy" className="text-emerald-600 hover:text-cyan-600 font-medium underline">
                นโยบายความเป็นส่วนตัว
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
