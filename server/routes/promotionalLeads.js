const express = require('express');
const router = express.Router();
const PromotionalLead = require('../models/PromotionalLead');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Submit promotional form
router.post('/submit', async (req, res) => {
  try {
    const { name, phone } = req.body;
    
    // Validate required fields
    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }

    // Check if phone already exists
    const existingLead = await PromotionalLead.findOne({ phone });
    if (existingLead) {
      return res.status(400).json({ error: 'Phone number already registered' });
    }

    // Create new lead
    const lead = new PromotionalLead({
      name,
      phone,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      pageUrl: req.get('Referer') || 'direct'
    });

    await lead.save();

    // Create or update user record
    let user = await User.findOne({ phone });
    if (!user) {
      user = new User({
        name,
        phone,
        email: '', // Optional
        marketingConsent: true,
        newsletterSubscription: true,
        lastActivity: new Date()
      });
    } else {
      // Update existing user
      user.name = name;
      user.lastActivity = new Date();
    }
    await user.save();

    // Set user ID in session for activity tracking
    req.session = req.session || {};
    req.session.userId = user._id.toString();
    req.session.userPhone = phone;

    // Track form submission
    await req.trackFormSubmission('promotional', { name, phone }, req.get('Referer') || 'direct');

    res.status(201).json({ 
      success: true, 
      message: 'Thank you! We\'ll contact you soon.',
      leadId: lead._id 
    });

  } catch (error) {
    console.error('Error submitting promotional lead:', error);
    
    // Track error
    await req.trackError('form_submission', error.toString(), 'promotional_form');
    
    res.status(500).json({ error: 'Failed to submit form' });
  }
});

// Get all leads (admin only)
router.get('/', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    
    // Get total count for pagination
    const total = await PromotionalLead.countDocuments();
    
    // Calculate skip value for pagination
    const skip = (page - 1) * limit;
    
    const leads = await PromotionalLead.find()
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit);
    
    res.json({
      leads,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// Get promotional leads statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await PromotionalLead.aggregate([
      { $match: { submittedAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$submittedAt' } }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': -1 } }
    ]);

    const totalLeads = await PromotionalLead.countDocuments({ submittedAt: { $gte: startDate } });
    const totalLeadsAllTime = await PromotionalLead.countDocuments();

    res.json({
      period: `${days} days`,
      totalLeads,
      totalLeadsAllTime,
      dailyStats: stats
    });

  } catch (error) {
    console.error('Error fetching promotional leads stats:', error);
    res.status(500).json({ error: 'Failed to fetch promotional leads statistics' });
  }
});

// Update lead status (admin only)
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const lead = await PromotionalLead.findByIdAndUpdate(
      req.params.id,
      { status, notes },
      { new: true }
    );
    
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    
    res.json(lead);
  } catch (error) {
    console.error('Error updating lead status:', error);
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

// Delete promotional lead
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const lead = await PromotionalLead.findById(id);
    if (!lead) {
      return res.status(404).json({ error: 'Promotional lead not found' });
    }

    await PromotionalLead.findByIdAndDelete(id);
    
    console.log(`🗑️ Deleted promotional lead: ${lead.name} (${lead.phone})`);
    
    res.json({ 
      message: 'Promotional lead deleted successfully',
      deletedLead: {
        id: lead._id,
        name: lead.name,
        phone: lead.phone
      }
    });

  } catch (error) {
    console.error('Error deleting promotional lead:', error);
    res.status(500).json({ error: 'Failed to delete promotional lead' });
  }
});

module.exports = router; 