const express = require('express');
const router = express.Router();
const PromotionalLead = require('../models/PromotionalLead');
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

    res.status(201).json({ 
      success: true, 
      message: 'Thank you! We\'ll contact you soon.',
      leadId: lead._id 
    });

  } catch (error) {
    console.error('Error submitting promotional lead:', error);
    res.status(500).json({ error: 'Failed to submit form' });
  }
});

// Get all leads (admin only)
router.get('/', auth, async (req, res) => {
  try {
    const leads = await PromotionalLead.find()
      .sort({ submittedAt: -1 })
      .limit(100);
    
    res.json(leads);
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// Get lead statistics (admin only)
router.get('/stats', auth, async (req, res) => {
  try {
    const totalLeads = await PromotionalLead.countDocuments();
    const newLeads = await PromotionalLead.countDocuments({ status: 'new' });
    const contactedLeads = await PromotionalLead.countDocuments({ status: 'contacted' });
    const convertedLeads = await PromotionalLead.countDocuments({ status: 'converted' });
    
    // Get leads from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentLeads = await PromotionalLead.countDocuments({
      submittedAt: { $gte: thirtyDaysAgo }
    });

    res.json({
      total: totalLeads,
      new: newLeads,
      contacted: contactedLeads,
      converted: convertedLeads,
      recent: recentLeads
    });
  } catch (error) {
    console.error('Error fetching lead stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
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

module.exports = router; 