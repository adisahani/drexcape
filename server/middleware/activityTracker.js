let UserActivity, User;

try {
  UserActivity = require('../models/UserActivity');
  User = require('../models/User');
} catch (error) {
  console.log('⚠️ Activity tracking models not available:', error.message);
  // Create dummy models for fallback
  UserActivity = {
    create: async () => console.log('Activity tracking disabled - UserActivity model not available')
  };
  User = {
    addSearch: async () => {},
    addViewedItinerary: async () => {},
    markItineraryShared: async () => {}
  };
}

// Generate session ID
const generateSessionId = () => {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Get device info from user agent
const getDeviceInfo = (userAgent) => {
  const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
  const isTablet = /Tablet|iPad/.test(userAgent);
  
  let deviceType = 'desktop';
  if (isTablet) deviceType = 'tablet';
  else if (isMobile) deviceType = 'mobile';

  return {
    deviceType,
    userAgent
  };
};

// Get IP address
const getIpAddress = (req) => {
  return req.headers['x-forwarded-for'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null);
};

// Get user from JWT token
const getUserFromToken = async (req) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return null;
    
    const jwt = require('jsonwebtoken');
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'drexcape-super-secret-jwt-key-2024');
    const user = await User.findById(decoded.userId);
    return user;
  } catch (error) {
    console.log('Error getting user from token:', error.message);
  }
  return null;
};

// Get user from cookies (only for persistent identification, not session-based)
const getUserFromCookies = async (req) => {
  try {
    const cookies = req.headers.cookie;
    if (!cookies) return null;
    
    // Parse cookies to find user data
    const cookiePairs = cookies.split(';');
    for (const pair of cookiePairs) {
      const [name, value] = pair.trim().split('=');
      if (name === 'drexcape_user_data') {
        try {
          const userData = JSON.parse(decodeURIComponent(value));
          if (userData.phone) {
            const user = await User.findOne({ phone: userData.phone });
            return user;
          }
        } catch (error) {
          console.log('Error parsing user cookie:', error.message);
        }
      }
    }
  } catch (error) {
    console.log('Error getting user from cookies:', error.message);
  }
  return null;
};

// Check itinerary access control
const checkItineraryAccess = async (req, itineraryId) => {
  try {
    // Check if user has submitted form in this session
    if (req.session?.userPhone || req.session?.userId) {
      console.log('User has session access:', req.session.userPhone || req.session.userId);
      return true; // Unlocked
    }
    
    // Check if user has previously submitted form (via cookie)
    const userFromCookie = await getUserFromCookies(req);
    if (userFromCookie) {
      console.log('User has cookie access:', userFromCookie.phone);
      return true; // Unlocked
    }
    
    // Check for any user data in cookies (more lenient)
    const cookies = req.headers.cookie;
    if (cookies && cookies.includes('drexcape_user_data')) {
      console.log('User has cookie data, granting access');
      return true; // Unlocked
    }
    
    console.log('User has no access to itinerary:', itineraryId);
    return false; // Locked
  } catch (error) {
    console.error('Error checking itinerary access:', error);
    return false; // Default to locked on error
  }
};

// Track search activity
const trackSearch = async (req, searchData, processingTime, resultsCount) => {
  try {
    if (!UserActivity || !UserActivity.create) {
      console.log('Activity tracking disabled - UserActivity model not available');
      return;
    }

    const sessionId = req.session?.sessionId || generateSessionId();
    if (!req.session) req.session = {};
    req.session.sessionId = sessionId;

    // Try to identify user by multiple methods
    let userId = 'anonymous';
    let userPhone = null;
    
    // Method 1: Check JWT token (highest priority - user is logged in)
    const userFromToken = await getUserFromToken(req);
    if (userFromToken) {
      userId = userFromToken._id.toString();
      userPhone = userFromToken.phone;
    }
    // Method 2: Check session for user ID (legacy support)
    else if (req.session?.userId) {
      userId = req.session.userId;
      userPhone = req.session.userPhone;
    }
    // Method 3: Check for user object (if authenticated admin)
    else if (req.user?.userId) {
      userId = req.user.userId;
    }
    // Method 4: Only use cookies for persistent identification if no session exists
    // This ensures incognito sessions start as anonymous until form is filled
    else if (!req.session || Object.keys(req.session).length === 0) {
      const userFromCookie = await getUserFromCookies(req);
      if (userFromCookie) {
        userId = userFromCookie._id.toString();
        userPhone = userFromCookie.phone;
      }
    }
    
    await UserActivity.create({
      userId,
      sessionId,
      userAgent: req.headers['user-agent'],
      ipAddress: getIpAddress(req),
      activityType: 'search',
      searchData: {
        from: searchData.from,
        to: searchData.to,
        departureDate: searchData.departureDate,
        returnDate: searchData.returnDate,
        travellers: searchData.travellers,
        travelClass: searchData.travelClass,
        budget: searchData.budget,
        searchQuery: `${searchData.from} to ${searchData.to}`,
        resultsCount,
        processingTime,
        aiUsage: true
      },
      deviceInfo: getDeviceInfo(req.headers['user-agent']),
      timestamp: new Date()
    });

    // Update user search count if user exists
    if (userFromToken && User && User.addSearch) {
      await userFromToken.addSearch({
        from: searchData.from,
        to: searchData.to,
        departureDate: searchData.departureDate,
        returnDate: searchData.returnDate,
        travellers: searchData.travellers,
        travelClass: searchData.travelClass,
        resultsCount
      });
    }
  } catch (error) {
    console.error('Error tracking search:', error);
  }
};

// Track form submission
const trackFormSubmission = async (req, formType, formData, submissionSource = 'unknown') => {
  try {
    if (!UserActivity || !UserActivity.create) {
      console.log('Activity tracking disabled - UserActivity model not available');
      return;
    }

    const sessionId = req.session?.sessionId || generateSessionId();
    if (!req.session) req.session = {};
    req.session.sessionId = sessionId;

    // Try to identify user by multiple methods
    let userId = 'anonymous';
    let userPhone = null;
    let user = null;
    
    // Method 1: Check JWT token (highest priority - user is logged in)
    const userFromToken = await getUserFromToken(req);
    if (userFromToken) {
      userId = userFromToken._id.toString();
      userPhone = userFromToken.phone;
      user = userFromToken;
    }
    // Method 2: Check session for user ID (legacy support)
    else if (req.session?.userId) {
      userId = req.session.userId;
      userPhone = req.session.userPhone;
    }
    // Method 3: Check for user object (if authenticated admin)
    else if (req.user?.userId) {
      userId = req.user.userId;
    }
    // Method 4: For form submissions, we might have phone in formData
    else if (formData && formData.phone) {
      // Try to find user by phone
      try {
        user = await User.findOne({ phone: formData.phone });
        if (user) {
          userId = user._id.toString();
          userPhone = formData.phone;
          
          // Set session data for future requests
          req.session.userId = userId;
          req.session.userPhone = userPhone;
          
          // Force session save
          req.session.save(err => {
            if (err) console.error('Error saving session:', err);
            else console.log('Session saved successfully for user:', userPhone);
          });
        }
      } catch (error) {
        console.log('Could not find user by phone:', error.message);
      }
    }
    
    await UserActivity.create({
      userId,
      sessionId,
      userAgent: req.headers['user-agent'],
      ipAddress: getIpAddress(req),
      activityType: 'form_submission',
      formData: {
        formType,
        fields: formData,
        submissionSource,
        conversion: false // Will be updated if leads to booking
      },
      deviceInfo: getDeviceInfo(req.headers['user-agent']),
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error tracking form submission:', error);
  }
};

// Track itinerary view
const trackItineraryView = async (req, itineraryId, itinerarySlug, viewDuration = 0) => {
  try {
    if (!UserActivity || !UserActivity.create) {
      console.log('Activity tracking disabled - UserActivity model not available');
      return;
    }

    const sessionId = req.session?.sessionId || generateSessionId();
    if (!req.session) req.session = {};
    req.session.sessionId = sessionId;

    // Try to identify user by multiple methods
    let userId = 'anonymous';
    let userPhone = null;
    
    // Method 1: Check JWT token (highest priority - user is logged in)
    const userFromToken = await getUserFromToken(req);
    if (userFromToken) {
      userId = userFromToken._id.toString();
      userPhone = userFromToken.phone;
    }
    // Method 2: Check session for user ID (legacy support)
    else if (req.session?.userId) {
      userId = req.session.userId;
      userPhone = req.session.userPhone;
    }
    // Method 3: Check for user object (if authenticated admin)
    else if (req.user?.userId) {
      userId = req.user.userId;
    }
    // Method 4: Only use cookies for persistent identification if no session exists
    // This ensures incognito sessions start as anonymous until form is filled
    else if (!req.session || Object.keys(req.session).length === 0) {
      const userFromCookie = await getUserFromCookies(req);
      if (userFromCookie) {
        userId = userFromCookie._id.toString();
        userPhone = userFromCookie.phone;
      }
    }
    
    await UserActivity.create({
      userId,
      sessionId,
      userAgent: req.headers['user-agent'],
      ipAddress: getIpAddress(req),
      activityType: 'itinerary_view',
      itineraryData: {
        itineraryId,
        itinerarySlug,
        viewDuration,
        interactionType: 'view',
        fromPage: req.headers.referer || 'direct'
      },
      deviceInfo: getDeviceInfo(req.headers['user-agent']),
      timestamp: new Date()
    });

    // Update user view count if user exists
    if (userFromToken && User && User.addViewedItinerary) {
      await userFromToken.addViewedItinerary(itineraryId, viewDuration);
    }
  } catch (error) {
    console.error('Error tracking itinerary view:', error);
  }
};

// Track itinerary share
const trackItineraryShare = async (req, itineraryId, sharePlatform) => {
  try {
    if (!UserActivity || !UserActivity.create) {
      console.log('Activity tracking disabled - UserActivity model not available');
      return;
    }

    const sessionId = req.session?.sessionId || generateSessionId();
    if (!req.session) req.session = {};
    req.session.sessionId = sessionId;

    // Try to identify user by multiple methods
    let userId = 'anonymous';
    let userPhone = null;
    
    // Method 1: Check JWT token (highest priority - user is logged in)
    const userFromToken = await getUserFromToken(req);
    if (userFromToken) {
      userId = userFromToken._id.toString();
      userPhone = userFromToken.phone;
    }
    // Method 2: Check session for user ID (legacy support)
    else if (req.session?.userId) {
      userId = req.session.userId;
      userPhone = req.session.userPhone;
    }
    // Method 3: Check for user object (if authenticated admin)
    else if (req.user?.userId) {
      userId = req.user.userId;
    }
    // Method 4: Only use cookies for persistent identification if no session exists
    // This ensures incognito sessions start as anonymous until form is filled
    else if (!req.session || Object.keys(req.session).length === 0) {
      const userFromCookie = await getUserFromCookies(req);
      if (userFromCookie) {
        userId = userFromCookie._id.toString();
        userPhone = userFromCookie.phone;
      }
    }
    
    await UserActivity.create({
      userId,
      sessionId,
      userAgent: req.headers['user-agent'],
      ipAddress: getIpAddress(req),
      activityType: 'itinerary_share',
      itineraryData: {
        itineraryId,
        interactionType: 'share',
        sharePlatform,
        fromPage: req.headers.referer || 'direct'
      },
      deviceInfo: getDeviceInfo(req.headers['user-agent']),
      timestamp: new Date()
    });

    // Update user share count if user exists
    if (userFromToken && User && User.markItineraryShared) {
      await userFromToken.markItineraryShared(itineraryId);
    }
  } catch (error) {
    console.error('Error tracking itinerary share:', error);
  }
};

// Track page view
const trackPageView = async (req, pageUrl, pageTitle, timeOnPage = 0) => {
  try {
    if (!UserActivity || !UserActivity.create) {
      console.log('Activity tracking disabled - UserActivity model not available');
      return;
    }

    const sessionId = req.session?.sessionId || generateSessionId();
    if (!req.session) req.session = {};
    req.session.sessionId = sessionId;

    // Try to identify user by multiple methods
    let userId = 'anonymous';
    let userPhone = null;
    
    // Method 1: Check JWT token (highest priority - user is logged in)
    const userFromToken = await getUserFromToken(req);
    if (userFromToken) {
      userId = userFromToken._id.toString();
      userPhone = userFromToken.phone;
    }
    // Method 2: Check session for user ID (legacy support)
    else if (req.session?.userId) {
      userId = req.session.userId;
      userPhone = req.session.userPhone;
    }
    // Method 3: Check for user object (if authenticated admin)
    else if (req.user?.userId) {
      userId = req.user.userId;
    }
    // Method 4: Only use cookies for persistent identification if no session exists
    // This ensures incognito sessions start as anonymous until form is filled
    else if (!req.session || Object.keys(req.session).length === 0) {
      const userFromCookie = await getUserFromCookies(req);
      if (userFromCookie) {
        userId = userFromCookie._id.toString();
        userPhone = userFromCookie.phone;
      }
    }
    
    await UserActivity.create({
      userId,
      sessionId,
      userAgent: req.headers['user-agent'],
      ipAddress: getIpAddress(req),
      activityType: 'page_view',
      pageData: {
        pageUrl,
        pageTitle,
        referrer: req.headers.referer || 'direct',
        timeOnPage
      },
      deviceInfo: getDeviceInfo(req.headers['user-agent']),
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error tracking page view:', error);
  }
};

// Track error
const trackError = async (req, errorType, errorMessage, userAction) => {
  try {
    if (!UserActivity || !UserActivity.create) {
      console.log('Activity tracking disabled - UserActivity model not available');
      return;
    }

    const sessionId = req.session?.sessionId || generateSessionId();
    if (!req.session) req.session = {};
    req.session.sessionId = sessionId;

    // Try to identify user by multiple methods
    let userId = 'anonymous';
    let userPhone = null;
    
    // Method 1: Check JWT token (highest priority - user is logged in)
    const userFromToken = await getUserFromToken(req);
    if (userFromToken) {
      userId = userFromToken._id.toString();
      userPhone = userFromToken.phone;
    }
    // Method 2: Check session for user ID (legacy support)
    else if (req.session?.userId) {
      userId = req.session.userId;
      userPhone = req.session.userPhone;
    }
    // Method 3: Check for user object (if authenticated admin)
    else if (req.user?.userId) {
      userId = req.user.userId;
    }
    // Method 4: Only use cookies for persistent identification if no session exists
    // This ensures incognito sessions start as anonymous until form is filled
    else if (!req.session || Object.keys(req.session).length === 0) {
      const userFromCookie = await getUserFromCookies(req);
      if (userFromCookie) {
        userId = userFromCookie._id.toString();
        userPhone = userFromCookie.phone;
      }
    }
    
    await UserActivity.create({
      userId,
      sessionId,
      userAgent: req.headers['user-agent'],
      ipAddress: getIpAddress(req),
      activityType: 'error',
      errorData: {
        errorType,
        errorMessage,
        userAction
      },
      deviceInfo: getDeviceInfo(req.headers['user-agent']),
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error tracking error:', error);
  }
};

// Middleware to track all activities
const activityTracker = (req, res, next) => {
  // Add tracking methods to request object
  req.trackSearch = (searchData, processingTime, resultsCount) => 
    trackSearch(req, searchData, processingTime, resultsCount);
  
  req.trackFormSubmission = (formType, formData, submissionSource) => 
    trackFormSubmission(req, formType, formData, submissionSource);
  
  req.trackItineraryView = (itineraryId, itinerarySlug, viewDuration) => 
    trackItineraryView(req, itineraryId, itinerarySlug, viewDuration);
  
  req.trackItineraryShare = (itineraryId, sharePlatform) => 
    trackItineraryShare(req, itineraryId, sharePlatform);
  
  req.trackPageView = (pageUrl, pageTitle, timeOnPage) => 
    trackPageView(req, pageUrl, pageTitle, timeOnPage);
  
  req.trackError = (errorType, errorMessage, userAction) => 
    trackError(req, errorType, errorMessage, userAction);

  // Add access control method
  req.checkItineraryAccess = (itineraryId) => 
    checkItineraryAccess(req, itineraryId);

  // Log session info for debugging (development only)
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Session Debug:', {
      sessionId: req.sessionID,
      hasSession: !!req.session,
      sessionKeys: req.session ? Object.keys(req.session) : [],
      userId: req.session?.userId,
      userPhone: req.session?.userPhone
    });
  }

  next();
};

module.exports = {
  activityTracker,
  trackSearch,
  trackFormSubmission,
  trackItineraryView,
  trackItineraryShare,
  trackPageView,
  trackError,
  checkItineraryAccess
}; 