const mongoose = require('mongoose');

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
  travelClass: {
    type: String,
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
  
  // Header image from Pixabay
  headerImage: {
    type: String,
    default: '/default-travel.jpg'
  },
  
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
  
  while (await this.findOne({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
};

// Pre-save hook to generate unique identifiers
itinerarySchema.pre('save', async function(next) {
  if (!this.slug) {
    const baseSlug = `${this.fromLocation.toLowerCase().replace(/\s+/g, '-')}-to-${this.toLocation.toLowerCase().replace(/\s+/g, '-')}-${this.travelers}-travelers-${this.travelClass.toLowerCase()}-${this.days}`;
    
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

module.exports = mongoose.model('Itinerary', itinerarySchema); 