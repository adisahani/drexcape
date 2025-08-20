// API Configuration for different environments
const getApiBaseUrl = () => {
  // Check if we're in development (localhost)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // In development, use relative paths (handled by Vite proxy)
    console.log('🔧 Development mode: Using relative API paths');
    return '';
  }
  
  // Check if we're on the custom domain (drexcape.com)
  if (window.location.hostname === 'drexcape.com' || window.location.hostname === 'www.drexcape.com') {
    // On custom domain, use the Render backend URL
    const productionUrl = 'https://drexcape.onrender.com';
    console.log('🌐 Custom domain detected: Using Render backend URL:', productionUrl);
    return productionUrl;
  }
  
  // For other Render subdomains, use relative paths
  console.log('🚀 Production mode: Using relative API paths (Render deployment)');
  return '';
};

export const API_BASE_URL = getApiBaseUrl();

// Helper function to build API URLs with fallback
export const buildApiUrl = (endpoint) => {
  const fullUrl = `${API_BASE_URL}${endpoint}`;
  console.log('🔗 Building API URL:', fullUrl);
  return fullUrl;
};

// Helper function to fetch with fallback (simplified since we always use Render backend)
export const fetchWithFallback = async (endpoint, options = {}) => {
  const url = buildApiUrl(endpoint);
  
  try {
    console.log('🔄 Making API request to:', url);
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    console.error('❌ API request failed:', error);
    throw error;
  }
};

// Helper function to get authorization headers
export const getAuthHeaders = () => {
  const userToken = localStorage.getItem('userToken');
  const adminToken = localStorage.getItem('adminToken');
  
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (userToken && userToken !== 'logged-in') {
    headers['Authorization'] = `Bearer ${userToken}`;
  } else if (adminToken) {
    headers['Authorization'] = `Bearer ${adminToken}`;
  }
  
  return headers;
};

// Common API endpoints
export const API_ENDPOINTS = {
  // Itinerary endpoints
  GENERATE_ITINERARY: '/api/generate-itinerary',
  POPULAR_SEARCHES: '/api/itineraries/popular/searches',
  ITINERARY_DETAILS: (slug) => `/api/itineraries/${slug}`,
  ITINERARY_DETAILS_BY_ID: (id) => `/api/itinerary-details/${id}`,
  GENERATE_DETAILED_ITINERARY: (id) => `/api/itinerary/${id}/generate-details`,
  
  // Blog endpoints
  BLOGS_PUBLISHED: '/api/blogs/published',
  BLOG_DETAIL: (slug) => `/api/blogs/${slug}`,
  BLOG_CATEGORIES: '/api/blogs/categories/list',
  BLOG_SHARE: (blogId) => `/api/blogs/${blogId}/share`,
  
  // Package endpoints
  PACKAGES_PUBLISHED: '/api/packages/published',
  PACKAGE_DETAIL: (slug) => `/api/packages/${slug}`,
  PACKAGE_CATEGORIES: '/api/packages/categories/list',
  PACKAGES_FEATURED: '/api/packages/featured/list',
  PACKAGE_BOOK: '/api/packages/book',
  
  // Booking management endpoints
  BOOKINGS_ALL: '/api/packages/admin/bookings',
  BOOKINGS_STATS: '/api/packages/admin/bookings/stats',
  BOOKING_DETAIL: (id) => `/api/packages/admin/bookings/${id}`,
  BOOKING_STATUS: (id) => `/api/packages/admin/bookings/${id}/status`,
  BOOKING_CONTACT: (id) => `/api/packages/admin/bookings/${id}/contact`,
  
  // User endpoints
  USER_LOGIN: '/api/users/login',
  USER_REGISTER: '/api/users/register',
  
  // Admin endpoints
  ADMIN_LOGIN: '/api/admin/auth/login',
  ADMIN_PROFILE: '/api/admin/auth/profile',
  ADMIN_CHANGE_PASSWORD: '/api/admin/auth/change-password',
  
  // Promotional leads
  PROMOTIONAL_LEADS: '/api/promotional-leads',
  PROMOTIONAL_LEADS_SUBMIT: '/api/promotional-leads/submit',
  PROMOTIONAL_LEADS_STATS: '/api/promotional-leads/stats',
  PROMOTIONAL_LEADS_STATUS: (id) => `/api/promotional-leads/${id}/status`,
  
  // Analytics
  ANALYTICS_ACTIVITY_FEED: '/api/analytics/activity-feed',
  ANALYTICS_DASHBOARD: '/api/analytics/dashboard',
  ANALYTICS_EXPORT: '/api/analytics/export',
  
  // Place images
  PLACE_IMAGE: '/api/place-image',
  DESTINATION_GALLERY: '/api/destination-gallery',
  
  // Search history
  SEARCH_HISTORY: (userId) => `/api/search-history/${userId}`,
  SAVE_SEARCH_HISTORY: '/api/search-history',
  DELETE_SEARCH_HISTORY: (id) => `/api/search-history/${id}`,
  CLEAR_SEARCH_HISTORY: (userId) => `/api/search-history/user/${userId}`,
}; 