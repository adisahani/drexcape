const mongoose = require('mongoose');

const aiUsageSchema = new mongoose.Schema({
  endpoint: {
    type: String,
    required: true,
    enum: ['generate-itinerary', 'itinerary-details', 'place-image', 'destination-gallery']
  },
  userId: {
    type: String,
    default: 'anonymous'
  },
  requestData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  responseData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  responseStatus: {
    type: String,
    enum: ['success', 'error'],
    required: true
  },
  responseTime: {
    type: Number, // in milliseconds
    required: true
  },
  tokensUsed: {
    type: Number,
    default: 0
  },
  cost: {
    type: Number,
    default: 0
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
aiUsageSchema.index({ createdAt: -1 });
aiUsageSchema.index({ endpoint: 1, createdAt: -1 });

module.exports = mongoose.model('AIUsage', aiUsageSchema); 