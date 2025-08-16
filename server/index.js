require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const connectDB = require('./config/db');

// Import middleware first
const { trackAIUsage } = require('./middleware/aiUsageTracker');
const { activityTracker } = require('./middleware/activityTracker');

// Connect to MongoDB (only if MONGODB_URI is provided)
if (process.env.MONGODB_URI) {
  connectDB();
} else {
  console.log('⚠️  MONGODB_URI not found. Admin features will not work.');
  console.log('⚠️  Available environment variables:', Object.keys(process.env).filter(key => !key.includes('SECRET') && !key.includes('KEY')));
}

const app = express();

// Add connection limiting middleware
app.use((req, res, next) => {
  // Add a small delay to prevent overwhelming the server
  setTimeout(next, 10);
});

app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:5173',
    'https://drexcape.onrender.com',
    'https://drexcape-frontend.onrender.com',
    'https://drexcape-web.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session middleware for user tracking with MongoDB store
if (process.env.MONGODB_URI) {
  app.use(session({
    secret: process.env.SESSION_SECRET || 'drexcape-secret-key',
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({ 
      mongoUrl: process.env.MONGODB_URI,
      collectionName: 'sessions',
      ttl: 24 * 60 * 60 // 1 day in seconds
    }),
    cookie: { 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      sameSite: 'lax'
    }
  }));
} else {
  // Fallback to memory store if MongoDB is not available
  app.use(session({
    secret: process.env.SESSION_SECRET || 'drexcape-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      sameSite: 'lax'
    }
  }));
}

app.use(activityTracker);

// Request logger middleware
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path} - Origin: ${req.headers.origin || 'unknown'}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mongodb: !!process.env.MONGODB_URI,
    port: process.env.PORT || 3001,
    environment: process.env.NODE_ENV || 'development',
    cors: {
      allowedOrigins: [
        'http://localhost:3000', 
        'http://localhost:5173',
        'https://drexcape.onrender.com',
        'https://drexcape-frontend.onrender.com',
        'https://drexcape-web.onrender.com'
      ]
    }
  });
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend is working!',
    timestamp: new Date().toISOString()
  });
});

// Import routes
const adminAuthRoutes = require('./routes/adminAuth');
const adminDashboardRoutes = require('./routes/adminDashboard');
const userRoutes = require('./routes/users');
const itineraryRoutes = require('./routes/itineraries');
const promotionalLeadsRoutes = require('./routes/promotionalLeads');
const blogRoutes = require('./routes/blogs');
const analyticsRoutes = require('./routes/analytics');
const packageRoutes = require('./routes/packages');
const proxy = require('express-http-proxy');

// Simple image proxy endpoint
app.get('/api/proxy-image', async (req, res) => {
  try {
    const imageUrl = req.query.url;
    if (!imageUrl) {
      return res.status(400).json({ error: 'No URL provided' });
    }

    console.log('Proxying image:', imageUrl);
    
    const response = await axios.get(imageUrl, {
      responseType: 'stream',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    // Set appropriate headers
    res.setHeader('Content-Type', response.headers['content-type'] || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    
    // Pipe the image data to the response
    response.data.pipe(res);
    
  } catch (error) {
    console.error('Image proxy error:', error.message);
    res.status(500).json({ error: 'Failed to load image' });
  }
});

// Helper function to get the correct base URL for image proxy
function getImageProxyBaseUrl() {
  return process.env.NODE_ENV === 'production' || process.env.RENDER 
    ? 'https://drexcape.onrender.com' 
    : `http://localhost:${process.env.PORT || 3001}`;
}

// Google Places image proxy endpoint
app.get('/api/proxy-google-image', async (req, res) => {
  try {
    const { photoreference, maxwidth, maxheight, key } = req.query;
    
    if (!photoreference || !key) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const googleImageUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxwidth || 400}&maxheight=${maxheight || 300}&photoreference=${photoreference}&key=${key}`;
    
    console.log('Proxying Google Places image:', googleImageUrl);
    
    const response = await axios.get(googleImageUrl, {
      responseType: 'stream',
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://maps.googleapis.com/'
      }
    });

    // Set appropriate headers
    res.setHeader('Content-Type', response.headers['content-type'] || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Pipe the image data to the response
    response.data.pipe(res);
    
  } catch (error) {
    console.error('Google Places image proxy error:', error.message);
    res.status(500).json({ error: 'Failed to load Google Places image' });
  }
});

// Debug endpoint for session inspection (development only)
if (process.env.NODE_ENV === 'development') {
  app.get('/api/debug/session', (req, res) => {
    res.json({
      sessionId: req.sessionID,
      sessionData: req.session,
      cookies: req.headers.cookie,
      userAgent: req.headers['user-agent']
    });
  });
}

// Check user access status
app.get('/api/user/access-status', (req, res) => {
  try {
    const hasSessionAccess = !!(req.session?.userId || req.session?.userPhone);
    const hasCookieAccess = req.headers.cookie && req.headers.cookie.includes('drexcape_user_data');
    
    res.json({
      hasAccess: hasSessionAccess || hasCookieAccess,
      sessionAccess: hasSessionAccess,
      cookieAccess: hasCookieAccess,
      sessionData: {
        userId: req.session?.userId,
        userPhone: req.session?.userPhone
      }
    });
  } catch (error) {
    console.error('Error checking access status:', error);
    res.status(500).json({ error: 'Failed to check access status' });
  }
});

// Import models
const Itinerary = require('./models/Itinerary');
const ItineraryDetails = require('./models/ItineraryDetails');
const SearchHistory = require('./models/SearchHistory');

// Import formatting function
const { processItineraryDetails } = require('./routes/itineraries');

// Remove all previous model configs and keys
const GEMINI_25_FLASH_LITE_API_KEY = process.env.GEMINI_25_FLASH_LITE_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

// Fallback itinerary generator function
const generateFallbackItineraries = (from, to, days, travellers) => {
  console.log('🔄 Generating fallback itineraries for:', { from, to, days, travellers });
  
  // Determine appropriate transportation mode
  const transportMode = getTransportMode(from, to);
  const transportModeText = transportMode === 'flight' ? 'flight' : transportMode === 'train' ? 'train' : 'bus';
  
  // Adjust base price based on transportation mode
  const transportBasePrice = transportMode === 'flight' ? 8000 : transportMode === 'train' ? 2000 : 1000;
  const basePrice = transportBasePrice + 7000; // transport + hotel base
  const pricePerDay = 3000; // Additional cost per day
  const totalPrice = (basePrice + (days - 1) * pricePerDay) * travellers;
  
  const commonDestinations = {
    'Goa': ['Panaji', 'Calangute', 'Anjuna', 'Old Goa'],
    'Mumbai': ['Gateway of India', 'Marine Drive', 'Juhu Beach', 'Elephanta Caves'],
    'Delhi': ['Red Fort', 'Qutub Minar', 'India Gate', 'Humayun\'s Tomb'],
    'Dubai': ['Burj Khalifa', 'Palm Jumeirah', 'Dubai Mall', 'Dubai Frame'],
    'Agra': ['Taj Mahal', 'Agra Fort', 'Fatehpur Sikri', 'Mehtab Bagh'],
    'Jaipur': ['Amber Fort', 'City Palace', 'Hawa Mahal', 'Jantar Mantar'],
    'Varanasi': ['Ghats', 'Kashi Vishwanath Temple', 'Sarnath', 'Dashashwamedh Ghat'],
    'Kerala': ['Munnar', 'Alleppey', 'Kochi', 'Thekkady'],
    'Rajasthan': ['Jaipur', 'Udaipur', 'Jodhpur', 'Jaisalmer'],
    'Singapore': ['Marina Bay Sands', 'Gardens by the Bay', 'Sentosa Island', 'Universal Studios'],
    'Thailand': ['Grand Palace', 'Wat Phra Kaew', 'Chatuchak Market', 'Khao San Road'],
    'Maldives': ['Male', 'Maafushi', 'Hulhumale', 'Artificial Beach'],
    'Sri Lanka': ['Sigiriya', 'Temple of the Tooth', 'Galle Fort', 'Ella'],
    'Nepal': ['Kathmandu Durbar Square', 'Pashupatinath Temple', 'Boudhanath Stupa', 'Swayambhunath'],
    'Bhutan': ['Tiger\'s Nest', 'Punakha Dzong', 'Thimphu', 'Paro Valley']
  };
  
  // Find the best matching destination (case-insensitive)
  const toLower = to.toLowerCase();
  let destinations = [to];
  let places = [to];
  
  // Try to find a matching destination
  for (const [dest, placesList] of Object.entries(commonDestinations)) {
    if (dest.toLowerCase() === toLower || dest.toLowerCase().includes(toLower) || toLower.includes(dest.toLowerCase())) {
      destinations = [dest];
      places = placesList.slice(0, Math.min(days, placesList.length));
      break;
    }
  }
  
  // If no match found, use the original destination
  if (destinations[0] === to && places[0] === to) {
    places = [to, `${to} City Center`, `${to} Main Attractions`].slice(0, Math.min(days, 3));
  }
  
  console.log('📍 Selected destinations and places:', { destinations, places });
  
  const packages = [
    {
      packageName: `${to} Adventure Package`,
      days: days,
      destinations: [to],
      placesToVisit: places,
      highlights: ['Guided tours', 'Local experiences', 'Cultural immersion'],
      price: totalPrice,
      details: `**Day 1: Arrival & Introduction**\\nMorning: • Arrive at ${to} ${transportMode === 'flight' ? 'Airport' : transportMode === 'train' ? 'Railway Station' : 'Bus Terminal'}, transfer to hotel.\\n• Check-in and freshen up.\\n\\nAfternoon: • Lunch at local restaurant.\\n• Orientation tour of ${to}.\\n\\nEvening: • Welcome dinner at hotel.\\n• Rest and prepare for next day.\\n\\n**Day 2: Cultural Exploration**\\nMorning: • Breakfast at hotel.\\n• Visit ${places[0] || 'main attraction'}.\\n\\nAfternoon: • Lunch at local eatery.\\n• Explore ${places[1] || 'cultural sites'}.\\n\\nEvening: • Dinner at traditional restaurant.\\n• Cultural performance (if available).\\n\\n**Day 3: Adventure & Departure**\\nMorning: • Breakfast at hotel.\\n• Visit ${places[2] || 'remaining attractions'}.\\n\\nAfternoon: • Lunch at local restaurant.\\n• Transfer to ${transportMode === 'flight' ? 'airport' : transportMode === 'train' ? 'railway station' : 'bus terminal'} for departure.\\n\\nAccommodation\\n${days}-night stay in comfortable hotels\\n\\nTransport Details\\n${transportModeText.charAt(0).toUpperCase() + transportModeText.slice(1)}s and local transfers included\\n\\nActivities Included\\nGuided tours, local experiences, cultural immersion\\n\\nMeals\\nDaily breakfast and some meals included\\n\\nTerms\\nPrices inclusive of taxes, subject to availability`
    },
    {
      packageName: `${to} Luxury Escape`,
      days: days,
      destinations: [to],
      placesToVisit: places,
      highlights: ['Premium accommodation', 'Exclusive experiences', 'Personal guide'],
      price: Math.round(totalPrice * 1.5),
      details: `**Day 1: Luxury Arrival**\\nMorning: • Private ${transportMode} transfer to luxury hotel.\\n• Champagne welcome and check-in.\\n\\nAfternoon: • Gourmet lunch at hotel restaurant.\\n• Private city tour with expert guide.\\n\\nEvening: • Fine dining experience.\\n• Luxury spa treatment.\\n\\n**Day 2: Exclusive Experiences**\\nMorning: • Premium breakfast in room.\\n• Private access to ${places[0] || 'exclusive sites'}.\\n\\nAfternoon: • Michelin-starred lunch.\\n• Exclusive ${places[1] || 'cultural experience'}.\\n\\nEvening: • Private dinner with local chef.\\n• Luxury accommodation.\\n\\n**Day 3: Premium Departure**\\nMorning: • Luxury breakfast.\\n• Final exclusive experience.\\n\\nAfternoon: • Premium lunch.\\n• Private transfer to ${transportMode === 'flight' ? 'airport' : transportMode === 'train' ? 'railway station' : 'bus terminal'}.\\n\\nAccommodation\\n${days}-night stay in luxury hotels\\n\\nTransport Details\\nPremium ${transportModeText}s and private transfers\\n\\nActivities Included\\nExclusive experiences, personal guides\\n\\nMeals\\nAll meals included at fine restaurants\\n\\nTerms\\nPremium package with exclusive access`
    },
    {
      packageName: `${to} Budget Explorer`,
      days: days,
      destinations: [to],
      placesToVisit: places,
      highlights: ['Affordable stays', 'Local transport', 'Authentic experiences'],
      price: Math.round(totalPrice * 0.7),
      details: `**Day 1: Budget Arrival**\\nMorning: • Arrive at ${to} ${transportMode === 'flight' ? 'Airport' : transportMode === 'train' ? 'Railway Station' : 'Bus Terminal'}, take local transport to hotel.\\n• Check-in at budget hotel.\\n\\nAfternoon: • Local lunch at street food stall.\\n• Self-guided walking tour of ${to}.\\n\\nEvening: • Budget dinner at local restaurant.\\n• Explore local markets.\\n\\n**Day 2: Affordable Exploration**\\nMorning: • Budget breakfast at hotel.\\n• Visit ${places[0] || 'main attraction'} using local transport.\\n\\nAfternoon: • Local lunch at popular eatery.\\n• Explore ${places[1] || 'cultural sites'} independently.\\n\\nEvening: • Street food dinner.\\n• Free time for local experiences.\\n\\n**Day 3: Budget Departure**\\nMorning: • Simple breakfast.\\n• Final budget-friendly activities.\\n\\nAfternoon: • Local lunch.\\n• Take local transport to ${transportMode === 'flight' ? 'airport' : transportMode === 'train' ? 'railway station' : 'bus terminal'}.\\n\\nAccommodation\\n${days}-night stay in budget hotels\\n\\nTransport Details\\nEconomy ${transportModeText}s and local transport\\n\\nActivities Included\\nSelf-guided tours, local experiences\\n\\nMeals\\nSome meals included, local dining options\\n\\nTerms\\nBudget-friendly package with great value`
    },
    {
      packageName: `${to} Cultural Heritage`,
      days: days,
      destinations: [to],
      placesToVisit: places,
      highlights: ['Heritage sites', 'Cultural tours', 'Traditional experiences'],
      price: Math.round(totalPrice * 1.2),
      details: `**Day 1: Heritage Arrival**\\nMorning: • Arrive at ${to} ${transportMode === 'flight' ? 'Airport' : transportMode === 'train' ? 'Railway Station' : 'Bus Terminal'}, transfer to heritage hotel.\\n• Traditional welcome ceremony.\\n\\nAfternoon: • Heritage lunch at traditional restaurant.\\n• Guided tour of ${places[0] || 'heritage sites'}.\\n\\nEvening: • Cultural dinner with traditional music.\\n• Heritage storytelling session.\\n\\n**Day 2: Cultural Immersion**\\nMorning: • Traditional breakfast at heritage property.\\n• Visit ${places[1] || 'cultural landmarks'} with expert guide.\\n\\nAfternoon: • Traditional lunch at local family home.\\n• Cultural workshop (crafts/music/dance).\\n\\nEvening: • Heritage dinner with local family.\\n• Traditional cultural performance.\\n\\n**Day 3: Heritage Departure**\\nMorning: • Traditional breakfast.\\n• Final heritage site visit.\\n\\nAfternoon: • Farewell traditional lunch.\\n• Transfer to ${transportMode === 'flight' ? 'airport' : transportMode === 'train' ? 'railway station' : 'bus terminal'} with cultural insights.\\n\\nAccommodation\\n${days}-night stay in heritage properties\\n\\nTransport Details\\nComfortable ${transportModeText}s and guided tours\\n\\nActivities Included\\nHeritage tours, cultural experiences\\n\\nMeals\\nTraditional meals and cultural dining experiences\\n\\nTerms\\nHeritage-focused package with cultural insights`
    },
    {
      packageName: `${to} Nature & Wildlife`,
      days: days,
      destinations: [to],
      placesToVisit: places,
      highlights: ['Nature trails', 'Wildlife spotting', 'Eco-friendly stays'],
      price: Math.round(totalPrice * 1.1),
      details: `**Day 1: Nature Arrival**\\nMorning: • Arrive at ${to} ${transportMode === 'flight' ? 'Airport' : transportMode === 'train' ? 'Railway Station' : 'Bus Terminal'}, eco-friendly transfer to resort.\\n• Nature orientation and safety briefing.\\n\\nAfternoon: • Organic lunch at eco-resort.\\n• Guided nature trail in ${places[0] || 'natural surroundings'}.\\n\\nEvening: • Sustainable dinner at resort.\\n• Stargazing and nature sounds.\\n\\n**Day 2: Wildlife & Adventure**\\nMorning: • Organic breakfast at resort.\\n• Wildlife spotting at ${places[1] || 'wildlife sanctuary'}.\\n\\nAfternoon: • Local organic lunch.\\n• Adventure activities (trekking/bird watching).\\n\\nEvening: • Eco-friendly dinner.\\n• Campfire with nature stories.\\n\\n**Day 3: Nature Departure**\\nMorning: • Sunrise nature walk.\\n• Organic breakfast.\\n\\nAfternoon: • Final eco-friendly activities.\\n• Sustainable transfer to ${transportMode === 'flight' ? 'airport' : transportMode === 'train' ? 'railway station' : 'bus terminal'}.\\n\\nAccommodation\\n${days}-night stay in eco-resorts\\n\\nTransport Details\\nNature-friendly ${transportModeText}s and eco-transport\\n\\nActivities Included\\nWildlife tours, nature trails, eco-activities\\n\\nMeals\\nOrganic and local cuisine included\\n\\nTerms\\nEco-friendly package with nature conservation focus`
    }
  ];
  
  return packages;
};

// Import the new image service
const ImageService = require('./services/imageService');

// Generate and save basic itineraries
app.post('/api/generate-itinerary', trackAIUsage('generate-itinerary'), async (req, res) => {
      const { from, to, departureDate, returnDate, travellers, priceRange } = req.body;
  
  console.log('Received dates:', { departureDate, returnDate });
  console.log('Received priceRange:', priceRange);
  
  const startTime = Date.now();

  // Calculate days from dates with validation
  const startDate = new Date(departureDate);
  const endDate = new Date(returnDate);
  
  // Validate dates
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return res.status(400).json({ error: 'Invalid date format provided' });
  }
  
  const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

  // Determine appropriate transportation mode
  const transportMode = getTransportMode(from, to);
  const transportModeText = transportMode === 'flight' ? 'flight' : transportMode === 'train' ? 'train' : 'bus';
  const transportCostRange = transportMode === 'flight' ? '₹8k-12k pp (budget), ₹15k-20k pp (luxury)' : 
                            transportMode === 'train' ? '₹1k-2k pp (budget), ₹3k-5k pp (luxury)' : 
                            '₹500-1k pp (budget), ₹1.5k-2.5k pp (luxury)';

  // Stage 1: Professional package generation (web-optimized)
  const basicPrompt = `As a professional travel planner, create 3 package options (budget/mid-range/luxury) for ${days}-day ${to} trip from ${from} for ${travellers} travelers.

**Transportation Mode:** ${transportModeText.toUpperCase()} (recommended for this route)
**Expected Price Guidelines (estimates only):**
- ${transportModeText.charAt(0).toUpperCase() + transportModeText.slice(1)}s: ${transportCostRange}
- Hotels: ₹1.5k-3k/night (budget), ₹7k-10k/night (luxury)
- Daily Expenses: ₹1k-1.5k pp (budget), ₹3k-5k pp (luxury)

**Return Strict JSON:**
[
{
  "packageName": "string - catchy title",
    "packageType": "budget/mid-range/luxury",
    "summary": "40-char teaser description",
    "pricePP": number,
    "priceBreakdown": {
      "${transportModeText}s": number,
      "hotel": number,
      "meals": number,
      "activities": number
    },
    "hotelExample": {
      "name": "string (real hotel name)",
      "type": "3-star/4-star/5-star",
      "location": "string (specific area)"
    },
    "topAttractions": ["max 3 specific attractions"],
    "coverImageQuery": "scenic ${to} location",
    "duration": "${days} days, ${days-1} nights",
    "groupSize": "max ${travellers} travelers",
    "inclusions": ["array of 3-4 key inclusions"],
    "exclusions": ["array of 2-3 key exclusions"]
  }
]

Return ONLY valid JSON array. No explanations.`;

// ===== COMPLETE AI PROMPT LOGGING =====
console.log('\n🤖 ===== STAGE 1: BASIC PACKAGES PROMPT =====');
console.log('📝 PROMPT LENGTH:', basicPrompt.length, 'characters');
console.log('📝 PROMPT CONTENT:');
console.log('='.repeat(80));
console.log(basicPrompt);
console.log('='.repeat(80));
console.log('🤖 ===== END OF BASIC PROMPT =====\n');



// Helper to determine appropriate transportation mode based on route
function getTransportMode(from, to) {
    const fromLower = from.toLowerCase();
    const toLower = to.toLowerCase();
    
    // Define route categories
    const shortDistanceRoutes = [
      ['delhi', 'agra'], ['delhi', 'jaipur'], ['delhi', 'mathura'], ['delhi', 'varanasi'],
      ['mumbai', 'pune'], ['mumbai', 'nashik'], ['mumbai', 'aurangabad'],
      ['bangalore', 'mysore'], ['bangalore', 'chennai'], ['bangalore', 'hyderabad'],
      ['kolkata', 'darjeeling'], ['kolkata', 'varanasi'], ['kolkata', 'bhubaneswar'],
      ['chennai', 'pondicherry'], ['chennai', 'madurai'], ['chennai', 'trichy'],
      ['hyderabad', 'warangal'], ['hyderabad', 'vijayawada'],
      ['pune', 'mahabaleshwar'], ['pune', 'lonavala'], ['pune', 'khandala'],
      ['ahmedabad', 'vadodara'], ['ahmedabad', 'surat'],
      ['jaipur', 'udaipur'], ['jaipur', 'jodhpur'], ['jaipur', 'ajmer']
    ];
    
    const mediumDistanceRoutes = [
      ['delhi', 'mumbai'], ['delhi', 'bangalore'], ['delhi', 'kolkata'], ['delhi', 'chennai'],
      ['mumbai', 'bangalore'], ['mumbai', 'kolkata'], ['mumbai', 'chennai'],
      ['bangalore', 'kolkata'], ['bangalore', 'delhi'], ['bangalore', 'mumbai'],
      ['kolkata', 'mumbai'], ['kolkata', 'bangalore'], ['kolkata', 'delhi'],
      ['chennai', 'bangalore'], ['chennai', 'mumbai'], ['chennai', 'delhi']
    ];
    
    const longDistanceRoutes = [
      ['delhi', 'goa'], ['mumbai', 'goa'], ['bangalore', 'goa'], ['chennai', 'goa'],
      ['delhi', 'kerala'], ['mumbai', 'kerala'], ['bangalore', 'kerala'],
      ['delhi', 'srinagar'], ['mumbai', 'srinagar'], ['delhi', 'leh'],
      ['delhi', 'shimla'], ['mumbai', 'shimla'], ['delhi', 'manali']
    ];
    
    const internationalRoutes = [
      ['delhi', 'singapore'], ['mumbai', 'singapore'], ['bangalore', 'singapore'], ['chennai', 'singapore'],
      ['delhi', 'bangkok'], ['mumbai', 'bangkok'], ['bangalore', 'bangkok'], ['chennai', 'bangkok'],
      ['delhi', 'dubai'], ['mumbai', 'dubai'], ['bangalore', 'dubai'], ['chennai', 'dubai'],
      ['delhi', 'london'], ['mumbai', 'london'], ['bangalore', 'london'], ['chennai', 'london'],
      ['delhi', 'new york'], ['mumbai', 'new york'], ['bangalore', 'new york'], ['chennai', 'new york'],
      ['delhi', 'tokyo'], ['mumbai', 'tokyo'], ['bangalore', 'tokyo'], ['chennai', 'tokyo'],
      ['delhi', 'sydney'], ['mumbai', 'sydney'], ['bangalore', 'sydney'], ['chennai', 'sydney'],
      ['delhi', 'paris'], ['mumbai', 'paris'], ['bangalore', 'paris'], ['chennai', 'paris'],
      ['delhi', 'hong kong'], ['mumbai', 'hong kong'], ['bangalore', 'hong kong'], ['chennai', 'hong kong'],
      ['delhi', 'kuala lumpur'], ['mumbai', 'kuala lumpur'], ['bangalore', 'kuala lumpur'], ['chennai', 'kuala lumpur'],
      ['delhi', 'bali'], ['mumbai', 'bali'], ['bangalore', 'bali'], ['chennai', 'bali']
    ];
    
    // Check if route matches any predefined categories
    for (const route of shortDistanceRoutes) {
      if ((route[0] === fromLower && route[1] === toLower) || 
          (route[0] === toLower && route[1] === fromLower)) {
        return 'bus';
      }
    }
    
    for (const route of mediumDistanceRoutes) {
      if ((route[0] === fromLower && route[1] === toLower) || 
          (route[0] === toLower && route[1] === fromLower)) {
        return 'train';
      }
    }
    
    for (const route of longDistanceRoutes) {
      if ((route[0] === fromLower && route[1] === toLower) || 
          (route[0] === toLower && route[1] === fromLower)) {
        return 'flight';
      }
    }
    
    for (const route of internationalRoutes) {
      if ((route[0] === fromLower && route[1] === toLower) || 
          (route[0] === toLower && route[1] === fromLower)) {
        return 'flight';
      }
    }
    
    // Default logic based on common patterns
    if (fromLower.includes('delhi') || toLower.includes('delhi')) {
      if (toLower.includes('goa') || toLower.includes('kerala') || toLower.includes('srinagar') || 
          toLower.includes('leh') || toLower.includes('shimla') || toLower.includes('manali')) {
        return 'flight';
      } else if (toLower.includes('agra') || toLower.includes('jaipur') || toLower.includes('mathura')) {
        return 'bus';
      } else {
        return 'train';
      }
    }
    
    if (fromLower.includes('mumbai') || toLower.includes('mumbai')) {
      if (toLower.includes('goa') || toLower.includes('kerala')) {
        return 'flight';
      } else if (toLower.includes('pune') || toLower.includes('nashik')) {
        return 'bus';
      } else {
        return 'train';
      }
    }
    
    if (fromLower.includes('bangalore') || toLower.includes('bangalore')) {
      if (toLower.includes('goa') || toLower.includes('kerala')) {
        return 'flight';
      } else if (toLower.includes('mysore')) {
        return 'bus';
      } else {
        return 'train';
      }
    }
    
    // General fallback based on distance estimation
    const distanceKeywords = ['goa', 'kerala', 'srinagar', 'leh', 'shimla', 'manali', 'darjeeling'];
    const internationalKeywords = ['singapore', 'bangkok', 'dubai', 'london', 'new york', 'tokyo', 'sydney', 'paris', 'hong kong', 'kuala lumpur', 'bali', 'thailand', 'malaysia', 'indonesia', 'australia', 'uk', 'usa', 'japan', 'france'];
    
    if (distanceKeywords.some(keyword => fromLower.includes(keyword) || toLower.includes(keyword))) {
      return 'flight';
    }
    
    if (internationalKeywords.some(keyword => fromLower.includes(keyword) || toLower.includes(keyword))) {
      return 'flight';
    }
    
    // Default to train for most routes
    return 'train';
  }

  // Helper to generate a hash code for strings
  function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Helper to generate AI-powered image search terms
  async function generateImageSearchTerms(place, destination, highlights = []) {
    try {
      const GEMINI_25_FLASH_LITE_API_KEY = process.env.GEMINI_25_FLASH_LITE_API_KEY;
      if (!GEMINI_25_FLASH_LITE_API_KEY) {
        console.log('⚠️ No Gemini API key, using fallback search terms');
        return [place, destination, `${place} landmark`, `${destination} tourist attraction`];
      }

      const prompt = `Generate 5 specific and diverse image search terms for travel photography. 
      
      Context:
      - Place: ${place || 'N/A'}
      - Destination: ${destination || 'N/A'}
      - Highlights: ${highlights.join(', ') || 'N/A'}
      
      Requirements:
      1. Focus on famous landmarks, tourist attractions, and scenic spots
      2. Include architectural, cultural, and natural beauty elements
      3. Make each search term unique and specific
      4. Prioritize the most photogenic and recognizable locations
      5. Use descriptive terms that would return high-quality travel photos
      
      Return only a JSON array of 5 search terms, no other text:
      ["search term 1", "search term 2", "search term 3", "search term 4", "search term 5"]`;

    const response = await axios.post(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent',
        {
          contents: [{ role: 'user', parts: [{ text: prompt }] }]
        },
        {
          headers: { 'Content-Type': 'application/json' },
          params: { key: GEMINI_25_FLASH_LITE_API_KEY },
          timeout: 15000
        }
      );

      const content = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const jsonMatch = content.match(/\[.*\]/s);
      
      if (jsonMatch) {
        const searchTerms = JSON.parse(jsonMatch[0]);
        console.log(`🤖 AI generated search terms for ${place || destination}:`, searchTerms);
        return searchTerms;
      }
    } catch (error) {
      console.log('❌ AI search terms generation failed:', error.message);
    }

    // Fallback search terms
    const fallbackTerms = [
      place,
      destination,
      `${place} landmark`,
      `${destination} tourist attraction`,
      `${place} famous places`,
      `${destination} sightseeing`,
      `${place} architecture`,
      `${destination} cultural sites`
    ].filter(term => term && term !== 'N/A');

    console.log(`📝 Using fallback search terms for ${place || destination}:`, fallbackTerms);
    return fallbackTerms;
  }



  try {
    // Check if API key is configured
    if (!GEMINI_25_FLASH_LITE_API_KEY) {
      console.error('❌ GEMINI_25_FLASH_LITE_API_KEY not configured');
      return res.status(500).json({ error: 'AI service not configured. Please contact support.' });
    }

    console.log('🤖 Calling Gemini API for itinerary generation...');
    
    // ===== REQUEST PARAMETERS LOGGING =====
    console.log('\n🤖 ===== REQUEST PARAMETERS =====');
    console.log('📝 PARAMETERS:');
    console.log('='.repeat(80));
    console.log(JSON.stringify({
      from,
      to,
      departureDate,
      returnDate,
      travellers,
      days,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    }, null, 2));
    console.log('='.repeat(80));
    console.log('🤖 ===== END OF REQUEST PARAMETERS =====\n');
    
    let response;
    try {
      // ===== API REQUEST LOGGING =====
      console.log('\n🤖 ===== API REQUEST DETAILS =====');
      console.log('🌐 API URL:', GEMINI_API_URL);
      console.log('🔑 API Key configured:', !!GEMINI_25_FLASH_LITE_API_KEY);
      console.log('⏱️ Timeout:', '60000ms (60 seconds)');
      console.log('🤖 ===== END OF API REQUEST DETAILS =====\n');
      
      response = await axios.post(
      GEMINI_API_URL,
      {
        contents: [
          {
            role: 'user',
            parts: [{ text: basicPrompt }]
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        params: {
          key: GEMINI_25_FLASH_LITE_API_KEY
          },
          timeout: 60000 // 60 second timeout
        }
      );
    } catch (apiError) {
      console.error('❌ Gemini API error:', apiError.response?.data || apiError.message);
      
      // Check if it's a 503 overload error
      if (apiError.response?.status === 503 && apiError.response?.data?.error?.message?.includes('overloaded')) {
        console.log('🔄 Gemini API is overloaded, using fallback itineraries...');
        
        // Generate fallback itineraries using predefined templates
        const fallbackItineraries = generateFallbackItineraries(from, to, days, travellers);
        
        // Save fallback itineraries to database
        const savedItineraries = [];
        for (let i = 0; i < fallbackItineraries.length; i++) {
          const pkg = fallbackItineraries[i];
          console.log(`📦 Processing fallback itinerary ${i + 1}/${fallbackItineraries.length}: ${pkg.packageName}`);
          
          try {
            // Enhanced image generation for fallback itineraries
            let images = {
              header: '/default-travel.jpg',
              gallery: ['/default-travel.jpg', '/default-travel.jpg', '/default-travel.jpg'],
              accommodation: '/default-travel.jpg'
            };
            
                    try {
          // Use the new image service to get comprehensive images for the package
          const enhancedImages = await ImageService.getImagesForPackage(pkg);
          images = enhancedImages;
          console.log(`🖼️ Enhanced images generated for fallback: ${pkg.packageName}`);
        } catch (imageError) {
          console.log('❌ Failed to generate enhanced images for fallback, using defaults. Error:', imageError.message);
          // Use default images only - no additional API calls to save costs
        }

            console.log('💾 Creating itinerary with data:', {
              title: pkg.packageName,
              destinations: pkg.destinations,
              placesToVisit: pkg.placesToVisit,
              fromLocation: from,
              toLocation: to,
              headerImage: images.header,
              galleryImages: images.gallery,
              accommodationImage: images.accommodation
            });
            
            const itinerary = new Itinerary({
              title: pkg.packageName,
              days: pkg.days,
              destinations: pkg.destinations,
              placesToVisit: pkg.placesToVisit,
              highlights: pkg.highlights,
              price: pkg.price,
              fromLocation: from,
              toLocation: to,
              departureDate: new Date(departureDate),
              returnDate: new Date(returnDate),
              travelers: travellers,
              headerImage: images.header,
              galleryImages: images.gallery,
              accommodationImage: images.accommodation
            });
            
            // console.log(`💾 Saving fallback itinerary to database: ${pkg.packageName}`);
            await itinerary.save();
            // console.log(`✅ Fallback itinerary saved successfully: ${pkg.packageName}`);
            
            savedItineraries.push({
              id: itinerary._id.toString(),
              slug: itinerary.slug,
              itineraryId: itinerary.itineraryId,
              headerImage: images.header,
              galleryImages: images.gallery,
              accommodationImage: images.accommodation,
              ...pkg
            });
          } catch (saveError) {
            console.error('❌ Error saving fallback itinerary:', saveError);
            
            // If it's a duplicate key error, try to save with a unique identifier
            if (saveError.code === 11000 && saveError.keyPattern && saveError.keyPattern.slug) {
              console.log('🔄 Duplicate slug detected in fallback, retrying with unique identifier...');
              try {
                // Add a unique timestamp to the title to ensure unique slug
                const uniqueTitle = `${pkg.packageName}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
                const retryItinerary = new Itinerary({
                  ...itinerary.toObject(),
                  title: uniqueTitle,
                  slug: undefined // Force regeneration of slug
                });
                
                await retryItinerary.save();
                console.log(`✅ Fallback retry successful with unique title: ${uniqueTitle}`);
                
            savedItineraries.push({
                  id: retryItinerary._id.toString(),
                  slug: retryItinerary.slug,
                  itineraryId: retryItinerary.itineraryId,
                  headerImage: images.header,
                  galleryImages: images.gallery,
                  accommodationImage: images.accommodation,
              ...pkg
            });
                continue; // Skip the fallback below
              } catch (retryError) {
                console.error('❌ Fallback retry also failed:', retryError.message);
              }
            }
            
            console.log('⚠️ Skipping fallback itinerary due to save failure. Not returning a temporary ID.');
          }
        }
        
        const processingTime = Date.now() - startTime;
        await req.trackSearch(
          { from, to, departureDate, returnDate, travellers, priceRange },
          processingTime,
          savedItineraries.length
        );
        
        // console.log(`🎉 Successfully processed ${savedItineraries.length} fallback itineraries`);
        // console.log(`⏱️ Total processing time: ${processingTime}ms`);
        
        return res.json({ 
          itineraries: savedItineraries,
          message: 'Itineraries generated using fallback system (AI service temporarily unavailable)'
        });
      } else {
        // Re-throw other API errors
        throw apiError;
      }
    }
    
    console.log('✅ Gemini API response received');
    console.log('📊 Response status:', response.status);
    
    let content = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // ===== STAGE 1 AI RESPONSE LOGGING =====
    console.log('\n🤖 ===== STAGE 1: BASIC PACKAGES RESPONSE =====');
    console.log('📄 RESPONSE LENGTH:', content.length, 'characters');
    console.log('📄 RESPONSE CONTENT:');
    console.log('='.repeat(80));
    console.log(content);
    console.log('='.repeat(80));
    console.log('🤖 ===== END OF BASIC RESPONSE =====\n');
    
    console.log('📄 Raw content length:', content.length);
    console.log('📄 Content preview:', content.substring(0, 200) + '...');
    
    let jsonString = content.replace(/```json|```/g, '').trim();
    const match = jsonString.match(/\[.*\]|\{.*\}/s);
    if (match) jsonString = match[0];
    
    console.log('🔍 Extracted JSON string length:', jsonString.length);
    console.log('🔍 JSON preview:', jsonString.substring(0, 200) + '...');
    
    let json;
    try {
      json = JSON.parse(jsonString);
      console.log('✅ JSON parsed successfully');
      console.log('📦 Number of itineraries:', Array.isArray(json) ? json.length : 'Not an array');
      
      // ===== PARSED BASIC PACKAGES LOGGING =====
      console.log('\n🤖 ===== PARSED BASIC PACKAGES =====');
      console.log('📦 JSON STRUCTURE:');
      console.log('='.repeat(80));
      console.log(JSON.stringify(json, null, 2));
      console.log('='.repeat(80));
      console.log('🤖 ===== END OF BASIC PACKAGES =====\n');
      
    } catch (parseError) {
      console.error('❌ JSON parsing failed:', parseError.message);
      console.error('❌ JSON string:', jsonString);
      return res.status(500).json({ error: 'Failed to parse AI response. Please try again.' });
    }

    // Process basic packages (Stage 1)
    const savedItineraries = [];
    console.log('💾 Processing basic packages...');
    
    for (let i = 0; i < json.length; i++) {
      const pkg = json[i];
      console.log(`📦 Processing basic package ${i + 1}/${json.length}: ${pkg.packageName}`);
      
      try {
        // Generate basic image for header using new structure
        let headerImage = '/default-travel.jpg';
        try {
          // Use coverImageQuery if available, otherwise use first attraction or destination
          const imageQuery = pkg.coverImageQuery || pkg.topAttractions?.[0] || to;
          console.log(`🖼️ Attempting to generate image for: ${imageQuery}`);
          
          const imageUrl = await ImageService.getHeaderImage(imageQuery, to);
          if (imageUrl && imageUrl !== '/default-travel.jpg') {
            headerImage = imageUrl;
            console.log(`✅ Generated header image: ${imageUrl}`);
          } else {
            console.log(`⚠️ No image generated, using default for: ${imageQuery}`);
          }
        } catch (imageError) {
          console.log('❌ Failed to generate header image, using default:', imageError.message);
        }

        // Create professional itinerary with structured data
        const itinerary = new Itinerary({
          title: pkg.packageName,
          days: days, // Use calculated days from date range
          destinations: [from, to],
          placesToVisit: pkg.topAttractions || [],
          highlights: pkg.inclusions || [],
          price: pkg.pricePP,
          fromLocation: from,
          toLocation: to,
          departureDate: new Date(startDate),
          returnDate: new Date(endDate),
          travelers: travellers,
          headerImage: headerImage,
          galleryImages: ['/default-travel.jpg'],
          accommodationImage: '/default-travel.jpg',
          
          // Professional package structure
          packageType: pkg.packageType || 'mid-range',
          summary: pkg.summary,
          pricePP: pkg.pricePP,
          priceBreakdown: pkg.priceBreakdown,
          // hotelExample: pkg.hotelExample, // Temporarily commented out
          topAttractions: pkg.topAttractions,
          duration: pkg.duration,
          groupSize: pkg.groupSize,
          inclusions: pkg.inclusions,
          exclusions: pkg.exclusions,
          
          // Add flag to indicate this needs detailed generation
          needsDetailedGeneration: true
        });
        
        await itinerary.save();
        console.log(`✅ Basic package saved: ${pkg.packageName}`);
        
        savedItineraries.push({
          id: itinerary._id.toString(),
          slug: itinerary.slug,
          itineraryId: itinerary.itineraryId,
          headerImage: headerImage,
          galleryImages: ['/default-travel.jpg'],
          accommodationImage: '/default-travel.jpg',
          needsDetailedGeneration: true,
          
          // Professional structure
          packageName: pkg.packageName,
          packageType: pkg.packageType,
          summary: pkg.summary,
          pricePP: pkg.pricePP,
          priceBreakdown: pkg.priceBreakdown,
          // hotelExample: pkg.hotelExample, // Temporarily commented out
          topAttractions: pkg.topAttractions,
          duration: pkg.duration,
          groupSize: pkg.groupSize,
          inclusions: pkg.inclusions,
          exclusions: pkg.exclusions,
          coverImageQuery: pkg.coverImageQuery,
          destinations: [from, to],
          placesToVisit: pkg.topAttractions || [],
          highlights: pkg.inclusions || [],
          fromLocation: from,
          toLocation: to
        });
      } catch (saveError) {
        console.error('❌ Error saving itinerary to database:', saveError.message);
        console.error('❌ Error code:', saveError.code);
        console.error('❌ Error name:', saveError.name);
        console.error('❌ Full error:', saveError);
        console.error('❌ Itinerary data:', pkg);
        
        // If it's a duplicate key error, try to save with a unique identifier
        if (saveError.code === 11000 && saveError.keyPattern && saveError.keyPattern.slug) {
          console.log('🔄 Duplicate slug detected, retrying with unique identifier...');
          try {
            // Add a unique timestamp to the title to ensure unique slug
            const uniqueTitle = `${pkg.packageName}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
            const retryItinerary = new Itinerary({
              ...itinerary.toObject(),
              title: uniqueTitle,
              slug: undefined // Force regeneration of slug
            });
            
            await retryItinerary.save();
            console.log(`✅ Retry successful with unique title: ${uniqueTitle}`);
        
        savedItineraries.push({
              id: retryItinerary._id.toString(),
              slug: retryItinerary.slug,
              itineraryId: retryItinerary.itineraryId,
          headerImage: '/default-travel.jpg',
              galleryImages: ['/default-travel.jpg'],
          accommodationImage: '/default-travel.jpg',
              needsDetailedGeneration: true,
              
              // Professional structure
              packageName: pkg.packageName,
              packageType: pkg.packageType,
              summary: pkg.summary,
              pricePP: pkg.pricePP,
              priceBreakdown: pkg.priceBreakdown,
              // hotelExample: pkg.hotelExample,
              topAttractions: pkg.topAttractions,
              duration: pkg.duration,
              groupSize: pkg.groupSize,
              inclusions: pkg.inclusions,
              exclusions: pkg.exclusions,
              coverImageQuery: pkg.coverImageQuery,
              destinations: [from, to],
              placesToVisit: pkg.topAttractions || [],
              highlights: pkg.inclusions || [],
              fromLocation: from,
              toLocation: to
            });
            continue; // Skip the fallback below
          } catch (retryError) {
            console.error('❌ Retry also failed:', retryError.message);
          }
        }
        
        console.log('⚠️ Skipping itinerary due to save failure. Not returning a temporary ID.');
      }
    }

    const processingTime = Date.now() - startTime;
    
    // Track the search activity
    await req.trackSearch(
          { from, to, departureDate, returnDate, travellers, priceRange },
      processingTime,
      savedItineraries.length
    );
    
            // console.log(`🎉 Successfully processed ${savedItineraries.length} itineraries`);
        // console.log(`⏱️ Total processing time: ${processingTime}ms`);
    
    // ===== STAGE 1 RESULTS SUMMARY =====
    console.log('\n🤖 ===== STAGE 1: PROFESSIONAL PACKAGES SUMMARY =====');
    console.log('📦 Total professional packages generated:', savedItineraries.length);
    console.log('💾 Total packages saved to database:', savedItineraries.length);
    console.log('📊 Package details:');
    savedItineraries.forEach((it, index) => {
      console.log(`  ${index + 1}. ${it.packageName} (${it.packageType})`);
      console.log(`     💰 Price: ₹${it.pricePP}/person`);
              // console.log(`     🏨 Hotel: ${it.hotelExample?.name} (${it.hotelExample?.type})`);
      console.log(`     🎯 Attractions: ${it.topAttractions?.join(', ')}`);
    });
    console.log('💡 Note: Professional detailed itineraries available on-demand');
    console.log('🤖 ===== END OF STAGE 1 SUMMARY =====\n');
    
    res.json({ 
      itineraries: savedItineraries,
      message: 'Basic packages generated successfully. Detailed information available on demand.',
      stage: 'basic'
    });
  } catch (error) {
    console.error('❌ Critical error in itinerary generation:');
    console.error('❌ Error type:', error.constructor.name);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    
    if (error.response) {
      console.error('❌ API Response error:', error.response.status, error.response.data);
    }
    
    // Track error
    try {
    await req.trackError('itinerary_generation', error.toString(), 'generate_itinerary');
    } catch (trackError) {
      console.error('❌ Failed to track error:', trackError.message);
    }
    
    res.status(500).json({ 
      error: 'Failed to generate itineraries. Please try again.',
      details: error.message
    });
  }
});

// Generate and save detailed itinerary on demand
app.get('/api/itinerary-details/:id', trackAIUsage('itinerary-details'), async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id);
    
    if (!itinerary) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }
    
    // Check if details already exist
    let details = await ItineraryDetails.findOne({ itineraryId: req.params.id });
    
    if (details) {
      // Track itinerary view
      await req.trackItineraryView(
        itinerary._id.toString(),
        itinerary.slug,
        0 // viewDuration will be calculated on frontend
      );
      
      // Format the day-wise plan before sending to frontend
      const formattedDetails = processItineraryDetails(details.toObject());
      return res.json({ details: formattedDetails });
    }
    
    // Track itinerary view
    await req.trackItineraryView(
      itinerary._id.toString(),
      itinerary.slug,
      0 // viewDuration will be calculated on frontend
    );
    
    // Generate new details if not exists
    const userPrompt = `You are an experienced travel agent. Create a complete, day-wise, practical travel itinerary for ${itinerary.days} days for a trip from ${itinerary.fromLocation} to ${itinerary.toLocation} (${itinerary.destinations?.join(', ')}) for ${itinerary.travelers} travelers.

**CRITICAL FOR DAY PLANNING: Each day must have distinct morning, afternoon, and evening activities. Do NOT combine activities into a single description. Each time period should have specific, actionable activities.**

**CRITICAL: Return a JSON object with this EXACT structure:**

**IMPORTANT PRICING NOTE: Always calculate and show price PER PERSON, not total price. The total price provided is for ${itinerary.travelers} travelers, so divide by ${itinerary.travelers} to get per-person cost.**

{
  "title": "string - catchy title",
  "dates": "string - e.g. 19–20 July 2025",
  "duration": "string - e.g. 2 Days, 1 Night",
  "from": "string",
  "to": "string",
  "priceEstimate": "string - e.g. ₹25,000 per person (must specify 'per person')",
  "highlights": ["array of 2-4 main attractions"],
  "transportClass": "string",
  "fullDayWisePlan": [
    {
      "title": "string - day title",
      "emoji": "string - day emoji",
      "morning": "string - morning activities (arrival, breakfast, early activities)",
      "afternoon": "string - afternoon activities (sightseeing, lunch, main activities)",
      "evening": "string - evening activities (dinner, relaxation, night activities)"
    }
  ],
  "accommodation": "string - e.g. 1-night stay at Hotel XYZ, CP",
  "activitiesIncluded": "string - e.g. Sightseeing tickets, guided tours",
  "transportDetails": "string - e.g. Flight timings, airline, class",
  "meals": "string - e.g. Breakfast included",
  "terms": "string - e.g. Price inclusive of taxes",
  "bookingLink": "string - e.g. https://yourbooking.com/package/123",
  "structuredDetails": {
    "accommodationDetails": {
      "hotelName": "string - specific hotel name",
      "hotelType": "string - budget/luxury/resort",
      "nights": number,
      "roomType": "string - room description",
      "amenities": ["array of key amenities"],
      "location": "string - hotel location"
    },
    "transportDetails": {
      "arrival": "string - arrival transport details",
      "departure": "string - departure transport details",
      "local": "string - local transport details",
      "included": ["array of included transport"]
    },
    "mealsDetails": {
      "breakfast": "string - breakfast details",
      "lunch": "string - lunch details",
      "dinner": "string - dinner details",
      "included": ["array of included meals"],
      "recommendations": ["array of restaurant recommendations"]
    },
    "activitiesDetails": {
      "included": ["array of included activities"],
      "optional": ["array of optional activities"],
      "guides": "string - guide information",
      "tickets": "string - ticket information"
    },
    "termsAndConditions": {
      "priceInclusions": ["array of what's included"],
      "priceExclusions": ["array of what's excluded"],
      "cancellation": "string - cancellation policy",
      "validity": "string - offer validity"
    }
  }
}

Package summary to work with:
Title: ${itinerary.title}
Days: ${itinerary.days}
Destinations: ${itinerary.destinations?.join(', ')}
Places to Visit: ${itinerary.placesToVisit?.join(', ')}
Highlights: ${itinerary.highlights?.join(', ')}
Total Price: ${itinerary.price} (for ${itinerary.travelers} travelers)
Price Per Person: ${Math.round(itinerary.price / itinerary.travelers)}
From: ${itinerary.fromLocation}
To: ${itinerary.toLocation}
Travelers: ${itinerary.travelers}

**Example structuredDetails:**
{
  "accommodationDetails": {
    "hotelName": "Hotel Mayfair Darjeeling",
    "hotelType": "luxury",
    "nights": 3,
    "roomType": "Deluxe Room with Mountain View",
    "amenities": ["WiFi", "Restaurant", "Spa", "Mountain View"],
    "location": "Central Darjeeling, 5 minutes from Mall Road"
  },
  "transportDetails": {
    "arrival": "Private airport transfer from Bagdogra Airport (IXB)",
    "departure": "Private transfer to Bagdogra Airport (IXB)",
    "local": "Private car with driver for local sightseeing",
    "included": ["Airport transfers", "Local sightseeing", "Hotel pickups"]
  },
  "mealsDetails": {
    "breakfast": "Daily buffet breakfast at hotel restaurant",
    "lunch": "Lunch at local restaurants (not included)",
    "dinner": "Dinner at hotel or local restaurants (not included)",
    "included": ["Daily breakfast"],
    "recommendations": ["Glenary's Restaurant", "Kunga Restaurant", "Sonam's Kitchen"]
  },
  "activitiesDetails": {
    "included": ["Toy Train ride", "Tea garden visit", "Local market tour"],
    "optional": ["Tiger Hill sunrise", "Adventure sports", "Spa treatments"],
    "guides": "Professional English-speaking guide for sightseeing",
    "tickets": "All monument and attraction entry tickets included"
  },
  "termsAndConditions": {
    "priceInclusions": ["Hotel accommodation", "Daily breakfast", "Airport transfers", "Local transport", "Guide services"],
    "priceExclusions": ["Airfare", "Lunch and dinner", "Personal expenses", "Optional activities"],
    "cancellation": "Free cancellation up to 7 days before travel",
    "validity": "Valid for travel until December 2025"
  }
}

Return ONLY valid JSON. Do not include any explanation, comments, or markdown code blocks. All property names and strings must use double quotes.`;

    const response = await axios.post(
      GEMINI_API_URL,
      {
        contents: [
          {
            role: 'user',
            parts: [{ text: userPrompt }]
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        params: {
          key: GEMINI_25_FLASH_LITE_API_KEY
        }
      }
    );
    
    let content = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    let jsonString = content.replace(/```json|```/g, '').trim();
    const match = jsonString.match(/\{.*\}/s);
    if (match) jsonString = match[0];
    let json = JSON.parse(jsonString);
    
    // Save detailed itinerary to database
    details = new ItineraryDetails({
      itineraryId: req.params.id,
      title: json.title,
      dates: json.dates,
      duration: json.duration,
      priceEstimate: json.priceEstimate,
      transportClass: json.transportClass,
      fullDayWisePlan: json.fullDayWisePlan,
      accommodation: json.accommodation,
      activitiesIncluded: json.activitiesIncluded,
      transportDetails: json.transportDetails,
      meals: json.meals,
      terms: json.terms,
      bookingLink: json.bookingLink,
      structuredDetails: json.structuredDetails
    });
    
    await details.save();
    
    // Format the day-wise plan before sending to frontend
    const formattedDetails = processItineraryDetails(details.toObject());
    res.json({ details: formattedDetails });
  } catch (error) {
    console.error(error?.response?.data || error);
    res.status(500).json({ error: error.toString() });
  }
});

// CRUD Operations for Itineraries

// Get all itineraries (for admin)
app.get('/api/itineraries', async (req, res) => {
  try {
    const itineraries = await Itinerary.find().sort({ createdAt: -1 });
    res.json({ itineraries });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Get single itinerary by ID
app.get('/api/itinerary/:id', async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id);
    if (!itinerary) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }
    
    // Track itinerary view
    await req.trackItineraryView(
      itinerary._id.toString(),
      itinerary.slug,
      0 // viewDuration will be calculated on frontend
    );
    
    res.json({ itinerary });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Get detailed itinerary (if exists)
app.get('/api/itinerary-details/:id', async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id);
    if (!itinerary) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }

    // Check if detailed information exists
    if (itinerary.needsDetailedGeneration) {
      return res.status(404).json({ error: 'Detailed information not yet generated' });
    }

    // Format the detailed information
    const formattedDetails = {
      // Legacy fields for backward compatibility
      dayPlans: itinerary.dayPlans || JSON.parse(itinerary.details || '[]'),
      accommodation: itinerary.accommodation || itinerary.accommodationDetails,
      transport: itinerary.transport || itinerary.transportDetails,
      meals: itinerary.mealsDetails,
      activities: itinerary.activitiesDetails,
      terms: itinerary.termsAndConditions,
      
      // New structured format
      structuredDetails: {
        accommodationDetails: itinerary.accommodation || itinerary.accommodationDetails || {},
        transportDetails: itinerary.transport || itinerary.transportDetails || {},
        mealsDetails: itinerary.mealsDetails || {},
        activitiesDetails: itinerary.activitiesDetails || {},
        termsAndConditions: itinerary.termsAndConditions || {}
      },
      
      // Additional fields
      title: itinerary.tripTitle || itinerary.title,
      fullDayWisePlan: itinerary.dayPlans || JSON.parse(itinerary.details || '[]'),
      priceEstimate: itinerary.priceSummary || `₹${Math.round(itinerary.price / itinerary.travelers).toLocaleString()} per person`,
      mealCostEstimates: itinerary.mealCostEstimates,
      whatsIncluded: itinerary.whatsIncluded || [],
      whatsNotIncluded: itinerary.whatsNotIncluded || [],
      cancellationPolicy: itinerary.cancellationPolicy,
      accessibility: itinerary.accessibility,
      languages: itinerary.languages,
      meetingPoint: itinerary.meetingPoint,
      startTime: itinerary.startTime,
      endTime: itinerary.endTime
    };

    res.json({ details: formattedDetails });
  } catch (error) {
    console.error('❌ Error fetching detailed information:', error);
    res.status(500).json({ error: 'Failed to fetch detailed information' });
  }
});

// Generate detailed itinerary on-demand (Stage 2)
app.post('/api/itinerary/:id/generate-details', async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id);
    if (!itinerary) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }

    // Check if details already exist
    if (!itinerary.needsDetailedGeneration) {
      return res.json({ 
        message: 'Detailed information already exists',
        itinerary 
      });
    }

    console.log(`🤖 Generating detailed information for: ${itinerary.title}`);

    // Determine appropriate transportation mode for detailed generation
    const transportMode = getTransportMode(itinerary.fromLocation, itinerary.toLocation);
    const transportModeText = transportMode === 'flight' ? 'flight' : transportMode === 'train' ? 'train' : 'bus';
    const transportDetails = transportMode === 'flight' ? 
      `${transportModeText} details with airline, timing, and class` : 
      transportMode === 'train' ? 
      `${transportModeText} details with train number, timing, and class` : 
      `${transportModeText} details with timing and operator`;

    // Stage 2: Professional detailed itinerary prompt
    const detailedPrompt = `Generate EXACT ${itinerary.days}-day itinerary for ${itinerary.title} package in ${itinerary.toLocation} from ${itinerary.fromLocation}.

**Transportation Mode:** ${transportModeText.toUpperCase()} (recommended for this route)

**Required Structure:**
{
  "tripTitle": "string - professional title",
  "priceSummary": "₹XX,XXX per person (total ₹${Math.round(itinerary.price).toLocaleString()} for ${itinerary.travelers} people)",
  "transport": {
    "toDestination": "${transportDetails}",
    "local": "Local transport type (private car/public transport)",
    "pickupDetails": "Pickup time and location",
    "dropoffDetails": "Drop-off time and location"
  },
  "accommodation": {
    "name": "Real hotel name (e.g., Taj Palace, Oberoi, Leela Palace, ITC Grand, Marriott, Hyatt, Radisson, Novotel)",
    "type": "3-star/4-star/5-star based on package type",
    "location": "Specific area/location in ${itinerary.toLocation}",
    "amenities": ["Free WiFi", "Pool", "Breakfast", "Restaurant", "Spa", "Gym", "Room Service", "Air Conditioning"],
    "costPerNight": number (expected budget: 2000-4000, mid-range: 5000-8000, luxury: 10000-20000),
    "roomType": "Deluxe Room/Standard Room/Suite based on package type"
  },
  "dayPlans": [
    {
      "day": 1,
      "theme": "Arrival & City Introduction",
      "morning": "Activity with timing (e.g., 9:00 AM - Airport pickup)",
      "afternoon": "Activity with timing (e.g., 2:00 PM - Hotel check-in)",
      "evening": "Activity with timing (e.g., 6:00 PM - Dinner at local restaurant)",
      "meals": "Breakfast/Lunch/Dinner inclusions",
      "photoQuery": "specific attraction at golden hour",
      "duration": "8 hours total"
    }
  ],
  "mealCostEstimates": {
    "budget": "Expected ₹500-700 pp/day",
    "mid-range": "Expected ₹1,000-1,500 pp/day", 
    "luxury": "Expected ₹2,500+ pp/day"
  },
  "whatsIncluded": [
    "Professional English-speaking guide",
    "Hotel accommodation",
    "Daily breakfast",
    "Transportation",
    "Sightseeing tickets"
  ],
  "whatsNotIncluded": [
    "Lunch and dinner",
    "Personal expenses",
    "Optional activities",
    "Tips and gratuities"
  ],
  "cancellationPolicy": "Free cancellation up to 24 hours before travel",
  "accessibility": "Not wheelchair accessible, Pushchair accessible",
  "groupSize": "Max ${itinerary.travelers} travelers",
  "languages": "English guide, Audio guides available",
  "meetingPoint": "Hotel pickup or central location",
  "startTime": "8:30 AM",
  "endTime": "6:30 PM"
}

Return ONLY valid JSON. No explanations.`;

    // Call AI for detailed generation
    const response = await axios.post(
      GEMINI_API_URL,
      {
        contents: [{ role: 'user', parts: [{ text: detailedPrompt }] }]
      },
      {
        headers: { 'Content-Type': 'application/json' },
        params: { key: GEMINI_25_FLASH_LITE_API_KEY },
        timeout: 30000
      }
    );

    const content = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    let jsonString = content.replace(/```json|```/g, '').trim();
    const match = jsonString.match(/\{.*\}/s);
    if (match) jsonString = match[0];

    const detailedData = JSON.parse(jsonString);

    // Generate hotel image if accommodation details are available
    if (detailedData.accommodation && detailedData.accommodation.name) {
      try {
        console.log(`🏨 Generating hotel image for: ${detailedData.accommodation.name}`);
        const hotelImageQuery = `${detailedData.accommodation.name} ${detailedData.accommodation.location || itinerary.toLocation} hotel exterior`;
        
        // Try to get hotel image from Google Places
        if (GOOGLE_PLACES_API_KEY) {
          const placesResponse = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
            params: {
              query: hotelImageQuery,
              key: GOOGLE_PLACES_API_KEY,
              type: 'lodging',
              maxwidth: 800,
              maxheight: 600
            },
            timeout: 10000
          });
          
          if (placesResponse.data.results && placesResponse.data.results.length > 0) {
            const placeResult = placesResponse.data.results[0];
            if (placeResult.photos && placeResult.photos.length > 0) {
              const photo = placeResult.photos[0];
              const photoReference = photo.photo_reference;
              const hotelImageUrl = `${getImageProxyBaseUrl()}/api/proxy-google-image?photoreference=${photoReference}&maxwidth=800&maxheight=600&key=${GOOGLE_PLACES_API_KEY}`;
              
              // Add image URL to accommodation data
              detailedData.accommodation.imageUrl = hotelImageUrl;
              console.log(`✅ Hotel image generated: ${hotelImageUrl}`);
            }
          }
        }
      } catch (imageError) {
        console.log(`❌ Failed to generate hotel image: ${imageError.message}`);
      }
    }

    // Update itinerary with professional detailed information
    const updatedItinerary = await Itinerary.findByIdAndUpdate(
      req.params.id,
      {
        // Professional detailed structure
        tripTitle: detailedData.tripTitle,
        priceSummary: detailedData.priceSummary,
        transport: detailedData.transport,
        accommodation: detailedData.accommodation,
        dayPlans: detailedData.dayPlans,
        mealCostEstimates: detailedData.mealCostEstimates,
        whatsIncluded: detailedData.whatsIncluded,
        whatsNotIncluded: detailedData.whatsNotIncluded,
        cancellationPolicy: detailedData.cancellationPolicy,
        accessibility: detailedData.accessibility,
        languages: detailedData.languages,
        meetingPoint: detailedData.meetingPoint,
        startTime: detailedData.startTime,
        endTime: detailedData.endTime,
        
        // Legacy fields for backward compatibility
        details: JSON.stringify(detailedData.dayPlans),
        accommodationDetails: detailedData.accommodation,
        transportDetails: detailedData.transport,
        mealsDetails: detailedData.mealCostEstimates,
        activitiesDetails: { included: detailedData.whatsIncluded, optional: detailedData.whatsNotIncluded },
        termsAndConditions: { 
          priceInclusions: detailedData.whatsIncluded,
          priceExclusions: detailedData.whatsNotIncluded,
          cancellation: detailedData.cancellationPolicy
        },
        
        needsDetailedGeneration: false,
        updatedAt: new Date()
      },
      { new: true }
    );

    console.log(`✅ Detailed information generated for: ${itinerary.title}`);

    res.json({ 
      message: 'Detailed information generated successfully',
      itinerary: updatedItinerary
    });

  } catch (error) {
    console.error('❌ Error generating detailed information:', error);
    res.status(500).json({ 
      error: 'Failed to generate detailed information',
      details: error.message 
    });
  }
});

// Update itinerary
app.put('/api/itinerary/:id', async (req, res) => {
  try {
    const { title, days, price, highlights } = req.body;
    
    const itinerary = await Itinerary.findByIdAndUpdate(
      req.params.id,
      { 
        title, 
        days, 
        price, 
        highlights,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!itinerary) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }
    
    res.json({ success: true, itinerary });
  } catch (error) {
    res.status(500).json({ error: 'Update failed' });
  }
});

// Delete itinerary
app.delete('/api/itinerary/:id', async (req, res) => {
  try {
    const itinerary = await Itinerary.findByIdAndDelete(req.params.id);
    if (!itinerary) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }
    
    // Also delete associated details
    await ItineraryDetails.findOneAndDelete({ itineraryId: req.params.id });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

// Increment view count
app.post('/api/itinerary/:id/view', async (req, res) => {
  try {
    await Itinerary.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update view count' });
  }
});

// Increment share count
app.post('/api/itinerary/:id/share', async (req, res) => {
  try {
    await Itinerary.findByIdAndUpdate(req.params.id, { $inc: { shares: 1 } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update share count' });
  }
});

// Save search to history
app.post('/api/search-history', async (req, res) => {
  try {
    const { userId, searchData, resultsCount } = req.body;
    
    if (!userId || !searchData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const searchHistory = new SearchHistory({
      userId,
      searchData: {
        ...searchData,
        priceRange: {
          min: searchData.priceRange?.[0] || 0,
          max: searchData.priceRange?.[1] || 50000
        }
      },
      resultsCount
    });

    await searchHistory.save();
    res.json({ success: true, searchHistory });
  } catch (error) {
    console.error('Error saving search history:', error);
    res.status(500).json({ error: 'Failed to save search history' });
  }
});

// Get user search history
app.get('/api/search-history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;

    const searchHistory = await SearchHistory.find({ userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({ searchHistory });
  } catch (error) {
    console.error('Error fetching search history:', error);
    res.status(500).json({ error: 'Failed to fetch search history' });
  }
});

// Delete search history item
app.delete('/api/search-history/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await SearchHistory.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting search history:', error);
    res.status(500).json({ error: 'Failed to delete search history' });
  }
});

// Clear all search history for user
app.delete('/api/search-history/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    await SearchHistory.deleteMany({ userId });
    res.json({ success: true });
  } catch (error) {
    console.error('Error clearing search history:', error);
    res.status(500).json({ error: 'Failed to clear search history' });
  }
});

// In-memory cache for image URLs (simple cache to avoid repeated API calls)
const imageCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Enhanced place image endpoint with Google Places API as primary source
app.get('/api/place-image', trackAIUsage('place-image'), async (req, res) => {
  let place = req.query.place || '';
  let destination = req.query.destination || '';
  const isMobile = req.headers['user-agent']?.includes('Mobile') || req.query.mobile === 'true';
  const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
  const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;
  
  // Create cache key
  const cacheKey = `${place}-${destination}-${isMobile}`;
  
  // Check cache first
  const cached = imageCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    console.log('Serving from cache:', cacheKey);
    return res.json({ imageUrl: cached.imageUrl, source: cached.source });
  }
  
  console.log('Place image request:', { place, destination, isMobile });
  console.log('GOOGLE_PLACES_API_KEY exists:', !!GOOGLE_PLACES_API_KEY);
  console.log('PIXABAY_API_KEY exists:', !!PIXABAY_API_KEY);
  
  // Helper function to fetch Wikipedia images - COMMENTED OUT
  // const fetchWikipediaImage = async (searchTerm) => {
  //   try {
  //     console.log(`🔍 Searching Wikipedia for: ${searchTerm}`);
  //     
  //     // First, search for the page
  //     const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(searchTerm)}&srlimit=5&origin=*`;
  //     const searchResponse = await axios.get(searchUrl, { timeout: 10000 });
  //     
  //     if (searchResponse.data.query && searchResponse.data.query.search.length > 0) {
  //       const page = searchResponse.data.query.search[0];
  //       const pageTitle = page.title;
  //       
  //       console.log(`📄 Found Wikipedia page: ${pageTitle}`);
  //       
  //       // Get images from the page
  //       const imagesUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(pageTitle)}&prop=images&imlimit=20&origin=*`;
  //       const imagesResponse = await axios.get(imagesUrl, { timeout: 10000 });
  //       
  //       const pages = imagesResponse.data.query.pages;
  //       const pageId = Object.keys(pages)[0];
  //       const images = pages[pageId].images || [];
  //       
  //       // Filter for relevant image files (exclude user pages, templates, etc.)
  //       const relevantImages = images.filter(img => {
  //         const fileName = img.title;
  //         return fileName.includes('File:') && 
  //                !fileName.includes('User:') && 
  //                !fileName.includes('Template:') &&
  //                !fileName.includes('Commons:') &&
  //                (fileName.toLowerCase().includes('.jpg') || 
  //                 fileName.toLowerCase().includes('.jpeg') || 
  //                 fileName.toLowerCase().includes('.png') ||
  //                 fileName.toLowerCase().includes('.gif'));
  //       });
  //       
  //       if (relevantImages.length > 0) {
  //         // Try multiple images to find one that works
  //         for (let i = 0; i < Math.min(relevantImages.length, 5); i++) {
  //           const imageTitle = relevantImages[i].title;
  //           console.log(`🖼️ Trying Wikipedia image ${i + 1}: ${imageTitle}`);
  //           
  //           try {
  //             // Get image URL with better parameters
  //             const imageUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(imageTitle)}&prop=imageinfo&iiprop=url|size|mime&iiurlwidth=800&origin=*`;
  //             const imageInfoResponse = await axios.get(imageUrl, { timeout: 10000 });
  //             
  //             const imagePages = imageInfoResponse.data.query.pages;
  //             const imagePageId = Object.keys(imagePages)[0];
  //             const imageInfo = imagePages[imagePageId].imageinfo[0];
  //             
  //             if (imageInfo.thumburl) {
  //               // Log the full URL for debugging
  //               console.log(`🔍 Full Wikipedia image URL: ${imageInfo.thumburl}`);
  //               
  //               // Test if the image URL is accessible
  //               try {
  //                 const testResponse = await axios.head(imageInfo.thumburl, { timeout: 5000 });
  //                 if (testResponse.status === 200) {
  //                   console.log(`✅ Wikipedia image URL verified: ${imageInfo.thumburl}`);
  //                   return imageInfo.thumburl;
  //                 }
  //               } catch (testError) {
  //                 console.log(`❌ Wikipedia image URL failed test: ${imageInfo.thumburl}`);
  //                 console.log(`❌ Error details:`, testError.message);
  //                 
  //                 // Try alternative URL format
  //                 if (imageInfo.url) {
  //                   try {
  //                     console.log(`🔄 Trying alternative Wikipedia URL: ${imageInfo.url}`);
  //                     const altTestResponse = await axios.head(imageInfo.url, { timeout: 5000 });
  //                     if (altTestResponse.status === 200) {
  //                     console.log(`✅ Alternative Wikipedia image URL verified: ${imageInfo.url}`);
  //                     return imageInfo.url;
  //                   }
  //                 } catch (altTestError) {
  //                   console.log(`❌ Alternative Wikipedia URL also failed: ${imageInfo.url}`);
  //                 }
  //               }
  //               
  //               continue; // Try next image
  //             }
  //           }
  //         } catch (imageError) {
  //           console.log(`❌ Error getting image info for ${imageTitle}:`, imageError.message);
  //           continue; // Try next image
  //         }
  //       }
  //     }
  //     
  //     console.log(`❌ No Wikipedia image found for: ${searchTerm}`);
  //     return null;
  //     
  //   } catch (error) {
  //     console.log(`❌ Wikipedia API error for ${searchTerm}:`, error.message);
  //     return null;
  //   }
  // };
  
        // Try Wikipedia API first (no API key required) - COMMENTED OUT
      // const searchTerm = `${place} ${destination}`.trim();
      // const wikipediaImageUrl = await fetchWikipediaImage(searchTerm);
      // if (wikipediaImageUrl) {
      //   // Check if the Wikipedia image URL contains travel-relevant keywords
      //   const travelKeywords = ['temple', 'mosque', 'church', 'fort', 'palace', 'beach', 'monument', 'tower', 'bridge', 'gate', 'view', 'panorama', 'landscape', 'cityscape', 'sunset', 'sunrise', 'aerial', 'tourist', 'travel', 'destination', 'attraction', 'heritage', 'cultural', 'historical', 'architecture', 'building', 'structure'];
      //   const nonTravelKeywords = ['map', 'chart', 'diagram', 'graph', 'flag', 'emblem', 'logo', 'icon', 'symbol', 'document', 'text', 'letter', 'manuscript', 'book', 'page', 'artifact', 'object', 'coin', 'stamp', 'painting', 'drawing', 'sketch', 'illustration', 'portrait', 'person', 'people', 'group', 'crowd', 'ceremony', 'event', 'festival', 'celebration'];
      //   
      //   const lowerUrl = wikipediaImageUrl.toLowerCase();
      //   const hasTravelKeyword = travelKeywords.some(keyword => lowerUrl.includes(keyword));
      //   const hasNonTravelKeyword = nonTravelKeywords.some(keyword => lowerUrl.includes(keyword));
      //   
      //   if (hasTravelKeyword && !hasNonTravelKeyword) {
      //     console.log('📸 Image source: wikipedia (travel-relevant) for', place);
      //     
      //     // Cache the result
      //     imageCache.set(cacheKey, { 
      //       imageUrl: wikipediaImageUrl, 
      //       timestamp: Date.now(),
      //       source: 'wikipedia'
      //     });
      //     
      //     return res.json({ 
      //       imageUrl: wikipediaImageUrl, 
      //       source: 'wikipedia',
      //       place: place,
      //       destination: destination
      //   });
      //   } else {
      //     console.log('⚠️ Wikipedia image not travel-relevant, trying other sources...');
      //   }
      // }
  
  // Try Google Places API if no Wikipedia image
  if (GOOGLE_PLACES_API_KEY) {
    try {
      console.log('Trying Google Places API...');
      
      // Search for the place using Google Places Text Search API
      const searchQuery = `${place} ${destination}`.trim();
      const placesResponse = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
        params: {
          query: searchQuery,
          key: GOOGLE_PLACES_API_KEY,
          type: 'tourist_attraction',
          maxwidth: isMobile ? 400 : 800,
          maxheight: isMobile ? 300 : 600
        },
        timeout: 10000
      });
      
      if (placesResponse.data.results && placesResponse.data.results.length > 0) {
        const placeResult = placesResponse.data.results[0];
        
        if (placeResult.photos && placeResult.photos.length > 0) {
          const photo = placeResult.photos[0];
          const photoReference = photo.photo_reference;
          
          // Get the photo using Google Places Photo API - proxy through our server to avoid CORS issues
          const photoUrl = `${getImageProxyBaseUrl()}/api/proxy-google-image?photoreference=${photoReference}&maxwidth=${isMobile ? 400 : 800}&maxheight=${isMobile ? 300 : 600}&key=${GOOGLE_PLACES_API_KEY}`;
          
          console.log('Found Google Places image:', photoUrl);
          
          // Cache the result
          imageCache.set(cacheKey, { 
            imageUrl: photoUrl, 
            timestamp: Date.now(),
            source: 'google_places'
          });
          
          return res.json({ 
            imageUrl: photoUrl, 
            source: 'google_places',
            place: place,
            destination: destination
          });
        }
      }
      
      console.log('No Google Places images found, trying fallback...');
      
    } catch (googleError) {
      console.error('Google Places API error:', googleError?.response?.data || googleError.message);
      console.log('Falling back to Pixabay...');
    }
  }
  
  // Fallback to Pixabay API
  if (PIXABAY_API_KEY) {
    try {
  // Optimized search terms for better results
  const tryTerms = [
    `${place} ${destination}`,
    place,
    destination,
    'India travel',
    'travel destination'
  ].filter(term => term && term.trim());
  
    for (let term of tryTerms) {
      if (!term) continue;
        console.log('Trying Pixabay term:', term);
      
      const pixabayRes = await axios.get('https://pixabay.com/api/', {
        params: {
          key: PIXABAY_API_KEY,
          q: term,
          image_type: 'photo',
          orientation: 'horizontal',
          safesearch: 'true',
            per_page: 5,
            min_width: isMobile ? 400 : 800,
          min_height: isMobile ? 300 : 600,
        },
          timeout: 5000,
      });
      
      const hits = pixabayRes.data.hits;
      console.log('Pixabay response hits:', hits?.length || 0);
      
      if (hits && hits.length > 0) {
        const selectedHit = isMobile ? hits[0] : hits.find(hit => hit.imageWidth >= 800) || hits[0];
        const imageUrl = selectedHit.webformatURL;
        
          console.log('Found Pixabay image URL:', imageUrl);
        
        // Cache the result
          imageCache.set(cacheKey, { 
            imageUrl, 
            timestamp: Date.now(),
            source: 'pixabay'
          });
          
          return res.json({ 
            imageUrl,
            source: 'pixabay',
            place: place,
            destination: destination
          });
        }
      }
      
    } catch (pixabayError) {
      console.error('Pixabay error:', pixabayError?.response?.data || pixabayError.message);
    }
  }
  
  // Final fallback to default image
  console.log('No images found, using default');
    const defaultImage = 'https://images.unsplash.com/photo-1506905925346-21bda4d75df4?w=400&h=300&fit=crop';
  imageCache.set(cacheKey, { 
    imageUrl: defaultImage, 
    timestamp: Date.now(),
    source: 'default'
  });
  
  return res.json({ 
    imageUrl: defaultImage,
    source: 'default',
    place: place,
    destination: destination
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running!', timestamp: new Date().toISOString() });
});

// Destination Gallery endpoint - fetches 3 relevant images for itinerary
app.get('/api/destination-gallery', trackAIUsage('destination-gallery'), async (req, res) => {
  const { destinations, placesToVisit, highlights, aiSearchTerms, requestId, seed } = req.query;
  const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
  const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;
  
  console.log('Destination Gallery request:', { destinations, placesToVisit, highlights, aiSearchTerms });
  
  // Helper function to fetch Wikipedia images - COMMENTED OUT
  // const fetchWikipediaImage = async (searchTerm) => {
  //   try {
  //     console.log(`🔍 Searching Wikipedia for: ${searchTerm}`);
  //     
  //     // First, search for the page
  //     const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(searchTerm)}&srlimit=5&origin=*`;
  //     const searchResponse = await axios.get(searchUrl, { timeout: 10000 });
  //     
  //     if (searchResponse.data.query && searchResponse.data.query.search.length > 0) {
  //       const page = searchResponse.data.query.search[0];
  //       const pageTitle = page.title;
  //       
  //       console.log(`📄 Found Wikipedia page: ${pageTitle}`);
  //       
  //       // Get images from the page
  //       const imagesUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(pageTitle)}&prop=images&imlimit=20&origin=*`;
  //       const imagesResponse = await axios.get(imagesUrl, { timeout: 10000 });
  //       
  //       const pages = imagesResponse.data.query.pages;
  //       const pageId = Object.keys(pages)[0];
  //       const images = pages[pageId].images || [];
  //       
  //       // Filter for relevant image files (exclude user pages, templates, etc.)
  //       const relevantImages = images.filter(img => {
  //         const fileName = img.title;
  //         return fileName.includes('File:') && 
  //                !fileName.includes('User:') && 
  //                !fileName.includes('Template:') &&
  //                !fileName.includes('Commons:') &&
  //                (fileName.toLowerCase().includes('.jpg') || 
  //                 fileName.toLowerCase().includes('.jpeg') || 
  //                 fileName.toLowerCase().includes('.png') ||
  //                 fileName.toLowerCase().includes('.gif'));
  //       });
  //       
  //       if (relevantImages.length > 0) {
  //         // Try multiple images to find one that works
  //         for (let i = 0; i < Math.min(relevantImages.length, 5); i++) {
  //           const imageTitle = relevantImages[i].title;
  //           console.log(`🖼️ Trying Wikipedia image ${i + 1}: ${imageTitle}`);
  //           
  //           try {
  //             // Get image URL with better parameters
  //             const imageUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(imageTitle)}&prop=imageinfo&iiprop=url|size|mime&iiurlwidth=800&origin=*`;
  //             const imageInfoResponse = await axios.get(imageUrl, { timeout: 10000 });
  //             
  //             const imagePages = imageInfoResponse.data.query.pages;
  //             const imagePageId = Object.keys(imagePages)[0];
  //             const imageInfo = imagePages[imagePageId].imageinfo[0];
  //             
  //             if (imageInfo.thumburl) {
  //               // Log the full URL for debugging
  //               console.log(`🔍 Full Wikipedia image URL: ${imageInfo.thumburl}`);
  //               
  //               // Test if the image URL is accessible
  //               try {
  //                 const testResponse = await axios.head(imageInfo.thumburl, { timeout: 5000 });
  //                 if (testResponse.status === 200) {
  //                   console.log(`✅ Wikipedia image URL verified: ${imageInfo.thumburl}`);
  //                   return {
  //                     url: imageInfo.thumburl,
  //                     source: 'wikipedia',
  //                     searchTerm: searchTerm,
  //                     label: searchTerm
  //                   };
  //                 }
  //               } catch (testError) {
  //                 console.log(`❌ Wikipedia image URL failed test: ${imageInfo.thumburl}`);
  //                 console.log(`❌ Error details:`, testError.message);
  //                 
  //                 // Try alternative URL format
  //                 if (imageInfo.url) {
  //                   try {
  //                     console.log(`🔄 Trying alternative Wikipedia URL: ${imageInfo.url}`);
  //                     const altTestResponse = await axios.head(imageInfo.url, { timeout: 5000 });
  //                     if (altTestResponse.status === 200) {
  //                       console.log(`✅ Alternative Wikipedia image URL verified: ${imageInfo.url}`);
  //                       return {
  //                         url: imageInfo.url,
  //                         source: 'wikipedia',
  //                         searchTerm: searchTerm,
  //                         label: searchTerm
  //                       };
  //                     }
  //                   } catch (altTestError) {
  //                     console.log(`❌ Alternative Wikipedia URL also failed: ${imageInfo.url}`);
  //                   }
  //                 }
  //                 
  //                 continue; // Try next image
  //               }
  //             }
  //           } catch (imageError) {
  //             console.log(`❌ Error getting image info for ${imageTitle}:`, imageError.message);
  //             continue; // Try next image
  //           }
  //         }
  //       }
  //     }
  //     
  //     console.log(`❌ No Wikipedia image found for: ${searchTerm}`);
  //     return null;
  //     
  //   } catch (error) {
  //     console.log(`❌ Wikipedia API error for ${searchTerm}:`, error.message);
  //     return null;
  //   }
  // };
  
  if (!GOOGLE_PLACES_API_KEY && !PIXABAY_API_KEY) {
    return res.json({
      success: false,
      error: 'No API keys configured',
      images: []
    });
  }
  
  try {
    // Generate a unique request ID for this search
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    console.log('🆔 Generated request ID:', requestId);
    
    const images = [];
    const searchTerms = [];
    const usedImageUrls = new Set(); // Track used image URLs to avoid duplicates
    
    // Parse destinations and places
    let destinationsArray = [];
    let placesArray = [];
    
    try {
      destinationsArray = destinations ? JSON.parse(destinations) : [];
      placesArray = placesToVisit ? JSON.parse(placesToVisit) : [];
    } catch (e) {
      console.log('Error parsing JSON, using as string');
      destinationsArray = destinations ? [destinations] : [];
      placesArray = placesToVisit ? [placesToVisit] : [];
    }
    
    // Parse highlights and AI search terms
    let highlightsArray = [];
    let aiSearchTermsArray = [];
    
    try {
      highlightsArray = highlights ? JSON.parse(highlights) : [];
      aiSearchTermsArray = aiSearchTerms ? JSON.parse(aiSearchTerms) : [];
    } catch (e) {
      console.log('Error parsing highlights or AI search terms, using fallback');
    }
    
    // Create search terms based on itinerary data and AI suggestions
    if (aiSearchTermsArray.length > 0) {
      // Use AI-generated search terms first
      searchTerms.push(...aiSearchTermsArray.slice(0, 3));
      console.log('🤖 Using AI-generated search terms:', aiSearchTermsArray.slice(0, 3));
    } else {
      // Fallback to basic search terms
      if (placesArray.length > 0) {
        searchTerms.push(placesArray[0]); // First attraction
      }
      if (placesArray.length > 1) {
        searchTerms.push(placesArray[1]); // Second attraction
      }
      if (destinationsArray.length > 0) {
        searchTerms.push(destinationsArray[0]); // Main destination
      }
    }
    
    // Add highlights as additional search terms if available
    if (highlightsArray.length > 0) {
      const highlightTerms = highlightsArray.slice(0, 2).map(highlight => 
        highlight.replace(/[^\w\s]/g, '').trim()
      ).filter(term => term.length > 3);
      searchTerms.push(...highlightTerms);
      console.log('✨ Adding highlight-based search terms:', highlightTerms);
    }
    
    console.log('Final search terms for gallery:', searchTerms);
    
    // Get the primary destination for search strategies
    const primaryDestination = destinationsArray.length > 0 ? destinationsArray[0] : '';
    
    // Fetch images for each search term
    for (let i = 0; i < Math.min(searchTerms.length, 3); i++) {
      const searchTerm = searchTerms[i];
      console.log(`Fetching image ${i + 1} for:`, searchTerm);
      
      let imageUrl = null;
      let source = null;
      let label = searchTerm;
      
      // Try Google Places API first (better for travel images)
      if (GOOGLE_PLACES_API_KEY) {
        try {
          // Try different search strategies to get diverse images
          const searchStrategies = [
            searchTerm,
            primaryDestination ? `${searchTerm} ${primaryDestination}` : searchTerm,
            `${searchTerm} tourist attraction`,
            `${searchTerm} landmark`,
            `${searchTerm} monument`
          ];
          
          for (const strategy of searchStrategies) {
            console.log(`🔍 Trying Google Places search: "${strategy}"`);
            
            const placesResponse = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
              params: {
                query: strategy,
                key: GOOGLE_PLACES_API_KEY,
                type: 'tourist_attraction',
                maxwidth: 800,
                maxheight: 600
              },
              timeout: 10000
            });
            
            if (placesResponse.data.results && placesResponse.data.results.length > 0) {
              // Try multiple places to get different images
              for (let placeIndex = 0; placeIndex < Math.min(placesResponse.data.results.length, 3); placeIndex++) {
                const placeResult = placesResponse.data.results[placeIndex];
                
                if (placeResult.photos && placeResult.photos.length > 0) {
                  // Try different photos from the same place
                  for (let photoIndex = 0; photoIndex < Math.min(placeResult.photos.length, 2); photoIndex++) {
                    const photo = placeResult.photos[photoIndex];
                    const photoReference = photo.photo_reference;
                    
                    // Create proxy URL
                    const candidateUrl = `${getImageProxyBaseUrl()}/api/proxy-google-image?photoreference=${photoReference}&maxwidth=800&maxheight=600&key=${GOOGLE_PLACES_API_KEY}`;
                    
                                         // Check if this URL is different from previously used ones
                     if (!usedImageUrls.has(candidateUrl)) {
                       imageUrl = candidateUrl;
                       source = 'google_places';
                       usedImageUrls.add(candidateUrl); // Track this URL as used
                       console.log(`✅ Google Places image ${i + 1} found (strategy: "${strategy}", place: ${placeResult.name}):`, imageUrl);
                       break; // Found a unique image
                     }
                  }
                  if (imageUrl) break; // Found a unique image
                }
              }
              if (imageUrl) break; // Found a unique image
            }
          }
        } catch (googleError) {
          console.log(`❌ Google Places error for ${searchTerm}:`, googleError.message);
        }
      }
      
      // Try Wikipedia API if no Google Places image - COMMENTED OUT
      // if (!imageUrl) {
      //   const wikipediaImage = await fetchWikipediaImage(searchTerm);
      //   if (wikipediaImage) {
      //     // Check if Wikipedia image is travel-relevant
      //     const travelKeywords = ['temple', 'mosque', 'church', 'fort', 'palace', 'beach', 'monument', 'tower', 'bridge', 'gate', 'view', 'panorama', 'landscape', 'cityscape', 'sunset', 'sunrise', 'aerial', 'tourist', 'travel', 'destination', 'attraction', 'heritage', 'cultural', 'historical', 'architecture', 'building', 'structure'];
      //     const nonTravelKeywords = ['map', 'chart', 'diagram', 'graph', 'flag', 'emblem', 'logo', 'icon', 'symbol', 'document', 'text', 'letter', 'manuscript', 'book', 'page', 'artifact', 'object', 'coin', 'stamp', 'painting', 'drawing', 'sketch', 'illustration', 'portrait', 'person', 'people', 'group', 'crowd', 'ceremony', 'event', 'festival', 'celebration'];
      //     
      //   const lowerUrl = wikipediaImage.url.toLowerCase();
      //   const hasTravelKeyword = travelKeywords.some(keyword => lowerUrl.includes(keyword));
      //   const hasNonTravelKeyword = nonTravelKeywords.some(keyword => lowerUrl.includes(keyword));
      //   
      //   if (hasTravelKeyword && !hasNonTravelKeyword && !usedImageUrls.has(wikipediaImage.url)) {
      //     imageUrl = wikipediaImage.url;
      //     source = wikipediaImage.source;
      //     label = wikipediaImage.label;
      //     usedImageUrls.add(wikipediaImage.url); // Track this URL as used
      //     console.log(`✅ Wikipedia image ${i + 1} found (travel-relevant):`, imageUrl);
      //   } else if (usedImageUrls.has(wikipediaImage.url)) {
      //     console.log(`⚠️ Wikipedia image already used, skipping:`, wikipediaImage.url);
      //   } else {
      //     console.log(`⚠️ Wikipedia image not travel-relevant, skipping:`, wikipediaImage.url);
      //   }
      //   }
      // }
      
      // Try Google Places API if no Wikipedia image
      if (!imageUrl && GOOGLE_PLACES_API_KEY) {
        try {
          const placesResponse = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
            params: {
              query: searchTerm,
              key: GOOGLE_PLACES_API_KEY,
              type: 'tourist_attraction',
              maxwidth: 800,
              maxheight: 600
            },
            timeout: 10000
          });
          
          if (placesResponse.data.results && placesResponse.data.results.length > 0) {
            const placeResult = placesResponse.data.results[0];
            
            if (placeResult.photos && placeResult.photos.length > 0) {
              const photo = placeResult.photos[0];
              const photoReference = photo.photo_reference;
              
              // Create proxy URL
              imageUrl = `${getImageProxyBaseUrl()}/api/proxy-google-image?photoreference=${photoReference}&maxwidth=800&maxheight=600&key=${GOOGLE_PLACES_API_KEY}`;
              source = 'google_places';
              console.log(`✅ Google Places image ${i + 1} found:`, imageUrl);
            }
          }
        } catch (googleError) {
          console.log(`❌ Google Places error for ${searchTerm}:`, googleError.message);
        }
      }
      
      // Fallback to Pixabay if no Wikipedia or Google image
      if (!imageUrl && PIXABAY_API_KEY) {
        try {
          const pixabayRes = await axios.get('https://pixabay.com/api/', {
            params: {
              key: PIXABAY_API_KEY,
              q: searchTerm,
              image_type: 'photo',
              orientation: 'horizontal',
              safesearch: 'true',
              per_page: 3,
              min_width: 800,
              min_height: 600,
            },
            timeout: 5000,
          });
          
          const hits = pixabayRes.data.hits;
          if (hits && hits.length > 0) {
            // Try to find a unique image from Pixabay
            for (let hitIndex = 0; hitIndex < Math.min(hits.length, 5); hitIndex++) {
              const candidateUrl = hits[hitIndex].webformatURL;
              if (!usedImageUrls.has(candidateUrl)) {
                imageUrl = candidateUrl;
                source = 'pixabay';
                usedImageUrls.add(candidateUrl); // Track this URL as used
                console.log(`✅ Pixabay image ${i + 1} found:`, imageUrl);
                break;
              }
            }
          }
        } catch (pixabayError) {
          console.log(`❌ Pixabay error for ${searchTerm}:`, pixabayError.message);
        }
      }
      
      // Add image to results
      if (imageUrl) {
        images.push({
          url: imageUrl,
          source: source,
          searchTerm: searchTerm,
          label: label
        });
      }
    }
    
    console.log(`🎨 Gallery complete: ${images.length} images found`);
    
    return res.json({
      success: true,
      images: images,
      totalFound: images.length
    });
    
  } catch (error) {
    console.error('Destination Gallery error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch gallery images',
      images: []
    });
  }
});

// Google Places API test endpoint
app.get('/api/test-google-places', async (req, res) => {
  const place = req.query.place || 'Taj Mahal';
  const destination = req.query.destination || 'Agra';
  const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
  
  console.log('Testing Google Places API with:', { place, destination });
  console.log('GOOGLE_PLACES_API_KEY exists:', !!GOOGLE_PLACES_API_KEY);
  
  if (!GOOGLE_PLACES_API_KEY) {
    return res.json({
      success: false,
      error: 'GOOGLE_PLACES_API_KEY not configured',
      message: 'Please add your Google Places API key to the environment variables'
    });
  }
  
  try {
    // Test Google Places Text Search API
    const searchQuery = `${place} ${destination}`.trim();
    console.log('Searching for:', searchQuery);
    
    const placesResponse = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
      params: {
        query: searchQuery,
        key: GOOGLE_PLACES_API_KEY,
        type: 'tourist_attraction'
      },
      timeout: 10000
    });
    
    console.log('Google Places API response status:', placesResponse.status);
    console.log('Google Places API response data:', placesResponse.data);
    
    if (placesResponse.data.status === 'OK' && placesResponse.data.results && placesResponse.data.results.length > 0) {
      const placeResult = placesResponse.data.results[0];
      
      if (placeResult.photos && placeResult.photos.length > 0) {
        const photo = placeResult.photos[0];
        const photoReference = photo.photo_reference;
        
        // Get the photo URL - proxy through our server to avoid CORS issues
        const photoUrl = `${getImageProxyBaseUrl()}/api/proxy-google-image?photoreference=${photoReference}&maxwidth=400&maxheight=300&key=${GOOGLE_PLACES_API_KEY}`;
        
        // Image source: google_places for debugging (commented out to reduce console noise)
        
        return res.json({
          success: true,
          imageUrl: photoUrl,
          source: 'google_places',
          place: place,
          destination: destination,
          placeDetails: {
            name: placeResult.name,
            address: placeResult.formatted_address,
            rating: placeResult.rating,
            photos: placeResult.photos?.length || 0
          }
        });
      } else {
        return res.json({
          success: false,
          error: 'No photos found for this place',
          place: place,
          destination: destination,
          placeDetails: {
            name: placeResult.name,
            address: placeResult.formatted_address,
            rating: placeResult.rating
          }
        });
      }
    } else {
      return res.json({
        success: false,
        error: 'No places found',
        status: placesResponse.data.status,
        place: place,
        destination: destination
      });
    }
    
  } catch (error) {
    console.error('Google Places API test error:', error?.response?.data || error.message);
    
    return res.json({
      success: false,
      error: 'Google Places API request failed',
      details: error?.response?.data || error.message,
      place: place,
      destination: destination
    });
  }
});

// Admin routes
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);

// User routes
app.use('/api/users', userRoutes);

// Itinerary routes
app.use('/api/itineraries', itineraryRoutes);

// Promotional leads routes
app.use('/api/promotional-leads', promotionalLeadsRoutes);

// Blog routes
app.use('/api/blogs', blogRoutes);

// Package routes
app.use('/api/packages', packageRoutes);

// Analytics routes
app.use('/api/analytics', analyticsRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔧 Available env vars: ${Object.keys(process.env).filter(key => !key.includes('SECRET') && !key.includes('KEY')).join(', ')}`);
  if (!process.env.MONGODB_URI) {
    console.log('⚠️  MongoDB not configured. Admin features disabled.');
  } else {
    console.log('✅ MongoDB configured. Admin features enabled.');
  }
}); 