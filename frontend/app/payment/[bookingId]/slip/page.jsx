'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { bookingAPI } from '../../../lib/api';
import toast from 'react-hot-toast';

export default function PaymentSlipPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [slipFile, setSlipFile] = useState(null);
  const [slipPreview, setSlipPreview] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchBooking();
  }, [isAuthenticated, params.bookingId]);

  const fetchBooking = async () => {
    try {
      const data = await bookingAPI.getBookingById(params.bookingId);
      setBooking(data);
    } catch (error) {
      console.error('Error fetching booking:', error);
      toast.error('ไม่สามารถโหลดข้อมูลการจองได้');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('ขนาดไฟล์ต้องไม่เกิน 5MB');
      return;
    }

    setSlipFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setSlipPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSlipUpload = async () => {
    if (!slipFile) {
      toast.error('กรุณาเลือกไฟล์สลิปการโอนเงิน');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('slip', slipFile);
      formData.append('bookingId', params.bookingId);

      const response = await fetch(`http://localhost:3001/api/bookings/${params.bookingId}/upload-slip`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('การอัพโหลดล้มเหลว');
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success('อัพโหลดสลิปเรียบร้อยแล้ว กรุณารอการยืนยันจากเจ้าหน้าที่');
        router.push('/bookings');
      } else {
        throw new Error(result.message || 'การอัพโหลดล้มเหลว');
      }
    } catch (error) {
      console.error('Error uploading slip:', error);
      toast.error(error.message || 'เกิดข้อผิดพลาดในการอัพโหลดสลิป');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return <div className="p-8 text-center text-red-600">ไม่พบข้อมูลการจอง</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            อัพโหลดสลิปการโอนเงิน
          </h1>

          {/* Booking Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">ข้อมูลการจอง</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p><span className="font-medium">รหัสการจอง:</span> {booking.bookingReference}</p>
              <p><span className="font-medium">ห้องพัก:</span> {booking.roomType}</p>
              <p><span className="font-medium">จำนวนเงิน:</span> {booking.totalPrice?.toLocaleString()} บาท</p>
              <p><span className="font-medium">สถานะ:</span> 
                <span className={`ml-1 px-2 py-1 rounded text-xs ${
                  booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {booking.status === 'confirmed' ? 'ยืนยันแล้ว' :
                   booking.status === 'pending' ? 'รอยืนยัน' : 'ยกเลิก'}
                </span>
              </p>
            </div>
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              เลือกไฟล์สลิปการโอนเงิน
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
            <p className="text-xs text-gray-500 mt-1">
              รองรับไฟล์: JPG, PNG, GIF (ขนาดไม่เกิน 5MB)
            </p>
          </div>

          {/* Preview */}
          {slipPreview && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ตัวอย่างสลิป
              </label>
              <div className="border rounded-lg p-4 bg-gray-50">
                <img
                  src={slipPreview}
                  alt="Preview slip"
                  className="max-w-full h-auto max-h-96 mx-auto rounded"
                />
              </div>
            </div>
          )}

          {/* Upload Button */}
          <div className="flex gap-4">
            <button
              onClick={handleSlipUpload}
              disabled={!slipFile || uploading}
              className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  กำลังอัพโหลด...
                </div>
              ) : (
                'อัพโหลดสลิป'
              )}
            </button>
            <button
              onClick={() => router.push('/bookings')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ยกเลิก
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">🔔 คำแนะนำ</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• อัพโหลดสลิปการโอนเงินที่ชัดเจน</li>
              <li>• ตรวจสอบให้แน่ใจว่าจำนวนเงินตรงกับการจอง</li>
              <li>• เจ้าหน้าที่จะยืนยันการชำระเงินภายใน 24 ชั่วโมง</li>
              <li>• หากมีปัญหา กรุณาติดต่อเจ้าหน้าที่</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
