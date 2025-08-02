const mongoose = require('mongoose');

const promotionalLeadSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  source: {
    type: String,
    default: 'promotional_popup'
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'converted', 'lost'],
    default: 'new'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  ipAddress: String,
  userAgent: String,
  pageUrl: String,
  utmSource: String,
  utmMedium: String,
  utmCampaign: String,
  notes: String
}, {
  timestamps: true
});

// Index for efficient queries
promotionalLeadSchema.index({ status: 1, submittedAt: -1 });
promotionalLeadSchema.index({ phone: 1 }, { unique: true });

module.exports = mongoose.model('PromotionalLead', promotionalLeadSchema); 