'use client';

import { useState } from 'react';
import { Mail, Key, Shield, AlertTriangle, CheckCircle, Clock, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ChangeEmailModal({ isOpen, onClose, currentEmail }) {
  const [step, setStep] = useState(1); // 1: กรอกข้อมูล, 2: ยืนยันอีเมลเก่า, 3: ยืนยันอีเมลใหม่
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [formData, setFormData] = useState({
    newEmail: '',
    currentPassword: '',
    oldEmailOTP: '',
    newEmailOTP: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRequestChange = async () => {
    if (!formData.newEmail || !formData.currentPassword) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/request-email-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          newEmail: formData.newEmail,
          currentPassword: formData.currentPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('ส่งรหัสยืนยันแล้ว');
        setStep(2);
        setTimeLeft(900); // 15 นาที
        startCountdown();
      } else {
        toast.error(data.message || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error requesting email change:', error);
      toast.error('เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOldEmail = async () => {
    if (!formData.oldEmailOTP) {
      toast.error('กรุณากรอกรหัสยืนยัน');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/verify-old-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          otp: formData.oldEmailOTP
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('ยืนยันอีเมลเก่าสำเร็จ');
        setStep(3);
      } else {
        toast.error(data.message || 'รหัสยืนยันไม่ถูกต้อง');
      }
    } catch (error) {
      console.error('Error verifying old email:', error);
      toast.error('เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyNewEmail = async () => {
    if (!formData.newEmailOTP) {
      toast.error('กรุณากรอกรหัสยืนยัน');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/verify-new-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          otp: formData.newEmailOTP
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('เปลี่ยนอีเมลสำเร็จ');
        onClose();
        // Reload page to update user data
        window.location.reload();
      } else {
        toast.error(data.message || 'รหัสยืนยันไม่ถูกต้อง');
      }
    } catch (error) {
      console.error('Error verifying new email:', error);
      toast.error('เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const startCountdown = () => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Mail className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              เปลี่ยนอีเมล
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-6">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNumber 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step > stepNumber ? <CheckCircle className="w-5 h-5" /> : stepNumber}
                </div>
                {stepNumber < 3 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step > stepNumber ? 'bg-primary-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: กรอกข้อมูล */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">ข้อควรระวัง</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>การเปลี่ยนอีเมลต้องยืนยันทั้งอีเมลเก่าและใหม่</li>
                      <li>หลังเปลี่ยนแล้วต้องใช้อีเมลใหม่ในการเข้าสู่ระบบ</li>
                      <li>กระบวนการจะหมดอายุใน 15 นาที</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  อีเมลปัจจุบัน
                </label>
                <input
                  type="email"
                  value={currentEmail}
                  disabled
                  className="input-field bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  อีเมลใหม่ *
                </label>
                <input
                  type="email"
                  name="newEmail"
                  value={formData.newEmail}
                  onChange={handleInputChange}
                  placeholder="กรอกอีเมลใหม่"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  รหัสผ่านปัจจุบัน *
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  placeholder="กรอกรหัสผ่านเพื่อยืนยันตัวตน"
                  className="input-field"
                />
              </div>

              <button
                onClick={handleRequestChange}
                disabled={loading}
                className="w-full btn-primary flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    <span>ส่งรหัสยืนยัน</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Step 2: ยืนยันอีเมลเก่า */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <Mail className="w-12 h-12 text-primary-600 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  ยืนยันอีเมลเก่า
                </h3>
                <p className="text-sm text-gray-600">
                  เราได้ส่งรหัสยืนยันไปยัง <strong>{currentEmail}</strong>
                </p>
              </div>

              {timeLeft > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                  <Clock className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-sm text-blue-800">
                    เหลือเวลา: <strong>{formatTime(timeLeft)}</strong>
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  รหัสยืนยันจากอีเมลเก่า
                </label>
                <input
                  type="text"
                  name="oldEmailOTP"
                  value={formData.oldEmailOTP}
                  onChange={handleInputChange}
                  placeholder="กรอกรหัส 6 หลัก"
                  maxLength="6"
                  className="input-field text-center text-lg font-mono"
                />
              </div>

              <button
                onClick={handleVerifyOldEmail}
                disabled={loading}
                className="w-full btn-primary flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>ยืนยันอีเมลเก่า</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Step 3: ยืนยันอีเมลใหม่ */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <Mail className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  ยืนยันอีเมลใหม่
                </h3>
                <p className="text-sm text-gray-600">
                  เราได้ส่งรหัสยืนยันไปยัง <strong>{formData.newEmail}</strong>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  รหัสยืนยันจากอีเมลใหม่
                </label>
                <input
                  type="text"
                  name="newEmailOTP"
                  value={formData.newEmailOTP}
                  onChange={handleInputChange}
                  placeholder="กรอกรหัส 6 หลัก"
                  maxLength="6"
                  className="input-field text-center text-lg font-mono"
                />
              </div>

              <button
                onClick={handleVerifyNewEmail}
                disabled={loading}
                className="w-full btn-primary flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>ยืนยันและเปลี่ยนอีเมล</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Cancel Button */}
          {step > 1 && (
            <button
              onClick={onClose}
              className="w-full mt-3 btn-outline-secondary"
            >
              ยกเลิก
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
