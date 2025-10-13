'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { reviewAPI } from '../../../lib/api';
import Cookies from 'js-cookie';
import Link from 'next/link';
import { 
  Star, 
  MessageSquare,
  Hotel,
  User,
  Search,
  Filter,
  RefreshCw,
  ArrowLeft,
  Eye,
  Check,
  X,
  Trash2,
  Calendar,
  StarIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminReviewsPage() {
  const { user: currentUser, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReview, setSelectedReview] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [reviewStats, setReviewStats] = useState({
    totalReviews: 0,
    pendingReviews: 0,
    approvedReviews: 0,
    averageRating: 0,
    fiveStars: 0,
    fourStars: 0,
    threeStars: 0,
    twoStars: 0,
    oneStars: 0
  });

  // Fetch all reviews
  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching reviews data...');
      
      // For now, we'll get reviews for hotel ID 2 (the main hotel)
      // In the future, this could be expanded to get all reviews from all hotels
      const response = await reviewAPI.getHotelReviews(2);
      console.log('⭐ Reviews API Response:', response);
      
      if (response?.data?.reviews) {
        setReviews(response.data.reviews);
        
        // Calculate statistics
        const reviews = response.data.reviews;
        const stats = response.data.statistics;
        
        setReviewStats({
          totalReviews: stats.totalReviews || 0,
          pendingReviews: reviews.filter(r => !r.isApproved).length,
          approvedReviews: reviews.filter(r => r.isApproved).length,
          averageRating: parseFloat(stats.averageRating || 0),
          fiveStars: stats.breakdown[5] || 0,
          fourStars: stats.breakdown[4] || 0,
          threeStars: stats.breakdown[3] || 0,
          twoStars: stats.breakdown[2] || 0,
          oneStars: stats.breakdown[1] || 0
        });
        
        console.log('✅ Reviews loaded:', reviews.length);
      }
    } catch (error) {
      console.error('❌ Error fetching reviews:', error);
      toast.error('ไม่สามารถโหลดข้อมูลรีวิวได้');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchReviews();
    }
  }, [isAuthenticated, fetchReviews]);

  // Filter reviews based on search and filters
  const filteredReviews = reviews.filter(review => {
    const matchesSearch = searchTerm === '' || 
      review.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.reviewer?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.reviewer?.lastName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRating = ratingFilter === 'all' || review.rating.toString() === ratingFilter;
    
    // For now, we don't have approval status, so we'll show all as approved
    const matchesStatus = statusFilter === 'all' || statusFilter === 'approved';
    
    return matchesSearch && matchesRating && matchesStatus;
  });

  // Render star rating
  const renderStarRating = (rating) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={`${
              star <= rating 
                ? 'text-yellow-400 fill-current' 
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-sm font-medium">{rating}/5</span>
      </div>
    );
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle view review details
  const handleViewReview = (review) => {
    setSelectedReview(review);
    setShowDetailModal(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">กรุณาเข้าสู่ระบบ</h1>
          <Link 
            href="/login"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            เข้าสู่ระบบ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin"
                className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft size={20} className="mr-2" />
                กลับหน้าแอดมิน
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">จัดการรีวิว</h1>
                <p className="text-gray-600 mt-1">ดูและจัดการรีวิวจากลูกค้า</p>
              </div>
            </div>
            <button
              onClick={fetchReviews}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
              รีเฟรช
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <MessageSquare className="h-12 w-12 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">รีวิวทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-900">{reviewStats.totalReviews}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Star className="h-12 w-12 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">คะแนนเฉลี่ย</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reviewStats.averageRating.toFixed(1)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Check className="h-12 w-12 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">รีวิวที่อนุมัติ</p>
                <p className="text-2xl font-bold text-gray-900">{reviewStats.approvedReviews}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <StarIcon className="h-12 w-12 text-yellow-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">5 ดาว</p>
                <p className="text-2xl font-bold text-gray-900">{reviewStats.fiveStars}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="ค้นหารีวิว..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">คะแนนทั้งหมด</option>
                <option value="5">5 ดาว</option>
                <option value="4">4 ดาว</option>
                <option value="3">3 ดาว</option>
                <option value="2">2 ดาว</option>
                <option value="1">1 ดาว</option>
              </select>
            </div>
            
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">สถานะทั้งหมด</option>
                <option value="approved">อนุมัติแล้ว</option>
                <option value="pending">รออนุมัติ</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              รายการรีวิว ({filteredReviews.length})
            </h3>
          </div>
          
          {loading ? (
            <div className="p-6 text-center">
              <RefreshCw className="animate-spin mx-auto mb-4" size={32} />
              <p>กำลังโหลดข้อมูล...</p>
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
              <p>ไม่พบรีวิว</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredReviews.map((review) => (
                <div key={review.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <div className="flex items-center">
                          <User size={16} className="text-gray-400 mr-2" />
                          <span className="font-medium text-gray-900">
                            {review.reviewer?.firstName} {review.reviewer?.lastName}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Calendar size={16} className="text-gray-400 mr-2" />
                          <span className="text-sm text-gray-500">
                            {formatDate(review.createdAt)}
                          </span>
                        </div>
                        {review.isVerifiedStay && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Check size={12} className="mr-1" />
                            ยืนยันการพัก
                          </span>
                        )}
                      </div>
                      
                      <div className="mb-3">
                        {renderStarRating(review.rating)}
                      </div>
                      
                      <p className="text-gray-700 mb-4 line-clamp-3">
                        {review.comment}
                      </p>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewReview(review)}
                          className="flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                        >
                          <Eye size={16} className="mr-1" />
                          ดูรายละเอียด
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Review Detail Modal */}
      {showDetailModal && selectedReview && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 cursor-pointer"
          style={{ 
            zIndex: 9999,
            pointerEvents: 'auto',
            userSelect: 'none'
          }}
          onClick={(e) => {
            console.log('Overlay clicked');
            setShowDetailModal(false);
          }}
        >
          <div 
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto cursor-default"
            style={{ pointerEvents: 'auto' }}
            onClick={(e) => {
              console.log('Modal content clicked');
              e.stopPropagation();
            }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">รายละเอียดรีวิว</h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ผู้รีวิว
                  </label>
                  <p className="text-gray-900">
                    {selectedReview.reviewer?.firstName} {selectedReview.reviewer?.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{selectedReview.reviewer?.email}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    คะแนน
                  </label>
                  {renderStarRating(selectedReview.rating)}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ความเห็น
                  </label>
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedReview.comment}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    วันที่รีวิว
                  </label>
                  <p className="text-gray-900">{formatDate(selectedReview.createdAt)}</p>
                </div>
                
                {selectedReview.isVerifiedStay && (
                  <div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <Check size={16} className="mr-2" />
                      ยืนยันการพักแล้ว
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}