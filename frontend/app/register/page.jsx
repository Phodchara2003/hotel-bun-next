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
    <div className="h-screen relative overflow-hidden flex items-center justify-center" style={{
      backgroundImage: 'url(/images/university-building.jpg), linear-gradient(135deg, #059669, #0891b2)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
      minHeight: '100vh'
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
      <div className="relative z-10 w-full max-w-lg mx-auto px-6">
        <div className="w-full">
          
          {/* Header Section */}
          <div className="text-center mb-4">
            <div className="inline-flex items-center justify-center w-12 h-12 mb-3 transform hover:scale-105 transition-all duration-300">
              <img 
                src="/assets/ตราสัญลักษณ์มหาวิทยาลัยราชภัฏมหาสารคาม.png" 
                alt="Logo มหาวิทยาลัยราชภัฏมหาสารคาม" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Register Form */}
          <div className="relative">
            {/* Enhanced Glass Card Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-white/85 to-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 ring-1 ring-white/20"></div>
            
            <div className="relative p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="firstName" className="block text-sm font-bold text-gray-800">
                      ชื่อ
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-emerald-500 group-focus-within:text-emerald-600 transition-colors duration-200" />
                      </div>
                      <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="block w-full pl-10 pr-4 py-3 bg-gradient-to-r from-white to-emerald-50/50 border-2 border-emerald-200/60 rounded-xl 
                                 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 
                                 hover:border-emerald-300 hover:shadow-md transition-all duration-200
                                 text-gray-900 placeholder-gray-500 text-sm font-medium shadow-sm"
                        placeholder="ชื่อ"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="lastName" className="block text-sm font-bold text-gray-800">
                      นามสกุล
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-emerald-500 group-focus-within:text-emerald-600 transition-colors duration-200" />
                      </div>
                      <input
                        id="lastName"
                        name="lastName"
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="block w-full pl-10 pr-4 py-3 bg-gradient-to-r from-white to-emerald-50/50 border-2 border-emerald-200/60 rounded-xl 
                                 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 
                                 hover:border-emerald-300 hover:shadow-md transition-all duration-200
                                 text-gray-900 placeholder-gray-500 text-sm font-medium shadow-sm"
                        placeholder="นามสกุล"
                      />
                    </div>
                  </div>
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-bold text-gray-800">
                    อีเมล
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-emerald-500 group-focus-within:text-emerald-600 transition-colors duration-200" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-4 py-3 bg-gradient-to-r from-white to-emerald-50/50 border-2 border-emerald-200/60 rounded-xl 
                               focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 
                               hover:border-emerald-300 hover:shadow-md transition-all duration-200
                               text-gray-900 placeholder-gray-500 text-sm font-medium shadow-sm"
                      placeholder="example@email.com"
                    />
                  </div>
                </div>

                {/* Phone Field */}
                <div className="space-y-2">
                  <label htmlFor="phone" className="block text-sm font-bold text-gray-800">
                    เบอร์โทรศัพท์
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-4 w-4 text-emerald-500 group-focus-within:text-emerald-600 transition-colors duration-200" />
                    </div>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-4 py-3 bg-gradient-to-r from-white to-emerald-50/50 border-2 border-emerald-200/60 rounded-xl 
                               focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 
                               hover:border-emerald-300 hover:shadow-md transition-all duration-200
                               text-gray-900 placeholder-gray-500 text-sm font-medium shadow-sm"
                      placeholder="08X-XXX-XXXX"
                    />
                  </div>
                </div>

                {/* Password Fields */}
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-bold text-gray-800">
                    รหัสผ่าน
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-emerald-500 group-focus-within:text-emerald-600 transition-colors duration-200" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-10 py-3 bg-gradient-to-r from-white to-emerald-50/50 border-2 border-emerald-200/60 rounded-xl 
                               focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 
                               hover:border-emerald-300 hover:shadow-md transition-all duration-200
                               text-gray-900 placeholder-gray-500 text-sm font-medium shadow-sm"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-emerald-500 hover:text-emerald-600 transition-colors duration-200"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="block text-sm font-bold text-gray-800">
                    ยืนยันรหัสผ่าน
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-emerald-500 group-focus-within:text-emerald-600 transition-colors duration-200" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-10 py-3 bg-gradient-to-r from-white to-emerald-50/50 border-2 border-emerald-200/60 rounded-xl 
                               focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 
                               hover:border-emerald-300 hover:shadow-md transition-all duration-200
                               text-gray-900 placeholder-gray-500 text-sm font-medium shadow-sm"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-emerald-500 hover:text-emerald-600 transition-colors duration-200"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center items-center py-4 px-6 border border-transparent text-sm font-bold rounded-2xl text-white 
                           bg-gradient-to-r from-emerald-600 via-emerald-700 to-green-600 hover:from-emerald-700 hover:via-emerald-800 hover:to-green-700 
                           focus:outline-none focus:ring-4 focus:ring-emerald-500/50 
                           disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                           transform hover:scale-[1.02] transition-all duration-200 shadow-xl hover:shadow-2xl
                           overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/0 before:via-white/10 before:to-white/0 before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700"
                >
                  <span className="flex items-center justify-center">
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    ) : (
                      <UserPlus className="h-5 w-5 text-white mr-2" />
                    )}
                    {loading ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก'}
                  </span>
                </button>

              </form>

              {/* Divider */}
              <div className="my-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-emerald-200/60"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-6 bg-gradient-to-r from-white/90 to-emerald-50/80 text-emerald-700 font-semibold rounded-full shadow-sm">หรือ</span>
                  </div>
                </div>
              </div>

              {/* Login Link */}
              <div className="text-center">
                <div className="bg-gradient-to-r from-emerald-50/50 to-green-50/50 p-4 rounded-2xl border border-emerald-200/30">
                  <p className="text-gray-800 text-sm font-medium">
                    มีบัญชีอยู่แล้ว?{' '}
                    <Link 
                      href="/login" 
                      className="font-bold text-emerald-700 hover:text-emerald-800 transition-all duration-200 hover:underline decoration-2 underline-offset-2"
                    >
                      เข้าสู่ระบบที่นี่
                    </Link>
                  </p>
                </div>
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
