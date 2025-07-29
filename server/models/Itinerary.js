const mongoose = require('mongoose');

const itinerarySchema = new mongoose.Schema({
  // Unique identifier and slug
  slug: {
    type: String,
    unique: true,
    index: true
  },
  itineraryId: {
    type: String,
    unique: true
  },

  // Search parameters
  from: {
    type: String,
    required: true
  },
  to: {
    type: String,
    required: true
  },
  departureDate: {
    type: Date,
    required: true
  },
  returnDate: {
    type: Date,
    required: true
  },
  travellers: {
    type: Number,
    required: true
  },
  travelClass: {
    type: String,
    required: true
  },

  // Generated itineraries
  itineraries: [{
    packageName: String,
    days: Number,
    destinations: [String],
    placesToVisit: [String],
    highlights: [String],
    price: Number,
    details: String
  }],

  // User who generated this (if logged in)
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
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
  lastViewed: {
    type: Date,
    default: Date.now
  },

  // SEO and sharing
  metaTitle: String,
  metaDescription: String,
  featuredImage: String,

  // Status
  isPublished: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Generate unique slug
itinerarySchema.pre('save', async function(next) {
  if (!this.slug) {
    const baseSlug = `${this.from}-to-${this.to}-${this.travellers}-travelers-${this.travelClass}`.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    let slug = baseSlug;
    let counter = 1;
    
    while (await mongoose.model('Itinerary').findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    this.slug = slug;
  }
  
  if (!this.itineraryId) {
    this.itineraryId = `IT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  next();
});

// Index for efficient queries (only add non-unique indexes here)
itinerarySchema.index({ from: 1, to: 1 });
itinerarySchema.index({ createdAt: -1 });
itinerarySchema.index({ views: -1 });

module.exports = mongoose.model('Itinerary', itinerarySchema); 