'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Shield, Calendar, Edit, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: ''
  });
  const [saving, setSaving] = useState(false);

  // ตรวจสอบว่าข้อมูลมีการเปลี่ยนแปลงหรือไม่
  const hasChanges = user && (
    formData.firstName !== (user.firstName || '') ||
    formData.lastName !== (user.lastName || '') ||
    formData.phone !== (user.phone || '') ||
    formData.bio !== (user.bio || user.address || '')
  );

  useEffect(() => {
    fetchProfile();
  }, []);

  // อัปเดต formData เมื่อข้อมูล user เปลี่ยน - แสดงข้อมูลจริงในฟิลด์
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || user.address || '' // รองรับทั้ง bio และ address
      });
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      // Try multiple sources for token
      let token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      
      // If no token in localStorage, try cookies
      if (!token && typeof document !== 'undefined') {
        const cookies = document.cookie.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=');
          acc[key] = value;
          return acc;
        }, {});
        token = cookies.auth_token;
      }
      
      console.log('Profile page - Token found:', token ? 'Yes' : 'No');
      
      if (!token) {
        console.log('No token found, redirecting to login');
        router.push('/login');
        return;
      }

      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const userData = data.profile || data;
        console.log('Profile data loaded:', userData);
        setUser(userData);
        // แสดงข้อมูลจริงในฟิลด์ทันที
        setFormData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          phone: userData.phone || '',
          bio: userData.bio || userData.address || ''
        });
      } else if (response.status === 401) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validate phone number - เช็คว่ามี 10 หลัก (ถ้ากรอก)
    if (formData.phone && formData.phone.length !== 10) {
      toast.error('เบอร์โทรศัพท์ต้องมี 10 หลัก');
      return;
    }

    setSaving(true);
    try {
      // Try multiple sources for token
      let token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      
      // If no token in localStorage, try cookies
      if (!token && typeof document !== 'undefined') {
        const cookies = document.cookie.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=');
          acc[key] = value;
          return acc;
        }, {});
        token = cookies.auth_token;
      }
      // แปลงชื่อฟิลด์ให้ตรงกับ Backend
      const updateData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        address: formData.bio, // ใช้ address แทน bio เพื่อให้ตรงกับ Backend
        username: formData.username || ''
      };

      console.log('Sending update data:', updateData);

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const data = await response.json();
        const updatedUser = data.profile || data;
        setUser(updatedUser);
        
        console.log('Profile updated successfully:', updatedUser);
        
        // อัปเดต formData ด้วยข้อมูลใหม่
        setFormData({
          firstName: updatedUser.firstName || '',
          lastName: updatedUser.lastName || '',
          email: updatedUser.email || '',
          phone: updatedUser.phone || '',
          bio: updatedUser.bio || updatedUser.address || ''
        });
        
        alert('อัปเดตโปรไฟล์สำเร็จ!');
      } else {
        const errorText = await response.text();
        console.error('Profile update failed:', response.status, errorText);
        alert('ไม่สามารถอัปเดตโปรไฟล์ได้: ' + errorText);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    // รีเซ็ตข้อมูลกลับเป็นข้อมูลเดิมจากฐานข้อมูล
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || user.address || ''
      });
      alert('รีเซ็ตข้อมูลเรียบร้อยแล้ว');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">โปรไฟล์ผู้ดูแลระบบ</h1>
                <p className="text-gray-800">จัดการข้อมูลบัญชีของคุณ</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleSave}
                  disabled={saving || !hasChanges}
                  className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${
                    hasChanges && !saving
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-400 text-white cursor-not-allowed'
                  }`}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'กำลังบันทึก...' : hasChanges ? 'บันทึกการเปลี่ยนแปลง' : 'ไม่มีการเปลี่ยนแปลง'}
                </button>
                <button
                  onClick={handleReset}
                  disabled={!hasChanges}
                  className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${
                    hasChanges
                      ? 'bg-gray-600 text-white hover:bg-gray-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <X className="w-4 h-4 mr-2" />
                  รีเซ็ตข้อมูล
                </button>
              </div>
              
              {hasChanges && (
                <div className="mt-2 text-sm text-orange-600 flex items-center">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-2 animate-pulse"></span>
                  มีการเปลี่ยนแปลงข้อมูลที่ยังไม่ได้บันทึก
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-6">
            {/* Profile Avatar และข้อมูลปัจจุบัน */}
            <div className="flex items-center mb-8">
              <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-12 h-12 text-white" />
              </div>
              <div className="ml-6 flex-1">
                <h2 className="text-xl font-semibold text-gray-900">
                  {user?.firstName || 'ผู้ดูแล'} {user?.lastName || 'ระบบ'}
                </h2>
                <p className="text-gray-600 flex items-center">
                  <Shield className="w-4 h-4 mr-1" />
                  ผู้ดูแลระบบ
                </p>
                <p className="text-gray-500 flex items-center mt-1">
                  <Mail className="w-4 h-4 mr-1" />
                  {user?.email}
                </p>
                {user?.phone && (
                  <p className="text-gray-500 text-sm mt-1">📱 {user.phone}</p>
                )}
              </div>
            </div>



            {/* ส่วนแก้ไขข้อมูล */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Edit className="w-5 h-5 mr-2 text-green-600" />
                แก้ไขข้อมูลโปรไฟล์
              </h3>
            </div>

            {/* Profile Form - แสดงฟิลด์แก้ไขได้เสมอ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  ชื่อ
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white text-black"
                  placeholder={user?.firstName ? "แก้ไขชื่อของคุณ" : "กรอกชื่อของคุณ"}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  นามสกุล
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white text-black"
                  placeholder={user?.lastName ? "แก้ไขนามสกุลของคุณ" : "กรอกนามสกุลของคุณ"}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  อีเมล
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  readOnly
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-600 cursor-not-allowed"
                  title="อีเมลไม่สามารถเปลี่ยนแปลงได้"
                />
                <p className="text-xs text-gray-500 mt-1">ไม่สามารถเปลี่ยนแปลงได้</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  เบอร์โทรศัพท์
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    const phoneValue = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setFormData({ ...formData, phone: phoneValue });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white text-black"
                  placeholder=""
                  maxLength={10}
                  pattern="[0-9]{10}"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  รายละเอียดเพิ่มเติม
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white text-black"
                  placeholder={user?.bio || user?.address ? "แก้ไขรายละเอียดเพิ่มเติม" : "เล่าเกี่ยวกับตัวคุณ หรือข้อมูลเพิ่มเติม..."}
                />
              </div>
            </div>

            {/* Account Info */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลบัญชี</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    วันที่สร้างบัญชี
                  </label>
                  <p className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('th-TH') : 'ไม่ทราบ'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    บทบาท
                  </label>
                  <p className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center text-blue-800">
                    <Shield className="w-4 h-4 mr-2" />
                    ผู้ดูแลระบบ
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
