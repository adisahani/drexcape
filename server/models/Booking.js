const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  packageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Package',
    required: true
  },
  packageSlug: {
    type: String,
    required: true
  },
  packageTitle: {
    type: String,
    required: true
  },
  packagePrice: {
    type: Number,
    required: true
  },
  customerInfo: {
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    travelers: {
      type: Number,
      required: true,
      min: 1
    },
    preferredDate: {
      type: Date,
      required: true
    },
    specialRequests: {
      type: String,
      trim: true
    }
  },
  status: {
    type: String,
    enum: ['pending', 'contacted', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    trim: true
  },
  contactAttempts: [{
    method: {
      type: String,
      enum: ['phone', 'email', 'whatsapp'],
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    notes: String,
    successful: {
      type: Boolean,
      default: false
    }
  }],
  totalPrice: {
    type: Number
  },
  finalPrice: {
    type: Number
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update the updatedAt field on save
bookingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for days since booking
bookingSchema.virtual('daysSinceBooking').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for formatted preferred date
bookingSchema.virtual('formattedPreferredDate').get(function() {
  return this.customerInfo.preferredDate.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Virtual for days until travel
bookingSchema.virtual('daysUntilTravel').get(function() {
  const today = new Date();
  const travelDate = this.customerInfo.preferredDate;
  const diffTime = travelDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Index for better query performance
bookingSchema.index({ status: 1, createdAt: -1 });
bookingSchema.index({ packageId: 1, createdAt: -1 });
bookingSchema.index({ 'customerInfo.phone': 1 });

module.exports = mongoose.model('Booking', bookingSchema);
