'use client';

import { useState } from 'react';

const StarInput = ({ rating, setRating }) => {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setRating(star)}
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
          className="focus:outline-none transition-colors"
        >
          <svg
            className={`w-8 h-8 ${
              star <= (hoverRating || rating)
                ? 'text-yellow-400 hover:text-yellow-500'
                : 'text-gray-300 hover:text-gray-400'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
      <span className="ml-3 text-sm text-gray-600">
        {rating > 0 && (
          <>
            {rating === 1 && 'แย่มาก'}
            {rating === 2 && 'แย่'}
            {rating === 3 && 'ปานกลาง'}
            {rating === 4 && 'ดี'}
            {rating === 5 && 'ดีเยี่ยม'}
          </>
        )}
      </span>
    </div>
  );
};

export default function WriteReview({ hotelId, hotelName, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    rating: 0,
    comment: '',
    photos: [],
    bookingId: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.rating === 0) {
      setError('กรุณาให้คะแนน');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setError('กรุณาเข้าสู่ระบบก่อนเขียนรีวิว');
        return;
      }

      const response = await fetch('http://localhost:5680/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          hotelId: parseInt(hotelId),
          rating: formData.rating,
          comment: formData.comment.trim(),
          photos: formData.photos,
          bookingId: formData.bookingId || null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการส่งรีวิว');
      }

      // แจ้งความสำเร็จ
      onSuccess && onSuccess(data.review);
      
      // รีเซ็ตฟอร์ม
      setFormData({
        rating: 0,
        comment: '',
        photos: [],
        bookingId: ''
      });

    } catch (err) {
      setError(err.message);
      console.error('Error submitting review:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">เขียนรีวิว</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Hotel Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900">{hotelName}</h3>
            <p className="text-sm text-gray-600">แบ่งปันประสบการณ์ของคุณกับผู้อื่น</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-red-600 text-sm">❌ {error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                คะแนนโดยรวม <span className="text-red-500">*</span>
              </label>
              <StarInput 
                rating={formData.rating} 
                setRating={(rating) => handleInputChange('rating', rating)}
              />
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                รีวิวของคุณ
              </label>
              <textarea
                value={formData.comment}
                onChange={(e) => handleInputChange('comment', e.target.value)}
                placeholder="เล่าถึงประสบการณ์การเข้าพักของคุณ..."
                rows="5"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                maxLength="1000"
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.comment.length}/1000 ตัวอักษร
              </p>
            </div>

            {/* Booking Reference (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                รหัสการจอง (ถ้ามี)
              </label>
              <input
                type="text"
                value={formData.bookingId}
                onChange={(e) => handleInputChange('bookingId', e.target.value)}
                placeholder="ระบุรหัสการจองเพื่อยืนยันการเข้าพัก"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                ระบุรหัสการจองเพื่อให้รีวิวของคุณได้รับเครื่องหมาย "ยืนยันการเข้าพัก"
              </p>
            </div>

            {/* Photo Upload Placeholder */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                รูปภาพ (เร็วๆ นี้)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <p className="text-gray-500">📷 การอัปโหลดรูปภาพจะพร้อมใช้งานเร็วๆ นี้</p>
              </div>
            </div>

            {/* Guidelines */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h4 className="font-medium text-blue-900 mb-2">📝 แนวทางการเขียนรีวิว</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• เขียนรีวิวที่สุจริตและตรงไปตรงมา</li>
                <li>• แบ่งปันประสบการณ์จริงที่เกิดขึ้น</li>
                <li>• หลีกเลี่ยงคำพูดที่ไม่เหมาะสมหรือส่วนตัว</li>
                <li>• ใช้ภาษาที่สุภาพและสร้างสรรค์</li>
              </ul>
            </div>

            {/* Submit Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={loading || formData.rating === 0}
                className="flex-1 bg-blue-500 text-white py-3 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>กำลังส่ง...</span>
                  </div>
                ) : (
                  'ส่งรีวิว'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
