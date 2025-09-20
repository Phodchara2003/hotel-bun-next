'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { isStaffOrAdmin } from '../../../lib/roles';
import { Phone, Mail, MapPin, Globe, Facebook, MessageCircle, Save, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function ContactSettingsPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [contactInfo, setContactInfo] = useState({
    phone: '',
    email: '',
    address: '',
    website: '',
    facebook: '',
    line: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Check authentication and permissions
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.replace('/login?redirect=/admin/contact-settings');
        return;
      }
      
      if (!isStaffOrAdmin(user)) {
        toast.error('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
        router.replace('/');
        return;
      }
    }
  }, [isAuthenticated, user, authLoading, router]);

  // Fetch current contact settings
  useEffect(() => {
    if (isAuthenticated && isStaffOrAdmin(user)) {
      fetchContactSettings();
    }
  }, [isAuthenticated, user]);

  const fetchContactSettings = async () => {
    try {
      setLoading(true);
      console.log('📞 Fetching contact settings...');
      
      const response = await fetch('/api/contact-settings');
      const data = await response.json();
      
      if (data.success) {
        setContactInfo(data.data);
        console.log('✅ Contact settings loaded:', data.data);
        setMessage({ type: '', text: '' });
      } else {
        throw new Error(data.message || 'Failed to fetch contact settings');
      }
    } catch (error) {
      console.error('❌ Error fetching contact settings:', error);
      toast.error('ไม่สามารถโหลดข้อมูลติดต่อได้: ' + error.message);
      setMessage({
        type: 'error',
        text: 'ไม่สามารถโหลดข้อมูลติดต่อได้'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setContactInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      console.log('💾 Saving contact settings:', contactInfo);
      
      const response = await fetch('/api/contact-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactInfo)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('บันทึกข้อมูลติดต่อเรียบร้อยแล้ว!');
        console.log('✅ Contact settings saved successfully');
        setMessage({
          type: 'success',
          text: 'บันทึกข้อมูลติดต่อเรียบร้อยแล้ว'
        });
      } else {
        throw new Error(data.message || 'Failed to save contact settings');
      }
    } catch (error) {
      console.error('Error saving contact settings:', error);
      setMessage({
        type: 'error',
        text: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล'
      });
    } finally {
      setSaving(false);
    }
  };

  // Show loading spinner while checking auth
  if (authLoading || (isAuthenticated && !isStaffOrAdmin(user))) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated or not admin/staff
  if (!isAuthenticated || !isStaffOrAdmin(user)) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <Link 
                  href="/admin/dashboard"
                  className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">จัดการข้อมูลติดต่อ</h1>
                  <p className="text-gray-600 mt-1">แก้ไขข้อมูลติดต่อที่แสดงในหน้าต่างๆ ของเว็บไซต์</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">กำลังโหลดข้อมูลติดต่อ...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link 
                href="/admin/dashboard"
                className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">จัดการข้อมูลติดต่อ</h1>
                <p className="text-gray-600 mt-1">แก้ไขข้อมูลติดต่อที่แสดงในหน้าต่างๆ ของเว็บไซต์</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">ข้อมูลติดต่อ</h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {/* Message Alert */}
            {message.text && (
              <div className={`mb-6 p-4 rounded-lg flex items-center ${
                message.type === 'success' 
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                <span>{message.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  เบอร์โทรศัพท์
                </label>
                <input
                  type="tel"
                  value={contactInfo.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="02-123-4567"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  อีเมล
                </label>
                <input
                  type="email"
                  value={contactInfo.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="support@hotel.com"
                />
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  ที่อยู่
                </label>
                <textarea
                  value={contactInfo.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="123 ถนนใหญ่ เขตกลาง กรุงเทพฯ 10100"
                />
              </div>

              {/* Website */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Globe className="w-4 h-4 inline mr-2" />
                  เว็บไซต์
                </label>
                <input
                  type="url"
                  value={contactInfo.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="www.hotel.com"
                />
              </div>

              {/* Facebook */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Facebook className="w-4 h-4 inline mr-2" />
                  Facebook
                </label>
                <input
                  type="text"
                  value={contactInfo.facebook}
                  onChange={(e) => handleInputChange('facebook', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="facebook.com/hotel"
                />
              </div>

              {/* LINE */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MessageCircle className="w-4 h-4 inline mr-2" />
                  LINE ID
                </label>
                <input
                  type="text"
                  value={contactInfo.line}
                  onChange={(e) => handleInputChange('line', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="@hotel"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className={`inline-flex items-center px-6 py-3 border border-transparent rounded-lg font-medium text-white ${
                  saving
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'
                } transition-colors`}
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}