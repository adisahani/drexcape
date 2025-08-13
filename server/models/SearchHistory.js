const mongoose = require('mongoose');

const searchHistorySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  searchData: {
    from: {
      type: String,
      required: true
    },
    to: {
      type: String,
      required: true
    },
    travellers: {
      type: Number,
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
    startDate: String,
    endDate: String,
    priceRange: {
      min: {
        type: Number,
        default: 0
      },
      max: {
        type: Number,
        default: 50000
      }
    }
  },
  resultsCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
searchHistorySchema.index({ userId: 1, createdAt: -1 });
searchHistorySchema.index({ 'searchData.from': 1, 'searchData.to': 1 });

module.exports = mongoose.model('SearchHistory', searchHistorySchema);
