'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { bookingAPI, reviewAPI } from '../../../../lib/api';
import { Star, Calendar, MapPin, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReviewPage({ params }) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: ''
  });

  const bookingId = params.id;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    if (bookingId && !booking) {
      fetchBookingData();
    }
  }, [bookingId, isAuthenticated]);

  const fetchBookingData = async () => {
    try {
      const response = await bookingAPI.getBookingById(bookingId);
      console.log('📋 Booking data for review:', response);
      
      let bookingData = null;
      if (response.success && response.data) {
        bookingData = response.data;
      } else if (response.booking) {
        bookingData = response.booking;
      } else {
        bookingData = response;
      }
      
      if (bookingData) {
        setBooking(bookingData);
      } else {
        throw new Error('ไม่พบข้อมูลการจอง');
      }
    } catch (error) {
      console.error('Error fetching booking:', error);
      toast.error('ไม่สามารถโหลดข้อมูลการจองได้');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Extract hotel ID from booking data with multiple fallbacks
      const hotelId = booking.hotel_id || 
                     booking.hotelId || 
                     booking.hotel?.id || 
                     (booking.data && booking.data.hotel_id) ||
                     1; // Default fallback to hotel ID 1

      // Prepare review data
      const reviewPayload = {
        hotelId: hotelId,
        bookingId: parseInt(bookingId),
        rating: reviewData.rating,
        comment: reviewData.comment || '',
        photos: [] // Empty for now, can be enhanced later
      };

      console.log('📝 Submitting review with payload:', reviewPayload);
      
      // Call review API
      const result = await reviewAPI.createReview(reviewPayload);
      console.log('✅ Review created successfully:', result);

      toast.success('ขอบคุณสำหรับรีวิวของคุณ!');
      router.push('/bookings');
    } catch (error) {
      console.error('Review error:', error);
      const message = error.response?.data?.error || error.message || 'ไม่สามารถส่งรีวิวได้';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRatingChange = (rating) => {
    setReviewData(prev => ({ ...prev, rating }));
  };

  const handleCommentChange = (e) => {
    setReviewData(prev => ({ ...prev, comment: e.target.value }));
  };

  const renderStars = (rating, interactive = false) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && handleRatingChange(star)}
            className={`${interactive ? 'cursor-pointer' : 'cursor-default'} ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
            disabled={!interactive}
          >
            <Star className="h-8 w-8 fill-current" />
          </button>
        ))}
      </div>
    );
  };

  if (loading || !booking) {
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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">ไม่พบข้อมูลการจอง</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto container-padding">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          กลับ
        </button>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            รีวิวการเข้าพัก
          </h1>

          {/* Booking Summary */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              ข้อมูลการเข้าพัก
            </h2>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <MapPin className="h-5 w-5 text-gray-500 mr-3" />
                <span className="font-medium">{booking.hotel?.name || booking.hotelName || 'ไม่ระบุชื่อโรงแรม'}</span>
              </div>
              
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-500 mr-3" />
                <span>
                  {booking.checkInDate ? new Date(booking.checkInDate).toLocaleDateString('th-TH') : 'ไม่ระบุ'} - {' '}
                  {booking.checkOutDate ? new Date(booking.checkOutDate).toLocaleDateString('th-TH') : 'ไม่ระบุ'}
                </span>
              </div>
              
              <div className="text-sm text-gray-600">
                <div>ห้องพัก: {booking.roomType?.name || booking.roomName || 'ไม่ระบุประเภทห้อง'}</div>
                <div>รหัสการจอง: {booking.bookingReference || booking.booking_reference || 'ไม่ระบุ'}</div>
              </div>
            </div>
          </div>

          {/* Review Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                ให้คะแนนการเข้าพัก
              </label>
              <div className="flex items-center space-x-4">
                {renderStars(reviewData.rating, true)}
                <span className="text-sm text-gray-600">
                  ({reviewData.rating}/5)
                </span>
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                แสดงความคิดเห็น
              </label>
              <textarea
                value={reviewData.comment}
                onChange={handleCommentChange}
                rows={6}
                className="input-field"
                placeholder="แบ่งปันประสบการณ์การเข้าพักของคุณ..."
                required
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
