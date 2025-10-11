'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, User, Phone, Hotel, ArrowRight, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const { register, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

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
        toast.success('สมัครสมาชิกสำเร็จ!');
        router.push('/');
      }
    } catch (error) {
      console.error('Register error:', error);
      toast.error('สมัครสมาชิกไม่สำเร็จ');
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
      {/* Dark Overlay for better text visibility */}
      <div className="absolute inset-0 bg-black/40 z-0"></div>
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-72 h-72 bg-white/5 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-0 right-4 w-72 h-72 bg-white/5 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-white/5 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 mb-6 transform hover:scale-105 transition-all duration-300">
              <img 
                src="/assets/ตราสัญลักษณ์มหาวิทยาลัยราชภัฏมหาสารคาม.png" 
                alt="Logo มหาวิทยาลัยราชภัฏมหาสารคาม" 
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-4xl font-bold text-white mb-3 drop-shadow-lg">
              เริ่มต้นกับเรา
            </h1>
            <p className="text-gray-200 text-lg drop-shadow-md">
              สร้างบัญชีใหม่เพื่อเข้าสู่โลกของการจองโรงแรม
            </p>
          </div>

          {/* Register Form */}
          <div className="relative">
            {/* Glass Card Background */}
            <div className="absolute inset-0 bg-white/85 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50"></div>
            
            <div className="relative p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700">
                      ชื่อ
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors duration-200" />
                      </div>
                      <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="block w-full pl-12 pr-4 py-3 bg-white/80 border-2 border-gray-200/60 rounded-xl 
                                 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 
                                 hover:border-gray-300 transition-all duration-200
                                 text-gray-900 placeholder-gray-500 text-base"
                        placeholder="ชื่อ"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700">
                      นามสกุล
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors duration-200" />
                      </div>
                      <input
                        id="lastName"
                        name="lastName"
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="block w-full pl-12 pr-4 py-3 bg-white/80 border-2 border-gray-200/60 rounded-xl 
                                 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 
                                 hover:border-gray-300 transition-all duration-200
                                 text-gray-900 placeholder-gray-500 text-base"
                        placeholder="นามสกุล"
                      />
                    </div>
                  </div>
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                    อีเมล
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors duration-200" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="block w-full pl-12 pr-4 py-3 bg-white/80 border-2 border-gray-200/60 rounded-xl 
                               focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 
                               hover:border-gray-300 transition-all duration-200
                               text-gray-900 placeholder-gray-500 text-base"
                      placeholder="example@email.com"
                    />
                  </div>
                </div>

                {/* Phone Field */}
                <div className="space-y-2">
                  <label htmlFor="phone" className="block text-sm font-semibold text-gray-700">
                    เบอร์โทรศัพท์
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors duration-200" />
                    </div>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="block w-full pl-12 pr-4 py-3 bg-white/80 border-2 border-gray-200/60 rounded-xl 
                               focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 
                               hover:border-gray-300 transition-all duration-200
                               text-gray-900 placeholder-gray-500 text-base"
                      placeholder="08X-XXX-XXXX"
                    />
                  </div>
                </div>

                {/* Password Fields */}
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                    รหัสผ่าน
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors duration-200" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className="block w-full pl-12 pr-12 py-3 bg-white/80 border-2 border-gray-200/60 rounded-xl 
                               focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 
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

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700">
                    ยืนยันรหัสผ่าน
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors duration-200" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="block w-full pl-12 pr-12 py-3 bg-white/80 border-2 border-gray-200/60 rounded-xl 
                               focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 
                               hover:border-gray-300 transition-all duration-200
                               text-gray-900 placeholder-gray-500 text-base"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center items-center py-4 px-4 border border-transparent text-base font-semibold rounded-2xl text-white 
                           bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 
                           focus:outline-none focus:ring-4 focus:ring-emerald-500/50 
                           disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                           transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <span className="absolute left-0 inset-y-0 flex items-center pl-4">
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <UserPlus className="h-5 w-5 text-white/80 group-hover:text-white transition-colors" />
                    )}
                  </span>
                  {loading ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก'}
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

              {/* Login Link */}
              <div className="text-center">
                <p className="text-gray-700 text-base font-medium">
                  มีบัญชีอยู่แล้ว?{' '}
                  <Link 
                    href="/login" 
                    className="font-semibold text-emerald-700 hover:text-green-700 transition-colors duration-200 hover:underline"
                  >
                    เข้าสู่ระบบที่นี่
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Footer hidden per user request */}
          {/* <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              © 2025 Hotel Management System. All rights reserved.
            </p>
          </div> */}

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
