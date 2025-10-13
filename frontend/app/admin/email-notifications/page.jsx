import React, { useState, useEffect } from 'react';
import { Bell, Mail, Settings, Users, BarChart, Send, AlertTriangle, CheckCircle } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const AdminEmailNotifications = () => {
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [adminList, setAdminList] = useState([]);
  const [settings, setSettings] = useState({
    dailySummaryEnabled: true,
    dailySummaryTime: '20:00',
    urgentAlertsEnabled: true,
    urgentAlertsThreshold: 5
  });
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchStatistics();
    fetchAdminList();
    fetchSettings();
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await api.get('/admin/email-notifications/statistics?days=7');
      if (response.data.success) {
        setStatistics(response.data.statistics);
      }
    } catch (error) {
      console.error('Error fetching email statistics:', error);
    }
  };

  const fetchAdminList = async () => {
    try {
      const response = await api.get('/admin/email-notifications/admin-list');
      if (response.data.success) {
        setAdminList(response.data.admins);
      }
    } catch (error) {
      console.error('Error fetching admin list:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await api.get('/admin/email-notifications/settings');
      if (response.data.success) {
        setSettings(response.data.settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSendDailySummary = async () => {
    setLoading(true);
    try {
      const response = await api.post('/admin/email-notifications/send-daily-summary');
      if (response.data.success) {
        toast.success(`✅ ${response.data.message}`);
      } else {
        toast.error('❌ ไม่สามารถส่งอีเมลสรุปประจำวันได้');
      }
    } catch (error) {
      console.error('Error sending daily summary:', error);
      toast.error('❌ เกิดข้อผิดพลาดในการส่งอีเมล');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckUrgentAlerts = async () => {
    setLoading(true);
    try {
      const response = await api.post('/admin/email-notifications/check-urgent-alerts');
      if (response.data.success) {
        toast.success('✅ ตรวจสอบการแจ้งเตือนด่วนเรียบร้อย');
      }
    } catch (error) {
      console.error('Error checking urgent alerts:', error);
      toast.error('❌ เกิดข้อผิดพลาดในการตรวจสอบ');
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async (type) => {
    setLoading(true);
    try {
      const response = await api.post('/admin/email-notifications/test-notification', { type });
      if (response.data.success) {
        toast.success(`✅ ส่งอีเมลทดสอบ ${type} สำเร็จ`);
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error('❌ ไม่สามารถส่งอีเมลทดสอบได้');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async () => {
    setLoading(true);
    try {
      const response = await api.put('/admin/email-notifications/settings', settings);
      if (response.data.success) {
        toast.success('✅ อัพเดตการตั้งค่าสำเร็จ');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('❌ ไม่สามารถอัพเดตการตั้งค่าได้');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'ภาพรวม', icon: BarChart },
    { id: 'settings', label: 'การตั้งค่า', icon: Settings },
    { id: 'admins', label: 'รายชื่อแอดมิน', icon: Users },
    { id: 'test', label: 'ทดสอบระบบ', icon: Send }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="bg-blue-100 p-3 rounded-xl">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ระบบแจ้งเตือนอีเมลแอดมิน</h1>
              <p className="text-gray-600">จัดการและติดตามการส่งอีเมลแจ้งเตือนให้แอดมิน</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'overview' && statistics && (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">การจองใหม่</p>
                    <p className="text-2xl font-bold text-gray-900">{statistics.bookings.total}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Bell className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">{statistics.period}</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">รอการยืนยัน</p>
                    <p className="text-2xl font-bold text-yellow-600">{statistics.bookings.pending}</p>
                  </div>
                  <div className="bg-yellow-100 p-3 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">ต้องการดำเนินการ</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">ยืนยันแล้ว</p>
                    <p className="text-2xl font-bold text-green-600">{statistics.bookings.confirmed}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">สำเร็จแล้ว</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">รายได้รวม</p>
                    <p className="text-2xl font-bold text-purple-600">
                      ฿{statistics.revenue.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <BarChart className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">จากการจองที่ยืนยัน</p>
              </div>
            </div>

            {/* Email Statistics */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">สถิติการส่งอีเมล (ประมาณการ)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {statistics.estimatedEmailsSent.newBookingNotifications}
                  </p>
                  <p className="text-sm text-gray-600">อีเมลแจ้งการจองใหม่</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {statistics.estimatedEmailsSent.paymentNotifications}
                  </p>
                  <p className="text-sm text-gray-600">อีเมลแจ้งการชำระเงิน</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">
                    {statistics.estimatedEmailsSent.cancellationNotifications}
                  </p>
                  <p className="text-sm text-gray-600">อีเมลแจ้งการยกเลิก</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">การดำเนินการด่วน</h3>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={handleSendDailySummary}
                  disabled={loading}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Mail className="h-4 w-4" />
                  <span>ส่งสรุปประจำวันทันที</span>
                </button>
                <button
                  onClick={handleCheckUrgentAlerts}
                  disabled={loading}
                  className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50"
                >
                  <AlertTriangle className="h-4 w-4" />
                  <span>ตรวจสอบการแจ้งเตือนด่วน</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">การตั้งค่าระบบแจ้งเตือน</h3>
            <div className="space-y-6">
              {/* Daily Summary Settings */}
              <div className="border-b border-gray-200 pb-6">
                <h4 className="font-medium text-gray-900 mb-4">อีเมลสรุปประจำวัน</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-700">เปิดใช้งานอีเมลสรุปประจำวัน</label>
                    <input
                      type="checkbox"
                      checked={settings.dailySummaryEnabled}
                      onChange={(e) => setSettings({...settings, dailySummaryEnabled: e.target.checked})}
                      className="rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">เวลาส่งอีเมล</label>
                    <input
                      type="time"
                      value={settings.dailySummaryTime}
                      onChange={(e) => setSettings({...settings, dailySummaryTime: e.target.value})}
                      className="border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
              </div>

              {/* Urgent Alerts Settings */}
              <div className="pb-6">
                <h4 className="font-medium text-gray-900 mb-4">การแจ้งเตือนด่วน</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-700">เปิดใช้งานการแจ้งเตือนด่วน</label>
                    <input
                      type="checkbox"
                      checked={settings.urgentAlertsEnabled}
                      onChange={(e) => setSettings({...settings, urgentAlertsEnabled: e.target.checked})}
                      className="rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">
                      จำนวนการจองที่จะแจ้งเตือน (ภายใน 1 ชั่วโมง)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={settings.urgentAlertsThreshold}
                      onChange={(e) => setSettings({...settings, urgentAlertsThreshold: parseInt(e.target.value)})}
                      className="border border-gray-300 rounded-lg px-3 py-2 w-24"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleUpdateSettings}
                disabled={loading}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                บันทึกการตั้งค่า
              </button>
            </div>
          </div>
        )}

        {activeTab === 'admins' && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              รายชื่อแอดมินที่จะได้รับการแจ้งเตือน ({adminList.length} คน)
            </h3>
            <div className="space-y-4">
              {adminList.map((admin) => (
                <div key={admin.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{admin.name}</p>
                      <p className="text-sm text-gray-600">{admin.email}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    สมัครเมื่อ {new Date(admin.createdAt).toLocaleDateString('th-TH')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'test' && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">ทดสอบการส่งอีเมลแจ้งเตือน</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">การจองใหม่</h4>
                <p className="text-sm text-gray-600 mb-4">ทดสอบอีเมลแจ้งเตือนการจองใหม่</p>
                <button
                  onClick={() => handleTestNotification('new_booking')}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  ส่งทดสอบ
                </button>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">การชำระเงิน</h4>
                <p className="text-sm text-gray-600 mb-4">ทดสอบอีเมลแจ้งเตือนการชำระเงิน</p>
                <button
                  onClick={() => handleTestNotification('payment_received')}
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  ส่งทดสอบ
                </button>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">การยกเลิก</h4>
                <p className="text-sm text-gray-600 mb-4">ทดสอบอีเมลแจ้งเตือนการยกเลิก</p>
                <button
                  onClick={() => handleTestNotification('booking_cancelled')}
                  disabled={loading}
                  className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  ส่งทดสอบ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminEmailNotifications;