const mongoose = require('mongoose');

const itineraryDetailsSchema = new mongoose.Schema({
  // Reference to basic itinerary
  itineraryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Itinerary',
    required: true,
    unique: true
  },
  
  // Detailed information
  title: {
    type: String,
    required: true
  },
  dates: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  priceEstimate: {
    type: String,
    required: true
  },
  transportClass: {
    type: String,
    required: true
  },
  
  // Day-wise plan
  fullDayWisePlan: [{
    title: String,
    description: String,
    emoji: String
  }],
  
  // Additional details
  accommodation: {
    type: String,
    required: true
  },
  activitiesIncluded: {
    type: String,
    required: true
  },
  transportDetails: {
    type: String,
    required: true
  },
  meals: {
    type: String,
    required: true
  },
  terms: {
    type: String,
    required: true
  },
  bookingLink: {
    type: String,
    required: true
  },
  
  // Metadata
  generatedAt: {
    type: Date,
    default: Date.now
  },
  aiTokensUsed: {
    type: Number,
    default: 0
  },
  aiCost: {
    type: Number,
    default: 0
  }
});

// Index for efficient queries
itineraryDetailsSchema.index({ itineraryId: 1 });

module.exports = mongoose.model('ItineraryDetails', itineraryDetailsSchema); 