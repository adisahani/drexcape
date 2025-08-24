const express = require('express');
const router = express.Router();
const UserActivity = require('../models/UserActivity');
const User = require('../models/User');
const PromotionalLead = require('../models/PromotionalLead');
const { auth } = require('../middleware/auth');

// Get comprehensive analytics dashboard
router.get('/dashboard', auth, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get activity counts by type
    const activityCounts = await UserActivity.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: '$activityType',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get total counts for dashboard cards
    const totalSearches = await UserActivity.countDocuments({ 
      activityType: 'search', 
      timestamp: { $gte: startDate } 
    });

    const totalSubmissions = await UserActivity.countDocuments({ 
      activityType: 'form_submission', 
      timestamp: { $gte: startDate } 
    });

    const totalViews = await UserActivity.countDocuments({ 
      activityType: 'itinerary_view', 
      timestamp: { $gte: startDate } 
    });

    const uniqueUserIds = await UserActivity.distinct('userId', { 
      timestamp: { $gte: startDate } 
    });

    // Get user details for non-anonymous users
    const nonAnonymousUserIds = uniqueUserIds.filter(id => id !== 'anonymous');
    let uniqueUsers = uniqueUserIds.length;
    let identifiedUsers = 0;

    if (nonAnonymousUserIds.length > 0) {
      const users = await User.find({ _id: { $in: nonAnonymousUserIds } })
        .select('name phone')
        .lean();
      identifiedUsers = users.length;
    }

    // Get device analytics
    const deviceAnalytics = await UserActivity.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: '$deviceInfo.deviceType',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get top searched routes
    const topSearches = await UserActivity.aggregate([
      { 
        $match: { 
          activityType: 'search', 
          timestamp: { $gte: startDate } 
        } 
      },
      {
        $group: {
          _id: {
            from: '$searchData.from',
            to: '$searchData.to'
          },
          count: { $sum: 1 },
          avgProcessingTime: { $avg: '$searchData.processingTime' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get promotional lead analytics
    const leadStats = await PromotionalLead.aggregate([
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

    res.json({
      period: `${days} days`,
      totalSearches,
      totalSubmissions,
      totalViews,
      uniqueUsers: uniqueUsers,
      identifiedUsers,
      anonymousUsers: uniqueUsers - identifiedUsers,
      activityCounts,
      deviceAnalytics,
      topSearches,
      leadStats
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get user activity timeline
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const days = parseInt(req.query.days) || 30;

    const userActivities = await UserActivity.find({
      userId,
      timestamp: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
    })
    .sort({ timestamp: -1 })
    .limit(100);

    const userAnalytics = await UserActivity.getUserAnalytics(userId, days);

    res.json({
      userId,
      activities: userActivities,
      analytics: userAnalytics
    });

  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ error: 'Failed to fetch user activity' });
  }
});

// Get search performance metrics
router.get('/search-performance', auth, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const searchPerformance = await UserActivity.aggregate([
      { 
        $match: { 
          activityType: 'search', 
          timestamp: { $gte: startDate } 
        } 
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
          },
          totalSearches: { $sum: 1 },
          avgProcessingTime: { $avg: '$searchData.processingTime' },
          avgResultsCount: { $avg: '$searchData.resultsCount' },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      {
        $project: {
          date: '$_id.date',
          totalSearches: 1,
          avgProcessingTime: 1,
          avgResultsCount: 1,
          uniqueUsers: { $size: '$uniqueUsers' }
        }
      },
      { $sort: { date: -1 } }
    ]);

    res.json(searchPerformance);

  } catch (error) {
    console.error('Error fetching search performance:', error);
    res.status(500).json({ error: 'Failed to fetch search performance' });
  }
});

// Get form conversion analytics
router.get('/form-conversions', auth, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const formConversions = await UserActivity.aggregate([
      { 
        $match: { 
          activityType: 'form_submission', 
          timestamp: { $gte: startDate } 
        } 
      },
      {
        $group: {
          _id: {
            formType: '$formData.formType',
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
          },
          submissions: { $sum: 1 },
          conversions: { $sum: { $cond: ['$formData.conversion', 1, 0] } }
        }
      },
      {
        $project: {
          formType: '$_id.formType',
          date: '$_id.date',
          submissions: 1,
          conversions: 1,
          conversionRate: {
            $multiply: [
              { $divide: ['$conversions', '$submissions'] },
              100
            ]
          }
        }
      },
      { $sort: { date: -1 } }
    ]);

    res.json(formConversions);

  } catch (error) {
    console.error('Error fetching form conversions:', error);
    res.status(500).json({ error: 'Failed to fetch form conversions' });
  }
});

// Get real-time activity feed
router.get('/activity-feed', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const activityType = req.query.type; // optional filter
    const dateRange = req.query.range || '7d';
    const deviceType = req.query.device; // optional filter

    console.log('🔍 Activity feed request:', {
      limit,
      page,
      activityType,
      dateRange,
      deviceType,
      query: req.query
    });

    // Calculate date range
    const days = parseInt(dateRange.replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const matchStage = { timestamp: { $gte: startDate } };
    if (activityType && activityType !== 'all') {
      if (activityType === 'user_login' || activityType === 'user_register') {
        matchStage.activityType = 'form_submission';
        matchStage['formData.formType'] = activityType;
      } else {
        matchStage.activityType = activityType;
      }
    }
    if (deviceType && deviceType !== 'all') {
      matchStage['deviceInfo.deviceType'] = deviceType;
    }

    console.log('🔍 MongoDB match stage:', JSON.stringify(matchStage, null, 2));

    // Get total count for pagination
    const total = await UserActivity.countDocuments(matchStage);
    console.log('📊 Total activities found:', total);

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    const activities = await UserActivity.find(matchStage)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    console.log('📊 Activities retrieved:', activities.length);
    console.log('📊 Activity types found:', [...new Set(activities.map(a => a.activityType))]);
    console.log('📊 Form submission types found:', activities
      .filter(a => a.activityType === 'form_submission')
      .map(a => a.formData?.formType)
      .filter(Boolean)
    );

    // Get user details for non-anonymous users
    const userIds = activities
      .filter(activity => activity.userId !== 'anonymous')
      .map(activity => activity.userId);

    let userDetails = {};
    if (userIds.length > 0) {
      const users = await User.find({ _id: { $in: userIds } })
        .select('name phone email')
        .lean();
      
      users.forEach(user => {
        userDetails[user._id.toString()] = {
          name: user.name,
          phone: user.phone,
          email: user.email
        };
      });
      
      console.log('📊 User details found for:', Object.keys(userDetails).length, 'users');
    }

    // Add user details to activities
    const activitiesWithUserDetails = activities.map(activity => {
      const userDetail = userDetails[activity.userId];
      return {
        ...activity,
        userInfo: activity.userId === 'anonymous' 
          ? { name: 'Anonymous User', phone: 'N/A', email: 'N/A' }
          : userDetail || { name: 'Unknown User', phone: 'N/A', email: 'N/A' }
      };
    });

    // Log some sample activities for debugging
    if (activitiesWithUserDetails.length > 0) {
      console.log('📊 Sample activities:');
      activitiesWithUserDetails.slice(0, 3).forEach((activity, index) => {
        console.log(`  ${index + 1}. ${activity.activityType} - ${activity.userInfo.name} - ${activity.timestamp}`);
        if (activity.activityType === 'form_submission') {
          console.log(`     Form type: ${activity.formData?.formType}`);
          console.log(`     Fields:`, activity.formData?.fields);
        }
      });
    }

    res.json({ 
      activities: activitiesWithUserDetails,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('❌ Error fetching activity feed:', error);
    res.status(500).json({ error: 'Failed to fetch activity feed' });
  }
});

// Get login activity statistics
router.get('/login-stats', auth, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    console.log('🔍 Login stats request:', { days, startDate });

    // Get login activities
    const loginActivities = await UserActivity.aggregate([
      { 
        $match: { 
          activityType: 'form_submission',
          'formData.formType': 'user_login',
          timestamp: { $gte: startDate } 
        } 
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
          },
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      {
        $project: {
          date: '$_id.date',
          loginCount: '$count',
          uniqueUsers: { $size: '$uniqueUsers' }
        }
      },
      { $sort: { date: -1 } }
    ]);

    // Get registration activities
    const registrationActivities = await UserActivity.aggregate([
      { 
        $match: { 
          activityType: 'form_submission',
          'formData.formType': 'user_register',
          timestamp: { $gte: startDate } 
        } 
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
          },
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      {
        $project: {
          date: '$_id.date',
          registrationCount: '$count',
          uniqueUsers: { $size: '$uniqueUsers' }
        }
      },
      { $sort: { date: -1 } }
    ]);

    // Get total login count
    const totalLogins = await UserActivity.countDocuments({
      activityType: 'form_submission',
      'formData.formType': 'user_login',
      timestamp: { $gte: startDate }
    });

    // Get total registration count
    const totalRegistrations = await UserActivity.countDocuments({
      activityType: 'form_submission',
      'formData.formType': 'user_register',
      timestamp: { $gte: startDate }
    });

    // Get unique users who logged in
    const uniqueLoginUsers = await UserActivity.distinct('userId', {
      activityType: 'form_submission',
      'formData.formType': 'user_login',
      timestamp: { $gte: startDate }
    });

    // Get unique users who registered
    const uniqueRegistrationUsers = await UserActivity.distinct('userId', {
      activityType: 'form_submission',
      'formData.formType': 'user_register',
      timestamp: { $gte: startDate }
    });

    // Get user details for non-anonymous login users
    const nonAnonymousUserIds = uniqueLoginUsers.filter(id => id !== 'anonymous');
    let loginUserDetails = [];
    
    if (nonAnonymousUserIds.length > 0) {
      const users = await User.find({ _id: { $in: nonAnonymousUserIds } })
        .select('name phone email lastActivity')
        .lean();
      
      loginUserDetails = users.map(user => ({
        id: user._id.toString(),
        name: user.name,
        phone: user.phone,
        email: user.email,
        lastActivity: user.lastActivity
      }));
    }

    // Get user details for non-anonymous registration users
    const nonAnonymousRegistrationUserIds = uniqueRegistrationUsers.filter(id => id !== 'anonymous');
    let registrationUserDetails = [];
    
    if (nonAnonymousRegistrationUserIds.length > 0) {
      const users = await User.find({ _id: { $in: nonAnonymousRegistrationUserIds } })
        .select('name phone email lastActivity')
        .lean();
      
      registrationUserDetails = users.map(user => ({
        id: user._id.toString(),
        name: user.name,
        phone: user.phone,
        email: user.email,
        lastActivity: user.lastActivity
      }));
    }

    console.log('📊 Login stats:', {
      totalLogins,
      totalRegistrations,
      uniqueLoginUsers: uniqueLoginUsers.length,
      uniqueRegistrationUsers: uniqueRegistrationUsers.length,
      loginUserDetails: loginUserDetails.length,
      registrationUserDetails: registrationUserDetails.length,
      dailyLoginStats: loginActivities.length,
      dailyRegistrationStats: registrationActivities.length
    });

    res.json({
      period: `${days} days`,
      totalLogins,
      totalRegistrations,
      uniqueLoginUsers: uniqueLoginUsers.length,
      uniqueRegistrationUsers: uniqueRegistrationUsers.length,
      loginUserDetails,
      registrationUserDetails,
      dailyLoginStats: loginActivities,
      dailyRegistrationStats: registrationActivities
    });

  } catch (error) {
    console.error('❌ Error fetching login stats:', error);
    res.status(500).json({ error: 'Failed to fetch login statistics' });
  }
});

// Export analytics data
router.get('/export', auth, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const exportData = await UserActivity.find({
      timestamp: { $gte: startDate }
    })
    .select('-__v')
    .sort({ timestamp: -1 });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=analytics-${Date.now()}.json`);
    res.json(exportData);

  } catch (error) {
    console.error('Error exporting analytics:', error);
    res.status(500).json({ error: 'Failed to export analytics' });
  }
});

module.exports = router; 