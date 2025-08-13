const mongoose = require('mongoose');

// Clear any existing model to avoid conflicts
if (mongoose.models.Itinerary) {
  delete mongoose.models.Itinerary;
}

const itinerarySchema = new mongoose.Schema({
  // Basic itinerary information
  title: {
    type: String,
    required: true,
    index: true
  },
  days: {
    type: Number,
    required: true
  },
  destinations: [{
    type: String
  }],
  placesToVisit: [{
    type: String
  }],
  highlights: [{
    type: String
  }],
  price: {
    type: Number,
    required: true
  },
  fromLocation: {
    type: String,
    required: true,
    index: true
  },
  toLocation: {
    type: String,
    required: true,
    index: true
  },
  departureDate: {
    type: Date,
    required: true
  },
  returnDate: {
    type: Date,
    required: true
  },
  travelers: {
    type: Number,
    required: true
  },

  
  // Unique identifiers
  slug: {
    type: String,
    unique: true,
    index: true
  },
  itineraryId: {
    type: String,
    unique: true
  },
  
  // Analytics
  views: {
    type: Number,
    default: 0
  },
  shares: {
    type: Number,
    default: 0
  },
  
  // SEO metadata
  metaTitle: String,
  metaDescription: String,
  
  // Enhanced image fields
  headerImage: {
    type: String,
    default: '/default-travel.jpg'
  },
  galleryImages: [{
    type: String
  }],
  accommodationImage: {
    type: String,
    default: '/default-travel.jpg'
  },
  
  // Two-stage generation fields
  needsDetailedGeneration: {
    type: Boolean,
    default: false
  },
  packageType: {
    type: String,
    enum: ['budget', 'mid-range', 'luxury'],
    default: 'mid-range'
  },
  
  // Professional package structure
  summary: String,
  pricePP: Number,
  priceBreakdown: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Accept any shape for hotel example to avoid validation errors across variants
  hotelExample: { type: mongoose.Schema.Types.Mixed, default: {} },
  topAttractions: [String],
  duration: String,
  groupSize: String,
  inclusions: [String],
  exclusions: [String],
  
  // Detailed information (generated on-demand)
  tripTitle: String,
  priceSummary: String,
  transport: {
    toDestination: String,
    local: String,
    pickupDetails: String,
    dropoffDetails: String
  },
  // Detailed data also as flexible Mixed
  accommodation: { type: mongoose.Schema.Types.Mixed, default: {} },
  dayPlans: [{
    day: Number,
    theme: String,
    morning: String,
    afternoon: String,
    evening: String,
    meals: String,
    photoQuery: String,
    duration: String
  }],
  mealCostEstimates: {
    budget: String,
    'mid-range': String,
    luxury: String
  },
  whatsIncluded: [String],
  whatsNotIncluded: [String],
  cancellationPolicy: String,
  accessibility: String,
  languages: String,
  meetingPoint: String,
  startTime: String,
  endTime: String,
  
  // Legacy fields for backward compatibility
  details: String,
  accommodationDetails: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  transportDetails: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  mealsDetails: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  activitiesDetails: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  termsAndConditions: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  galleryImageQueries: [String],
  accommodationImageQuery: String,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Static method to generate unique slug
itinerarySchema.statics.generateUniqueSlug = async function(baseSlug) {
  let slug = baseSlug;
  let counter = 1;
  const maxAttempts = 100; // Prevent infinite loops
  
  while (await this.findOne({ slug }) && counter <= maxAttempts) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  // If we've exhausted all attempts, add a timestamp to ensure uniqueness
  if (counter > maxAttempts) {
    slug = `${baseSlug}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  }
  
  return slug;
};

// Pre-save hook to generate unique identifiers
itinerarySchema.pre('save', async function(next) {
  if (!this.slug) {
    // Create a more unique base slug that includes package-specific information
    const packageIdentifier = this.title ? 
      this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : 
      `package-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    
    const baseSlug = `${this.fromLocation.toLowerCase().replace(/\s+/g, '-')}-to-${this.toLocation.toLowerCase().replace(/\s+/g, '-')}-${this.travelers}-travelers-${this.days}-${packageIdentifier}`;
    
    // Generate unique slug
    this.slug = await this.constructor.generateUniqueSlug(baseSlug);
  }
  
  if (!this.itineraryId) {
    this.itineraryId = `IT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  this.updatedAt = new Date();
  next();
});

// Indexes for efficient queries
itinerarySchema.index({ fromLocation: 1, toLocation: 1 });
itinerarySchema.index({ departureDate: 1, returnDate: 1 });
itinerarySchema.index({ createdAt: -1 });
itinerarySchema.index({ views: -1 });
// Note: itineraryId index is automatically created by unique: true

module.exports = mongoose.model('Itinerary', itinerarySchema); 