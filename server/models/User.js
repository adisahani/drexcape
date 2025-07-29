const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Basic user information
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true // Allow multiple null values
  },

  // User identification
  userId: {
    type: String,
    required: true,
    unique: true
  },

  // User preferences and settings
  preferences: {
    travelClass: {
      type: String,
      default: 'Economy'
    },
    preferredDestinations: [String],
    budgetRange: {
      min: Number,
      max: Number
    }
  },

  // Search history and interactions
  searchHistory: [{
    from: String,
    to: String,
    departureDate: Date,
    returnDate: Date,
    travellers: Number,
    travelClass: String,
    searchDate: {
      type: Date,
      default: Date.now
    },
    resultsCount: Number,
    clickedItineraries: [String] // Array of itinerary IDs
  }],

  // Viewed itineraries
  viewedItineraries: [{
    itineraryId: {
      type: String,
      ref: 'Itinerary'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    },
    timeSpent: Number, // in seconds
    shared: {
      type: Boolean,
      default: false
    }
  }],

  // User activity tracking
  lastActivity: {
    type: Date,
    default: Date.now
  },
  totalSearches: {
    type: Number,
    default: 0
  },
  totalViews: {
    type: Number,
    default: 0
  },

  // User status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },

  // Marketing and communication
  marketingConsent: {
    type: Boolean,
    default: false
  },
  newsletterSubscription: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Generate unique userId
userSchema.pre('save', async function(next) {
  if (!this.userId) {
    this.userId = `USER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

// Methods
userSchema.methods.addSearch = function(searchData) {
  this.searchHistory.push(searchData);
  this.totalSearches += 1;
  this.lastActivity = new Date();
  return this.save();
};

userSchema.methods.addViewedItinerary = function(itineraryId, timeSpent = 0) {
  const existing = this.viewedItineraries.find(v => v.itineraryId === itineraryId);
  if (existing) {
    existing.viewedAt = new Date();
    existing.timeSpent = timeSpent;
  } else {
    this.viewedItineraries.push({
      itineraryId,
      timeSpent
    });
  }
  this.totalViews += 1;
  this.lastActivity = new Date();
  return this.save();
};

userSchema.methods.markItineraryShared = function(itineraryId) {
  const viewed = this.viewedItineraries.find(v => v.itineraryId === itineraryId);
  if (viewed) {
    viewed.shared = true;
    return this.save();
  }
  return this;
};

// Indexes for efficient queries (only add non-unique indexes here)
userSchema.index({ lastActivity: -1 });
userSchema.index({ totalSearches: -1 });

module.exports = mongoose.model('User', userSchema); 