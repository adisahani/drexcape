const express = require('express');
const Itinerary = require('../models/Itinerary');
const ItineraryDetails = require('../models/ItineraryDetails');

const router = express.Router();

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

// Get itinerary by slug
router.get('/:slug', async (req, res) => {
  try {
    const itinerary = await Itinerary.findOne({ slug: req.params.slug });
    
    if (!itinerary) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }
    
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