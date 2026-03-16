'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useTranslation } from '../../../translations';
import WriteReview from '@/components/booking/WriteReview';

const StarRating = ({ rating, size = 'sm' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`${sizeClasses[size]} ${
            star <= rating ? 'text-yellow-400' : 'text-gray-300'
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
};

const RatingDistribution = ({ distribution, totalReviews }) => {
  return (
    <div className="space-y-2">
      {[5, 4, 3, 2, 1].map((rating) => {
        const count = distribution[rating] || 0;
        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
        
        return (
          <div key={rating} className="flex items-center text-sm">
            <span className="w-8 text-gray-600">{rating} ⭐</span>
            <div className="flex-1 mx-3 bg-gray-200 rounded-full h-2">
              <div
                className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="w-8 text-gray-600 text-right">{count}</span>
          </div>
        );
      })}
    </div>
  );
};

const ReviewCard = ({ review, t, language }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (language === 'en') {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } else {
      return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
            {review.user.firstName.charAt(0)}{review.user.lastName.charAt(0)}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">
              {review.user.firstName} {review.user.lastName}
            </h4>
            <div className="flex items-center space-x-2">
              <StarRating rating={review.rating} size="sm" />
              <span className="text-sm text-gray-600">
                {formatDate(review.createdAt)}
              </span>
              {review.isVerifiedStay && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  ✅ ยืนยันการเข้าพัก
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-yellow-500">{review.rating}</div>
          <div className="text-xs text-gray-500">คะแนน</div>
        </div>
      </div>
      
      {review.comment && (
        <p className="text-gray-700 mb-4 leading-relaxed">{review.comment}</p>
      )}
      
      {review.photos && review.photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
          {review.photos.map((photo, index) => (
            <img
              key={index}
              src={photo}
              alt={`รูปรีวิว ${index + 1}`}
              className="w-full h-24 object-cover rounded-lg"
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FilterSortControls = ({ sortBy, setSortBy, filterRating, setFilterRating, t }) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('reviews.sortBy', 'เรียงตาม')}
        </label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="newest">{t('reviews.newest', 'ล่าสุด')}</option>
          <option value="oldest">{t('reviews.oldest', 'เก่าสุด')}</option>
          <option value="highest">{t('reviews.highest', 'คะแนนสูงสุด')}</option>
          <option value="lowest">{t('reviews.lowest', 'คะแนนต่ำสุด')}</option>
        </select>
      </div>
      
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('reviews.filterByRating', 'กรองตามคะแนน')}
        </label>
        <select
          value={filterRating || ''}
          onChange={(e) => setFilterRating(e.target.value ? parseInt(e.target.value) : null)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">{t('reviews.allRatings', 'ทุกคะแนน')}</option>
          <option value="5">{t('reviews.fiveStars', '5 ดาว')}</option>
          <option value="4">{t('reviews.fourStars', '4 ดาว')}</option>
          <option value="3">{t('reviews.threeStars', '3 ดาว')}</option>
          <option value="2">{t('reviews.twoStars', '2 ดาว')}</option>
          <option value="1">{t('reviews.oneStar', '1 ดาว')}</option>
        </select>
      </div>
    </div>
  );
};

export default function HotelReviews() {
  const params = useParams();
  const hotelId = params.hotelId;
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  
  const [reviewData, setReviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('newest');
  const [filterRating, setFilterRating] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [hotelName, setHotelName] = useState(t('common.hotel', 'โรงแรม'));

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        sortBy,
        ...(filterRating && { rating: filterRating.toString() })
      });

      const response = await fetch(`http://localhost:5680/api/reviews/hotel/${hotelId}?${params}`);
      
      if (!response.ok) {
        throw new Error('ไม่สามารถโหลดรีวิวได้');
      }

      const data = await response.json();
      setReviewData(data.data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hotelId) {
      fetchReviews();
    }
  }, [hotelId, sortBy, filterRating, currentPage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('reviews.loadingReviews', 'กำลังโหลดรีวิว...')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">❌ {error}</p>
          <button
            onClick={fetchReviews}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            {t('common.tryAgain', 'ลองใหม่')}
          </button>
        </div>
      </div>
    );
  }

  if (!reviewData) {
    return null;
  }

  const { reviews, pagination, statistics } = reviewData;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">{t('reviews.title', 'รีวิวโรงแรม')}</h1>
            <button
              onClick={() => setShowWriteReview(true)}
              className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center space-x-2"
            >
              <span>✍️</span>
              <span>{t('reviews.writeReview', 'เขียนรีวิว')}</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* สถิติรวม */}
            <div>
              <div className="flex items-center space-x-4 mb-4">
                <div className="text-4xl font-bold text-yellow-500">
                  {statistics.averageRating}
                </div>
                <div>
                  <StarRating rating={Math.round(parseFloat(statistics.averageRating))} size="lg" />
                  <p className="text-gray-600 mt-1">
                    {language === 'en' 
                      ? `From ${statistics.totalReviews} reviews`
                      : `จาก ${statistics.totalReviews} รีวิว`
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>✅ {language === 'en' 
                  ? `Verified stays: ${statistics.verifiedStays} reviews`
                  : `ยืนยันการเข้าพัก: ${statistics.verifiedStays} รีวิว`
                }</span>
              </div>
            </div>
            
            {/* กราฟแยกคะแนน */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">{t('reviews.ratingDistribution', 'การกระจายคะแนน')}</h3>
              <RatingDistribution 
                distribution={statistics.ratingDistribution}
                totalReviews={statistics.totalReviews}
              />
            </div>
          </div>
        </div>

        {/* ตัวกรองและการเรียง */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <FilterSortControls
            sortBy={sortBy}
            setSortBy={setSortBy}
            filterRating={filterRating}
            setFilterRating={setFilterRating}
            t={t}
          />
        </div>

        {/* รายการรีวิว */}
        <div className="space-y-6">
          {reviews.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center">
              <p className="text-gray-500 text-lg">{t('reviews.noReviews', 'ยังไม่มีรีวิวที่ตรงกับเงื่อนไข')}</p>
            </div>
          ) : (
            reviews.map((review) => (
              <ReviewCard key={review.id} review={review} t={t} language={language} />
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">
                {language === 'en' 
                  ? `Showing ${((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} - ${Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of ${pagination.totalItems} results`
                  : `แสดง ${((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} - ${Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} จาก ${pagination.totalItems} รายการ`
                }
              </p>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={!pagination.hasPrevPage}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('common.previous', 'ก่อนหน้า')}
                </button>
                
                <span className="px-3 py-2 text-sm font-medium text-gray-700">
                  {language === 'en' 
                    ? `Page ${pagination.currentPage} of ${pagination.totalPages}`
                    : `หน้า ${pagination.currentPage} จาก ${pagination.totalPages}`
                  }
                </span>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                  disabled={!pagination.hasNextPage}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('common.next', 'ถัดไป')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Write Review Modal */}
      {showWriteReview && (
        <WriteReview
          hotelId={hotelId}
          hotelName={hotelName}
          onClose={() => setShowWriteReview(false)}
          onSuccess={(review) => {
            setShowWriteReview(false);
            fetchReviews(); // รีเฟรชรีวิว
            alert('เขียนรีวิวสำเร็จ! ขอบคุณสำหรับการแบ่งปัน');
          }}
        />
      )}
    </div>
  );
}
