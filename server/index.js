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
}

const app = express();
app.use(cors());
app.use(express.json());

// Session middleware for user tracking with MongoDB store
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

app.use(activityTracker);

// Import routes
const adminAuthRoutes = require('./routes/adminAuth');
const adminDashboardRoutes = require('./routes/adminDashboard');
const userRoutes = require('./routes/users');
const itineraryRoutes = require('./routes/itineraries');
const promotionalLeadsRoutes = require('./routes/promotionalLeads');
const blogRoutes = require('./routes/blogs');
const analyticsRoutes = require('./routes/analytics');
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

// Import formatting function
const { processItineraryDetails } = require('./routes/itineraries');

// Remove all previous model configs and keys
const GEMINI_25_FLASH_LITE_API_KEY = process.env.GEMINI_25_FLASH_LITE_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

// Fallback itinerary generator function
const generateFallbackItineraries = (from, to, days, travellers, travelClass) => {
  const basePrice = 15000; // Base price per person
  const pricePerDay = 3000; // Additional cost per day
  const totalPrice = (basePrice + (days - 1) * pricePerDay) * travellers;
  
  const commonDestinations = {
    'Goa': ['Panaji', 'Calangute', 'Anjuna', 'Old Goa'],
    'Mumbai': ['Gateway of India', 'Marine Drive', 'Juhu Beach', 'Elephanta Caves'],
    'Delhi': ['Red Fort', 'Qutub Minar', 'India Gate', 'Humayun\'s Tomb'],
    'Agra': ['Taj Mahal', 'Agra Fort', 'Fatehpur Sikri', 'Mehtab Bagh'],
    'Jaipur': ['Amber Fort', 'City Palace', 'Hawa Mahal', 'Jantar Mantar'],
    'Varanasi': ['Ghats', 'Kashi Vishwanath Temple', 'Sarnath', 'Dashashwamedh Ghat'],
    'Kerala': ['Munnar', 'Alleppey', 'Kochi', 'Thekkady'],
    'Rajasthan': ['Jaipur', 'Udaipur', 'Jodhpur', 'Jaisalmer']
  };
  
  const destinations = commonDestinations[to] || [to];
  const places = destinations.slice(0, Math.min(days, destinations.length));
  
  const packages = [
    {
      packageName: `${to} Adventure Package`,
      days: days,
      destinations: [to],
      placesToVisit: places,
      highlights: ['Guided tours', 'Local experiences', 'Cultural immersion'],
      price: totalPrice,
      details: `**${days}-Day Adventure in ${to}**\\n\\nExperience the best of ${to} with guided tours, local experiences, and cultural immersion.\\n\\n🏨 *Accommodation:* ${days}-night stay in comfortable hotels\\n✈️ *Transport:* Flights and local transfers included\\n🍽️ *Meals:* Daily breakfast and some meals included\\n📌 *Terms:* Prices inclusive of taxes, subject to availability`
    },
    {
      packageName: `${to} Luxury Escape`,
      days: days,
      destinations: [to],
      placesToVisit: places,
      highlights: ['Premium accommodation', 'Exclusive experiences', 'Personal guide'],
      price: Math.round(totalPrice * 1.5),
      details: `**${days}-Day Luxury Escape to ${to}**\\n\\nIndulge in premium accommodation and exclusive experiences with personal guides.\\n\\n🏨 *Accommodation:* ${days}-night stay in luxury hotels\\n✈️ *Transport:* Premium flights and private transfers\\n🍽️ *Meals:* All meals included at fine restaurants\\n📌 *Terms:* Premium package with exclusive access`
    },
    {
      packageName: `${to} Budget Explorer`,
      days: days,
      destinations: [to],
      placesToVisit: places,
      highlights: ['Affordable stays', 'Local transport', 'Authentic experiences'],
      price: Math.round(totalPrice * 0.7),
      details: `**${days}-Day Budget Explorer in ${to}**\\n\\nDiscover ${to} on a budget with authentic local experiences and affordable accommodation.\\n\\n🏨 *Accommodation:* ${days}-night stay in budget hotels\\n✈️ *Transport:* Economy flights and local transport\\n🍽️ *Meals:* Some meals included, local dining options\\n📌 *Terms:* Budget-friendly package with great value`
    },
    {
      packageName: `${to} Cultural Heritage`,
      days: days,
      destinations: [to],
      placesToVisit: places,
      highlights: ['Heritage sites', 'Cultural tours', 'Traditional experiences'],
      price: Math.round(totalPrice * 1.2),
      details: `**${days}-Day Cultural Heritage Tour of ${to}**\\n\\nImmerse yourself in the rich cultural heritage of ${to} with guided heritage tours.\\n\\n🏨 *Accommodation:* ${days}-night stay in heritage properties\\n✈️ *Transport:* Comfortable flights and guided tours\\n🍽️ *Meals:* Traditional meals and cultural dining experiences\\n📌 *Terms:* Heritage-focused package with cultural insights`
    },
    {
      packageName: `${to} Nature & Wildlife`,
      days: days,
      destinations: [to],
      placesToVisit: places,
      highlights: ['Nature trails', 'Wildlife spotting', 'Eco-friendly stays'],
      price: Math.round(totalPrice * 1.1),
      details: `**${days}-Day Nature & Wildlife Adventure in ${to}**\\n\\nExplore the natural beauty and wildlife of ${to} with eco-friendly experiences.\\n\\n🏨 *Accommodation:* ${days}-night stay in eco-resorts\\n✈️ *Transport:* Nature-friendly transport options\\n🍽️ *Meals:* Organic and local cuisine included\\n📌 *Terms:* Eco-friendly package with nature conservation focus`
    }
  ];
  
  return packages;
};

// Import the new image service
const ImageService = require('./services/imageService');

// Generate and save basic itineraries
app.post('/api/generate-itinerary', trackAIUsage('generate-itinerary'), async (req, res) => {
  const { from, to, departureDate, returnDate, travellers, travelClass } = req.body;
  
  console.log('Received dates:', { departureDate, returnDate });
  
  const startTime = Date.now();

  // Calculate days from dates with validation
  const startDate = new Date(departureDate);
  const endDate = new Date(returnDate);
  
  // Validate dates
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return res.status(400).json({ error: 'Invalid date format provided' });
  }
  
  const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

  // Enhanced userPrompt with image search requirements
  const userPrompt = `You are an experienced travel agent. Create 5 complete, practical travel itinerary packages for a ${days}-day trip from ${from} to ${to} for ${travellers} ${travelClass} travelers.

Each package price must be realistic and based on the following assumptions:
- Domestic return flight: INR 10,000–15,000 per person.
- Hotel stay: INR 5,000 per night for budget, INR 10,000 per night for luxury.
- Meals and activities: Add INR 2,000–5,000 per day per person.
The total price should match these estimates for the total days and travelers.

**Your format must include for each package:**
1️⃣ **Day-wise plan:** Each day with clear heading + bullet points for activities (Morning/Afternoon/Evening if needed).
2️⃣ **Accommodation:** Mention suggested hotel/resort for each night.
3️⃣ **Activities Included:** Mention if sightseeing tickets, guides, cruises, or adventure sports are covered.
4️⃣ **Transport Details:** Include arrival & departure flights or local transport if needed.
5️⃣ **Meals:** Breakfast/Lunch/Dinner info if included or recommended.
6️⃣ **Terms:** One short line about price inclusions/exclusions or taxes.
7️⃣ **Contact/Booking Link:** Add a clear call to action.

**For each package, provide these exact image search fields:**
1. "headerImageQuery": "scenic wide-angle view of [main destination]"
2. "galleryImageQueries": [
   "specific landmark from itinerary",
   "cultural activity from itinerary", 
   "unique experience from itinerary"
]
3. "accommodationImageQuery": "[hotel type] in [location]"

Return a JSON array of 5 packages. Each package object must have these exact fields:
- packageName (string, catchy title)
- days (number)
- destinations (array of strings)
- placesToVisit (array of strings, main attractions)
- highlights (array of strings, 2-4 key highlights)
- price (number, in INR)
- details (string, full day-wise itinerary with accommodation, transport, meals, terms, booking info)
- headerImageQuery (string, for image search)
- galleryImageQueries (array of strings, for gallery images)
- accommodationImageQuery (string, for accommodation image)

**Format Example for each package:**
{
  "packageName": "Romantic Honeymoon Package",
  "days": 3,
  "destinations": ["Goa"],
  "placesToVisit": ["Butterfly Beach", "Old Goa Churches", "Mandovi River"],
  "highlights": ["Sunset cruise", "Private beach access", "Couples spa"],
  "price": 25000,
  "headerImageQuery": "scenic wide-angle view of Goa beaches",
  "galleryImageQueries": ["Butterfly Beach Goa", "Old Goa Churches", "Mandovi River sunset"],
  "accommodationImageQuery": "luxury resort in Goa",
  "details": "**Day 1: Arrival & Sunset**\\n- Arrive at Goa Airport, private transfer to Beach Resort.\\n- Sunset cruise on Mandovi River.\\n- Candlelight dinner at beach shack.\\n\\n🏨 *Accommodation:* 1-night stay at Beach Resort, Deluxe Room, Breakfast Included.\\n\\n**Day 2: Private Beaches & Spa**\\n- Relaxing breakfast.\\n- Visit secluded Butterfly Beach by private boat.\\n- Couples Spa session at resort.\\n- Dinner at beach shack.\\n\\n🏨 *Accommodation:* 1-night stay at Beach Resort, Deluxe Room.\\n\\n**Day 3: Heritage & Departure**\\n- Visit Old Goa Churches: Basilica of Bom Jesus.\\n- Transfer to Goa Airport for return flight.\\n\\n✅ *Activities Included:* Sunset cruise, Butterfly Beach boat ride, spa session.\\n✈️ *Transport:* Private airport transfers, local sightseeing by car.\\n🍽️ *Meals:* Daily breakfast, 1 candlelight dinner included.\\n📌 *Terms:* Prices inclusive of GST, subject to availability.\\n📞 *Contact us to book now!*"
}

Return ONLY valid JSON array. Do not include any explanation, comments, or markdown code blocks. All property names and strings must use double quotes.`;

// Helper to fetch a unique header image for itineraries within one request
  const usedHeaderImages = new Set();

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

  async function fetchUniqueHeaderImage(place, destination, requestId, highlights = []) {
    try {
      // Generate a unique seed based on requestId + place/destination combination
      const seed = requestId ? 
        hashCode(`${requestId}-${place}-${destination}`) : 
        Math.floor(Math.random() * 10000);
      
      // Generate AI-powered search terms using highlights
      const aiSearchTerms = await generateImageSearchTerms(place, destination, highlights);
      console.log(`🔍 AI search terms for ${place || destination}:`, aiSearchTerms);
      
      // 1. Try destination-gallery endpoint first for multiple images
      const galleryRes = await axios.get(`http://localhost:${process.env.PORT || 3001}/api/destination-gallery`, {
        params: {
          destinations: JSON.stringify([destination]),
          placesToVisit: JSON.stringify([place]),
          highlights: JSON.stringify(highlights),
          aiSearchTerms: JSON.stringify(aiSearchTerms),
          requestId: requestId,
          seed: seed
        },
        timeout: 10000
      });
      
      if (galleryRes.data?.images?.length) {
        // Get a random image from the gallery using the seed
        const randomIndex = seed % galleryRes.data.images.length;
        const selectedImage = galleryRes.data.images[randomIndex];
        
        if (selectedImage && !usedHeaderImages.has(selectedImage.url)) {
          usedHeaderImages.add(selectedImage.url);
          console.log(`✅ Using gallery image ${randomIndex + 1}/${galleryRes.data.images.length} for ${place || destination}`);
          return selectedImage.url;
        }
        
        // If the selected image was used, try others in a random order
        const shuffledIndices = Array.from(
          { length: galleryRes.data.images.length }, 
          (_, i) => i
        ).sort(() => (seed * (i + 1)) % 2 - 0.5);
        
        for (const idx of shuffledIndices) {
          const img = galleryRes.data.images[idx];
          if (!usedHeaderImages.has(img.url)) {
            usedHeaderImages.add(img.url);
            console.log(`✅ Using alternative gallery image ${idx + 1}/${galleryRes.data.images.length} for ${place || destination}`);
            return img.url;
          }
        }
      }
      
      // 2. Fallback to single place-image endpoint with different search variations
      const searchVariations = [
        { place, destination },
        { place: `${place} landmark`, destination },
        { place: `${place} attraction`, destination },
        { place: destination, destination: place },
        { place: `${destination} famous`, destination: place }
      ];
      
      // Try each variation in a random order based on seed
      const shuffledVariations = searchVariations.sort(() => (seed * 31) % 2 - 0.5);
      
      for (const params of shuffledVariations) {
        try {
          const single = await axios.get(`http://localhost:${process.env.PORT || 3001}/api/place-image`, {
            params: { ...params, requestId, seed },
            timeout: 10000
          });
          
          if (single.data?.imageUrl && !usedHeaderImages.has(single.data.imageUrl)) {
            usedHeaderImages.add(single.data.imageUrl);
            console.log(`✅ Using unique place-image for ${params.place}`);
            return single.data.imageUrl;
          }
        } catch (variationError) {
          console.log(`⚠️ Variation failed for ${params.place}:`, variationError.message);
          continue;
        }
      }
    } catch (e) {
      console.log('❌ Image fetch failed:', e.message);
    }
    
    // 3. Return null to signal default
    return null;
  }

  try {
    // Check if API key is configured
    if (!GEMINI_25_FLASH_LITE_API_KEY) {
      console.error('❌ GEMINI_25_FLASH_LITE_API_KEY not configured');
      return res.status(500).json({ error: 'AI service not configured. Please contact support.' });
    }

    console.log('🤖 Calling Gemini API for itinerary generation...');
    console.log('📝 Request parameters:', { from, to, departureDate, returnDate, travellers, travelClass, days });
    
    let response;
    try {
      response = await axios.post(
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
        const fallbackItineraries = generateFallbackItineraries(from, to, days, travellers, travelClass);
        
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
              travelClass: travelClass,
              headerImage: images.header,
              galleryImages: images.gallery,
              accommodationImage: images.accommodation
            });
            
            console.log(`💾 Saving fallback itinerary to database: ${pkg.packageName}`);
            await itinerary.save();
            console.log(`✅ Fallback itinerary saved successfully: ${pkg.packageName}`);
            
            savedItineraries.push({
              id: itinerary._id,
              slug: itinerary.slug,
              itineraryId: itinerary.itineraryId,
              headerImage: images.header,
              galleryImages: images.gallery,
              accommodationImage: images.accommodation,
              ...pkg
            });
          } catch (saveError) {
            console.error('❌ Error saving fallback itinerary:', saveError);
            const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            savedItineraries.push({
              id: tempId,
              slug: `temp-slug-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
              itineraryId: `TEMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              headerImage: '/default-travel.jpg',
              galleryImages: ['/default-travel.jpg', '/default-travel.jpg', '/default-travel.jpg'],
              accommodationImage: '/default-travel.jpg',
              ...pkg
            });
          }
        }
        
        const processingTime = Date.now() - startTime;
        await req.trackSearch(
          { from, to, departureDate, returnDate, travellers, travelClass },
          processingTime,
          savedItineraries.length
        );
        
        console.log(`🎉 Successfully processed ${savedItineraries.length} fallback itineraries`);
        console.log(`⏱️ Total processing time: ${processingTime}ms`);
        
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
    } catch (parseError) {
      console.error('❌ JSON parsing failed:', parseError.message);
      console.error('❌ JSON string:', jsonString);
      return res.status(500).json({ error: 'Failed to parse AI response. Please try again.' });
    }

    // Save each itinerary to database
    const savedItineraries = [];
    console.log('💾 Starting to save itineraries to database...');
    
    for (let i = 0; i < json.length; i++) {
      const pkg = json[i];
      console.log(`📦 Processing itinerary ${i + 1}/${json.length}: ${pkg.packageName}`);
      
      try {
        // Enhanced image generation using Google Places and Pixabay
        let images = {
          header: '/default-travel.jpg',
          gallery: ['/default-travel.jpg', '/default-travel.jpg', '/default-travel.jpg'],
          accommodation: '/default-travel.jpg'
        };
        
        try {
          // Use the new image service to get comprehensive images for the package
          const enhancedImages = await ImageService.getImagesForPackage(pkg);
          images = enhancedImages;
          console.log(`🖼️ Enhanced images generated for: ${pkg.packageName}`);
        } catch (imageError) {
          console.log('❌ Failed to generate enhanced images, using defaults. Error:', imageError.message);
          // Use default images only - no additional API calls to save costs
        }

        // Validate and format dates
        const formatDate = (dateString) => {
          console.log('Formatting date:', dateString);
          if (!dateString) {
            console.log('No date string, using current date');
            return new Date();
          }
          const date = new Date(dateString);
          if (isNaN(date.getTime())) {
            console.log('Invalid date, using current date');
            return new Date();
          }
          console.log('Valid date:', date);
          return date;
        };

        const itinerary = new Itinerary({
          title: pkg.packageName,
          days: pkg.days,
          destinations: pkg.destinations,
          placesToVisit: pkg.placesToVisit,
          highlights: pkg.highlights,
          price: pkg.price,
          fromLocation: from,
          toLocation: to,
          departureDate: formatDate(startDate),
          returnDate: formatDate(endDate),
          travelers: travellers,
          travelClass: travelClass,
          headerImage: images.header,
          galleryImages: images.gallery,
          accommodationImage: images.accommodation
        });
        
        console.log(`💾 Saving itinerary to database: ${pkg.packageName}`);
        await itinerary.save();
        console.log(`✅ Itinerary saved successfully: ${pkg.packageName}`);
        
        savedItineraries.push({
          id: itinerary._id,
          slug: itinerary.slug,
          itineraryId: itinerary.itineraryId,
          headerImage: images.header,
          galleryImages: images.gallery,
          accommodationImage: images.accommodation,
          ...pkg
        });
      } catch (saveError) {
        console.error('❌ Error saving itinerary to database:', saveError);
        console.error('❌ Itinerary data:', pkg);
        
        // If database save fails, still return the itinerary data
        // but with temporary IDs so the frontend can still work
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        console.log(`🔄 Using temporary ID: ${tempId}`);
        
        savedItineraries.push({
          id: tempId,
          slug: `temp-slug-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          itineraryId: `TEMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          headerImage: '/default-travel.jpg',
          galleryImages: ['/default-travel.jpg', '/default-travel.jpg', '/default-travel.jpg'],
          accommodationImage: '/default-travel.jpg',
          ...pkg
        });
      }
    }

    const processingTime = Date.now() - startTime;
    
    // Track the search activity
    await req.trackSearch(
      { from, to, departureDate, returnDate, travellers, travelClass },
      processingTime,
      savedItineraries.length
    );
    
    console.log(`🎉 Successfully processed ${savedItineraries.length} itineraries`);
    console.log(`⏱️ Total processing time: ${processingTime}ms`);
    
    res.json({ 
      itineraries: savedItineraries,
      message: 'Itineraries generated and saved successfully'
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
      // Format the day-wise plan before sending to frontend
      const formattedDetails = processItineraryDetails(details.toObject());
      return res.json({ details: formattedDetails });
    }
    
    // Generate new details if not exists
    const userPrompt = `You are an experienced travel agent. Create a complete, day-wise, practical travel itinerary for ${itinerary.days} days for a trip from ${itinerary.fromLocation} to ${itinerary.toLocation} (${itinerary.destinations?.join(', ')}) for a ${itinerary.travelClass} traveler.

**Your format must include:**
1️⃣ **Day-wise plan:** Each day with clear heading + bullet points for activities (Morning/Afternoon/Evening if needed).
2️⃣ **Accommodation:** Mention suggested hotel/resort for each night.
3️⃣ **Activities Included:** Mention if sightseeing tickets, guides, cruises, or adventure sports are covered.
4️⃣ **Transport Details:** Include arrival & departure flights or local transport if needed.
5️⃣ **Meals:** Breakfast/Lunch/Dinner info if included or recommended.
6️⃣ **Terms:** One short line about price inclusions/exclusions or taxes.
7️⃣ **Contact/Booking Link:** Add a clear call to action.

Return a JSON object with these exact fields:
- title (string, catchy title)
- dates (string, e.g. "19–20 July 2025")
- duration (string, e.g. "2 Days, 1 Night")
- from (string)
- to (string)
- priceEstimate (string, e.g. "₹25,000 per person")
- highlights (array of strings, 2–4 main attractions)
- transportClass (string)
- fullDayWisePlan (array of objects: { title: string, description: string, emoji: string })
- accommodation (string, e.g. "1-night stay at Hotel XYZ, CP")
- activitiesIncluded (string, e.g. "Sightseeing tickets, guided tours")
- transportDetails (string, e.g. "Flight timings, airline, class")
- meals (string, e.g. "Breakfast included")
- terms (string, e.g. "Price inclusive of taxes")
- bookingLink (string, e.g. "https://yourbooking.com/package/123")

Package summary to work with:
Title: ${itinerary.title}
Days: ${itinerary.days}
Destinations: ${itinerary.destinations?.join(', ')}
Places to Visit: ${itinerary.placesToVisit?.join(', ')}
Highlights: ${itinerary.highlights?.join(', ')}
Price: ${itinerary.price}
From: ${itinerary.fromLocation}
To: ${itinerary.toLocation}
Transport Class: ${itinerary.travelClass}

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
      bookingLink: json.bookingLink
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
    res.json({ itinerary });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
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
          const photoUrl = `http://localhost:${process.env.PORT || 3001}/api/proxy-google-image?photoreference=${photoReference}&maxwidth=${isMobile ? 400 : 800}&maxheight=${isMobile ? 300 : 600}&key=${GOOGLE_PLACES_API_KEY}`;
          
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
            `${searchTerm} ${destination}`,
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
                    const candidateUrl = `http://localhost:${process.env.PORT || 3001}/api/proxy-google-image?photoreference=${photoReference}&maxwidth=800&maxheight=600&key=${GOOGLE_PLACES_API_KEY}`;
                    
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
              imageUrl = `http://localhost:${process.env.PORT || 3001}/api/proxy-google-image?photoreference=${photoReference}&maxwidth=800&maxheight=600&key=${GOOGLE_PLACES_API_KEY}`;
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
        const photoUrl = `http://localhost:${process.env.PORT || 3001}/api/proxy-google-image?photoreference=${photoReference}&maxwidth=400&maxheight=300&key=${GOOGLE_PLACES_API_KEY}`;
        
        console.log('📸 Image source: google_places for', place);
        
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

// Analytics routes
app.use('/api/analytics', analyticsRoutes);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
  console.log(`📊 Test endpoint: http://localhost:${PORT}/api/test`);
  if (!process.env.MONGODB_URI) {
    console.log('⚠️  MongoDB not configured. Admin features disabled.');
  } else {
    console.log('✅ MongoDB configured. Admin features enabled.');
  }
}); 