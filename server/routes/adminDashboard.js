const express = require('express');
const AIUsage = require('../models/AIUsage');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get AI Usage Statistics
router.get('/ai-usage', auth, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { period = '7d', endpoint } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Build query
    const query = { createdAt: { $gte: startDate } };
    if (endpoint) {
      query.endpoint = endpoint;
    }

    // Get usage statistics
    const usageStats = await AIUsage.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            endpoint: '$endpoint',
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          },
          count: { $sum: 1 },
          successCount: {
            $sum: { $cond: [{ $eq: ['$responseStatus', 'success'] }, 1, 0] }
          },
          errorCount: {
            $sum: { $cond: [{ $eq: ['$responseStatus', 'error'] }, 1, 0] }
          },
          avgResponseTime: { $avg: '$responseTime' },
          totalTokens: { $sum: '$tokensUsed' },
          totalCost: { $sum: '$cost' }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Get overall statistics
    const overallStats = await AIUsage.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          totalSuccess: {
            $sum: { $cond: [{ $eq: ['$responseStatus', 'success'] }, 1, 0] }
          },
          totalErrors: {
            $sum: { $cond: [{ $eq: ['$responseStatus', 'error'] }, 1, 0] }
          },
          avgResponseTime: { $avg: '$responseTime' },
          totalTokens: { $sum: '$tokensUsed' },
          totalCost: { $sum: '$cost' }
        }
      }
    ]);

    // Get endpoint breakdown
    const endpointStats = await AIUsage.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$endpoint',
          count: { $sum: 1 },
          successCount: {
            $sum: { $cond: [{ $eq: ['$responseStatus', 'success'] }, 1, 0] }
          },
          errorCount: {
            $sum: { $cond: [{ $eq: ['$responseStatus', 'error'] }, 1, 0] }
          },
          avgResponseTime: { $avg: '$responseTime' },
          totalTokens: { $sum: '$tokensUsed' },
          totalCost: { $sum: '$cost' }
        }
      }
    ]);

    // Get recent activity
    const recentActivity = await AIUsage.find(query)
      .sort({ createdAt: -1 })
      .limit(20)
      .select('-requestData');

    res.json({
      period,
      overallStats: overallStats[0] || {
        totalRequests: 0,
        totalSuccess: 0,
        totalErrors: 0,
        avgResponseTime: 0,
        totalTokens: 0,
        totalCost: 0
      },
      usageStats,
      endpointStats,
      recentActivity
    });
  } catch (error) {
    console.error('AI Usage stats error:', error);
    res.status(500).json({ error: 'Failed to fetch AI usage statistics.' });
  }
});

// Get detailed AI usage logs
router.get('/ai-usage/logs', auth, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { page = 1, limit = 50, endpoint, status } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    if (endpoint) query.endpoint = endpoint;
    if (status) query.responseStatus = status;

    const logs = await AIUsage.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-requestData');

    const total = await AIUsage.countDocuments(query);

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('AI Usage logs error:', error);
    res.status(500).json({ error: 'Failed to fetch AI usage logs.' });
  }
});

module.exports = router; 