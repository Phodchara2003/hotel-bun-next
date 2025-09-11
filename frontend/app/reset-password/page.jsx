'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, Eye, EyeOff, CheckCircle, AlertTriangle, Hotel, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Password strength validation
  const getPasswordStrength = (password) => {
    if (password.length < 6) return { level: 0, text: 'รหัสผ่านสั้นเกินไป', color: 'text-red-500' };
    if (password.length < 8) return { level: 1, text: 'รหัสผ่านอ่อน', color: 'text-orange-500' };
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) return { level: 2, text: 'รหัสผ่านปานกลาง', color: 'text-yellow-500' };
    return { level: 3, text: 'รหัสผ่านแข็งแกร่ง', color: 'text-green-500' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  // Verify token on component mount
  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await fetch(`/api/auth/verify-reset-token?token=${token}`);
        const data = await response.json();
        
        if (response.ok) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
          toast.error(data.message || 'Token ไม่ถูกต้องหรือหมดอายุ');
        }
      } catch (error) {
        console.error('Token verification error:', error);
        setTokenValid(false);
        toast.error('เกิดข้อผิดพลาดในการตรวจสอบ token');
      }
    };

    verifyToken();
  }, [token]);

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
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResetSuccess(true);
        toast.success('รีเซ็ตรหัสผ่านสำเร็จ!');
      } else {
        toast.error(data.message || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error('เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน');
    } finally {
      setLoading(false);
    }
  };

  // Invalid token page
  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="relative">
            <div className="absolute inset-0 bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40"></div>
            <div className="relative p-8 text-center">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-3">ลิงก์ไม่ถูกต้อง</h1>
              <p className="text-gray-600 mb-6">
                ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว
              </p>
              <Link
                href="/forgot-password"
                className="inline-block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-2xl transition-colors duration-200"
              >
                ขอลิงก์ใหม่
              </Link>
              <Link
                href="/login"
                className="inline-block w-full py-3 px-4 mt-3 text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
              >
                กลับไปหน้าเข้าสู่ระบบ
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading token verification
  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="relative">
            <div className="absolute inset-0 bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40"></div>
            <div className="relative p-8 text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">กำลังตรวจสอบลิงก์...</p>
            </div>
          </div>
        </div>
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
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-3">
              {resetSuccess ? 'รีเซ็ตรหัสผ่านสำเร็จ!' : 'ตั้งรหัสผ่านใหม่'}
            </h1>
            <p className="text-gray-600 text-base">
              {resetSuccess 
                ? 'คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้แล้ว'
                : 'กรุณากรอกรหัสผ่านใหม่ของคุณ'
              }
            </p>
          </div>

          {/* Content */}
          <div className="relative">
            {/* Glass Card Background */}
            <div className="absolute inset-0 bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40"></div>
            
            <div className="relative p-8">
              {!resetSuccess ? (
                // Reset Password Form
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  {/* Password Field */}
                  <div className="space-y-2">
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                      รหัสผ่านใหม่
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
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
                    
                    {/* Password Strength Indicator */}
                    {formData.password && (
                      <div className="mt-2">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                passwordStrength.level === 0 ? 'w-1/4 bg-red-500' :
                                passwordStrength.level === 1 ? 'w-2/4 bg-orange-500' :
                                passwordStrength.level === 2 ? 'w-3/4 bg-yellow-500' :
                                'w-full bg-green-500'
                              }`}
                            ></div>
                          </div>
                          <span className={`text-xs font-medium ${passwordStrength.color}`}>
                            {passwordStrength.text}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700">
                      ยืนยันรหัสผ่านใหม่
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                      </div>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="block w-full pl-12 pr-12 py-4 bg-white/80 border-2 border-gray-200/60 rounded-2xl 
                                 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 
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
                    
                    {/* Password Match Indicator */}
                    {formData.confirmPassword && (
                      <div className="mt-2">
                        {formData.password === formData.confirmPassword ? (
                          <div className="flex items-center text-green-600 text-sm">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            รหัสผ่านตรงกัน
                          </div>
                        ) : (
                          <div className="flex items-center text-red-600 text-sm">
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            รหัสผ่านไม่ตรงกัน
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading || formData.password !== formData.confirmPassword || formData.password.length < 6}
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
                        <Shield className="h-5 w-5 text-white/80 group-hover:text-white transition-colors" />
                      )}
                    </span>
                    {loading ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่'}
                  </button>

                </form>
              ) : (
                // Success Message
                <div className="text-center space-y-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold text-gray-900">
                      รีเซ็ตรหัสผ่านเรียบร้อย!
                    </h3>
                    <p className="text-gray-600 text-base">
                      รหัสผ่านของคุณได้ถูกเปลี่ยนแปลงเรียบร้อยแล้ว<br />
                      คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที
                    </p>
                  </div>

                  {/* Login Button */}
                  <Link
                    href="/login"
                    className="inline-block w-full py-4 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-2xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                  >
                    เข้าสู่ระบบ
                  </Link>
                </div>
              )}

              {/* Security Tips */}
              {!resetSuccess && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-start">
                    <Shield className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">เคล็ดลับรหัสผ่านที่ปลอดภัย:</p>
                      <ul className="list-disc list-inside space-y-1 text-blue-700">
                        <li>ใช้รหัสผ่านยาวอย่างน้อย 8 ตัวอักษร</li>
                        <li>ผสมตัวพิมพ์ใหญ่ พิมพ์เล็ก และตัวเลข</li>
                        <li>หลีกเลี่ยงข้อมูลส่วนตัวที่เดาได้ง่าย</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
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
