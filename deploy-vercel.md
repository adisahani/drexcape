# Drexcape Domain Configuration Guide

## Issue
The frontend is now deployed on `drexcape.com` but the API calls are failing because:
1. The API configuration was pointing to the Render backend
2. CORS settings need to be updated
3. The backend is still running on Render at `https://drexcape.onrender.com`

## Solution
Since the backend is still on Render, we need to configure the frontend to always use the Render backend URL.

## Steps to Fix

### 1. Update API Configuration ✅
- Updated `drexcape/src/config/api.js` to always use `https://drexcape.onrender.com` in production
- This ensures all API calls go to the Render backend

### 2. Update CORS Settings ✅
- Updated `server/index.js` to allow `drexcape.com` and `www.drexcape.com`
- Added both domains to the CORS allowed origins

### 3. Test the Configuration
1. Visit `https://drexcape.com/debug` to test API connectivity
2. Check the browser console for any errors
3. Test the main functionality:
   - Blog listing: `https://drexcape.com/blog`
   - Package listing: `https://drexcape.com/packages`
   - Itinerary generation: Use the search form on homepage

### 4. Debug Steps
If issues persist:

1. **Check API Health**: Visit `https://drexcape.onrender.com/api/health`
2. **Check Test Endpoint**: Visit `https://drexcape.onrender.com/api/test`
3. **Check Console Errors**: Open browser dev tools and check for CORS or network errors
4. **Check Render Logs**: Check the Render dashboard for server logs

### 5. Environment Variables
Make sure these environment variables are set in your Render backend:

```bash
# Required for API functionality
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_25_FLASH_LITE_API_KEY=your_gemini_api_key
PIXABAY_API_KEY=your_pixabay_api_key
GOOGLE_PLACES_API_KEY=your_google_places_api_key

# Optional (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Session
SESSION_SECRET=your_session_secret
```

## Current Status
- ✅ API configuration updated to use Render backend
- ✅ CORS settings updated for new domain
- ✅ Debug component added for testing
- ⏳ Testing needed after deployment

## Next Steps
1. Deploy the updated frontend code
2. Test the API connectivity using the debug page
3. Verify all functionality works on the new domain
4. Monitor for any CORS or connectivity issues

## Architecture
- **Frontend**: `drexcape.com` (Vercel/Netlify/etc.)
- **Backend**: `https://drexcape.onrender.com` (Render)
- **API Calls**: Frontend → Render Backend (cross-origin)
