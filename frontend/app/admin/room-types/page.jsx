'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { isStaffOrAdmin } from '../../../lib/permissions';
import { 
  Building, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  DollarSign,
  Hotel,
  ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function RoomTypesPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, getAuthToken } = useAuth();
  
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isStaffOrAdmin(user))) {
      router.push('/login');
      return;
    }
    
    if (isAuthenticated && isStaffOrAdmin(user)) {
      fetchRoomTypes();
    }
  }, [authLoading, isAuthenticated, user, router]);

  const fetchRoomTypes = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const response = await fetch('http://localhost:5680/api/room-types', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRoomTypes(data.roomTypes || []);
      } else {
        toast.error('ไม่สามารถโหลดข้อมูลประเภทห้องพักได้');
      }
    } catch (error) {
      console.error('Error fetching room types:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/admin/rooms" className="text-gray-600 hover:text-gray-800">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">ประเภทห้องพัก</h1>
                <p className="text-gray-600">จัดการประเภทห้องพักและราคา</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/admin/individual-rooms" className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                <Hotel className="h-4 w-4" />
                ห้องพักย่อย
              </Link>
            </div>
          </div>
        </div>

        {/* Room Types Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roomTypes.map(roomType => (
            <div key={roomType.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">{roomType.name}</h3>
                    <p className="text-sm opacity-90">{roomType.description}</p>
                  </div>
                  <Building className="h-8 w-8 opacity-80" />
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">สูงสุด {roomType.max_occupancy} คน</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-600 font-bold">
                    <DollarSign className="h-4 w-4" />
                    <span>{roomType.price_per_night?.toLocaleString()} บาท/คืน</span>
                  </div>
                </div>

                {roomType.amenities && (
                  <div className="text-sm text-gray-600">
                    <strong>สิ่งอำนวยความสะดวก:</strong> {roomType.amenities}
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <button className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                    <Edit className="h-4 w-4" />
                    แก้ไข
                  </button>
                  <button className="bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {roomTypes.length === 0 && !loading && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่พบประเภทห้องพัก</h3>
            <p className="text-gray-600 mb-6">ไม่มีประเภทห้องพักในระบบ</p>
          </div>
        )}

      </div>
    </div>
  );
}