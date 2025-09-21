// Image URL utilities
const FRONTEND_BASE_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3002';
const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const getImageUrl = (imagePath) => {
  if (!imagePath) return `${FRONTEND_BASE_URL}/images/rooms/placeholder.svg`;
  
  // If already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If starts with /, use it as is with frontend base URL
  if (imagePath.startsWith('/')) {
    return `${FRONTEND_BASE_URL}${imagePath}`;
  }
  
  // Otherwise, assume it's a room image filename (served from frontend)
  return `${FRONTEND_BASE_URL}/images/rooms/${imagePath}`;
};

export const getRoomImageUrl = (imageName, cacheBust = false) => {
  if (!imageName) return `${FRONTEND_BASE_URL}/images/rooms/placeholder.svg`;
  const baseUrl = `${FRONTEND_BASE_URL}/images/rooms/${imageName}`;
  
  // Add cache busting parameter if requested
  if (cacheBust) {
    const timestamp = Date.now();
    return `${baseUrl}?v=${timestamp}`;
  }
  
  return baseUrl;
};

export const getUploadImageUrl = (fileName) => {
  if (!fileName) return null;
  // Payment slips and uploads are served from backend
  return `${BACKEND_BASE_URL}/uploads/${fileName}`;
};

export const getPlaceholderImageUrl = () => {
  return `${FRONTEND_BASE_URL}/images/rooms/placeholder.svg`;
};

// Fallback images for rooms (served from frontend)
export const getFallbackRoomImages = () => {
  return [
    `${FRONTEND_BASE_URL}/images/rooms/placeholder.svg`,
    `${FRONTEND_BASE_URL}/images/rooms/placeholder.svg`, 
    `${FRONTEND_BASE_URL}/images/rooms/placeholder.svg`
  ];
};

// Cache invalidation for room images
export const invalidateRoomImageCache = (roomId) => {
  // Store cache invalidation timestamp for specific room
  if (typeof window !== 'undefined') {
    localStorage.setItem(`room_image_cache_${roomId}`, Date.now().toString());
  }
};

export const getRoomImageCacheBuster = (roomId) => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(`room_image_cache_${roomId}`) || '';
  }
  return '';
};

// Enhanced room image URL with cache invalidation
export const getRoomImageUrlWithCache = (imageName, roomId) => {
  if (!imageName) return `${FRONTEND_BASE_URL}/images/rooms/placeholder.svg`;
  
  const baseUrl = `${FRONTEND_BASE_URL}/images/rooms/${imageName}`;
  const cacheBuster = getRoomImageCacheBuster(roomId);
  
  if (cacheBuster) {
    return `${baseUrl}?v=${cacheBuster}`;
  }
  
  return baseUrl;
};

export default {
  getImageUrl,
  getRoomImageUrl,
  getUploadImageUrl,
  getPlaceholderImageUrl,
  getFallbackRoomImages,
  invalidateRoomImageCache,
  getRoomImageUrlWithCache
};