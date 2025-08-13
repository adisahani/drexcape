const express = require('express');
const Itinerary = require('../models/Itinerary');
const ItineraryDetails = require('../models/ItineraryDetails');
const { checkItineraryAccess } = require('../middleware/activityTracker');

const router = express.Router();

// Function to format day-wise plan description
const formatDayWisePlan = (description) => {
  if (!description) return description;
  
  // Split by common time indicators
  const timeIndicators = ['Morning:', 'Afternoon:', 'Evening:', 'Night:', '🌅', '☀️', '🌆', '🌃', '🌙'];
  
  let formattedDescription = description;
  
  // Add line breaks and bold formatting for time indicators
  timeIndicators.forEach(indicator => {
    const regex = new RegExp(`(${indicator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    formattedDescription = formattedDescription.replace(regex, '\n\n**$1**');
  });
  
  // Clean up multiple line breaks
  formattedDescription = formattedDescription.replace(/\n{3,}/g, '\n\n');
  
  // Add bullet points for better readability
  formattedDescription = formattedDescription.replace(/([^:]+):\s*/g, '• **$1:** ');
  
  return formattedDescription.trim();
};

// Function to process itinerary details and format day-wise plan
const processItineraryDetails = (details) => {
  if (!details) return details;
  
  // Format day-wise plan if it exists
  if (details.fullDayWisePlan && Array.isArray(details.fullDayWisePlan)) {
    details.fullDayWisePlan = details.fullDayWisePlan.map(day => ({
      ...day,
      description: formatDayWisePlan(day.description)
    }));
  }
  
  return details;
};

// Save new itinerary
router.post('/', async (req, res) => {
  try {
    const itineraryData = req.body;
    console.log('Saving itinerary:', itineraryData);
    
    const itinerary = new Itinerary(itineraryData);
    await itinerary.save();
    
    console.log('Saved itinerary with slug:', itinerary.slug);
    res.json({ success: true, itinerary });
  } catch (error) {
    console.error('Save itinerary error:', error);
    res.status(500).json({ error: 'Failed to save itinerary' });
  }
});

// Get itinerary by slug with access control
router.get('/:slug', async (req, res) => {
  try {
    console.log('🏠 === Itineraries Router: GET /:slug ===');
    console.log('📦 slug:', req.params.slug);
    
    const itinerary = await Itinerary.findOne({ slug: req.params.slug });
    
    if (!itinerary) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }
    
    // Check if this is a popular itinerary (allow public access)
    const popularItineraries = await Itinerary.find({
      slug: { $exists: true, $ne: null, $ne: '' },
      title: { $exists: true, $ne: null, $ne: '' },
      fromLocation: { $exists: true, $ne: null, $ne: '' },
      toLocation: { $exists: true, $ne: null, $ne: '' },
      headerImage: { $exists: true, $ne: null, $ne: '' }
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('_id');
    
    const isPopularItinerary = popularItineraries.some(pop => pop._id.toString() === itinerary._id.toString());
    
    // Allow access if it's a popular itinerary
    if (isPopularItinerary) {
      console.log('Popular itinerary accessed, granting public access');
      
      // Track itinerary view
      await req.trackItineraryView(
        itinerary._id.toString(),
        itinerary.slug,
        0 // viewDuration will be calculated on frontend
      );
      
      return res.json({ itinerary });
    }
    
    // Check if user has access to this itinerary (for non-popular itineraries)
    const hasAccess = await checkItineraryAccess(req, itinerary._id.toString());
    
    if (!hasAccess) {
      // Return locked state with redirect info
      return res.status(403).json({ 
        error: 'Access denied',
        locked: true,
        message: 'Please fill the promotional form to access this itinerary',
        redirectUrl: '/form?redirect=/itinerary/' + req.params.slug
      });
    }
    
    // Track itinerary view
    await req.trackItineraryView(
      itinerary._id.toString(),
      itinerary.slug,
      0 // viewDuration will be calculated on frontend
    );
    
    res.json({ itinerary });
  } catch (error) {
    console.error('Get itinerary error:', error);
    res.status(500).json({ error: 'Failed to get itinerary' });
  }
});

// Get all itineraries (for admin)
router.get('/', async (req, res) => {
  try {
    const itineraries = await Itinerary.find().sort({ createdAt: -1 });
    res.json({ itineraries });
  } catch (error) {
    console.error('Get all itineraries error:', error);
    res.status(500).json({ error: 'Failed to get itineraries' });
  }
});

// Update itinerary
router.put('/:id', async (req, res) => {
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
    console.error('Update itinerary error:', error);
    res.status(500).json({ error: 'Update failed' });
  }
});

// Delete itinerary
router.delete('/:id', async (req, res) => {
  try {
    const itinerary = await Itinerary.findByIdAndDelete(req.params.id);
    if (!itinerary) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }
    
    // Also delete associated details
    await ItineraryDetails.findOneAndDelete({ itineraryId: req.params.id });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete itinerary error:', error);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// Get popular searches (recent itineraries)
router.get('/popular/searches', async (req, res) => {
  try {
    // Get recent itineraries with valid slugs and full details, limit to 10 most recent
    const popularItineraries = await Itinerary.find({
      slug: { $exists: true, $ne: null, $ne: '' }, // Only itineraries with valid slugs
      title: { $exists: true, $ne: null, $ne: '' }, // Must have title
      fromLocation: { $exists: true, $ne: null, $ne: '' }, // Must have from location
      toLocation: { $exists: true, $ne: null, $ne: '' }, // Must have to location
      headerImage: { $exists: true, $ne: null, $ne: '' } // Must have header image
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title destinations fromLocation toLocation price days highlights headerImage slug createdAt');
    
    console.log(`Found ${popularItineraries.length} valid itineraries for popular searches`);
    
    res.json({ popularItineraries });
  } catch (error) {
    console.error('Get popular searches error:', error);
    res.status(500).json({ error: 'Failed to get popular searches' });
  }
});

// Increment view count
router.post('/:id/view', async (req, res) => {
  try {
    await Itinerary.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    res.json({ success: true });
  } catch (error) {
    console.error('Update view count error:', error);
    res.status(500).json({ error: 'Failed to update view count' });
  }
});

// Increment share count
router.post('/:id/share', async (req, res) => {
  try {
    await Itinerary.findByIdAndUpdate(req.params.id, { $inc: { shares: 1 } });
    res.json({ success: true });
  } catch (error) {
    console.error('Update share count error:', error);
    res.status(500).json({ error: 'Failed to update share count' });
  }
});

module.exports = router;

// Export the formatting function for use in other files
module.exports.processItineraryDetails = processItineraryDetails; 