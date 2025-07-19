require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// Previous Mistral model and key for reuse:
// const MISTRAL_MODEL = 'mistralai/mistral-small-3.1-24b-instruct:free';
// const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
// Previous Llama model and key for reuse:
// const LLAMA_MODEL = 'meta-llama/llama-3.3-70b-instruct:free';
// const LLAMA_API_KEY = process.env.LLAMA_API_KEY;
// Previous Gemini model and key for reuse:
// const GEMINI_MODEL = 'google/gemini-2.0-flash-exp:free';
// const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Previous Gemini Flash model and key for reuse:
// const GEMINI_FLASH_MODEL = 'google/gemini-flash-1.5';
// const GEMINI_FLASH_API_KEY = process.env.GEMINI_FLASH_API_KEY;

const DEEPSEEK_MODEL = 'deepseek/deepseek-chat-v3-0324:free';
const DEEPSEEK_API_KEY = process.env.OPENROUTER_API_KEY;

app.post('/api/generate-itinerary', async (req, res) => {
  const { from, to, departureDate, returnDate, travellers, travelClass } = req.body;

  // Calculate days from dates
  const startDate = new Date(departureDate);
  const endDate = new Date(returnDate);
  const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

  const userPrompt = `You are an experienced travel agent. Create 5 complete, practical travel itinerary packages for a ${days}-day trip from ${from} to ${to} for ${travellers} ${travelClass} travelers.

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
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: DEEPSEEK_MODEL,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    console.log('AI Prompt sent:', userPrompt);
    
    // Try to parse the AI response as JSON
    let json = null;
    try {
      let content = response.data.choices?.[0]?.message?.content || '';
      // Remove markdown code block markers and trim
      let jsonString = content.replace(/```json|```/g, '').trim();
      // Extract the first array or object
      const match = jsonString.match(/\[.*\]|\{.*\}/s);
      if (match) jsonString = match[0];
      json = JSON.parse(jsonString);
    } catch (e) {
      console.error('Failed to parse AI JSON:', e);
      return res.status(500).json({ error: 'AI did not return valid JSON.' });
    }
    res.json({ itineraries: json });
  } catch (error) {
    console.error(error?.response?.data || error);
    res.status(500).json({ error: error.toString() });
  }
});

// Endpoint for full itinerary details (on demand)
app.post('/api/itinerary-details', async (req, res) => {
  const { title, days, destinations, placesToVisit, highlights, price, from, to, dates, transportClass } = req.body;
  const userPrompt = `You are an experienced travel agent. Create a complete, day-wise, practical travel itinerary for ${days} days for a trip from ${from} to ${to} (${destinations?.join(', ')}) for a ${transportClass} traveler.

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

**Format Example:**
{
  "title": "2-Day Delhi Explorer",
  "dates": "19–20 July 2025",
  "duration": "2 Days, 1 Night",
  "from": "Kolkata",
  "to": "Delhi",
  "priceEstimate": "₹5,200 per person",
  "highlights": ["Red Fort", "Street food tour", "Hotel stay"],
  "transportClass": "Economy",
  "fullDayWisePlan": [
    { "title": "Day 1: Arrival & Red Fort", "description": "Morning flight, check-in, visit Red Fort, dinner at local restaurant.", "emoji": "🏰" },
    { "title": "Day 2: Markets & Departure", "description": "Breakfast, Chandni Chowk shopping, return flight.", "emoji": "🛍️" }
  ],
  "accommodation": "1-night stay at Hotel XYZ, CP",
  "activitiesIncluded": "Sightseeing tickets, guided tours",
  "transportDetails": "IndiGo 6E-203, Economy",
  "meals": "Breakfast included",
  "terms": "Price inclusive of GST, subject to availability.",
  "bookingLink": "https://yourbooking.com/package/123"
}

Package summary to work with:
Title: ${title}
Days: ${days}
Destinations: ${destinations?.join(', ')}
Places to Visit: ${placesToVisit?.join(', ')}
Highlights: ${highlights?.join(', ')}
Price: ${price}
From: ${from}
To: ${to}
Transport Class: ${transportClass}

Return ONLY valid JSON. Do not include any explanation, comments, or markdown code blocks. All property names and strings must use double quotes.`;

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: DEEPSEEK_MODEL,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    console.log('AI Details Prompt sent:', userPrompt);
    
    // Try to parse the AI response as JSON
    let json = null;
    try {
      let content = response.data.choices?.[0]?.message?.content || '';
      // Remove markdown code block markers and trim
      let jsonString = content.replace(/```json|```/g, '').trim();
      // Extract the first object
      const match = jsonString.match(/\{.*\}/s);
      if (match) jsonString = match[0];
      json = JSON.parse(jsonString);
    } catch (e) {
      console.error('Failed to parse AI JSON:', e);
      return res.status(500).json({ error: 'AI did not return valid JSON.' });
    }
    res.json({ details: json });
  } catch (error) {
    console.error(error?.response?.data || error);
    res.status(500).json({ error: error.toString() });
  }
});

// Pixabay image proxy endpoint
app.get('/api/place-image', async (req, res) => {
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
    return res.status(500).json({ error: 'Failed to fetch image from Pixabay.' });
  }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`)); 