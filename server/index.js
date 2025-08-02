require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const connectDB = require('./config/db');

// Connect to MongoDB (only if MONGODB_URI is provided)
if (process.env.MONGODB_URI) {
  connectDB();
} else {
  console.log('⚠️  MONGODB_URI not found. Admin features will not work.');
}

const app = express();
app.use(cors());
app.use(express.json());

// Import routes
const adminAuthRoutes = require('./routes/adminAuth');
const adminDashboardRoutes = require('./routes/adminDashboard');
const userRoutes = require('./routes/users');
const itineraryRoutes = require('./routes/itineraries');
const promotionalLeadsRoutes = require('./routes/promotionalLeads');

// Import middleware
const { trackAIUsage } = require('./middleware/aiUsageTracker');

// Import models
const Itinerary = require('./models/Itinerary');
const ItineraryDetails = require('./models/ItineraryDetails');

// Remove all previous model configs and keys
const GEMINI_25_FLASH_LITE_API_KEY = process.env.GEMINI_25_FLASH_LITE_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

// Generate and save basic itineraries
app.post('/api/generate-itinerary', trackAIUsage('generate-itinerary'), async (req, res) => {
  const { from, to, departureDate, returnDate, travellers, travelClass } = req.body;

  // Calculate days from dates
  const startDate = new Date(departureDate);
  const endDate = new Date(returnDate);
  const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

  // userPrompt construction remains unchanged
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

Return a JSON array of 5 packages. Each package object must have these exact fields:
- packageName (string, catchy title)
- days (number)
- destinations (array of strings)
- placesToVisit (array of strings, main attractions)
- highlights (array of strings, 2-4 key highlights)
- price (number, in INR)
- details (string, full day-wise itinerary with accommodation, transport, meals, terms, booking info)

**Format Example for each package:**
{
  "packageName": "Romantic Honeymoon Package",
  "days": 3,
  "destinations": ["Goa"],
  "placesToVisit": ["Butterfly Beach", "Old Goa Churches", "Mandovi River"],
  "highlights": ["Sunset cruise", "Private beach access", "Couples spa"],
  "price": 25000,
  "details": "**Day 1: Arrival & Sunset**\\n- Arrive at Goa Airport, private transfer to Beach Resort.\\n- Sunset cruise on Mandovi River.\\n- Candlelight dinner at beach shack.\\n\\n🏨 *Accommodation:* 1-night stay at Beach Resort, Deluxe Room, Breakfast Included.\\n\\n**Day 2: Private Beaches & Spa**\\n- Relaxing breakfast.\\n- Visit secluded Butterfly Beach by private boat.\\n- Couples Spa session at resort.\\n- Dinner at beach shack.\\n\\n🏨 *Accommodation:* 1-night stay at Beach Resort, Deluxe Room.\\n\\n**Day 3: Heritage & Departure**\\n- Visit Old Goa Churches: Basilica of Bom Jesus.\\n- Transfer to Goa Airport for return flight.\\n\\n✅ *Activities Included:* Sunset cruise, Butterfly Beach boat ride, spa session.\\n✈️ *Transport:* Private airport transfers, local sightseeing by car.\\n🍽️ *Meals:* Daily breakfast, 1 candlelight dinner included.\\n📌 *Terms:* Prices inclusive of GST, subject to availability.\\n📞 *Contact us to book now!*"
}

Return ONLY valid JSON array. Do not include any explanation, comments, or markdown code blocks. All property names and strings must use double quotes.`;

  try {
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
    const match = jsonString.match(/\[.*\]|\{.*\}/s);
    if (match) jsonString = match[0];
    let json = JSON.parse(jsonString);

    // Save each itinerary to database
    const savedItineraries = [];
    for (const pkg of json) {
      try {
        // Fetch image for this itinerary
        let headerImage = '/default-travel.jpg';
        try {
          const place = pkg.placesToVisit?.[0] || '';
          const destination = pkg.destinations?.[0] || '';
          if (place || destination) {
            const imageResponse = await axios.get('https://pixabay.com/api/', {
              params: {
                key: process.env.PIXABAY_API_KEY,
                q: place || destination,
                image_type: 'photo',
                orientation: 'horizontal',
                safesearch: 'true',
                per_page: 3,
              },
            });
            const imageData = imageResponse.data;
            if (imageData.hits && imageData.hits.length > 0) {
              headerImage = imageData.hits[0].webformatURL;
            }
          }
        } catch (imageError) {
          console.log('Failed to fetch image, using default. Error:', imageError.message);
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
          departureDate: startDate,
          returnDate: endDate,
          travelers: travellers,
          travelClass: travelClass,
          headerImage: headerImage
        });
        
        await itinerary.save();
        savedItineraries.push({
          id: itinerary._id,
          slug: itinerary.slug,
          itineraryId: itinerary.itineraryId,
          headerImage: headerImage,
          ...pkg
        });
      } catch (saveError) {
        console.error('Error saving itinerary to database:', saveError);
        // If database save fails, still return the itinerary data
        // but with temporary IDs so the frontend can still work
        savedItineraries.push({
          id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          slug: `temp-slug-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          itineraryId: `TEMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          headerImage: '/default-travel.jpg',
          ...pkg
        });
      }
    }

    res.json({ 
      itineraries: savedItineraries,
      message: 'Itineraries generated and saved successfully'
    });
  } catch (error) {
    console.error(error?.response?.data || error);
    res.status(500).json({ error: error.toString() });
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
      return res.json({ details });
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
    
    res.json({ details });
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

// Pixabay image proxy endpoint
app.get('/api/place-image', trackAIUsage('place-image'), async (req, res) => {
  let place = req.query.place || '';
  let destination = req.query.destination || '';
  const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;
  const tryTerms = [place, destination, 'India travel'];
  try {
    for (let term of tryTerms) {
      if (!term) continue;
      const pixabayRes = await axios.get('https://pixabay.com/api/', {
        params: {
          key: PIXABAY_API_KEY,
          q: term,
          image_type: 'photo',
          orientation: 'horizontal',
          safesearch: 'true',
          per_page: 3,
        },
      });
      const hits = pixabayRes.data.hits;
      if (hits && hits.length > 0) {
        return res.json({ imageUrl: hits[0].webformatURL });
      }
    }
    // If all fail, return null
    return res.json({ imageUrl: null });
  } catch (err) {
    console.error('Pixabay error:', err?.response?.data || err);
    console.error('Pixabay error details:', err.message);
    return res.status(500).json({ error: 'Failed to fetch image from Pixabay.' });
  }
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running!', timestamp: new Date().toISOString() });
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