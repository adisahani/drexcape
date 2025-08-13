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
    emoji: String,
    description: String, // Keep for backward compatibility
    morning: String,     // New structured format
    afternoon: String,   // New structured format
    evening: String      // New structured format
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
  
  // Structured details for better display
  structuredDetails: {
    accommodationDetails: {
      hotelName: String,
      hotelType: String,
      nights: Number,
      roomType: String,
      amenities: [String],
      location: String
    },
    transportDetails: {
      arrival: String,
      departure: String,
      local: String,
      included: [String]
    },
    mealsDetails: {
      breakfast: String,
      lunch: String,
      dinner: String,
      included: [String],
      recommendations: [String]
    },
    activitiesDetails: {
      included: [String],
      optional: [String],
      guides: String,
      tickets: String
    },
    termsAndConditions: {
      priceInclusions: [String],
      priceExclusions: [String],
      cancellation: String,
      validity: String
    }
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