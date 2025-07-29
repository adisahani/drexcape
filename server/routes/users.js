const express = require('express');
const User = require('../models/User');
const Itinerary = require('../models/Itinerary');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Register new user or get existing user
router.post('/register', async (req, res) => {
  try {
    const { name, phone, email, marketingConsent, newsletterSubscription, searchData } = req.body;

    // Validate required fields
    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone number are required.' });
    }

    // Check if user already exists by phone
    let user = await User.findOne({ phone });

    if (user) {
      // Update existing user's information
      user.name = name;
      if (email) user.email = email;
      user.marketingConsent = marketingConsent;
      user.newsletterSubscription = newsletterSubscription;
      user.lastActivity = new Date();
      
      // Add search data if provided
      if (searchData) {
        await user.addSearch({
          from: searchData.from,
          to: searchData.to,
          departureDate: searchData.departureDate,
          returnDate: searchData.returnDate,
          travellers: searchData.travellers,
          travelClass: searchData.travelClass,
          resultsCount: 0
        });
      }

      await user.save();
    } else {
      // Create new user
      user = new User({
        name,
        phone,
        email,
        marketingConsent,
        newsletterSubscription
      });

      // Add search data if provided
      if (searchData) {
        await user.addSearch({
          from: searchData.from,
          to: searchData.to,
          departureDate: searchData.departureDate,
          returnDate: searchData.returnDate,
          travellers: searchData.travellers,
          travelClass: searchData.travelClass,
          resultsCount: 0
        });
      }

      await user.save();
    }

    res.json({
      message: 'User data saved successfully',
      user: {
        userId: user.userId,
        name: user.name,
        phone: user.phone,
        email: user.email
      }
    });
  } catch (error) {
    console.error('User registration error:', error);
    res.status(500).json({ error: 'Failed to save user data.' });
  }
});

// Track user search
router.post('/track-search', async (req, res) => {
  try {
    const { userId, searchData } = req.body;

    if (!userId || !searchData) {
      return res.status(400).json({ error: 'User ID and search data are required.' });
    }

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    await user.addSearch(searchData);

    res.json({ message: 'Search tracked successfully' });
  } catch (error) {
    console.error('Search tracking error:', error);
    res.status(500).json({ error: 'Failed to track search.' });
  }
});

// Track itinerary view
router.post('/track-view', async (req, res) => {
  try {
    const { userId, itineraryId, timeSpent } = req.body;

    if (!userId || !itineraryId) {
      return res.status(400).json({ error: 'User ID and itinerary ID are required.' });
    }

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    await user.addViewedItinerary(itineraryId, timeSpent);

    // Update itinerary views
    await Itinerary.findOneAndUpdate(
      { itineraryId },
      { 
        $inc: { views: 1 },
        lastViewed: new Date()
      }
    );

    res.json({ message: 'View tracked successfully' });
  } catch (error) {
    console.error('View tracking error:', error);
    res.status(500).json({ error: 'Failed to track view.' });
  }
});

// Track itinerary share
router.post('/track-share', async (req, res) => {
  try {
    const { userId, itineraryId } = req.body;

    if (!userId || !itineraryId) {
      return res.status(400).json({ error: 'User ID and itinerary ID are required.' });
    }

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    await user.markItineraryShared(itineraryId);

    // Update itinerary shares
    await Itinerary.findOneAndUpdate(
      { itineraryId },
      { $inc: { shares: 1 } }
    );

    res.json({ message: 'Share tracked successfully' });
  } catch (error) {
    console.error('Share tracking error:', error);
    res.status(500).json({ error: 'Failed to track share.' });
  }
});

// Get user by phone number
router.get('/by-phone/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user.' });
  }
});

// Admin routes (protected)
router.get('/admin/users', auth, async (req, res) => {
  try {
    const users = await User.find({})
      .select('-__v')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users.' });
  }
});

router.get('/admin/users/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findOne({ userId }).select('-__v');

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user.' });
  }
});

module.exports = router; 