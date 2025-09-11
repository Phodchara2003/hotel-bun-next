'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Hotel } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setEmailSent(true);
        toast.success('อีเมลรีเซ็ตรหัสผ่านได้ถูกส่งแล้ว!');
      } else {
        toast.error(data.message || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error('เกิดข้อผิดพลาดในการส่งอีเมล');
    } finally {
      setLoading(false);
    }
  };

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
          
          {/* Back to Login Link */}
          <div className="mb-6">
            <Link 
              href="/login"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              กลับไปหน้าเข้าสู่ระบบ
            </Link>
          </div>

          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-6 shadow-lg transform hover:scale-105 transition-all duration-300">
              <Hotel className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-3">
              {emailSent ? 'ตรวจสอบอีเมลของคุณ' : 'ลืมรหัสผ่าน?'}
            </h1>
            <p className="text-gray-600 text-base">
              {emailSent 
                ? 'เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว'
                : 'กรุณากรอกอีเมลของคุณ เราจะส่งลิงก์รีเซ็ตรหัสผ่านให้'
              }
            </p>
          </div>

          {/* Content */}
          <div className="relative">
            {/* Glass Card Background */}
            <div className="absolute inset-0 bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40"></div>
            
            <div className="relative p-8">
              {!emailSent ? (
                // Forgot Password Form
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
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full pl-12 pr-4 py-4 bg-white/80 border-2 border-gray-200/60 rounded-2xl 
                                 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 
                                 hover:border-gray-300 transition-all duration-200
                                 text-gray-900 placeholder-gray-500 text-base"
                        placeholder="example@email.com"
                      />
                    </div>
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
                        <Mail className="h-5 w-5 text-white/80 group-hover:text-white transition-colors" />
                      )}
                    </span>
                    {loading ? 'กำลังส่งอีเมล...' : 'ส่งลิงก์รีเซ็ตรหัสผ่าน'}
                  </button>

                </form>
              ) : (
                // Email Sent Success Message
                <div className="text-center space-y-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  
                  <div className="space-y-3">
                    <p className="text-gray-700 text-base">
                      เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปยัง:
                    </p>
                    <p className="text-blue-600 font-semibold text-lg">{email}</p>
                    <p className="text-sm text-gray-500">
                      กรุณาตรวจสอบกล่องขาเข้าและสแปมของคุณ
                    </p>
                  </div>

                  {/* Resend Email */}
                  <div className="pt-4 border-t border-gray-200/60">
                    <p className="text-sm text-gray-600 mb-3">
                      ไม่ได้รับอีเมล?
                    </p>
                    <button
                      onClick={() => {
                        setEmailSent(false);
                        setEmail('');
                      }}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors underline"
                    >
                      ส่งอีเมลใหม่อีกครั้ง
                    </button>
                  </div>

                  {/* Back to Login */}
                  <Link
                    href="/login"
                    className="inline-block w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-2xl transition-colors duration-200 text-center"
                  >
                    กลับไปหน้าเข้าสู่ระบบ
                  </Link>
                </div>
              )}

              {/* Help Text */}
              {!emailSent && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">หมายเหตุ:</p>
                      <ul className="list-disc list-inside space-y-1 text-blue-700">
                        <li>ลิงก์รีเซ็ตรหัสผ่านจะหมดอายุในเวลา 15 นาที</li>
                        <li>หากไม่พบอีเมลในกล่องขาเข้า กรุณาตรวจสอบโฟลเดอร์สแปม</li>
                        <li>สำหรับความปลอดภัย ลิงก์สามารถใช้ได้เพียงครั้งเดียว</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              ยังจำรหัสผ่านได้?{' '}
              <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium transition-colors">
                เข้าสู่ระบบที่นี่
              </Link>
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
