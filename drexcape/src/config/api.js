// API Configuration for different environments
const getApiBaseUrl = () => {
  // Check if we're in development (localhost)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // In development, use relative paths (handled by Vite proxy)
    return '';
  }
  
  // In production, use the backend service URL
  // Replace with your actual Render backend URL
  return 'https://drexcape.onrender.com';
};

export const API_BASE_URL = getApiBaseUrl();

// Helper function to build API URLs
export const buildApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
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