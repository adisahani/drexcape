const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  shortDescription: {
    type: String,
    required: true,
    maxlength: 300
  },
  // Multiple images support
  images: [{
    url: {
      type: String,
      required: true
    },
    caption: {
      type: String,
      default: ''
    },
    isFeatured: {
      type: Boolean,
      default: false
    }
  }],
  // Pricing options
  pricing: {
    basePrice: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'INR',
      enum: ['INR', 'USD', 'EUR', 'GBP']
    },
    pricePerPerson: {
      type: Boolean,
      default: true
    },
    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    validUntil: {
      type: Date
    }
  },
  // Travel details
  travelDetails: {
    fromLocation: {
      type: String,
      required: true
    },
    toLocation: {
      type: String,
      required: true
    },
    duration: {
      type: Number,
      required: true // in days
    },
    travelClass: {
      type: String,
      default: 'Economy',
      enum: ['Economy', 'Business', 'First Class', 'Premium Economy']
    },
    maxTravelers: {
      type: Number,
      default: 10
    },
    minTravelers: {
      type: Number,
      default: 1
    }
  },
  // Package features
  features: [{
    type: String,
    trim: true
  }],
  // What's included/excluded
  inclusions: [{
    type: String,
    trim: true
  }],
  exclusions: [{
    type: String,
    trim: true
  }],
  // Itinerary details - can be string or array of day objects
  itinerary: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  // Package category
  category: {
    type: String,
    required: true,
    enum: ['Adventure', 'Beach', 'Cultural', 'Wildlife', 'Honeymoon', 'Family', 'Luxury', 'Budget', 'Weekend Getaway', 'International', 'Domestic']
  },
  // Tags for search
  tags: [{
    type: String,
    trim: true
  }],
  // Status
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  // SEO fields
  metaTitle: {
    type: String,
    maxlength: 60
  },
  metaDescription: {
    type: String,
    maxlength: 160
  },
  // Author/Admin
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  // Booking information
  bookingInfo: {
    requiresAdvanceBooking: {
      type: Boolean,
      default: true
    },
    advanceBookingDays: {
      type: Number,
      default: 7
    },
    cancellationPolicy: {
      type: String,
      default: 'Standard cancellation policy applies'
    },
    refundPolicy: {
      type: String,
      default: 'Refund available as per terms and conditions'
    }
  },
  // Contact information
  contactInfo: {
    phone: String,
    email: String,
    whatsapp: String
  },
  // Statistics
  views: {
    type: Number,
    default: 0
  },
  bookings: {
    type: Number,
    default: 0
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  // Social sharing
  socialShares: {
    facebook: { type: Number, default: 0 },
    twitter: { type: Number, default: 0 },
    linkedin: { type: Number, default: 0 },
    whatsapp: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Create slug from title
packageSchema.pre('save', function(next) {
  if (!this.isModified('title')) return next();
  
  this.slug = this.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  
  next();
});

// Calculate discounted price
packageSchema.methods.getDiscountedPrice = function() {
  if (this.pricing.discountPercentage > 0) {
    return this.pricing.basePrice * (1 - this.pricing.discountPercentage / 100);
  }
  return this.pricing.basePrice;
};

// Check if package is active
packageSchema.methods.isActive = function() {
  return this.status === 'published' && 
         (!this.pricing.validUntil || this.pricing.validUntil > new Date());
};

module.exports = mongoose.model('Package', packageSchema);
