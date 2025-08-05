const mongoose = require('mongoose');

const userActivitySchema = new mongoose.Schema({
  // User identification
  userId: {
    type: String,
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  userAgent: String,
  ipAddress: String,

  // Activity type and details
  activityType: {
    type: String,
    required: true,
    enum: ['search', 'form_submission', 'itinerary_view', 'itinerary_share', 'itinerary_bookmark', 'page_view', 'error']
  },

  // Search activity details
  searchData: {
    from: String,
    to: String,
    departureDate: Date,
    returnDate: Date,
    travellers: Number,
    travelClass: String,
    budget: Number,
    searchQuery: String,
    resultsCount: Number,
    processingTime: Number, // in milliseconds
    aiUsage: Boolean
  },

  // Form submission details
  formData: {
    formType: {
      type: String,
      enum: ['promotional', 'contact', 'newsletter', 'feedback', 'user_login', 'user_register']
    },
    fields: mongoose.Schema.Types.Mixed,
    submissionSource: String, // which page/form
    conversion: Boolean // whether it led to a booking
  },

  // Itinerary interaction details
  itineraryData: {
    itineraryId: String,
    itinerarySlug: String,
    viewDuration: Number, // in seconds
    interactionType: {
      type: String,
      enum: ['view', 'share', 'bookmark', 'download', 'print']
    },
    sharePlatform: String, // facebook, twitter, whatsapp, etc.
    fromPage: String // which page they came from
  },

  // Page view details
  pageData: {
    pageUrl: String,
    pageTitle: String,
    referrer: String,
    timeOnPage: Number // in seconds
  },

  // Error details
  errorData: {
    errorType: String,
    errorMessage: String,
    stackTrace: String,
    userAction: String // what they were trying to do
  },

  // Metadata
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  deviceInfo: {
    deviceType: String, // mobile, tablet, desktop
    browser: String,
    os: String,
    screenResolution: String
  },
  location: {
    country: String,
    city: String,
    timezone: String
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
userActivitySchema.index({ userId: 1, timestamp: -1 });
userActivitySchema.index({ activityType: 1, timestamp: -1 });
userActivitySchema.index({ sessionId: 1, timestamp: -1 });

// Static methods for analytics
userActivitySchema.statics.getUserAnalytics = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return await this.aggregate([
    { $match: { userId, timestamp: { $gte: startDate } } },
    {
      $group: {
        _id: {
          activityType: '$activityType',
          date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.date': -1 } }
  ]);
};

userActivitySchema.statics.getSearchAnalytics = async function(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return await this.aggregate([
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
        avgProcessingTime: { $avg: '$searchData.processingTime' },
        avgResultsCount: { $avg: '$searchData.resultsCount' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

userActivitySchema.statics.getFormSubmissionAnalytics = async function(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return await this.aggregate([
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
        count: { $sum: 1 },
        conversions: { $sum: { $cond: ['$formData.conversion', 1, 0] } }
      }
    },
    { $sort: { '_id.date': -1 } }
  ]);
};

module.exports = mongoose.model('UserActivity', userActivitySchema); 