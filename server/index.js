const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/generate-itinerary', async (req, res) => {
  const { from, to, departureDate, returnDate, travellers, travelClass } = req.body;

  const userPrompt = `You are a travel agent. For the following trip, return a JSON array of 5 itinerary packages. Each package should have: packageName (string), days (number), destinations (array of strings), placesToVisit (array of strings, e.g., ["Red Fort", "Lotus Temple", ...]), highlights (array of strings), price (number, in INR), details (string, full day-by-day itinerary in Markdown). Trip details: From: ${from} To: ${to} Departure: ${departureDate} Return: ${returnDate} Travellers: ${travellers} Class: ${travelClass} Return ONLY valid JSON, no explanation or extra text.`;

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'deepseek/deepseek-chat-v3-0324:free',
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      },
      {
        headers: {
          Authorization: 'Bearer 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',
          'Content-Type': 'application/json',
        },
      }
    );
    // Try to parse the AI response as JSON
    let json = null;
    try {
      // Some models wrap JSON in markdown code blocks, so strip them
      const content = response.data.choices?.[0]?.message?.content || '';
      const jsonString = content.replace(/^```json|```$/g, '').trim();
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

const PORT = 3001;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`)); 