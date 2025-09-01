'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useTranslation } from '../../../translations';
import { isStaffOrAdmin, canEdit } from '../../../lib/roles';
import { Package, Plus, Edit3, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function InventoryManagement() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add');
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    currentStock: 0,
    minimumStock: 0,
    unit: '',
    location: '',
    cost: 0
  });

  const categories = [
    { value: 'linens', label: 'ผ้าปูที่นอน/หมอน' },
    { value: 'towels', label: 'ผ้าเช็ดตัว' },
    { value: 'toiletries', label: 'เครื่องใช้ในห้องน้ำ' },
    { value: 'cleaning', label: 'อุปกรณ์ทำความสะอาด' },
    { value: 'amenities', label: 'สิ่งอำนวยความสะดวก' },
    { value: 'maintenance', label: 'อุปกรณ์ซ่อมบำรุง' }
  ];

  const units = [
    { value: 'pieces', label: 'ชิ้น' },
    { value: 'sets', label: 'ชุด' },
    { value: 'bottles', label: 'ขวด' },
    { value: 'boxes', label: 'กล่อง' },
    { value: 'rolls', label: 'ม้วน' }
  ];

  useEffect(() => {
    if (isAuthenticated && isStaffOrAdmin(user)) {
      loadInventory();
    }
  }, [isAuthenticated, user]);

  const loadInventory = async () => {
    try {
      // Mock data for now - จะเชื่อมต่อ API ภายหลัง
      const mockData = [
        {
          id: 1,
          name: 'ผ้าปูที่นอนสีขาว',
          category: 'linens',
          currentStock: 45,
          minimumStock: 20,
          unit: 'sets',
          location: 'คลังชั้น 2',
          cost: 350,
          lastUpdated: '2025-08-25'
        },
        {
          id: 2,
          name: 'ผ้าเช็ดตัวขนาดใหญ่',
          category: 'towels',
          currentStock: 15,
          minimumStock: 25,
          unit: 'pieces',
          location: 'คลังชั้น 2',
          cost: 120,
          lastUpdated: '2025-08-24'
        },
        {
          id: 3,
          name: 'แชมพู',
          category: 'toiletries',
          currentStock: 30,
          minimumStock: 15,
          unit: 'bottles',
          location: 'คลังชั้น 1',
          cost: 45,
          lastUpdated: '2025-08-25'
        }
      ];
      
      setInventory(mockData);
    } catch (error) {
      toast.error('ไม่สามารถโหลดข้อมูลสต็อกได้');
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (current, minimum) => {
    if (current <= 0) return 'out';
    if (current <= minimum) return 'low';
    return 'good';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'out':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'low':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
  };

  const getCategoryLabel = (category) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.label : category;
  };

  const getUnitLabel = (unit) => {
    const u = units.find(un => un.value === unit);
    return u ? u.label : unit;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">กำลังโหลดข้อมูลสต็อก...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isStaffOrAdmin(user)) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">ไม่มีสิทธิ์เข้าถึง</h2>
          <p className="text-gray-600 dark:text-gray-400">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <Package className="h-8 w-8 mr-3 text-primary-600" />
                จัดการคลังสินค้า
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                ตรวจสอบและจัดการสต็อกสินค้าในโรงแรม
              </p>
            </div>
            {canEdit(user) && (
              <button
                onClick={() => {
                  setModalType('add');
                  setSelectedItem(null);
                  setFormData({
                    name: '',
                    category: '',
                    currentStock: 0,
                    minimumStock: 0,
                    unit: '',
                    location: '',
                    cost: 0
                  });
                  setShowModal(true);
                }}
                className="btn-primary flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                เพิ่มสินค้า
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">สินค้าปกติ</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {inventory.filter(item => getStockStatus(item.currentStock, item.minimumStock) === 'good').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">สินค้าใกล้หมด</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {inventory.filter(item => getStockStatus(item.currentStock, item.minimumStock) === 'low').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">สินค้าหมด</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {inventory.filter(item => getStockStatus(item.currentStock, item.minimumStock) === 'out').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">รายการสินค้า</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    สินค้า
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    หมวดหมู่
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    สต็อก
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    สถานที่
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    ต้นทุน
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    สถานะ
                  </th>
                  {canEdit(user) && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      การจัดการ
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {inventory.map((item) => {
                  const status = getStockStatus(item.currentStock, item.minimumStock);
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            อัพเดทล่าสุด: {item.lastUpdated}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {getCategoryLabel(item.category)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {item.currentStock} {getUnitLabel(item.unit)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          ขั้นต่ำ: {item.minimumStock}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {item.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        ฿{item.cost.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(status)}
                          <span className={`ml-2 text-sm ${
                            status === 'out' ? 'text-red-600' :
                            status === 'low' ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {status === 'out' ? 'หมดสต็อก' :
                             status === 'low' ? 'ใกล้หมด' :
                             'ปกติ'}
                          </span>
                        </div>
                      </td>
                      {canEdit(user) && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => {
                              setModalType('edit');
                              setSelectedItem(item);
                              setFormData(item);
                              setShowModal(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('คุณต้องการลบสินค้านี้หรือไม่?')) {
                                setInventory(inventory.filter(i => i.id !== item.id));
                                toast.success('ลบสินค้าเรียบร้อยแล้ว');
                              }
                            }}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
